import { cn } from '@/lib/utils';
import * as React from 'react';
import { View } from 'react-native';

interface ProgressBarProps {
  /** 0–1. */
  value: number;
  /** Fill colour class, e.g. `bg-fajr`. */
  fillClassName?: string;
  className?: string;
}

/** Fat, rounded bar with a little highlight stripe on the fill. */
export function ProgressBar({ value, fillClassName = 'bg-primary', className }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  // Keep a visible nub once there's any progress at all.
  const width = pct === 0 ? 0 : Math.max(pct * 100, 4);
  return (
    <View className={cn('h-3 w-full overflow-hidden rounded-full bg-muted', className)}>
      <View className={cn('h-full rounded-full', fillClassName)} style={{ width: `${width}%` }}>
        <View className="mx-2 mt-0.5 h-1 rounded-full bg-white/35" />
      </View>
    </View>
  );
}
