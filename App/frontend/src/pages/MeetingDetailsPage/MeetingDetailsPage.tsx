import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  fetchMeetingDetails,
  type MeetingDetailsDto,
  type TranscriptAnalysisDto,
} from "../../features/meeting/meetingsApi";
import { useTranscriptAnalysis } from "../../features/meeting/useTranscriptAnalysis";
import { AnalysisModal } from "../../components/AnalysisModal/AnalysisModal";
import { fetchAnalysisById } from "../../features/meeting/api";
import type { MeetingAnalysis } from "../../features/meeting/api";
import { toastSuccess, toastError } from "../../shared/toast/toast";
import "./MeetingDetailsPage.scss";

type LoadState = "idle" | "loading" | "error" | "ready";

export const MeetingDetailsPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const meetingId = useMemo(() => Number(id), [id]);
  const invalidId = useMemo(
    () => !Number.isFinite(meetingId) || meetingId <= 0,
    [meetingId]
  );

  const [state, setState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MeetingDetailsDto | null>(null);

  // Fireflies-style detailed response (från POST /meetings/{id}/analyze-transcript)
  const [detailed, setDetailed] = useState<TranscriptAnalysisDto | null>(null);

  // Modal för att visa en sparad analysis (summary/actions/rawNotes)
  const [selectedAnalysis, setSelectedAnalysis] =
    useState<MeetingAnalysis | null>(null);

  // Hook som sköter “Generate detailed”
  const analysis = useTranscriptAnalysis(invalidId ? null : meetingId);

  const isLoading = state === "loading";

  async function load(showToast = false) {
    if (invalidId) return;

    setState("loading");
    setError(null);

    try {
      const res = await fetchMeetingDetails(meetingId);
      setData(res);
      setState("ready");

      if (showToast) toastSuccess("Meeting refreshed");
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : String(e) || "Failed to load meeting";
      setState("error");
      setError(msg);
      toastError(msg);
    }
  }

  async function generateDetailed() {
    if (!data?.transcript) {
      toastError("No transcript found. Upload audio first.");
      return;
    }

    const res = await analysis.run();

    if (res) {
      setDetailed(res.detailed);
      toastSuccess("Detailed analysis generated");

      // refresh så listan “Analyses” får nya raden
      await load(false);
    } else {
      toastError(analysis.error ?? "Failed to generate detailed analysis");
    }
  }

  async function openAnalysis(analysisId: number) {
    try {
      const a = await fetchAnalysisById(analysisId);
      setSelectedAnalysis(a);
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : String(e) || "Failed to open analysis";
      toastError(msg);
    }
  }

  // initial load + reset detailed vid nytt meetingId
  useEffect(() => {
    setDetailed(null);
    setSelectedAnalysis(null);
    analysis.reset();
    load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId]);

  if (invalidId) {
    return (
      <main className="meeting-details">
        <div className="meeting-details__card">
          <h2>Invalid meeting id</h2>
          <button
            className="meeting-details__btn"
            onClick={() => navigate("/history")}
          >
            Back to History
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="meeting-details">
      <header className="meeting-details__header">
        <div className="meeting-details__title">
          <button
            className="meeting-details__back"
            onClick={() => navigate("/history")}
          >
            ← Back
          </button>

          <h2>Meeting #{meetingId}</h2>

          {data && (
            <p>
              <strong>{data.title}</strong> •{" "}
              {new Date(data.createdAtUtc).toLocaleString()}
            </p>
          )}
        </div>

        <div className="meeting-details__actions">
          <button
            type="button"
            className="meeting-details__btn"
            onClick={() => load(true)}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </header>

      {state === "error" && error && (
        <div className="meeting-details__error">{error}</div>
      )}
      {isLoading && <div className="meeting-details__status">Loading…</div>}

      {state === "ready" && data && (
        <div className="meeting-details__grid">
          {/* LEFT: transcript + detailed */}
          <section className="meeting-details__panel">
            <div className="meeting-details__panelHeader">
              <h3>Transcript</h3>

              {!data.transcript ? (
                <span className="meeting-details__pill">None</span>
              ) : (
                <span className="meeting-details__pill">
                  {data.transcript.language} • {data.transcript.segmentCount}{" "}
                  seg • {Math.round(data.transcript.durationSeconds)}s
                </span>
              )}
            </div>

            {!data.transcript ? (
              <div className="meeting-details__muted">
                No transcript yet. Upload audio on the Meeting page first.
              </div>
            ) : (
              <>
                <div className="meeting-details__transcriptBox">
                  {data.transcript.text}
                </div>

                <div className="meeting-details__divider" />

                <div className="meeting-details__panelHeader">
                  <h3>Detailed analysis</h3>

                  <div className="meeting-details__panelHeaderActions">
                    <button
                      type="button"
                      className="meeting-details__btn"
                      onClick={() => setDetailed(null)}
                      disabled={!detailed}
                    >
                      Clear
                    </button>

                    <button
                      type="button"
                      className="meeting-details__btnPrimary"
                      onClick={generateDetailed}
                      disabled={analysis.loading || !data.transcript}
                    >
                      {analysis.loading ? "Generating..." : "Generate detailed"}
                    </button>
                  </div>
                </div>

                {!detailed ? (
                  <div className="meeting-details__muted">
                    No detailed analysis yet. Click “Generate detailed”.
                  </div>
                ) : (
                  <div className="meeting-details__detailed">
                    <div className="meeting-details__block">
                      <div className="meeting-details__label">Title</div>
                      <div className="meeting-details__value">
                        {detailed.title}
                      </div>
                    </div>

                    <div className="meeting-details__block">
                      <div className="meeting-details__label">
                        Executive summary
                      </div>
                      <div className="meeting-details__value">
                        {detailed.executiveSummary}
                      </div>
                    </div>

                    <div className="meeting-details__block">
                      <div className="meeting-details__label">Key points</div>
                      <ul className="meeting-details__list">
                        {detailed.keyPoints.map((x, idx) => (
                          <li key={idx}>{x}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="meeting-details__cols">
                      <div className="meeting-details__col">
                        <div className="meeting-details__label">
                          Action items
                        </div>
                        <ul className="meeting-details__list">
                          {detailed.actionItems.length === 0 && <li>—</li>}
                          {detailed.actionItems.map((a, idx) => (
                            <li key={idx}>
                              <strong>{a.task}</strong>
                              {a.owner ? ` • Owner: ${a.owner}` : ""}
                              {a.dueDate ? ` • Due: ${a.dueDate}` : ""}
                              {a.context ? ` • ${a.context}` : ""}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="meeting-details__col">
                        <div className="meeting-details__label">Decisions</div>
                        <ul className="meeting-details__list">
                          {detailed.decisions.length === 0 && <li>—</li>}
                          {detailed.decisions.map((x, idx) => (
                            <li key={idx}>{x}</li>
                          ))}
                        </ul>

                        <div className="meeting-details__label meeting-details__label--mt">
                          Risks
                        </div>
                        <ul className="meeting-details__list">
                          {detailed.risks.length === 0 && <li>—</li>}
                          {detailed.risks.map((x, idx) => (
                            <li key={idx}>{x}</li>
                          ))}
                        </ul>

                        <div className="meeting-details__label meeting-details__label--mt">
                          Open questions
                        </div>
                        <ul className="meeting-details__list">
                          {detailed.openQuestions.length === 0 && <li>—</li>}
                          {detailed.openQuestions.map((x, idx) => (
                            <li key={idx}>{x}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>

          {/* RIGHT: analyses list */}
          <aside className="meeting-details__panel">
            <div className="meeting-details__panelHeader">
              <h3>Analyses</h3>
              <span className="meeting-details__pill">
                {data.analyses.length}
              </span>
            </div>

            {data.analyses.length === 0 ? (
              <div className="meeting-details__muted">No analyses yet.</div>
            ) : (
              <div className="meeting-details__analyses">
                {data.analyses.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className="meeting-details__analysisItem"
                    onClick={() => openAnalysis(a.id)}
                  >
                    <div className="meeting-details__analysisTop">
                      <div className="meeting-details__analysisId">#{a.id}</div>
                      <div className="meeting-details__analysisTime">
                        {new Date(a.createdAtUtc).toLocaleString()}
                      </div>
                    </div>
                    <div className="meeting-details__analysisSummary">
                      {a.summary}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </aside>
        </div>
      )}

      <AnalysisModal
        open={!!selectedAnalysis}
        onClose={() => setSelectedAnalysis(null)}
        summary={selectedAnalysis?.summary || ""}
        actions={selectedAnalysis?.actions || []}
        createdAtUtc={selectedAnalysis?.createdAtUtc || ""}
      />
    </main>
  );
};
