using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.Configuration;

namespace backend.Application.Services;

public class TranscriptionService
{
	private readonly HttpClient _http;
	private readonly string _apiKey;

	public TranscriptionService(HttpClient http, IConfiguration config)
	{
		_http = http;
		_apiKey = config["OpenAI:ApiKey"] ?? throw new InvalidOperationException("Missing OpenAI:ApiKey");
	}

	public async Task<TranscriptionResult> TranscribeAsync(IFormFile audioFile, CancellationToken ct = default)
	{
		if (audioFile.Length == 0) throw new ArgumentException("Empty file.");

		using var content = new MultipartFormDataContent();

		// 1) model
		content.Add(new StringContent("gpt-4o-mini-transcribe"), "model");

		// 2) response_format => segments
		content.Add(new StringContent("json"), "response_format");

		// 3) file
		await using var fileStream = audioFile.OpenReadStream();
		var fileContent = new StreamContent(fileStream);
		fileContent.Headers.ContentType = new MediaTypeHeaderValue(audioFile.ContentType ?? "application/octet-stream");
		content.Add(fileContent, "file", audioFile.FileName);

		using var req = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/audio/transcriptions");
		req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
		req.Content = content;

		using var resp = await _http.SendAsync(req, ct);
		var json = await resp.Content.ReadAsStringAsync(ct);

		if (!resp.IsSuccessStatusCode)
		{
			// bubbla upp feltexten (för debug)
			throw new InvalidOperationException($"Transcription failed: {(int)resp.StatusCode} {resp.ReasonPhrase} - {json}");
		}

		var parsed = JsonSerializer.Deserialize<JsonTranscriptionResponse>(json,
		new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
		?? throw new InvalidOperationException("Could not parse transcription response.");

		return new TranscriptionResult(
			Text: parsed.Text ?? "",
			Language: parsed.Language ?? "unknown",
			Duration: parsed.Duration ?? 0,
			Segments: new List<TranscriptionSegment>() // inga segments i json-läget
		);
	}

	// ----- DTOs -----
	private sealed class JsonTranscriptionResponse
	{
		public string? Text { get; set; }
		public string? Language { get; set; }
		public double? Duration { get; set; }
	}

	private sealed class VerboseSegment
	{
		public double? Start { get; set; }
		public double? End { get; set; }
		public string? Text { get; set; }
	}
}

public record TranscriptionResult(
	string Text,
	string Language,
	double Duration,
	List<TranscriptionSegment> Segments
);

public record TranscriptionSegment(
	int Index,
	double Start,
	double End,
	string Text
);