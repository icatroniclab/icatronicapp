'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Upload, FileText, Zap, Cpu, Target, BookOpen, Link as LinkIcon } from 'lucide-react'
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

const MODULES = ['ECU', 'ABS', 'TCU/Caja', 'Airbag', 'BCM', 'Climatizador', 'Inmovilizador', 'Dirección', 'Suspensión', 'Gateway', 'Carrocería', 'Tablero', 'Iluminación']

const TRANSPONDER_OPTIONS = ['OK - Reconocido', 'No reconoce', 'Sin llave', 'No aplica']
const BATTERY_ANALYZER_OPTIONS = ['Buena', 'Cargue y pruebe', 'Reemplace', 'Defectuosa', 'Cargando']

const emptyMeasurements = {
  batteryRest: '', batteryLoad: '', batteryStart: '',
  alternator: '', ground: '',
  transponder: '', batteryAnalyzerState: '', batteryCcaMeasured: '', batteryCcaNominal: '',
}

export function TrackingPanel({ tracking, workOrderId, products }: {
  tracking: any
  workOrderId: string
  products: any[]
}) {
  const router = useRouter()

  // DTC
  const [newDtc, setNewDtc] = useState({ code: '', description: '' })
  const [addingDtc, setAddingDtc] = useState(false)

  // Scanner
  const [scannerReport, setScannerReport] = useState(tracking.scannerReport || '')
  const [notes, setNotes] = useState(tracking.notes || '')
  const [savingReport, setSavingReport] = useState(false)
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [driveInput, setDriveInput] = useState('')
  const photos: string[] = tracking.photos ? JSON.parse(tracking.photos) : []

  // Mediciones
  const [measurements, setMeasurements] = useState<any>(() =>
    tracking.measurements ? JSON.parse(tracking.measurements) : emptyMeasurements
  )
  const [savingMeasurements, setSavingMeasurements] = useState(false)

  // Módulos
  const [scannedModules, setScannedModules] = useState<string[]>(() =>
    tracking.scannedModules ? JSON.parse(tracking.scannedModules) : []
  )
  const [savingModules, setSavingModules] = useState(false)

  // Causa raíz
  const [rootCause, setRootCause] = useState(tracking.rootCause || '')
  const [savingRootCause, setSavingRootCause] = useState(false)

  // Bitácora
  const [logEntries, setLogEntries] = useState<any[]>(tracking.diagnosticLog || [])
  const [newLogText, setNewLogText] = useState('')
  const [addingLog, setAddingLog] = useState(false)

  const setM = (k: string, v: string) => setMeasurements((m: any) => ({ ...m, [k]: v }))

  async function addDtc() {
    if (!newDtc.code.trim()) return
    setAddingDtc(true)
    await fetch(`/api/tracking/${tracking.id}/dtc`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newDtc),
    })
    setNewDtc({ code: '', description: '' })
    setAddingDtc(false)
    router.refresh()
  }

  async function removeDtc(dtcId: string) {
    await fetch(`/api/tracking/${tracking.id}/dtc`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dtcId }),
    })
    router.refresh()
  }

  async function saveReport() {
    setSavingReport(true)
    await fetch(`/api/tracking/${tracking.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scannerReport, notes }),
    })
    setSavingReport(false)
  }

  async function uploadPdf(file: File) {
    setUploadingPdf(true)
    const fd = new FormData(); fd.append('file', file); fd.append('folder', 'scanner')
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const data = await res.json()
    if (data.url) {
      await fetch(`/api/tracking/${tracking.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scannerPdf: data.url }),
      })
      router.refresh()
    }
    setUploadingPdf(false)
  }

  async function uploadPhotos(files: FileList) {
    setUploadingPhotos(true)
    const urls: string[] = [...photos]
    for (const file of Array.from(files)) {
      const fd = new FormData(); fd.append('file', file); fd.append('folder', 'proceso')
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const d = await res.json()
      if (d.url) urls.push(d.url)
    }
    await fetch(`/api/tracking/${tracking.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photos: urls }),
    })
    setUploadingPhotos(false)
    router.refresh()
  }

  async function saveMeasurements() {
    setSavingMeasurements(true)
    await fetch(`/api/tracking/${tracking.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ measurements }),
    })
    setSavingMeasurements(false)
  }

  async function toggleModule(mod: string) {
    const updated = scannedModules.includes(mod)
      ? scannedModules.filter(m => m !== mod)
      : [...scannedModules, mod]
    setScannedModules(updated)
    setSavingModules(true)
    await fetch(`/api/tracking/${tracking.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scannedModules: updated }),
    })
    setSavingModules(false)
  }

  async function saveRootCause() {
    setSavingRootCause(true)
    await fetch(`/api/tracking/${tracking.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rootCause }),
    })
    setSavingRootCause(false)
  }

  async function addLogEntry() {
    if (!newLogText.trim()) return
    setAddingLog(true)
    const res = await fetch(`/api/tracking/${tracking.id}/log`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newLogText.trim() }),
    })
    if (res.ok) {
      const entry = await res.json()
      setLogEntries(prev => [...prev, entry])
      setNewLogText('')
    }
    setAddingLog(false)
  }

  async function removeLogEntry(entryId: string) {
    await fetch(`/api/tracking/${tracking.id}/log`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entryId }),
    })
    setLogEntries(prev => prev.filter(e => e.id !== entryId))
  }

  const inputCls = 'w-full bg-[#111c2e] border border-[#253652] rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500'
  const selectCls = 'w-full bg-[#111c2e] border border-[#253652] rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500'
  const labelCls = 'text-xs text-gray-400 mb-1 block'

  return (
    <div className="space-y-4">

      {/* Mediciones eléctricas */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Zap size={16} className="text-yellow-400" />
          <h3 className="font-semibold text-white">Mediciones eléctricas</h3>
        </div>

        <div className="space-y-4">
          {/* Batería */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Voltaje de batería (V)</p>
            <div className="grid grid-cols-3 gap-2">
              <div><label className={labelCls}>Reposo</label><input type="number" step="0.01" value={measurements.batteryRest} onChange={e => setM('batteryRest', e.target.value)} placeholder="12.6" className={inputCls} /></div>
              <div><label className={labelCls}>Con motor</label><input type="number" step="0.01" value={measurements.batteryLoad} onChange={e => setM('batteryLoad', e.target.value)} placeholder="14.2" className={inputCls} /></div>
              <div><label className={labelCls}>Arranque</label><input type="number" step="0.01" value={measurements.batteryStart} onChange={e => setM('batteryStart', e.target.value)} placeholder="10.5" className={inputCls} /></div>
            </div>
          </div>

          {/* Alternador y tierra */}
          <div className="grid grid-cols-2 gap-2">
            <div><label className={labelCls}>Voltaje alternador (V)</label><input type="number" step="0.01" value={measurements.alternator} onChange={e => setM('alternator', e.target.value)} placeholder="14.4" className={inputCls} /></div>
            <div><label className={labelCls}>Resistencia de tierra (Ω)</label><input type="number" step="0.001" value={measurements.ground} onChange={e => setM('ground', e.target.value)} placeholder="0.01" className={inputCls} /></div>
          </div>

          {/* Analizador de batería */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Analizador de batería</p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className={labelCls}>Estado</label>
                <select value={measurements.batteryAnalyzerState} onChange={e => setM('batteryAnalyzerState', e.target.value)} className={selectCls}>
                  <option value="">— Sin medir —</option>
                  {BATTERY_ANALYZER_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div><label className={labelCls}>CCA medido</label><input type="number" value={measurements.batteryCcaMeasured} onChange={e => setM('batteryCcaMeasured', e.target.value)} placeholder="450" className={inputCls} /></div>
              <div><label className={labelCls}>CCA nominal</label><input type="number" value={measurements.batteryCcaNominal} onChange={e => setM('batteryCcaNominal', e.target.value)} placeholder="600" className={inputCls} /></div>
            </div>
          </div>

          {/* Transponder */}
          <div>
            <label className={labelCls}>Reconocimiento de transponder</label>
            <select value={measurements.transponder} onChange={e => setM('transponder', e.target.value)} className={selectCls}>
              <option value="">— Sin verificar —</option>
              {TRANSPONDER_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <Button size="sm" variant="secondary" onClick={saveMeasurements} disabled={savingMeasurements}>
            {savingMeasurements ? 'Guardando...' : 'Guardar mediciones'}
          </Button>
        </div>
      </Card>

      {/* Módulos escaneados */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Cpu size={16} className="text-blue-400" />
            <h3 className="font-semibold text-white">Módulos escaneados</h3>
          </div>
          {savingModules && <span className="text-xs text-gray-500">Guardando...</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          {MODULES.map(mod => {
            const active = scannedModules.includes(mod)
            return (
              <button
                key={mod}
                type="button"
                onClick={() => toggleModule(mod)}
                className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition ${active ? 'bg-blue-900/40 border-blue-600 text-blue-300' : 'bg-[#111c2e] border-[#253652] text-gray-500 hover:border-gray-500 hover:text-gray-300'}`}
              >
                {mod}
              </button>
            )
          })}
        </div>
      </Card>

      {/* DTC */}
      <Card>
        <h3 className="font-semibold text-white mb-3">Códigos DTC</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {tracking.dtcCodes.map((d: any) => (
            <div key={d.id} className="flex items-center gap-1.5 bg-blue-900/30 border border-blue-800/40 rounded-lg px-2.5 py-1">
              <span className="text-blue-300 text-sm font-mono font-bold">{d.code}</span>
              {d.description && <span className="text-gray-400 text-xs">— {d.description}</span>}
              <button onClick={() => removeDtc(d.id)} className="text-gray-500 hover:text-red-400 ml-1"><Trash2 size={12} /></button>
            </div>
          ))}
          {tracking.dtcCodes.length === 0 && <p className="text-gray-500 text-sm">Sin códigos DTC</p>}
        </div>
        <div className="flex gap-2">
          <input value={newDtc.code} onChange={e => setNewDtc(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="P0300" className="w-24 bg-[#111c2e] border border-[#253652] rounded-lg px-2 py-1.5 text-white font-mono text-sm focus:outline-none focus:border-blue-500" />
          <input value={newDtc.description} onChange={e => setNewDtc(p => ({ ...p, description: e.target.value }))} placeholder="Descripción (opcional)" className="flex-1 bg-[#111c2e] border border-[#253652] rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500" />
          <Button size="sm" onClick={addDtc} disabled={addingDtc}><Plus size={14} /></Button>
        </div>
      </Card>

      {/* Causa raíz */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Target size={16} className="text-emerald-400" />
          <h3 className="font-semibold text-white">Causa raíz confirmada</h3>
        </div>
        <Textarea rows={3} value={rootCause} onChange={e => setRootCause(e.target.value)} placeholder="Ej: Sensor MAP defectuoso, masa suelta en chasis, inyector N°3 obstruido..." />
        <div className="flex justify-end mt-2">
          <Button size="sm" variant="secondary" onClick={saveRootCause} disabled={savingRootCause}>
            {savingRootCause ? 'Guardando...' : 'Guardar diagnóstico'}
          </Button>
        </div>
      </Card>

      {/* Informe escáner */}
      <Card>
        <h3 className="font-semibold text-white mb-3">Informe del escáner</h3>
        <Textarea rows={5} value={scannerReport} onChange={e => setScannerReport(e.target.value)} placeholder="Pegar el reporte del escáner aquí..." />
        <div className="flex items-center gap-2 mt-3">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-400 hover:text-white transition">
            <Upload size={14} />
            {uploadingPdf ? 'Subiendo...' : 'Adjuntar PDF'}
            <input type="file" accept=".pdf" className="hidden" disabled={uploadingPdf} onChange={e => e.target.files?.[0] && uploadPdf(e.target.files[0])} />
          </label>
          {tracking.scannerPdf && (
            <a href={tracking.scannerPdf} target="_blank" rel="noopener" className="flex items-center gap-1 text-blue-400 text-sm hover:underline">
              <FileText size={14} /> Ver PDF adjunto
            </a>
          )}
          <div className="flex-1" />
          <Button size="sm" variant="secondary" onClick={saveReport} disabled={savingReport}>
            {savingReport ? 'Guardando...' : 'Guardar informe'}
          </Button>
        </div>
      </Card>

      {/* Bitácora de diagnóstico */}
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
                  <p className="text-gray-600 text-xs mt-0.5">
                    {formatEntryDate(entry.createdAt)}
                  </p>
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
            placeholder="Ej: Se midió tensión en TPS: 0.8V — Se realizó prueba de inyectores..."
            className="flex-1 bg-[#111c2e] border border-[#253652] rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-purple-500"
          />
          <Button size="sm" onClick={addLogEntry} disabled={addingLog || !newLogText.trim()}>
            <Plus size={14} />
          </Button>
        </div>
        <p className="text-gray-600 text-xs mt-1.5">Enter para agregar</p>
      </Card>

      {/* Fotos del proceso */}
      <Card>
        <h3 className="font-semibold text-white mb-3">Fotos del proceso</h3>
        <label className="flex items-center gap-3 p-3 border border-dashed border-[#253652] rounded-lg cursor-pointer hover:border-blue-500 transition mb-3">
          <Upload size={16} className="text-gray-400" />
          <span className="text-gray-400 text-sm">{uploadingPhotos ? 'Subiendo...' : 'Agregar fotos'}</span>
          <input type="file" multiple accept="image/*,video/*" className="hidden" disabled={uploadingPhotos} onChange={e => e.target.files && uploadPhotos(e.target.files)} />
        </label>
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <LinkIcon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={driveInput}
              onChange={e => setDriveInput(e.target.value)}
              placeholder="Pegar link de Google Drive o Google Fotos..."
              className="w-full bg-[#111c2e] border border-[#253652] rounded-lg pl-8 pr-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500 placeholder-gray-600"
            />
          </div>
          <button
            type="button"
            onClick={async () => {
              const url = parseDriveLink(driveInput)
              if (!url) { alert('Link de Drive inválido.'); return }
              const newPhotos = [...photos, url]
              await fetch(`/api/tracking/${tracking.id}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ photos: newPhotos }),
              })
              setDriveInput('')
              router.refresh()
            }}
            className="px-3 py-1.5 bg-[#253652] hover:bg-[#2e4565] text-gray-300 text-sm rounded-lg transition"
          >
            Agregar
          </button>
        </div>
        {photos.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {photos.map((url, i) => (
              <PhotoThumb
                key={i}
                url={url}
                onRemove={async () => {
                  const updated = photos.filter((_, j) => j !== i)
                  await fetch(`/api/tracking/${tracking.id}`, {
                    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ photos: updated }),
                  })
                  router.refresh()
                }}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Notas internas */}
      <Card>
        <h3 className="font-semibold text-white mb-3">Notas internas</h3>
        <Textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas del técnico..." />
        <Button size="sm" variant="secondary" className="mt-2" onClick={saveReport} disabled={savingReport}>Guardar</Button>
      </Card>

    </div>
  )
}
