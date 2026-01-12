// features/meeting/api.ts
import type { AnalysisListItem } from "../../types/analysis";
import { http } from "../../api/http";

export type AnalyzeResponse = {
  id: number;
  summary: string;
  actions: string[];
};

export interface MeetingAnalysis {
  id: number;
  summary: string;
  actions: string[];
  rawNotes: string;
  createdAtUtc: string;
}

type MeetingAnalysisWire = {
  id: number;
  summary: string;
  actions?: string[];
  Actions?: string[];
  rawNotes?: string;
  RawNotes?: string;
  createdAtUtc?: string;
  CreatedAtUtc?: string;
};

function normalizeMeetingAnalysis(w: MeetingAnalysisWire): MeetingAnalysis {
  return {
    id: w.id,
    summary: w.summary ?? "",
    actions: w.actions ?? w.Actions ?? [],
    rawNotes: (w.rawNotes ?? w.RawNotes ?? "") as string,
    createdAtUtc: (w.createdAtUtc ?? w.CreatedAtUtc ?? "") as string,
  };
}

export async function fetchAnalysisById(id: number): Promise<MeetingAnalysis> {
  const res = await http.get<MeetingAnalysisWire>(`/api/analysis/${id}`);
  return normalizeMeetingAnalysis(res.data);
}

export async function analyzeNotes(text: string): Promise<AnalyzeResponse> {
  const res = await http.post<MeetingAnalysisWire>("/api/Analysis/analyze", {
    text,
  });
  const normalized = normalizeMeetingAnalysis(res.data);

  return {
    id: normalized.id,
    summary: normalized.summary,
    actions: normalized.actions,
  };
}

export async function fetchAnalysisHistory(
  take: number = 5
): Promise<AnalysisListItem[]> {
  const res = await http.get<AnalysisListItem[]>("/api/analysis", {
    params: { take },
  });
  return res.data;
}
