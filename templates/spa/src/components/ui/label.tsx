import type { LabelHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  htmlFor: string
  children: ReactNode
}

export function Label({ className, htmlFor, children, ...props }: LabelProps) {
  return (
    <label htmlFor={htmlFor} className={cn('text-sm font-semibold text-ink', className)} {...props}>
      {children}
    </label>
  )
}
