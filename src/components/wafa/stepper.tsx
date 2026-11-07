import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/haptics';
import { MinusIcon, PlusIcon } from 'lucide-react-native';
import * as React from 'react';
import { TextInput, View } from 'react-native';

interface StepperProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Small text after the number, e.g. "years". */
  unit?: string;
  className?: string;
}

/**
 * − [ 12 ] +, with the number typeable too. Holding a button would be nicer;
 * typing covers the "I owe 1,400 Fajr" case without it.
 */
export function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = 99_999,
  step = 1,
  unit,
  className,
}: StepperProps) {
  // Only exists while the field is being typed in; otherwise the prop shows.
  const [draft, setDraft] = React.useState<string | null>(null);

  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  const bump = (d: number) => {
    const next = clamp(value + d);
    if (next !== value) {
      haptics.selection();
      onChange(next);
    }
  };
  const commit = () => {
    if (draft === null) return;
    const n = parseInt(draft.replace(/[^0-9]/g, ''), 10);
    const next = clamp(Number.isFinite(n) ? n : min);
    setDraft(null);
    if (next !== value) onChange(next);
  };

  return (
    <View className={cn('flex-row items-center gap-3', className)}>
      {label ? (
        <Text className="min-w-0 flex-1 font-strong text-base" numberOfLines={1}>
          {label}
        </Text>
      ) : null}
      <Button
        variant="secondary"
        size="icon-sm"
        silent
        disabled={value <= min}
        onPress={() => bump(-step)}
        accessibilityLabel={`Less${label ? ` ${label}` : ''}`}
      >
        <Icon as={MinusIcon} className="size-5 text-foreground" />
      </Button>
      <View className="w-20 items-center">
        <TextInput
          value={draft ?? String(value)}
          onFocus={() => setDraft(String(value))}
          onChangeText={setDraft}
          onBlur={commit}
          onSubmitEditing={commit}
          keyboardType="number-pad"
          selectTextOnFocus
          className="w-20 p-0 text-center font-display text-2xl text-foreground"
          accessibilityLabel={label}
        />
        {unit ? <Text className="-mt-1 text-xs text-muted-foreground">{unit}</Text> : null}
      </View>
      <Button
        variant="secondary"
        size="icon-sm"
        silent
        disabled={value >= max}
        onPress={() => bump(step)}
        accessibilityLabel={`More${label ? ` ${label}` : ''}`}
      >
        <Icon as={PlusIcon} className="size-5 text-foreground" />
      </Button>
    </View>
  );
}
