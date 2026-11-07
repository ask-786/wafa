import { describe, expect, it } from 'vitest';
import {
  daysFromDuration,
  daysFromRange,
  estimateCounts,
  excludedDays,
  prayersFor,
  sumCounts,
  witrOwedByDefault,
} from './estimate';
import {
  balances,
  countOnDay,
  dailyGoal,
  furthestBehind,
  mostCompleted,
  mostPending,
  projection,
  streak,
  totals,
} from './selectors';
import { emptyCounts, type Adjustment, type Ledger, type Prayer, type QadaLog } from './types';

const ledger = (over: Partial<Ledger> = {}): Ledger => ({
  id: 'L',
  kind: 'salah',
  createdAt: new Date(2026, 0, 1, 9).toISOString(),
  madhab: 'shafii',
  prayers: prayersFor(false),
  estimate: {
    input: { method: 'duration', years: 1, months: 0, days: 0 },
    excludedDaysPerMonth: 0,
  },
  initial: estimateCounts({ method: 'duration', years: 1, months: 0, days: 0 }, prayersFor(false)),
  dailyTarget: 1,
  ...over,
});

let seq = 0;
const log = (prayer: Prayer, at: Date, count = 1, ledgerId = 'L'): QadaLog => ({
  id: `log${seq++}`,
  ledgerId,
  prayer,
  count,
  at: at.toISOString(),
});

const adj = (prayer: Prayer, delta: number): Adjustment => ({
  id: `adj${seq++}`,
  ledgerId: 'L',
  prayer,
  delta,
  at: new Date(2026, 0, 2).toISOString(),
});

describe('estimate', () => {
  it('turns one year into 365 of each fard prayer, 1,825 in all', () => {
    const counts = estimateCounts(
      { method: 'duration', years: 1, months: 0, days: 0 },
      prayersFor(false),
    );
    expect(counts.fajr).toBe(365);
    expect(counts.witr).toBe(0);
    expect(sumCounts(counts, prayersFor(false))).toBe(1825);
  });

  it('includes witr only when it is tracked', () => {
    const counts = estimateCounts(
      { method: 'duration', years: 0, months: 0, days: 10 },
      prayersFor(true),
    );
    expect(counts.witr).toBe(10);
  });

  it('defaults witr to owed only for hanafi', () => {
    expect(witrOwedByDefault('shafii')).toBe(false);
    expect(witrOwedByDefault('maliki')).toBe(false);
    expect(witrOwedByDefault('hanbali')).toBe(false);
    expect(witrOwedByDefault('hanafi')).toBe(true);
  });

  it('adds years, months and days, ignoring junk', () => {
    expect(daysFromDuration(2, 3, 4)).toBe(2 * 365 + 90 + 4);
    expect(daysFromDuration(NaN, -1, 2.9)).toBe(2);
  });

  it('counts a date range inclusively and rejects bad input', () => {
    expect(daysFromRange('2020-01-01', '2020-01-01')).toBe(1);
    expect(daysFromRange('2020-01-01', '2020-12-31')).toBe(366);
    expect(daysFromRange('2020-03-01', '2020-02-01')).toBe(0);
    expect(daysFromRange('2021-02-30', '2021-03-01')).toBe(0);
    expect(daysFromRange('nope', '2021-03-01')).toBe(0);
  });

  it('prorates excluded days per month across the span', () => {
    expect(excludedDays(365, 7)).toBe(Math.round((365 * 7) / 30));
    expect(excludedDays(10, 30)).toBe(10);
    const counts = estimateCounts(
      { method: 'duration', years: 0, months: 0, days: 300 },
      prayersFor(false),
      6,
    );
    expect(counts.isha).toBe(240);
  });

  it('keeps manual counts for tracked prayers only', () => {
    const manual = { ...emptyCounts(), fajr: 40, isha: 12.7, witr: 9 };
    const counts = estimateCounts({ method: 'manual', counts: manual }, prayersFor(false));
    expect(counts).toMatchObject({ fajr: 40, isha: 12, witr: 0, dhuhr: 0 });
  });
});

describe('balances', () => {
  const day = new Date(2026, 0, 5, 10);

  it('derives target, completed and remaining from events', () => {
    const rows = balances(
      ledger(),
      [adj('isha', 10), adj('fajr', -5)],
      [log('fajr', day, 3), log('isha', day)],
    );
    const fajr = rows.find((r) => r.prayer === 'fajr')!;
    const isha = rows.find((r) => r.prayer === 'isha')!;
    expect(fajr).toMatchObject({ target: 360, completed: 3, remaining: 357 });
    expect(isha).toMatchObject({ target: 375, completed: 1, remaining: 374 });
    expect(rows.map((r) => r.prayer)).toEqual(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']);
  });

  it('never shows negative remaining or more than 100%', () => {
    const small = ledger({
      initial: { ...emptyCounts(), fajr: 2, dhuhr: 2, asr: 2, maghrib: 2, isha: 2 },
    });
    const rows = balances(small, [], [log('fajr', day, 5)]);
    expect(rows[0]).toMatchObject({ completed: 2, remaining: 0, pct: 1 });
  });

  it('ignores events from other ledgers', () => {
    const rows = balances(ledger(), [], [log('fajr', day, 4, 'other')]);
    expect(rows[0].completed).toBe(0);
  });

  it('totals and picks highlights', () => {
    const l = ledger({
      initial: { ...emptyCounts(), fajr: 100, dhuhr: 50, asr: 10, maghrib: 10, isha: 200 },
    });
    const rows = balances(l, [], [log('fajr', day, 30), log('asr', day, 9), log('isha', day, 20)]);
    expect(totals(rows)).toMatchObject({ target: 370, completed: 59, remaining: 311 });
    expect(mostCompleted(rows)?.prayer).toBe('fajr');
    expect(mostPending(rows)?.prayer).toBe('isha');
    expect(furthestBehind(rows)?.prayer).toBe('dhuhr');
  });
});

describe('days', () => {
  it('counts what was prayed on a local day', () => {
    const logs = [
      log('fajr', new Date(2026, 0, 5, 1)),
      log('isha', new Date(2026, 0, 5, 23), 2),
      log('asr', new Date(2026, 0, 6, 0, 30)),
    ];
    expect(countOnDay(logs, 'L', new Date(2026, 0, 5, 12))).toBe(3);
  });

  it('daily goal is target days times tracked prayers', () => {
    expect(dailyGoal(ledger({ dailyTarget: 2 }))).toBe(10);
    expect(dailyGoal(ledger({ prayers: prayersFor(true) }))).toBe(6);
  });

  it('keeps a streak alive while today is still empty', () => {
    const logs = [3, 4, 5].map((d) => log('fajr', new Date(2026, 0, d, 8)));
    expect(streak(logs, 'L', new Date(2026, 0, 6, 9))).toBe(3);
    expect(streak(logs, 'L', new Date(2026, 0, 5, 20))).toBe(3);
    expect(streak(logs, 'L', new Date(2026, 0, 7, 9))).toBe(0);
  });
});

describe('projection', () => {
  it('falls back to the daily target with little history', () => {
    const l = ledger({ createdAt: new Date(2026, 0, 1).toISOString() });
    const p = projection(l, 50, [], new Date(2026, 0, 3, 12));
    expect(p).toMatchObject({ basis: 'target', pace: 5, daysLeft: 10 });
    expect(p.finish?.getDate()).toBe(13);
  });

  it('uses the actual pace once there is enough history', () => {
    const l = ledger({ createdAt: new Date(2026, 0, 1).toISOString() });
    const now = new Date(2026, 0, 10, 12);
    const logs = Array.from({ length: 10 }, (_, i) => log('fajr', new Date(2026, 0, i + 1, 8), 2));
    const p = projection(l, 100, logs, now);
    expect(p.basis).toBe('actual');
    expect(p.pace).toBe(2);
    expect(p.daysLeft).toBe(50);
  });

  it('has nothing to project without a target or history', () => {
    const p = projection(ledger({ dailyTarget: 0 }), 10, [], new Date(2026, 0, 2));
    expect(p).toMatchObject({ basis: 'none', daysLeft: null, finish: null });
  });

  it('is done when nothing remains', () => {
    expect(projection(ledger(), 0, [], new Date(2026, 0, 2)).daysLeft).toBe(0);
  });
});
