'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Cpu, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Card } from './ui/Card'
import { Button } from './ui/Button'

interface ModuleItem {
  id: string
  moduleTypeId: string
  moduleType: { id: string; name: string; description?: string | null }
  moduleBrand?: string | null
  partNumber?: string | null
  serialNumber?: string | null
  notes?: string | null
}

const inputClass = 'w-full bg-[#111c2e] border border-[rgba(0,229,255,0.15)] rounded-[2px] px-2.5 py-1.5 text-[#e8f0f4] placeholder-[#4a6070] focus:outline-none focus:border-[#00b8cc] text-sm'
const selectClass = inputClass + ' cursor-pointer'

export function ModuleItemsPanel({
  moduleJobId,
  initialItems,
  moduleTypes,
}: {
  moduleJobId: string
  initialItems: ModuleItem[]
  moduleTypes: { id: string; name: string; description?: string | null }[]
}) {
  const router = useRouter()
  const [items, setItems] = useState<ModuleItem[]>(initialItems)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [newMod, setNewMod] = useState({ moduleTypeId: '', moduleBrand: '', partNumber: '', serialNumber: '', notes: '' })

  async function addModule() {
    if (!newMod.moduleTypeId) { setError('Seleccioná el tipo de módulo'); return }
    setSaving(true)
    setError('')
    const res = await fetch(`/api/modulos/${moduleJobId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMod),
    })
    if (!res.ok) {
      const e = await res.json()
      setError(e.error || 'Error')
      setSaving(false)
      return
    }
    const item = await res.json()
    setItems(prev => [...prev, item])
    setNewMod({ moduleTypeId: '', moduleBrand: '', partNumber: '', serialNumber: '', notes: '' })
    setShowAdd(false)
    setSaving(false)
    router.refresh()
  }

  async function removeModule(itemId: string) {
    if (items.length <= 1) return
    const res = await fetch(`/api/modulos/${moduleJobId}/items`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId }),
    })
    if (!res.ok) {
      const e = await res.json()
      alert(e.error || 'Error')
      return
    }
    setItems(prev => prev.filter(i => i.id !== itemId))
    router.refresh()
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Cpu size={15} className="text-[#00e5ff]" />
          Módulos del ingreso
          <span className="text-gray-500 text-sm font-normal">({items.length})</span>
        </h3>
        <Button size="sm" variant="secondary" onClick={() => { setShowAdd(v => !v); setError('') }}>
          {showAdd ? <ChevronUp size={14} /> : <Plus size={14} />}
          {showAdd ? 'Cancelar' : 'Agregar módulo'}
        </Button>
      </div>

      {/* Lista */}
      <div className="space-y-2 mb-3">
        {items.map((item, idx) => (
          <div key={item.id} className="flex items-start gap-3 bg-[#111c2e] border border-[rgba(0,229,255,0.08)] rounded-[2px] px-3 py-2.5 group">
            <div className="flex-shrink-0 w-6 h-6 rounded bg-[rgba(0,229,255,0.08)] border border-[rgba(0,229,255,0.15)] flex items-center justify-center text-[#00e5ff] text-xs font-mono mt-0.5">
              {idx + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm">{item.moduleType.name}</p>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                {item.moduleBrand && <span className="text-gray-400 text-xs">Marca: {item.moduleBrand}</span>}
                {item.partNumber && <span className="text-gray-400 text-xs font-mono">P/N: {item.partNumber}</span>}
                {item.serialNumber && <span className="text-gray-400 text-xs font-mono">S/N: {item.serialNumber}</span>}
                {item.notes && <span className="text-gray-500 text-xs italic">{item.notes}</span>}
              </div>
            </div>
            {items.length > 1 && (
              <button
                onClick={() => removeModule(item.id)}
                className="text-gray-700 hover:text-red-400 transition opacity-0 group-hover:opacity-100 flex-shrink-0 mt-0.5"
                title="Quitar módulo"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Formulario agregar */}
      {showAdd && (
        <div className="border-t border-[rgba(0,229,255,0.1)] pt-3 space-y-3">
          <p className="text-[#7a9aaa] text-xs uppercase tracking-widest">Agregar módulo al ingreso</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <select
                value={newMod.moduleTypeId}
                onChange={e => setNewMod(m => ({ ...m, moduleTypeId: e.target.value }))}
                className={selectClass}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2300e5ff' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  paddingRight: '36px',
                  appearance: 'none',
                }}
              >
                <option value="">— Tipo de módulo *  —</option>
                {moduleTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.name}{t.description ? ` — ${t.description}` : ''}</option>
                ))}
              </select>
            </div>
            <input className={inputClass} placeholder="Marca" value={newMod.moduleBrand} onChange={e => setNewMod(m => ({ ...m, moduleBrand: e.target.value }))} />
            <input className={inputClass} placeholder="Nº de parte" value={newMod.partNumber} onChange={e => setNewMod(m => ({ ...m, partNumber: e.target.value }))} />
            <input className={inputClass} placeholder="Nº de serie" value={newMod.serialNumber} onChange={e => setNewMod(m => ({ ...m, serialNumber: e.target.value }))} />
            <input className={inputClass} placeholder="Notas" value={newMod.notes} onChange={e => setNewMod(m => ({ ...m, notes: e.target.value }))} />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex justify-end">
            <Button size="sm" onClick={addModule} disabled={saving}>
              {saving ? 'Guardando...' : 'Agregar al kit'}
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
