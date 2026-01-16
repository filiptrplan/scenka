import * as SwitchPrimitives from '@radix-ui/react-switch'
import { cva } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/lib/utils'

const toggleVariants = cva(
  'inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full border-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      checked: {
        true: 'bg-white/10 border-white/30',
        false: 'bg-white/[0.02] border-white/20',
      },
    },
    defaultVariants: {
      checked: false,
    },
  }
)

const thumbVariants = cva(
  'pointer-events-none block h-3 w-4 rounded-full ring-0 transition-transform duration-200',
  {
    variants: {
      checked: {
        true: 'translate-x-3 bg-white/60',
        false: 'translate-x-0 bg-white/30',
      },
    },
    defaultVariants: {
      checked: false,
    },
  }
)

export interface ToggleProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const Toggle = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  ToggleProps
>(({ className, ...props }, ref) => {
  const isChecked = props.checked ?? false
  return (
    <SwitchPrimitives.Root
      className={cn(toggleVariants({ checked: isChecked }), className)}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb className={thumbVariants({ checked: isChecked })} />
    </SwitchPrimitives.Root>
  )
})
Toggle.displayName = SwitchPrimitives.Root.displayName

export { Toggle, toggleVariants, thumbVariants }
