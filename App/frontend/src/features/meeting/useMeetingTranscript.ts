import { useCallback, useEffect, useState } from "react";
import {
  fetchMeetingTranscript,
  type MeetingTranscriptDto,
} from "./meetingsApi";

export function useMeetingTranscript(meetingId: number | null) {
  const [data, setData] = useState<MeetingTranscriptDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!meetingId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchMeetingTranscript(meetingId);
      setData(res);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError(String(e) || "Failed to load transcript");
      }
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [meetingId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
