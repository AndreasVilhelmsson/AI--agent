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

	private static readonly JsonSerializerOptions JsonOpts = new()
	{
		PropertyNameCaseInsensitive = true
	};

	public AnalysisService(HttpClient httpClient, IConfiguration config)
	{
		_httpClient = httpClient;
		_apiKey = config["OpenAI:ApiKey"]
				  ?? throw new InvalidOperationException("OpenAI API key is missing");
		_model = config["OpenAI:Model"] ?? "gpt-4o-mini";
	}

	// ====== 1) Enkel analys av "notes" (behåll din endpoint /analyze) ======
	public async Task<(string summary, List<string> actions)> AnalyzeAsync(string text, CancellationToken ct = default)
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
            - "summary": 2–4 sentences, concise
            - LANGUAGE RULE: Write the summary and action items in the SAME language as the user's input text.
            - "actions": 3–7 concrete, actionable items.
              - Each starts with a verb (e.g. "Follow up...", "Decide...", "Schedule...").
              - No numbering, just plain text strings.
            - Do NOT include explanations, comments, or markdown.
            - If the notes are empty or meaningless, set a brief summary and return an empty actions array.
            """;

		var payload = new
		{
			model = _model,
			response_format = new { type = "json_object" },
			messages = new[]
			{
				new { role = "system", content = systemPrompt },
				new { role = "user", content = text }
			}
		};

		using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/chat/completions");
		request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
		request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

		using var response = await _httpClient.SendAsync(request, ct);
		var rawBody = await response.Content.ReadAsStringAsync(ct);

		Console.WriteLine("OpenAI status: " + response.StatusCode);
		Console.WriteLine("OpenAI body: " + rawBody);

		if (!response.IsSuccessStatusCode)
		{
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
			using var doc = JsonDocument.Parse(rawBody);

			var content = doc.RootElement
				.GetProperty("choices")[0]
				.GetProperty("message")
				.GetProperty("content")
				.GetString();

			if (string.IsNullOrWhiteSpace(content))
				return ("No summary generated.", new List<string>());

			using var resultDoc = JsonDocument.Parse(content.Trim());
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
			Console.WriteLine("AI parsing error: " + ex);
			return ("AI returned an unexpected format. See logs for details.", new List<string>());
		}
	}

	// ====== 2) Fireflies-style analys av Transcript + segments ======
	public async Task<TranscriptAnalysisResponse> AnalyzeTranscriptAsync(
		string meetingTitle,
		string transcriptText,
		IReadOnlyList<TranscriptSegmentInput> segments,
		CancellationToken ct = default
	)
	{
		var systemPrompt =
			"""
            You are an AI meeting assistant that produces detailed "Fireflies-style" meeting notes.

            Output format (MUST be valid JSON, no markdown, no extra text):
            {
              "title": string,
              "executiveSummary": string,
              "keyPoints": string[],
              "decisions": string[],
              "actionItems": [
                { "task": string, "owner": string|null, "dueDate": string|null, "context": string|null }
              ],
              "risks": string[],
              "openQuestions": string[]
            }

            Rules:
            - Use the SAME language as the transcript.
            - Be specific. Don't hallucinate; only use info from transcript.
            - Extract action items even if owner/dueDate is unknown (use null).
            - If something is unclear, add it to openQuestions.
            """;

		var segmentsText = segments.Count == 0
			? "(no segments available)"
			: string.Join("\n", segments.Select(s =>
				$"[{FormatTime(s.StartSeconds)}–{FormatTime(s.EndSeconds)}] {s.Text}"));

		var userContent =
$"""
Meeting title: {meetingTitle}

Full transcript:
{transcriptText}

Timestamped segments:
{segmentsText}
""";

		var payload = new
		{
			model = _model,
			response_format = new { type = "json_object" },
			messages = new[]
			{
				new { role = "system", content = systemPrompt },
				new { role = "user", content = userContent }
			}
		};

		using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/chat/completions");
		request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
		request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

		using var response = await _httpClient.SendAsync(request, ct);
		var rawBody = await response.Content.ReadAsStringAsync(ct);

		Console.WriteLine("OpenAI status: " + response.StatusCode);
		Console.WriteLine("OpenAI body: " + rawBody);

		if (!response.IsSuccessStatusCode)
			throw new InvalidOperationException(
				$"Transcript analysis failed: {(int)response.StatusCode} {response.ReasonPhrase} - {rawBody}");

		using var doc = JsonDocument.Parse(rawBody);
		var content = doc.RootElement
			.GetProperty("choices")[0]
			.GetProperty("message")
			.GetProperty("content")
			.GetString();

		if (string.IsNullOrWhiteSpace(content))
			throw new InvalidOperationException("OpenAI returned empty content.");

		var result = JsonSerializer.Deserialize<TranscriptAnalysisResponse>(content.Trim(), JsonOpts);
		return result ?? throw new InvalidOperationException("Could not parse transcript analysis JSON.");
	}

	private static string FormatTime(double seconds)
	{
		var ts = TimeSpan.FromSeconds(Math.Max(0, seconds));
		return ts.Hours > 0 ? ts.ToString(@"h\:mm\:ss") : ts.ToString(@"m\:ss");
	}
	public async Task<string> GenerateMeetingTitleAsync(
	string transcriptText,
	CancellationToken ct = default)
	{
		const string fallback = "New meeting";

		if (string.IsNullOrWhiteSpace(transcriptText))
			return fallback;

		// Ta en begränsad bit av transcript för att hålla kostnaden nere
		var snippet = transcriptText.Length > 2000
			? transcriptText[..2000]
			: transcriptText;

		var systemPrompt =
			"""
        You are an AI assistant that generates short meeting titles.

        Output MUST be strict JSON (no markdown, no extra text):
        { "title": string }

        Rules:
        - Use the SAME language as the transcript.
        - Title should be 3–7 words.
        - Keep it specific to the content (no generic "Meeting").
        - If transcript is unclear, use a neutral title like "Meeting summary".
        - Do NOT include quotes around the title value (just plain string).
        """;

		var payload = new
		{
			model = _model,
			response_format = new { type = "json_object" },
			messages = new[]
			{
			new { role = "system", content = systemPrompt },
			new { role = "user", content = snippet }
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

		using var response = await _httpClient.SendAsync(request, ct);
		var rawBody = await response.Content.ReadAsStringAsync(ct);

		if (!response.IsSuccessStatusCode)
			return fallback;

		try
		{
			using var doc = JsonDocument.Parse(rawBody);

			var content = doc.RootElement
				.GetProperty("choices")[0]
				.GetProperty("message")
				.GetProperty("content")
				.GetString();

			if (string.IsNullOrWhiteSpace(content))
				return fallback;

			using var resultDoc = JsonDocument.Parse(content.Trim());
			var root = resultDoc.RootElement;

			var title = root.TryGetProperty("title", out var titleProp)
				? (titleProp.GetString() ?? "").Trim()
				: "";

			// Guards
			if (string.IsNullOrWhiteSpace(title))
				return fallback;

			// Undvik “för generiska” titlar
			if (title.Equals("Meeting", StringComparison.OrdinalIgnoreCase) ||
				title.Equals("New meeting", StringComparison.OrdinalIgnoreCase))
				return fallback;

			// Cap längd så det inte blir en hel mening
			if (title.Length > 80) title = title[..80].Trim();

			return title;
		}
		catch
		{
			return fallback;
		}
	}
}