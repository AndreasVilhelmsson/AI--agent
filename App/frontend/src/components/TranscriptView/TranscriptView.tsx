import React from "react";
import type { MeetingTranscriptDto } from "../../features/meeting/meetingsApi";
import "./TranscriptView.scss";

type Props = {
  transcript: MeetingTranscriptDto | null;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
};

export const TranscriptView: React.FC<Props> = ({
  transcript,
  loading,
  error,
  onRefresh,
}) => {
  return (
    <section className="transcript-view">
      <header className="transcript-view__header">
        <h3 className="transcript-view__title">Transcript</h3>
        {onRefresh && (
          <button
            className="transcript-view__btn"
            type="button"
            onClick={onRefresh}
          >
            Refresh
          </button>
        )}
      </header>

      {loading && <p className="transcript-view__muted">Loading…</p>}
      {error && <p className="transcript-view__error">{error}</p>}

      {!loading && !error && !transcript && (
        <p className="transcript-view__muted">
          No transcript yet. Upload audio to generate one.
        </p>
      )}

      {transcript && (
        <div className="transcript-view__body">
          <div className="transcript-view__meta">
            <span>Language: {transcript.language}</span>
            <span>Segments: {transcript.segmentCount}</span>
            <span>Duration: {Math.round(transcript.durationSeconds)}s</span>
          </div>

          <pre className="transcript-view__text">{transcript.text}</pre>
        </div>
      )}
    </section>
  );
};
