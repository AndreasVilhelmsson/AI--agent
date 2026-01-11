import React, { useEffect, useState } from "react";
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

import { TranscriptCard } from "../../components/TranscriptCard/TranscriptCard";
import { TranscriptAnalysisCard } from "../../components/TranscriptAnalysisCard/TranscriptAnalysisCard";

import { createMeeting } from "../../features/meeting/meetingsApi";
import { getErrorMessage } from "../../shared/errors/getErrorMessage";

export const MeetingPage: React.FC = () => {
  const [notes, setNotes] = useState("");

  // ✅ Single source of truth för meetingId
  const [meetingId, setMeetingId] = useState<number | null>(null);
  const [meetingError, setMeetingError] = useState<string | null>(null);
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);

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

  // ✅ Skapa meeting EN gång när sidan laddas
  useEffect(() => {
    (async () => {
      if (meetingId) return;
      setIsCreatingMeeting(true);
      setMeetingError(null);
      try {
        const created = await createMeeting("New meeting");
        setMeetingId(created.id);
      } catch (error: unknown) {
        setMeetingError(getErrorMessage(error, "Failed to create meeting"));
      } finally {
        setIsCreatingMeeting(false);
      }
    })();
  }, [meetingId]);

  const handleAnalyze = () => {
    if (!notes.trim()) return;
    startAnalysis(notes);
  };

  const handleClear = () => {
    setNotes("");
  };

  return (
    <main className="meeting-page">
      <ContentLayout
        left={
          <>
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

            {meetingError && <p style={{ color: "crimson" }}>{meetingError}</p>}

            <TranscriptCard
              meetingId={meetingId}
              disabled={isCreatingMeeting || isAnalyzing}
              onAnalyzeText={(text) => startAnalysis(text)}
            />

            <TranscriptAnalysisCard meetingId={meetingId} />
          </>
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
