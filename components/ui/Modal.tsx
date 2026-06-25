'use client'
import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(
        'relative bg-[#192638] border border-[rgba(0,229,255,0.25)] rounded-[2px] w-full shadow-[0_0_60px_rgba(0,229,255,0.07)]',
        sizes[size]
      )}>
        {/* top cyan accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#00e5ff] shadow-[0_0_12px_rgba(0,229,255,0.6)]" />
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(0,229,255,0.1)]">
            <h2
              className="text-base font-bold text-[#00e5ff] uppercase tracking-widest"
              style={{ fontFamily: 'Rajdhani, sans-serif' }}
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-[#7a9aaa] hover:text-[#00e5ff] transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="p-5 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
