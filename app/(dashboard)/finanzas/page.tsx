'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, TrendingUp, TrendingDown, Clock, CheckCircle, Cpu, Car, Zap } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { PaymentBadge } from '@/components/ui/Badge'
import { formatCurrency, formatDate, EXPENSE_CATEGORIES } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const MONTHS = Array.from({ length: 30 }, (_, i) => {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - i)
  return { value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleString('es-AR', { month: 'long', year: 'numeric' }) }
})

export default function FinanzasPage() {
  const [month, setMonth] = useState(MONTHS[0].value)
  const [data, setData] = useState<any>({ ingresos: [], gastos: [], pendientes: [], totalIngresos: 0, totalGastos: 0, totalPendiente: 0, neto: 0 })
  const [loading, setLoading] = useState(true)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [expenseForm, setExpenseForm] = useState({ category: 'OTROS', amount: '', date: new Date().toISOString().split('T')[0], description: '' })
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'ingresos' | 'gastos' | 'pendientes'>('ingresos')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/finanzas?month=${month}`)
    setData(await res.json())
    setLoading(false)
  }, [month])

  useEffect(() => { fetchData() }, [fetchData])

  async function addExpense() {
    setSaving(true)
    await fetch('/api/finanzas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expenseForm),
    })
    setSaving(false)
    setShowExpenseModal(false)
    setExpenseForm({ category: 'OTROS', amount: '', date: new Date().toISOString().split('T')[0], description: '' })
    fetchData()
  }

  async function markAsPaid(id: string, budget: number, source: string) {
    const url = source === 'modulo' ? `/api/modulos/${id}` : source === 'rapido' ? `/api/quick-jobs/${id}` : `/api/ordenes/${id}`
    await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentStatus: 'PAGADO', amountPaid: budget }),
    })
    fetchData()
  }

  async function deleteExpense(id: string) {
    if (!confirm('¿Eliminar este gasto?')) return
    await fetch(`/api/finanzas/${id}`, { method: 'DELETE' })
    fetchData()
  }

  const chartData = [
    { name: 'Ingresos', value: data.totalIngresos, color: '#10b981' },
    { name: 'Gastos', value: data.totalGastos, color: '#ef4444' },
    { name: 'Neto', value: Math.abs(data.neto), color: data.neto >= 0 ? '#3b82f6' : '#f59e0b' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white">Finanzas</h1>
        <div className="flex gap-3">
          <select value={month} onChange={e => setMonth(e.target.value)} className="bg-[#192638] border border-[rgba(0,229,255,0.2)] rounded-[2px] px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00e5ff]">
            {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <Button onClick={() => setShowExpenseModal(true)}><Plus size={16} /> Gasto</Button>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4">
          <TrendingUp size={24} className="text-emerald-400 flex-shrink-0" />
          <div>
            <p className="text-gray-400 text-xs">Cobrado</p>
            <p className="text-emerald-400 font-bold text-xl">{formatCurrency(data.totalIngresos)}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <TrendingDown size={24} className="text-red-400 flex-shrink-0" />
          <div>
            <p className="text-gray-400 text-xs">Gastos</p>
            <p className="text-red-400 font-bold text-xl">{formatCurrency(data.totalGastos)}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className={`text-2xl font-bold flex-shrink-0 ${data.neto >= 0 ? 'text-blue-400' : 'text-yellow-400'}`}>
            {data.neto >= 0 ? '+' : '−'}
          </div>
          <div>
            <p className="text-gray-400 text-xs">Resultado neto</p>
            <p className={`font-bold text-xl ${data.neto >= 0 ? 'text-blue-400' : 'text-yellow-400'}`}>{formatCurrency(Math.abs(data.neto))}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <Clock size={24} className="text-orange-400 flex-shrink-0" />
          <div>
            <p className="text-gray-400 text-xs">Por cobrar</p>
            <p className="text-orange-400 font-bold text-xl">{formatCurrency(data.totalPendiente)}</p>
          </div>
        </Card>
      </div>

      {/* Gráfico */}
      <Card>
        <h2 className="font-semibold text-white mb-4">Resumen visual</h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} barSize={60}>
            <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => formatCurrency(v).replace('$', '$')} />
            <Tooltip formatter={(v: any) => formatCurrency(Number(v))} contentStyle={{ background: '#1e2d42', border: '1px solid #253652', borderRadius: 8 }} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {([
          { key: 'ingresos', label: `Cobrado (${data.ingresos.length})` },
          { key: 'gastos', label: `Gastos (${data.gastos.length})` },
          { key: 'pendientes', label: `Pendientes de cobro (${data.pendientes?.length ?? 0})` },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === t.key
                ? t.key === 'pendientes' ? 'bg-orange-600 text-white' : 'bg-blue-600 text-white'
                : 'bg-[#1e2d42] text-gray-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <p className="text-gray-400">Cargando...</p> : (
        <Card>
          {activeTab === 'ingresos' && (
            <div className="space-y-2">
              {data.ingresos.length === 0 && <p className="text-gray-500 text-sm text-center py-4">Sin ingresos en este período</p>}
              {data.ingresos.map((w: any) => {
                const monto = w.paymentStatus === 'PAGADO' ? (w.budget ?? 0) : (w.amountPaid ?? 0)
                const isModulo = w.source === 'modulo'
                const isRapido = w.source === 'rapido'
                const titulo = isRapido
                  ? w.service
                  : isModulo
                    ? (w.modules?.map((m: any) => m.moduleType.name).join(' · ') || 'Módulos')
                    : `${w.vehicle?.plate} — ${w.vehicle?.brand} ${w.vehicle?.model}`
                const subtitulo = isRapido
                  ? (w.clientName ?? 'Cliente esporádico')
                  : isModulo
                    ? (w.client?.name ?? w.techName ?? 'Sin nombre')
                    : (w.vehicle?.client?.name ?? '')
                return (
                  <div key={`${w.source}-${w.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-[#253652] transition gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      {isRapido
                        ? <Zap size={15} className="text-[#f59e0b] flex-shrink-0" />
                        : isModulo
                          ? <Cpu size={15} className="text-[#00e5ff] flex-shrink-0" />
                          : <Car size={15} className="text-gray-400 flex-shrink-0" />}
                      <div>
                        <p className="text-white text-sm font-medium">{titulo}</p>
                        <p className="text-gray-400 text-xs">{subtitulo} · {formatDate(w.updatedAt ?? w.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <PaymentBadge status={w.paymentStatus} />
                      <p className="text-emerald-400 font-semibold">{formatCurrency(monto)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {activeTab === 'gastos' && (
            <div className="space-y-2">
              {data.gastos.length === 0 && <p className="text-gray-500 text-sm text-center py-4">Sin gastos registrados</p>}
              {data.gastos.map((g: any) => (
                <div key={g.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-[#253652] transition">
                  <div>
                    <p className="text-white text-sm font-medium">{g.description || EXPENSE_CATEGORIES[g.category]}</p>
                    <p className="text-gray-400 text-xs">{EXPENSE_CATEGORIES[g.category]} · {formatDate(g.date)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-red-400 font-semibold">{formatCurrency(g.amount)}</p>
                    <button onClick={() => deleteExpense(g.id)} className="text-gray-500 hover:text-red-400 transition"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'pendientes' && (
            <div className="space-y-2">
              {data.pendientes?.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">No hay trabajos pendientes de cobro</p>
              )}
              {data.pendientes?.map((w: any) => {
                const saldo = (w.budget ?? 0) - (w.amountPaid ?? 0)
                const isModulo = w.source === 'modulo'
                const isRapido = w.source === 'rapido'
                const titulo = isRapido
                  ? w.service
                  : isModulo
                    ? (w.modules?.map((m: any) => m.moduleType.name).join(' · ') || 'Módulos')
                    : `${w.vehicle?.plate} — ${w.vehicle?.brand} ${w.vehicle?.model}`
                const subtitulo = isRapido
                  ? (w.clientName ?? 'Cliente esporádico')
                  : isModulo
                    ? (w.client?.name ?? w.techName ?? 'Sin nombre')
                    : (w.vehicle?.client?.name ?? '')
                return (
                  <div key={`${w.source}-${w.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-[#253652] transition gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      {isRapido
                        ? <Zap size={15} className="text-[#f59e0b] flex-shrink-0" />
                        : isModulo
                          ? <Cpu size={15} className="text-[#00e5ff] flex-shrink-0" />
                          : <Car size={15} className="text-gray-400 flex-shrink-0" />}
                      <div>
                        <p className="text-white text-sm font-medium">{titulo}</p>
                        <p className="text-gray-400 text-xs">{subtitulo} · {formatDate(w.updatedAt ?? w.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <PaymentBadge status={w.paymentStatus} />
                      <div className="text-right">
                        {w.amountPaid > 0 && (
                          <p className="text-xs" style={{ color: '#7a9aaa' }}>Pagado: {formatCurrency(w.amountPaid)}</p>
                        )}
                        <p className="text-orange-400 font-semibold">{formatCurrency(Math.max(0, saldo))}</p>
                      </div>
                      <button
                        onClick={() => markAsPaid(w.id, w.budget ?? 0, w.source)}
                        title="Marcar como pagado"
                        className="flex items-center gap-1 px-2 py-1 rounded-[2px] text-xs font-semibold transition-all"
                        style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(16,185,129,0.2)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(16,185,129,0.1)')}
                      >
                        <CheckCircle size={13} />
                        Pagado
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      )}

      <Modal open={showExpenseModal} onClose={() => setShowExpenseModal(false)} title="Registrar gasto">
        <div className="space-y-4">
          <Select label="Categoría" value={expenseForm.category} onChange={e => setExpenseForm(f => ({ ...f, category: e.target.value }))}>
            {Object.entries(EXPENSE_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Input label="Monto ($) *" type="number" step="0.01" required value={expenseForm.amount} onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))} />
          <Input label="Fecha *" type="date" required value={expenseForm.date} onChange={e => setExpenseForm(f => ({ ...f, date: e.target.value }))} />
          <Textarea label="Descripción" rows={2} value={expenseForm.description} onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowExpenseModal(false)}>Cancelar</Button>
            <Button onClick={addExpense} disabled={saving || !expenseForm.amount}>{saving ? 'Guardando...' : 'Guardar gasto'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
