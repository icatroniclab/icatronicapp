'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Edit2, Trash2, BookOpen, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'

const emptyForm = { title: '', vehicle: '', dtcCodes: '', symptoms: '', rootCause: '', solution: '', parts: '', difficulty: 'MEDIA', status: 'BORRADOR' }

export default function CasosPage() {
  const [casos, setCasos] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editCaso, setEditCaso] = useState<any>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchCasos = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/casos?q=${encodeURIComponent(search)}`)
    setCasos(await res.json())
    setLoading(false)
  }, [search])

  useEffect(() => { fetchCasos() }, [fetchCasos])

  function openCreate() { setEditCaso(null); setForm(emptyForm); setShowModal(true) }
  function openEdit(c: any) { setEditCaso(c); setForm({ title: c.title, vehicle: c.vehicle, dtcCodes: c.dtcCodes || '', symptoms: c.symptoms, rootCause: c.rootCause || '', solution: c.solution || '', parts: c.parts || '', difficulty: c.difficulty, status: c.status }); setShowModal(true) }

  async function save() {
    setSaving(true)
    if (editCaso) {
      await fetch(`/api/casos/${editCaso.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    } else {
      await fetch('/api/casos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    }
    setSaving(false)
    setShowModal(false)
    fetchCasos()
  }

  async function deleteCaso(id: string) {
    if (!confirm('¿Eliminar este caso?')) return
    await fetch(`/api/casos/${id}`, { method: 'DELETE' })
    fetchCasos()
  }

  const verificados = casos.filter(c => c.status === 'VERIFICADO')
  const borradores = casos.filter(c => c.status === 'BORRADOR')

  const difficultyColor: Record<string, any> = { BAJA: 'success', MEDIA: 'warning', ALTA: 'danger' }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Base de Casos</h1>
          <p className="text-gray-400 text-sm mt-1">{verificados.length} verificados · {borradores.length} borradores</p>
        </div>
        <Button onClick={openCreate}><Plus size={16} /> Nuevo caso</Button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por síntoma, DTC, vehículo..." className="w-full bg-[#1e2d42] border border-[#253652] rounded-lg pl-9 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition" />
      </div>

      {loading ? <p className="text-gray-400">Cargando...</p> : (
        <>
          {casos.length === 0 && (
            <Card className="text-center py-12">
              <BookOpen size={36} className="text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">Sin casos aún. El asistente IA usa esta base para diagnósticos más precisos.</p>
            </Card>
          )}
          <div className="space-y-3">
            {casos.map(c => {
              const expanded = expandedId === c.id
              return (
                <Card key={c.id} className={c.status === 'VERIFICADO' ? 'border-emerald-800/40' : ''}>
                  {/* Cabecera clickeable */}
                  <div
                    className="flex items-start justify-between gap-3 cursor-pointer"
                    onClick={() => setExpandedId(expanded ? null : c.id)}
                  >
                    <div className="flex items-start gap-3 flex-1">
                      {c.status === 'VERIFICADO' ? (
                        <CheckCircle size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <div className="w-4.5 h-4.5 rounded-full border-2 border-gray-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-white font-medium">{c.title}</h3>
                          <Badge variant={difficultyColor[c.difficulty]}>{c.difficulty}</Badge>
                          {c.status === 'BORRADOR' && <Badge variant="outline">Borrador</Badge>}
                        </div>
                        <p className="text-gray-400 text-xs mb-2">{c.vehicle}</p>
                        {c.dtcCodes && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {c.dtcCodes.split(',').map((d: string) => (
                              <span key={d} className="text-xs font-mono bg-blue-900/30 text-blue-300 px-1.5 py-0.5 rounded">{d.trim()}</span>
                            ))}
                          </div>
                        )}
                        <p className="text-gray-300 text-sm"><span className="text-gray-500">Síntomas: </span>{c.symptoms}</p>
                        {!expanded && c.rootCause && <p className="text-gray-300 text-sm mt-1"><span className="text-gray-500">Causa: </span>{c.rootCause}</p>}
                        {!expanded && c.aiAnalysis && !c.rootCause && <p className="text-gray-400 text-xs mt-1 line-clamp-2"><span className="text-blue-500">IA: </span>{c.aiAnalysis}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={e => { e.stopPropagation(); openEdit(c) }} className="p-1.5 text-gray-400 hover:text-white transition"><Edit2 size={14} /></button>
                      <button onClick={e => { e.stopPropagation(); deleteCaso(c.id) }} className="p-1.5 text-gray-400 hover:text-red-400 transition"><Trash2 size={14} /></button>
                      {expanded ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
                    </div>
                  </div>

                  {/* Detalle expandido */}
                  {expanded && (
                    <div className="mt-4 pt-4 border-t border-[#253652] space-y-3">
                      {c.rootCause && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Causa raíz</p>
                          <p className="text-gray-200 text-sm">{c.rootCause}</p>
                        </div>
                      )}
                      {c.solution && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Solución aplicada</p>
                          <p className="text-gray-200 text-sm">{c.solution}</p>
                        </div>
                      )}
                      {c.parts && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Repuestos</p>
                          <p className="text-gray-200 text-sm">{c.parts}</p>
                        </div>
                      )}
                      {c.aiAnalysis && (
                        <div>
                          <p className="text-xs text-blue-500 uppercase tracking-wide mb-1">Análisis IA</p>
                          <p className="text-gray-300 text-sm whitespace-pre-wrap">{c.aiAnalysis}</p>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        </>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editCaso ? 'Editar caso' : 'Nuevo caso diagnóstico'} size="lg">
        <div className="space-y-4">
          <Input label="Título *" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ej: P0300 en Toyota Corolla 2018 — falla de inyectores" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Vehículo" value={form.vehicle} onChange={e => setForm(f => ({ ...f, vehicle: e.target.value }))} placeholder="Marca Modelo Año" />
            <Input label="Códigos DTC (separados por comas)" value={form.dtcCodes} onChange={e => setForm(f => ({ ...f, dtcCodes: e.target.value }))} placeholder="P0300, P0301" />
          </div>
          <Textarea label="Síntomas *" required rows={2} value={form.symptoms} onChange={e => setForm(f => ({ ...f, symptoms: e.target.value }))} />
          <Textarea label="Causa raíz" rows={2} value={form.rootCause} onChange={e => setForm(f => ({ ...f, rootCause: e.target.value }))} />
          <Textarea label="Solución aplicada" rows={2} value={form.solution} onChange={e => setForm(f => ({ ...f, solution: e.target.value }))} />
          <Input label="Repuestos utilizados" value={form.parts} onChange={e => setForm(f => ({ ...f, parts: e.target.value }))} placeholder="Ej: Bujías NGK (4 u.)" />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Dificultad" value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}>
              <option value="BAJA">Baja</option>
              <option value="MEDIA">Media</option>
              <option value="ALTA">Alta</option>
            </Select>
            <Select label="Estado" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="BORRADOR">Borrador</option>
              <option value="VERIFICADO">Verificado</option>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving || !form.title}>{saving ? 'Guardando...' : 'Guardar caso'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
