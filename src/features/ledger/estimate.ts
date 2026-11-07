import {
  emptyCounts,
  FARD_PRAYERS,
  type EstimateInput,
  type Madhab,
  type Prayer,
  type PrayerCounts,
} from './types';

// ─── Estimate calculator ─────────────────────────────────────────────────────
// Turns "about two years" into a per-prayer debt. Deliberately simple calendar
// maths (a year is 365 days, a month 30): the estimate is a starting point the
// user adjusts, not a ruling.

export const DAYS_PER_YEAR = 365;
export const DAYS_PER_MONTH = 30;
const MS_PER_DAY = 86_400_000;

/** Witr is wajib for Hanafis and sunnah for the other three schools. */
export const witrOwedByDefault = (madhab: Madhab): boolean => madhab === 'hanafi';

export const prayersFor = (includeWitr: boolean): Prayer[] =>
  includeWitr ? [...FARD_PRAYERS, 'witr'] : [...FARD_PRAYERS];

const whole = (n: number) => (Number.isFinite(n) && n > 0 ? Math.floor(n) : 0);

export const daysFromDuration = (years: number, months: number, days: number): number =>
  whole(years) * DAYS_PER_YEAR + whole(months) * DAYS_PER_MONTH + whole(days);

/** Parses `YYYY-MM-DD` as a UTC calendar day, so DST never shifts the count. */
const parseDay = (iso: string): number | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const [, y, m, d] = match.map(Number);
  const t = Date.UTC(y, m - 1, d);
  const check = new Date(t);
  // Rejects 2025-02-30 and friends, which Date.UTC silently rolls over.
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d) {
    return null;
  }
  return t;
};

/** Days in an inclusive range; 0 when invalid or reversed. */
export const daysFromRange = (from: string, to: string): number => {
  const a = parseDay(from);
  const b = parseDay(to);
  if (a === null || b === null || b < a) return 0;
  return Math.round((b - a) / MS_PER_DAY) + 1;
};

/** Raw days the input covers, before exclusions. `null` for manual counts. */
export const daysCovered = (input: EstimateInput): number | null => {
  switch (input.method) {
    case 'duration':
      return daysFromDuration(input.years, input.months, input.days);
    case 'range':
      return daysFromRange(input.from, input.to);
    case 'manual':
      return null;
  }
};

/** Days to remove for e.g. menstruation, prorated across the covered span. */
export const excludedDays = (days: number, perMonth: number): number =>
  Math.min(days, Math.round((days * Math.min(whole(perMonth), DAYS_PER_MONTH)) / DAYS_PER_MONTH));

/**
 * The debt per prayer. Untracked prayers are always 0 so the ledger never
 * carries a hidden balance for, say, Witr under the Shafi'i default.
 */
export const estimateCounts = (
  input: EstimateInput,
  prayers: readonly Prayer[],
  excludedDaysPerMonth = 0,
): PrayerCounts => {
  const counts = emptyCounts();
  if (input.method === 'manual') {
    for (const p of prayers) counts[p] = whole(input.counts[p]);
    return counts;
  }
  const raw = daysCovered(input) ?? 0;
  const owed = raw - excludedDays(raw, excludedDaysPerMonth);
  for (const p of prayers) counts[p] = owed;
  return counts;
};

export const sumCounts = (counts: PrayerCounts, prayers: readonly Prayer[]): number =>
  prayers.reduce((sum, p) => sum + counts[p], 0);
