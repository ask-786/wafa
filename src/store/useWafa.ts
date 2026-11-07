import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { balances } from '@/features/ledger/selectors';
import type {
  Adjustment,
  Estimate,
  Ledger,
  Madhab,
  Prayer,
  PrayerCounts,
  QadaLog,
} from '@/features/ledger/types';

export type ThemePreference = 'system' | 'light' | 'dark';

export interface NewLedger {
  madhab: Madhab;
  prayers: Prayer[];
  estimate: Estimate;
  initial: PrayerCounts;
  dailyTarget: number;
}

interface WafaState {
  ledger: Ledger | null;
  adjustments: Adjustment[];
  logs: QadaLog[];
  theme: ThemePreference;
  /** True once AsyncStorage has been read. Not persisted. */
  hydrated: boolean;

  createLedger: (input: NewLedger) => void;
  /** Logs `count` of one prayer, capped at what's left. Returns the batch id, or null if nothing was logged. */
  logPrayer: (prayer: Prayer, count?: number) => string | null;
  /** One of each prayer that still has some left. Returns the batch id, or null. */
  logFullDay: () => string | null;
  /** Removes every log written by one action. */
  undoBatch: (batchId: string) => void;
  setDailyTarget: (days: number) => void;
  setTheme: (theme: ThemePreference) => void;
  /** Deletes the ledger and every event. Theme is kept. */
  reset: () => void;
}

export const newId = (): string =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export const useWafa = create<WafaState>()(
  persist(
    (set, get) => {
      /** Remaining per prayer right now, so logging can never overshoot the debt. */
      const remainingOf = (prayer: Prayer): number => {
        const { ledger, adjustments, logs } = get();
        if (!ledger) return 0;
        return balances(ledger, adjustments, logs).find((b) => b.prayer === prayer)?.remaining ?? 0;
      };

      const write = (entries: { prayer: Prayer; count: number }[]): string | null => {
        const { ledger } = get();
        const live = entries.filter((e) => e.count > 0);
        if (!ledger || live.length === 0) return null;
        const batchId = newId();
        const at = new Date().toISOString();
        const logs = live.map<QadaLog>((e) => ({
          id: newId(),
          ledgerId: ledger.id,
          prayer: e.prayer,
          count: e.count,
          at,
          batchId,
        }));
        set((s) => ({ logs: [...s.logs, ...logs] }));
        return batchId;
      };

      return {
        ledger: null,
        adjustments: [],
        logs: [],
        theme: 'system',
        hydrated: false,

        createLedger: (input) =>
          set({
            ledger: {
              id: newId(),
              kind: 'salah',
              createdAt: new Date().toISOString(),
              ...input,
            },
            adjustments: [],
            logs: [],
          }),

        logPrayer: (prayer, count = 1) =>
          write([{ prayer, count: Math.min(Math.floor(count), remainingOf(prayer)) }]),

        logFullDay: () => {
          const { ledger } = get();
          if (!ledger) return null;
          return write(
            ledger.prayers.map((p) => ({ prayer: p, count: Math.min(1, remainingOf(p)) })),
          );
        },

        undoBatch: (batchId) => set((s) => ({ logs: s.logs.filter((l) => l.batchId !== batchId) })),

        setDailyTarget: (days) =>
          set((s) => (s.ledger ? { ledger: { ...s.ledger, dailyTarget: Math.max(0, days) } } : {})),

        setTheme: (theme) => set({ theme }),

        reset: () => set({ ledger: null, adjustments: [], logs: [] }),
      };
    },
    {
      name: 'wafa',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ ledger, adjustments, logs, theme }) => ({ ledger, adjustments, logs, theme }),
      onRehydrateStorage: () => () => useWafa.setState({ hydrated: true }),
    },
  ),
);
