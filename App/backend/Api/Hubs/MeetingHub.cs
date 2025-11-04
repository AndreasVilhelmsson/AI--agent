using Microsoft.AspNetCore.SignalR;

namespace backend.Api.Hubs;

public class MeetingHub : Hub
{
	// Klienten kan anropa denna (valfritt för senare)
	public async Task Ping(string message)
		=> await Clients.Caller.SendAsync("stepUpdate", new { step = "Ping", message });
}