'use client'
import { useState, useEffect } from 'react'
import {
  TrendingUp, TrendingDown, Wrench, DollarSign, Award, BarChart2,
  Car, Cpu, Users, Calendar, Activity, CreditCard, Zap,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, PieChart, Pie, Cell, BarChart,
} from 'recharts'

// ── Helpers ─────────────────────────────────────────────────────────────────

const MONTH_LABELS: Record<string, string> = {
  '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr',
  '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic',
}

const STATUS_LABEL: Record<string, string> = {
  INGRESADO: 'Ingresado', EN_DIAGNOSTICO: 'En diagnóstico',
  EN_REPARACION: 'En reparación', EN_PROGRAMACION: 'En programación',
  EN_PROCESO: 'En proceso', LISTO: 'Listo', ENTREGADO: 'Entregado',
}
const WORK_TYPE_LABEL: Record<string, string> = {
  DIAGNOSTICO: 'Diagnóstico', REPARACION: 'Reparación', PROGRAMACION: 'Programación',
}
const PAY_LABEL: Record<string, string> = {
  PENDIENTE: 'Pendiente', SENA: 'Seña', PARCIAL: 'Parcial', PAGADO: 'Pagado',
}

const PALETTE = ['#00e5ff', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6', '#f97316', '#a3e635']

const shortMonth = (key: string) => {
  const [y, m] = key.split('-')
  return `${MONTH_LABELS[m]} ${y.slice(2)}`
}

const tooltipStyle = {
  background: '#192638', border: '1px solid rgba(0,229,255,0.2)',
  borderRadius: 2, fontSize: 12, color: '#e8f0f4',
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color = '#00e5ff', sub }: {
  icon: any; label: string; value: string; color?: string; sub?: string
}) {
  return (
    <Card className="flex items-center gap-4">
      <Icon size={22} style={{ color, filter: `drop-shadow(0 0 6px ${color}88)`, flexShrink: 0 }} />
      <div>
        <p className="text-[#7a9aaa] text-xs uppercase tracking-widest">{label}</p>
        <p className="font-bold text-lg" style={{ color }}>{value}</p>
        {sub && <p className="text-[#7a9aaa] text-xs mt-0.5">{sub}</p>}
      </div>
    </Card>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="w-1 h-6 bg-[#00e5ff] rounded-full inline-block" />
      <h2 className="text-xl font-bold text-white">{children}</h2>
    </div>
  )
}

function HorizontalBarChart({ data, dataKey, labelKey, color = '#00e5ff', unit = '' }: {
  data: any[]; dataKey: string; labelKey: string; color?: string; unit?: string
}) {
  if (!data.length) return <p className="text-gray-600 text-xs italic">Sin datos</p>
  const max = Math.max(...data.map(d => d[dataKey]))
  return (
    <div className="space-y-1.5">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-[#7a9aaa] w-32 truncate shrink-0" title={item[labelKey]}>{item[labelKey]}</span>
          <div className="flex-1 h-5 bg-[#1e2d42] rounded-sm overflow-hidden">
            <div
              className="h-full rounded-sm transition-all duration-500"
              style={{ width: `${(item[dataKey] / max) * 100}%`, background: PALETTE[i % PALETTE.length] }}
            />
          </div>
          <span className="text-xs font-mono text-white w-12 text-right shrink-0">
            {unit === '$' ? formatCurrency(item[dataKey]) : item[dataKey]}
          </span>
        </div>
      ))}
    </div>
  )
}

function DonutChart({ data, labelKey, valueKey }: { data: any[]; labelKey: string; valueKey: string }) {
  if (!data.length) return <p className="text-gray-600 text-xs italic">Sin datos</p>
  const total = data.reduce((s, d) => s + d[valueKey], 0)
  return (
    <div className="flex items-center gap-6">
      <PieChart width={140} height={140}>
        <Pie data={data} dataKey={valueKey} nameKey={labelKey} cx="50%" cy="50%"
          innerRadius={42} outerRadius={65} paddingAngle={2}>
          {data.map((_: any, i: number) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
        </Pie>
        <Tooltip
          formatter={(v: any, name: string) => [v, name]}
          contentStyle={tooltipStyle}
        />
      </PieChart>
      <div className="space-y-1.5 flex-1 min-w-0">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PALETTE[i % PALETTE.length] }} />
            <span className="text-xs text-[#7a9aaa] truncate flex-1">{item[labelKey]}</span>
            <span className="text-xs font-mono text-white shrink-0">{item[valueKey]}</span>
            <span className="text-xs text-gray-600 shrink-0">{total ? `${Math.round(item[valueKey] / total * 100)}%` : ''}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Month options ────────────────────────────────────────────────────────────

function buildMonthOptions() {
  const options: { value: string; label: string }[] = [{ value: '', label: 'Todos los meses' }]
  const now = new Date()
  for (let i = 0; i < 30; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const key = `${y}-${m}`
    options.push({ value: key, label: `${MONTH_LABELS[m]} ${y}` })
  }
  return options
}

const MONTH_OPTIONS = buildMonthOptions()

// ── Main page ────────────────────────────────────────────────────────────────

export default function AnalisisPage() {
  const [fin, setFin]       = useState<any>(null)
  const [ops, setOps]       = useState<any>(null)
  const [loading, setLoading]   = useState(true)
  const [opsLoading, setOpsLoading] = useState(false)
  const [view, setView]     = useState<string>('todos')
  const [selectedMonth, setSelectedMonth] = useState<string>('')

  useEffect(() => {
    Promise.all([
      fetch('/api/analisis').then(r => r.json()),
      fetch('/api/analisis/ops').then(r => r.json()),
    ]).then(([f, o]) => { setFin(f); setOps(o); setLoading(false) })
  }, [])

  useEffect(() => {
    if (loading) return
    setOpsLoading(true)
    const url = selectedMonth ? `/api/analisis/ops?month=${selectedMonth}` : '/api/analisis/ops'
    fetch(url).then(r => r.json()).then(o => { setOps(o); setOpsLoading(false) })
  }, [selectedMonth])

  if (loading) return <p className="text-[#7a9aaa] animate-pulse">Cargando análisis...</p>
  if (!fin || !ops) return null

  const { monthly, byYear, summary } = fin
  const filteredMonthly = view === 'todos'
    ? monthly
    : monthly.filter((m: any) => m.month.startsWith(view))
  const years: number[] = byYear.map((y: any) => y.year)

  // Pie data: vehicle vs module vs quick
  const tipoTrabajoData = [
    { label: 'Órdenes de vehículo', value: ops.totals.vehicleJobs },
    { label: 'Módulos', value: ops.totals.moduleJobs },
    { label: 'Trabajos rápidos', value: ops.totals.quickJobs ?? 0 },
  ].filter(d => d.value > 0)

  const woStatusData = ops.woStatuses.map((s: any) => ({
    label: STATUS_LABEL[s.status] ?? s.status, value: s.count,
  }))
  const mjStatusData = ops.mjStatuses.map((s: any) => ({
    label: STATUS_LABEL[s.status] ?? s.status, value: s.count,
  }))
  const payData = ops.paymentStatuses.map((s: any) => ({
    label: PAY_LABEL[s.status] ?? s.status, value: s.count,
  }))
  const workTypeData = ops.moduleWorkTypes.map((s: any) => ({
    label: WORK_TYPE_LABEL[s.type] ?? s.type, value: s.count,
  }))
  const ticketData = Object.entries(ops.ticketPorTipo as Record<string, number>)
    .map(([label, value]) => ({ label, value }))
  const moduleTicketData = Object.entries(ops.moduleTicketByType as Record<string, number>)
    .map(([type, value]) => ({ label: WORK_TYPE_LABEL[type] ?? type, value: Math.round(value) }))

  return (
    <div className="space-y-6 max-w-6xl">
      <h1 className="text-2xl font-bold text-white">Análisis & Rendimientos</h1>

      {/* ── SECCIÓN FINANCIERA ─────────────────────────────────────────── */}
      <SectionTitle>Financiero</SectionTitle>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp}  label="Total cobrado"   value={formatCurrency(summary.totalIngresos)} color="#10b981" />
        <StatCard icon={TrendingDown} label="Total gastos"   value={formatCurrency(summary.totalGastos)}   color="#ef4444" />
        <StatCard
          icon={DollarSign} label="Resultado neto"
          value={formatCurrency(Math.abs(summary.neto))}
          color={summary.neto >= 0 ? '#3b82f6' : '#f59e0b'}
          sub={summary.neto >= 0 ? 'Ganancia' : 'Pérdida'}
        />
        <StatCard icon={Wrench} label="Trabajos totales" value={summary.totalTrabajos.toString()} color="#00e5ff"
          sub={`Ticket prom. ${formatCurrency(summary.ticketPromedio)}`} />
      </div>

      {summary.bestMonth && (
        <Card className="flex items-center gap-4">
          <Award size={22} style={{ color: '#f59e0b', filter: 'drop-shadow(0 0 6px #f59e0b88)', flexShrink: 0 }} />
          <div>
            <p className="text-[#7a9aaa] text-xs uppercase tracking-widest">Mejor mes</p>
            <p className="text-[#f59e0b] font-bold text-base">
              {shortMonth(summary.bestMonth.month)} — {formatCurrency(summary.bestMonth.ingresos)}
            </p>
            <p className="text-[#7a9aaa] text-xs">{summary.bestMonth.trabajos} trabajos</p>
          </div>
        </Card>
      )}

      {byYear.length > 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {byYear.map((y: any) => (
            <Card key={y.year}>
              <p className="text-[#00e5ff] font-bold text-base mb-3" style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.1em' }}>
                {y.year}
              </p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm"><span className="text-[#7a9aaa]">Cobrado</span><span className="text-emerald-400 font-semibold">{formatCurrency(y.ingresos)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-[#7a9aaa]">Gastos</span><span className="text-red-400 font-semibold">{formatCurrency(y.gastos)}</span></div>
                <div className="flex justify-between text-sm border-t border-[rgba(0,229,255,0.1)] pt-1.5 mt-1.5">
                  <span className="text-[#7a9aaa]">Neto</span>
                  <span className={`font-bold ${y.neto >= 0 ? 'text-blue-400' : 'text-yellow-400'}`}>{formatCurrency(y.neto)}</span>
                </div>
                <div className="flex justify-between text-sm"><span className="text-[#7a9aaa]">Trabajos</span><span className="text-[#e8f0f4]">{y.trabajos}</span></div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Filtro por año */}
      <div className="flex gap-2 flex-wrap">
        {(['todos', ...years.map(String)] as const).map((v: any) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-2 rounded-[2px] text-sm font-medium transition ${
              view === v ? 'bg-[#00e5ff] text-[#111c2e]' : 'bg-[#1e2d42] text-[#7a9aaa] hover:text-white'
            }`}
          >
            {v === 'todos' ? 'Todos' : v}
          </button>
        ))}
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 size={16} className="text-[#00e5ff]" />
          <h3 className="font-semibold text-white">Ingresos vs Gastos por mes</h3>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={filteredMonthly} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.06)" vertical={false} />
            <XAxis dataKey="month" tickFormatter={shortMonth} tick={{ fill: '#7a9aaa', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#7a9aaa', fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={(v) => v >= 1_000_000 ? `$${(v/1_000_000).toFixed(1)}M` : v >= 1_000 ? `$${(v/1_000).toFixed(0)}k` : `$${v}`}
            />
            <Tooltip formatter={(v: any, name: string) => [formatCurrency(Number(v)), name === 'ingresos' ? 'Cobrado' : name === 'gastos' ? 'Gastos' : 'Neto']}
              labelFormatter={shortMonth} contentStyle={tooltipStyle} />
            <Legend formatter={(v) => v === 'ingresos' ? 'Cobrado' : v === 'gastos' ? 'Gastos' : 'Neto'} wrapperStyle={{ fontSize: 12, color: '#7a9aaa' }} />
            <Bar dataKey="ingresos" fill="#10b981" radius={[3,3,0,0]} maxBarSize={40} />
            <Bar dataKey="gastos"   fill="#ef4444" radius={[3,3,0,0]} maxBarSize={40} />
            <Line dataKey="neto" type="monotone" stroke="#00e5ff" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <h3 className="font-semibold text-white mb-4">Detalle mensual</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[#7a9aaa] text-xs uppercase tracking-wider border-b border-[rgba(0,229,255,0.08)]">
                <th className="text-left pb-2 pr-4">Mes</th>
                <th className="text-right pb-2 pr-4">Trabajos</th>
                <th className="text-right pb-2 pr-4">Cobrado</th>
                <th className="text-right pb-2 pr-4">Gastos</th>
                <th className="text-right pb-2">Neto</th>
              </tr>
            </thead>
            <tbody>
              {[...filteredMonthly].reverse().map((m: any) => (
                <tr key={m.month} className="border-b border-[rgba(0,229,255,0.04)] hover:bg-[rgba(0,229,255,0.02)]">
                  <td className="py-2 pr-4 text-[#e8f0f4]">{shortMonth(m.month)}</td>
                  <td className="py-2 pr-4 text-right text-[#7a9aaa]">{m.trabajos}</td>
                  <td className="py-2 pr-4 text-right text-emerald-400">{formatCurrency(m.ingresos)}</td>
                  <td className="py-2 pr-4 text-right text-red-400">{formatCurrency(m.gastos)}</td>
                  <td className={`py-2 text-right font-semibold ${m.neto >= 0 ? 'text-blue-400' : 'text-yellow-400'}`}>{formatCurrency(m.neto)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── SECCIÓN OPERATIVA ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <SectionTitle>Operaciones</SectionTitle>
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-[#7a9aaa]" />
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="bg-[#1e2d42] border border-[rgba(0,229,255,0.15)] text-white text-sm rounded-[2px] px-3 py-1.5 focus:outline-none focus:border-[#00e5ff]"
          >
            {MONTH_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {opsLoading && <span className="text-xs text-[#7a9aaa] animate-pulse">Cargando...</span>}
        </div>
      </div>

      {selectedMonth && (
        <div className="text-xs text-[#00e5ff] bg-[rgba(0,229,255,0.06)] border border-[rgba(0,229,255,0.15)] rounded px-3 py-1.5">
          Mostrando datos de: <strong>{MONTH_OPTIONS.find(o => o.value === selectedMonth)?.label}</strong>
        </div>
      )}

      {/* Resumen operativo */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard icon={Car}      label="Órdenes de vehículo" value={ops.totals.vehicleJobs.toString()} color="#3b82f6" />
        <StatCard icon={Cpu}      label="Trabajos de módulo"  value={ops.totals.moduleJobs.toString()}  color="#8b5cf6" />
        <StatCard icon={Zap}      label="Trabajos rápidos"    value={(ops.totals.quickJobs ?? 0).toString()} color="#f59e0b" />
        <StatCard icon={Activity} label="Promedio por día"    value={`${ops.totals.avgPerDay}`}         color="#10b981" sub={selectedMonth ? 'trabajos/día en el mes' : 'trabajos/día histórico'} />
        <StatCard icon={CreditCard} label="Ticket prom. vehículo" value={formatCurrency(ops.ticketPorTipo['Vehículo'] ?? 0)} color="#f59e0b" />
      </div>

      {/* Tipo de trabajo + Estado de pago */}
      <div className="grid xl:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Wrench size={14} className="text-[#00e5ff]" /> Tipo de trabajo</h3>
          <DonutChart data={tipoTrabajoData} labelKey="label" valueKey="value" />
        </Card>
        <Card>
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><CreditCard size={14} className="text-[#00e5ff]" /> Estado de pago (todos los trabajos)</h3>
          <DonutChart data={payData} labelKey="label" valueKey="value" />
        </Card>
      </div>

      {/* Tipos de módulos + Estado módulos */}
      {ops.totals.moduleJobs > 0 && (
        <div className="grid xl:grid-cols-2 gap-6">
          <Card>
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Cpu size={14} className="text-[#00e5ff]" /> Tipo de trabajo en módulos</h3>
            <DonutChart data={workTypeData} labelKey="label" valueKey="value" />
          </Card>
          <Card>
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Cpu size={14} className="text-[#00e5ff]" /> Estado de módulos</h3>
            <DonutChart data={mjStatusData} labelKey="label" valueKey="value" />
          </Card>
        </div>
      )}

      {/* Estado órdenes de vehículo */}
      {ops.totals.vehicleJobs > 0 && (
        <Card>
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Car size={14} className="text-[#00e5ff]" /> Estado órdenes de vehículo</h3>
          <DonutChart data={woStatusData} labelKey="label" valueKey="value" />
        </Card>
      )}

      {/* Marcas y modelos */}
      <div className="grid xl:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Car size={14} className="text-[#00e5ff]" /> Marcas más frecuentes</h3>
          <HorizontalBarChart data={ops.topBrands} dataKey="count" labelKey="brand" />
        </Card>
        <Card>
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Car size={14} className="text-[#00e5ff]" /> Modelos más frecuentes</h3>
          <HorizontalBarChart data={ops.topModels} dataKey="count" labelKey="label" />
        </Card>
      </div>

      {/* Módulos más reparados */}
      {ops.topModuleTypes.length > 0 && (
        <Card>
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Cpu size={14} className="text-[#00e5ff]" /> Módulos más trabajados</h3>
          <HorizontalBarChart data={ops.topModuleTypes} dataKey="count" labelKey="name" />
        </Card>
      )}

      {/* Ticket promedio por tipo */}
      <div className="grid xl:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><DollarSign size={14} className="text-[#00e5ff]" /> Ticket promedio por tipo</h3>
          <HorizontalBarChart data={ticketData} dataKey="value" labelKey="label" color="#f59e0b" unit="$" />
        </Card>
        {moduleTicketData.length > 0 && (
          <Card>
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><DollarSign size={14} className="text-[#00e5ff]" /> Ticket promedio por tipo de módulo</h3>
            <HorizontalBarChart data={moduleTicketData} dataKey="value" labelKey="label" color="#8b5cf6" unit="$" />
          </Card>
        )}
      </div>

      {/* Clientes frecuentes */}
      {ops.topClients.length > 0 && (
        <Card>
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Users size={14} className="text-[#00e5ff]" /> Clientes más recurrentes</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#7a9aaa] text-xs uppercase tracking-wider border-b border-[rgba(0,229,255,0.08)]">
                  <th className="text-left pb-2 pr-4">#</th>
                  <th className="text-left pb-2 pr-4">Cliente</th>
                  <th className="text-right pb-2 pr-4">Vehículos</th>
                  <th className="text-right pb-2 pr-4">Módulos</th>
                  <th className="text-right pb-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {ops.topClients.map((c: any, i: number) => (
                  <tr key={i} className="border-b border-[rgba(0,229,255,0.04)] hover:bg-[rgba(0,229,255,0.02)]">
                    <td className="py-2 pr-4 text-[#7a9aaa] font-mono text-xs">{i + 1}</td>
                    <td className="py-2 pr-4 text-[#e8f0f4] font-medium">{c.name}</td>
                    <td className="py-2 pr-4 text-right text-[#7a9aaa]">{c.vehicleJobs}</td>
                    <td className="py-2 pr-4 text-right text-[#7a9aaa]">{c.moduleJobs}</td>
                    <td className="py-2 text-right font-bold text-[#00e5ff]">{c.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Trabajos por día de la semana */}
      <Card>
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Calendar size={14} className="text-[#00e5ff]" /> Ingresos por día de la semana</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={ops.jobsByDay} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.06)" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: '#7a9aaa', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#7a9aaa', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="count" name="Trabajos" radius={[4,4,0,0]} maxBarSize={50}>
              {ops.jobsByDay.map((_: any, i: number) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* DTC codes */}
      {ops.topDtcCodes.length > 0 && (
        <Card>
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Activity size={14} className="text-[#00e5ff]" /> Códigos DTC más frecuentes</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#7a9aaa] text-xs uppercase tracking-wider border-b border-[rgba(0,229,255,0.08)]">
                  <th className="text-left pb-2 pr-4">Código</th>
                  <th className="text-left pb-2 pr-4">Descripción</th>
                  <th className="text-right pb-2">Ocurrencias</th>
                </tr>
              </thead>
              <tbody>
                {ops.topDtcCodes.map((d: any, i: number) => (
                  <tr key={i} className="border-b border-[rgba(0,229,255,0.04)] hover:bg-[rgba(0,229,255,0.02)]">
                    <td className="py-2 pr-4 font-mono text-[#00e5ff] text-xs">{d.code}</td>
                    <td className="py-2 pr-4 text-[#7a9aaa] text-xs">{d.description || '—'}</td>
                    <td className="py-2 text-right font-bold text-white">{d.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Turnos por servicio */}
      {ops.appointmentServices.length > 0 && (
        <Card>
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Calendar size={14} className="text-[#00e5ff]" /> Turnos por tipo de servicio</h3>
          <HorizontalBarChart data={ops.appointmentServices} dataKey="count" labelKey="service" />
        </Card>
      )}

      {/* Trabajos rápidos por servicio */}
      {(ops.quickJobServices ?? []).length > 0 && (
        <Card>
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Zap size={14} className="text-[#f59e0b]" /> Servicios rápidos más frecuentes</h3>
          <HorizontalBarChart data={ops.quickJobServices} dataKey="count" labelKey="service" color="#f59e0b" />
        </Card>
      )}
    </div>
  )
}
