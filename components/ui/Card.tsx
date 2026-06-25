import { cn } from '@/lib/utils'

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      'card-cyber bg-[#192638] border border-[rgba(0,229,255,0.18)] rounded-[2px] p-5 transition-[border-color] duration-300 hover:border-[rgba(0,229,255,0.38)]',
      className
    )}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('mb-4', className)}>{children}</div>
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={cn('text-base font-semibold text-white tracking-wide', className)} style={{ fontFamily: 'Rajdhani, sans-serif' }}>
      {children}
    </h2>
  )
}
