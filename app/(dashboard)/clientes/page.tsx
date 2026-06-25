'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Edit2, Trash2, Users, Car, ChevronDown, ChevronUp, Wrench, Cpu, AlertTriangle, Merge } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'

const emptyForm = { name: '', phone: '', email: '', dni: '', type: 'CLIENTE', discount: '', notes: '' }

// ─── Modal de fusión ──────────────────────────────────────────────────────────
function FusionarModal({ grupo, onClose, onDone }: {
  grupo: { clientes: any[]; razon: string }
  onClose: () => void
  onDone: () => void
}) {
  const [principalId, setPrincipalId] = useState<string>(
    // Pre-seleccionar el que tiene más trabajos
    grupo.clientes.reduce((a, b) => (a.totalTrabajos >= b.totalTrabajos ? a : b)).id
  )
  const [fusing, setFusing] = useState(false)
  const [error, setError] = useState('')

  const principal = grupo.clientes.find(c => c.id === principalId)!
  const secundarios = grupo.clientes.filter(c => c.id !== principalId)

  async function handleFusion() {
    if (secundarios.length !== 1) return
    setFusing(true)
    setError('')
    const res = await fetch('/api/clientes/fusionar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientePrincipalId: principalId, clienteSecundarioId: secundarios[0].id }),
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setError(d.error || 'Error al fusionar')
      setFusing(false)
      return
    }
    onDone()
  }

  return (
    <Modal open onClose={onClose} title="Fusionar clientes" size="lg">
      <div className="space-y-4">
        <div
          className="rounded-[2px] px-4 py-3 flex items-start gap-2"
          style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)' }}
        >
          <AlertTriangle size={16} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
          <p className="text-sm" style={{ color: '#fca5a5' }}>
            Esta acción es <strong>irreversible</strong>. El cliente secundario será eliminado y todos sus vehículos y trabajos serán transferidos al principal.
          </p>
        </div>

        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] mb-1" style={{ color: '#7a9aaa' }}>
          Seleccioná el cliente principal
        </p>
        <div className="space-y-2">
          {grupo.clientes.map(c => (
            <button
              key={c.id}
              onClick={() => setPrincipalId(c.id)}
              className="w-full text-left rounded-[2px] px-4 py-3 transition"
              style={{
                background: c.id === principalId ? 'rgba(0,229,255,0.08)' : 'rgba(0,0,0,0.2)',
                border: `1px solid ${c.id === principalId ? 'rgba(0,229,255,0.4)' : 'rgba(0,229,255,0.1)'}`,
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{c.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#7a9aaa' }}>
                    {[c.phone, c.email, c.dni ? `DNI ${c.dni}` : ''].filter(Boolean).join(' · ') || 'Sin datos de contacto'}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs" style={{ color: '#7a9aaa' }}>
                    {c.totalTrabajos} trabajo{c.totalTrabajos !== 1 ? 's' : ''}
                  </span>
                  {c.id === principalId && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-[2px] font-semibold"
                      style={{ background: 'rgba(0,229,255,0.15)', color: '#00e5ff' }}
                    >
                      Principal
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {principal && secundarios[0] && (
          <div
            className="rounded-[2px] px-4 py-3 text-xs space-y-1"
            style={{ background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.12)' }}
          >
            <p className="font-semibold" style={{ color: '#7a9aaa' }}>Lo que se va a unificar en "{principal.name}":</p>
            {!principal.phone && secundarios[0].phone && (
              <p style={{ color: '#e8f0f4' }}>· Teléfono: {secundarios[0].phone}</p>
            )}
            {!principal.email && secundarios[0].email && (
              <p style={{ color: '#e8f0f4' }}>· Email: {secundarios[0].email}</p>
            )}
            {!principal.dni && secundarios[0].dni && (
              <p style={{ color: '#e8f0f4' }}>· DNI: {secundarios[0].dni}</p>
            )}
            <p style={{ color: '#e8f0f4' }}>
              · Vehículos y trabajos de "{secundarios[0].name}"
            </p>
          </div>
        )}

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button
            variant="danger"
            onClick={handleFusion}
            disabled={fusing || !principalId || secundarios.length !== 1}
          >
            {fusing ? 'Fusionando…' : 'Confirmar fusión'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Panel de duplicados ──────────────────────────────────────────────────────
function DuplicadosPanel({ onRefreshClientes }: { onRefreshClientes: () => void }) {
  const [grupos, setGrupos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [fusionarGrupo, setFusionarGrupo] = useState<any | null>(null)

  const fetchDuplicados = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/clientes/duplicados')
    if (res.ok) setGrupos(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchDuplicados() }, [fetchDuplicados])

  if (loading || grupos.length === 0) return null

  return (
    <>
      <div
        className="rounded-[2px] overflow-hidden"
        style={{ border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.04)' }}
      >
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full flex items-center justify-between px-4 py-3 transition"
          style={{ color: '#f59e0b' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(245,158,11,0.06)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} />
            <span className="text-sm font-semibold">
              Posibles duplicados detectados ({grupos.length})
            </span>
          </div>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {expanded && (
          <div className="border-t border-[rgba(245,158,11,0.2)] divide-y divide-[rgba(245,158,11,0.1)]">
            {grupos.map((grupo, i) => (
              <div key={i} className="px-4 py-3 space-y-2">
                <p className="text-[0.6rem] font-bold uppercase tracking-[0.18em]" style={{ color: '#7a9aaa' }}>
                  {grupo.razon === 'telefono_igual' ? 'Mismo teléfono' : 'Nombre similar'}
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  {grupo.clientes.map((c: any, j: number) => (
                    <div key={c.id} className="flex items-center gap-2">
                      {j > 0 && <span className="text-xs" style={{ color: '#4a6070' }}>vs</span>}
                      <div
                        className="rounded-[2px] px-3 py-1.5"
                        style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(0,229,255,0.1)' }}
                      >
                        <p className="text-sm text-white font-medium">{c.name}</p>
                        <p className="text-xs" style={{ color: '#7a9aaa' }}>
                          {c.phone || 'sin tel.'} · {c.totalTrabajos} trabajo{c.totalTrabajos !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => setFusionarGrupo(grupo)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-[2px] transition ml-auto"
                    style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(245,158,11,0.18)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(245,158,11,0.1)')}
                  >
                    <Merge size={13} /> Fusionar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {fusionarGrupo && (
        <FusionarModal
          grupo={fusionarGrupo}
          onClose={() => setFusionarGrupo(null)}
          onDone={() => {
            setFusionarGrupo(null)
            fetchDuplicados()
            onRefreshClientes()
          }}
        />
      )}
    </>
  )
}

export default function ClientesPage() {
  const [clients, setClients] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editClient, setEditClient] = useState<any>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchClients = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (filterType) params.set('type', filterType)
    const res = await fetch(`/api/clientes?${params}`)
    setClients(await res.json())
    setLoading(false)
  }, [search, filterType])

  useEffect(() => { fetchClients() }, [fetchClients])

  function openCreate() {
    setEditClient(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  function openEdit(c: any) {
    setEditClient(c)
    setForm({
      name: c.name,
      phone: c.phone || '',
      email: c.email || '',
      dni: c.dni || '',
      type: c.type,
      discount: c.discount != null ? c.discount.toString() : '',
      notes: c.notes || '',
    })
    setShowModal(true)
  }

  async function save() {
    setSaving(true)
    try {
      let res: Response
      if (editClient) {
        res = await fetch(`/api/clientes/${editClient.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
      } else {
        res = await fetch('/api/clientes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(`Error al guardar: ${data.error || res.statusText}`)
        setSaving(false)
        return
      }
      setShowModal(false)
      fetchClients()
    } catch (e: any) {
      alert(`Error: ${e.message}`)
    }
    setSaving(false)
  }

  async function deleteClient(id: string) {
    if (!confirm('¿Eliminar cliente?')) return
    const res = await fetch(`/api/clientes/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      alert(data.error || 'No se puede eliminar')
    } else fetchClients()
  }

  const totalClientes = clients.filter(c => c.type === 'CLIENTE').length
  const totalTalleristas = clients.filter(c => c.type === 'TALLERISTA').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Clientes</h1>
          <p className="text-gray-400 text-sm mt-1">
            {totalClientes} cliente{totalClientes !== 1 ? 's' : ''} · {totalTalleristas} tallerista{totalTalleristas !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={openCreate}><Plus size={16} /> Nuevo cliente</Button>
      </div>

      {/* Duplicados */}
      <DuplicadosPanel onRefreshClientes={fetchClients} />

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, teléfono, DNI..."
            className="w-full bg-[#1e2d42] border border-[#253652] rounded-lg pl-9 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>
        <div className="flex gap-2">
          {(['', 'CLIENTE', 'TALLERISTA'] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                filterType === t
                  ? t === 'TALLERISTA' ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'
                  : 'bg-[#1e2d42] border border-[#253652] text-gray-400 hover:text-white'
              }`}
            >
              {t === '' ? 'Todos' : t === 'CLIENTE' ? 'Clientes' : 'Talleristas'}
            </button>
          ))}
        </div>
      </div>

      {loading ? <p className="text-gray-400">Cargando...</p> : (
        <div className="space-y-2">
          {clients.length === 0 && (
            <Card className="text-center py-10">
              <Users size={36} className="text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400">Sin clientes. <button onClick={openCreate} className="text-blue-400 hover:underline">Agregar el primero</button></p>
            </Card>
          )}
          {clients.map(c => {
            const isExpanded = expandedId === c.id
            const isTallerista = c.type === 'TALLERISTA'
            const totalVehiculos = c.vehicles?.length ?? 0
            const totalModulos = c.moduleJobs?.length ?? 0
            const hasHistory = totalVehiculos > 0 || totalModulos > 0
            return (
              <Card key={c.id} className={isTallerista ? 'border-purple-800/40' : ''}>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isTallerista ? 'bg-purple-900/40' : 'bg-blue-900/30'}`}>
                      {isTallerista ? <Wrench size={16} className="text-purple-400" /> : <Users size={16} className="text-blue-400" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium">{c.name}</p>
                        <Badge variant={isTallerista ? 'info' : 'outline'} className={isTallerista ? 'bg-purple-900/50 text-purple-300 border-purple-800' : ''}>
                          {isTallerista ? 'Tallerista' : 'Cliente'}
                        </Badge>
                        {isTallerista && c.discount != null && (
                          <Badge variant="warning">{c.discount}% desc.</Badge>
                        )}
                      </div>
                      <p className="text-gray-400 text-xs mt-0.5">
                        {[c.phone, c.email, c.dni ? `DNI ${c.dni}` : ''].filter(Boolean).join(' · ') || 'Sin datos de contacto'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {totalVehiculos > 0 && (
                      <span className="flex items-center gap-1 text-gray-500 text-xs">
                        <Car size={12} /> {totalVehiculos}
                      </span>
                    )}
                    {totalModulos > 0 && (
                      <span className="flex items-center gap-1 text-gray-500 text-xs">
                        <Cpu size={12} /> {totalModulos}
                      </span>
                    )}
                    {hasHistory && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : c.id)}
                        className="flex items-center gap-1 text-gray-400 hover:text-white text-xs transition px-2 py-1 rounded hover:bg-[#253652]"
                      >
                        Historial {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                    )}
                    <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-white transition"><Edit2 size={14} /></button>
                    <button onClick={() => deleteClient(c.id)} className="p-1.5 text-gray-400 hover:text-red-400 transition"><Trash2 size={14} /></button>
                  </div>
                </div>

                {c.notes && (
                  <p className="mt-2 text-xs text-gray-500 italic">{c.notes}</p>
                )}

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-[#253652] space-y-3">
                    {c.vehicles?.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1"><Car size={11} /> Vehículos</p>
                        {c.vehicles.map((v: any) => {
                          const lastOrder = v.workOrders?.[0]
                          return (
                            <div key={v.id} className="flex items-center justify-between text-sm pl-2">
                              <div className="flex items-center gap-2">
                                <span className="text-blue-400 font-medium text-xs bg-blue-900/20 px-2 py-0.5 rounded">{v.plate}</span>
                                <span className="text-gray-300 text-xs">{v.brand} {v.model} {v.year || ''}</span>
                              </div>
                              {lastOrder && <span className="text-gray-500 text-xs">{lastOrder.workStatus}</span>}
                            </div>
                          )
                        })}
                      </div>
                    )}
                    {c.moduleJobs?.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1"><Cpu size={11} /> Módulos</p>
                        {c.moduleJobs.map((j: any) => {
                          const names = j.modules.map((m: any) => m.moduleType.name).join(' · ')
                          return (
                            <a key={j.id} href={`/modulos/${j.id}`} className="flex items-center justify-between pl-2 hover:bg-[#253652] rounded px-2 py-0.5 transition">
                              <div className="flex items-center gap-2">
                                {j.orderNumber && <span className="text-gray-600 font-mono text-xs">#{j.orderNumber}</span>}
                                <span className="text-[#00e5ff]/80 text-xs">{names || 'Módulos'}</span>
                              </div>
                              <span className="text-gray-500 text-xs">{j.status}</span>
                            </a>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editClient ? 'Editar cliente' : 'Nuevo cliente'}>
        <div className="space-y-4">
          <Input label="Nombre *" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Teléfono" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            <Input label="DNI" value={form.dni} onChange={e => setForm(f => ({ ...f, dni: e.target.value }))} />
          </div>
          <Input label="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />

          <div>
            <p className="text-sm text-gray-400 mb-2">Tipo de cliente</p>
            <div className="flex gap-2">
              {(['CLIENTE', 'TALLERISTA'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: t, discount: t === 'CLIENTE' ? '' : f.discount }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition border ${
                    form.type === t
                      ? t === 'TALLERISTA'
                        ? 'bg-purple-600 border-purple-500 text-white'
                        : 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-[#1e2d42] border-[#253652] text-gray-400 hover:text-white'
                  }`}
                >
                  {t === 'CLIENTE' ? 'Cliente' : 'Tallerista'}
                </button>
              ))}
            </div>
          </div>

          {form.type === 'TALLERISTA' && (
            <Input
              label="Descuento (%)"
              type="number"
              min="0"
              max="100"
              step="0.5"
              placeholder="Ej: 15"
              value={form.discount}
              onChange={e => setForm(f => ({ ...f, discount: e.target.value }))}
            />
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-1">Notas</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
              placeholder="Observaciones..."
              className="w-full bg-[#1e2d42] border border-[#253652] rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition text-sm resize-none"
            />
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
