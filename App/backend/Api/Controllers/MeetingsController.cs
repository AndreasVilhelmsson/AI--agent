using System.Text.Json;
using backend.Api.Hubs;
using backend.Application.Services;
using backend.Domain.Meetings;
using backend.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace backend.Api.Controllers;

[ApiController]
[Route("api/meetings")]
public class MeetingsController : ControllerBase
{
	private readonly AppDbContext _db;
	private readonly TranscriptionService _transcription;
	private readonly AnalysisService _analysis;
	private readonly IHubContext<MeetingHub> _hub;

	public MeetingsController(
		AppDbContext db,
		TranscriptionService transcription,
		AnalysisService analysis,
		IHubContext<MeetingHub> hub)
	{
		_db = db;
		_transcription = transcription;
		_analysis = analysis;
		_hub = hub;
	}

	// =========================
	// CREATE MEETING
	// =========================

	public record CreateMeetingRequest(string? Title);
	public record CreateMeetingResponse(int Id, string Title, DateTime CreatedAtUtc);

	[HttpPost]
	public async Task<ActionResult<CreateMeetingResponse>> Create([FromBody] CreateMeetingRequest req)
	{
		var meeting = new Meeting
		{
			UserId = "demo-user",
			Title = string.IsNullOrWhiteSpace(req.Title) ? "New meeting" : req.Title.Trim(),
			CreatedAtUtc = DateTime.UtcNow
		};

		_db.Meetings.Add(meeting);
		await _db.SaveChangesAsync();

		return Ok(new CreateMeetingResponse(meeting.Id, meeting.Title, meeting.CreatedAtUtc));
	}

	// =========================
	// UPLOAD AUDIO -> TRANSCRIPT
	// =========================

	public record UploadAudioResponse(
		int MeetingId,
		string Title,
		int TranscriptId,
		string Language,
		double DurationSeconds,
		int SegmentCount,
		string TranscriptPreview
	);
	[HttpPost("{id:int}/audio")]
	[RequestSizeLimit(50_000_000)] // ~50MB
	public async Task<ActionResult<UploadAudioResponse>> UploadAudio(
		[FromRoute] int id,
		IFormFile file,
		CancellationToken ct)
	{
		if (file is null) return BadRequest("file is required.");
		if (file.Length == 0) return BadRequest("file is empty.");

		var meeting = await _db.Meetings
			.Include(m => m.Transcript)
			.FirstOrDefaultAsync(m => m.Id == id, ct);

		if (meeting is null) return NotFound("Meeting not found.");

		// 1) Transkribera
		var result = await _transcription.TranscribeAsync(file, ct);

		// 2) Replace transcript om den redan finns (enkel demo-logik)
		if (meeting.Transcript is not null)
		{
			_db.Transcripts.Remove(meeting.Transcript);
			meeting.Transcript = null;
			await _db.SaveChangesAsync(ct);
		}

		// 3) Spara ny transcript
		var transcript = new Transcript
		{
			MeetingId = meeting.Id,
			Language = result.Language,
			DurationSeconds = result.Duration,
			Text = result.Text,
			CreatedAtUtc = DateTime.UtcNow,
			Segments = result.Segments.Select(s => new TranscriptSegment
			{
				SegmentIndex = s.Index,
				StartSeconds = s.Start,
				EndSeconds = s.End,
				Text = s.Text
			}).ToList()
		};

		_db.Transcripts.Add(transcript);
		await _db.SaveChangesAsync(ct);

		// 4)Auto-title från transcript (AI) - bara om titeln är default
		var isDefaultTitle =
			string.IsNullOrWhiteSpace(meeting.Title) ||
			meeting.Title.Trim().Equals("New meeting", StringComparison.OrdinalIgnoreCase);

		if (isDefaultTitle && !string.IsNullOrWhiteSpace(transcript.Text))
		{
			try
			{
				// klipp text så vi inte skickar massor
				var input = transcript.Text.Length > 2000 ? transcript.Text[..2000] : transcript.Text;

				var generatedTitle = await _analysis.GenerateMeetingTitleAsync(input, ct);

				if (!string.IsNullOrWhiteSpace(generatedTitle))
				{
					meeting.Title = generatedTitle.Trim();
					await _db.SaveChangesAsync(ct);
				}
			}
			catch (Exception ex)
			{
				// fail-silent: allt annat ska fortfarande funka
				Console.WriteLine("Auto-title generation failed: " + ex);
			}
		}

		// 5) Svara (inkl Title så UI kan uppdatera direkt)
		return Ok(new UploadAudioResponse(
			MeetingId: meeting.Id,
			Title: meeting.Title,
			TranscriptId: transcript.Id,
			Language: transcript.Language,
			DurationSeconds: transcript.DurationSeconds,
			SegmentCount: transcript.Segments.Count,
			TranscriptPreview: transcript.Text.Length > 220 ? transcript.Text[..220] + "…" : transcript.Text
		));
	}

	// =========================
	// SIMPLE ANALYZE (SignalR MVP)
	// POST /api/meetings/{id}/analyze
	// =========================

	[HttpPost("{id:int}/analyze")]
	public async Task<IActionResult> Analyze([FromRoute] int id, CancellationToken ct)
	{
		var meeting = await _db.Meetings
			.Include(m => m.Transcript)
			.FirstOrDefaultAsync(m => m.Id == id, ct);

		if (meeting is null) return NotFound("Meeting not found.");
		if (meeting.Transcript is null) return BadRequest("No transcript uploaded for this meeting.");

		var text = meeting.Transcript.Text;
		if (string.IsNullOrWhiteSpace(text)) return BadRequest("Transcript is empty.");

		// SignalR steps
		await _hub.Clients.All.SendAsync("stepUpdate",
			new { step = "Transcript", message = "Loaded transcript from database..." }, ct);
		await Task.Delay(150, ct);

		await _hub.Clients.All.SendAsync("stepUpdate",
			new { step = "ExtractTopics", message = "Detecting key topics..." }, ct);
		await Task.Delay(200, ct);

		await _hub.Clients.All.SendAsync("stepUpdate",
			new { step = "Decisions", message = "Identifying decisions..." }, ct);
		await Task.Delay(200, ct);

		await _hub.Clients.All.SendAsync("stepUpdate",
			new { step = "Actions", message = "Generating action items..." }, ct);

		var (summary, actions) = await _analysis.AnalyzeAsync(text);

		var entity = new MeetingAnalysis
		{
			MeetingId = meeting.Id,
			UserId = "demo-user",
			RawNotes = text,
			Summary = summary,
			ActionsJson = JsonSerializer.Serialize(actions),
			CreatedAtUtc = DateTime.UtcNow
		};

		_db.MeetingAnalyses.Add(entity);
		await _db.SaveChangesAsync(ct);

		await _hub.Clients.All.SendAsync("resultReady", new { summary, actions }, ct);

		return Ok(new { id = entity.Id, summary, actions });
	}

	// =========================
	// GET TRANSCRIPT
	// GET /api/meetings/{id}/transcript
	// =========================

	public record TranscriptSegmentDto(
		int SegmentIndex,
		double StartSeconds,
		double EndSeconds,
		string Text
	);

	public record GetTranscriptResponse(
		int MeetingId,
		int TranscriptId,
		string Language,
		double DurationSeconds,
		int SegmentCount,
		string Text,
		List<TranscriptSegmentDto> Segments
	);

	[HttpGet("{id:int}/transcript")]
	public async Task<ActionResult<GetTranscriptResponse>> GetTranscript([FromRoute] int id, CancellationToken ct)
	{
		var meeting = await _db.Meetings
			.Include(m => m.Transcript)
				.ThenInclude(t => t!.Segments)
			.FirstOrDefaultAsync(m => m.Id == id, ct);

		if (meeting is null) return NotFound("Meeting not found.");
		if (meeting.Transcript is null) return NotFound("No transcript for this meeting.");

		var t = meeting.Transcript;

		return Ok(new GetTranscriptResponse(
			MeetingId: meeting.Id,
			TranscriptId: t.Id,
			Language: t.Language,
			DurationSeconds: t.DurationSeconds,
			SegmentCount: t.Segments.Count,
			Text: t.Text,
			Segments: t.Segments
				.OrderBy(s => s.SegmentIndex)
				.Select(s => new TranscriptSegmentDto(
					s.SegmentIndex, s.StartSeconds, s.EndSeconds, s.Text
				))
				.ToList()
		));
	}

	// =========================
	// DETAILED ANALYSIS (Fireflies style)
	// POST /api/meetings/{id}/analyze-transcript
	// =========================

	[HttpPost("{id:int}/analyze-transcript")]
	public async Task<ActionResult> AnalyzeTranscript([FromRoute] int id, CancellationToken ct)
	{
		var meeting = await _db.Meetings
			.Include(m => m.Transcript)
				.ThenInclude(t => t!.Segments)
			.FirstOrDefaultAsync(m => m.Id == id, ct);

		if (meeting is null) return NotFound("Meeting not found.");
		if (meeting.Transcript is null) return BadRequest("No transcript for this meeting yet.");

		var t = meeting.Transcript;

		var segments = t.Segments
			.OrderBy(s => s.SegmentIndex)
			.Select(s => new TranscriptSegmentInput(
				SegmentIndex: s.SegmentIndex,
				StartSeconds: s.StartSeconds,
				EndSeconds: s.EndSeconds,
				Text: s.Text
			))
			.ToList();

		var detailed = await _analysis.AnalyzeTranscriptAsync(
			meetingTitle: meeting.Title,
			transcriptText: t.Text,
			segments: segments,
			ct: ct
		);

		// store as MeetingAnalyses for History (simple string mapping)
		var actionsAsStrings = detailed.ActionItems
			.Select(a => a.Owner is null ? a.Task : $"{a.Task} (Owner: {a.Owner})")
			.ToList();

		var analysis = new MeetingAnalysis
		{
			MeetingId = meeting.Id,
			UserId = meeting.UserId,
			RawNotes = t.Text,
			Summary = detailed.ExecutiveSummary,
			ActionsJson = JsonSerializer.Serialize(actionsAsStrings),
			CreatedAtUtc = DateTime.UtcNow
		};

		_db.MeetingAnalyses.Add(analysis);
		await _db.SaveChangesAsync(ct);

		return Ok(new
		{
			analysisId = analysis.Id,
			meetingId = meeting.Id,
			detailed
		});
	}

	// =========================
	// HISTORY: LIST MEETINGS
	// GET /api/meetings?take=25
	// =========================

	public record MeetingListItemDto(
		int Id,
		string Title,
		DateTime CreatedAtUtc,
		bool HasTranscript,
		DateTime? LastAnalysisAtUtc
	);

	[HttpGet]
	public async Task<ActionResult<List<MeetingListItemDto>>> ListMeetings(
		[FromQuery] int take = 25,
		CancellationToken ct = default)
	{
		var meetings = await _db.Meetings
			.AsNoTracking()
			.OrderByDescending(m => m.CreatedAtUtc)
			.Take(Math.Clamp(take, 1, 200))
			.Select(m => new MeetingListItemDto(
				m.Id,
				m.Title,
				m.CreatedAtUtc,
				m.Transcript != null,
				_db.MeetingAnalyses
					.Where(a => a.MeetingId == m.Id)
					.OrderByDescending(a => a.CreatedAtUtc)
					.Select(a => (DateTime?)a.CreatedAtUtc)
					.FirstOrDefault()
			))
			.ToListAsync(ct);

		return Ok(meetings);
	}

	// =========================
	// HISTORY: MEETING DETAILS
	// GET /api/meetings/{id}
	// =========================

	public record MeetingAnalysisSummaryDto(
		int Id,
		string Summary,
		DateTime CreatedAtUtc
	);

	public record MeetingDetailsDto(
		int Id,
		string Title,
		DateTime CreatedAtUtc,
		GetTranscriptResponse? Transcript,
		List<MeetingAnalysisSummaryDto> Analyses
	);

	[HttpGet("{id:int}")]
	public async Task<ActionResult<MeetingDetailsDto>> GetMeetingDetails(
		[FromRoute] int id,
		CancellationToken ct)
	{
		var meeting = await _db.Meetings
			.AsNoTracking()
			.Include(m => m.Transcript)
				.ThenInclude(t => t!.Segments)
			.FirstOrDefaultAsync(m => m.Id == id, ct);

		if (meeting is null) return NotFound("Meeting not found.");

		GetTranscriptResponse? transcriptDto = null;

		if (meeting.Transcript is not null)
		{
			var t = meeting.Transcript;

			transcriptDto = new GetTranscriptResponse(
				MeetingId: meeting.Id,
				TranscriptId: t.Id,
				Language: t.Language,
				DurationSeconds: t.DurationSeconds,
				SegmentCount: t.Segments.Count,
				Text: t.Text,
				Segments: t.Segments
					.OrderBy(s => s.SegmentIndex)
					.Select(s => new TranscriptSegmentDto(
						s.SegmentIndex, s.StartSeconds, s.EndSeconds, s.Text
					))
					.ToList()
			);
		}

		var analyses = await _db.MeetingAnalyses
			.AsNoTracking()
			.Where(a => a.MeetingId == meeting.Id)
			.OrderByDescending(a => a.CreatedAtUtc)
			.Take(25)
			.Select(a => new MeetingAnalysisSummaryDto(
				a.Id,
				a.Summary,
				a.CreatedAtUtc
			))
			.ToListAsync(ct);

		return Ok(new MeetingDetailsDto(
			Id: meeting.Id,
			Title: meeting.Title,
			CreatedAtUtc: meeting.CreatedAtUtc,
			Transcript: transcriptDto,
			Analyses: analyses
		));
	}
}