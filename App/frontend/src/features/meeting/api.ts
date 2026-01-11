// features/meeting/api.ts
import axios from "axios";
import type { AnalysisListItem } from "../../types/analysis";

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

// "Wire"-typen (vad backend kan råka skicka)
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

export const api = axios.create({
  baseURL: "http://localhost:5168/api",
  headers: {
    "Content-Type": "application/json",
  },
});

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
  const res = await api.get<MeetingAnalysisWire>(`/analysis/${id}`);
  return normalizeMeetingAnalysis(res.data);
}

export async function analyzeNotes(text: string): Promise<AnalyzeResponse> {
  const res = await api.post<MeetingAnalysisWire>("/analysis/analyze", {
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
  const res = await api.get<AnalysisListItem[]>("/analysis", {
    params: { take },
  });
  return res.data;
}
