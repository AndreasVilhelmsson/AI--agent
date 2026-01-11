import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { uploadMeetingAudio } from "../../features/meeting/meetingsApi";
import { useMeetingTranscript } from "../../features/meeting/useMeetingTranscript";
import { getErrorMessage } from "../../shared/errors/getErrorMessage";
import "./TranscriptCard.scss";

type Props = {
  meetingId: number | null;
  disabled?: boolean;
  onAnalyzeText?: (text: string) => void;
};

export const TranscriptCard: React.FC<Props> = ({
  meetingId,
  disabled = false,
  onAnalyzeText,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const transcript = useMeetingTranscript(meetingId);

  const isBusy = useMemo(
    () => disabled || isUploading || transcript.loading,
    [disabled, isUploading, transcript.loading]
  );

  const onRefresh = async () => {
    if (!meetingId) return;
    try {
      await transcript.refresh();
      toast.success("Transcript refreshed");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to refresh transcript"));
    }
  };

  const onUpload = async () => {
    if (!meetingId || !file) return;

    setIsUploading(true);

    try {
      await uploadMeetingAudio(meetingId, file);
      toast.success("Audio uploaded");

      await transcript.refresh();
      toast.success("Transcription ready");

      // valfritt: auto-analys efter upload (använder din befintliga text-analys)
      const text = transcript.data?.text;
      if (text && onAnalyzeText) {
        onAnalyzeText(text);
        toast.success("Analysis started");
      }

      // UX: rensa vald fil efter lyckad upload
      setFile(null);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Upload failed"));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section className="transcript-card">
      <header className="transcript-card__header">
        <h3 className="transcript-card__title">Transcript</h3>

        <button
          type="button"
          className="transcript-card__btn"
          onClick={onRefresh}
          disabled={!meetingId || isBusy}
        >
          {transcript.loading ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      <p className="transcript-card__muted">MeetingId: {meetingId ?? "—"}</p>

      <div className="transcript-card__row">
        <input
          type="file"
          accept="audio/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          disabled={!meetingId || isBusy}
        />

        <button
          type="button"
          className="transcript-card__btn primary"
          onClick={onUpload}
          disabled={!meetingId || !file || isBusy}
        >
          {isUploading ? "Uploading…" : "Upload audio"}
        </button>
      </div>

      {/* Hook-fel */}
      {transcript.error && (
        <p className="transcript-card__error">{transcript.error}</p>
      )}

      {/* Content */}
      {!meetingId && (
        <p className="transcript-card__muted">Create/select a meeting first.</p>
      )}

      {meetingId && transcript.loading && (
        <p className="transcript-card__muted">Loading…</p>
      )}

      {meetingId &&
        !transcript.loading &&
        !transcript.error &&
        transcript.data && (
          <>
            <div className="transcript-card__meta">
              <span>Lang: {transcript.data.language}</span>
              <span>Seg: {transcript.data.segmentCount}</span>
              <span>{Math.round(transcript.data.durationSeconds)}s</span>
            </div>

            <pre className="transcript-card__text">{transcript.data.text}</pre>
          </>
        )}

      {meetingId &&
        !transcript.loading &&
        !transcript.error &&
        !transcript.data && (
          <p className="transcript-card__muted">No transcript yet.</p>
        )}
    </section>
  );
};
