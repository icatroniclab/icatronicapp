'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, TrendingUp, Package, Stethoscope, ListChecks, PenLine } from 'lucide-react'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { formatCurrency } from '@/lib/utils'

const TYPES: Record<string, { label: string; color: string }> = {
  REPUESTO:     { label: 'Repuesto',      color: 'bg-blue-900/40 text-blue-300 border-blue-800/50' },
  MANO_DE_OBRA: { label: 'Mano de obra',  color: 'bg-emerald-900/40 text-emerald-300 border-emerald-800/50' },
  SERVICIO:     { label: 'Servicio',      color: 'bg-purple-900/40 text-purple-300 border-purple-800/50' },
  DIAGNOSTICO:  { label: 'Diagnóstico',   color: 'bg-yellow-900/40 text-yellow-300 border-yellow-800/50' },
  OTRO:         { label: 'Otro',          color: 'bg-gray-800 text-gray-300 border-gray-700' },
}

const emptyForm = { type: 'REPUESTO', description: '', quantity: '1', cost: '', price: '', usdPrice: '', productId: '', applyDiscount: true, boughtAtStore: false }

const DIAG_PRESETS = [
  { label: 'Básico',   hs: 0.5,  desc: 'Diagnóstico básico (0.5 h)'  },
  { label: 'Medio',    hs: 1,    desc: 'Diagnóstico medio (1 h)'      },
  { label: 'Complejo', hs: 2.5,  desc: 'Diagnóstico complejo (2.5 h)' },
]

export function BudgetPanel({ workOrderId, products, client, vehicle }: {
  workOrderId: string
  products: any[]
  client?: any
  vehicle?: any
}) {
  const isTallerista = client?.type === 'TALLERISTA' && client?.discount > 0
  const discountPct = isTallerista ? client.discount : 0
  const isDiesel = (vehicle?.engineType ?? '').toLowerCase().includes('diesel')

  function applyDiscount(price: number) {
    if (!isTallerista) return price
    return +(price * (1 - discountPct / 100)).toFixed(2)
  }
  const router = useRouter()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [adding, setAdding] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showChoice, setShowChoice] = useState(false)
  const [showTarifario, setShowTarifario] = useState(false)
  const [tarifario, setTarifario] = useState<any[]>([])
  const [loadingTarifario, setLoadingTarifario] = useState(false)
  const [laborRate, setLaborRate] = useState<{ usd: number; cambio: number; ars: number } | null>(null)
  const [diagRate,  setDiagRate]  = useState<{ usd: number; cambio: number; ars: number } | null>(null)

  useEffect(() => {
    fetch('/api/config').then(r => r.json()).then(cfg => {
      const cambio  = parseFloat(cfg.tipoCambioUSD        || '0')
      const obraUsd = parseFloat(cfg.tarifaHoraUSD        || '40')
      const diagUsd = parseFloat(cfg.tarifaDiagnosticoUSD || '100')
      if (cambio > 0) {
        setLaborRate({ usd: obraUsd, cambio, ars: obraUsd * cambio })
        setDiagRate({ usd: diagUsd, cambio, ars: diagUsd * cambio })
      }
    })
  }, [])

  const fetchItems = useCallback(async () => {
    const res = await fetch(`/api/ordenes/${workOrderId}/presupuesto`)
    setItems(await res.json())
    setLoading(false)
  }, [workOrderId])

  useEffect(() => { fetchItems() }, [fetchItems])

  function getSuggestedPrice(svc: any): number | null {
    if (isTallerista) {
      return isDiesel ? svc.priceDieselTaller : svc.priceNaftaTaller
    }
    return isDiesel ? svc.priceDieselParticular : svc.priceNaftaParticular
  }

  function getRefUsd(svc: any): number | null {
    return isTallerista ? svc.usdTaller : svc.usdParticular
  }

  function selectFromTarifario(svc: any) {
    const price = getSuggestedPrice(svc)
    const usd = getRefUsd(svc)
    const nameLower = svc.name.toLowerCase()
    const isDiagnostico = nameLower.includes('diagnos')
    setForm({
      ...emptyForm,
      type: isDiagnostico ? 'DIAGNOSTICO' : 'MANO_DE_OBRA',
      description: svc.name,
      price: price != null ? price.toString() : '',
      usdPrice: usd != null ? usd.toString() : '',
      quantity: '1',
    })
    setShowTarifario(false)
    setShowForm(true)
  }

  async function openChoice() {
    setShowChoice(true)
    setShowTarifario(false)
    setShowForm(false)
  }

  async function openTarifario() {
    setShowChoice(false)
    setShowTarifario(true)
    if (tarifario.length === 0) {
      setLoadingTarifario(true)
      const res = await fetch('/api/tarifario')
      if (res.ok) setTarifario(await res.json())
      setLoadingTarifario(false)
    }
  }

  function openCustomForm() {
    setForm(emptyForm)
    setShowChoice(false)
    setShowTarifario(false)
    setShowForm(true)
  }

  function closeAll() {
    setShowChoice(false)
    setShowTarifario(false)
    setShowForm(false)
    setForm(emptyForm)
  }

  function selectProduct(productId: string) {
    if (!productId) {
      setForm(f => ({ ...f, productId: '', description: '', cost: '' }))
      return
    }
    const p = products.find(p => p.id === productId)
    if (p) {
      setForm(f => ({
        ...f,
        productId,
        description: p.name,
        cost: p.costPrice.toString(),
        price: applyDiscount(p.unitPrice).toString(),
      }))
    }
  }

  async function addItem() {
    if (!form.description.trim() || !form.price) return
    setAdding(true)
    const res = await fetch(`/api/ordenes/${workOrderId}/presupuesto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setAdding(false)
    if (!res.ok) {
      const e = await res.json()
      alert(e.error || 'Error')
      return
    }
    closeAll()
    await fetchItems()
    router.refresh()
  }

  async function deleteItem(itemId: string) {
    await fetch(`/api/ordenes/${workOrderId}/presupuesto`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId }),
    })
    await fetchItems()
    router.refresh()
  }

  const totalCosto = items.reduce((s, i) => s + i.cost * i.quantity, 0)
  const totalPrecio = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const margen = totalCosto > 0 ? ((totalPrecio - totalCosto) / totalCosto * 100).toFixed(1) : null

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-white">Presupuesto</h3>
          {isTallerista && (
            <span className="text-[11px] bg-purple-900/50 text-purple-300 border border-purple-800/50 rounded px-2 py-0.5">
              Tallerista {discountPct}% desc.
            </span>
          )}
        </div>
        <Button size="sm" onClick={() => (showForm || showChoice || showTarifario) ? closeAll() : openChoice()}>
          <Plus size={14} /> Agregar ítem
        </Button>
      </div>

      {/* Elección: tarifario vs manual */}
      {showChoice && (
        <div className="bg-[#111c2e] border border-[#253652] rounded-lg p-4 mb-4">
          <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">¿Cómo querés agregar el ítem?</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={openTarifario}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-[#253652] hover:border-[#00e5ff]/40 hover:bg-[rgba(0,229,255,0.04)] transition text-left"
            >
              <ListChecks size={22} className="text-[#00e5ff]" />
              <div>
                <p className="text-white text-sm font-semibold">Desde el tarifario</p>
                <p className="text-gray-500 text-xs">Servicios predefinidos con precios</p>
              </div>
            </button>
            <button
              onClick={openCustomForm}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-[#253652] hover:border-[#00e5ff]/40 hover:bg-[rgba(0,229,255,0.04)] transition text-left"
            >
              <PenLine size={22} className="text-[#7a9aaa]" />
              <div>
                <p className="text-white text-sm font-semibold">Ítem personalizado</p>
                <p className="text-gray-500 text-xs">Descripción y precio libres</p>
              </div>
            </button>
          </div>
          <div className="flex justify-end mt-3">
            <Button variant="ghost" size="sm" onClick={closeAll}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* Lista del tarifario */}
      {showTarifario && (
        <div className="bg-[#111c2e] border border-[#253652] rounded-lg mb-4 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#253652]">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">
              Tarifario
              {vehicle && (
                <span className="ml-2 text-[#00e5ff] normal-case">
                  · {isTallerista ? 'Tallerista' : 'Particular'} · {isDiesel ? 'Diesel' : 'Nafta'}
                </span>
              )}
            </p>
            <Button variant="ghost" size="sm" onClick={closeAll}>Cancelar</Button>
          </div>
          {loadingTarifario ? (
            <p className="text-gray-500 text-sm p-4">Cargando...</p>
          ) : tarifario.length === 0 ? (
            <p className="text-gray-500 text-sm p-4">Sin servicios en el tarifario.</p>
          ) : (
            <div className="divide-y divide-[#1e2d42] max-h-64 overflow-y-auto">
              {tarifario.map(svc => {
                const price = getSuggestedPrice(svc)
                const usd = getRefUsd(svc)
                return (
                  <button
                    key={svc.id}
                    onClick={() => selectFromTarifario(svc)}
                    className="w-full text-left px-3 py-2.5 hover:bg-[rgba(0,229,255,0.05)] transition flex items-center justify-between gap-4"
                  >
                    <span className="text-sm text-white">{svc.name}</span>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {usd != null && (
                        <span className="text-xs text-gray-500">USD {usd}</span>
                      )}
                      {price != null ? (
                        <span className="text-sm font-semibold text-emerald-400">
                          ${price.toLocaleString('es-AR')}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-600">Sin precio</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Formulario */}
      {showForm && (
        <div className="bg-[#111c2e] border border-[#253652] rounded-lg p-3 mb-4 space-y-3">
          {/* Tipo */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Tipo</label>
              <select
                value={form.type}
                onChange={e => {
                  const t = e.target.value
                  const rate = t === 'MANO_DE_OBRA' ? laborRate : t === 'DIAGNOSTICO' ? diagRate : null
                  setForm(f => ({
                    ...f,
                    type: t,
                    productId: '',
                    description: t === 'MANO_DE_OBRA' ? 'Mano de obra' : '',
                    cost: '',
                    quantity: '1',
                    price:    rate ? rate.ars.toString() : '',
                    usdPrice: rate ? rate.usd.toString() : '',
                  }))
                }}
                className="w-full bg-[#1e2d42] border border-[#253652] rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
              >
                {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">
                {form.type === 'MANO_DE_OBRA' ? 'Horas trabajadas' : form.type === 'DIAGNOSTICO' ? 'Horas' : 'Cantidad'}
              </label>
              <input
                type="number" min="0.1" step="0.25" value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                className="w-full bg-[#1e2d42] border border-[#253652] rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Presets de diagnóstico */}
          {form.type === 'DIAGNOSTICO' && (
            <div>
              <label className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                <Stethoscope size={11} /> Tipo de diagnóstico
              </label>
              <div className="grid grid-cols-3 gap-2">
                {DIAG_PRESETS.map(p => {
                  const arsTotal = diagRate ? Math.round(diagRate.ars * p.hs) : null
                  const active = form.description === p.desc
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setForm(f => ({
                        ...f,
                        description: p.desc,
                        quantity: p.hs.toString(),
                        price:    diagRate ? diagRate.ars.toString() : f.price,
                        usdPrice: diagRate ? diagRate.usd.toString() : f.usdPrice,
                      }))}
                      className={`flex flex-col items-center p-2.5 rounded-lg border text-center transition ${
                        active
                          ? 'border-yellow-500 bg-yellow-900/20 text-yellow-300'
                          : 'border-[#253652] hover:border-yellow-700 text-gray-400'
                      }`}
                    >
                      <span className="text-sm font-semibold">{p.label}</span>
                      <span className="text-[11px] text-gray-500">{p.hs} h</span>
                      {arsTotal && (
                        <span className={`text-[11px] mt-0.5 font-medium ${active ? 'text-yellow-400' : 'text-gray-600'}`}>
                          ${arsTotal.toLocaleString('es-AR')}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
              {diagRate && (
                <p className="text-[11px] text-yellow-700 mt-1.5">
                  USD {diagRate.usd} × ${diagRate.cambio.toLocaleString('es-AR')} = ${diagRate.ars.toLocaleString('es-AR')}/h · Podés modificar el precio
                </p>
              )}
              {!diagRate && (
                <p className="text-[11px] text-yellow-600 mt-1.5">
                  Configurá la tarifa de diagnóstico y el tipo de cambio en Configuración → Tarifas
                </p>
              )}
            </div>
          )}

          {/* Selector de stock (solo para REPUESTO) */}
          {form.type === 'REPUESTO' && (
            <div>
              <label className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                <Package size={11} /> Desde stock <span className="text-gray-600">(opcional)</span>
              </label>
              <select
                value={form.productId}
                onChange={e => selectProduct(e.target.value)}
                className="w-full bg-[#1e2d42] border border-[#253652] rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">— Ingreso manual —</option>
                {products.map(p => (
                  <option key={p.id} value={p.id} disabled={p.quantity === 0}>
                    {p.name} (Stock: {p.quantity}) — Costo: {formatCurrency(p.costPrice)} / Venta: {formatCurrency(p.unitPrice)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Descripción */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Descripción *</label>
            <input
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Ej: Sensor MAP, Diagnóstico ECU, Hora de trabajo..."
              className="w-full bg-[#1e2d42] border border-[#253652] rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Costo y Precio */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Costo ($) <span className="text-gray-600">— interno</span></label>
              <input
                type="number" min="0" step="0.01" value={form.cost}
                onChange={e => setForm(f => ({ ...f, cost: e.target.value }))}
                placeholder="0"
                className="w-full bg-[#1e2d42] border border-[#253652] rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">
                {form.type === 'MANO_DE_OBRA' || form.type === 'DIAGNOSTICO' ? 'Precio por hora' : 'Precio cliente ($)'} *
              </label>

              {/* Campos USD ↔ ARS enlazados para mano de obra y diagnóstico */}
              {(form.type === 'MANO_DE_OBRA' || form.type === 'DIAGNOSTICO') ? (() => {
                const cambio = (form.type === 'MANO_DE_OBRA' ? laborRate : diagRate)?.cambio ?? 0
                return (
                  <div className="flex items-center gap-1">
                    <div className="relative flex-1">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-[11px] font-medium">USD</span>
                      <input
                        type="number" min="0" step="0.5" value={form.usdPrice}
                        onChange={e => {
                          const usd = e.target.value
                          const ars = cambio > 0 && usd !== '' ? Math.round(Number(usd) * cambio).toString() : ''
                          setForm(f => ({ ...f, usdPrice: usd, price: ars }))
                        }}
                        placeholder="0"
                        className="w-full bg-[#1e2d42] border border-[#253652] rounded-lg pl-9 pr-2 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <span className="text-gray-600 text-xs flex-shrink-0">=</span>
                    <div className="relative flex-1">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-[11px] font-medium">$</span>
                      <input
                        type="number" min="0" step="1" value={form.price}
                        onChange={e => {
                          const ars = e.target.value
                          const usd = cambio > 0 && ars !== '' ? (Number(ars) / cambio).toFixed(2) : ''
                          setForm(f => ({ ...f, price: ars, usdPrice: usd }))
                        }}
                        placeholder="0"
                        className="w-full bg-[#1e2d42] border border-[#253652] rounded-lg pl-6 pr-2 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )
              })() : (
                <input
                  type="number" min="0" step="0.01" value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  placeholder="0"
                  className="w-full bg-[#1e2d42] border border-[#253652] rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              )}

              {(form.type === 'MANO_DE_OBRA' || form.type === 'DIAGNOSTICO') &&
               !(form.type === 'MANO_DE_OBRA' ? laborRate : diagRate) && (
                <p className="text-[11px] text-yellow-600 mt-1">
                  Configurá la tarifa y el tipo de cambio en Configuración → Tarifas
                </p>
              )}
            </div>
          </div>

          {form.type === 'REPUESTO' && (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.boughtAtStore}
                onChange={e => setForm(f => ({ ...f, boughtAtStore: e.target.checked }))}
                className="accent-orange-500"
              />
              <span className="text-orange-300">Comprado en repuestera — sumar costo a gastos del taller</span>
            </label>
          )}

          {isTallerista && !form.productId && (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.applyDiscount}
                onChange={e => {
                  const checked = e.target.checked
                  setForm(f => {
                    const basePrice = parseFloat(f.price) || 0
                    const newPrice = checked
                      ? applyDiscount(basePrice)
                      : basePrice
                    return { ...f, applyDiscount: checked, price: newPrice.toString() }
                  })
                }}
                className="accent-purple-500"
              />
              <span className="text-purple-300">Aplicar descuento tallerista ({discountPct}%)</span>
            </label>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={closeAll}>Cancelar</Button>
            <Button size="sm" onClick={addItem} disabled={adding || !form.description || !form.price}>
              {adding ? 'Guardando...' : 'Agregar'}
            </Button>
          </div>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <p className="text-gray-500 text-sm">Cargando...</p>
      ) : items.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4">Sin ítems. Agregá repuestos, mano de obra, servicios...</p>
      ) : (
        <div className="space-y-1">
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 text-xs text-gray-500 px-1 pb-1 border-b border-[#253652]">
            <span>Descripción</span>
            <span className="text-right w-10">Cant.</span>
            <span className="text-right w-24">Costo</span>
            <span className="text-right w-24">Precio</span>
            <span className="w-5" />
          </div>

          {items.map(item => {
            const t = TYPES[item.type] || TYPES.OTRO
            return (
              <div key={item.id} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center py-1.5 px-1 hover:bg-[#1e2d42] rounded transition">
                <div>
                  <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded border mr-1.5 ${t.color}`}>{t.label}</span>
                  <span className="text-gray-200 text-sm">{item.description}</span>
                  {item.productId && <span className="text-gray-600 text-[10px] ml-1">(stock)</span>}
                </div>
                <span className="text-gray-400 text-sm text-right w-10">
                  {item.type === 'MANO_DE_OBRA' || item.type === 'DIAGNOSTICO'
                    ? `${item.quantity % 1 === 0 ? item.quantity : item.quantity.toFixed(2)}h`
                    : `×${item.quantity % 1 === 0 ? item.quantity : item.quantity.toFixed(1)}`}
                </span>
                <span className="text-gray-500 text-sm text-right w-24">{formatCurrency(item.cost * item.quantity)}</span>
                <span className="text-emerald-400 text-sm font-medium text-right w-24">{formatCurrency(item.price * item.quantity)}</span>
                <button onClick={() => deleteItem(item.id)} className="text-gray-600 hover:text-red-400 transition w-5 text-right">
                  <Trash2 size={12} />
                </button>
              </div>
            )
          })}

          <div className="border-t border-[#253652] pt-2 mt-1 space-y-1.5">
            <div className="flex justify-between text-sm px-1">
              <span className="text-gray-500">Total costo interno</span>
              <span className="text-gray-500">{formatCurrency(totalCosto)}</span>
            </div>
            <div className="flex items-center justify-between bg-emerald-900/20 border border-emerald-800/30 rounded-lg px-3 py-2">
              <span className="text-emerald-300 font-semibold">Total a cobrar</span>
              <div className="flex items-center gap-3">
                {margen && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <TrendingUp size={11} /> {margen}% margen
                  </span>
                )}
                <span className="text-emerald-400 font-bold text-lg">{formatCurrency(totalPrecio)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
