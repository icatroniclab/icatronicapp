import { cn } from '@/lib/utils'
import { InputHTMLAttributes } from 'react'

const baseInput = 'w-full bg-[#111c2e] border border-[rgba(0,229,255,0.18)] rounded-[2px] px-3 py-2.5 text-[#e8f0f4] placeholder-[#4a6a80] focus:outline-none focus:border-[#00b8cc] focus:shadow-[0_0_0_3px_rgba(0,229,255,0.18)] transition-all duration-200 text-sm font-light'
const labelClass = 'block text-[0.7rem] font-semibold text-[#7a9aaa] uppercase tracking-[0.2em] mb-1.5'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="space-y-0">
      {label && <label className={labelClass}>{label}</label>}
      <input
        className={cn(baseInput, error && 'border-red-500', className)}
        {...props}
      />
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  )
}

export function Select({ label, error, className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string }) {
  return (
    <div className="space-y-0">
      {label && <label className={labelClass}>{label}</label>}
      <select
        className={cn(
          baseInput,
          'cursor-pointer',
          error && 'border-red-500',
          className
        )}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2300e5ff' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 12px center',
          paddingRight: '36px',
          appearance: 'none',
        }}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  )
}

export function Textarea({ label, error, className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }) {
  return (
    <div className="space-y-0">
      {label && <label className={labelClass}>{label}</label>}
      <textarea
        className={cn(baseInput, 'resize-none', error && 'border-red-500', className)}
        {...props}
      />
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  )
}
