'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Edit2, CalendarDays, Phone, CheckCircle2, Clock, XCircle, Check, Bell, ChevronLeft, ChevronRight, LayoutList, Briefcase } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'

const STATUSES = ['PENDIENTE', 'CONFIRMADO', 'COMPLETADO', 'CANCELADO']

const SERVICE_CATEGORIES = [
  'Diagnóstico electrónico',
  'Diagnóstico general',
  'Cerrajería automotriz',
  'Programación de llaves / módulos',
  'Scanner / Escaneo',
  'Reseteo de servicio',
  'Mantenimiento',
  'Reparación eléctrica',
  'Cambio de carcasa',
  'Otro',
]

const STATUS_META: Record<string, { label: string; variant: any; icon: any }> = {
  PENDIENTE:  { label: 'Pendiente',  variant: 'warning', icon: Clock       },
  CONFIRMADO: { label: 'Confirmado', variant: 'info',    icon: CheckCircle2 },
  COMPLETADO: { label: 'Completado', variant: 'success', icon: Check        },
  CANCELADO:  { label: 'Cancelado',  variant: 'danger',  icon: XCircle      },
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  CONFIRMADO: { bg: 'rgba(0,229,255,0.12)',   text: '#00e5ff', border: 'rgba(0,229,255,0.3)'   },
  PENDIENTE:  { bg: 'rgba(245,158,11,0.12)',  text: '#f59e0b', border: 'rgba(245,158,11,0.3)'  },
  COMPLETADO: { bg: 'rgba(16,185,129,0.12)',  text: '#10b981', border: 'rgba(16,185,129,0.3)'  },
  CANCELADO:  { bg: 'rgba(239,68,68,0.10)',   text: '#ef4444', border: 'rgba(239,68,68,0.25)'  },
}

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const emptyForm = {
  clientName: '',
  phone: '',
  scheduledAt: '',
  service: '',
  status: 'PENDIENTE',
  notes: '',
}

function toLocalDatetimeInput(d: string | Date) {
  const date = new Date(d)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatDate(d: string | Date) {
  return new Date(d).toLocaleString('es-AR', {
    weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatTime(d: string | Date) {
  return new Date(d).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

function formatDayLabel(d: Date) {
  return d.toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: '2-digit' })
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

// ─── Banner hoy / mañana ──────────────────────────────────────────────────────
function UpcomingBanner({ turnos, onEdit }: { turnos: any[]; onEdit: (t: any) => void }) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  const active = (t: any) => t.status !== 'CANCELADO' && t.status !== 'COMPLETADO'

  const hoy = turnos.filter(t => isSameDay(new Date(t.scheduledAt), today) && active(t))
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())

  const manana = turnos.filter(t => isSameDay(new Date(t.scheduledAt), tomorrow) && active(t))
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())

  if (hoy.length === 0 && manana.length === 0) return null

  return (
    <div
      className="rounded-[2px] p-4 space-y-4"
      style={{
        background: 'rgba(0,229,255,0.04)',
        border: '1px solid rgba(0,229,255,0.2)',
        borderLeft: '3px solid #00e5ff',
        boxShadow: '0 0 20px rgba(0,229,255,0.05)',
      }}
    >
      <div className="flex items-center gap-2">
        <Bell size={15} style={{ color: '#00e5ff' }} />
        <span
          className="text-xs font-bold uppercase tracking-[0.2em]"
          style={{ color: '#00e5ff' }}
        >
          Turnos próximos
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* HOY */}
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: '#7a9aaa' }}>
            Hoy — {formatDayLabel(today)}
          </p>
          {hoy.length === 0 ? (
            <p className="text-xs" style={{ color: '#4a6070' }}>Sin turnos para hoy</p>
          ) : (
            <div className="space-y-1.5">
              {hoy.map(t => (
                <button
                  key={t.id}
                  onClick={() => onEdit(t)}
                  className="w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-[2px] transition-all"
                  style={{ background: 'rgba(0,229,255,0.04)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,229,255,0.09)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,229,255,0.04)')}
                >
                  <span
                    className="text-sm font-bold tabular-nums flex-shrink-0"
                    style={{ color: '#00e5ff', minWidth: '3rem' }}
                  >
                    {formatTime(t.scheduledAt)}
                  </span>
                  <span className="text-xs text-white font-medium truncate">{t.clientName}</span>
                  <span className="text-xs truncate" style={{ color: '#7a9aaa' }}>· {t.service}</span>
                  <Badge variant={STATUS_META[t.status]?.variant ?? 'default'} className="ml-auto flex-shrink-0">
                    {STATUS_META[t.status]?.label}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* MAÑANA */}
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: '#7a9aaa' }}>
            Mañana — {formatDayLabel(tomorrow)}
          </p>
          {manana.length === 0 ? (
            <p className="text-xs" style={{ color: '#4a6070' }}>Sin turnos para mañana</p>
          ) : (
            <div className="space-y-1.5">
              {manana.map(t => (
                <button
                  key={t.id}
                  onClick={() => onEdit(t)}
                  className="w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-[2px] transition-all"
                  style={{ background: 'rgba(0,229,255,0.04)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,229,255,0.09)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,229,255,0.04)')}
                >
                  <span
                    className="text-sm font-bold tabular-nums flex-shrink-0"
                    style={{ color: '#00e5ff', minWidth: '3rem' }}
                  >
                    {formatTime(t.scheduledAt)}
                  </span>
                  <span className="text-xs text-white font-medium truncate">{t.clientName}</span>
                  <span className="text-xs truncate" style={{ color: '#7a9aaa' }}>· {t.service}</span>
                  <Badge variant={STATUS_META[t.status]?.variant ?? 'default'} className="ml-auto flex-shrink-0">
                    {STATUS_META[t.status]?.label}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Calendar view ────────────────────────────────────────────────────────────
function CalendarView({ turnos, onEdit, onNewAtDate }: {
  turnos: any[]
  onEdit: (t: any) => void
  onNewAtDate: (date: Date) => void
}) {
  const today = new Date()
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))

  const firstDay = month
  const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0)
  const startOffset = (firstDay.getDay() + 6) % 7 // Monday = 0
  const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7

  const cells: Date[] = Array.from({ length: totalCells }, (_, i) => {
    const d = new Date(firstDay)
    d.setDate(1 - startOffset + i)
    return d
  })

  const byDate: Record<string, any[]> = {}
  for (const t of turnos) {
    const d = new Date(t.scheduledAt)
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    if (!byDate[key]) byDate[key] = []
    byDate[key].push(t)
  }

  const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  const isToday = (d: Date) => d.toDateString() === today.toDateString()
  const isCurrentMonth = (d: Date) => d.getMonth() === month.getMonth()

  const monthLabel = month.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  const showHoy = month.getFullYear() !== today.getFullYear() || month.getMonth() !== today.getMonth()

  return (
    <div className="bg-[#192638] border border-[rgba(0,229,255,0.12)] rounded-[2px] overflow-hidden">
      {/* Month navigation */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(0,229,255,0.1)]">
        <button
          onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          className="p-1.5 text-[#7a9aaa] hover:text-[#00e5ff] transition-colors rounded-[2px]"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex items-center gap-3">
          <span className="text-white font-semibold capitalize">{monthLabel}</span>
          {showHoy && (
            <button
              onClick={() => setMonth(new Date(today.getFullYear(), today.getMonth(), 1))}
              className="text-xs text-[#00e5ff] hover:text-[#00c4db] transition-colors border border-[rgba(0,229,255,0.3)] px-2 py-0.5 rounded-[2px]"
            >
              Hoy
            </button>
          )}
        </div>
        <button
          onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
          className="p-1.5 text-[#7a9aaa] hover:text-[#00e5ff] transition-colors rounded-[2px]"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-[rgba(0,229,255,0.08)]">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-[11px] font-semibold text-[#7a9aaa] py-2 uppercase tracking-wide">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-[rgba(0,229,255,0.06)]">
        {cells.map((d, i) => {
          const key = dayKey(d)
          const dayTurnos = (byDate[key] ?? []).sort(
            (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
          )
          const inMonth = isCurrentMonth(d)
          const tod = isToday(d)

          return (
            <div
              key={i}
              onClick={() => onNewAtDate(d)}
              className={`min-h-[80px] p-1.5 cursor-pointer transition-colors group ${
                inMonth ? 'hover:bg-[rgba(0,229,255,0.03)]' : ''
              }`}
              style={{ background: tod ? 'rgba(0,229,255,0.05)' : undefined, opacity: inMonth ? 1 : 0.4 }}
            >
              <div className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1 transition-colors ${
                tod
                  ? 'bg-[#00e5ff] text-[#111c2e]'
                  : 'text-[#8aacbe] group-hover:text-white'
              }`}>
                {d.getDate()}
              </div>
              <div className="space-y-0.5">
                {dayTurnos.slice(0, 2).map(t => {
                  const sc = STATUS_COLORS[t.status] ?? STATUS_COLORS.PENDIENTE
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={e => { e.stopPropagation(); onEdit(t) }}
                      title={`${t.clientName} — ${t.service}`}
                      className="w-full text-left truncate rounded-[2px] px-1 py-[2px] text-[10px] leading-tight transition-opacity hover:opacity-75"
                      style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}
                    >
                      <span className="font-bold">{formatTime(t.scheduledAt)}</span>
                      {' '}{t.clientName}
                    </button>
                  )
                })}
                {dayTurnos.length > 2 && (
                  <p className="text-[10px] text-[#7a9aaa] pl-1">+{dayTurnos.length - 2} más</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2.5 border-t border-[rgba(0,229,255,0.08)] flex-wrap">
        {Object.entries(STATUS_META).map(([key, meta]) => {
          const sc = STATUS_COLORS[key]
          return (
            <div key={key} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-[1px]" style={{ background: sc.bg, border: `1px solid ${sc.border}` }} />
              <span className="text-[11px]" style={{ color: sc.text }}>{meta.label}</span>
            </div>
          )
        })}
        <span className="text-[11px] text-[#4a6070] ml-auto hidden sm:block">Clic en un día para agendar</span>
      </div>
    </div>
  )
}

// ─── Convertir turno en orden de trabajo ─────────────────────────────────────
function ConvertirTurnoModal({ turno, onClose, onDone }: {
  turno: any
  onClose: () => void
  onDone: () => void
}) {
  const router = useRouter()
  const [plateSearch, setPlateSearch] = useState('')
  const [vehicle, setVehicle] = useState<any>(null)
  const [notFound, setNotFound] = useState(false)
  const [searching, setSearching] = useState(false)
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [motive, setMotive] = useState(() => [turno.service, turno.notes].filter(Boolean).join(' — '))
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  async function searchVehicle() {
    const plate = plateSearch.trim().toUpperCase()
    if (!plate) return
    setSearching(true)
    setVehicle(null)
    setNotFound(false)
    setError('')
    const res = await fetch(`/api/vehiculos?q=${encodeURIComponent(plate)}`)
    const data = await res.json()
    const found = Array.isArray(data) ? data.find((v: any) => v.plate.toUpperCase() === plate) : null
    if (found) setVehicle(found)
    else setNotFound(true)
    setSearching(false)
  }

  async function handleCreate() {
    if (!motive.trim()) { setError('El motivo es obligatorio'); return }
    if (notFound && (!brand.trim() || !model.trim())) { setError('Completá marca y modelo'); return }
    setCreating(true)
    setError('')

    const vehicleData = vehicle
      ? { plate: vehicle.plate, brand: vehicle.brand, model: vehicle.model, year: vehicle.year }
      : { plate: plateSearch.trim().toUpperCase(), brand: brand.trim(), model: model.trim(), year: year || null }

    const clientData = vehicle
      ? { id: vehicle.clientId }
      : { name: turno.clientName, phone: turno.phone || null }

    const res = await fetch('/api/vehiculos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client: clientData,
        vehicle: vehicleData,
        workOrder: { motive: motive.trim() },
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      setError(err.error || 'Error al crear la orden')
      setCreating(false)
      return
    }

    const wo = await res.json()

    await fetch(`/api/turnos/${turno.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'COMPLETADO' }),
    })

    onDone()
    router.push(`/trabajos/${wo.id}`)
  }

  const canCreate = motive.trim() && (vehicle || (notFound && brand.trim() && model.trim()))

  return (
    <Modal open onClose={onClose} title="Crear orden de trabajo" size="md">
      <div className="space-y-4">
        {/* Turno info */}
        <div
          className="rounded-[2px] px-4 py-3"
          style={{ background: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.15)' }}
        >
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] mb-1" style={{ color: '#7a9aaa' }}>Turno a convertir</p>
          <p className="text-white font-medium">{turno.clientName}</p>
          <p className="text-sm" style={{ color: '#00b8cc' }}>{turno.service}</p>
          {turno.notes && <p className="text-xs mt-0.5" style={{ color: '#7a9aaa' }}>{turno.notes}</p>}
        </div>

        {/* Búsqueda de vehículo */}
        <div>
          <label className="block text-[0.7rem] font-semibold text-[#7a9aaa] uppercase tracking-[0.2em] mb-1.5">
            Buscar vehículo por patente
          </label>
          <div className="flex gap-2">
            <input
              value={plateSearch}
              onChange={e => {
                setPlateSearch(e.target.value.toUpperCase())
                setVehicle(null)
                setNotFound(false)
              }}
              onKeyDown={e => e.key === 'Enter' && searchVehicle()}
              placeholder="Ej: ABC123"
              className="flex-1 bg-[#111c2e] border border-[rgba(0,229,255,0.18)] rounded-[2px] px-3 py-2.5 text-[#e8f0f4] placeholder-[#4a6a80] focus:outline-none focus:border-[#00b8cc] text-sm font-light"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={searchVehicle}
              disabled={searching || !plateSearch.trim()}
            >
              {searching ? '…' : 'Buscar'}
            </Button>
          </div>
        </div>

        {/* Vehículo encontrado */}
        {vehicle && (
          <div
            className="rounded-[2px] px-4 py-3 flex items-center gap-3"
            style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.25)' }}
          >
            <CheckCircle2 size={18} style={{ color: '#10b981', flexShrink: 0 }} />
            <div>
              <p className="text-white font-medium text-sm">
                {vehicle.plate} — {vehicle.brand} {vehicle.model} {vehicle.year || ''}
              </p>
              <p className="text-xs" style={{ color: '#7a9aaa' }}>{vehicle.client?.name}</p>
            </div>
          </div>
        )}

        {/* Vehículo no encontrado */}
        {notFound && (
          <div
            className="rounded-[2px] px-4 py-3 space-y-3"
            style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}
          >
            <p className="text-xs font-semibold" style={{ color: '#f59e0b' }}>
              Patente no registrada — completá los datos del vehículo
            </p>
            <div className="grid grid-cols-3 gap-2">
              <Input label="Marca *" value={brand} onChange={e => setBrand(e.target.value)} placeholder="Ford" />
              <Input label="Modelo *" value={model} onChange={e => setModel(e.target.value)} placeholder="Focus" />
              <Input label="Año" value={year} onChange={e => setYear(e.target.value)} placeholder="2019" type="number" />
            </div>
          </div>
        )}

        {/* Motivo */}
        {(vehicle || notFound) && (
          <Textarea
            label="Motivo de ingreso *"
            value={motive}
            onChange={e => setMotive(e.target.value)}
            rows={3}
            placeholder="Describí el motivo del ingreso..."
          />
        )}

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleCreate} disabled={!canCreate || creating}>
            {creating ? 'Creando…' : 'Crear orden'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function TurnosPage() {
  const [turnos, setTurnos] = useState<any[]>([])
  const [allTurnos, setAllTurnos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editTurno, setEditTurno] = useState<any>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [clientSuggestions, setClientSuggestions] = useState<any[]>([])
  const [convertTurno, setConvertTurno] = useState<any | null>(null)
  const clientTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchTurnos = useCallback(async () => {
    setLoading(true)
    try {
      const qs = filterStatus ? `?status=${filterStatus}` : ''
      const [filtered, all] = await Promise.all([
        fetch(`/api/turnos${qs}`).then(r => r.ok ? r.json() : []),
        fetch('/api/turnos').then(r => r.ok ? r.json() : []),
      ])
      setTurnos(filtered)
      setAllTurnos(all)
    } finally {
      setLoading(false)
    }
  }, [filterStatus])

  useEffect(() => { fetchTurnos() }, [fetchTurnos])

  function searchClients(value: string) {
    setForm(f => ({ ...f, clientName: value }))
    if (clientTimeout.current) clearTimeout(clientTimeout.current)
    if (value.length < 2) { setClientSuggestions([]); return }
    clientTimeout.current = setTimeout(async () => {
      const res = await fetch(`/api/clientes?q=${encodeURIComponent(value)}`)
      const data = await res.json()
      setClientSuggestions(Array.isArray(data) ? data.slice(0, 6) : [])
    }, 300)
  }

  function selectClient(c: any) {
    setForm(f => ({ ...f, clientName: c.name, phone: c.phone || f.phone }))
    setClientSuggestions([])
  }

  function openCreate(forDate?: Date) {
    setEditTurno(null)
    setClientSuggestions([])
    const next = forDate ? new Date(forDate) : new Date()
    if (forDate) next.setHours(9, 0, 0, 0)
    else next.setHours(next.getHours() + 1, 0, 0, 0)
    setForm({ ...emptyForm, scheduledAt: toLocalDatetimeInput(next) })
    setShowModal(true)
  }

  function openEdit(t: any) {
    setEditTurno(t)
    setClientSuggestions([])
    setForm({
      clientName: t.clientName,
      phone: t.phone || '',
      scheduledAt: toLocalDatetimeInput(t.scheduledAt),
      service: t.service,
      status: t.status,
      notes: t.notes || '',
    })
    setShowModal(true)
  }

  async function save() {
    if (!form.clientName || !form.scheduledAt || !form.service || form.service === '') return
    setSaving(true)
    const payload = { ...form, scheduledAt: new Date(form.scheduledAt).toISOString() }
    if (editTurno) {
      await fetch(`/api/turnos/${editTurno.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } else {
      await fetch('/api/turnos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }
    setSaving(false)
    setShowModal(false)
    fetchTurnos()
  }

  async function quickStatus(id: string, status: string) {
    await fetch(`/api/turnos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    fetchTurnos()
  }

  async function deleteTurno(id: string) {
    if (!confirm('¿Eliminar este turno?')) return
    await fetch(`/api/turnos/${id}`, { method: 'DELETE' })
    fetchTurnos()
  }

  const pendientes  = allTurnos.filter(t => t.status === 'PENDIENTE').length
  const confirmados = allTurnos.filter(t => t.status === 'CONFIRMADO').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white uppercase tracking-wider" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Turnos</h1>
          <p className="text-sm mt-1" style={{ color: '#7a9aaa' }}>
            {pendientes} pendientes · {confirmados} confirmados
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-[2px] border border-[rgba(0,229,255,0.2)] overflow-hidden">
            <button
              onClick={() => setView('calendar')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all"
              style={{
                background: view === 'calendar' ? 'rgba(0,229,255,0.15)' : 'transparent',
                color: view === 'calendar' ? '#00e5ff' : '#7a9aaa',
              }}
            >
              <CalendarDays size={14} /> Calendario
            </button>
            <button
              onClick={() => setView('list')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all border-l border-[rgba(0,229,255,0.2)]"
              style={{
                background: view === 'list' ? 'rgba(0,229,255,0.15)' : 'transparent',
                color: view === 'list' ? '#00e5ff' : '#7a9aaa',
              }}
            >
              <LayoutList size={14} /> Lista
            </button>
          </div>
          <Button onClick={() => openCreate()}><Plus size={16} /> Nuevo turno</Button>
        </div>
      </div>

      {/* Banner hoy / mañana — siempre visible */}
      <UpcomingBanner turnos={allTurnos} onEdit={openEdit} />

      {/* ── CALENDARIO ── */}
      {view === 'calendar' && (
        <CalendarView
          turnos={allTurnos}
          onEdit={openEdit}
          onNewAtDate={openCreate}
        />
      )}

      {/* ── LISTA ── */}
      {view === 'list' && (<>
      {/* Filtro por estado */}
      <div className="flex flex-wrap gap-2">
        {['', ...STATUSES].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s === filterStatus && s !== '' ? '' : s)}
            className="px-3 py-1.5 rounded-[2px] text-xs font-semibold uppercase tracking-wider transition-all duration-200"
            style={{
              background: filterStatus === s ? '#00e5ff' : 'rgba(0,229,255,0.04)',
              color: filterStatus === s ? '#111c2e' : '#7a9aaa',
              border: `1px solid ${filterStatus === s ? '#00e5ff' : 'rgba(0,229,255,0.14)'}`,
            }}
          >
            {s === '' ? 'Todos' : STATUS_META[s].label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <p style={{ color: '#7a9aaa' }}>Cargando...</p>
      ) : turnos.length === 0 ? (
        <Card className="text-center py-12">
          <CalendarDays size={36} className="mx-auto mb-3" style={{ color: '#2a3545' }} />
          <p style={{ color: '#7a9aaa' }}>No hay turnos registrados.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {[...turnos].sort((a, b) => {
            const ORDER: Record<string, number> = { CONFIRMADO: 0, PENDIENTE: 1, COMPLETADO: 2, CANCELADO: 3 }
            const oa = ORDER[a.status] ?? 99
            const ob = ORDER[b.status] ?? 99
            if (oa !== ob) return oa - ob
            return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
          }).map(t => {
            const meta = STATUS_META[t.status] ?? STATUS_META.PENDIENTE
            const StatusIcon = meta.icon
            const isPast = new Date(t.scheduledAt) < new Date() && t.status === 'PENDIENTE'
            return (
              <Card key={t.id} className={isPast ? 'border-red-800/40' : ''}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <StatusIcon size={18} className="flex-shrink-0 mt-0.5" style={{
                      color: t.status === 'COMPLETADO' ? '#10b981' :
                             t.status === 'CONFIRMADO' ? '#00e5ff' :
                             t.status === 'CANCELADO'  ? '#ef4444' : '#f59e0b'
                    }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-white font-medium">{t.clientName}</span>
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                        {isPast && <Badge variant="danger">Vencido</Badge>}
                      </div>
                      <p className="text-sm font-medium mb-1" style={{ color: '#00b8cc' }}>{t.service}</p>
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: '#00e5ff' }}>
                          <CalendarDays size={14} />
                          {formatDate(t.scheduledAt)}
                        </span>
                        {t.phone && (
                          <span className="flex items-center gap-1 text-xs" style={{ color: '#7a9aaa' }}>
                            <Phone size={12} />
                            {t.phone}
                          </span>
                        )}
                      </div>
                      {t.notes && <p className="text-xs mt-1" style={{ color: '#4a6070' }}>{t.notes}</p>}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {t.status === 'PENDIENTE' && (
                      <button
                        onClick={() => quickStatus(t.id, 'CONFIRMADO')}
                        className="text-xs px-2 py-1 rounded-[2px] transition"
                        style={{ background: 'rgba(0,229,255,0.08)', color: '#00e5ff', border: '1px solid rgba(0,229,255,0.2)' }}
                      >
                        Confirmar
                      </button>
                    )}
                    {(t.status === 'PENDIENTE' || t.status === 'CONFIRMADO') && (
                      <button
                        onClick={() => quickStatus(t.id, 'COMPLETADO')}
                        className="text-xs px-2 py-1 rounded-[2px] transition"
                        style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }}
                      >
                        Completar
                      </button>
                    )}
                    {(t.status === 'PENDIENTE' || t.status === 'CONFIRMADO') && (
                      <button
                        onClick={() => setConvertTurno(t)}
                        className="text-xs px-2 py-1 rounded-[2px] transition flex items-center gap-1"
                        style={{ background: 'rgba(0,229,255,0.08)', color: '#00e5ff', border: '1px solid rgba(0,229,255,0.2)' }}
                        title="Crear orden de trabajo"
                      >
                        <Briefcase size={12} /> Crear orden
                      </button>
                    )}
                    <button onClick={() => openEdit(t)} className="p-1.5 transition" style={{ color: '#7a9aaa' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#e8f0f4')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#7a9aaa')}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => deleteTurno(t.id)} className="p-1.5 transition" style={{ color: '#7a9aaa' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#7a9aaa')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
      </>)}

      {/* Modal conversión */}
      {convertTurno && (
        <ConvertirTurnoModal
          turno={convertTurno}
          onClose={() => setConvertTurno(null)}
          onDone={() => { setConvertTurno(null); fetchTurnos() }}
        />
      )}

      {/* Modal turno */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editTurno ? 'Editar turno' : 'Nuevo turno'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <label className="block text-[0.7rem] font-semibold text-[#7a9aaa] uppercase tracking-[0.2em] mb-1.5">
                Cliente *
              </label>
              <input
                required
                value={form.clientName}
                onChange={e => searchClients(e.target.value)}
                onBlur={() => setTimeout(() => setClientSuggestions([]), 150)}
                placeholder="Nombre del cliente"
                className="w-full bg-[#111c2e] border border-[rgba(0,229,255,0.18)] rounded-[2px] px-3 py-2.5 text-[#e8f0f4] placeholder-[#4a6a80] focus:outline-none focus:border-[#00b8cc] focus:shadow-[0_0_0_3px_rgba(0,229,255,0.18)] transition-all duration-200 text-sm font-light"
              />
              {clientSuggestions.length > 0 && (
                <div className="absolute z-30 left-0 right-0 top-full mt-1 bg-[#1c2b3f] border border-[rgba(0,229,255,0.25)] rounded-[2px] shadow-xl overflow-hidden">
                  {clientSuggestions.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onMouseDown={() => selectClient(c)}
                      className="w-full text-left px-3 py-2 hover:bg-[rgba(0,229,255,0.08)] transition-colors border-b border-[rgba(0,229,255,0.06)] last:border-0"
                    >
                      <p className="text-sm text-[#e8f0f4]">{c.name}</p>
                      {c.phone && <p className="text-xs text-[#7a9aaa]">{c.phone}</p>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Input
              label="Teléfono"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="Ej: 11-1234-5678"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[0.7rem] font-semibold text-[#7a9aaa] uppercase tracking-[0.2em] mb-1.5">
                Fecha y hora *
              </label>
              <input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
                className="w-full rounded-[2px] px-3 py-2.5 text-sm focus:outline-none transition-all duration-200"
                style={{
                  background: '#192638',
                  border: '1px solid rgba(0,229,255,0.14)',
                  color: '#e8f0f4',
                  colorScheme: 'dark',
                }}
                onFocus={e => { e.target.style.borderColor = '#00b8cc'; e.target.style.boxShadow = '0 0 0 3px rgba(0,229,255,0.12)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(0,229,255,0.14)'; e.target.style.boxShadow = 'none' }}
              />
            </div>
            <Select
              label="Estado"
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
            >
              {STATUSES.map(s => (
                <option key={s} value={s}>{STATUS_META[s].label}</option>
              ))}
            </Select>
          </div>
          <Select
            label="Servicio / Motivo *"
            value={form.service}
            onChange={e => setForm(f => ({ ...f, service: e.target.value }))}
          >
            <option value="" disabled>Seleccionar servicio...</option>
            {SERVICE_CATEGORIES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
          <Textarea
            label="Notas"
            rows={2}
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Información adicional..."
          />
          <div className="flex items-center justify-between gap-2 pt-2 flex-wrap">
            {editTurno && (form.status === 'PENDIENTE' || form.status === 'CONFIRMADO') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setShowModal(false); setConvertTurno(editTurno) }}
              >
                <Briefcase size={14} /> Crear orden de trabajo
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button
                onClick={save}
                disabled={saving || !form.clientName || !form.scheduledAt || !form.service || form.service === ''}
              >
                {saving ? 'Guardando...' : 'Guardar turno'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
