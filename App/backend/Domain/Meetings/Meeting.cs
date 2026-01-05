namespace backend.Domain.Meetings;

public class Meeting
{
	public int Id { get; set; }

	public string UserId { get; set; } = "demo-user"; // TODO: riktig auth senare
	public string Title { get; set; } = "Untitled meeting";

	public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

	public Transcript? Transcript { get; set; }
}