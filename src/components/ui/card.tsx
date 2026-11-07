import { cn } from '@/lib/utils';
import * as React from 'react';
import { View } from 'react-native';

/**
 * A soft, rounded surface. The bottom border is thicker than the rest, which
 * gives cards the same "sitting on the table" feel as the chunky buttons.
 */
function Card({ className, ...props }: React.ComponentProps<typeof View>) {
  return (
    <View
      className={cn('rounded-3xl border-2 border-b-4 border-border bg-card p-4', className)}
      {...props}
    />
  );
}

export { Card };
