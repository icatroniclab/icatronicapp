'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { WorkStatusBadge, PaymentBadge } from '@/components/ui/Badge'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Wrench, Search, X, ChevronLeft, ChevronRight, History } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const WORK_STATUSES = ['INGRESADO', 'EN_PROCESO', 'LISTO', 'ENTREGADO']
const PAYMENT_STATUSES = ['PENDIENTE', 'PARCIAL', 'PAGADO']
const WORK_STATUS_LABELS: Record<string, string> = {
  INGRESADO: 'Ingresado', EN_PROCESO: 'En proceso', LISTO: 'Listo', ENTREGADO: 'Entregado',
}
const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente', PARCIAL: 'Parcial', PAGADO: 'Pagado',
}

function OrderCard({ wo }: { wo: any }) {
  return (
    <Link href={`/trabajos/${wo.id}`}>
      <Card className="hover:border-[rgba(0,229,255,0.4)] transition cursor-pointer p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div
              className="border rounded-[2px] px-3 py-2 text-center min-w-[80px]"
              style={{ background: 'rgba(0,229,255,0.05)', borderColor: 'rgba(0,229,255,0.2)' }}
            >
              {wo.orderNumber && <p className="text-[10px] font-mono" style={{ color: '#7a9aaa' }}>#{wo.orderNumber}</p>}
              <p className="font-bold text-sm" style={{ color: '#00e5ff' }}>{wo.vehicle.plate}</p>
            </div>
            <div>
              <p className="text-white font-medium">{wo.vehicle.brand} {wo.vehicle.model} {wo.vehicle.year || ''}</p>
              <p className="text-sm" style={{ color: '#7a9aaa' }}>
                {wo.vehicle.client.name} · {wo.motive.substring(0, 60)}{wo.motive.length > 60 ? '…' : ''}
              </p>
              {wo.tracking?.dtcCodes?.length > 0 && (
                <p className="text-xs mt-0.5 font-mono" style={{ color: '#00b8cc' }}>
                  {wo.tracking.dtcCodes.map((d: any) => d.code).join(', ')}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm flex-wrap">
            {wo.budget && <span className="font-medium" style={{ color: '#10b981' }}>{formatCurrency(wo.budget)}</span>}
            <WorkStatusBadge status={wo.workStatus} />
            <PaymentBadge status={wo.paymentStatus} />
            <span className="text-xs" style={{ color: '#4a6070' }}>{formatDate(wo.createdAt)}</span>
          </div>
        </div>
      </Card>
    </Link>
  )
}

function ActiveTab() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/vehiculos/trabajos?active=true')
      .then(r => r.json())
      .then(data => { setOrders(data.orders || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-sm" style={{ color: '#7a9aaa' }}>Cargando...</p>

  if (orders.length === 0) {
    return (
      <Card className="text-center py-12">
        <Wrench size={40} className="mx-auto mb-3" style={{ color: '#2a3545' }} />
        <p style={{ color: '#7a9aaa' }}>
          Sin trabajos activos.{' '}
          <Link href="/vehiculos/nuevo" className="text-[#00e5ff] hover:underline">Crear ficha de ingreso</Link>
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {orders.map(wo => <OrderCard key={wo.id} wo={wo} />)}
    </div>
  )
}

function HistorialTab() {
  const [orders, setOrders] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const [search, setSearch] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('')
  const [workStatus, setWorkStatus] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const limit = 20

  const fetchHistorial = useCallback(async (overridePage = page) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (paymentStatus) params.set('paymentStatus', paymentStatus)
    if (workStatus) params.set('workStatus', workStatus)
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    params.set('page', String(overridePage))
    params.set('limit', String(limit))
    const res = await fetch(`/api/vehiculos/trabajos?${params}`)
    const data = await res.json()
    setOrders(data.orders || [])
    setTotal(data.total || 0)
    setTotalPages(data.totalPages || 1)
    setLoading(false)
  }, [search, paymentStatus, workStatus, from, to, page, limit])

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      setPage(1)
      fetchHistorial(1)
    }, 300)
  }, [search, paymentStatus, workStatus, from, to])

  useEffect(() => {
    fetchHistorial(page)
  }, [page])

  function clearFilters() {
    setSearch('')
    setPaymentStatus('')
    setWorkStatus('')
    setFrom('')
    setTo('')
    setPage(1)
  }

  const hasFilters = search || paymentStatus || workStatus || from || to

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div
        className="rounded-[2px] p-4 space-y-3"
        style={{ background: '#192638', border: '1px solid rgba(0,229,255,0.12)' }}
      >
        {/* Búsqueda texto */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#4a6a80' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por patente, cliente, motivo..."
            className="w-full pl-9 pr-4 py-2.5 rounded-[2px] text-sm focus:outline-none focus:border-[#00b8cc] transition"
            style={{
              background: '#111c2e',
              border: '1px solid rgba(0,229,255,0.18)',
              color: '#e8f0f4',
            }}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Estado de pago */}
          <div>
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.2em] mb-1.5" style={{ color: '#7a9aaa' }}>Pago</p>
            <div className="flex gap-1.5">
              <button
                onClick={() => setPaymentStatus('')}
                className="px-2.5 py-1 rounded-[2px] text-xs font-semibold transition"
                style={{
                  background: !paymentStatus ? '#00e5ff' : 'rgba(0,229,255,0.06)',
                  color: !paymentStatus ? '#111c2e' : '#7a9aaa',
                  border: `1px solid ${!paymentStatus ? '#00e5ff' : 'rgba(0,229,255,0.14)'}`,
                }}
              >Todos</button>
              {PAYMENT_STATUSES.map(s => (
                <button
                  key={s}
                  onClick={() => setPaymentStatus(paymentStatus === s ? '' : s)}
                  className="px-2.5 py-1 rounded-[2px] text-xs font-semibold transition"
                  style={{
                    background: paymentStatus === s ? '#00e5ff' : 'rgba(0,229,255,0.06)',
                    color: paymentStatus === s ? '#111c2e' : '#7a9aaa',
                    border: `1px solid ${paymentStatus === s ? '#00e5ff' : 'rgba(0,229,255,0.14)'}`,
                  }}
                >{PAYMENT_STATUS_LABELS[s]}</button>
              ))}
            </div>
          </div>

          {/* Estado de trabajo */}
          <div>
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.2em] mb-1.5" style={{ color: '#7a9aaa' }}>Estado</p>
            <div className="flex gap-1.5">
              <button
                onClick={() => setWorkStatus('')}
                className="px-2.5 py-1 rounded-[2px] text-xs font-semibold transition"
                style={{
                  background: !workStatus ? '#00e5ff' : 'rgba(0,229,255,0.06)',
                  color: !workStatus ? '#111c2e' : '#7a9aaa',
                  border: `1px solid ${!workStatus ? '#00e5ff' : 'rgba(0,229,255,0.14)'}`,
                }}
              >Todos</button>
              {WORK_STATUSES.map(s => (
                <button
                  key={s}
                  onClick={() => setWorkStatus(workStatus === s ? '' : s)}
                  className="px-2.5 py-1 rounded-[2px] text-xs font-semibold transition"
                  style={{
                    background: workStatus === s ? '#00e5ff' : 'rgba(0,229,255,0.06)',
                    color: workStatus === s ? '#111c2e' : '#7a9aaa',
                    border: `1px solid ${workStatus === s ? '#00e5ff' : 'rgba(0,229,255,0.14)'}`,
                  }}
                >{WORK_STATUS_LABELS[s]}</button>
              ))}
            </div>
          </div>

          {/* Rango de fechas */}
          <div>
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.2em] mb-1.5" style={{ color: '#7a9aaa' }}>Período</p>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={from}
                onChange={e => setFrom(e.target.value)}
                className="rounded-[2px] px-2 py-1 text-xs focus:outline-none transition"
                style={{ background: '#111c2e', border: '1px solid rgba(0,229,255,0.18)', color: '#e8f0f4', colorScheme: 'dark' }}
              />
              <span className="text-xs" style={{ color: '#4a6a80' }}>—</span>
              <input
                type="date"
                value={to}
                onChange={e => setTo(e.target.value)}
                className="rounded-[2px] px-2 py-1 text-xs focus:outline-none transition"
                style={{ background: '#111c2e', border: '1px solid rgba(0,229,255,0.18)', color: '#e8f0f4', colorScheme: 'dark' }}
              />
            </div>
          </div>

          {hasFilters && (
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-[2px] transition"
                style={{ color: '#7a9aaa', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                onMouseLeave={e => (e.currentTarget.style.color = '#7a9aaa')}
              >
                <X size={12} /> Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Contador */}
      <p className="text-sm" style={{ color: '#7a9aaa' }}>
        {loading ? 'Buscando…' : `${total} trabajo${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`}
      </p>

      {/* Lista */}
      {loading ? (
        <p className="text-sm" style={{ color: '#7a9aaa' }}>Cargando...</p>
      ) : orders.length === 0 ? (
        <Card className="text-center py-12">
          <History size={36} className="mx-auto mb-3" style={{ color: '#2a3545' }} />
          <p style={{ color: '#7a9aaa' }}>Sin resultados para los filtros aplicados.</p>
        </Card>
      ) : (
        <>
          <div className="space-y-2">
            {orders.map(wo => <OrderCard key={wo.id} wo={wo} />)}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs" style={{ color: '#7a9aaa' }}>
                Página {page} de {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-[2px] transition disabled:opacity-30"
                  style={{ color: '#00e5ff', border: '1px solid rgba(0,229,255,0.2)' }}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-[2px] transition disabled:opacity-30"
                  style={{ color: '#00e5ff', border: '1px solid rgba(0,229,255,0.2)' }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function TrabajosPage() {
  const [tab, setTab] = useState<'activos' | 'historial'>('activos')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white uppercase tracking-wider" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Trabajos
          </h1>
        </div>
        <Link href="/vehiculos/nuevo">
          <Button><Wrench size={15} /> Nuevo ingreso</Button>
        </Link>
      </div>

      {/* Tabs */}
      <div
        className="flex rounded-[2px] overflow-hidden self-start"
        style={{ border: '1px solid rgba(0,229,255,0.2)' }}
      >
        {([
          { id: 'activos', label: 'Activos' },
          { id: 'historial', label: 'Historial' },
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition-all"
            style={{
              background: tab === t.id ? 'rgba(0,229,255,0.15)' : 'transparent',
              color: tab === t.id ? '#00e5ff' : '#7a9aaa',
              borderRight: t.id === 'activos' ? '1px solid rgba(0,229,255,0.2)' : 'none',
            }}
          >
            {t.id === 'historial' && <History size={14} />}
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'activos' && <ActiveTab />}
      {tab === 'historial' && <HistorialTab />}
    </div>
  )
}
