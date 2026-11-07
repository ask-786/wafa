import { TextClassContext } from '@/components/ui/text';
import { haptics } from '@/utils/haptics';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { Pressable, View, type GestureResponderEvent } from 'react-native';

/**
 * The chunky button. A face sits on a darker "edge" a few pixels below it;
 * pressing pushes the face down onto the edge, like a real key. Ghost and link
 * buttons have no edge and simply dim.
 */

const EDGE = 4;

const faceVariants = cva('flex-row items-center justify-center gap-2 rounded-2xl', {
  variants: {
    variant: {
      default: 'bg-primary',
      secondary: 'border-2 border-border bg-card',
      destructive: 'bg-destructive',
      sun: 'bg-sun',
      ghost: '',
      link: '',
    },
    size: {
      default: 'h-12 px-5',
      sm: 'h-10 rounded-xl px-4',
      lg: 'h-14 px-6',
      icon: 'h-12 w-12',
      'icon-sm': 'h-10 w-10 rounded-xl',
    },
  },
  defaultVariants: { variant: 'default', size: 'default' },
});

const edgeVariants = cva('absolute inset-x-0 bottom-0 rounded-2xl', {
  variants: {
    variant: {
      default: 'bg-primary-edge',
      secondary: 'bg-edge',
      destructive: 'bg-destructive-edge',
      sun: 'bg-dhuhr-edge',
      ghost: 'hidden',
      link: 'hidden',
    },
    size: { default: '', sm: 'rounded-xl', lg: '', icon: '', 'icon-sm': 'rounded-xl' },
  },
  defaultVariants: { variant: 'default', size: 'default' },
});

const buttonTextVariants = cva('font-heavy text-base', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      secondary: 'text-foreground',
      destructive: 'text-white',
      sun: 'text-[#5a3d00]',
      ghost: 'text-foreground',
      link: 'text-primary',
    },
    size: { default: '', sm: 'text-sm', lg: 'text-lg', icon: '', 'icon-sm': '' },
  },
  defaultVariants: { variant: 'default', size: 'default' },
});

type ButtonProps = Omit<React.ComponentProps<typeof Pressable>, 'children'> &
  VariantProps<typeof faceVariants> & {
    children?: React.ReactNode;
    /** Classes for the face, e.g. a prayer colour `bg-fajr`. */
    faceClassName?: string;
    /** Classes for the edge, e.g. `bg-fajr-edge`. */
    edgeClassName?: string;
    /** Overrides the text colour class for custom faces. */
    textClassName?: string;
    /** Skip the light tick, e.g. when the action fires its own haptic. */
    silent?: boolean;
  };

function Button({
  className,
  faceClassName,
  edgeClassName,
  textClassName,
  variant,
  size,
  disabled,
  silent,
  onPressIn,
  onPressOut,
  children,
  ...props
}: ButtonProps) {
  const [pressed, setPressed] = React.useState(false);
  const hasEdge = variant !== 'ghost' && variant !== 'link';

  const handleIn = (e: GestureResponderEvent) => {
    setPressed(true);
    if (!silent) haptics.light();
    onPressIn?.(e);
  };
  const handleOut = (e: GestureResponderEvent) => {
    setPressed(false);
    onPressOut?.(e);
  };

  return (
    <TextClassContext.Provider value={cn(buttonTextVariants({ variant, size }), textClassName)}>
      <Pressable
        role="button"
        disabled={disabled}
        onPressIn={handleIn}
        onPressOut={handleOut}
        className={cn(hasEdge && 'pb-1', disabled && 'opacity-50', className)}
        {...props}
      >
        {hasEdge ? (
          <View
            className={cn(edgeVariants({ variant, size }), edgeClassName)}
            style={{ top: EDGE }}
          />
        ) : null}
        <View
          className={cn(
            faceVariants({ variant, size }),
            !hasEdge && pressed && 'bg-muted',
            faceClassName,
          )}
          style={hasEdge && pressed ? { transform: [{ translateY: EDGE }] } : undefined}
        >
          {children}
        </View>
      </Pressable>
    </TextClassContext.Provider>
  );
}

export { Button, buttonTextVariants };
export type { ButtonProps };
