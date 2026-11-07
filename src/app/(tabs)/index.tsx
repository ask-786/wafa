import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { PrayerRow } from '@/components/wafa/prayer-row';
import { ProgressRing } from '@/components/wafa/progress-ring';
import { Sheet } from '@/components/wafa/sheet';
import { Stepper } from '@/components/wafa/stepper';
import { UndoToast, type ToastData } from '@/components/wafa/undo-toast';
import { PRAYER_META } from '@/features/ledger/prayers';
import {
  balances,
  countOnDay,
  dailyGoal,
  projection,
  streak,
  totals,
} from '@/features/ledger/selectors';
import type { Prayer } from '@/features/ledger/types';
import { formatCount, formatPct } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useWafa } from '@/store/useWafa';
import { haptics } from '@/utils/haptics';
import dayjs from 'dayjs';
import { CalendarCheckIcon, FlameIcon, PartyPopperIcon, SparklesIcon } from 'lucide-react-native';
import * as React from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Up to this many goal pips are drawn as dots; past it, a count reads better. */
const MAX_PIPS = 12;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const ledger = useWafa((s) => s.ledger)!;
  const adjustments = useWafa((s) => s.adjustments);
  const logs = useWafa((s) => s.logs);
  const logPrayer = useWafa((s) => s.logPrayer);
  const logFullDay = useWafa((s) => s.logFullDay);
  const undoBatch = useWafa((s) => s.undoBatch);

  const [toast, setToast] = React.useState<ToastData | null>(null);
  const [sheetPrayer, setSheetPrayer] = React.useState<Prayer | null>(null);
  const [many, setMany] = React.useState(2);

  const now = new Date();
  const rows = balances(ledger, adjustments, logs);
  const total = totals(rows);
  const today = countOnDay(logs, ledger.id, now);
  const goal = dailyGoal(ledger);
  const days = streak(logs, ledger.id, now);
  const plan = projection(ledger, total.remaining, logs, now);
  const allDone = total.target > 0 && total.remaining === 0;

  const showUndo = (message: string, batchId: string | null) => {
    if (!batchId) return;
    haptics.success();
    setToast({ key: batchId, message, onUndo: () => undoBatch(batchId) });
  };

  const dismissToast = React.useCallback(() => setToast(null), []);

  const sheetRow = rows.find((r) => r.prayer === sheetPrayer);
  const openMany = (prayer: Prayer) => {
    const left = rows.find((r) => r.prayer === prayer)?.remaining ?? 1;
    setMany(Math.max(1, Math.min(2, left)));
    setSheetPrayer(prayer);
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerClassName="gap-4 px-5 pb-28"
        contentContainerStyle={{ paddingTop: insets.top + 12 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.springify()}
          className="flex-row items-end justify-between"
        >
          <View className="gap-1">
            <Text variant="eyebrow">{dayjs(now).format('dddd, D MMM')}</Text>
            <Text variant="h2">Assalamu alaikum</Text>
          </View>
          <View
            className={cn(
              'flex-row items-center gap-1.5 rounded-full px-3 py-1.5',
              days > 0 ? 'bg-accent' : 'bg-muted',
            )}
            accessibilityLabel={`${days} day streak`}
          >
            <Icon
              as={FlameIcon}
              className={cn(
                'size-4',
                days > 0 ? 'text-accent-foreground' : 'text-muted-foreground',
              )}
            />
            <Text
              className={cn(
                'font-heavy tabular-nums',
                days > 0 ? 'text-accent-foreground' : 'text-muted-foreground',
              )}
            >
              {days}
            </Text>
          </View>
        </Animated.View>

        {/* Hero */}
        <Animated.View entering={FadeInDown.delay(60).springify()}>
          <View className="flex-row items-center gap-5 rounded-[32px] border-b-[6px] border-primary-edge bg-primary p-5">
            <ProgressRing
              value={total.pct}
              size={128}
              stroke={16}
              color="#FFC93C"
              trackColor="rgba(255,255,255,0.25)"
            >
              <Text className="font-display text-3xl text-primary-foreground tabular-nums">
                {formatPct(total.pct)}
              </Text>
              <Text className="-mt-1 font-strong text-xs text-primary-foreground/80">done</Text>
            </ProgressRing>
            <View className="flex-1 gap-1">
              {allDone ? (
                <>
                  <Icon as={PartyPopperIcon} className="size-8 text-sun" />
                  <Text className="font-display text-2xl text-primary-foreground">
                    All paid back!
                  </Text>
                  <Text className="text-primary-foreground/85">May Allah accept every one.</Text>
                </>
              ) : (
                <>
                  <Text className="font-display text-[40px] leading-[44px] text-primary-foreground tabular-nums">
                    {formatCount(total.remaining)}
                  </Text>
                  <Text className="font-strong text-primary-foreground/85">
                    prayers left to repay
                  </Text>
                  {plan.finish ? (
                    <View className="mt-2 flex-row items-center gap-1.5 self-start rounded-full bg-white/20 px-3 py-1">
                      <Icon as={CalendarCheckIcon} className="size-3.5 text-primary-foreground" />
                      <Text className="font-strong text-xs text-primary-foreground">
                        {plan.basis === 'target' ? 'On target: ' : 'At your pace: '}
                        {dayjs(plan.finish).format(plan.daysLeft! < 60 ? 'D MMM' : 'MMM YYYY')}
                      </Text>
                    </View>
                  ) : null}
                </>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Today */}
        {!allDone ? (
          <Animated.View entering={FadeInDown.delay(120).springify()}>
            <Card className="gap-3">
              <View className="flex-row items-baseline justify-between">
                <Text variant="h3">Today</Text>
                <Text className="font-strong text-muted-foreground tabular-nums">
                  {today} / {goal || '—'}
                </Text>
              </View>
              {goal > 0 && goal <= MAX_PIPS ? (
                <View className="flex-row gap-1.5">
                  {Array.from({ length: goal }).map((_, i) => (
                    <View
                      key={i}
                      className={cn(
                        'h-3 flex-1 rounded-full',
                        i < today ? 'bg-primary' : 'bg-muted',
                      )}
                    />
                  ))}
                </View>
              ) : null}
              <Text variant="muted">
                {goal > 0 && today >= goal
                  ? "Today's goal is met, masha'Allah. Anything more is a bonus."
                  : today > 0
                    ? 'Lovely start. Every one counts.'
                    : 'Try one qada after each fard today.'}
              </Text>
            </Card>
          </Animated.View>
        ) : null}

        {/* Full day */}
        {!allDone ? (
          <Animated.View entering={FadeInDown.delay(160).springify()}>
            <Button
              size="lg"
              silent
              onPress={() => showUndo('Full day logged', logFullDay())}
              accessibilityLabel="Log a full day: one of each prayer"
            >
              <Icon as={SparklesIcon} className="size-5 text-primary-foreground" />
              <Text>Log a full day</Text>
            </Button>
          </Animated.View>
        ) : null}

        {/* Prayers */}
        <Text variant="eyebrow" className="mt-2">
          Your prayers · hold +1 for more
        </Text>
        {rows.map((row, i) => (
          <Animated.View key={row.prayer} entering={FadeInDown.delay(200 + i * 40).springify()}>
            <PrayerRow
              balance={row}
              onLog={() =>
                showUndo(`${PRAYER_META[row.prayer].name} logged`, logPrayer(row.prayer))
              }
              onLogMany={() => openMany(row.prayer)}
            />
          </Animated.View>
        ))}
      </ScrollView>

      <UndoToast toast={toast} onDismiss={dismissToast} />

      <Sheet open={!!sheetRow} onClose={() => setSheetPrayer(null)}>
        {sheetRow ? (
          <View className="gap-5">
            <View className="flex-row items-center gap-3">
              <View
                className={cn(
                  'size-12 items-center justify-center rounded-2xl',
                  PRAYER_META[sheetRow.prayer].cls.soft,
                )}
              >
                <Icon
                  as={PRAYER_META[sheetRow.prayer].icon}
                  className={cn('size-6', PRAYER_META[sheetRow.prayer].cls.text)}
                />
              </View>
              <View className="flex-1">
                <Text variant="h3">How many {PRAYER_META[sheetRow.prayer].name}?</Text>
                <Text variant="muted">{formatCount(sheetRow.remaining)} left to repay</Text>
              </View>
            </View>
            <Stepper
              value={many}
              onChange={setMany}
              min={1}
              max={sheetRow.remaining}
              className="justify-center"
            />
            <Button
              size="lg"
              silent
              faceClassName={PRAYER_META[sheetRow.prayer].cls.bg}
              edgeClassName={PRAYER_META[sheetRow.prayer].cls.edge}
              textClassName={PRAYER_META[sheetRow.prayer].cls.on}
              onPress={() => {
                const name = PRAYER_META[sheetRow.prayer].name;
                const batch = logPrayer(sheetRow.prayer, many);
                setSheetPrayer(null);
                showUndo(`${many} ${name} logged`, batch);
              }}
            >
              <Text>
                Log {many} {PRAYER_META[sheetRow.prayer].name}
              </Text>
            </Button>
          </View>
        ) : null}
      </Sheet>
    </View>
  );
}
