import React from "react";
import type { StepUpdate } from "../../types/analysis";
import "./ResultView.scss";

export interface ResultViewProps {
  summary: string | null;
  actions: string[];
  isAnalyzing: boolean;
  steps: StepUpdate[];
}

export const ResultView: React.FC<ResultViewProps> = ({
  summary,
  actions,
  isAnalyzing,
  steps,
}) => {
  const hasContent = !!summary || actions.length > 0 || steps.length > 0;

  return (
    <section className="result-view">
      <header className="result-view__header">
        <h2 className="result-view__title">Analysis result</h2>
      </header>

      <div className="result-view__body">
        {/* STEPS / PROGRESS */}
        {steps.length > 0 && (
          <section className="result-view__section">
            <h3 className="result-view__section-title">Processing steps</h3>
            <ul className="result-view__steps">
              {steps.map((s, index) => (
                <li key={index} className="result-view__step">
                  <span className="result-view__step-name">{s.step}</span>
                  <span className="result-view__step-message">{s.message}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {isAnalyzing && (
          <p className="result-view__status">Analyzing your notes…</p>
        )}

        {!isAnalyzing && !hasContent && (
          <p className="result-view__placeholder">
            Run an analysis to see summary and action items here.
          </p>
        )}

        {!isAnalyzing && summary && (
          <section className="result-view__section">
            <h3 className="result-view__section-title">Summary</h3>
            <p className="result-view__summary">{summary}</p>
          </section>
        )}

        {!isAnalyzing && actions.length > 0 && (
          <section className="result-view__section">
            <h3 className="result-view__section-title">Action items</h3>
            <ul className="result-view__actions">
              {actions.map((item, index) => (
                <li key={index} className="result-view__action-item">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </section>
  );
};
