'use client'
import { useState, useRef, useEffect } from 'react'
import { Edit2, Save, X, User, Search, UserCheck, UserPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  moduleJobId: string
  client: { id: string; name: string; phone?: string | null; type: string } | null
  techName: string | null
  techPhone: string | null
  clientType: string
}

export function ModuleClientEditor({ moduleJobId, client, techName, techPhone, clientType }: Props) {
  const router = useRouter()

  // Vista
  const [editing, setEditing]     = useState(false)
  const [saving, setSaving]       = useState(false)

  // Búsqueda
  const [query, setQuery]         = useState('')
  const [results, setResults]     = useState<any[]>([])
  const [selected, setSelected]   = useState<any>(null)
  const [open, setOpen]           = useState(false)
  const [dropPos, setDropPos]     = useState({ top: 0, left: 0, width: 0 })
  const inputRef  = useRef<HTMLInputElement>(null)
  const timeout   = useRef<any>(null)

  // Crear nuevo
  const [creating, setCreating]   = useState(false)
  const [newName, setNewName]     = useState('')
  const [newPhone, setNewPhone]   = useState('')
  const [newType, setNewType]     = useState<'TALLERISTA' | 'CLIENTE'>('TALLERISTA')
  const [savingNew, setSavingNew] = useState(false)

  const displayName  = client?.name  ?? techName  ?? 'Sin nombre'
  const displayPhone = client?.phone ?? techPhone ?? ''
  const displayType  = clientType === 'TALLERISTA' ? 'Tallerista' : 'Particular'

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (!target.closest('[data-client-search]')) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  function openEditor() {
    setEditing(true)
    setQuery('')
    setResults([])
    setSelected(null)
    setOpen(false)
    setCreating(false)
  }

  function cancelEditor() {
    setEditing(false)
    setCreating(false)
  }

  function handleInput(q: string) {
    setQuery(q)
    setSelected(null)
    clearTimeout(timeout.current)
    if (!q.trim()) { setResults([]); setOpen(false); return }

    // Calcular posición del dropdown (fixed, debajo del input)
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect()
      setDropPos({ top: rect.bottom + 4, left: rect.left, width: rect.width })
    }
    setOpen(true)

    timeout.current = setTimeout(async () => {
      const res = await fetch(`/api/clientes?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(Array.isArray(data) ? data.slice(0, 8) : [])
    }, 280)
  }

  function pickClient(c: any) {
    setSelected(c)
    setQuery(c.name)
    setOpen(false)
    setResults([])
  }

  async function createAndPick() {
    if (!newName.trim()) return
    setSavingNew(true)
    const res = await fetch('/api/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), phone: newPhone || null, type: newType }),
    })
    if (res.ok) {
      const c = await res.json()
      pickClient(c)
      setCreating(false)
      setNewName('')
      setNewPhone('')
    }
    setSavingNew(false)
  }

  async function save() {
    if (!selected) return
    setSaving(true)
    await fetch(`/api/modulos/${moduleJobId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId:   selected.id,
        techName:   null,
        techPhone:  null,
        clientType: selected.type === 'TALLERISTA' ? 'TALLERISTA' : 'PARTICULAR',
      }),
    })
    setSaving(false)
    setEditing(false)
    router.refresh()
  }

  const inputCls = 'w-full bg-[#192638] border border-[rgba(0,229,255,0.2)] rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00e5ff] placeholder-gray-600'

  return (
    <div className="p-3 space-y-2">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <p className="text-[#7a9aaa] text-[0.65rem] uppercase tracking-widest flex items-center gap-1">
          <User size={10} /> Cliente
        </p>
        {!editing ? (
          <button onClick={openEditor} className="flex items-center gap-1 text-[#7a9aaa] hover:text-[#00e5ff] transition text-xs">
            <Edit2 size={11} /> Cambiar
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={save}
              disabled={saving || !selected}
              className="flex items-center gap-1 text-[#00e5ff] hover:text-white transition text-xs disabled:opacity-40"
            >
              <Save size={11} /> {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button onClick={cancelEditor} className="flex items-center gap-1 text-[#7a9aaa] hover:text-white transition text-xs">
              <X size={11} /> Cancelar
            </button>
          </div>
        )}
      </div>

      {/* Vista: datos actuales */}
      {!editing && (
        <>
          <p className="text-white text-sm font-medium">{displayName}</p>
          {displayPhone && <p className="text-gray-500 text-xs">{displayPhone}</p>}
          <p className="text-gray-600 text-xs">{displayType}</p>
        </>
      )}

      {/* Vista: editor */}
      {editing && (
        <div data-client-search>
          {/* Cliente seleccionado */}
          {selected ? (
            <div className="flex items-center gap-2 bg-[#192638] border border-[rgba(0,229,255,0.3)] rounded px-3 py-2">
              <UserCheck size={14} className="text-[#00e5ff] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{selected.name}</p>
                <p className="text-gray-500 text-xs">{selected.type === 'TALLERISTA' ? 'Tallerista' : 'Particular'}</p>
              </div>
              <button type="button" onClick={() => { setSelected(null); setQuery('') }} className="text-gray-500 hover:text-red-400">
                <X size={13} />
              </button>
            </div>
          ) : !creating ? (
            /* Buscador */
            <>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => handleInput(e.target.value)}
                  placeholder="Buscar por nombre o teléfono..."
                  className={inputCls + ' pl-8'}
                  autoFocus
                />
              </div>
              {query.trim() && !open && results.length === 0 && (
                <button
                  type="button"
                  onClick={() => { setCreating(true); setNewName(query) }}
                  className="mt-2 w-full flex items-center gap-2 text-[#00e5ff] text-xs hover:text-white transition"
                >
                  <UserPlus size={13} /> Crear cliente "{query}"
                </button>
              )}
            </>
          ) : (
            /* Formulario de nuevo cliente */
            <div className="space-y-2">
              <p className="text-xs text-[#00e5ff] uppercase tracking-widest">Nuevo cliente</p>
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nombre *" className={inputCls} autoFocus />
              <input type="text" value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="Teléfono (opcional)" className={inputCls} />
              <div className="flex gap-2">
                {(['TALLERISTA', 'CLIENTE'] as const).map(t => (
                  <button key={t} type="button" onClick={() => setNewType(t)}
                    className={`flex-1 py-1.5 rounded text-xs font-medium border transition ${newType === t ? (t === 'TALLERISTA' ? 'bg-purple-900/50 border-purple-600 text-purple-300' : 'bg-blue-900/40 border-blue-600 text-blue-300') : 'bg-[#192638] border-[#253652] text-gray-500'}`}>
                    {t === 'TALLERISTA' ? 'Tallerista' : 'Particular'}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setCreating(false)} className="flex-1 py-1.5 text-xs text-gray-400 hover:text-white border border-[#253652] rounded transition">Volver</button>
                <button type="button" onClick={createAndPick} disabled={savingNew || !newName.trim()} className="flex-1 py-1.5 text-xs bg-[#00e5ff] text-black font-bold rounded disabled:opacity-50">
                  {savingNew ? 'Guardando...' : 'Crear y vincular'}
                </button>
              </div>
            </div>
          )}

          {/* Dropdown con position:fixed para evitar clipping */}
          {open && results.length > 0 && (
            <div
              data-client-search
              style={{ position: 'fixed', top: dropPos.top, left: dropPos.left, width: dropPos.width, zIndex: 9999 }}
              className="bg-[#1e2d42] border border-[#253652] rounded-lg shadow-2xl overflow-hidden"
            >
              {results.map((c: any) => (
                <button
                  key={c.id}
                  type="button"
                  onMouseDown={() => pickClient(c)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#253652] transition text-left"
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${c.type === 'TALLERISTA' ? 'bg-purple-900/50 text-purple-300' : 'bg-blue-900/40 text-blue-300'}`}>
                    {c.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{c.name}</p>
                    <p className="text-gray-500 text-xs">{[c.phone, c.type === 'TALLERISTA' ? 'Tallerista' : 'Particular'].filter(Boolean).join(' · ')}</p>
                  </div>
                </button>
              ))}
              <button
                type="button"
                onMouseDown={() => { setCreating(true); setNewName(query); setOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-[#253652] transition text-left border-t border-[#253652] text-[#00e5ff] text-sm"
              >
                <UserPlus size={14} /> Crear cliente "{query}"
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
