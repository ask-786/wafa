import { cn } from '@/lib/utils';
import { Slot } from '@rn-primitives/slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { Platform, Text as RNText, type Role } from 'react-native';

/**
 * Nunito everywhere. Weight comes from the face (`font-body`, `font-strong`,
 * `font-heavy`, `font-display`), never `font-bold`: Android won't synthesise
 * weights for a custom font.
 */
const textVariants = cva(
  cn('font-body text-base text-foreground', Platform.select({ web: 'select-text' })),
  {
    variants: {
      variant: {
        default: '',
        /** Page titles. */
        title: 'font-display text-[32px] leading-[38px] tracking-tight',
        h2: 'font-heavy text-2xl leading-8 tracking-tight',
        h3: 'font-heavy text-lg leading-6',
        /** Small caps above a section. */
        eyebrow: 'font-heavy text-xs tracking-widest text-muted-foreground uppercase',
        lead: 'text-lg leading-7 text-muted-foreground',
        muted: 'text-sm leading-5 text-muted-foreground',
        small: 'font-strong text-sm leading-5',
        /** Big counters. Tabular so digits don't jiggle as they tick. */
        numeral: 'font-display text-5xl leading-[56px] tracking-tight tabular-nums',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

type TextVariantProps = VariantProps<typeof textVariants>;
type TextVariant = NonNullable<TextVariantProps['variant']>;

const ROLE: Partial<Record<TextVariant, Role>> = {
  title: 'heading',
  h2: 'heading',
  h3: 'heading',
};

const ARIA_LEVEL: Partial<Record<TextVariant, string>> = { title: '1', h2: '2', h3: '3' };

const TextClassContext = React.createContext<string | undefined>(undefined);

function Text({
  className,
  asChild = false,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof RNText> &
  React.RefAttributes<typeof RNText> &
  TextVariantProps & {
    asChild?: boolean;
  }) {
  const textClass = React.useContext(TextClassContext);
  const Component = asChild ? Slot : RNText;
  return (
    <Component
      className={cn(textVariants({ variant }), textClass, className)}
      role={variant ? ROLE[variant] : undefined}
      aria-level={variant ? ARIA_LEVEL[variant] : undefined}
      {...props}
    />
  );
}

export { Text, TextClassContext };
