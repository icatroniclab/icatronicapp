'use client'
import { useState, useEffect, useRef } from 'react'
import { Zap, Trash2, ChevronDown, ChevronUp, Plus } from 'lucide-react'

const SERVICES = [
  'Cambio de carcasa',
  'Copia de llave',
  'Programación de llave',
  'Escaneo rápido',
  'Reset de servicio',
  'Diagnóstico rápido',
  'Otro',
]

const PAY_STATUS = [
  { value: 'PAGADO',   label: 'Pagado'   },
  { value: 'PARCIAL',  label: 'Parcial'  },
  { value: 'SENA',     label: 'Seña'     },
  { value: 'PENDIENTE',label: 'Pendiente'},
]

type QuickJob = {
  id: string
  date: string
  service: string
  description?: string | null
  clientName?: string | null
  price: number
  paymentStatus: string
  amountPaid: number
  notes?: string | null
}

const EMPTY = {
  service: SERVICES[0],
  description: '',
  clientName: '',
  price: '',
  paymentStatus: 'PAGADO',
  amountPaid: '',
}

function fmtMoney(n: number) {
  return '$' + n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function payBadge(status: string) {
  const map: Record<string, string> = {
    PAGADO:   'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    PARCIAL:  'bg-amber-500/15 text-amber-400 border-amber-500/30',
    SENA:     'bg-blue-500/15 text-blue-400 border-blue-500/30',
    PENDIENTE:'bg-red-500/15 text-red-400 border-red-500/30',
  }
  const labels: Record<string, string> = { PAGADO: 'Pagado', PARCIAL: 'Parcial', SENA: 'Seña', PENDIENTE: 'Pendiente' }
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded border ${map[status] ?? 'text-[#7a9aaa]'}`}>
      {labels[status] ?? status}
    </span>
  )
}

function jobIncome(j: QuickJob) {
  if (j.paymentStatus === 'PAGADO') return j.price
  if (j.paymentStatus === 'PARCIAL' || j.paymentStatus === 'SENA') return j.amountPaid
  return 0
}

function buildMonthOptions() {
  const opts: { value: string; label: string }[] = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
    opts.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) })
  }
  return opts
}

const MONTH_OPTIONS = buildMonthOptions()

export default function RapidosPage() {
  const todayStr = new Date().toISOString().split('T')[0]

  const [todayJobs, setTodayJobs] = useState<QuickJob[]>([])
  const [histJobs, setHistJobs]   = useState<QuickJob[]>([])
  const [loadingToday, setLoadingToday] = useState(true)
  const [loadingHist, setLoadingHist]   = useState(false)
  const [saving, setSaving]   = useState(false)
  const [showHist, setShowHist] = useState(false)
  const [histMonth, setHistMonth] = useState(MONTH_OPTIONS[0].value)
  const [form, setForm] = useState(EMPTY)
  const [clientSuggestions, setClientSuggestions] = useState<any[]>([])
  const clientTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const priceRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/quick-jobs?date=' + todayStr)
      .then(r => r.json())
      .then(d => { setTodayJobs(d); setLoadingToday(false) })
  }, [todayStr])

  useEffect(() => {
    if (!showHist) return
    setLoadingHist(true)
    fetch('/api/quick-jobs?month=' + histMonth)
      .then(r => r.json())
      .then(d => { setHistJobs(d); setLoadingHist(false) })
  }, [showHist, histMonth])

  function searchClients(value: string) {
    setForm(p => ({ ...p, clientName: value }))
    if (clientTimeout.current) clearTimeout(clientTimeout.current)
    if (value.length < 2) { setClientSuggestions([]); return }
    clientTimeout.current = setTimeout(async () => {
      const res = await fetch(`/api/clientes?q=${encodeURIComponent(value)}`)
      const data = await res.json()
      setClientSuggestions(Array.isArray(data) ? data.slice(0, 6) : [])
    }, 300)
  }

  function selectClient(c: any) {
    setForm(p => ({ ...p, clientName: c.name }))
    setClientSuggestions([])
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const price = parseFloat(form.price) || 0
    if (!price) return
    setSaving(true)

    const isPartial = form.paymentStatus === 'PARCIAL' || form.paymentStatus === 'SENA'
    const amountPaid = form.paymentStatus === 'PAGADO'
      ? price
      : form.paymentStatus === 'PENDIENTE'
        ? 0
        : parseFloat(form.amountPaid) || 0

    const res = await fetch('/api/quick-jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service: form.service,
        description: form.description || null,
        clientName: form.clientName || null,
        price,
        paymentStatus: form.paymentStatus,
        amountPaid,
      }),
    })

    if (res.ok) {
      const job = await res.json()
      setTodayJobs(prev => [job, ...prev])
      setForm(EMPTY)
      priceRef.current?.focus()
    }
    setSaving(false)
  }

  async function deleteJob(id: string, isToday: boolean) {
    await fetch('/api/quick-jobs/' + id, { method: 'DELETE' })
    if (isToday) setTodayJobs(prev => prev.filter(j => j.id !== id))
    else         setHistJobs(prev => prev.filter(j => j.id !== id))
  }

  const todayIncome = todayJobs.reduce((s, j) => s + jobIncome(j), 0)
  const histIncome  = histJobs.reduce((s, j) => s + jobIncome(j), 0)
  const needsAmount = form.paymentStatus === 'PARCIAL' || form.paymentStatus === 'SENA'

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Zap size={22} className="text-[#00e5ff]" style={{ filter: 'drop-shadow(0 0 6px rgba(0,229,255,0.6))' }} />
        <h1 className="text-xl font-semibold text-[#e8f0f4] tracking-wide">Trabajos Rápidos</h1>
      </div>

      {/* Form */}
      <div className="bg-[#192638] border border-[rgba(0,229,255,0.12)] rounded-[4px] p-5">
        <p className="text-xs text-[#7a9aaa] uppercase tracking-wider mb-4">Nuevo trabajo</p>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#7a9aaa] mb-1 block">Servicio</label>
              <select
                value={form.service}
                onChange={e => setForm(p => ({ ...p, service: e.target.value }))}
                className="w-full bg-[#111c2e] border border-[rgba(0,229,255,0.15)] rounded-[3px] px-3 py-2 text-sm text-[#e8f0f4] focus:outline-none focus:border-[#00e5ff]"
              >
                {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="relative">
              <label className="text-xs text-[#7a9aaa] mb-1 block">Cliente (opcional)</label>
              <input
                type="text"
                placeholder="Nombre o descripción"
                value={form.clientName}
                onChange={e => searchClients(e.target.value)}
                onBlur={() => setTimeout(() => setClientSuggestions([]), 150)}
                className="w-full bg-[#111c2e] border border-[rgba(0,229,255,0.15)] rounded-[3px] px-3 py-2 text-sm text-[#e8f0f4] placeholder-[#4a5568] focus:outline-none focus:border-[#00e5ff]"
              />
              {clientSuggestions.length > 0 && (
                <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-[#1c2b3f] border border-[rgba(0,229,255,0.25)] rounded-[3px] shadow-xl overflow-hidden">
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
          </div>

          <div>
            <label className="text-xs text-[#7a9aaa] mb-1 block">Descripción / detalle (opcional)</label>
            <input
              type="text"
              placeholder="Ej: Chevrolet Onix 2019, llave con chip"
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className="w-full bg-[#111c2e] border border-[rgba(0,229,255,0.15)] rounded-[3px] px-3 py-2 text-sm text-[#e8f0f4] placeholder-[#4a5568] focus:outline-none focus:border-[#00e5ff]"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-[#7a9aaa] mb-1 block">Precio ($)</label>
              <input
                ref={priceRef}
                type="number"
                min="0"
                step="100"
                placeholder="0"
                value={form.price}
                onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                className="w-full bg-[#111c2e] border border-[rgba(0,229,255,0.15)] rounded-[3px] px-3 py-2 text-sm text-[#e8f0f4] placeholder-[#4a5568] focus:outline-none focus:border-[#00e5ff]"
              />
            </div>
            <div>
              <label className="text-xs text-[#7a9aaa] mb-1 block">Estado de pago</label>
              <select
                value={form.paymentStatus}
                onChange={e => setForm(p => ({ ...p, paymentStatus: e.target.value }))}
                className="w-full bg-[#111c2e] border border-[rgba(0,229,255,0.15)] rounded-[3px] px-3 py-2 text-sm text-[#e8f0f4] focus:outline-none focus:border-[#00e5ff]"
              >
                {PAY_STATUS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            {needsAmount && (
              <div>
                <label className="text-xs text-[#7a9aaa] mb-1 block">Monto cobrado ($)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  placeholder="0"
                  value={form.amountPaid}
                  onChange={e => setForm(p => ({ ...p, amountPaid: e.target.value }))}
                  className="w-full bg-[#111c2e] border border-[rgba(0,229,255,0.15)] rounded-[3px] px-3 py-2 text-sm text-[#e8f0f4] placeholder-[#4a5568] focus:outline-none focus:border-[#00e5ff]"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={saving || !form.price}
            className="flex items-center gap-2 px-5 py-2 bg-[#00e5ff] hover:bg-[#00c4db] disabled:opacity-40 text-[#111c2e] text-sm font-semibold rounded-[3px] transition-colors"
          >
            <Plus size={15} />
            {saving ? 'Guardando...' : 'Registrar trabajo'}
          </button>
        </form>
      </div>

      {/* Today summary */}
      <div className="bg-[#192638] border border-[rgba(0,229,255,0.12)] rounded-[4px] p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-[#7a9aaa] uppercase tracking-wider">Hoy — {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <div className="flex gap-4 text-sm">
            <span className="text-[#7a9aaa]">{todayJobs.length} trabajo{todayJobs.length !== 1 ? 's' : ''}</span>
            <span className="text-[#00e5ff] font-semibold">{fmtMoney(todayIncome)}</span>
          </div>
        </div>

        {loadingToday ? (
          <p className="text-sm text-[#7a9aaa]">Cargando...</p>
        ) : todayJobs.length === 0 ? (
          <p className="text-sm text-[#4a5568]">Sin trabajos registrados hoy.</p>
        ) : (
          <div className="space-y-2">
            {todayJobs.map(job => (
              <div key={job.id} className="flex items-center gap-3 py-2.5 border-b border-[rgba(0,229,255,0.06)] last:border-0">
                <span className="text-xs text-[#4a5568] w-12 shrink-0">{fmtTime(job.date)}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-[#e8f0f4]">{job.service}</span>
                  {job.description && <span className="text-xs text-[#7a9aaa] ml-2">· {job.description}</span>}
                  {job.clientName  && <span className="text-xs text-[#7a9aaa] ml-2">· {job.clientName}</span>}
                </div>
                <span className="text-sm font-medium text-[#e8f0f4] shrink-0">{fmtMoney(job.price)}</span>
                {payBadge(job.paymentStatus)}
                <button
                  onClick={() => deleteJob(job.id, true)}
                  className="text-[#4a5568] hover:text-red-400 transition-colors shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History */}
      <div className="bg-[#192638] border border-[rgba(0,229,255,0.12)] rounded-[4px]">
        <button
          onClick={() => setShowHist(p => !p)}
          className="w-full flex items-center justify-between px-5 py-4 text-sm text-[#7a9aaa] hover:text-[#e8f0f4] transition-colors"
        >
          <span className="text-xs uppercase tracking-wider">Historial por mes</span>
          {showHist ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showHist && (
          <div className="px-5 pb-5 space-y-4">
            <div className="flex items-center gap-3">
              <select
                value={histMonth}
                onChange={e => setHistMonth(e.target.value)}
                className="bg-[#111c2e] border border-[rgba(0,229,255,0.15)] rounded-[3px] px-3 py-1.5 text-sm text-[#e8f0f4] focus:outline-none focus:border-[#00e5ff]"
              >
                {MONTH_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {!loadingHist && (
                <span className="text-sm text-[#7a9aaa]">
                  {histJobs.length} trabajos · <span className="text-[#00e5ff] font-medium">{fmtMoney(histIncome)}</span>
                </span>
              )}
            </div>

            {loadingHist ? (
              <p className="text-sm text-[#7a9aaa]">Cargando...</p>
            ) : histJobs.length === 0 ? (
              <p className="text-sm text-[#4a5568]">Sin trabajos en este período.</p>
            ) : (
              <div className="space-y-0">
                <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-x-3 text-[11px] text-[#4a5568] uppercase tracking-wider pb-2 border-b border-[rgba(0,229,255,0.06)]">
                  <span>Fecha</span>
                  <span>Servicio / detalle</span>
                  <span className="text-right">Precio</span>
                  <span>Estado</span>
                  <span />
                </div>
                {histJobs.map(job => (
                  <div key={job.id} className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-x-3 items-center py-2.5 border-b border-[rgba(0,229,255,0.04)] last:border-0">
                    <span className="text-xs text-[#4a5568] whitespace-nowrap">{fmtDate(job.date)} {fmtTime(job.date)}</span>
                    <div className="min-w-0">
                      <span className="text-sm text-[#e8f0f4]">{job.service}</span>
                      {job.description && <span className="text-xs text-[#7a9aaa] ml-2">· {job.description}</span>}
                      {job.clientName  && <span className="text-xs text-[#7a9aaa] ml-2">· {job.clientName}</span>}
                    </div>
                    <span className="text-sm text-[#e8f0f4] text-right whitespace-nowrap">{fmtMoney(job.price)}</span>
                    {payBadge(job.paymentStatus)}
                    <button
                      onClick={() => deleteJob(job.id, false)}
                      className="text-[#4a5568] hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
