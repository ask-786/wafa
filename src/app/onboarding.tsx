import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { ChipGroup, ChoiceCard } from '@/components/wafa/choice';
import { DateField } from '@/components/wafa/date-field';
import { ProgressBar } from '@/components/wafa/progress-bar';
import { Stepper } from '@/components/wafa/stepper';
import {
  daysCovered,
  estimateCounts,
  excludedDays,
  prayersFor,
  sumCounts,
  witrOwedByDefault,
} from '@/features/ledger/estimate';
import { MADHAB_META, PRAYER_META } from '@/features/ledger/prayers';
import {
  emptyCounts,
  MADHABS,
  type EstimateInput,
  type Madhab,
  type PrayerCounts,
} from '@/features/ledger/types';
import { formatCount, formatSpan } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useWafa } from '@/store/useWafa';
import { haptics } from '@/utils/haptics';
import dayjs from 'dayjs';
import { router } from 'expo-router';
import {
  CalendarRangeIcon,
  ChevronLeftIcon,
  HandHeartIcon,
  HourglassIcon,
  ListOrderedIcon,
  MoonIcon,
  SparklesIcon,
  TrendingDownIcon,
  type LucideIcon,
} from 'lucide-react-native';
import * as React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Method = EstimateInput['method'];
type Step = 'welcome' | 'madhab' | 'method' | 'amount' | 'exclude' | 'review';

const METHODS: { value: Method; title: string; description: string; icon: LucideIcon }[] = [
  {
    value: 'duration',
    title: 'A length of time',
    description: 'e.g. "about 2 years"',
    icon: HourglassIcon,
  },
  {
    value: 'range',
    title: 'Between two dates',
    description: 'From when it started to when you resumed',
    icon: CalendarRangeIcon,
  },
  {
    value: 'manual',
    title: 'I know my counts',
    description: 'Enter a number for each prayer',
    icon: ListOrderedIcon,
  },
];

const TARGETS = [
  { value: '1', label: '1 day' },
  { value: '2', label: '2 days' },
  { value: '3', label: '3 days' },
];

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const createLedger = useWafa((s) => s.createLedger);

  const [step, setStep] = React.useState<Step>('welcome');
  const [madhab, setMadhab] = React.useState<Madhab>('shafii');
  const [witr, setWitr] = React.useState(false);
  const [method, setMethod] = React.useState<Method>('duration');
  const [years, setYears] = React.useState(1);
  const [months, setMonths] = React.useState(0);
  const [days, setDays] = React.useState(0);
  const [from, setFrom] = React.useState(dayjs().subtract(1, 'year').format('YYYY-MM-DD'));
  const [to, setTo] = React.useState(dayjs().format('YYYY-MM-DD'));
  const [manual, setManual] = React.useState<PrayerCounts>(emptyCounts());
  const [excluded, setExcluded] = React.useState(0);
  const [counts, setCounts] = React.useState<PrayerCounts>(emptyCounts());
  const [target, setTarget] = React.useState('1');

  const prayers = prayersFor(witr);
  const input: EstimateInput =
    method === 'duration'
      ? { method, years, months, days }
      : method === 'range'
        ? { method, from, to }
        : { method, counts: manual };
  const covered = daysCovered(input);

  const steps: Step[] =
    method === 'manual'
      ? ['welcome', 'madhab', 'method', 'amount', 'review']
      : ['welcome', 'madhab', 'method', 'amount', 'exclude', 'review'];
  const index = steps.indexOf(step);

  const go = (next: Step) => {
    if (next === 'review') setCounts(estimateCounts(input, prayers, excluded));
    setStep(next);
  };
  const back = () => index > 0 && setStep(steps[index - 1]);
  const next = () => index < steps.length - 1 && go(steps[index + 1]);

  const amountValid = method === 'manual' ? sumCounts(manual, prayers) > 0 : (covered ?? 0) > 0;
  const total = sumCounts(counts, prayers);

  const finish = () => {
    haptics.success();
    createLedger({
      madhab,
      prayers,
      estimate: { input, excludedDaysPerMonth: method === 'manual' ? 0 : excluded },
      initial: counts,
      dailyTarget: Number(target),
    });
    router.replace('/');
  };

  const pickMadhab = (m: Madhab) => {
    setMadhab(m);
    setWitr(witrOwedByDefault(m));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top + 8, paddingBottom: Math.max(insets.bottom, 16) }}
    >
      {step !== 'welcome' ? (
        <View className="flex-row items-center gap-3 px-3">
          <Button variant="ghost" size="icon-sm" onPress={back} accessibilityLabel="Back">
            <Icon as={ChevronLeftIcon} className="size-6" />
          </Button>
          <ProgressBar value={index / (steps.length - 1)} className="flex-1" />
          <View className="w-10" />
        </View>
      ) : null}

      <ScrollView
        contentContainerClassName="grow gap-4 px-5 pt-4 pb-6"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          key={step}
          entering={step === 'welcome' ? FadeInDown.springify() : FadeInRight.springify()}
          className="grow gap-4"
        >
          {step === 'welcome' ? (
            <Welcome />
          ) : step === 'madhab' ? (
            <>
              <Heading
                title="Which school do you follow?"
                sub="This only sets whether Witr counts as owed. You can change it below."
              />
              <ChipGroup
                options={MADHABS.map((m) => ({ value: m, label: MADHAB_META[m].name }))}
                value={madhab}
                onChange={pickMadhab}
              />
              <Card className="mt-2 flex-row items-center gap-3">
                <View
                  className={cn(
                    'size-12 items-center justify-center rounded-2xl',
                    PRAYER_META.witr.cls.soft,
                  )}
                >
                  <Icon
                    as={PRAYER_META.witr.icon}
                    className={cn('size-6', PRAYER_META.witr.cls.text)}
                  />
                </View>
                <View className="flex-1">
                  <Text className="font-heavy text-lg">Make up Witr too</Text>
                  <Text variant="muted">{MADHAB_META[madhab].witr} in your school</Text>
                </View>
                <Switch
                  checked={witr}
                  onCheckedChange={(v) => {
                    haptics.toggle(v);
                    setWitr(v);
                  }}
                />
              </Card>
            </>
          ) : step === 'method' ? (
            <>
              <Heading
                title="How would you like to estimate?"
                sub="A rough number is fine. You can adjust each prayer later."
              />
              {METHODS.map((m) => (
                <ChoiceCard
                  key={m.value}
                  selected={method === m.value}
                  onPress={() => setMethod(m.value)}
                  title={m.title}
                  description={m.description}
                  icon={m.icon}
                />
              ))}
            </>
          ) : step === 'amount' ? (
            method === 'duration' ? (
              <>
                <Heading
                  title="Roughly how long?"
                  sub="The time you missed prayers, from puberty onwards."
                />
                <Card className="gap-4">
                  <Stepper label="Years" value={years} onChange={setYears} max={80} />
                  <Stepper label="Months" value={months} onChange={setMonths} max={11} />
                  <Stepper label="Days" value={days} onChange={setDays} max={30} />
                </Card>
                <CoveredNote days={covered ?? 0} prayers={prayers.length} />
              </>
            ) : method === 'range' ? (
              <>
                <Heading title="Between which dates?" sub="Both days count." />
                <Card className="gap-4">
                  <DateField
                    label="From"
                    value={from}
                    onChange={setFrom}
                    maximumDate={new Date()}
                  />
                  <DateField label="To" value={to} onChange={setTo} maximumDate={new Date()} />
                </Card>
                {(covered ?? 0) > 0 ? (
                  <CoveredNote days={covered ?? 0} prayers={prayers.length} />
                ) : (
                  <Text className="font-strong text-destructive">
                    The end date needs to be after the start.
                  </Text>
                )}
              </>
            ) : (
              <>
                <Heading title="How many of each?" sub="Tap a number to type it." />
                <Card className="gap-4">
                  {prayers.map((p) => (
                    <Stepper
                      key={p}
                      label={PRAYER_META[p].name}
                      value={manual[p]}
                      onChange={(v) => setManual((c) => ({ ...c, [p]: v }))}
                      step={10}
                    />
                  ))}
                </Card>
              </>
            )
          ) : step === 'exclude' ? (
            <>
              <Heading
                title="Any days that weren't owed?"
                sub="For example, menstruation days, when prayer isn't required and needn't be made up. Leave at 0 if it doesn't apply."
              />
              <Card className="gap-3">
                <Stepper label="Days each month" value={excluded} onChange={setExcluded} max={15} />
              </Card>
              {excluded > 0 && covered ? (
                <Text variant="muted" className="px-1">
                  That takes {formatCount(excludedDays(covered, excluded))} days off the estimate.
                </Text>
              ) : null}
            </>
          ) : (
            <>
              <View className="items-center gap-1 rounded-[32px] border-b-[6px] border-primary-edge bg-primary p-6">
                <Text className="font-strong text-primary-foreground/85">Your qada</Text>
                <Text className="font-display text-6xl leading-[68px] text-primary-foreground tabular-nums">
                  {formatCount(total)}
                </Text>
                <Text className="font-strong text-primary-foreground/85">
                  prayers to repay, in shaa Allah
                </Text>
              </View>
              <Text variant="eyebrow" className="mt-2">
                Fine-tune each prayer
              </Text>
              <Card className="gap-4">
                {prayers.map((p) => (
                  <View key={p} className="flex-row items-center gap-3">
                    <View
                      className={cn(
                        'size-9 items-center justify-center rounded-xl',
                        PRAYER_META[p].cls.soft,
                      )}
                    >
                      <Icon
                        as={PRAYER_META[p].icon}
                        className={cn('size-5', PRAYER_META[p].cls.text)}
                      />
                    </View>
                    <Stepper
                      label={PRAYER_META[p].name}
                      value={counts[p]}
                      onChange={(v) => setCounts((c) => ({ ...c, [p]: v }))}
                      className="flex-1"
                    />
                  </View>
                ))}
              </Card>
              <Text variant="eyebrow" className="mt-2">
                Daily pace
              </Text>
              <Card className="gap-3">
                <Text className="font-heavy text-lg">How many qada days each day?</Text>
                <ChipGroup options={TARGETS} value={target} onChange={setTarget} />
                <Text variant="muted">
                  {target === '1'
                    ? 'One qada after each fard. A gentle, steady pace.'
                    : `${Number(target) * prayers.length} prayers a day. Ambitious, maa shaa Allah!`}
                </Text>
              </Card>
            </>
          )}
        </Animated.View>
      </ScrollView>

      <View className="px-5 pt-2">
        {step === 'welcome' ? (
          <Button size="lg" onPress={next}>
            <Text>Let's begin</Text>
          </Button>
        ) : step === 'review' ? (
          <Button size="lg" onPress={finish} disabled={total === 0}>
            <Icon as={SparklesIcon} className="size-5 text-primary-foreground" />
            <Text>Start repaying</Text>
          </Button>
        ) : (
          <Button size="lg" onPress={next} disabled={step === 'amount' && !amountValid}>
            <Text>Continue</Text>
          </Button>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

function Heading({ title, sub }: { title: string; sub?: string }) {
  return (
    <View className="gap-2 pb-2">
      <Text variant="title">{title}</Text>
      {sub ? <Text variant="lead">{sub}</Text> : null}
    </View>
  );
}

function CoveredNote({ days, prayers }: { days: number; prayers: number }) {
  if (days <= 0) return null;
  return (
    <View className="flex-row items-center gap-3 rounded-2xl bg-accent p-4">
      <Icon as={SparklesIcon} className="size-5 text-accent-foreground" />
      <Text className="flex-1 font-strong text-accent-foreground">
        {formatSpan(days)}, about {formatCount(days * prayers)} prayers
      </Text>
    </View>
  );
}

const WELCOME_POINTS: {
  icon: LucideIcon;
  title: string;
  body: string;
  bubble: string;
  tint: string;
}[] = [
  {
    icon: HandHeartIcon,
    title: 'Estimate what you owe',
    body: 'A rough number is enough to begin.',
    bubble: 'bg-fajr-soft',
    tint: 'text-fajr',
  },
  {
    icon: SparklesIcon,
    title: 'Tap +1 as you pray',
    body: 'Or log a whole day in one go.',
    bubble: 'bg-dhuhr-soft',
    tint: 'text-dhuhr',
  },
  {
    icon: TrendingDownIcon,
    title: 'Watch it shrink',
    body: 'No guilt, no broken streaks. Just steady progress.',
    bubble: 'bg-isha-soft',
    tint: 'text-isha',
  },
];

function Welcome() {
  return (
    <View className="grow justify-center gap-8 pt-8">
      <View className="items-center gap-4">
        <View className="size-28 items-center justify-center rounded-[36px] border-b-[6px] border-primary-edge bg-primary">
          <Icon as={MoonIcon} className="size-14 text-[#FFF8EC]" fill="#FFF8EC" />
          <View className="absolute top-4 right-4">
            <Icon as={SparklesIcon} className="size-6 text-sun" fill="#FFC93C" />
          </View>
        </View>
        <View className="items-center gap-1">
          <Text className="font-display text-5xl leading-[56px]">Wafa</Text>
          <Text className="text-xl text-muted-foreground">وفاء</Text>
        </View>
        <Text variant="lead" className="max-w-xs text-center">
          Every prayer you make up is one more paid back.
        </Text>
      </View>
      <View className="gap-3">
        {WELCOME_POINTS.map((p, i) => (
          <Animated.View key={p.title} entering={FadeInDown.delay(150 + i * 90).springify()}>
            <Card className="flex-row items-center gap-3">
              <View className={cn('size-12 items-center justify-center rounded-2xl', p.bubble)}>
                <Icon as={p.icon} className={cn('size-6', p.tint)} />
              </View>
              <View className="flex-1">
                <Text className="font-heavy text-lg">{p.title}</Text>
                <Text variant="muted">{p.body}</Text>
              </View>
            </Card>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}
