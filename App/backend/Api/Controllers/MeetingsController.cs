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

	public record UploadAudioResponse(
		int MeetingId,
		int TranscriptId,
		string Language,
		double DurationSeconds,
		int SegmentCount,
		string TranscriptPreview
	);

	// multipart/form-data: file=<audio>
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

		if (meeting is null) return NotFound();

		// Transkribera
		var result = await _transcription.TranscribeAsync(file, ct);

		// Replace transcript om den redan finns (enkel demo-logik)
		if (meeting.Transcript is not null)
		{
			_db.Transcripts.Remove(meeting.Transcript);
			meeting.Transcript = null;
			await _db.SaveChangesAsync(ct);
		}

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

		return Ok(new UploadAudioResponse(
			MeetingId: meeting.Id,
			TranscriptId: transcript.Id,
			Language: transcript.Language,
			DurationSeconds: transcript.DurationSeconds,
			SegmentCount: transcript.Segments.Count,
			TranscriptPreview: transcript.Text.Length > 220 ? transcript.Text[..220] + "…" : transcript.Text
		));
	}

	// ✅ Steg 3: analysera transcript
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

		// SignalR steps (broadcast MVP)
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

		// AI
		var (summary, actions) = await _analysis.AnalyzeAsync(text);

		// Save analysis linked to meeting
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

		// Push result to SignalR listeners
		await _hub.Clients.All.SendAsync("resultReady", new { summary, actions }, ct);

		return Ok(new { id = entity.Id, summary, actions });
	}
	public record GetTranscriptResponse(
		int MeetingId,
		int TranscriptId,
		string Language,
		double DurationSeconds,
		int SegmentCount,
		string Text,
		List<TranscriptSegmentDto> Segments
	);

	public record TranscriptSegmentDto(
		int SegmentIndex,
		double StartSeconds,
		double EndSeconds,
		string Text
	);

	[HttpGet("{id:int}/transcript")]
	public async Task<ActionResult<GetTranscriptResponse>> GetTranscript([FromRoute] int id, CancellationToken ct)
	{
		var meeting = await _db.Meetings
			.Include(m => m.Transcript)
				.ThenInclude(t => t.Segments)
			.FirstOrDefaultAsync(m => m.Id == id, ct);

		if (meeting is null) return NotFound();
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

	[HttpPost("{id:int}/analyze-transcript")]
	public async Task<ActionResult> AnalyzeTranscript([FromRoute] int id, CancellationToken ct)
	{
		var meeting = await _db.Meetings
			.Include(m => m.Transcript)
				.ThenInclude(t => t.Segments)
			.FirstOrDefaultAsync(m => m.Id == id, ct);

		if (meeting is null) return NotFound("Meeting not found.");
		if (meeting.Transcript is null) return BadRequest("No transcript for this meeting yet.");

		var t = meeting.Transcript;

		// Viktigt: om du kör response_format=json så har du inga segments -> då skickar vi tom lista
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

		// Spara till MeetingAnalyses så History kan visa den (enkel mappning till strings)
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
}