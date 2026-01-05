namespace backend.Application.Services;

// Input till analys (mer stabilt än tuples)
public record TranscriptSegmentInput(
	int SegmentIndex,
	double StartSeconds,
	double EndSeconds,
	string Text
);

// Output från "Fireflies-style" analys
public record TranscriptAnalysisResponse(
	string Title,
	string ExecutiveSummary,
	List<string> KeyPoints,
	List<string> Decisions,
	List<ActionItem> ActionItems,
	List<string> Risks,
	List<string> OpenQuestions
);

public record ActionItem(
	string Task,
	string? Owner,
	string? DueDate,
	string? Context
);