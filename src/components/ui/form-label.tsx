import * as React from 'react'

import { cn } from '@/lib/utils'

interface FormLabelProps extends React.HTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode
}

const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          'text-xs font-mono text-[#666] uppercase tracking-wider',
          className
        )}
        {...props}
      >
        {children}
      </label>
    )
  }
)

FormLabel.displayName = 'FormLabel'

export { FormLabel }
