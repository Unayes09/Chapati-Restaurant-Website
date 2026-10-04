import { useEffect, useState, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Shared hook that polls /api/closed-days so the banner stays current after an
 * admin changes ranges in another tab.
 */
export const useClosedDays = (intervalMs = 5 * 60 * 1000) => {
  const [active, setActive] = useState(null);
  const [upcomingDates, setUpcomingDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/closed-days`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setActive(data.active || null);
      setUpcomingDates(Array.isArray(data.upcomingDates) ? data.upcomingDates : []);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
    const id = setInterval(fetchState, intervalMs);
    return () => clearInterval(id);
  }, [fetchState, intervalMs]);

  const isDateClosed = useCallback(
    (iso) => (Array.isArray(upcomingDates) ? upcomingDates.includes(iso) : false),
    [upcomingDates]
  );

  return { active, upcomingDates, loading, error, isDateClosed, refresh: fetchState };
};
