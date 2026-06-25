'use client'
import { useState } from 'react'
import { Edit2, Save, X } from 'lucide-react'

interface Props {
  moduleJobId: string
  motive: string
  findings: string
  workDone: string
  notes: string
}

export function ModuleNotesEditor({ moduleJobId, motive, findings, workDone, notes }: Props) {
  const [editing, setEditing] = useState(false)
  const [vals, setVals] = useState({ motive, findings, workDone, notes })
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    await fetch(`/api/modulos/${moduleJobId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vals),
    })
    setSaving(false)
    setEditing(false)
  }

  function cancel() {
    setVals({ motive, findings, workDone, notes })
    setEditing(false)
  }

  const inputClass = 'w-full bg-[#111c2e] border border-[rgba(0,229,255,0.2)] rounded-[2px] px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00e5ff] resize-none'
  const labelClass = 'text-[#7a9aaa] text-xs mb-1 block'

  const fields = [
    { key: 'motive',   label: 'Motivo de ingreso', rows: 2 },
    { key: 'findings', label: 'Hallazgos / Diagnóstico', rows: 3 },
    { key: 'workDone', label: 'Trabajo realizado', rows: 3 },
    { key: 'notes',    label: 'Notas', rows: 2 },
  ] as const

  return (
    <div className="bg-[#192638] border border-[rgba(0,229,255,0.1)] rounded-[2px] p-4 text-sm space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[#7a9aaa] text-xs uppercase tracking-widest">Información técnica</p>
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

      <div className="grid sm:grid-cols-2 gap-4">
        {fields.map(({ key, label, rows }) => (
          <div key={key}>
            <label className={labelClass}>{label}</label>
            {editing ? (
              <textarea
                className={inputClass}
                rows={rows}
                value={vals[key]}
                onChange={e => setVals(v => ({ ...v, [key]: e.target.value }))}
              />
            ) : (
              <p className="text-white whitespace-pre-wrap">
                {vals[key] || <span className="text-[#7a9aaa] italic">—</span>}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
