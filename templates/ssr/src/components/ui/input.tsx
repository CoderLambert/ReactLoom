import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-2xl bg-linen px-3 py-2 text-sm text-ink ring-1 ring-line placeholder:text-muted',
        className,
      )}
      {...props}
    />
  )
}
