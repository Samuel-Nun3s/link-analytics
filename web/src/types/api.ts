// Espelha as responses do backend. Atualizar manualmente quando o backend mudar.

export type ApiError = {
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
};

export type Link = {
  id: string;
  slug: string;
  originalUrl: string;
  customSlug: boolean;
  expiresAt: string | null;
  maxClicks: number | null;
  clickCount: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LinksList = {
  items: Link[];
  total: number;
  limit: number;
  offset: number;
};

export type CreateLinkInput = {
  originalUrl: string;
  slug?: string;
  expiresAt?: string;
  maxClicks?: number;
};

export type UpdateLinkInput = {
  originalUrl?: string;
  slug?: string;
  expiresAt?: string | null;
  maxClicks?: number | null;
  active?: boolean;
};

export type RangeKey = "24h" | "7d" | "30d" | "90d" | "all";

export type AnalyticsTotals = {
  clicks: number;
  uniqueIps: number;
  uniqueLinks?: number; // omitido no per-link
};

export type TimeSeriesPoint = { bucket: string; clicks: number };
export type CategoryItem<K extends string, V = string | null> = Record<K, V> & {
  clicks: number;
};

export type AnalyticsOverview = {
  range: RangeKey;
  from: string;
  to: string;
  totals: AnalyticsTotals;
  timeSeries: TimeSeriesPoint[];
  byCountry: { country: string | null; clicks: number }[];
  byDeviceType: { deviceType: string; clicks: number }[];
  byBrowser: { browser: string; clicks: number }[];
  byOS: { os: string; clicks: number }[];
  topReferrers: { referrer: string | null; clicks: number }[];
  topLinks?: { slug: string; originalUrl: string; clicks: number }[];
};

export type LoginResponse = { token: string };
