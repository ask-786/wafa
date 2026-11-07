/** 1825 → "1,825". Fixed to en so digits group the same way everywhere. */
export const formatCount = (n: number): string => Math.round(n).toLocaleString('en-US');

/** 0.4567 → "46%". Rounds down so "100%" only ever means done. */
export const formatPct = (ratio: number): string =>
  `${Math.floor(Math.max(0, Math.min(1, ratio)) * 100)}%`;

/** Days → "about 3 years", "about 4 months", "12 days". */
export const formatSpan = (days: number): string => {
  if (days < 45) return `${days} day${days === 1 ? '' : 's'}`;
  if (days < 365 * 1.5) {
    const m = Math.round(days / 30);
    return `about ${m} month${m === 1 ? '' : 's'}`;
  }
  const y = Math.round((days / 365) * 2) / 2;
  return `about ${y} years`;
};
