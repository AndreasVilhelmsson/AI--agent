namespace backend.Domain.Meetings;

public class TranscriptSegment
{
	public int Id { get; set; }

	public int TranscriptId { get; set; }
	public Transcript Transcript { get; set; } = null!;

	public int SegmentIndex { get; set; } // 0..N (stabil ordning)
	public double StartSeconds { get; set; }
	public double EndSeconds { get; set; }

	public string Text { get; set; } = "";
}