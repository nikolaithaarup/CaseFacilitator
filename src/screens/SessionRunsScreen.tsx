import { useEffect, useState } from "react";
import { loadSessionRuns, type RunDoc } from "../services/runs";

export function SessionRunsScreen({ sessionId }: { sessionId: string }) {
  const [runs, setRuns] = useState<RunDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessionRuns(sessionId)
      .then(setRuns)
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) return null;

  return (
    <>
      {runs.map((r) => (
        <Text key={r.runId}>
          {r.caseTitle} · {Math.round(r.totalTimeMs / 1000)}s
        </Text>
      ))}
    </>
  );
}
