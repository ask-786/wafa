import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/haptics';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { HouseIcon, SettingsIcon, type LucideIcon } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ICONS: Record<string, LucideIcon> = {
  index: HouseIcon,
  settings: SettingsIcon,
};

/**
 * A floating pill of tabs. The active tab becomes a little chunky chip, the
 * same press-down language as the buttons.
 */
export function TabBar({ state, descriptors, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="bg-background px-5 pt-2"
      style={{ paddingBottom: Math.max(insets.bottom, 12) }}
    >
      <View className="flex-row gap-1 rounded-[28px] border-2 border-b-4 border-border bg-card p-1.5">
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const { options } = descriptors[route.key];
          const label = options.title ?? route.name;

          const onPress = () => {
            const event = emitter.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              haptics.selection();
              navigateToTab(route.key);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              role="tab"
              aria-selected={focused}
              accessibilityLabel={label}
              className={cn(
                'flex-1 flex-row items-center justify-center gap-2 rounded-[22px] py-3',
                focused && 'bg-secondary',
              )}
            >
              <Icon
                as={ICONS[route.name] ?? HouseIcon}
                className={cn(
                  'size-5',
                  focused ? 'text-secondary-foreground' : 'text-muted-foreground',
                )}
                strokeWidth={focused ? 2.6 : 2}
              />
              {focused ? (
                <Text className="font-heavy text-secondary-foreground">{label}</Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
