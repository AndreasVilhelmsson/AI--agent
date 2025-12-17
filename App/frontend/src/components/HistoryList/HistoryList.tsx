import React from "react";
import type { AnalysisListItem } from "../../types/analysis";
import "./HistoryList.scss";

interface HistoryListProps {
  items: AnalysisListItem[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  maxHeightPx?: number; // <- valfritt, för scrollbar-höjd
  onSelect: (id: number) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  items,
  loading,
  error,
  onRefresh,
  onSelect,
  maxHeightPx = 300,
}) => {
  const showEmpty = !loading && !error && items.length === 0;

  return (
    <section className="history">
      <header className="history__header">
        <h3 className="history__title">Recent analyses</h3>
        <button
          type="button"
          className="history__refresh"
          onClick={onRefresh}
          disabled={loading}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      {error && <p className="history__error">{error}</p>}
      {showEmpty && <p className="history__empty">No previous analyses yet.</p>}

      {/* Scroll-container */}
      <div
        className="history__scroll"
        style={{ maxHeight: `${maxHeightPx}px` }}
        aria-busy={loading}
      >
        {loading && items.length === 0 && (
          <p className="history__loading">Loading history…</p>
        )}

        <div className="history__scroll">
          <ul className="history__list">
            {items.map((item) => (
              <li
                key={item.id}
                className="history__item history__item--clickable"
                role="button"
                tabIndex={0}
                onClick={() => onSelect(item.id)}
                onKeyDown={(e) => e.key === "Enter" && onSelect(item.id)}
              >
                <time className="history__date">
                  {new Date(item.createdAtUtc).toLocaleString()}
                </time>
                <p className="history__summary">{item.summaryPreview}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};
