import { useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import type { StepUpdate, AnalysisResult } from "../../types/analysis";
import { http } from "../../api/http";

const SIGNALR_BASE = import.meta.env.VITE_SIGNALR_BASE_URL;
const HUB_URL = `${SIGNALR_BASE}/hubs/meeting`;

export function useMeetingHub() {
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [steps, setSteps] = useState<StepUpdate[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [actions, setActions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL) // senare kan vi lägga options om needed
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;

    connection.on("stepUpdate", (payload: StepUpdate) => {
      setSteps((prev) => [...prev, payload]);
    });

    connection.on("resultReady", (payload: AnalysisResult) => {
      setSummary(payload.summary);
      setActions(payload.actions);
      setIsAnalyzing(false);
    });

    connection
      .start()
      .then(() => {
        setIsConnected(true);
        setError(null);
      })
      .catch((err: unknown) => {
        console.error("SignalR connection error:", err);
        setError("Could not connect to realtime service.");
      });

    return () => {
      connection.stop().catch(console.error);
    };
  }, []);

  const startAnalysis = async (text: string) => {
    if (!text.trim()) return;

    setIsAnalyzing(true);
    setError(null);
    setSteps([]);
    setSummary(null);
    setActions([]);

    try {
      // Anropa samma endpoint som swagger visar (kolla casing!)
      await http.post("/api/Analysis/analyze", { text });
    } catch (err) {
      console.error("Error starting analysis:", err);
      setError("Failed to start analysis.");
      setIsAnalyzing(false);
    }
  };

  return {
    isConnected,
    isAnalyzing,
    steps,
    summary,
    actions,
    error,
    startAnalysis,
  };
}
