'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Pencil, Trash2, Cpu } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const DEFAULT_TYPES = [
  { name: 'ECU', description: 'Unidad de control del motor' },
  { name: 'TCU / TCM', description: 'Unidad de control de transmisión' },
  { name: 'ABS / ESP', description: 'Control de frenos y estabilidad' },
  { name: 'Airbag / SRS', description: 'Sistema de seguridad pasiva' },
  { name: 'BCM', description: 'Módulo de carrocería' },
  { name: 'Inmovilizador', description: 'Sistema antirrobo' },
  { name: 'Climatizador', description: 'Control de climatización' },
  { name: 'Cuadro de instrumentos', description: 'Panel de instrumentos / Clúster' },
  { name: 'Gateway', description: 'Pasarela de comunicación CAN' },
  { name: 'Suspensión', description: 'Control de suspensión activa' },
  { name: 'Cierre centralizado', description: 'Control de puertas y acceso' },
  { name: 'Computadora de inyección', description: 'Inyección electrónica' },
]

export default function ModuloTiposPage() {
  const [types, setTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [seeding, setSeeding] = useState(false)

  async function fetchTypes() {
    const res = await fetch('/api/modulos/tipos')
    setTypes(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchTypes() }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('El nombre es requerido'); return }
    setSaving(true)
    setError('')

    const url = editingId ? `/api/modulos/tipos/${editingId}` : '/api/modulos/tipos'
    const method = editingId ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (!res.ok) {
      const e = await res.json()
      setError(e.error || 'Error')
      setSaving(false)
      return
    }
    setForm({ name: '', description: '' })
    setEditingId(null)
    setShowForm(false)
    setSaving(false)
    await fetchTypes()
  }

  async function deleteType(id: string, name: string) {
    if (!confirm(`¿Eliminar tipo "${name}"? Solo es posible si no tiene trabajos asociados.`)) return
    const res = await fetch(`/api/modulos/tipos/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const e = await res.json()
      alert(e.error || 'Error al eliminar')
      return
    }
    await fetchTypes()
  }

  function startEdit(t: any) {
    setForm({ name: t.name, description: t.description ?? '' })
    setEditingId(t.id)
    setShowForm(true)
    setError('')
  }

  function cancelForm() {
    setForm({ name: '', description: '' })
    setEditingId(null)
    setShowForm(false)
    setError('')
  }

  async function seedDefaults() {
    setSeeding(true)
    for (const t of DEFAULT_TYPES) {
      const exists = types.some(x => x.name.toLowerCase() === t.name.toLowerCase())
      if (!exists) {
        await fetch('/api/modulos/tipos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(t),
        })
      }
    }
    setSeeding(false)
    await fetchTypes()
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/modulos">
          <Button variant="ghost" size="sm"><ArrowLeft size={16} /> Volver a Módulos</Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Cpu size={20} className="text-[#00e5ff]" /> Tipos de módulo
          </h1>
        </div>
        <div className="flex gap-2">
          {types.length === 0 && !loading && (
            <Button variant="secondary" size="sm" onClick={seedDefaults} disabled={seeding}>
              {seeding ? 'Cargando...' : 'Cargar tipos por defecto'}
            </Button>
          )}
          <Button size="sm" onClick={() => { cancelForm(); setShowForm(true) }}>
            <Plus size={15} /> Nuevo tipo
          </Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <h2 className="text-sm font-semibold text-[#00e5ff] uppercase tracking-widest mb-4">
            {editingId ? 'Editar tipo' : 'Nuevo tipo'}
          </h2>
          <form onSubmit={submit} className="space-y-3">
            <Input
              label="Nombre *"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ej: ECU, ABS, BCM..."
              autoFocus
            />
            <Input
              label="Descripción"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Descripción opcional"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" type="button" size="sm" onClick={cancelForm}>Cancelar</Button>
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear tipo'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <p className="text-gray-500 text-sm">Cargando...</p>
      ) : types.length === 0 ? (
        <Card className="text-center py-8">
          <Cpu size={36} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm mb-3">Sin tipos cargados todavía.</p>
          <Button variant="secondary" size="sm" onClick={seedDefaults} disabled={seeding}>
            {seeding ? 'Cargando...' : 'Cargar tipos por defecto'}
          </Button>
        </Card>
      ) : (
        <Card>
          <div className="space-y-1">
            {types.map(t => (
              <div key={t.id} className="flex items-center justify-between py-2.5 px-2 hover:bg-[#1e2d42] rounded transition group">
                <div>
                  <p className="text-white font-medium text-sm">{t.name}</p>
                  {t.description && <p className="text-gray-500 text-xs">{t.description}</p>}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => startEdit(t)}
                    className="text-gray-500 hover:text-[#00e5ff] p-1.5 rounded transition"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => deleteType(t.id, t.name)}
                    className="text-gray-500 hover:text-red-400 p-1.5 rounded transition"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
