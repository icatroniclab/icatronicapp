'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard, Car, Wrench, DollarSign, Package,
  BookOpen, LogOut, Settings, Menu, X, Users, FolderOpen, Bot, CalendarDays, TrendingUp, ListChecks, Cpu, Zap, FileText
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard'      },
  { href: '/clientes',      icon: Users,           label: 'Clientes'       },
  { href: '/vehiculos',     icon: Car,             label: 'Vehículos'      },
  { href: '/trabajos',      icon: Wrench,          label: 'Trabajos'       },
  { href: '/modulos',       icon: Cpu,             label: 'Módulos'        },
  { href: '/rapidos',       icon: Zap,             label: 'Rápidos'        },
  { href: '/turnos',        icon: CalendarDays,    label: 'Turnos'         },
  { href: '/finanzas',      icon: DollarSign,      label: 'Finanzas'       },
  { href: '/analisis',      icon: TrendingUp,      label: 'Rendimientos'   },
  { href: '/stock',         icon: Package,         label: 'Stock'          },
  { href: '/tarifario',     icon: ListChecks,      label: 'Tarifario'      },
  { href: '/presupuestos',  icon: FileText,        label: 'Presupuestos'   },
  { href: '/casos',         icon: BookOpen,        label: 'Base de Casos'  },
  { href: '/documentacion', icon: FolderOpen,      label: 'Documentación'  },
  { href: '/asistente',     icon: Bot,             label: 'Asistente IA'   },
  { href: '/configuracion', icon: Settings,        label: 'Configuración'  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const inner = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-[rgba(0,229,255,0.1)]">
        <img
          src="/logo-full.svg"
          alt="ICATRONIC"
          className="w-full"
          style={{ maxHeight: 60, objectFit: 'contain', objectPosition: 'left' }}
        />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-[2px] text-sm font-medium transition-all duration-200',
                active
                  ? 'bg-[rgba(0,229,255,0.1)] text-[#00e5ff] border-l-2 border-[#00e5ff] pl-[10px]'
                  : 'text-[#7a9aaa] hover:text-[#e8f0f4] hover:bg-[rgba(0,229,255,0.05)] border-l-2 border-transparent pl-[10px]'
              )}
              style={active ? { fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.05em' } : {}}
            >
              <Icon
                size={17}
                className={active ? 'text-[#00e5ff]' : ''}
                style={active ? { filter: 'drop-shadow(0 0 6px rgba(0,229,255,0.6))' } : {}}
              />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-[rgba(0,229,255,0.1)]">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 px-3 py-2.5 pl-[10px] w-full rounded-[2px] text-sm font-medium text-[#7a9aaa] hover:text-red-400 hover:bg-[rgba(239,68,68,0.06)] border-l-2 border-transparent transition-all duration-200"
        >
          <LogOut size={17} />
          Cerrar sesión
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden bg-[#192638] border border-[rgba(0,229,255,0.25)] p-2 rounded-[2px] text-[#00e5ff]"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 bg-[#0c1728] border-r border-[rgba(0,229,255,0.18)]">
            <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-[#7a9aaa] hover:text-[#00e5ff]">
              <X size={20} />
            </button>
            {inner}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-[#0c1728] border-r border-[rgba(0,229,255,0.18)] h-screen sticky top-0 flex-shrink-0">
        {inner}
      </aside>
    </>
  )
}
