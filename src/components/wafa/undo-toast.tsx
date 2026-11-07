import { Text } from '@/components/ui/text';
import { haptics } from '@/utils/haptics';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeOutDown, ZoomIn } from 'react-native-reanimated';

export interface ToastData {
  /** Changes per toast so a new log restarts the timer. */
  key: string;
  message: string;
  onUndo?: () => void;
}

interface UndoToastProps {
  toast: ToastData | null;
  onDismiss: () => void;
  durationMs?: number;
}

/** Pops up after a log: "Fajr logged · Undo". Fades away on its own. */
export function UndoToast({ toast, onDismiss, durationMs = 4000 }: UndoToastProps) {
  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(t);
  }, [toast, onDismiss, durationMs]);

  if (!toast) return null;

  return (
    <View pointerEvents="box-none" className="absolute inset-x-0 bottom-3 items-center px-4">
      <Animated.View
        key={toast.key}
        entering={ZoomIn.springify().damping(14)}
        exiting={FadeOutDown}
      >
        <View className="flex-row items-center gap-4 rounded-full bg-foreground py-2 pr-2 pl-5">
          <Text className="font-strong text-background">{toast.message}</Text>
          {toast.onUndo ? (
            <Pressable
              onPress={() => {
                haptics.light();
                toast.onUndo?.();
                onDismiss();
              }}
              className="rounded-full bg-background/15 px-4 py-2 active:opacity-70"
              accessibilityRole="button"
            >
              <Text className="font-heavy text-sun dark:text-primary-edge">Undo</Text>
            </Pressable>
          ) : null}
        </View>
      </Animated.View>
    </View>
  );
}
