import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { DailyStreamLog, StreamActivity, DataContextType, AggregatedSummary, StreamActivityPayload } from '../types';
import { SubTier } from '../types'; // SubTier is an enum, used as a value
import { LOCAL_STORAGE_KEY_STREAM_LOGS, createStreamId } from '../constants';
import useLocalStorage from '../hooks/useLocalStorage';

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [storedLogs, setStoredLogs] = useLocalStorage<DailyStreamLog[]>(LOCAL_STORAGE_KEY_STREAM_LOGS, []);
  const [isLoading, setIsLoading] = useState(true);
  const [activeStreamId, setActiveStreamIdState] = useState<string | null>(null);

  useEffect(() => {
    // Simulate initial loading if necessary, or just set to false if localStorage is fast enough
    setIsLoading(false); 
  }, []);

  const getStreamLogById = useCallback((id: string): DailyStreamLog | undefined => {
    return storedLogs.find(log => log.id === id);
  }, [storedLogs]);

  const createOrUpdateStreamLogHeader = useCallback((details: { streamerName: string; date: string; streamTitle: string }): string => {
    const newId = createStreamId(details.date, details.streamerName, details.streamTitle);
    const existingLog = storedLogs.find(log => log.id === newId);

    if (existingLog) {
      return existingLog.id;
    } else {
      const newLog: DailyStreamLog = {
        ...details,
        id: newId,
        activities: [],
        lastUpdated: new Date().toISOString(),
      };
      setStoredLogs(prevLogs => [...prevLogs, newLog]);
      return newLog.id;
    }
  }, [storedLogs, setStoredLogs]);

  const addActivityToLog = useCallback((streamId: string, activityData: StreamActivityPayload): void => {
    const newActivity = {
      ...activityData,
      id: uuidv4(),
      timestamp: new Date().toISOString(),
    } as StreamActivity; 

    setStoredLogs(prevLogs =>
      prevLogs.map(log =>
        log.id === streamId
          ? { ...log, activities: [...log.activities, newActivity], lastUpdated: new Date().toISOString() }
          : log
      )
    );
  }, [setStoredLogs]);
  
  const getRecentStreamLogs = useCallback((): DailyStreamLog[] => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return storedLogs
      .filter(log => {
        const logDate = new Date(log.date);
        return logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear;
      })
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
  }, [storedLogs]);

  const aggregateActivities = (activities: StreamActivity[]): Omit<AggregatedSummary, 'period' | 'chartData'> => {
    const summary = {
      subs: { [SubTier.Tier1]: 0, [SubTier.Tier2]: 0, [SubTier.Tier3]: 0 },
      giftSubs: { [SubTier.Tier1]: 0, [SubTier.Tier2]: 0, [SubTier.Tier3]: 0 },
      donations: 0,
      primeSubs: 0,
    };

    activities.forEach(activity => {
      if (activity.type === 'sub') {
        summary.subs[activity.tier] += activity.count;
      } else if (activity.type === 'gift_sub') {
        summary.giftSubs[activity.tier] += activity.count;
      } else if (activity.type === 'donation') {
        summary.donations += activity.amount;
      } else if (activity.type === 'prime_sub') {
        summary.primeSubs += 1; 
      }
    });
    return summary;
  };

  const getMonthlySummary = useCallback((year: number, month: number): AggregatedSummary | null => {
    const filteredActivities = storedLogs
      .filter(log => {
        const logDate = new Date(log.date);
        return logDate.getFullYear() === year && logDate.getMonth() === month;
      })
      .flatMap(log => log.activities);

    if (filteredActivities.length === 0) return null;

    const baseSummary = aggregateActivities(filteredActivities);
    const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });
    
    const chartData = [
      { name: SubTier.Tier1, subs: baseSummary.subs[SubTier.Tier1], giftSubs: baseSummary.giftSubs[SubTier.Tier1] },
      { name: SubTier.Tier2, subs: baseSummary.subs[SubTier.Tier2], giftSubs: baseSummary.giftSubs[SubTier.Tier2] },
      { name: SubTier.Tier3, subs: baseSummary.subs[SubTier.Tier3], giftSubs: baseSummary.giftSubs[SubTier.Tier3] },
      { name: 'Prime Subs', subs: baseSummary.primeSubs, giftSubs: 0 },
      { name: 'Donations Value', subs: baseSummary.donations, giftSubs: 0 }, 
    ];

    return {
      period: `${year}-${String(month + 1).padStart(2, '0')} (${monthName})`,
      ...baseSummary,
      chartData,
    };
  }, [storedLogs]);

  const getYearlySummary = useCallback((year: number): AggregatedSummary | null => {
    const monthlySummaries: AggregatedSummary[] = [];
    for (let monthIdx = 0; monthIdx < 12; monthIdx++) {
        const summary = getMonthlySummary(year, monthIdx);
        if (summary) {
            monthlySummaries.push(summary);
        }
    }

    if (monthlySummaries.length === 0) return null;

    const yearlyActivities = storedLogs
      .filter(log => new Date(log.date).getFullYear() === year)
      .flatMap(log => log.activities);
    
    const baseSummary = aggregateActivities(yearlyActivities);

    const yearlyChartData = monthlySummaries.map(ms => ({
        name: ms.period.split(' ')[1].replace('(', '').replace(')',''), 
        totalSubs: Object.values(ms.subs).reduce((a,b) => a+b, 0) + ms.primeSubs,
        totalGiftSubs: Object.values(ms.giftSubs).reduce((a,b) => a+b, 0),
        totalDonations: ms.donations,
    }));
    
    return {
      period: String(year),
      ...baseSummary,
      chartData: yearlyChartData,
    };
  }, [storedLogs, getMonthlySummary]);

  const getAvailableMonths = useCallback((year: number): { month: number, name: string }[] => {
    const months = new Set<number>();
    storedLogs.forEach(log => {
      const logDate = new Date(log.date);
      if (logDate.getFullYear() === year) {
        months.add(logDate.getMonth());
      }
    });
    return Array.from(months)
      .sort((a,b) => a-b)
      .map(monthIdx => ({
        month: monthIdx,
        name: new Date(year, monthIdx).toLocaleString('default', { month: 'long' }),
      }));
  }, [storedLogs]);

  const getAvailableYears = useCallback((): number[] => {
    const years = new Set<number>();
    storedLogs.forEach(log => {
      years.add(new Date(log.date).getFullYear());
    });
    return Array.from(years).sort((a,b) => b-a); 
  }, [storedLogs]);
  
  const setActiveStreamId = useCallback((id: string | null) => {
    setActiveStreamIdState(id);
  }, []);

  return (
    <DataContext.Provider value={{ 
        allStreamLogs: storedLogs, 
        isLoading, 
        activeStreamId, 
        setActiveStreamId,
        getStreamLogById, 
        createOrUpdateStreamLogHeader, 
        addActivityToLog,
        getRecentStreamLogs,
        getMonthlySummary,
        getYearlySummary,
        getAvailableMonths,
        getAvailableYears
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};