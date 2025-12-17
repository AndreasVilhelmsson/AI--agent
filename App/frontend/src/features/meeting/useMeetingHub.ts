import { useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import axios from "axios";
import type { StepUpdate, AnalysisResult } from "../../types/analysis";

// JUSTERA om din backend har annan port
const BACKEND_BASE_URL = "http://localhost:5168";
const HUB_URL = `${BACKEND_BASE_URL}/hubs/meeting`;
const ANALYZE_URL = `${BACKEND_BASE_URL}/api/analysis/analyze`;

export function useMeetingHub() {
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [steps, setSteps] = useState<StepUpdate[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [actions, setActions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // skapa och starta SignalR-connection
  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL)
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;

    // lyssna på stepUpdate
    connection.on("stepUpdate", (payload: StepUpdate) => {
      setSteps((prev) => [...prev, payload]);
    });

    // lyssna på resultReady
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
      .catch((err) => {
        console.error("SignalR connection error:", err);
        setError("Could not connect to realtime service.");
      });

    return () => {
      connection
        .stop()
        .catch((err) =>
          console.error("Error while stopping SignalR connection:", err)
        );
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
      // HTTP-anropet triggar analysen på servern
      // själva resultatet kommer via SignalR (resultReady)
      await axios.post(
        ANALYZE_URL,
        { text },
        {
          withCredentials: false,
        }
      );
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
