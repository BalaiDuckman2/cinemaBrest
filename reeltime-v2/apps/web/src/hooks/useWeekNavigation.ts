import { useState, useCallback, useEffect } from 'react';

export function useWeekNavigation() {
  const [weekOffset, setWeekOffset] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return parseInt(params.get('week') ?? '0', 10) || 0;
  });

  // Sync weekOffset to URL
  useEffect(() => {
    const url = new URL(window.location.href);
    if (weekOffset === 0) {
      url.searchParams.delete('week');
    } else {
      url.searchParams.set('week', String(weekOffset));
    }
    window.history.pushState({}, '', url.toString());
  }, [weekOffset]);

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setWeekOffset(parseInt(params.get('week') ?? '0', 10) || 0);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return {
    weekOffset,
    goToNextWeek: useCallback(() => setWeekOffset((w) => w + 1), []),
    goToPrevWeek: useCallback(() => setWeekOffset((w) => w - 1), []),
    goToToday: useCallback(() => setWeekOffset(0), []),
  };
}
