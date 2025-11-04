namespace backend.Application.Services;

public class AnalysisService
{
	public (string summary, List<string> actions) Analyze(string text)
	{
		// Minimal MVP: ersätt med LLM senare
		var words = Math.Max(1, Math.Min(50, text.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length));
		var summary = $"Auto-summary (MVP). ~{words} words processed.";
		var actions = new List<string>
		{
			"Follow up on topic A",
			"Decide next steps for B",
			"Schedule next meeting"
		};
		return (summary, actions);
	}
}