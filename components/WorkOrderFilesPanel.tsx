'use client'
import { useState, useRef, useEffect } from 'react'
import { FileText, FileSpreadsheet, Upload, Trash2, Download, Eye, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface FileEntry {
  url: string
  name: string
}

interface Props {
  workOrderId: string
  initialReports: FileEntry[]
  initialCsvLogs: FileEntry[]
}

function PdfModal({ url, name, onClose }: { url: string; name: string; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700 shrink-0">
        <span className="text-sm text-white font-medium truncate max-w-lg">{name}</span>
        <div className="flex items-center gap-3">
          <a
            href={url}
            download={name}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition"
          >
            <Download size={14} /> Descargar
          </a>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X size={18} />
          </button>
        </div>
      </div>
      <iframe
        src={url}
        title={name}
        className="flex-1 w-full border-0"
      />
    </div>
  )
}

function parseCsv(text: string): string[][] {
  return text
    .trim()
    .split('\n')
    .map(row => row.split(',').map(cell => cell.trim().replace(/^"|"$/g, '')))
}

function CsvPreview({ url, name }: { url: string; name: string }) {
  const [rows, setRows] = useState<string[][] | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    if (rows) { setOpen(o => !o); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error('No se pudo cargar')
      const text = await res.text()
      setRows(parseCsv(text))
      setOpen(true)
    } catch {
      setError('No se pudo cargar el archivo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={load}
        disabled={loading}
        className="flex items-center gap-1 text-xs text-[#00e5ff] hover:text-cyan-300 transition"
      >
        <Eye size={12} />
        {loading ? 'Cargando...' : open ? 'Ocultar' : 'Vista previa'}
        {rows && (open ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
      </button>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      {open && rows && (
        <div className="mt-2 overflow-x-auto max-h-64 overflow-y-auto rounded border border-gray-700">
          <table className="text-xs min-w-full">
            <thead className="sticky top-0 bg-gray-900">
              <tr>
                {rows[0]?.map((cell, i) => (
                  <th key={i} className="px-2 py-1 text-left text-[#7a9aaa] whitespace-nowrap border-b border-gray-700 font-medium">
                    {cell || `Col ${i + 1}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(1, 201).map((row, ri) => (
                <tr key={ri} className="even:bg-gray-800/40">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-2 py-1 text-gray-300 whitespace-nowrap border-b border-gray-800/50">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 201 && (
            <p className="text-center text-xs text-gray-500 py-1">
              Mostrando 200 de {rows.length - 1} filas — descargá el archivo para ver todo
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function FileSection({
  title,
  icon,
  files,
  accept,
  folder,
  emptyText,
  onRemove,
  uploading,
  onUpload,
  onView,
  showPreview,
}: {
  title: string
  icon: React.ReactNode
  files: FileEntry[]
  accept: string
  folder: string
  emptyText: string
  onAdd?: (f: FileEntry) => void
  onRemove: (url: string) => void
  uploading: boolean
  onUpload: (file: File, folder: string) => Promise<void>
  onView?: (f: FileEntry) => void
  showPreview?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[#7a9aaa] text-[0.65rem] uppercase tracking-widest flex items-center gap-1.5">
          {icon}
          {title}
        </p>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition"
          style={{
            background: 'rgba(0,229,255,0.08)',
            border: '1px solid rgba(0,229,255,0.25)',
            color: '#00e5ff',
            opacity: uploading ? 0.6 : 1,
          }}
        >
          <Upload size={12} />
          {uploading ? 'Subiendo...' : 'Subir'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={e => {
            const f = e.target.files?.[0]
            if (f) onUpload(f, folder)
            e.target.value = ''
          }}
        />
      </div>

      {files.length === 0 ? (
        <p className="text-gray-600 text-xs italic">{emptyText}</p>
      ) : (
        <ul className="space-y-3">
          {files.map(f => (
            <li key={f.url} className="space-y-1">
              <div className="flex items-center gap-2 group">
                <span className="flex-1 text-sm text-gray-200 truncate" title={f.name}>{f.name}</span>
                {onView && (
                  <button
                    onClick={() => onView(f)}
                    className="text-gray-500 hover:text-[#00e5ff] transition"
                    title="Ver"
                  >
                    <Eye size={13} />
                  </button>
                )}
                <a
                  href={f.url}
                  download={f.name}
                  className="text-gray-500 hover:text-[#00e5ff] transition"
                  title="Descargar"
                >
                  <Download size={13} />
                </a>
                <button
                  onClick={() => onRemove(f.url)}
                  className="text-gray-600 hover:text-red-400 transition"
                  title="Eliminar"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              {showPreview && <CsvPreview url={f.url} name={f.name} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function WorkOrderFilesPanel({ workOrderId, initialReports, initialCsvLogs }: Props) {
  const [reports, setReports] = useState<FileEntry[]>(initialReports)
  const [csvLogs, setCsvLogs] = useState<FileEntry[]>(initialCsvLogs)
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [uploadingCsv, setUploadingCsv] = useState(false)
  const [error, setError] = useState('')
  const [viewingPdf, setViewingPdf] = useState<FileEntry | null>(null)

  async function save(newReports: FileEntry[], newCsvLogs: FileEntry[]) {
    const res = await fetch(`/api/ordenes/${workOrderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reports: newReports, csvLogs: newCsvLogs }),
    })
    if (!res.ok) throw new Error('Error al guardar')
  }

  async function upload(file: File, folder: string) {
    const isPdf = folder === 'informes'
    isPdf ? setUploadingPdf(true) : setUploadingCsv(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', folder)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Error al subir archivo')
      const { url } = await res.json()
      const entry: FileEntry = { url, name: file.name }
      if (isPdf) {
        const next = [...reports, entry]
        setReports(next)
        await save(next, csvLogs)
      } else {
        const next = [...csvLogs, entry]
        setCsvLogs(next)
        await save(reports, next)
      }
    } catch {
      setError('No se pudo subir el archivo. Intentá de nuevo.')
    } finally {
      isPdf ? setUploadingPdf(false) : setUploadingCsv(false)
    }
  }

  async function removePdf(url: string) {
    const next = reports.filter(r => r.url !== url)
    setReports(next)
    await save(next, csvLogs)
  }

  async function removeCsv(url: string) {
    const next = csvLogs.filter(c => c.url !== url)
    setCsvLogs(next)
    await save(reports, next)
  }

  return (
    <>
      {viewingPdf && (
        <PdfModal
          url={viewingPdf.url}
          name={viewingPdf.name}
          onClose={() => setViewingPdf(null)}
        />
      )}

      <Card className="p-4 space-y-6">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <span className="w-1 h-4 bg-[#00e5ff] rounded-full inline-block" />
          Archivos del trabajo
        </h3>

        {error && (
          <div className="flex items-center gap-2 text-xs text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
            <X size={12} /> {error}
          </div>
        )}

        <FileSection
          title="Informes PDF"
          icon={<FileText size={10} />}
          files={reports}
          accept=".pdf"
          folder="informes"
          emptyText="Sin informes adjuntos"
          onRemove={removePdf}
          uploading={uploadingPdf}
          onUpload={upload}
          onView={f => setViewingPdf(f)}
        />

        <div className="border-t border-gray-800" />

        <FileSection
          title="Logs del scanner (CSV)"
          icon={<FileSpreadsheet size={10} />}
          files={csvLogs}
          accept=".csv"
          folder="scanner"
          emptyText="Sin logs adjuntos"
          onRemove={removeCsv}
          uploading={uploadingCsv}
          onUpload={upload}
          showPreview
        />
      </Card>
    </>
  )
}
