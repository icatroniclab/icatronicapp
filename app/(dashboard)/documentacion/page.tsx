'use client'
import { useState, useEffect, useCallback } from 'react'
import { Upload, Search, Trash2, FolderOpen, Plus, Edit2, ExternalLink, Car } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'

const CATEGORIES = ['General', 'Diagramas eléctricos', 'Manuales de taller', 'Planos ECU', 'Protocolos OBD', 'Fichas técnicas', 'Inmovilizadores', 'Airbag', 'ABS/ESP', 'Cajas automáticas', 'Otros']

function fileIcon(type: string) {
  if (type.includes('pdf')) return '📄'
  if (type.includes('image')) return '🖼️'
  if (type.includes('video')) return '🎥'
  if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) return '📊'
  if (type.includes('word') || type.includes('document')) return '📝'
  return '📁'
}

function formatSize(bytes?: number | null) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function DocumentacionPage() {
  const [docs, setDocs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [editDoc, setEditDoc] = useState<any>(null)
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [uploadMode, setUploadMode] = useState<'file' | 'scan'>('file')
  const [uploadForm, setUploadForm] = useState({ category: 'General', vehicleModel: '', description: '' })
  const [scanFolder, setScanFolder] = useState('')
  const [scanRecursive, setScanRecursive] = useState(false)
  const [scanResults, setScanResults] = useState<any[]>([])
  const [scanSelected, setScanSelected] = useState<string[]>([])
  const [scanning, setScanning] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', category: 'General', vehicleModel: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [deleting, setDeleting] = useState(false)

  const fetchDocs = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    const res = await fetch(`/api/docs?${params}`)
    setDocs(await res.json())
    setLoading(false)
  }, [search])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  async function handleScan() {
    if (!scanFolder.trim()) return
    setScanning(true)
    setScanResults([])
    setScanSelected([])
    const res = await fetch(`/api/docs/scan?folder=${encodeURIComponent(scanFolder.trim())}&recursive=${scanRecursive ? '1' : '0'}`)
    const data = await res.json()
    if (!res.ok) { alert(data.error); setScanning(false); return }
    setScanResults(data)
    setScanSelected(data.map((f: any) => f.path))
    setScanning(false)
  }

  async function handleUpload() {
    const localPaths = uploadMode === 'scan' ? scanSelected : []
    if (!uploadFiles.length && !localPaths.length) return
    setUploading(true)
    const fd = new FormData()
    uploadFiles.forEach(f => fd.append('files', f))
    fd.append('localPaths', JSON.stringify(localPaths))
    fd.append('category', uploadForm.category)
    fd.append('vehicleModel', uploadForm.vehicleModel)
    fd.append('description', uploadForm.description)
    const res = await fetch('/api/docs', { method: 'POST', body: fd })
    if (res.ok) {
      setShowUpload(false)
      setUploadFiles([])
      setScanResults([])
      setScanSelected([])
      setScanFolder('')
      setUploadForm({ category: 'General', vehicleModel: '', description: '' })
      fetchDocs()
    } else {
      const e = await res.json()
      alert(e.error || 'Error al registrar')
    }
    setUploading(false)
  }

  async function handleEdit() {
    if (!editDoc) return
    setSaving(true)
    await fetch(`/api/docs/${editDoc.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    setEditDoc(null)
    setSaving(false)
    fetchDocs()
  }

  async function deleteDoc(id: string) {
    if (!confirm('¿Eliminar este documento?')) return
    await fetch(`/api/docs/${id}`, { method: 'DELETE' })
    fetchDocs()
  }

  async function deleteSelected() {
    if (!selected.length) return
    if (!confirm(`¿Eliminar ${selected.length} documento${selected.length !== 1 ? 's' : ''}?`)) return
    setDeleting(true)
    await Promise.all(selected.map(id => fetch(`/api/docs/${id}`, { method: 'DELETE' })))
    setSelected([])
    setDeleting(false)
    fetchDocs()
  }

  function toggleSelect(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  // Agrupar: primero por modelo de vehículo, luego por categoría
  const grouped: Record<string, Record<string, any[]>> = {}
  for (const doc of docs) {
    const model = doc.vehicleModel || 'Sin modelo asignado'
    const cat = doc.category || 'General'
    if (!grouped[model]) grouped[model] = {}
    if (!grouped[model][cat]) grouped[model][cat] = []
    grouped[model][cat].push(doc)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Documentación Técnica</h1>
          <p className="text-gray-400 text-sm mt-1">{docs.length} archivo{docs.length !== 1 ? 's' : ''} · Adjuntables al asistente IA</p>
        </div>
        <div className="flex items-center gap-2">
          {selected.length > 0 && (
            <>
              <span className="text-xs text-gray-400">{selected.length} seleccionado{selected.length !== 1 ? 's' : ''}</span>
              <Button variant="danger" onClick={deleteSelected} disabled={deleting}>
                <Trash2 size={14} /> {deleting ? 'Eliminando...' : 'Eliminar seleccionados'}
              </Button>
            </>
          )}
          <Button onClick={() => { setShowUpload(true); setUploadFiles([]); setUploadForm({ category: 'General', vehicleModel: '', description: '' }) }}>
            <Plus size={16} /> Subir archivos
          </Button>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, modelo, categoría..." className="w-full bg-[#1e2d42] border border-[#253652] rounded-lg pl-9 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm" />
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Cargando...</p>
      ) : docs.length === 0 ? (
        <Card className="text-center py-12">
          <FolderOpen size={36} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Sin documentos. Subí manuales, planos y fichas técnicas.</p>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([model, categories]) => (
            <div key={model}>
              {/* Cabecera de modelo */}
              <div className="flex items-center gap-2 mb-4">
                <Car size={16} className="text-blue-400" />
                <h2 className="text-white font-semibold">{model}</h2>
                <span className="text-gray-600 text-xs">({Object.values(categories).flat().length} archivos)</span>
              </div>

              {/* Subcategorías */}
              <div className="space-y-4 pl-4 border-l border-[#253652]">
                {Object.entries(categories).map(([cat, items]) => (
                  <div key={cat}>
                    <div className="flex items-center gap-2 mb-2">
                      <FolderOpen size={13} className="text-yellow-400" />
                      <h3 className="text-gray-300 text-sm font-medium">{cat}</h3>
                      <span className="text-gray-600 text-xs">({items.length})</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {items.map((doc: any) => {
                        const isSelected = selected.includes(doc.id)
                        return (
                        <div key={doc.id} onClick={() => toggleSelect(doc.id)} className={`bg-[#1e2d42] border rounded-lg p-3 flex items-start gap-3 group cursor-pointer transition ${isSelected ? 'border-blue-500 bg-blue-600/10' : 'border-[#253652] hover:border-blue-800/50'}`}>
                          <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(doc.id)} onClick={e => e.stopPropagation()} className="mt-0.5 accent-blue-500 flex-shrink-0 cursor-pointer" />
                          <span className="text-xl flex-shrink-0">{fileIcon(doc.fileType)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{doc.name}</p>
                            {doc.description && <p className="text-gray-500 text-xs mt-0.5 truncate">{doc.description}</p>}
                            <p className="text-gray-600 text-xs mt-0.5">{formatSize(doc.fileSize)}</p>
                          </div>
                          <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition" onClick={e => e.stopPropagation()}>
                            <a href={doc.filePath.startsWith('local:') ? `/api/docs/local?path=${encodeURIComponent(doc.filePath.replace('local:', ''))}` : doc.filePath} target="_blank" rel="noopener" className="p-1 text-gray-500 hover:text-blue-400 transition" title="Abrir"><ExternalLink size={13} /></a>
                            <button onClick={() => { setEditDoc(doc); setEditForm({ name: doc.name, category: doc.category, vehicleModel: doc.vehicleModel || '', description: doc.description || '' }) }} className="p-1 text-gray-500 hover:text-white transition" title="Editar"><Edit2 size={13} /></button>
                            <button onClick={() => deleteDoc(doc.id)} className="p-1 text-gray-500 hover:text-red-400 transition" title="Eliminar"><Trash2 size={13} /></button>
                          </div>
                        </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal subir */}
      <Modal open={showUpload} onClose={() => setShowUpload(false)} title="Agregar documentos">
        <div className="space-y-4">
          {/* Selector de modo */}
          <div className="flex gap-2">
            <button onClick={() => setUploadMode('file')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${uploadMode === 'file' ? 'bg-blue-600 text-white' : 'bg-[#253652] text-gray-400 hover:text-white'}`}>
              Subir copia
            </button>
            <button onClick={() => setUploadMode('scan')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${uploadMode === 'scan' ? 'bg-blue-600 text-white' : 'bg-[#253652] text-gray-400 hover:text-white'}`}>
              Vincular carpeta
            </button>
          </div>

          {uploadMode === 'file' ? (
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Archivos (podés seleccionar varios)</label>
              <label className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-[#253652] rounded-lg cursor-pointer hover:border-blue-500 transition">
                <Upload size={24} className="text-gray-400" />
                {uploadFiles.length === 0 ? (
                  <span className="text-gray-400 text-sm">Seleccionar archivos (PDF, imágenes, docs...)</span>
                ) : (
                  <div className="text-center">
                    <span className="text-white text-sm font-medium">{uploadFiles.length} archivo{uploadFiles.length > 1 ? 's' : ''} seleccionado{uploadFiles.length > 1 ? 's' : ''}</span>
                    <div className="mt-1 space-y-0.5">
                      {uploadFiles.slice(0, 5).map((f, i) => <p key={i} className="text-gray-500 text-xs truncate max-w-xs">{f.name}</p>)}
                      {uploadFiles.length > 5 && <p className="text-gray-600 text-xs">...y {uploadFiles.length - 5} más</p>}
                    </div>
                  </div>
                )}
                <input type="file" className="hidden" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,image/*" onChange={e => setUploadFiles(Array.from(e.target.files || []))} />
              </label>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">Los archivos no se copian, se leen desde su ubicación original.</p>
              <div className="flex gap-2">
                <input
                  value={scanFolder}
                  onChange={e => setScanFolder(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleScan()}
                  placeholder="C:\Users\leonardo\documentos\planos"
                  className="flex-1 bg-[#111c2e] border border-[#253652] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 font-mono placeholder-gray-600"
                />
                <Button size="sm" variant="secondary" onClick={handleScan} disabled={scanning || !scanFolder.trim()}>
                  {scanning ? 'Escaneando...' : 'Escanear'}
                </Button>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer text-gray-400">
                <input type="checkbox" checked={scanRecursive} onChange={e => setScanRecursive(e.target.checked)} className="accent-blue-500" />
                Incluir subcarpetas
              </label>
              {scanResults.length > 0 && (
                <div className="bg-[#111c2e] border border-[#253652] rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-[#253652]">
                    <span className="text-xs text-gray-400">{scanResults.length} archivos encontrados</span>
                    <button onClick={() => setScanSelected(scanSelected.length === scanResults.length ? [] : scanResults.map(f => f.path))} className="text-xs text-blue-400 hover:text-blue-300">
                      {scanSelected.length === scanResults.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                    </button>
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    {scanResults.map(f => (
                      <label key={f.path} className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#1e2d42] cursor-pointer">
                        <input type="checkbox" checked={scanSelected.includes(f.path)} onChange={e => setScanSelected(prev => e.target.checked ? [...prev, f.path] : prev.filter(p => p !== f.path))} className="accent-blue-500" />
                        <span className="text-gray-300 text-xs truncate">{f.name}</span>
                        <span className="text-gray-600 text-xs ml-auto flex-shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <Input
            label="Modelo de vehículo"
            value={uploadForm.vehicleModel}
            onChange={e => setUploadForm(p => ({ ...p, vehicleModel: e.target.value }))}
            placeholder="Ej: Toyota Corolla 2018, VW Gol G5..."
          />

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Categoría</label>
            <select value={uploadForm.category} onChange={e => setUploadForm(p => ({ ...p, category: e.target.value }))} className="w-full bg-[#111c2e] border border-[#253652] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <Textarea label="Descripción" rows={2} value={uploadForm.description} onChange={e => setUploadForm(p => ({ ...p, description: e.target.value }))} placeholder="Notas, años compatibles, observaciones..." />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowUpload(false)}>Cancelar</Button>
            <Button onClick={handleUpload} disabled={uploading || (uploadMode === 'file' ? !uploadFiles.length : !scanSelected.length)}>
              {uploading ? 'Registrando...' : uploadMode === 'scan' ? `Vincular ${scanSelected.length} archivo${scanSelected.length !== 1 ? 's' : ''}` : `Subir ${uploadFiles.length > 1 ? uploadFiles.length + ' archivos' : 'archivo'}`}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal editar */}
      <Modal open={!!editDoc} onClose={() => setEditDoc(null)} title="Editar documento">
        <div className="space-y-4">
          <Input label="Nombre" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
          <Input label="Modelo de vehículo" value={editForm.vehicleModel} onChange={e => setEditForm(p => ({ ...p, vehicleModel: e.target.value }))} placeholder="Ej: Toyota Corolla 2018" />
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Categoría</label>
            <select value={editForm.category} onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))} className="w-full bg-[#111c2e] border border-[#253652] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Textarea label="Descripción" rows={2} value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setEditDoc(null)}>Cancelar</Button>
            <Button onClick={handleEdit} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
