using backend.Api.Hubs;
using backend.Application.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace backend.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AnalysisController(AnalysisService svc, IHubContext<MeetingHub> hub) : ControllerBase
{
	public record AnalyzeRequest(string Text);

	[HttpPost("analyze")]
	public async Task<IActionResult> Analyze([FromBody] AnalyzeRequest req)
	{
		// Streama steg i realtid till alla connected clients (MVP: All)
		await hub.Clients.All.SendAsync("stepUpdate", new { step = "ExtractTopics", message = "Detecting key topics..." });
		await Task.Delay(300);
		await hub.Clients.All.SendAsync("stepUpdate", new { step = "Decisions", message = "Identifying decisions..." });
		await Task.Delay(300);
		await hub.Clients.All.SendAsync("stepUpdate", new { step = "Actions", message = "Generating action items..." });

		var (summary, actions) = svc.Analyze(req.Text);

		await hub.Clients.All.SendAsync("resultReady", new { summary, actions });

		return Ok(new { ok = true });
	}
}