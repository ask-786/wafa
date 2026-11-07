import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { ChipGroup } from '@/components/wafa/choice';
import { Stepper } from '@/components/wafa/stepper';
import { MADHAB_META, PRAYER_META } from '@/features/ledger/prayers';
import { dailyGoal } from '@/features/ledger/selectors';
import { useWafa, type ThemePreference } from '@/store/useWafa';
import { haptics } from '@/utils/haptics';
import dayjs from 'dayjs';
import { router } from 'expo-router';
import { RotateCcwIcon } from 'lucide-react-native';
import * as React from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const THEMES: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'Auto' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const ledger = useWafa((s) => s.ledger);
  const theme = useWafa((s) => s.theme);
  const setTheme = useWafa((s) => s.setTheme);
  const setDailyTarget = useWafa((s) => s.setDailyTarget);
  const reset = useWafa((s) => s.reset);

  if (!ledger) return null;

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-4 px-5 pb-10"
      contentContainerStyle={{ paddingTop: insets.top + 12 }}
    >
      <Text variant="title">Settings</Text>

      <Card className="gap-3">
        <Text variant="h3">Daily target</Text>
        <Stepper
          label="Days per day"
          value={ledger.dailyTarget}
          onChange={setDailyTarget}
          min={1}
          max={5}
        />
        <Text variant="muted">
          That's {dailyGoal(ledger)} prayers a day. One day per day means a qada after each fard.
        </Text>
      </Card>

      <Card className="gap-3">
        <Text variant="h3">Appearance</Text>
        <ChipGroup options={THEMES} value={theme} onChange={setTheme} />
      </Card>

      <Card className="gap-2">
        <Text variant="h3">Your ledger</Text>
        <Row label="Madhab" value={MADHAB_META[ledger.madhab].name} />
        <Row label="Prayers" value={ledger.prayers.map((p) => PRAYER_META[p].name).join(', ')} />
        <Row label="Started" value={dayjs(ledger.createdAt).format('D MMM YYYY')} />
      </Card>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="secondary" className="mt-2" textClassName="text-destructive">
            <Icon as={RotateCcwIcon} className="size-5 text-destructive" />
            <Text>Start over</Text>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start over?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes your estimate and every prayer you've logged. It can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Text>Keep my ledger</Text>
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onPress={() => {
                haptics.error();
                reset();
                router.replace('/onboarding');
              }}
            >
              <Text>Delete everything</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-4 py-1">
      <Text className="text-muted-foreground">{label}</Text>
      <Text className="flex-1 text-right font-strong">{value}</Text>
    </View>
  );
}
