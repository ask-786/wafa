import * as React from 'react';
import { Modal, Pressable, View } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spring } from '@/constants/motion';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/** A bottom sheet that springs up. Tap the backdrop or press back to close. */
export function Sheet({ open, onClose, children }: SheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={open}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View entering={FadeIn.duration(160)} style={{ flex: 1 }}>
        <Pressable className="flex-1 bg-black/40" onPress={onClose} accessibilityLabel="Close" />
      </Animated.View>
      <Animated.View
        entering={SlideInDown.springify()
          .damping(Spring.gentle.damping)
          .stiffness(Spring.gentle.stiffness)}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}
      >
        <View
          className="rounded-t-[32px] border-2 border-b-0 border-border bg-card px-5 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }}
        >
          <View className="mb-4 h-1.5 w-12 self-center rounded-full bg-muted" />
          {children}
        </View>
      </Animated.View>
    </Modal>
  );
}
