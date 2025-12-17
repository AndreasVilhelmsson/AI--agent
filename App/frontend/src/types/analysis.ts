export interface StepUpdate {
  step: string;
  message: string;
}

export interface AnalysisResult {
  summary: string;
  actions: string[];
}

export interface AnalysisListItem {
  id: number;
  summaryPreview: string;
  createdAtUtc: string; // ISO-date string från backend
}
