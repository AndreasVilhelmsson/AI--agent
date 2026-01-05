import React, { useMemo, useState } from "react";
import "./TranscriptAnalysisCard.scss";
import { useTranscriptAnalysis } from "../../features/meeting/useTranscriptAnalysis";
import type { TranscriptAnalysisDto } from "../../features/meeting/meetingsApi";
import { TranscriptAnalysisTabs, type TabKey } from "./TranscriptAnalysisTabs";
import { ActionItemList } from "./ActionItemList";

type Props = {
  meetingId: number | null;
};

export const TranscriptAnalysisCard: React.FC<Props> = ({ meetingId }) => {
  const [tab, setTab] = useState<TabKey>("overview");
  const analysis = useTranscriptAnalysis(meetingId);

  const detailed: TranscriptAnalysisDto | null = useMemo(
    () => analysis.data?.detailed ?? null,
    [analysis.data]
  );

  const onGenerate = async () => {
    await analysis.run();
  };

  return (
    <section className="ta-card">
      <header className="ta-card__header">
        <div>
          <h3 className="ta-card__title">Detailed analysis</h3>
          <p className="ta-card__sub">
            Fireflies-style notes from transcript + timestamps.
          </p>
        </div>

        <div className="ta-card__actions">
          <button
            type="button"
            className="ta-card__btn"
            onClick={analysis.reset}
            disabled={analysis.loading}
          >
            Clear
          </button>

          <button
            type="button"
            className="ta-card__btn primary"
            onClick={onGenerate}
            disabled={!meetingId || analysis.loading}
          >
            {analysis.loading ? "Generating…" : "Generate detailed"}
          </button>
        </div>
      </header>

      {analysis.error && <p className="ta-card__error">{analysis.error}</p>}
      {analysis.loading && <p className="ta-card__muted">Working…</p>}

      {!analysis.loading && !analysis.error && !detailed && (
        <p className="ta-card__muted">
          No detailed analysis yet. Upload audio → then click “Generate
          detailed”.
        </p>
      )}

      {!analysis.loading && !analysis.error && detailed && (
        <>
          <TranscriptAnalysisTabs value={tab} onChange={setTab} />

          <div className="ta-card__content">
            {tab === "overview" && (
              <>
                <h4 className="ta-card__h">Title</h4>
                <p className="ta-card__p">{detailed.title}</p>

                <h4 className="ta-card__h">Executive summary</h4>
                <p className="ta-card__p">{detailed.executiveSummary}</p>

                <h4 className="ta-card__h">Key points</h4>
                <ul className="ta-card__list">
                  {detailed.keyPoints?.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </>
            )}

            {tab === "actions" && (
              <ActionItemList items={detailed.actionItems} />
            )}

            {tab === "decisions" && (
              <ul className="ta-card__list">
                {detailed.decisions?.length ? (
                  detailed.decisions.map((x, i) => <li key={i}>{x}</li>)
                ) : (
                  <li className="ta-card__muted">No decisions found.</li>
                )}
              </ul>
            )}

            {tab === "risks" && (
              <ul className="ta-card__list">
                {detailed.risks?.length ? (
                  detailed.risks.map((x, i) => <li key={i}>{x}</li>)
                ) : (
                  <li className="ta-card__muted">No risks found.</li>
                )}
              </ul>
            )}

            {tab === "questions" && (
              <ul className="ta-card__list">
                {detailed.openQuestions?.length ? (
                  detailed.openQuestions.map((x, i) => <li key={i}>{x}</li>)
                ) : (
                  <li className="ta-card__muted">No open questions.</li>
                )}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  );
};
