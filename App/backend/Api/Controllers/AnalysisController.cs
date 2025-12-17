using System.Text.Json;
using backend.Api.Hubs;
using backend.Application.Services;
using backend.Domain.Meetings;
using backend.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace backend.Api.Controllers;

public record AnalyzeRequest(string Text);

// Ny DTO för listvy
public record AnalysisListItemDto(
	int Id,
	string SummaryPreview,
	DateTime CreatedAtUtc
);
[ApiController]
[Route("api/[controller]")]
public class AnalysisController(
	AnalysisService svc,
	IHubContext<MeetingHub> hub,
	AppDbContext db
) : ControllerBase
{
	public record AnalyzeRequest(string Text);

	[HttpPost("analyze")]
	public async Task<IActionResult> Analyze([FromBody] AnalyzeRequest req)
	{
		if (string.IsNullOrWhiteSpace(req.Text))
		{
			return BadRequest("Text is required.");
		}

		// 1) Streama steg via SignalR
		await hub.Clients.All.SendAsync("stepUpdate",
			new { step = "ExtractTopics", message = "Detecting key topics..." });
		await Task.Delay(300);

		await hub.Clients.All.SendAsync("stepUpdate",
			new { step = "Decisions", message = "Identifying decisions..." });
		await Task.Delay(300);

		await hub.Clients.All.SendAsync("stepUpdate",
			new { step = "Actions", message = "Generating action items..." });

		// 2) Kör AI-analys
		var (summary, actions) = await svc.AnalyzeAsync(req.Text);

		// 3) Spara i databasen
		var entity = new MeetingAnalysis
		{
			// TODO: ersätt "demo-user" med riktig UserId när auth finns
			UserId = "demo-user",
			RawNotes = req.Text,
			Summary = summary,
			ActionsJson = JsonSerializer.Serialize(actions),
			CreatedAtUtc = DateTime.UtcNow
		};

		db.MeetingAnalyses.Add(entity);
		await db.SaveChangesAsync();

		// 4) Skicka resultatet till alla anslutna klienter via SignalR
		await hub.Clients.All.SendAsync("resultReady", new { summary, actions });

		// 5) Returnera även via HTTP-svaret (bra för Swagger / andra klienter)
		return Ok(new
		{
			id = entity.Id,
			summary,
			actions
		});
	}

	// Stretch / användbar för demo: hämta senaste analysen
	[HttpGet("latest")]
	public async Task<IActionResult> GetLatest()
	{
		var latest = await db.MeetingAnalyses
			.OrderByDescending(m => m.CreatedAtUtc)
			.FirstOrDefaultAsync();

		if (latest is null)
		{
			return NotFound();
		}

		var actions = JsonSerializer.Deserialize<List<string>>(latest.ActionsJson)
					  ?? new List<string>();

		return Ok(new
		{
			latest.Id,
			latest.UserId,
			latest.Summary,
			Actions = actions,
			latest.RawNotes,
			latest.CreatedAtUtc
		});
	}
	[HttpGet]
	public async Task<IActionResult> GetMany([FromQuery] int take = 10)
	{
		var items = await db.MeetingAnalyses
			.OrderByDescending(m => m.CreatedAtUtc)
			.Take(take)
			.Select(m => new AnalysisListItemDto(
				m.Id,
				m.Summary.Length > 140 ? m.Summary.Substring(0, 140) + "…" : m.Summary,
				m.CreatedAtUtc
			))
			.ToListAsync();

		return Ok(items);
	}
	[HttpGet("{id:int}")]
	public async Task<IActionResult> GetById(int id)
	{
		var item = await db.MeetingAnalyses.FindAsync(id);
		if (item is null) return NotFound();

		return Ok(new
		{
			item.Id,
			item.Summary,
			Actions = JsonSerializer.Deserialize<List<string>>(item.ActionsJson),
			item.RawNotes,
			item.CreatedAtUtc
		});
	}
}
