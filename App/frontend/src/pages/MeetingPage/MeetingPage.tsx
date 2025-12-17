import React, { useState } from "react";
import { TextInputCard } from "../../components/TextInputCard/TextInputCard";
import { ResultView } from "../../components/ResultView/ResultView";
import "./MeetingPage.scss";
import { useMeetingHub } from "../../features/meeting/useMeetingHub";
import { useAnalysisHistory } from "../../features/meeting/useAnalysisHistory";
import { HistoryList } from "../../components/HistoryList/HistoryList";
import { AnalysisModal } from "../../components/AnalysisModal/AnalysisModal";
import { fetchAnalysisById } from "../../features/meeting/api";
import type { MeetingAnalysis } from "../../features/meeting/api";
import { ContentLayout } from "../../layout/ContentLayout/ContentLayout";

export const MeetingPage: React.FC = () => {
  const [notes, setNotes] = useState("");

  const [selectedAnalysis, setSelectedAnalysis] =
    useState<MeetingAnalysis | null>(null);

  async function openAnalysis(id: number) {
    const analysis = await fetchAnalysisById(id);
    setSelectedAnalysis(analysis);
  }

  const { isAnalyzing, summary, actions, steps, startAnalysis } =
    useMeetingHub();

  const {
    items: historyItems,
    loading: historyLoading,
    error: historyError,
    refresh: refreshHistory,
  } = useAnalysisHistory(5);

  const handleAnalyze = () => {
    if (!notes.trim()) return;
    startAnalysis(notes);
  };

  const handleClear = () => {
    setNotes("");
    // summary/actions/steps nollställs nästa gång vi kör startAnalysis
  };

  return (
    <main className="meeting-page">
      <ContentLayout
        left={
          <TextInputCard
            title="Meeting notes"
            description="Paste your meeting notes below and click Analyze to generate a summary and action items."
            value={notes}
            onChange={setNotes}
            primaryButtonLabel={isAnalyzing ? "Analyzing..." : "Analyze"}
            onPrimaryClick={handleAnalyze}
            showClearButton
            onClear={handleClear}
            disabled={isAnalyzing}
          />
        }
        right={
          <>
            <ResultView
              summary={summary}
              actions={actions}
              isAnalyzing={isAnalyzing}
              steps={steps}
            />
            <HistoryList
              items={historyItems}
              loading={historyLoading}
              error={historyError}
              onRefresh={refreshHistory}
              onSelect={openAnalysis}
            />
          </>
        }
      />

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
