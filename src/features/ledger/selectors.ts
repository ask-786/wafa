import {
  emptyCounts,
  type Adjustment,
  type Ledger,
  type Prayer,
  type PrayerCounts,
  type QadaLog,
} from './types';

// ─── Derived balances ────────────────────────────────────────────────────────
// Every number on Home, Overview and Stats comes from here, so they can never
// disagree. All functions are pure; anything time-based takes `now` explicitly.
//
//   target[p]    = initial[p] + Σ adjustments[p].delta
//   completed[p] = Σ logs[p].count
//   remaining[p] = max(0, target[p] − completed[p])

const MS_PER_DAY = 86_400_000;

/** Window for the "actual pace" average. */
export const PACE_WINDOW_DAYS = 30;
/** Below this much history the projection uses the daily target instead. */
export const MIN_PACE_HISTORY_DAYS = 7;

export interface PrayerBalance {
  prayer: Prayer;
  target: number;
  completed: number;
  remaining: number;
  /** 0–1. A prayer with no target counts as done. */
  pct: number;
}

export interface Totals {
  target: number;
  completed: number;
  remaining: number;
  pct: number;
}

const ratio = (done: number, of: number) => (of <= 0 ? 1 : Math.min(1, done / of));

export const targets = (ledger: Ledger, adjustments: readonly Adjustment[]): PrayerCounts => {
  const t = { ...ledger.initial };
  for (const a of adjustments) if (a.ledgerId === ledger.id) t[a.prayer] += a.delta;
  for (const p of Object.keys(t) as Prayer[]) t[p] = Math.max(0, t[p]);
  return t;
};

export const completions = (
  logs: readonly QadaLog[],
  ledgerId: string,
  filter?: (log: QadaLog) => boolean,
): PrayerCounts => {
  const c = emptyCounts();
  for (const l of logs)
    if (l.ledgerId === ledgerId && (!filter || filter(l))) c[l.prayer] += l.count;
  return c;
};

export const balances = (
  ledger: Ledger,
  adjustments: readonly Adjustment[],
  logs: readonly QadaLog[],
): PrayerBalance[] => {
  const t = targets(ledger, adjustments);
  const c = completions(logs, ledger.id);
  return ledger.prayers.map((prayer) => {
    const completed = Math.min(c[prayer], t[prayer]);
    return {
      prayer,
      target: t[prayer],
      completed,
      remaining: t[prayer] - completed,
      pct: ratio(completed, t[prayer]),
    };
  });
};

export const totals = (rows: readonly PrayerBalance[]): Totals => {
  const target = rows.reduce((s, r) => s + r.target, 0);
  const completed = rows.reduce((s, r) => s + r.completed, 0);
  return { target, completed, remaining: target - completed, pct: ratio(completed, target) };
};

// ─── Overview highlights ─────────────────────────────────────────────────────

const pick = (
  rows: readonly PrayerBalance[],
  better: (a: PrayerBalance, b: PrayerBalance) => boolean,
): PrayerBalance | undefined => {
  const live = rows.filter((r) => r.target > 0);
  return live.reduce<PrayerBalance | undefined>(
    (best, r) => (!best || better(r, best) ? r : best),
    undefined,
  );
};

export const mostCompleted = (rows: readonly PrayerBalance[]) =>
  pick(rows, (a, b) => a.completed > b.completed);

export const mostPending = (rows: readonly PrayerBalance[]) =>
  pick(rows, (a, b) => a.remaining > b.remaining);

/** Lowest % done: fairer than raw counts when targets differ per waqt. */
export const furthestBehind = (rows: readonly PrayerBalance[]) =>
  pick(rows, (a, b) => a.pct < b.pct);

// ─── Days ────────────────────────────────────────────────────────────────────

/** Local calendar day key, `YYYY-MM-DD`. */
export const dayKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date: Date, n: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);

/** Whole local days from `a` to `b` (DST-safe). */
const daysBetween = (a: Date, b: Date) =>
  Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / MS_PER_DAY);

/** Prayers made up per local day. */
export const perDay = (logs: readonly QadaLog[], ledgerId: string): Map<string, number> => {
  const days = new Map<string, number>();
  for (const l of logs) {
    if (l.ledgerId !== ledgerId) continue;
    const k = dayKey(new Date(l.at));
    days.set(k, (days.get(k) ?? 0) + l.count);
  }
  return days;
};

export const countOnDay = (logs: readonly QadaLog[], ledgerId: string, day: Date): number =>
  perDay(logs, ledgerId).get(dayKey(day)) ?? 0;

/** Prayers per day the user aims for: target days × tracked prayers. */
export const dailyGoal = (ledger: Ledger): number =>
  Math.max(0, ledger.dailyTarget) * ledger.prayers.length;

/**
 * Consecutive days with any qada, ending today, or yesterday if today has
 * nothing yet. An empty today never breaks the streak before it's over.
 */
export const streak = (logs: readonly QadaLog[], ledgerId: string, now: Date): number => {
  const days = perDay(logs, ledgerId);
  let cursor = days.has(dayKey(now)) ? startOfDay(now) : addDays(now, -1);
  let n = 0;
  while (days.has(dayKey(cursor))) {
    n += 1;
    cursor = addDays(cursor, -1);
  }
  return n;
};

// ─── Projection ──────────────────────────────────────────────────────────────

export interface Projection {
  /** Prayers per day used for the estimate. */
  pace: number;
  /** Where the pace came from. */
  basis: 'actual' | 'target' | 'none';
  /** Days until done from today; 0 when already done, null when there's no pace. */
  daysLeft: number | null;
  /** Local date of the projected finish, or null. */
  finish: Date | null;
}

export const projection = (
  ledger: Ledger,
  remaining: number,
  logs: readonly QadaLog[],
  now: Date,
): Projection => {
  if (remaining <= 0) return { pace: 0, basis: 'actual', daysLeft: 0, finish: startOfDay(now) };

  const history = daysBetween(new Date(ledger.createdAt), now) + 1;
  const window = Math.min(PACE_WINDOW_DAYS, history);
  const from = addDays(now, -(window - 1)).getTime();
  const recent = logs
    .filter((l) => l.ledgerId === ledger.id && new Date(l.at).getTime() >= from)
    .reduce((s, l) => s + l.count, 0);

  let pace = 0;
  let basis: Projection['basis'] = 'none';
  if (history >= MIN_PACE_HISTORY_DAYS && recent > 0) {
    pace = recent / window;
    basis = 'actual';
  } else if (dailyGoal(ledger) > 0) {
    pace = dailyGoal(ledger);
    basis = 'target';
  }
  if (pace <= 0) return { pace: 0, basis: 'none', daysLeft: null, finish: null };

  const daysLeft = Math.ceil(remaining / pace);
  return { pace, basis, daysLeft, finish: addDays(now, daysLeft) };
};
