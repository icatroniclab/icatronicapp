'use client'
import { useState, useRef, useEffect } from 'react'
import { Search, UserCheck, X, UserPlus } from 'lucide-react'

interface Client {
  id: string
  name: string
  phone?: string | null
  email?: string | null
  type: string
}

interface Props {
  value: Client | null
  onChange: (client: Client | null) => void
  placeholder?: string
  defaultType?: 'CLIENTE' | 'TALLERISTA'
}

export function ClientSearchInput({ value, onChange, placeholder = 'Buscar cliente por nombre o teléfono...', defaultType = 'TALLERISTA' }: Props) {
  const [query, setQuery]           = useState(value?.name ?? '')
  const [suggestions, setSuggestions] = useState<Client[]>([])
  const [open, setOpen]             = useState(false)
  const [creating, setCreating]     = useState(false)
  const [newName, setNewName]       = useState('')
  const [newPhone, setNewPhone]     = useState('')
  const [newType, setNewType]       = useState<'CLIENTE' | 'TALLERISTA'>(defaultType)
  const [saving, setSaving]         = useState(false)
  const timeout = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Sincronizar query cuando cambia el value externo
  useEffect(() => { setQuery(value?.name ?? '') }, [value])

  function search(q: string) {
    setQuery(q)
    onChange(null)
    setOpen(true)
    clearTimeout(timeout.current)
    if (!q.trim()) { setSuggestions([]); return }
    timeout.current = setTimeout(async () => {
      const res = await fetch(`/api/clientes?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setSuggestions(data.slice(0, 7))
    }, 280)
  }

  function select(c: Client) {
    onChange(c)
    setQuery(c.name)
    setSuggestions([])
    setOpen(false)
  }

  function clear() {
    onChange(null)
    setQuery('')
    setSuggestions([])
    setCreating(false)
  }

  async function createClient() {
    if (!newName.trim()) return
    setSaving(true)
    const res = await fetch('/api/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), phone: newPhone || null, type: newType }),
    })
    if (res.ok) {
      const c = await res.json()
      select(c)
      setCreating(false)
      setNewName('')
      setNewPhone('')
    }
    setSaving(false)
  }

  const inputCls = 'w-full bg-[#192638] border border-[rgba(0,229,255,0.14)] rounded-[2px] px-3 py-2.5 text-[#e8f0f4] placeholder-[#4a6070] focus:outline-none focus:border-[#00b8cc] text-sm'

  if (value) {
    return (
      <div className="flex items-center gap-3 bg-[#192638] border border-[rgba(0,229,255,0.3)] rounded-[2px] px-3 py-2.5">
        <UserCheck size={15} className="text-[#00e5ff] flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{value.name}</p>
          <p className="text-gray-500 text-xs">{[value.phone, value.type === 'TALLERISTA' ? 'Tallerista' : 'Cliente'].filter(Boolean).join(' · ')}</p>
        </div>
        <button type="button" onClick={clear} className="text-gray-500 hover:text-red-400 transition flex-shrink-0">
          <X size={14} />
        </button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      {!creating ? (
        <>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={query}
              onChange={e => search(e.target.value)}
              onFocus={() => query && setOpen(true)}
              placeholder={placeholder}
              className={inputCls + ' pl-8 pr-3'}
            />
          </div>

          {open && (suggestions.length > 0 || query.trim()) && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#1e2d42] border border-[#253652] rounded-lg shadow-xl overflow-hidden">
              {suggestions.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onMouseDown={() => select(c)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#253652] transition text-left"
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${c.type === 'TALLERISTA' ? 'bg-purple-900/50 text-purple-300' : 'bg-blue-900/40 text-blue-300'}`}>
                    {c.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{c.name}</p>
                    <p className="text-gray-500 text-xs">{[c.phone, c.type === 'TALLERISTA' ? 'Tallerista' : 'Cliente'].filter(Boolean).join(' · ')}</p>
                  </div>
                </button>
              ))}
              {query.trim() && (
                <button
                  type="button"
                  onMouseDown={() => { setCreating(true); setNewName(query); setOpen(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-[#253652] transition text-left border-t border-[#253652] text-[#00e5ff]"
                >
                  <UserPlus size={14} />
                  <span className="text-sm">Crear cliente "<strong>{query}</strong>"</span>
                </button>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="bg-[#111c2e] border border-[rgba(0,229,255,0.2)] rounded-[2px] p-3 space-y-3">
          <p className="text-xs text-[#00e5ff] uppercase tracking-widest font-semibold">Nuevo cliente</p>
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Nombre *"
            className={inputCls}
            autoFocus
          />
          <input
            type="text"
            value={newPhone}
            onChange={e => setNewPhone(e.target.value)}
            placeholder="Teléfono (opcional)"
            className={inputCls}
          />
          <div className="flex gap-2">
            {(['TALLERISTA', 'CLIENTE'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setNewType(t)}
                className={`flex-1 py-1.5 rounded text-xs font-medium border transition ${newType === t ? (t === 'TALLERISTA' ? 'bg-purple-900/50 border-purple-600 text-purple-300' : 'bg-blue-900/40 border-blue-600 text-blue-300') : 'bg-[#192638] border-[#253652] text-gray-500'}`}
              >
                {t === 'TALLERISTA' ? 'Tallerista' : 'Particular'}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => { setCreating(false); setNewName(''); setNewPhone('') }} className="flex-1 py-1.5 text-xs text-gray-400 hover:text-white border border-[#253652] rounded transition">
              Cancelar
            </button>
            <button type="button" onClick={createClient} disabled={saving || !newName.trim()} className="flex-1 py-1.5 text-xs bg-[#00e5ff] text-black font-bold rounded disabled:opacity-50 transition hover:bg-[#00c8e0]">
              {saving ? 'Guardando...' : 'Crear y vincular'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
