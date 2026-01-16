import * as React from 'react'

import { cn } from '@/lib/utils'

interface FormSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const FormSection = React.forwardRef<HTMLDivElement, FormSectionProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-white/[0.02] border-2 border-white/10 p-6 hover:border-white/30 transition-all duration-200',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

FormSection.displayName = 'FormSection'

export { FormSection }
