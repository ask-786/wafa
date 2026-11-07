# Wafa — Qada Salah Tracker

> **Wafa** (وفاء): fulfilling what is owed, keeping a promise.
> Every prayer you make up is one more paid back.

## Why a dedicated app, not a general-purpose one

Streaks already covers general habit tracking. A Qada tracker is a different
problem, and bolting it onto Streaks would bend both apps out of shape:

| Streaks (habits)            | Wafa (qada)                                    |
| --------------------------- | ---------------------------------------------- |
| Open-ended, counts **up**   | A fixed debt that counts **down** to zero      |
| One check per habit per day | Many prayers per day, per prayer type          |
| "Did I do it today?"        | "How many are left, and when will I finish?"   |
| Missed day = broken streak  | Missed day = only a slower finish date         |
| Starts empty                | Starts from an estimate (years, dates, counts) |

So Wafa is **exclusive to Qada**: salah first, with Qada fasts as a second
ledger later. It reuses Streaks' stack, tooling and UI kit, so it costs little
to build.

## Core idea

1. **Estimate the debt once.** For example "1 year" gives 365 × 5 = **1,825 fard
   prayers**. The default madhab is **Shafi'i**, so Witr (sunnah, not wajib) is
   not part of the debt unless you turn it on.
2. **Log as you pray.** One tap per prayer, or one tap for "a full day" (one of
   each).
3. **Watch it shrink.** Big remaining number, progress ring, per-prayer bars and
   a projected finish date based on your actual pace.
4. **Keep a pace, without guilt.** Set a daily target (e.g. one qada day per
   day, i.e. a qada after each fard) and get gentle reminders. The streak counts
   days you made _any_ qada, and a missed day is never shown as a failure.

## Features

### MVP (v0.1)

- **Onboarding / estimate calculator**
  - Three ways to enter it: duration (years/months/days), a date range
    (from → to), or a count per prayer entered by hand.
  - Madhab picker, **Shafi'i by default**. It only sets defaults: Witr is
    **off** for Shafi'i/Maliki/Hanbali and on for Hanafi. You can still toggle
    Witr on its own (e.g. to make it up as a recommended sunnah).
  - Per-prayer adjustment after the estimate (e.g. "I usually prayed Maghrib").
  - Days to exclude (e.g. menstruation days, entered as days per month).
- **Home**
  - Total remaining, % done, projected finish date.
  - One row per prayer: remaining count, progress bar, **+1** button
    (long-press → +N sheet).
  - **"Log full day"** button: one of each prayer in the ledger.
  - Today's progress against the daily target.
- **Overview** (a tab of its own, so it's always one tap away)
  - Target vs. completed vs. pending, as totals and %.
  - A table with one row per waqt: target, completed, pending, % done, sorted
    by pending.
  - Highlight cards: **most completed waqt**, **most pending waqt**, and the
    **least completed** waqt in % terms (the one falling behind relative to its
    own target).
  - A stacked bar per waqt (completed vs. pending) so the gaps show at a glance.
  - Balance hint: "Isha is 120 behind Fajr. Pray an extra Isha today?"
  - Period filter: all time / this month / this week. Totals stay all-time;
    "completed" counts only that period.
- **History**
  - A log of every entry with time. Undo the last entry, delete or edit any
    entry (like the day corrections in Streaks).
- **Settings**
  - Re-estimate or adjust the debt. Stored as an _adjustment_, not by rewriting
    history.
  - Theme (light/dark/auto), daily target.
- **Local only.** No account, no network.

### v0.2

- **Stats** (extends Overview with time-based charts): weekly/monthly bar
  chart, per-waqt trend lines, calendar heatmap of qada days, average pace
  (7/30-day), best day, "at this pace you finish on …" vs. "at your target
  you finish on …".
- **Reminders:** daily reminder at a chosen time (reuse Streaks'
  `notificationService`).
- **Backup:** JSON export/import via `expo-sharing` + `expo-document-picker`,
  as in Streaks.
- **Milestones:** 10%, 25%, 50% … and "first month of prayers repaid". Confetti
  stays gentle.

### Later

- **Prayer-time-aware reminders:** compute local times offline with the `adhan`
  JS library and remind you "after Dhuhr, pray a qada Dhuhr".
- **Android home-screen widget** with remaining count and +1 / full-day buttons
  (native module, same approach as `modules/habit-alarm` in Streaks).
- **App lock** (`expo-local-authentication`). Worship is private.
- **Qada fasts ledger** (Ramadan days owed), same model with a single type.
- **Niyyah helper:** shows the intention wording ("the first/last Fajr I owe")
  as plain text, with a link to ask a scholar. The app stays out of fiqh
  rulings.

## Data model

Events are the source of truth, and balances are derived from them. That keeps
undo, stats and re-estimates honest.

```ts
type Prayer = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | 'witr';

interface Ledger {
  id: string;
  kind: 'salah';                 // later: 'fast'
  createdAt: string;             // ISO
  prayers: Prayer[];             // witr included or not
  estimate: {                    // how the user arrived at it (for display/re-edit)
    method: 'duration' | 'range' | 'manual';
    input: unknown;
  };
  initial: Record<Prayer, number>;
  dailyTarget: number;           // qada *days* per day, e.g. 1
}

// Re-estimates add or remove debt without touching completions.
interface Adjustment {
  id: string;
  ledgerId: string;
  prayer: Prayer;
  delta: number;                 // +N owed or −N owed
  at: string;
  reason?: string;
}

interface QadaLog {
  id: string;
  ledgerId: string;
  prayer: Prayer;
  count: number;                 // usually 1; +N sheet allows more
  at: string;                    // ISO timestamp
  note?: string;
}

// derived
target[p]    = initial[p] + Σ adjustments[p].delta
completed[p] = Σ logs[p].count
remaining[p] = target[p] − completed[p]
pctDone[p]   = completed[p] / target[p]

// Overview selectors
mostCompleted = argmax_p completed[p]
mostPending   = argmax_p remaining[p]
furthestBehind = argmin_p pctDone[p]   // fairer when targets differ per waqt
```

These live in one pure module (`src/features/ledger/selectors.ts`) with unit
tests, so Home, Overview and Stats all read the same numbers.

Finish-date projection: `remainingTotal / avgPerDay(last 30 days)`, falling
back to the daily target when there is too little history.

## Stack

- Expo SDK 58, React Native 0.88, TypeScript 6 (Android first)
- Zustand + AsyncStorage (persist middleware)
- Expo Router (bottom tabs: Home, Overview, History, Settings; Stats joins
  Overview as a section in v0.2)
- **UI:** React Native Reusables (shadcn-style, components live in
  `src/components/ui`) on Uniwind / Tailwind v4, Lucide icons, Nunito.
  Playful look: chunky press-down buttons, per-prayer time-of-day colours,
  tokens in `src/global.css`.
- Reanimated + Gesture Handler, react-native-svg (progress ring)
- Day.js, expo-haptics (expo-notifications in v0.2)
- pnpm, ESLint 9, Prettier (+ tailwind plugin), Husky, lint-staged,
  commitlint, Vitest for the pure ledger module
- EAS builds, plus GitHub Actions CI adapted from `streaks/.github/workflows`

**Taken from Streaks:** `haptics`, motion tokens, lint/format/commit configs,
`app.config.js` variant setup (dev build with an amber icon) and the CI
workflows. Streaks' UI kit and Paper theme were deliberately _not_ reused.

## Milestones

1. **M0 – Scaffold:** `create-expo-app`, copy tooling and UI kit from Streaks,
   rename the package to `com.ask.wafa`, CI green.
2. **M1 – Ledger + logging:** onboarding calculator, store with derived
   balances, Home with +1 / full-day buttons, persistence.
3. **M2 – Overview + history:** per-waqt overview with most completed / most
   pending, log list with edit/delete, adjustments in Settings.
4. **M3 – Stats + projection:** pace, finish date, heatmap, milestones.
5. **M4 – Reminders + backup:** daily notification, JSON export/import.
6. **M5 – Extras:** widget, prayer-time reminders, app lock, fasts ledger.

## Open questions

- ~~Madhab defaults~~: decided, Shafi'i (Witr off by default).
- **Daily target unit:** "qada days per day" (5–6 prayers) or a raw prayer
  count? Leaning towards days because it is easier to reason about.
- **Name:** Wafa. Alternatives if it doesn't stick: _Qaza_ (the familiar South
  Asian term), _Sadad_ (سداد, settling a debt), _Ada_.
