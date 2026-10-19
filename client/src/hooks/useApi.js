import { useState, useEffect, useCallback } from 'react';

/**
 * Tiny data-fetching hook: runs `fn` (re-created when `deps` change), tracking
 * data/loading/error and exposing `refetch`.
 *
 * const { data, loading, error, refetch } = useApi(() => StudentsAPI.list(), []);
 */
export function useApi(fn, deps = [], { immediate = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn(...args);
      setData(result);
      return result;
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    if (immediate) run().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, refetch: run, setData };
}
