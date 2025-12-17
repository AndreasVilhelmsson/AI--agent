namespace backend.Domain.Meetings;

public class MeetingAnalysis
{
	public int Id { get; set; }

	// Stretch: koppla till riktig användare senare (Identity, JWT, etc.)
	public string? UserId { get; set; }

	public string RawNotes { get; set; } = string.Empty;
	public string Summary { get; set; } = string.Empty;

	// Vi lagrar actions som JSON-sträng för enkelhets skull i SQLite
	public string ActionsJson { get; set; } = string.Empty;

	public DateTime CreatedAtUtc { get; set; }
}