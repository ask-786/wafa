import * as React from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue, withSpring } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { Spring } from '@/constants/motion';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  /** 0–1. */
  value: number;
  size?: number;
  stroke?: number;
  color: string;
  trackColor: string;
  children?: React.ReactNode;
}

/** A thick, round-capped ring that springs to its value. Children sit in the middle. */
export function ProgressRing({
  value,
  size = 180,
  stroke = 18,
  color,
  trackColor,
  children,
}: ProgressRingProps) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  // A sliver always shows, so a fresh ledger still reads as "a ring, at the start".
  const shown = clamped === 0 ? 0 : Math.max(clamped, 0.02);

  const progress = useSharedValue(0);
  React.useEffect(() => {
    progress.value = withSpring(shown, Spring.gentle);
  }, [shown, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg
        width={size}
        height={size}
        style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={trackColor}
          strokeWidth={stroke}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          fill="none"
        />
      </Svg>
      {children}
    </View>
  );
}
