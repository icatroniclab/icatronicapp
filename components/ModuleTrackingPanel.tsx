'use client'
import { useState } from 'react'
import { Plus, Trash2, Upload, Zap, Target, BookOpen, Link as LinkIcon, CheckCircle, XCircle, AlertTriangle, FlaskConical } from 'lucide-react'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { Textarea } from './ui/Input'
import { parseDriveLink } from '@/lib/utils'
import { PhotoThumb } from './ui/PhotoThumb'

function formatEntryDate(iso: string) {
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm} ${hh}:${min}`
}

const PROTOCOLS = ['CAN', 'K-Line', 'LIN', 'OBD2 (ISO 15765)', 'ISO 9141', 'J1850 VPW', 'J1850 PWM', 'Ethernet', 'Otro', 'No detectado']
const MODULE_RESPONSES = [
  { value: 'OK',          label: 'Responde normalmente',   color: 'text-emerald-400' },
  { value: 'NO_RESPONSE', label: 'Sin respuesta',          color: 'text-red-400'     },
  { value: 'ERROR',       label: 'Responde con errores',   color: 'text-yellow-400'  },
  { value: 'SHORT',       label: 'Cortocircuito / fusible',color: 'text-red-500'     },
]
const FINAL_RESULTS = [
  { value: 'REPARADO',       label: 'Reparado',              color: 'bg-emerald-900/40 border-emerald-700 text-emerald-300' },
  { value: 'PROGRAMADO',     label: 'Programado',            color: 'bg-cyan-900/40 border-cyan-700 text-cyan-300'          },
  { value: 'SIN_FALLA',      label: 'Sin falla encontrada',  color: 'bg-blue-900/40 border-blue-700 text-blue-300'          },
  { value: 'NO_REPARABLE',   label: 'No reparable',          color: 'bg-red-900/40 border-red-700 text-red-300'             },
  { value: 'EN_PROCESO',     label: 'En proceso',            color: 'bg-yellow-900/40 border-yellow-700 text-yellow-300'    },
]

const emptyPhysical = { damage: false, corrosion: false, burnedComponents: false, connectorDamage: false, description: '' }
const emptyPin = { pin: '', tipo: 'V DC', medido: '', esperado: '', result: '' }
const PIN_TYPES = ['V DC', 'V AC', 'Ω', 'mA', 'Hz', 'PWM %']

export function ModuleTrackingPanel({ tracking: initialTracking, moduleJobId }: {
  tracking: any
  moduleJobId: string
}) {
  const [tracking, setTracking] = useState(initialTracking)
  const tid = tracking.id

  const inputCls  = 'w-full bg-[#111c2e] border border-[#253652] rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-[#00e5ff]'
  const selectCls = 'w-full bg-[#111c2e] border border-[#253652] rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-[#00e5ff]'
  const labelCls  = 'text-xs text-gray-400 mb-1 block'

  // ── Inspección física ──────────────────────────────────────
  const [physical, setPhysical] = useState<any>(() =>
    tracking.physicalInspection ? JSON.parse(tracking.physicalInspection) : emptyPhysical
  )
  const [savingPhysical, setSavingPhysical] = useState(false)
  async function savePhysical() {
    setSavingPhysical(true)
    await patch({ physicalInspection: JSON.stringify(physical) })
    setSavingPhysical(false)
  }

  // ── Alimentación en banco ──────────────────────────────────
  const [supply, setSupply] = useState({
    supplyVoltage: tracking.supplyVoltage || '',
    currentDraw:   tracking.currentDraw   || '',
    moduleResponse: tracking.moduleResponse || '',
  })
  const [savingSupply, setSavingSupply] = useState(false)
  async function saveSupply() {
    setSavingSupply(true)
    await patch(supply)
    setSavingSupply(false)
  }

  // ── Protocolo y comunicación ──────────────────────────────
  const [comm, setComm] = useState({
    protocol:         tracking.protocol         || '',
    scannerConnected: tracking.scannerConnected || '',
    softwareVersion:  tracking.softwareVersion  || '',
    partNumber:       tracking.partNumber       || '',
  })
  const [savingComm, setSavingComm] = useState(false)
  async function saveComm() {
    setSavingComm(true)
    await patch(comm)
    setSavingComm(false)
  }

  // ── DTC ───────────────────────────────────────────────────
  const [dtcCodes, setDtcCodes] = useState<any[]>(tracking.dtcCodes || [])
  const [newDtc, setNewDtc]     = useState({ code: '', description: '' })
  const [addingDtc, setAddingDtc] = useState(false)
  async function addDtc() {
    if (!newDtc.code.trim()) return
    setAddingDtc(true)
    const res = await fetch(`/api/modulos/tracking/${tid}/dtc`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newDtc),
    })
    if (res.ok) { const d = await res.json(); setDtcCodes(p => [...p, d]) }
    setNewDtc({ code: '', description: '' })
    setAddingDtc(false)
  }
  async function removeDtc(dtcId: string) {
    await fetch(`/api/modulos/tracking/${tid}/dtc`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dtcId }),
    })
    setDtcCodes(p => p.filter(d => d.id !== dtcId))
  }

  // ── Mediciones en pines ───────────────────────────────────
  const [pins, setPins] = useState<any[]>(() =>
    tracking.pinMeasurements ? JSON.parse(tracking.pinMeasurements) : []
  )
  const [savingPins, setSavingPins] = useState(false)
  function updatePin(i: number, field: string, val: string) {
    setPins(p => p.map((row, idx) => idx === i ? { ...row, [field]: val } : row))
  }
  function addPin() { setPins(p => [...p, { ...emptyPin }]) }
  function removePin(i: number) { setPins(p => p.filter((_, idx) => idx !== i)) }
  async function savePins() {
    setSavingPins(true)
    await patch({ pinMeasurements: JSON.stringify(pins) })
    setSavingPins(false)
  }

  // ── Causa raíz ────────────────────────────────────────────
  const [rootCause, setRootCause]           = useState(tracking.rootCause || '')
  const [savingRootCause, setSavingRootCause] = useState(false)
  async function saveRootCause() {
    setSavingRootCause(true)
    await patch({ rootCause })
    setSavingRootCause(false)
  }

  // ── Resultado final ───────────────────────────────────────
  const [finalResult, setFinalResult]         = useState(tracking.finalResult || '')
  const [savingResult, setSavingResult]       = useState(false)
  async function saveFinalResult(val: string) {
    setFinalResult(val)
    setSavingResult(true)
    await patch({ finalResult: val })
    setSavingResult(false)
  }

  // ── Bitácora ──────────────────────────────────────────────
  const [logEntries, setLogEntries] = useState<any[]>(tracking.diagnosticLog || [])
  const [newLogText, setNewLogText] = useState('')
  const [addingLog, setAddingLog]   = useState(false)
  async function addLogEntry() {
    if (!newLogText.trim()) return
    setAddingLog(true)
    const res = await fetch(`/api/modulos/tracking/${tid}/log`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newLogText.trim() }),
    })
    if (res.ok) { const e = await res.json(); setLogEntries(p => [...p, e]); setNewLogText('') }
    setAddingLog(false)
  }
  async function removeLogEntry(entryId: string) {
    await fetch(`/api/modulos/tracking/${tid}/log`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entryId }),
    })
    setLogEntries(p => p.filter(e => e.id !== entryId))
  }

  // ── Fotos ─────────────────────────────────────────────────
  const [photos, setPhotos] = useState<string[]>(() => tracking.photos ? JSON.parse(tracking.photos) : [])
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [driveInput, setDriveInput] = useState('')
  async function uploadPhotos(files: FileList) {
    setUploadingPhotos(true)
    const urls = [...photos]
    for (const file of Array.from(files)) {
      const fd = new FormData(); fd.append('file', file); fd.append('folder', 'modulos')
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const d = await res.json()
      if (d.url) urls.push(d.url)
    }
    await patch({ photos: urls })
    setPhotos(urls)
    setUploadingPhotos(false)
  }
  async function removePhoto(i: number) {
    const updated = photos.filter((_, idx) => idx !== i)
    await patch({ photos: updated })
    setPhotos(updated)
  }
  async function addDrivePhoto() {
    const url = parseDriveLink(driveInput)
    if (!url) { alert('Link de Drive inválido.'); return }
    const updated = [...photos, url]
    await patch({ photos: updated })
    setPhotos(updated)
    setDriveInput('')
  }

  // ── Notas ─────────────────────────────────────────────────
  const [notes, setNotes]         = useState(tracking.notes || '')
  const [savingNotes, setSavingNotes] = useState(false)
  async function saveNotes() {
    setSavingNotes(true)
    await patch({ notes })
    setSavingNotes(false)
  }

  // ── helper ────────────────────────────────────────────────
  async function patch(data: any) {
    await fetch(`/api/modulos/tracking/${tid}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    })
  }

  return (
    <div className="space-y-4">

      {/* 1. Inspección física */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={16} className="text-yellow-400" />
          <h3 className="font-semibold text-white">Inspección física</h3>
        </div>
        <div className="flex flex-wrap gap-3 mb-3">
          {[
            { key: 'damage',           label: 'Daño físico'          },
            { key: 'corrosion',        label: 'Corrosión / humedad'  },
            { key: 'burnedComponents', label: 'Componentes quemados' },
            { key: 'connectorDamage',  label: 'Conectores dañados'   },
          ].map(({ key, label }) => (
            <label key={key} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition text-sm ${physical[key] ? 'bg-red-900/30 border-red-700 text-red-300' : 'bg-[#111c2e] border-[#253652] text-gray-400 hover:border-gray-500'}`}>
              <input type="checkbox" className="hidden" checked={!!physical[key]} onChange={e => setPhysical((p: any) => ({ ...p, [key]: e.target.checked }))} />
              {physical[key] ? <XCircle size={13} /> : <CheckCircle size={13} className="text-gray-600" />}
              {label}
            </label>
          ))}
        </div>
        <div>
          <label className={labelCls}>Descripción del estado físico</label>
          <input
            type="text"
            value={physical.description}
            onChange={e => setPhysical((p: any) => ({ ...p, description: e.target.value }))}
            placeholder="Ej: Capa de humedad en zona de cristales, conector C1 oxidado..."
            className={inputCls}
          />
        </div>
        <div className="flex justify-end mt-3">
          <Button size="sm" variant="secondary" onClick={savePhysical} disabled={savingPhysical}>
            {savingPhysical ? 'Guardando...' : 'Guardar inspección'}
          </Button>
        </div>
      </Card>

      {/* 2. Prueba de alimentación en banco */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Zap size={16} className="text-yellow-400" />
          <h3 className="font-semibold text-white">Prueba de alimentación en banco</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
          <div>
            <label className={labelCls}>Tensión aplicada (V)</label>
            <input type="number" step="0.01" value={supply.supplyVoltage} onChange={e => setSupply(p => ({ ...p, supplyVoltage: e.target.value }))} placeholder="12.0" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Consumo de corriente (mA)</label>
            <input type="number" step="1" value={supply.currentDraw} onChange={e => setSupply(p => ({ ...p, currentDraw: e.target.value }))} placeholder="350" className={inputCls} />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className={labelCls}>Respuesta del módulo</label>
            <select value={supply.moduleResponse} onChange={e => setSupply(p => ({ ...p, moduleResponse: e.target.value }))} className={selectCls}>
              <option value="">— Sin probar —</option>
              {MODULE_RESPONSES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
        </div>
        {supply.moduleResponse && (
          <p className={`text-sm font-medium mb-2 ${MODULE_RESPONSES.find(r => r.value === supply.moduleResponse)?.color}`}>
            {MODULE_RESPONSES.find(r => r.value === supply.moduleResponse)?.label}
          </p>
        )}
        <div className="flex justify-end">
          <Button size="sm" variant="secondary" onClick={saveSupply} disabled={savingSupply}>
            {savingSupply ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </Card>

      {/* 3. Protocolo y comunicación */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <FlaskConical size={16} className="text-cyan-400" />
          <h3 className="font-semibold text-white">Protocolo y comunicación</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className={labelCls}>Protocolo detectado</label>
            <select value={comm.protocol} onChange={e => setComm(p => ({ ...p, protocol: e.target.value }))} className={selectCls}>
              <option value="">— Sin determinar —</option>
              {PROTOCOLS.map(pr => <option key={pr} value={pr}>{pr}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Conectó con escáner</label>
            <div className="flex gap-2 mt-1">
              {[{ v: 'SI', label: 'Sí' }, { v: 'NO', label: 'No' }].map(({ v, label }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setComm(p => ({ ...p, scannerConnected: p.scannerConnected === v ? '' : v }))}
                  className={`flex-1 py-1.5 rounded-lg border text-sm font-medium transition ${comm.scannerConnected === v ? (v === 'SI' ? 'bg-emerald-900/40 border-emerald-600 text-emerald-300' : 'bg-red-900/40 border-red-600 text-red-300') : 'bg-[#111c2e] border-[#253652] text-gray-500 hover:border-gray-500'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>Versión de software / firmware</label>
            <input type="text" value={comm.softwareVersion} onChange={e => setComm(p => ({ ...p, softwareVersion: e.target.value }))} placeholder="Ej: SW 0150 / HW 0020" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Número de parte (Part Number)</label>
            <input type="text" value={comm.partNumber} onChange={e => setComm(p => ({ ...p, partNumber: e.target.value }))} placeholder="Ej: 0281013126" className={inputCls} />
          </div>
        </div>
        <div className="flex justify-end">
          <Button size="sm" variant="secondary" onClick={saveComm} disabled={savingComm}>
            {savingComm ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </Card>

      {/* 4. Códigos DTC */}
      <Card>
        <h3 className="font-semibold text-white mb-3">Códigos DTC</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {dtcCodes.map((d: any) => (
            <div key={d.id} className="flex items-center gap-1.5 bg-blue-900/30 border border-blue-800/40 rounded-lg px-2.5 py-1">
              <span className="text-blue-300 text-sm font-mono font-bold">{d.code}</span>
              {d.description && <span className="text-gray-400 text-xs">— {d.description}</span>}
              <button onClick={() => removeDtc(d.id)} className="text-gray-500 hover:text-red-400 ml-1"><Trash2 size={12} /></button>
            </div>
          ))}
          {dtcCodes.length === 0 && <p className="text-gray-500 text-sm">Sin códigos DTC</p>}
        </div>
        <div className="flex gap-2">
          <input
            value={newDtc.code}
            onChange={e => setNewDtc(p => ({ ...p, code: e.target.value.toUpperCase() }))}
            onKeyDown={e => e.key === 'Enter' && addDtc()}
            placeholder="P0300"
            className="w-24 bg-[#111c2e] border border-[#253652] rounded-lg px-2 py-1.5 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
          />
          <input
            value={newDtc.description}
            onChange={e => setNewDtc(p => ({ ...p, description: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && addDtc()}
            placeholder="Descripción (opcional)"
            className="flex-1 bg-[#111c2e] border border-[#253652] rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
          />
          <Button size="sm" onClick={addDtc} disabled={addingDtc}><Plus size={14} /></Button>
        </div>
      </Card>

      {/* 5. Mediciones en pines */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white">Mediciones en pines</h3>
          <Button size="sm" variant="secondary" onClick={addPin}><Plus size={13} /> Agregar fila</Button>
        </div>
        {pins.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-3">Sin mediciones. Agregá una fila para registrar lecturas en pines o puntos de prueba.</p>
        )}
        {pins.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs border-b border-[#253652]">
                  <th className="text-left pb-2 pr-2">Pin / Punto de prueba</th>
                  <th className="text-left pb-2 pr-2 w-24">Tipo</th>
                  <th className="text-left pb-2 pr-2 w-28">Medido</th>
                  <th className="text-left pb-2 pr-2 w-28">Esperado</th>
                  <th className="text-left pb-2 pr-2 w-24">Resultado</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="space-y-1">
                {pins.map((row: any, i: number) => (
                  <tr key={i} className="border-b border-[#1e2d42]">
                    <td className="py-1 pr-2">
                      <input value={row.pin} onChange={e => updatePin(i, 'pin', e.target.value)} placeholder="Ej: Pin 18 / +12V alimentación" className={inputCls} />
                    </td>
                    <td className="py-1 pr-2">
                      <select value={row.tipo} onChange={e => updatePin(i, 'tipo', e.target.value)} className={selectCls}>
                        {PIN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </td>
                    <td className="py-1 pr-2">
                      <input value={row.medido} onChange={e => updatePin(i, 'medido', e.target.value)} placeholder="0.00" className={inputCls} />
                    </td>
                    <td className="py-1 pr-2">
                      <input value={row.esperado} onChange={e => updatePin(i, 'esperado', e.target.value)} placeholder="12.0" className={inputCls} />
                    </td>
                    <td className="py-1 pr-2">
                      <select value={row.result} onChange={e => updatePin(i, 'result', e.target.value)} className={selectCls}>
                        <option value="">—</option>
                        <option value="OK">OK</option>
                        <option value="FALLA">FALLA</option>
                        <option value="DUDOSO">Dudoso</option>
                      </select>
                    </td>
                    <td className="py-1">
                      <button onClick={() => removePin(i)} className="text-gray-600 hover:text-red-400"><Trash2 size={13} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pins.length > 0 && (
          <div className="flex justify-end mt-3">
            <Button size="sm" variant="secondary" onClick={savePins} disabled={savingPins}>
              {savingPins ? 'Guardando...' : 'Guardar mediciones'}
            </Button>
          </div>
        )}
      </Card>

      {/* 6. Causa raíz */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Target size={16} className="text-emerald-400" />
          <h3 className="font-semibold text-white">Causa raíz confirmada</h3>
        </div>
        <Textarea rows={3} value={rootCause} onChange={e => setRootCause(e.target.value)} placeholder="Ej: MOSFET de regulación de 5V en falla, condensador C12 abierto, firmware corrupto en zona de calibración..." />
        <div className="flex justify-end mt-2">
          <Button size="sm" variant="secondary" onClick={saveRootCause} disabled={savingRootCause}>
            {savingRootCause ? 'Guardando...' : 'Guardar diagnóstico'}
          </Button>
        </div>
      </Card>

      {/* 7. Resultado final */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle size={16} className="text-blue-400" />
          <h3 className="font-semibold text-white">Resultado final</h3>
          {savingResult && <span className="text-xs text-gray-500">Guardando...</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          {FINAL_RESULTS.map(r => (
            <button
              key={r.value}
              type="button"
              onClick={() => saveFinalResult(finalResult === r.value ? '' : r.value)}
              className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition ${finalResult === r.value ? r.color : 'bg-[#111c2e] border-[#253652] text-gray-500 hover:border-gray-500 hover:text-gray-300'}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </Card>

      {/* 8. Bitácora */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={16} className="text-purple-400" />
          <h3 className="font-semibold text-white">Bitácora de diagnóstico</h3>
        </div>
        {logEntries.length > 0 && (
          <div className="space-y-2 mb-4">
            {logEntries.map((entry: any) => (
              <div key={entry.id} className="flex gap-3 group">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
                  <div className="w-px flex-1 bg-[#253652] mt-1" />
                </div>
                <div className="flex-1 pb-2">
                  <p className="text-gray-200 text-sm">{entry.text}</p>
                  <p className="text-gray-600 text-xs mt-0.5">{formatEntryDate(entry.createdAt)}</p>
                </div>
                <button onClick={() => removeLogEntry(entry.id)} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition mt-0.5">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            value={newLogText}
            onChange={e => setNewLogText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), addLogEntry())}
            placeholder="Ej: Se midió tensión en pin 18: 4.8V OK — Se reemplazó condensador C12..."
            className="flex-1 bg-[#111c2e] border border-[#253652] rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-purple-500"
          />
          <Button size="sm" onClick={addLogEntry} disabled={addingLog || !newLogText.trim()}>
            <Plus size={14} />
          </Button>
        </div>
        <p className="text-gray-600 text-xs mt-1.5">Enter para agregar</p>
      </Card>

      {/* 9. Fotos del proceso */}
      <Card>
        <h3 className="font-semibold text-white mb-3">Fotos del proceso</h3>
        <label className="flex items-center gap-3 p-3 border border-dashed border-[#253652] rounded-lg cursor-pointer hover:border-[#00e5ff]/40 transition mb-3">
          <Upload size={16} className="text-gray-400" />
          <span className="text-gray-400 text-sm">{uploadingPhotos ? 'Subiendo...' : 'Agregar fotos'}</span>
          <input type="file" multiple accept="image/*" className="hidden" disabled={uploadingPhotos} onChange={e => e.target.files && uploadPhotos(e.target.files)} />
        </label>
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <LinkIcon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input type="text" value={driveInput} onChange={e => setDriveInput(e.target.value)} placeholder="Pegar link de Google Drive o Google Fotos..." className="w-full bg-[#111c2e] border border-[#253652] rounded-lg pl-8 pr-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500 placeholder-gray-600" />
          </div>
          <button type="button" onClick={addDrivePhoto} className="px-3 py-1.5 bg-[#253652] hover:bg-[#2e4565] text-gray-300 text-sm rounded-lg transition">Agregar</button>
        </div>
        {photos.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {photos.map((url, i) => (
              <PhotoThumb key={i} url={url} onRemove={() => removePhoto(i)} />
            ))}
          </div>
        )}
      </Card>

      {/* 10. Notas internas */}
      <Card>
        <h3 className="font-semibold text-white mb-3">Notas internas</h3>
        <Textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas del técnico, referencias de reparación, observaciones..." />
        <Button size="sm" variant="secondary" className="mt-2" onClick={saveNotes} disabled={savingNotes}>
          {savingNotes ? 'Guardando...' : 'Guardar'}
        </Button>
      </Card>

    </div>
  )
}
