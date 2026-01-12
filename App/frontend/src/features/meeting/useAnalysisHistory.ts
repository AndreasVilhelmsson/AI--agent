import { useCallback, useEffect, useState } from "react";
import type { AnalysisListItem } from "../../types/analysis";
import { fetchAnalysisHistory } from "./api";

export function useAnalysisHistory(take: number = 5) {
  const [items, setItems] = useState<AnalysisListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAnalysisHistory(take);
      console.log("Fetched analysis history:", data);
      setItems(data);
    } catch (err) {
      console.error("Failed to load history", err);
      setError("Could not load history.");
    } finally {
      setLoading(false);
    }
  }, [take]);

  useEffect(() => {
    // Ladda historik vid sidan start
    refresh();
  }, [refresh]);

  return { items, loading, error, refresh };
}
