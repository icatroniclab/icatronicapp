import { cn } from '@/lib/utils'

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline'

const variants: Record<Variant, string> = {
  default:  'bg-[#243448] text-[#7a9aaa] border border-[rgba(0,229,255,0.14)]',
  success:  'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60',
  warning:  'bg-yellow-950/60 text-yellow-400 border border-yellow-800/60',
  danger:   'bg-red-950/60 text-red-400 border border-red-800/60',
  info:     'bg-[rgba(0,229,255,0.07)] text-[#00e5ff] border border-[rgba(0,229,255,0.3)]',
  outline:  'border border-[rgba(0,229,255,0.25)] text-[#7a9aaa]',
}

export function Badge({ children, variant = 'default', className }: {
  children: React.ReactNode
  variant?: Variant
  className?: string
}) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-[2px] text-xs font-semibold tracking-wide',
      variants[variant],
      className
    )}>
      {children}
    </span>
  )
}

export function WorkStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: Variant }> = {
    INGRESADO:  { label: 'Ingresado',  variant: 'outline'  },
    EN_PROCESO: { label: 'En proceso', variant: 'info'     },
    LISTO:      { label: 'Listo',      variant: 'success'  },
    ENTREGADO:  { label: 'Entregado',  variant: 'default'  },
  }
  const s = map[status] ?? { label: status, variant: 'default' }
  return <Badge variant={s.variant}>{s.label}</Badge>
}

export function PaymentBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: Variant }> = {
    PENDIENTE: { label: 'Pendiente', variant: 'danger'  },
    SENA:      { label: 'Seña',      variant: 'warning' },
    PARCIAL:   { label: 'Parcial',   variant: 'warning' },
    PAGADO:    { label: 'Pagado',    variant: 'success' },
  }
  const s = map[status] ?? { label: status, variant: 'default' }
  return <Badge variant={s.variant}>{s.label}</Badge>
}
