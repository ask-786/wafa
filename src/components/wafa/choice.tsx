import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/haptics';
import { CheckIcon, type LucideIcon } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';

interface ChoiceCardProps {
  selected: boolean;
  onPress: () => void;
  title: string;
  description?: string;
  icon?: LucideIcon;
  /** Soft background + text class for the icon bubble. */
  iconClassName?: string;
  iconBubbleClassName?: string;
}

/** A big tappable option. Selected ones get a green outline and a tick. */
export function ChoiceCard({
  selected,
  onPress,
  title,
  description,
  icon,
  iconClassName = 'text-primary',
  iconBubbleClassName = 'bg-secondary',
}: ChoiceCardProps) {
  return (
    <Pressable
      onPress={() => {
        if (!selected) haptics.selection();
        onPress();
      }}
      role="radio"
      aria-checked={selected}
      className={cn(
        'flex-row items-center gap-3 rounded-3xl border-2 border-b-4 bg-card p-4 active:opacity-80',
        selected ? 'border-primary bg-secondary' : 'border-border',
      )}
    >
      {icon ? (
        <View
          className={cn('size-12 items-center justify-center rounded-2xl', iconBubbleClassName)}
        >
          <Icon as={icon} className={cn('size-6', iconClassName)} />
        </View>
      ) : null}
      <View className="flex-1 gap-0.5">
        <Text className="font-heavy text-lg">{title}</Text>
        {description ? <Text variant="muted">{description}</Text> : null}
      </View>
      <View
        className={cn(
          'size-7 items-center justify-center rounded-full border-2',
          selected ? 'border-primary bg-primary' : 'border-input',
        )}
      >
        {selected ? (
          <Icon as={CheckIcon} className="size-4 text-primary-foreground" strokeWidth={3.5} />
        ) : null}
      </View>
    </Pressable>
  );
}

interface ChipGroupProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/** A row of pill options; exactly one is on. */
export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  className,
}: ChipGroupProps<T>) {
  return (
    <View className={cn('flex-row flex-wrap gap-2', className)} role="radiogroup">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => {
              if (!on) haptics.selection();
              onChange(o.value);
            }}
            role="radio"
            aria-checked={on}
            className={cn(
              'rounded-full border-2 border-b-4 px-4 py-2 active:opacity-80',
              on ? 'border-primary-edge bg-primary' : 'border-border bg-card',
            )}
          >
            <Text className={cn('font-heavy', on ? 'text-primary-foreground' : 'text-foreground')}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
