import React from "react";
import "./TranscriptAnalysisTabs.scss";

export type TabKey =
  | "overview"
  | "actions"
  | "decisions"
  | "risks"
  | "questions";

type Props = {
  value: TabKey;
  onChange: (next: TabKey) => void;
};

const tabs: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "actions", label: "Action items" },
  { key: "decisions", label: "Decisions" },
  { key: "risks", label: "Risks" },
  { key: "questions", label: "Questions" },
];

export const TranscriptAnalysisTabs: React.FC<Props> = ({
  value,
  onChange,
}) => {
  return (
    <nav className="ta-tabs" aria-label="Transcript analysis tabs">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          className={`ta-tabs__tab ${value === t.key ? "is-active" : ""}`}
          onClick={() => onChange(t.key)}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
};
