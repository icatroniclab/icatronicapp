'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, FileDown, Save, ExternalLink, RotateCcw } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { BrandModelSelect } from '@/components/BrandModelSelect'

type Item = { desc: string; amount: string }
type FormState = {
  brand: string; model: string; year: string; plate: string
  clientName: string; items: Item[]; notes: string
  validHours: string; date: string
}
type Presupuesto = {
  id: string; number: number | null; brand: string; model: string; year: string | null
  plate: string | null; clientName: string | null; items: string; notes: string | null
  validHours: number; date: string; total: number; createdAt: string
}

const emptyForm = (): FormState => {
  const now = new Date()
  now.setSeconds(0, 0)
  return {
    brand: '', model: '', year: '', plate: '', clientName: '',
    items: [{ desc: '', amount: '' }],
    notes: '', validHours: '48',
    date: now.toISOString().slice(0, 16),
  }
}

function ars(n: number) {
  return '$ ' + n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function PresupuestosPage() {
  const [form, setForm] = useState<FormState>(emptyForm)
  const [list, setList] = useState<Presupuesto[]>([])
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  const total = form.items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)

  const loadList = useCallback(async () => {
    const res = await fetch('/api/presupuestos')
    if (res.ok) setList(await res.json())
  }, [])

  useEffect(() => { loadList() }, [loadList])

  function setField<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  function setItem(i: number, field: keyof Item, v: string) {
    setForm(f => {
      const items = [...f.items]
      items[i] = { ...items[i], [field]: v }
      return { ...f, items }
    })
  }

  function addItem() {
    setForm(f => ({ ...f, items: [...f.items, { desc: '', amount: '' }] }))
  }

  function removeItem(i: number) {
    setForm(f => ({ ...f, items: f.items.filter((_, j) => j !== i) }))
  }

  async function saveForm(): Promise<string | null> {
    setErrorMsg('')
    if (!form.brand.trim() || !form.model.trim()) {
      setErrorMsg('Marca y Modelo son obligatorios')
      return null
    }
    setSaving(true)
    try {
      const res = await fetch('/api/presupuestos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: form.brand, model: form.model, year: form.year || null,
          plate: form.plate || null, clientName: form.clientName || null,
          items: JSON.stringify(form.items.map(i => ({ desc: i.desc, amount: parseFloat(i.amount) || 0 }))),
          notes: form.notes || null, validHours: parseInt(form.validHours) || 48,
          date: form.date ? new Date(form.date).toISOString() : new Date().toISOString(),
          total,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setErrorMsg(err.error || `Error ${res.status}`)
        return null
      }
      const data = await res.json()
      await loadList()
      setSavedMsg('Guardado ✓')
      setTimeout(() => setSavedMsg(''), 2500)
      return data.id
    } catch (e) {
      setErrorMsg('Error de red al guardar')
      return null
    } finally {
      setSaving(false)
    }
  }

  async function handleSave() {
    await saveForm()
  }

  async function handleDownload() {
    // Abrir ventana en el gesto del usuario antes del await para evitar el popup blocker
    const win = window.open('', '_blank')
    const id = await saveForm()
    if (id && win) {
      win.location.href = `/api/pdf/presupuesto/${id}`
    } else if (win) {
      win.close()
    }
  }

  function loadPresupuesto(p: Presupuesto) {
    const items: { desc: string; amount: number }[] = JSON.parse(p.items || '[]')
    setForm({
      brand: p.brand, model: p.model, year: p.year || '', plate: p.plate || '',
      clientName: p.clientName || '',
      items: items.length ? items.map(i => ({ desc: i.desc, amount: String(i.amount) })) : [{ desc: '', amount: '' }],
      notes: p.notes || '', validHours: String(p.validHours),
      date: new Date(p.date).toISOString().slice(0, 16),
    })
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este presupuesto?')) return
    setDeleting(id)
    await fetch(`/api/presupuestos/${id}`, { method: 'DELETE' })
    setDeleting(null)
    loadList()
  }

  const vehiculo = [form.brand, form.model, form.year].filter(Boolean).join(' ')
  const fecha = fmtDate(form.date || new Date().toISOString())

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Presupuestos</h1>
          <p className="text-[#7a9aaa] text-sm">Generá presupuestos y exportalos como PDF</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {savedMsg && <span className="text-emerald-400 text-sm font-medium">{savedMsg}</span>}
          {errorMsg && <span className="text-red-400 text-sm font-medium">{errorMsg}</span>}
          <button
            onClick={() => setForm(emptyForm())}
            className="flex items-center gap-1.5 text-[#7a9aaa] hover:text-white text-sm transition px-3 py-2"
          >
            <RotateCcw size={14} /> Nuevo
          </button>
          <Button variant="secondary" onClick={handleSave} disabled={saving}>
            <Save size={14} /> {saving ? 'Guardando…' : 'Guardar'}
          </Button>
          <Button onClick={handleDownload} disabled={saving}>
            <FileDown size={14} /> {saving ? 'Guardando…' : 'Guardar y descargar PDF'}
          </Button>
        </div>
      </div>

      {/* Main: form + preview */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Form */}
        <Card className="space-y-5">
          <h2 className="font-semibold text-white text-sm uppercase tracking-widest text-[#7a9aaa]">Datos</h2>

          {/* Vehículo */}
          <div>
            <p className="text-[0.65rem] font-semibold text-[#7a9aaa] uppercase tracking-[0.2em] mb-2">Vehículo</p>
            <div className="grid grid-cols-2 gap-3">
              <BrandModelSelect
                brand={form.brand}
                model={form.model}
                onBrandChange={v => setField('brand', v)}
                onModelChange={v => setField('model', v)}
              />
              <Input label="Año" value={form.year} onChange={e => setField('year', e.target.value)} placeholder="ej: 2019" />
              <Input label="Patente" value={form.plate} onChange={e => setField('plate', e.target.value)} placeholder="ej: AA123BB" />
            </div>
          </div>

          {/* Cliente */}
          <div>
            <p className="text-[0.65rem] font-semibold text-[#7a9aaa] uppercase tracking-[0.2em] mb-2">Cliente</p>
            <Input label="Nombre (opcional)" value={form.clientName} onChange={e => setField('clientName', e.target.value)} placeholder="ej: Juan García" />
          </div>

          {/* Ítems */}
          <div>
            <p className="text-[0.65rem] font-semibold text-[#7a9aaa] uppercase tracking-[0.2em] mb-2">Ítems del presupuesto</p>
            <div className="space-y-2">
              {form.items.map((item, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={item.desc}
                      onChange={e => setItem(i, 'desc', e.target.value)}
                      placeholder="Descripción del ítem o trabajo"
                      className="w-full bg-[#111c2e] border border-[rgba(0,229,255,0.18)] rounded-[2px] px-3 py-2.5 text-[#e8f0f4] placeholder-[#4a6a80] focus:outline-none focus:border-[#00b8cc] text-sm font-light"
                    />
                  </div>
                  <div className="w-36 flex-shrink-0">
                    <input
                      type="number"
                      value={item.amount}
                      onChange={e => setItem(i, 'amount', e.target.value)}
                      placeholder="Importe"
                      className="w-full bg-[#111c2e] border border-[rgba(0,229,255,0.18)] rounded-[2px] px-3 py-2.5 text-[#e8f0f4] placeholder-[#4a6a80] focus:outline-none focus:border-[#00b8cc] text-sm font-light text-right"
                    />
                  </div>
                  {form.items.length > 1 && (
                    <button
                      onClick={() => removeItem(i)}
                      className="mt-0.5 p-2.5 text-[#4a6a80] hover:text-red-400 transition rounded-[2px]"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={addItem}
              className="mt-2 flex items-center gap-1.5 text-[#00e5ff] text-sm hover:text-[#00b8cc] transition"
            >
              <Plus size={15} /> Agregar ítem
            </button>
          </div>

          {/* Fecha + Validez */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Fecha"
              type="datetime-local"
              value={form.date}
              onChange={e => setField('date', e.target.value)}
            />
            <Input
              label="Válido (horas)"
              type="number"
              value={form.validHours}
              onChange={e => setField('validHours', e.target.value)}
              placeholder="48"
            />
          </div>

          {/* Notas */}
          <Textarea
            label="Notas al pie (opcional)"
            value={form.notes}
            onChange={e => setField('notes', e.target.value)}
            rows={3}
            placeholder="Incluye vaciado, carga y purga del circuito…"
          />
        </Card>

        {/* Live Preview */}
        <div className="xl:sticky xl:top-6 xl:self-start">
          <div
            className="rounded-[2px] overflow-hidden shadow-2xl"
            style={{ background: '#fff', fontFamily: 'Arial, Helvetica, sans-serif', color: '#111', fontSize: 13 }}
          >
            {/* Header */}
            <div style={{ background: '#1d4ed8', padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '0.04em' }}>ICATRONIC</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Laboratorio de Electrónica Automotriz</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '0.08em' }}>PRESUPUESTO</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 4, lineHeight: 1.6 }}>
                  Fecha: {fecha}
                </div>
              </div>
            </div>

            <div style={{ padding: '20px 28px' }}>
              {/* Info grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div style={{ background: '#f8fafc', borderRadius: 6, padding: '12px 14px' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>Vehículo</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{vehiculo || <span style={{ color: '#94a3b8' }}>Sin completar</span>}</div>
                  {form.plate && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Patente: {form.plate}</div>}
                </div>
                <div style={{ background: '#f8fafc', borderRadius: 6, padding: '12px 14px' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>Cliente</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{form.clientName || <span style={{ color: '#94a3b8' }}>—</span>}</div>
                </div>
              </div>

              {/* Items table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 4 }}>
                <thead>
                  <tr style={{ background: '#1d4ed8' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#fff' }}>Descripción</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#fff' }}>Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 1 ? '#f8fafc' : '#fff' }}>
                      <td style={{ padding: '9px 12px', fontSize: 12, color: '#1e293b', lineHeight: 1.5 }}>
                        {item.desc || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Descripción…</span>}
                      </td>
                      <td style={{ padding: '9px 12px', fontSize: 12, color: '#1e293b', textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {item.amount ? ars(parseFloat(item.amount) || 0) : <span style={{ color: '#94a3b8' }}>$ 0</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Total */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <div style={{ background: '#1d4ed8', color: '#fff', borderRadius: 6, padding: '10px 18px', minWidth: 200, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Total</span>
                  <span style={{ fontSize: 18, fontWeight: 800 }}>{ars(total)}</span>
                </div>
              </div>

              {/* Notes */}
              {form.notes && (
                <div style={{ padding: '12px 14px', background: '#f8fafc', borderLeft: '3px solid #1d4ed8', borderRadius: '0 6px 6px 0', marginBottom: 10 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 5 }}>Notas</div>
                  <div style={{ fontSize: 11, color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{form.notes}</div>
                </div>
              )}

              <div style={{ fontSize: 10, color: '#94a3b8', textAlign: 'right', fontStyle: 'italic' }}>
                Válido por {form.validHours || 48} horas desde la fecha de emisión.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* History */}
      {list.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Historial</h2>
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(0,229,255,0.1)]">
                  <th className="text-left px-4 py-3 text-[#7a9aaa] font-medium text-xs uppercase tracking-widest">N°</th>
                  <th className="text-left px-4 py-3 text-[#7a9aaa] font-medium text-xs uppercase tracking-widest">Fecha</th>
                  <th className="text-left px-4 py-3 text-[#7a9aaa] font-medium text-xs uppercase tracking-widest">Vehículo</th>
                  <th className="text-left px-4 py-3 text-[#7a9aaa] font-medium text-xs uppercase tracking-widest">Cliente</th>
                  <th className="text-right px-4 py-3 text-[#7a9aaa] font-medium text-xs uppercase tracking-widest">Total</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {list.map(p => (
                  <tr key={p.id} className="border-b border-[rgba(0,229,255,0.05)] hover:bg-[rgba(0,229,255,0.03)] transition">
                    <td className="px-4 py-3 text-[#7a9aaa] font-mono text-xs">
                      {p.number ? String(p.number).padStart(4, '0') : p.id.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 text-[#e8f0f4]">{fmtDate(p.date)}</td>
                    <td className="px-4 py-3 text-[#e8f0f4]">
                      {[p.brand, p.model, p.year].filter(Boolean).join(' ') || '—'}
                    </td>
                    <td className="px-4 py-3 text-[#7a9aaa]">{p.clientName || '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-[#e8f0f4]">{ars(p.total)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => loadPresupuesto(p)}
                          className="p-1.5 text-[#7a9aaa] hover:text-[#00e5ff] transition rounded"
                          title="Cargar en formulario"
                        >
                          <RotateCcw size={14} />
                        </button>
                        <button
                          onClick={() => window.open(`/api/pdf/presupuesto/${p.id}`, '_blank')}
                          className="p-1.5 text-[#7a9aaa] hover:text-[#00e5ff] transition rounded"
                          title="Ver / descargar PDF"
                        >
                          <ExternalLink size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          disabled={deleting === p.id}
                          className="p-1.5 text-[#7a9aaa] hover:text-red-400 transition rounded"
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </div>
  )
}
