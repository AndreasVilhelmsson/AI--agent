// features/meeting/meetingsApi.ts
import axios from "axios";
import { http } from "../../api/http";

export type CreateMeetingResponse = {
  id: number;
  title: string;
  createdAtUtc: string;
};

export type UploadAudioResponse = {
  meetingId: number;
  transcriptId: number;
  language: string;
  durationSeconds: number;
  segmentCount: number;
  transcriptPreview: string;
};

export type TranscriptSegmentDto = {
  segmentIndex: number;
  startSeconds: number;
  endSeconds: number;
  text: string;
};

export type MeetingTranscriptDto = {
  meetingId: number;
  transcriptId: number;
  language: string;
  durationSeconds: number;
  segmentCount: number;
  text: string;
  segments: TranscriptSegmentDto[];
};

export type ActionItemDto = {
  task: string;
  owner: string | null;
  dueDate: string | null;
  context: string | null;
};

export type TranscriptAnalysisDto = {
  title: string;
  executiveSummary: string;
  keyPoints: string[];
  decisions: string[];
  actionItems: ActionItemDto[];
  risks: string[];
  openQuestions: string[];
};

export type AnalyzeTranscriptResponse = {
  analysisId: number;
  meetingId: number;
  detailed: TranscriptAnalysisDto;
};

export type MeetingListItemDto = {
  id: number;
  title: string;
  createdAtUtc: string;
  hasTranscript: boolean;
  lastAnalysisAtUtc: string | null;
};

export type MeetingAnalysisSummaryDto = {
  id: number;
  summary: string;
  createdAtUtc: string;
};

export type MeetingDetailsDto = {
  id: number;
  title: string;
  createdAtUtc: string;
  transcript: MeetingTranscriptDto | null;
  analyses: MeetingAnalysisSummaryDto[];
};

export async function createMeeting(title: string) {
  const res = await http.post<CreateMeetingResponse>("/api/meetings", { title });
  return res.data;
}

export async function uploadMeetingAudio(meetingId: number, file: File) {
  const form = new FormData();
  form.append("file", file);

  const res = await http.post<UploadAudioResponse>(
    `/api/meetings/${meetingId}/audio`,
    form,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );

  return res.data;
}

export async function fetchMeetingTranscript(meetingId: number) {
  try {
    const res = await http.get<MeetingTranscriptDto>(
      `/api/meetings/${meetingId}/transcript`
    );
    return res.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      return null;
    }
    throw err;
  }
}

// ✅ En funktion: Generate detailed analysis
export async function analyzeMeetingTranscript(meetingId: number) {
  const res = await http.post<AnalyzeTranscriptResponse>(
    `/api/meetings/${meetingId}/analyze-transcript`
  );
  return res.data;
}

export async function fetchMeetings(take = 25) {
  const res = await http.get<MeetingListItemDto[]>(`/api/meetings`, {
    params: { take },
  });
  return res.data;
}

export async function fetchMeetingDetails(meetingId: number) {
  const res = await http.get<MeetingDetailsDto>(`/api/meetings/${meetingId}`);
  return res.data;
}
