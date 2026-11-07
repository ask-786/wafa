import { cn } from '@/lib/utils';
import * as SwitchPrimitives from '@rn-primitives/switch';
import { Platform } from 'react-native';

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitives.Root>) {
  return (
    <SwitchPrimitives.Root
      className={cn(
        'flex h-8 w-14 shrink-0 flex-row items-center rounded-full border-2 border-transparent px-0.5',
        Platform.select({
          web: 'peer inline-flex transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed',
        }),
        props.checked ? 'bg-primary' : 'bg-input dark:bg-input/80',
        props.disabled && 'opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          'size-6 rounded-full bg-white transition-transform',
          Platform.select({
            web: 'pointer-events-none block ring-0',
          }),
          props.checked ? 'translate-x-6' : 'translate-x-0',
        )}
      />
    </SwitchPrimitives.Root>
  );
}

export { Switch };
