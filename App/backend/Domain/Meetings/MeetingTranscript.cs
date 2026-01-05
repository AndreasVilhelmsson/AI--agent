namespace backend.Domain.Meetings;

public class MeetingTranscript
{
	public int Id { get; set; }

	public int MeetingId { get; set; }
	public Meeting Meeting { get; set; } = null!;

	public string Text { get; set; } = "";

	// valfritt (kan vara "unknown" om json-läget inte ger språk)
	public string Language { get; set; } = "unknown";
	public double DurationSeconds { get; set; }

	public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}