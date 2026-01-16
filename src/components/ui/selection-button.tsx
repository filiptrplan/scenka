import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/lib/utils'

const selectionButtonVariants = cva(
  'flex-1 px-4 py-3 border-2 text-xs font-black uppercase tracking-wider transition-all',
  {
    variants: {
      variant: {
        selected: 'bg-white/10 border-white/30 text-white',
        unselected: 'border-white/20 hover:border-white/40 bg-white/[0.02] text-[#aaa]',
      },
    },
    defaultVariants: {
      variant: 'unselected',
    },
  }
)

export interface SelectionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof selectionButtonVariants> {
  selected: boolean
}

const SelectionButton = React.forwardRef<HTMLButtonElement, SelectionButtonProps>(
  ({ className, selected, ...props }, ref) => {
    const variant = selected ? 'selected' : 'unselected'
    return (
      <button
        ref={ref}
        className={cn(selectionButtonVariants({ variant, className }))}
        type="button"
        {...props}
      />
    )
  }
)

SelectionButton.displayName = 'SelectionButton'

export { SelectionButton, selectionButtonVariants }
