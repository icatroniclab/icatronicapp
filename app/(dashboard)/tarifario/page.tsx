'use client'
import { useState, useEffect, useCallback } from 'react'
import { DollarSign, Edit2, Plus, Save, X, Trash2, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'

function fmt(v: number | null | undefined) {
  if (v == null) return '—'
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(v)
}

function fmtUsd(v: number | null | undefined) {
  if (v == null) return '—'
  return `U$D ${v.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`
}

const emptyForm = {
  name: '',
  priceNaftaTaller: '',
  priceDieselTaller: '',
  priceNaftaParticular: '',
  priceDieselParticular: '',
  usdTaller: '',
  usdParticular: '',
}

export default function TarifarioPage() {
  const [services, setServices] = useState<any[]>([])
  const [exchangeRate, setExchangeRate] = useState('1405')
  const [dolarCompra, setDolarCompra] = useState<string | null>(null)
  const [dolarVenta, setDolarVenta] = useState<string | null>(null)
  const [editingRate, setEditingRate] = useState(false)
  const [rateInput, setRateInput] = useState('1405')
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editService, setEditService] = useState<any>(null)
  const [form, setForm] = useState(emptyForm)
  const [savingService, setSavingService] = useState(false)
  const [fetchingRate, setFetchingRate] = useState(false)
  const [rateError, setRateError] = useState('')
  const [recalculating, setRecalculating] = useState(false)
  const [showRecalcBanner, setShowRecalcBanner] = useState(false)

  const load = useCallback(async () => {
    const [srv, cfg] = await Promise.all([
      fetch('/api/tarifario').then(r => r.json()),
      fetch('/api/config').then(r => r.json()),
    ])
    setServices(Array.isArray(srv) ? srv : [])
    const rate = cfg.exchangeRate ?? '1405'
    setExchangeRate(rate)
    setRateInput(rate)
    setDolarCompra(cfg.dolarCompra ?? null)
    setDolarVenta(cfg.dolarVenta ?? null)
  }, [])

  useEffect(() => { load() }, [load])

  async function fetchLiveRate() {
    setFetchingRate(true)
    setRateError('')
    const res = await fetch('/api/config/dolar')
    const data = await res.json()
    if (data.promedio) {
      setExchangeRate(String(data.promedio))
      setRateInput(String(data.promedio))
      setDolarCompra(String(data.compra))
      setDolarVenta(String(data.venta))
    } else {
      setRateError(data.error ?? 'Error al obtener cotización')
    }
    setFetchingRate(false)
  }

  async function saveRate() {
    setSaving(true)
    await fetch('/api/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exchangeRate: rateInput }),
    })
    setExchangeRate(rateInput)
    setEditingRate(false)
    setSaving(false)
    setShowRecalcBanner(true)
  }

  async function recalcAllPrices() {
    setRecalculating(true)
    const newRate = parseFloat(rateInput || exchangeRate)
    if (isNaN(newRate) || newRate <= 0) { setRecalculating(false); return }
    for (const s of services) {
      const body: Record<string, number> = {}
      if (s.usdTaller) {
        const usd = parseFloat(s.usdTaller)
        if (!isNaN(usd) && usd > 0) {
          body.priceNaftaTaller = Math.round(usd * newRate)
          if (s.priceDieselTaller && s.priceNaftaTaller) {
            const ratio = s.priceDieselTaller / s.priceNaftaTaller
            body.priceDieselTaller = Math.round(usd * newRate * ratio)
          }
        }
      }
      if (s.usdParticular) {
        const usd = parseFloat(s.usdParticular)
        if (!isNaN(usd) && usd > 0) {
          body.priceNaftaParticular = Math.round(usd * newRate)
          if (s.priceDieselParticular && s.priceNaftaParticular) {
            const ratio = s.priceDieselParticular / s.priceNaftaParticular
            body.priceDieselParticular = Math.round(usd * newRate * ratio)
          }
        }
      }
      if (Object.keys(body).length > 0) {
        await fetch(`/api/tarifario/${s.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }
    }
    setShowRecalcBanner(false)
    setRecalculating(false)
    load()
  }

  function openCreate() {
    setEditService(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  function openEdit(s: any) {
    setEditService(s)
    setForm({
      name: s.name,
      priceNaftaTaller: s.priceNaftaTaller ?? '',
      priceDieselTaller: s.priceDieselTaller ?? '',
      priceNaftaParticular: s.priceNaftaParticular ?? '',
      priceDieselParticular: s.priceDieselParticular ?? '',
      usdTaller: s.usdTaller ?? '',
      usdParticular: s.usdParticular ?? '',
    })
    setShowModal(true)
  }

  async function saveService() {
    setSavingService(true)
    const body = {
      name: form.name,
      priceNaftaTaller: form.priceNaftaTaller !== '' ? form.priceNaftaTaller : null,
      priceDieselTaller: form.priceDieselTaller !== '' ? form.priceDieselTaller : null,
      priceNaftaParticular: form.priceNaftaParticular !== '' ? form.priceNaftaParticular : null,
      priceDieselParticular: form.priceDieselParticular !== '' ? form.priceDieselParticular : null,
      usdTaller: form.usdTaller !== '' ? form.usdTaller : null,
      usdParticular: form.usdParticular !== '' ? form.usdParticular : null,
    }
    if (editService) {
      await fetch(`/api/tarifario/${editService.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    } else {
      await fetch('/api/tarifario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    }
    setSavingService(false)
    setShowModal(false)
    load()
  }

  async function deleteService(id: string) {
    if (!confirm('¿Eliminar este servicio?')) return
    await fetch(`/api/tarifario/${id}`, { method: 'DELETE' })
    load()
  }

  const rate = parseFloat(exchangeRate) || 1405

  // USD → ARS (ambas columnas nafta y diesel mantienen ratio)
  function handleUsdTaller(val: string) {
    const usd = parseFloat(val)
    const updates: Partial<typeof form> = { usdTaller: val }
    if (!isNaN(usd) && usd > 0) {
      const nafta = Math.round(usd * rate)
      updates.priceNaftaTaller = String(nafta)
      if (form.priceDieselTaller !== '' && form.priceNaftaTaller !== '') {
        const prevNafta = parseFloat(form.priceNaftaTaller)
        const prevDiesel = parseFloat(form.priceDieselTaller)
        if (prevNafta > 0) {
          updates.priceDieselTaller = String(Math.round(nafta * (prevDiesel / prevNafta)))
        }
      }
    }
    setForm(f => ({ ...f, ...updates }))
  }

  function handleUsdParticular(val: string) {
    const usd = parseFloat(val)
    const updates: Partial<typeof form> = { usdParticular: val }
    if (!isNaN(usd) && usd > 0) {
      const nafta = Math.round(usd * rate)
      updates.priceNaftaParticular = String(nafta)
      if (form.priceDieselParticular !== '' && form.priceNaftaParticular !== '') {
        const prevNafta = parseFloat(form.priceNaftaParticular)
        const prevDiesel = parseFloat(form.priceDieselParticular)
        if (prevNafta > 0) {
          updates.priceDieselParticular = String(Math.round(nafta * (prevDiesel / prevNafta)))
        }
      }
    }
    setForm(f => ({ ...f, ...updates }))
  }

  // ARS nafta → USD (back-calc)
  function handleNaftaTaller(val: string) {
    const ars = parseFloat(val)
    const updates: Partial<typeof form> = { priceNaftaTaller: val }
    if (!isNaN(ars) && ars > 0 && rate > 0) {
      updates.usdTaller = (ars / rate).toFixed(2)
    }
    setForm(f => ({ ...f, ...updates }))
  }

  function handleNaftaParticular(val: string) {
    const ars = parseFloat(val)
    const updates: Partial<typeof form> = { priceNaftaParticular: val }
    if (!isNaN(ars) && ars > 0 && rate > 0) {
      updates.usdParticular = (ars / rate).toFixed(2)
    }
    setForm(f => ({ ...f, ...updates }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white">Tarifario</h1>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Exchange rate widget */}
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 bg-[#192638] border border-[rgba(0,229,255,0.15)] rounded-[2px] px-3 py-2 flex-wrap">
              <DollarSign size={14} className="text-[#00e5ff]" />
              {dolarCompra && dolarVenta && (
                <span className="text-[#7a9aaa] text-xs">
                  C: <span className="text-emerald-400">${Number(dolarCompra).toLocaleString('es-AR')}</span>
                  <span className="mx-1.5 text-[#253652]">|</span>
                  V: <span className="text-red-400">${Number(dolarVenta).toLocaleString('es-AR')}</span>
                  <span className="mx-1.5 text-[#253652]">|</span>
                </span>
              )}
              {editingRate ? (
                <>
                  <input
                    type="number"
                    value={rateInput}
                    onChange={e => setRateInput(e.target.value)}
                    className="w-24 bg-transparent text-white text-sm focus:outline-none"
                    autoFocus
                  />
                  <button onClick={saveRate} disabled={saving} className="text-[#00e5ff] hover:text-white transition">
                    <Save size={14} />
                  </button>
                  <button onClick={() => { setEditingRate(false); setRateInput(exchangeRate) }} className="text-gray-500 hover:text-white transition">
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <span className="text-white text-sm">Prom: <span className="text-[#00e5ff] font-bold">${Number(exchangeRate).toLocaleString('es-AR')}</span></span>
                  <button onClick={() => setEditingRate(true)} className="text-gray-500 hover:text-[#00e5ff] transition" title="Editar manual">
                    <Edit2 size={12} />
                  </button>
                  <button
                    onClick={fetchLiveRate}
                    disabled={fetchingRate}
                    className="text-gray-500 hover:text-[#00e5ff] transition"
                    title="Actualizar desde dolarhoy.com (dólar blue)"
                  >
                    <RefreshCw size={12} className={fetchingRate ? 'animate-spin' : ''} />
                  </button>
                </>
              )}
            </div>
            {rateError && <p className="text-red-400 text-xs">{rateError}</p>}
          </div>
          <Button onClick={openCreate}><Plus size={16} /> Servicio</Button>
        </div>
      </div>

      {/* Banner recalcular */}
      {showRecalcBanner && services.some(s => s.usdTaller || s.usdParticular) && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-[2px] border border-[rgba(0,229,255,0.25)] bg-[rgba(0,229,255,0.05)]">
          <p className="text-sm text-[#e8f0f4]">
            El tipo de cambio cambió a <span className="text-[#00e5ff] font-bold">${Number(exchangeRate).toLocaleString('es-AR')}</span>.
            ¿Querés actualizar todos los precios en ARS de los servicios con valor en USD?
          </p>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button size="sm" onClick={recalcAllPrices} disabled={recalculating}>
              <RefreshCw size={13} className={recalculating ? 'animate-spin' : ''} />
              {recalculating ? 'Actualizando...' : 'Actualizar todos'}
            </Button>
            <button onClick={() => setShowRecalcBanner(false)} className="text-gray-500 hover:text-white transition">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Desktop table */}
      <Card className="overflow-x-auto hidden md:block">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="text-[#7a9aaa] text-xs uppercase tracking-wider border-b border-[rgba(0,229,255,0.08)]">
              <th className="text-left pb-3 pr-4 font-medium">Servicio</th>
              <th className="text-right pb-3 pr-3 font-medium">Taller nafta</th>
              <th className="text-right pb-3 pr-3 font-medium">Taller diesel</th>
              <th className="text-right pb-3 pr-3 font-medium">Particular nafta</th>
              <th className="text-right pb-3 pr-3 font-medium">Particular diesel</th>
              <th className="text-right pb-3 pr-3 font-medium" style={{ color: '#00e5ff' }}>USD taller</th>
              <th className="text-right pb-3 pr-3 font-medium" style={{ color: '#00e5ff' }}>USD particular</th>
              <th className="pb-3 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {services.map((s, i) => (
              <tr key={s.id} className={`border-b border-[rgba(0,229,255,0.04)] hover:bg-[rgba(0,229,255,0.02)] transition ${i % 2 === 0 ? '' : 'bg-[rgba(255,255,255,0.01)]'}`}>
                <td className="py-3 pr-4 text-white font-medium">{s.name}</td>
                <td className="py-3 pr-3 text-right text-emerald-400">{fmt(s.priceNaftaTaller)}</td>
                <td className="py-3 pr-3 text-right text-emerald-300">{fmt(s.priceDieselTaller)}</td>
                <td className="py-3 pr-3 text-right text-blue-400">{fmt(s.priceNaftaParticular)}</td>
                <td className="py-3 pr-3 text-right text-blue-300">{fmt(s.priceDieselParticular)}</td>
                <td className="py-3 pr-3 text-right" style={{ color: 'rgba(0,229,255,0.7)' }}>{fmtUsd(s.usdTaller)}</td>
                <td className="py-3 pr-3 text-right" style={{ color: '#00e5ff' }}>{fmtUsd(s.usdParticular)}</td>
                <td className="py-3">
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => openEdit(s)} className="p-1 text-gray-500 hover:text-white transition"><Edit2 size={13} /></button>
                    <button onClick={() => deleteService(s.id)} className="p-1 text-gray-500 hover:text-red-400 transition"><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {services.map(s => (
          <Card key={s.id}>
            <div className="flex items-start justify-between mb-3">
              <p className="text-white font-medium text-sm">{s.name}</p>
              <div className="flex gap-1">
                <button onClick={() => openEdit(s)} className="p-1 text-gray-500 hover:text-white transition"><Edit2 size={13} /></button>
                <button onClick={() => deleteService(s.id)} className="p-1 text-gray-500 hover:text-red-400 transition"><Trash2 size={13} /></button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-[#7a9aaa] mb-1">Taller nafta</p>
                <p className="text-emerald-400 font-semibold">{fmt(s.priceNaftaTaller)}</p>
              </div>
              {s.priceDieselTaller && (
                <div>
                  <p className="text-[#7a9aaa] mb-1">Taller diesel</p>
                  <p className="text-emerald-300 font-semibold">{fmt(s.priceDieselTaller)}</p>
                </div>
              )}
              <div>
                <p className="text-[#7a9aaa] mb-1">Particular nafta</p>
                <p className="text-blue-400 font-semibold">{fmt(s.priceNaftaParticular)}</p>
              </div>
              {s.priceDieselParticular && (
                <div>
                  <p className="text-[#7a9aaa] mb-1">Particular diesel</p>
                  <p className="text-blue-300 font-semibold">{fmt(s.priceDieselParticular)}</p>
                </div>
              )}
              <div>
                <p className="text-[#7a9aaa] mb-1">USD taller</p>
                <p style={{ color: 'rgba(0,229,255,0.7)' }} className="font-semibold">{fmtUsd(s.usdTaller)}</p>
              </div>
              <div>
                <p className="text-[#7a9aaa] mb-1">USD particular</p>
                <p style={{ color: '#00e5ff' }} className="font-semibold">{fmtUsd(s.usdParticular)}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Note about ARS calc */}
      {services.length > 0 && (
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-[#7a9aaa] text-xs">
            Cotización actual: <span className="text-[#00e5ff]">U$D 1 = ${Number(exchangeRate).toLocaleString('es-AR')}</span>
            {' '}· Cambiá la cotización y usá "Actualizar todos" para recalcular todos los ARS automáticamente.
          </p>
          {services.some(s => s.usdTaller || s.usdParticular) && (
            <button
              onClick={() => { setShowRecalcBanner(true); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              className="text-[11px] text-[#00e5ff] hover:underline flex items-center gap-1"
            >
              <RefreshCw size={11} /> Recalcular todos los precios ARS
            </button>
          )}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editService ? 'Editar servicio' : 'Nuevo servicio'}>
        <div className="space-y-4">
          <Input label="Nombre del servicio *" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />

          <p className="text-[11px] text-gray-500 -mb-1 flex items-center gap-1">
            <DollarSign size={10} />
            Cotización actual: <span className="text-[#00e5ff] font-medium ml-0.5">U$D 1 = ${rate.toLocaleString('es-AR')}</span>
            <span className="text-gray-600 ml-1">· Cambiá USD para calcular ARS automáticamente, o ARS para calcular USD</span>
          </p>

          {/* Taller */}
          <div className="rounded-lg border border-[#253652] p-3 space-y-2">
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Taller</p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] text-gray-400 mb-1 block">USD</label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-[10px] font-medium">U$D</span>
                  <input
                    type="number" step="0.5" min="0" value={form.usdTaller}
                    onChange={e => handleUsdTaller(e.target.value)}
                    placeholder="0"
                    className="w-full bg-[#111c2e] border border-[#253652] rounded-lg pl-8 pr-2 py-1.5 text-white text-sm focus:outline-none focus:border-[#00e5ff]"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-gray-400 mb-1 block">Nafta ($)</label>
                <input
                  type="number" step="1" min="0" value={form.priceNaftaTaller}
                  onChange={e => handleNaftaTaller(e.target.value)}
                  placeholder="0"
                  className="w-full bg-[#111c2e] border border-[#253652] rounded-lg px-2 py-1.5 text-emerald-400 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-400 mb-1 block">Diesel ($) <span className="text-gray-600">opcional</span></label>
                <input
                  type="number" step="1" min="0" value={form.priceDieselTaller}
                  onChange={e => setForm(f => ({ ...f, priceDieselTaller: e.target.value }))}
                  placeholder="—"
                  className="w-full bg-[#111c2e] border border-[#253652] rounded-lg px-2 py-1.5 text-emerald-300 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Particular */}
          <div className="rounded-lg border border-[#253652] p-3 space-y-2">
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">Particular</p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] text-gray-400 mb-1 block">USD</label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-[10px] font-medium">U$D</span>
                  <input
                    type="number" step="0.5" min="0" value={form.usdParticular}
                    onChange={e => handleUsdParticular(e.target.value)}
                    placeholder="0"
                    className="w-full bg-[#111c2e] border border-[#253652] rounded-lg pl-8 pr-2 py-1.5 text-white text-sm focus:outline-none focus:border-[#00e5ff]"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-gray-400 mb-1 block">Nafta ($)</label>
                <input
                  type="number" step="1" min="0" value={form.priceNaftaParticular}
                  onChange={e => handleNaftaParticular(e.target.value)}
                  placeholder="0"
                  className="w-full bg-[#111c2e] border border-[#253652] rounded-lg px-2 py-1.5 text-blue-400 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-400 mb-1 block">Diesel ($) <span className="text-gray-600">opcional</span></label>
                <input
                  type="number" step="1" min="0" value={form.priceDieselParticular}
                  onChange={e => setForm(f => ({ ...f, priceDieselParticular: e.target.value }))}
                  placeholder="—"
                  className="w-full bg-[#111c2e] border border-[#253652] rounded-lg px-2 py-1.5 text-blue-300 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={saveService} disabled={savingService || !form.name}>
              {savingService ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
