using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;

namespace backend.Application.Services;

public class AnalysisService
{
	private readonly HttpClient _httpClient;
	private readonly string _apiKey;
	private readonly string _model;

	public AnalysisService(HttpClient httpClient, IConfiguration config)
	{
		_httpClient = httpClient;
		_apiKey = config["OpenAI:ApiKey"]
				  ?? throw new InvalidOperationException("OpenAI API key is missing");
		_model = config["OpenAI:Model"] ?? "gpt-4o-mini";
	}

	public async Task<(string summary, List<string> actions)> AnalyzeAsync(string text)
	{
		var systemPrompt =
			"""
            You are an AI meeting assistant.

            Your job:
            - Read raw meeting notes.
            - Internally think step-by-step through:
              1) main topics
              2) key decisions
              3) concrete next actions
            - BUT do not output your reasoning.
            - Only output the final result as STRICT JSON.

            Output format (MUST be valid JSON, no markdown, no extra text):
            {
              "summary": string,
              "actions": string[]
            }

            Rules:
            - "summary": 2–4 sentences, concise"
            - "LANGUAGE RULE: Write the summary and action items in the SAME language as the user's input text.\n"
            - "actions": 3–7 concrete, actionable items.
              - Each starts with a verb (e.g. "Follow up...", "Decide...", "Schedule...").
              - No numbering, just plain text strings.
            - Do NOT include explanations, comments, or markdown.
            - If the notes are empty or meaningless, set a brief summary and return an empty actions array.
            """;

		var payload = new
		{
			model = _model,
			// 🔒 Tvingar modellen att returnera ren JSON
			response_format = new { type = "json_object" },
			messages = new[]
			{
				new { role = "system", content = systemPrompt },
				new { role = "user", content = text }
			}
		};

		using var request = new HttpRequestMessage(
			HttpMethod.Post,
			"https://api.openai.com/v1/chat/completions");

		request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
		request.Content = new StringContent(
			JsonSerializer.Serialize(payload),
			Encoding.UTF8,
			"application/json");

		var response = await _httpClient.SendAsync(request);

		// 🔍 Logga alltid svar från OpenAI för felsökning
		var rawBody = await response.Content.ReadAsStringAsync();
		Console.WriteLine("OpenAI status: " + response.StatusCode);
		Console.WriteLine("OpenAI body: " + rawBody);

		if (!response.IsSuccessStatusCode)
		{
			// 429 mm hamnar här – bättre fallback än att krascha
			var fallbackSummary =
				$"Auto-summary (fallback): ~{Math.Max(1, text.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length)} words.";
			var fallbackActions = new List<string>
			{
				"Review meeting notes manually.",
				"Check AI configuration (API key / model)."
			};
			return (fallbackSummary, fallbackActions);
		}

		try
		{
			// 🌐 Standard /v1/chat/completions-svar
			using var doc = JsonDocument.Parse(rawBody);

			var content = doc.RootElement
				.GetProperty("choices")[0]
				.GetProperty("message")
				.GetProperty("content")
				.GetString();

			if (string.IsNullOrWhiteSpace(content))
				return ("No summary generated.", new List<string>());

			// Med response_format=json_object ska content redan vara ren JSON
			var json = content.Trim();

			using var resultDoc = JsonDocument.Parse(json);
			var root = resultDoc.RootElement;

			var summary = root.TryGetProperty("summary", out var summaryProp)
				? summaryProp.GetString() ?? string.Empty
				: string.Empty;

			var actions = root.TryGetProperty("actions", out var actionsElement) &&
						  actionsElement.ValueKind == JsonValueKind.Array
				? actionsElement.EnumerateArray()
					.Select(a => a.GetString() ?? string.Empty)
					.Where(s => !string.IsNullOrWhiteSpace(s))
					.ToList()
				: new List<string>();

			return (summary, actions);
		}
		catch (Exception ex)
		{
			// Om JSON-parsningen failar – visa något, krascha inte
			Console.WriteLine("AI parsing error: " + ex);
			return ("AI returned an unexpected format. See logs for details.", new List<string>());
		}
	}
}