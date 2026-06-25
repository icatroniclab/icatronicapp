'use client'
import { useState } from 'react'
import { Edit2, Save, X } from 'lucide-react'

interface Props {
  workOrderId: string
  motive: string
  notes: string | null
}

export function MotiveNotesEditor({ workOrderId, motive, notes }: Props) {
  const [editing, setEditing] = useState(false)
  const [motiveVal, setMotiveVal] = useState(motive)
  const [notesVal, setNotesVal] = useState(notes ?? '')
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    await fetch(`/api/ordenes/${workOrderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ motive: motiveVal, notes: notesVal }),
    })
    setSaving(false)
    setEditing(false)
  }

  function cancel() {
    setMotiveVal(motive)
    setNotesVal(notes ?? '')
    setEditing(false)
  }

  const inputClass = 'w-full bg-[#111c2e] border border-[rgba(0,229,255,0.2)] rounded-[2px] px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00e5ff] resize-none'

  return (
    <div className="bg-[#192638] border border-[rgba(0,229,255,0.1)] rounded-[2px] p-4 text-sm space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[#7a9aaa] text-xs uppercase tracking-widest">Motivo de ingreso y notas</p>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-[#7a9aaa] hover:text-[#00e5ff] transition text-xs">
            <Edit2 size={12} /> Editar
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="flex items-center gap-1 text-[#00e5ff] hover:text-white transition text-xs">
              <Save size={12} /> {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button onClick={cancel} className="flex items-center gap-1 text-[#7a9aaa] hover:text-white transition text-xs">
              <X size={12} /> Cancelar
            </button>
          </div>
        )}
      </div>

      <div>
        <p className="text-[#7a9aaa] text-xs mb-1">Motivo</p>
        {editing ? (
          <textarea
            className={inputClass}
            rows={2}
            value={motiveVal}
            onChange={e => setMotiveVal(e.target.value)}
            autoFocus
          />
        ) : (
          <p className="text-white">{motiveVal || <span className="text-[#7a9aaa] italic">Sin motivo</span>}</p>
        )}
      </div>

      <div>
        <p className="text-[#7a9aaa] text-xs mb-1">Notas</p>
        {editing ? (
          <textarea
            className={inputClass}
            rows={3}
            value={notesVal}
            onChange={e => setNotesVal(e.target.value)}
            placeholder="Observaciones adicionales..."
          />
        ) : (
          <p className="text-white whitespace-pre-wrap">
            {notesVal || <span className="text-[#7a9aaa] italic">Sin notas</span>}
          </p>
        )}
      </div>
    </div>
  )
}
