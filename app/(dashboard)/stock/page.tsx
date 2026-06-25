'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, Search, Edit2, Trash2, AlertTriangle, Package, ImagePlus, X } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency } from '@/lib/utils'
import Image from 'next/image'

const emptyForm = { name: '', quantity: '0', minStock: '5', costPrice: '0', unitPrice: '0', photo: '' }

export default function StockPage() {
  const [products, setProducts] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editProduct, setEditProduct] = useState<any>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/stock?q=${encodeURIComponent(search)}`)
    setProducts(await res.json())
    setLoading(false)
  }, [search])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  function openCreate() {
    setEditProduct(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  function openEdit(p: any) {
    setEditProduct(p)
    setForm({ name: p.name, quantity: p.quantity.toString(), minStock: p.minStock.toString(), costPrice: p.costPrice.toString(), unitPrice: p.unitPrice.toString(), photo: p.photo || '' })
    setShowModal(true)
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('folder', 'productos')
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const data = await res.json()
    setForm(f => ({ ...f, photo: data.url }))
    setUploadingPhoto(false)
  }

  async function save() {
    setSaving(true)
    if (editProduct) {
      await fetch(`/api/stock/${editProduct.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    } else {
      await fetch('/api/stock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    }
    setSaving(false)
    setShowModal(false)
    fetchProducts()
  }

  async function deleteProduct(id: string) {
    if (!confirm('¿Eliminar producto? (solo si no tiene historial de uso)')) return
    const res = await fetch(`/api/stock/${id}`, { method: 'DELETE' })
    if (!res.ok) alert('No se puede eliminar: tiene historial de uso')
    else fetchProducts()
  }

  const lowStock = products.filter(p => p.quantity <= p.minStock)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Stock</h1>
          <p className="text-gray-400 text-sm mt-1">{products.length} productos</p>
        </div>
        <Button onClick={openCreate}><Plus size={16} /> Nuevo producto</Button>
      </div>

      {lowStock.length > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-800/40 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-300 font-medium text-sm">Stock bajo en {lowStock.length} producto(s)</p>
            <p className="text-yellow-400/70 text-xs mt-0.5">{lowStock.map(p => p.name).join(', ')}</p>
          </div>
        </div>
      )}

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar producto..." className="w-full bg-[#1e2d42] border border-[#253652] rounded-lg pl-9 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition" />
      </div>

      {loading ? <p className="text-gray-400">Cargando...</p> : (
        <div className="space-y-2">
          {products.length === 0 && (
            <Card className="text-center py-10">
              <Package size={36} className="text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400">Sin productos. <button onClick={openCreate} className="text-blue-400 hover:underline">Agregar el primero</button></p>
            </Card>
          )}
          {products.map(p => {
            const isLow = p.quantity <= p.minStock
            const isExpanded = expandedId === p.id
            return (
              <Card key={p.id} className={`${isLow ? 'border-yellow-800/60' : ''}`}>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    {p.photo ? (
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-[#253652]">
                        <Image src={p.photo} alt={p.name} width={48} height={48} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className={`px-3 py-1.5 rounded-lg text-center min-w-[52px] ${isLow ? 'bg-yellow-900/30 border border-yellow-800/40' : 'bg-[#253652]'}`}>
                        <p className={`text-lg font-bold ${isLow ? 'text-yellow-400' : 'text-white'}`}>{p.quantity}</p>
                        <p className="text-gray-400 text-[10px]">unid.</p>
                      </div>
                    )}
                    <div>
                      <p className="text-white font-medium">{p.name}</p>
                      <p className="text-gray-400 text-xs">
                        {p.photo && <span className={`mr-2 font-medium ${isLow ? 'text-yellow-400' : 'text-white'}`}>{p.quantity} unid.</span>}
                        Mín: {p.minStock} · Costo: {formatCurrency(p.costPrice)} · Precio: {formatCurrency(p.unitPrice)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.partsUsed?.length > 0 && (
                      <button onClick={() => setExpandedId(isExpanded ? null : p.id)} className="text-gray-400 hover:text-white text-xs transition">
                        {isExpanded ? 'Ocultar historial' : `Historial (${p.partsUsed.length})`}
                      </button>
                    )}
                    <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-white transition"><Edit2 size={14} /></button>
                    <button onClick={() => deleteProduct(p.id)} className="p-1.5 text-gray-400 hover:text-red-400 transition"><Trash2 size={14} /></button>
                  </div>
                </div>
                {isExpanded && p.partsUsed?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#253652] space-y-1.5">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Historial de uso</p>
                    {p.partsUsed.map((pu: any) => (
                      <div key={pu.id} className="flex justify-between text-xs text-gray-300">
                        <span>{pu.workTracking?.workOrder?.vehicle?.plate || '—'}</span>
                        <span className="text-gray-400">×{pu.quantity} · {new Date(pu.createdAt).toLocaleDateString('es-AR')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editProduct ? 'Editar producto' : 'Nuevo producto'}>
        <div className="space-y-4">
          <Input label="Nombre *" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Cantidad" type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
            <Input label="Stock mínimo" type="number" value={form.minStock} onChange={e => setForm(f => ({ ...f, minStock: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Precio costo ($)" type="number" step="0.01" value={form.costPrice} onChange={e => setForm(f => ({ ...f, costPrice: e.target.value }))} />
            <Input label="Precio venta ($)" type="number" step="0.01" value={form.unitPrice} onChange={e => setForm(f => ({ ...f, unitPrice: e.target.value }))} />
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-2">Foto del producto</p>
            {form.photo ? (
              <div className="relative w-full h-40 rounded-lg overflow-hidden bg-[#253652]">
                <Image src={form.photo} alt="foto producto" fill className="object-contain" />
                <button onClick={() => setForm(f => ({ ...f, photo: '' }))} className="absolute top-2 right-2 bg-black/60 rounded-full p-1 text-white hover:bg-red-600 transition">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="w-full h-24 rounded-lg border-2 border-dashed border-[#253652] hover:border-blue-500 transition flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-blue-400"
              >
                <ImagePlus size={20} />
                <span className="text-xs">{uploadingPhoto ? 'Subiendo...' : 'Subir foto'}</span>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving || !form.name}>{saving ? 'Guardando...' : 'Guardar'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
