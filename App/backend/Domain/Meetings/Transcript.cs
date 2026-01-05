namespace backend.Domain.Meetings;

public class Transcript
{
	public int Id { get; set; }

	public int MeetingId { get; set; }
	public Meeting Meeting { get; set; } = null!;

	public string Language { get; set; } = "unknown";
	public double DurationSeconds { get; set; }

	public string Text { get; set; } = "";

	public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

	public List<TranscriptSegment> Segments { get; set; } = new();
}