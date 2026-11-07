// ─── Ledger domain types ─────────────────────────────────────────────────────
// Events (logs, adjustments) are the source of truth; balances are derived from
// them in `selectors.ts`. Nothing in here is ever rewritten to "fix" a number.

export const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'witr'] as const;
export type Prayer = (typeof PRAYERS)[number];

/** The five fard prayers, in the order they fall in the day. */
export const FARD_PRAYERS: readonly Prayer[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export type PrayerCounts = Record<Prayer, number>;

export const MADHABS = ['shafii', 'hanafi', 'maliki', 'hanbali'] as const;
export type Madhab = (typeof MADHABS)[number];

/** How the user arrived at their estimate. Kept so it can be shown and re-edited. */
export type EstimateInput =
  | { method: 'duration'; years: number; months: number; days: number }
  /** Inclusive calendar dates, `YYYY-MM-DD`. */
  | { method: 'range'; from: string; to: string }
  | { method: 'manual'; counts: PrayerCounts };

export interface Estimate {
  input: EstimateInput;
  /** Days per month that were never owed (e.g. menstruation). Ignored for manual. */
  excludedDaysPerMonth: number;
}

export interface Ledger {
  id: string;
  kind: 'salah';
  /** ISO timestamp. */
  createdAt: string;
  madhab: Madhab;
  /** The prayers this ledger tracks, in display order. Witr only when enabled. */
  prayers: Prayer[];
  estimate: Estimate;
  /** The debt at creation. Later changes are `Adjustment`s, never edits here. */
  initial: PrayerCounts;
  /** Qada *days* per day, i.e. one of each tracked prayer per unit. */
  dailyTarget: number;
}

/** Re-estimates add or remove debt without touching completions. */
export interface Adjustment {
  id: string;
  ledgerId: string;
  prayer: Prayer;
  /** +N owed or −N owed. */
  delta: number;
  at: string;
  reason?: string;
}

export interface QadaLog {
  id: string;
  ledgerId: string;
  prayer: Prayer;
  /** Usually 1; the +N sheet allows more. */
  count: number;
  /** ISO timestamp. */
  at: string;
  /** Shared by every log written in one action (e.g. "full day"), so undo removes them together. */
  batchId?: string;
  note?: string;
}

export const emptyCounts = (): PrayerCounts => ({
  fajr: 0,
  dhuhr: 0,
  asr: 0,
  maghrib: 0,
  isha: 0,
  witr: 0,
});
