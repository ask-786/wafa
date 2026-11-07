import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { ProgressBar } from '@/components/wafa/progress-bar';
import { PRAYER_META } from '@/features/ledger/prayers';
import type { PrayerBalance } from '@/features/ledger/selectors';
import { formatCount } from '@/lib/format';
import { cn } from '@/lib/utils';
import { CheckIcon } from 'lucide-react-native';
import * as React from 'react';
import { View } from 'react-native';

interface PrayerRowProps {
  balance: PrayerBalance;
  onLog: () => void;
  /** Opens the "+N" sheet. */
  onLogMany: () => void;
}

export function PrayerRow({ balance, onLog, onLogMany }: PrayerRowProps) {
  const meta = PRAYER_META[balance.prayer];
  const done = balance.remaining === 0;

  return (
    <Card className="flex-row items-center gap-3 p-3">
      <View className={cn('size-12 items-center justify-center rounded-2xl', meta.cls.soft)}>
        <Icon as={meta.icon} className={cn('size-6', meta.cls.text)} />
      </View>

      <View className="flex-1 gap-1.5">
        <View className="flex-row items-baseline justify-between gap-2">
          <Text className="font-heavy text-lg">{meta.name}</Text>
          <Text className="font-strong text-sm text-muted-foreground tabular-nums">
            {done ? 'All paid back' : `${formatCount(balance.remaining)} left`}
          </Text>
        </View>
        <ProgressBar value={balance.pct} fillClassName={meta.cls.bg} />
      </View>

      {done ? (
        <View className={cn('size-12 items-center justify-center rounded-2xl', meta.cls.soft)}>
          <Icon as={CheckIcon} className={cn('size-6', meta.cls.text)} strokeWidth={3} />
        </View>
      ) : (
        <Button
          size="icon"
          faceClassName={meta.cls.bg}
          edgeClassName={meta.cls.edge}
          textClassName={meta.cls.on}
          onPress={onLog}
          onLongPress={onLogMany}
          delayLongPress={320}
          silent
          accessibilityLabel={`Log one ${meta.name}. Long press to log several.`}
        >
          <Text className="text-lg">+1</Text>
        </Button>
      )}
    </Card>
  );
}
