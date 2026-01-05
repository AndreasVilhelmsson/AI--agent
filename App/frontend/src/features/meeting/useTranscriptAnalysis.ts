import { useCallback, useState } from "react";
import {
  analyzeMeetingTranscript,
  type AnalyzeTranscriptResponse,
} from "./meetingsApi";
import { getErrorMessage } from "../../shared/errors/getErrorMessage";

type Status = "idle" | "loading" | "success" | "error";

export function useTranscriptAnalysis(meetingId: number | null) {
  const [status, setStatus] = useState<Status>("idle");
  const [data, setData] = useState<AnalyzeTranscriptResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    if (!meetingId) return;
    setStatus("loading");
    setError(null);
    try {
      const res = await analyzeMeetingTranscript(meetingId);
      setData(res);
      setStatus("success");
      return res;
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Failed to analyze transcript"));
      setStatus("error");
      return null;
    }
  }, [meetingId]);

  return {
    status,
    loading: status === "loading",
    data,
    error,
    run,
    reset: () => {
      setStatus("idle");
      setData(null);
      setError(null);
    },
  };
}
