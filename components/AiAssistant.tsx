'use client'
import { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, X, Bot, Loader2, ClipboardList, Search, FolderOpen } from 'lucide-react'
import { Card } from './ui/Card'
import { Button } from './ui/Button'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function AiAssistant({ workOrderId }: { workOrderId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [showDocs, setShowDocs] = useState(false)
  const [docs, setDocs] = useState<any[]>([])
  const [docsSearch, setDocsSearch] = useState('')
  const [attachedDocs, setAttachedDocs] = useState<any[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function loadDocs(q = '') {
    const res = await fetch(`/api/docs?q=${encodeURIComponent(q)}`)
    setDocs(await res.json())
  }

  function toggleDoc(doc: any) {
    setAttachedDocs(prev =>
      prev.find(d => d.id === doc.id) ? prev.filter(d => d.id !== doc.id) : [...prev, doc]
    )
  }

  async function send() {
    if (!input.trim() && files.length === 0) return
    const userMsg: Message = { role: 'user', content: input || `[Adjunto: ${files.map(f => f.name).join(', ')}]` }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    const fd = new FormData()
    fd.append('workOrderId', workOrderId)
    fd.append('message', input)
    fd.append('history', JSON.stringify(messages))
    fd.append('attachedDocs', JSON.stringify(attachedDocs))
    files.forEach(f => fd.append('files', f))

    try {
      const res = await fetch('/api/asistente', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: `Error ${res.status}: ${data.error || 'Error desconocido'}` }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response || 'Sin respuesta' }])
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error de red: ${e?.message || 'Error desconocido'}` }])
    }
    setFiles([])
    setLoading(false)
  }

  return (
    <Card className="flex flex-col min-h-[520px]">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#253652]">
        <div className="bg-blue-600 rounded-lg p-1.5"><Bot size={16} className="text-white" /></div>
        <div>
          <h3 className="font-semibold text-white text-sm">Asistente de Diagnóstico IA</h3>
          <p className="text-xs text-gray-400">Impulsado por Claude · Acepta imágenes, PDF y CSV</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-[320px] max-h-[420px]">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Bot size={32} className="text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Preguntame sobre el diagnóstico del vehículo.</p>
            <p className="text-gray-600 text-xs mt-1">Podés adjuntar fotos, reportes PDF o CSV del escáner.</p>
            <div className="mt-4 flex flex-col items-center gap-2">
              <button
                onClick={() => setInput('Analizá el caso completo con toda la información registrada y dame tu evaluación diagnóstica, posibles causas y recomendaciones.')}
                className="flex items-center gap-2 px-3 py-2 bg-[#253652] hover:bg-[#2e4565] text-gray-300 text-xs rounded-lg transition"
              >
                <ClipboardList size={13} /> Analizar caso completo
              </button>
              <button
                onClick={() => setInput('Buscá en la base de casos del taller si hay trabajos similares resueltos anteriormente. Mostrá los más relevantes con detalle: vehículo, síntomas, causa raíz encontrada y solución aplicada.')}
                className="flex items-center gap-2 px-3 py-2 bg-[#253652] hover:bg-[#2e4565] text-gray-300 text-xs rounded-lg transition"
              >
                <Search size={13} /> Buscar casos similares
              </button>
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] rounded-xl px-3.5 py-2.5 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-[#253652] text-gray-200'}`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#253652] rounded-xl px-3.5 py-2.5">
              <Loader2 size={16} className="text-blue-400 animate-spin" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {files.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-1 bg-[#253652] rounded-lg px-2 py-1 text-xs text-gray-300">
              <span>{f.name}</span>
              <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}><X size={10} /></button>
            </div>
          ))}
        </div>
      )}

      {/* Docs adjuntos */}
      {attachedDocs.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {attachedDocs.map(d => (
            <div key={d.id} className="flex items-center gap-1 bg-yellow-900/30 border border-yellow-800/40 rounded-lg px-2 py-1 text-xs text-yellow-300">
              <FolderOpen size={10} />
              <span>{d.name}</span>
              <button onClick={() => toggleDoc(d)}><X size={10} /></button>
            </div>
          ))}
        </div>
      )}

      {/* Panel selector de docs */}
      {showDocs && (
        <div className="mb-2 bg-[#111c2e] border border-[#253652] rounded-lg p-3 max-h-52 overflow-y-auto">
          <input
            autoFocus
            value={docsSearch}
            onChange={e => { setDocsSearch(e.target.value); loadDocs(e.target.value) }}
            placeholder="Buscar en documentación..."
            className="w-full bg-[#1e2d42] border border-[#253652] rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500 mb-2"
          />
          {docs.length === 0 && <p className="text-gray-500 text-xs text-center py-2">Sin documentos. Subí archivos en la sección Documentación.</p>}
          {docs.map(d => {
            const selected = attachedDocs.find(a => a.id === d.id)
            return (
              <button
                key={d.id}
                onClick={() => toggleDoc(d)}
                className={`w-full text-left px-2 py-1.5 rounded-lg text-sm transition flex items-center gap-2 ${selected ? 'bg-yellow-900/30 text-yellow-300' : 'text-gray-300 hover:bg-[#253652]'}`}
              >
                <span className="text-base">📄</span>
                <div className="flex-1 min-w-0">
                  <span className="block truncate">{d.name}</span>
                  <span className="text-xs text-gray-500">{d.category}</span>
                </div>
                {selected && <span className="text-xs text-yellow-400">✓</span>}
              </button>
            )
          })}
        </div>
      )}

      <div className="flex gap-2">
        <label className="flex-shrink-0 p-2 text-gray-400 hover:text-white cursor-pointer transition rounded-lg hover:bg-[#253652]">
          <Paperclip size={18} />
          <input type="file" multiple accept="image/*,.pdf,.csv" className="hidden" onChange={e => e.target.files && setFiles(prev => [...prev, ...Array.from(e.target.files!)])} />
        </label>
        <button
          onClick={() => { setShowDocs(v => !v); if (!docs.length) loadDocs() }}
          className={`flex-shrink-0 p-2 transition rounded-lg ${showDocs || attachedDocs.length ? 'text-yellow-400 bg-yellow-900/20' : 'text-gray-400 hover:text-white hover:bg-[#253652]'}`}
          title="Adjuntar desde Documentación"
        >
          <FolderOpen size={18} />
        </button>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
          placeholder="Describí el síntoma o preguntá al asistente..."
          disabled={loading}
          className="flex-1 bg-[#111c2e] border border-[#253652] rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition text-sm"
        />
        <Button onClick={send} disabled={loading || (!input.trim() && files.length === 0)} size="sm">
          <Send size={16} />
        </Button>
      </div>
    </Card>
  )
}
