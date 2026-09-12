import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '@sigrade/shared-api';

interface Period {
  id: string;
  name: string;
  code: string;
  schoolYearId: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface PeriodContextType {
  currentPeriod: Period | null;
  periods: Period[];
  isLoading: boolean;
  setPeriod: (period: Period) => void;
  refreshPeriods: () => Promise<void>;
}

const PeriodContext = createContext<PeriodContextType | undefined>(undefined);

export function PeriodProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [periods, setPeriods] = useState<Period[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<Period | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPeriods = useCallback(async () => {
    try {
      const response = await api.get('/periods?limit=50');
      const data = response.data?.data ?? response.data ?? [];
      setPeriods(data);
      
      // Try to restore from URL first
      const periodIdFromUrl = searchParams.get('periodId');
      if (periodIdFromUrl) {
        const found = data.find((p: Period) => p.id === periodIdFromUrl);
        if (found) {
          setCurrentPeriod(found);
          setIsLoading(false);
          return;
        }
      }
      
      // Then try active period
      const active = data.find((p: Period) => p.isActive);
      if (active) {
        setCurrentPeriod(active);
        if (!periodIdFromUrl) {
          setSearchParams({ periodId: active.id }, { replace: true });
        }
      } else if (data.length > 0) {
        const first = data[0];
        setCurrentPeriod(first);
        if (!periodIdFromUrl) {
          setSearchParams({ periodId: first.id }, { replace: true });
        }
      }
    } catch {
      // Handle error silently
    } finally {
      setIsLoading(false);
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    fetchPeriods();
  }, [fetchPeriods]);

  const setPeriod = useCallback((period: Period) => {
    setCurrentPeriod(period);
    setSearchParams({ periodId: period.id }, { replace: true });
  }, [setSearchParams]);

  const value = useMemo(() => ({
    currentPeriod,
    periods,
    isLoading,
    setPeriod,
    refreshPeriods: fetchPeriods,
  }), [currentPeriod, periods, isLoading, setPeriod, fetchPeriods]);

  return (
    <PeriodContext.Provider value={value}>
      {children}
    </PeriodContext.Provider>
  );
}

export function usePeriod() {
  const context = useContext(PeriodContext);
  if (!context) {
    throw new Error('usePeriod must be used within a PeriodProvider');
  }
  return context;
}
