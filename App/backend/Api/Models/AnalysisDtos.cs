namespace backend.Api.Models;

public class AnalysisRequest
{
	public string Text { get; set; } = string.Empty;
}

public class AnalysisResponse
{
	public string Summary { get; set; } = string.Empty;
	public List<string> Actions { get; set; } = new();
}