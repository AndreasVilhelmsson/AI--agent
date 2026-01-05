import React, { useState } from "react";
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
  const [uiError, setUiError] = useState<string | null>(null);

  const transcript = useMeetingTranscript(meetingId);

  const onUpload = async () => {
    if (!meetingId || !file) return;
    setIsUploading(true);
    setUiError(null);

    try {
      await uploadMeetingAudio(meetingId, file);
      await transcript.refresh();

      // valfritt: skicka transcript-text till din befintliga startAnalysis()
      const text = transcript.data?.text;
      if (text && onAnalyzeText) onAnalyzeText(text);
    } catch (error: unknown) {
      setUiError(getErrorMessage(error, "Upload failed"));
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
          onClick={transcript.refresh}
          disabled={!meetingId || transcript.loading || disabled}
        >
          Refresh
        </button>
      </header>

      <p className="transcript-card__muted">MeetingId: {meetingId ?? "—"}</p>

      <div className="transcript-card__row">
        <input
          type="file"
          accept="audio/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          disabled={disabled || isUploading}
        />
        <button
          type="button"
          className="transcript-card__btn primary"
          onClick={onUpload}
          disabled={!meetingId || !file || disabled || isUploading}
        >
          {isUploading ? "Uploading…" : "Upload audio"}
        </button>
      </div>

      {uiError && <p className="transcript-card__error">{uiError}</p>}
      {transcript.error && (
        <p className="transcript-card__error">{transcript.error}</p>
      )}
      {transcript.loading && <p className="transcript-card__muted">Loading…</p>}

      {!transcript.loading && !transcript.error && transcript.data && (
        <>
          <div className="transcript-card__meta">
            <span>Lang: {transcript.data.language}</span>
            <span>Seg: {transcript.data.segmentCount}</span>
            <span>{Math.round(transcript.data.durationSeconds)}s</span>
          </div>

          <pre className="transcript-card__text">{transcript.data.text}</pre>
        </>
      )}

      {!transcript.loading && !transcript.error && !transcript.data && (
        <p className="transcript-card__muted">No transcript yet.</p>
      )}
    </section>
  );
};
