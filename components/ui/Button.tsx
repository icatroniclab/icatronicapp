import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary:   'bg-[#00e5ff] text-[#111c2e] hover:shadow-[0_0_24px_rgba(0,229,255,0.5)] hover:-translate-y-px',
  secondary: 'bg-transparent border border-[rgba(0,229,255,0.4)] text-[#00e5ff] hover:bg-[rgba(0,229,255,0.08)] hover:shadow-[0_0_16px_rgba(0,229,255,0.25)]',
  danger:    'bg-red-700 hover:bg-red-800 text-white',
  ghost:     'hover:bg-[rgba(0,229,255,0.06)] text-[#7a9aaa] hover:text-white',
}

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

export function Button({ variant = 'primary', size = 'md', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center gap-2 font-semibold rounded-[2px] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed tracking-wide',
        variants[variant],
        sizes[size],
        className
      )}
      style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.05em' }}
      {...props}
    >
      {children}
    </button>
  )
}
