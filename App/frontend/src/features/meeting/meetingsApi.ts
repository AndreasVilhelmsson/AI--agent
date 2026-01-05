import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5168/api",
});

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

export async function createMeeting(title: string) {
  const res = await api.post<CreateMeetingResponse>("/meetings", { title });
  return res.data;
}

export async function uploadMeetingAudio(meetingId: number, file: File) {
  const form = new FormData();
  form.append("file", file);

  const res = await api.post<UploadAudioResponse>(
    `/meetings/${meetingId}/audio`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );

  return res.data;
}

export async function fetchMeetingTranscript(meetingId: number) {
  try {
    const res = await api.get<MeetingTranscriptDto>(
      `/meetings/${meetingId}/transcript`
    );
    return res.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      return null; // <-- ingen transcript ännu
    }
    throw err;
  }
}

export async function analyzeTranscript(meetingId: number) {
  const res = await api.post(`/meetings/${meetingId}/analyze-transcript`);
  return res.data;
}

export async function analyzeMeetingTranscript(meetingId: number) {
  const res = await api.post<AnalyzeTranscriptResponse>(
    `/meetings/${meetingId}/analyze-transcript`
  );
  return res.data;
}
