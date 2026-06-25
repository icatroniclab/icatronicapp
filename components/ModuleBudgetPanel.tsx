'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, TrendingUp, Package } from 'lucide-react'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { formatCurrency } from '@/lib/utils'

const TYPES: Record<string, { label: string; color: string }> = {
  REPUESTO:     { label: 'Repuesto',      color: 'bg-blue-900/40 text-blue-300 border-blue-800/50' },
  MANO_DE_OBRA: { label: 'Mano de obra',  color: 'bg-emerald-900/40 text-emerald-300 border-emerald-800/50' },
  SERVICIO:     { label: 'Servicio',      color: 'bg-purple-900/40 text-purple-300 border-purple-800/50' },
  DIAGNOSTICO:  { label: 'Diagnóstico',   color: 'bg-yellow-900/40 text-yellow-300 border-yellow-800/50' },
  PROGRAMACION: { label: 'Programación',  color: 'bg-cyan-900/40 text-cyan-300 border-cyan-800/50' },
  OTRO:         { label: 'Otro',          color: 'bg-gray-800 text-gray-300 border-gray-700' },
}

const emptyForm = { type: 'REPUESTO', description: '', quantity: '1', cost: '', price: '', productId: '', boughtAtStore: false }

export function ModuleBudgetPanel({ moduleJobId, products, clientType, discount }: {
  moduleJobId: string
  products: any[]
  clientType?: string
  discount?: number
}) {
  const isTallerista = clientType === 'TALLERISTA' && (discount ?? 0) > 0
  const discountPct = isTallerista ? (discount ?? 0) : 0

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

  const fetchItems = useCallback(async () => {
    const res = await fetch(`/api/modulos/${moduleJobId}/presupuesto`)
    setItems(await res.json())
    setLoading(false)
  }, [moduleJobId])

  useEffect(() => { fetchItems() }, [fetchItems])

  function selectProduct(productId: string) {
    if (!productId) {
      setForm(f => ({ ...f, productId: '', description: '', cost: '', price: '' }))
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
    const res = await fetch(`/api/modulos/${moduleJobId}/presupuesto`, {
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
    setForm(emptyForm)
    setShowForm(false)
    await fetchItems()
    router.refresh()
  }

  async function deleteItem(itemId: string) {
    await fetch(`/api/modulos/${moduleJobId}/presupuesto`, {
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
        <Button size="sm" onClick={() => setShowForm(v => !v)}>
          <Plus size={14} /> Agregar ítem
        </Button>
      </div>

      {showForm && (
        <div className="bg-[#111c2e] border border-[#253652] rounded-lg p-3 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Tipo</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value, productId: '', description: '', cost: '', price: '' }))}
                className="w-full bg-[#1e2d42] border border-[#253652] rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
              >
                {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Cantidad</label>
              <input
                type="number" min="0.1" step="0.1" value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                className="w-full bg-[#1e2d42] border border-[#253652] rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

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
                    {p.name} (Stock: {p.quantity}) — {formatCurrency(p.unitPrice)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Descripción *</label>
            <input
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Ej: Diagnóstico en banco, Reparación driver, Componente..."
              className="w-full bg-[#1e2d42] border border-[#253652] rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

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
              <label className="text-xs text-gray-400 mb-1 block">Precio cliente ($) *</label>
              <input
                type="number" min="0" step="0.01" value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                placeholder="0"
                className="w-full bg-[#1e2d42] border border-[#253652] rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
              />
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

          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => { setShowForm(false); setForm(emptyForm) }}>Cancelar</Button>
            <Button size="sm" onClick={addItem} disabled={adding || !form.description || !form.price}>
              {adding ? 'Guardando...' : 'Agregar'}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500 text-sm">Cargando...</p>
      ) : items.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4">Sin ítems. Agregá diagnóstico, mano de obra, repuestos...</p>
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
                <span className="text-gray-400 text-sm text-right w-10">×{item.quantity % 1 === 0 ? item.quantity : item.quantity.toFixed(1)}</span>
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
