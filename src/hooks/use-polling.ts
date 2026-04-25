import { useCallback, useEffect, useRef, useState } from "react";

export function usePolling<T>(
  fetcher: () => Promise<T>,
  intervalMs: number,
  enabled = true
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetch = useCallback(async () => {
    try {
      const result = await fetcher();
      setData(result);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setIsLoading(false);
    }
  }, [fetcher]);

  const refresh = useCallback(() => { fetch(); }, [fetch]);

  useEffect(() => {
    if (!enabled) return;
    // Initial fetch — setState calls happen inside Promise callbacks, not synchronously
    void fetch();
    timerRef.current = setInterval(() => { void fetch(); }, intervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetch, intervalMs, enabled]);

  return { data, error, isLoading, refresh };
}
