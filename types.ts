
export const enum PageView {
  Splash = 'SPLASH',
  Home = 'HOME',
  DailyData = 'DAILY_DATA',
  MonthlyAnalytics = 'MONTHLY_ANALYTICS',
  YearlyAnalytics = 'YEARLY_ANALYTICS',
}

export enum SubTier {
  Tier1 = 'Tier 1',
  Tier2 = 'Tier 2',
  Tier3 = 'Tier 3',
}

export interface BaseEntry {
  id: string; // Unique ID for each entry (e.g., uuid)
  timestamp: string; // ISO string for when this specific entry was made
  username: string; // User associated with the action (sub, donor, gifter)
}

export interface SubEntryData extends BaseEntry {
  type: 'sub';
  tier: SubTier;
  count: number; 
}

export interface GiftSubEntryData extends BaseEntry {
  type: 'gift_sub';
  tier: SubTier;
  count: number; // How many subs were gifted
}

export interface DonationEntryData extends BaseEntry {
  type: 'donation';
  amount: number; // USD
}

export interface PrimeSubEntryData extends BaseEntry {
  type: 'prime_sub';
  // count is implicitly 1
}

export type StreamActivity = SubEntryData | GiftSubEntryData | DonationEntryData | PrimeSubEntryData;

// Represents the payload for adding a new activity, before id and timestamp are generated.
export type StreamActivityPayload =
  | Omit<SubEntryData, 'id' | 'timestamp'>
  | Omit<GiftSubEntryData, 'id' | 'timestamp'>
  | Omit<DonationEntryData, 'id' | 'timestamp'>
  | Omit<PrimeSubEntryData, 'id' | 'timestamp'>;


export interface DailyStreamLog {
  id: string; // Unique ID for this stream session, e.g., YYYY-MM-DD_streamerName_streamTitle
  streamerName: string;
  date: string; // YYYY-MM-DD
  streamTitle: string;
  activities: StreamActivity[];
  lastUpdated: string; // ISO string, for sorting recent items
}

export interface DataContextType {
  allStreamLogs: DailyStreamLog[];
  isLoading: boolean;
  activeStreamId: string | null;
  setActiveStreamId: (id: string | null) => void;
  getStreamLogById: (id: string) => DailyStreamLog | undefined;
  createOrUpdateStreamLogHeader: (details: { streamerName: string; date: string; streamTitle: string }) => string;
  addActivityToLog: (streamId: string, activity: StreamActivityPayload) => void;
  getRecentStreamLogs: () => DailyStreamLog[];
  getMonthlySummary: (year: number, month: number) => AggregatedSummary | null;
  getYearlySummary: (year: number) => AggregatedSummary | null;
  getAvailableMonths: (year: number) => { month: number, name: string }[];
  getAvailableYears: () => number[];
}

export interface AggregatedSummary {
  period: string; // e.g., "2023-10" or "2023"
  subs: { [key in SubTier]: number };
  giftSubs: { [key in SubTier]: number };
  donations: number;
  primeSubs: number;
  chartData: any[]; // Data formatted for Recharts
}

export interface InitialStreamInfo {
  streamerName: string;
  date: string;
  streamTitle: string;
}