import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchMeetings,
  type MeetingListItemDto,
} from "../../features/meeting/meetingsApi";
import "./HistoryPage.scss";

type LoadState = "idle" | "loading" | "error" | "ready";

export const HistoryPage: React.FC = () => {
  const [items, setItems] = useState<MeetingListItemDto[]>([]);
  const [state, setState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  async function load() {
    setState("loading");
    setError(null);

    try {
      const data = await fetchMeetings(50);
      setItems(data);
      setState("ready");
    } catch (e: unknown) {
      setState("error");
      setError(e instanceof Error ? e.message : String(e) || "Failed to load");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const isLoading = state === "loading";

  const empty = useMemo(
    () => state === "ready" && items.length === 0,
    [state, items.length]
  );

  return (
    <main className="history-page">
      <header className="history-page__header">
        <div className="history-page__title">
          <h2>History</h2>
          <p>All meetings (latest first). Click a meeting to open details.</p>
        </div>

        <button
          type="button"
          className="history-page__btn"
          onClick={load}
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Refresh"}
        </button>
      </header>

      {state === "error" && <div className="history-page__error">{error}</div>}
      {isLoading && <div className="history-page__status">Loading…</div>}
      {empty && <div className="history-page__status">No meetings yet.</div>}

      <div className="history-page__list">
        {items.map((m) => (
          <button
            key={m.id}
            type="button"
            className="history-page__item"
            onClick={() => navigate(`/meetings/${m.id}`)}
          >
            <div className="history-page__itemTop">
              <div className="history-page__itemTitle">{m.title}</div>
              <div className="history-page__pill">#{m.id}</div>
            </div>

            <div className="history-page__meta">
              <span>{new Date(m.createdAtUtc).toLocaleString()}</span>
              <span>•</span>
              <span>Transcript: {m.hasTranscript ? "Yes" : "No"}</span>
              <span>•</span>
              <span>
                Last analysis:{" "}
                {m.lastAnalysisAtUtc
                  ? new Date(m.lastAnalysisAtUtc).toLocaleString()
                  : "—"}
              </span>
            </div>
          </button>
        ))}
      </div>
    </main>
  );
};
