import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import { CalendarIcon } from 'lucide-react-native';
import * as React from 'react';
import { Platform, Pressable, View } from 'react-native';

interface DateFieldProps {
  label: string;
  /** `YYYY-MM-DD`. */
  value: string;
  onChange: (value: string) => void;
  maximumDate?: Date;
}

/** A chunky date field. Android opens the system calendar; web gets a text box. */
export function DateField({ label, value, onChange, maximumDate }: DateFieldProps) {
  if (Platform.OS !== 'android') {
    return (
      <View className="gap-1.5">
        <Text className="font-strong">{label}</Text>
        <Input
          value={value}
          onChangeText={onChange}
          placeholder="YYYY-MM-DD"
          className="h-12 rounded-2xl"
        />
      </View>
    );
  }

  const open = () =>
    DateTimePickerAndroid.open({
      value: dayjs(value).isValid() ? dayjs(value).toDate() : new Date(),
      mode: 'date',
      maximumDate,
      onChange: (event, date) => {
        if (event.type === 'set' && date) onChange(dayjs(date).format('YYYY-MM-DD'));
      },
    });

  return (
    <View className="gap-1.5">
      <Text className="font-strong">{label}</Text>
      <Pressable
        onPress={open}
        role="button"
        className="flex-row items-center gap-3 rounded-2xl border-2 border-b-4 border-border bg-card px-4 py-3 active:opacity-80"
      >
        <Icon as={CalendarIcon} className="size-5 text-primary" />
        <Text className="font-heavy text-lg">
          {dayjs(value).isValid() ? dayjs(value).format('D MMMM YYYY') : 'Pick a date'}
        </Text>
      </Pressable>
    </View>
  );
}
