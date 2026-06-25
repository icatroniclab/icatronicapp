'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Paperclip, X, Bot, User, FolderOpen, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

type Message = { role: 'user' | 'assistant'; content: string }

function formatMsg(text: string) {
  // Negrita **texto**
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**')
      ? <strong key={i}>{p.slice(2, -2)}</strong>
      : <span key={i}>{p}</span>
  )
}

function MsgBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-blue-600' : 'bg-[#253652]'}`}>
        {isUser ? <User size={14} /> : <Bot size={14} className="text-blue-400" />}
      </div>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${isUser ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-[#1e2d42] text-gray-200 rounded-tl-sm border border-[#253652]'}`}>
        {isUser ? msg.content : formatMsg(msg.content)}
      </div>
    </div>
  )
}

export default function AsistentePage() {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window === 'undefined') return []
    try { return JSON.parse(localStorage.getItem('asistente_chat') || '[]') } catch { return [] }
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [attachedDocs, setAttachedDocs] = useState<any[]>([])
  const [showDocs, setShowDocs] = useState(false)
  const [allDocs, setAllDocs] = useState<any[]>([])
  const [docSearch, setDocSearch] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  useEffect(() => {
    localStorage.setItem('asistente_chat', JSON.stringify(messages))
  }, [messages])

  const fetchDocs = useCallback(async () => {
    const res = await fetch('/api/docs')
    if (res.ok) setAllDocs(await res.json())
  }, [])

  useEffect(() => { if (showDocs) fetchDocs() }, [showDocs, fetchDocs])

  const filteredDocs = allDocs.filter(d =>
    !docSearch || d.name.toLowerCase().includes(docSearch.toLowerCase()) ||
    d.category?.toLowerCase().includes(docSearch.toLowerCase()) ||
    d.vehicleModel?.toLowerCase().includes(docSearch.toLowerCase())
  )

  async function send() {
    const text = input.trim()
    if (!text && !files.length && !attachedDocs.length) return
    if (loading) return

    const userMsg: Message = { role: 'user', content: text || '[Archivos adjuntos]' }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    const fd = new FormData()
    fd.append('message', text)
    fd.append('history', JSON.stringify(messages))
    fd.append('attachedDocs', JSON.stringify(attachedDocs))
    files.forEach(f => fd.append('files', f))

    setFiles([])
    setAttachedDocs([])

    try {
      const res = await fetch('/api/asistente/general', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${e.message}` }])
    }
    setLoading(false)
  }

  function clearChat() {
    if (messages.length === 0) return
    if (!confirm('¿Limpiar la conversación?')) return
    setMessages([])
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bot size={22} className="text-blue-400" />
            Asistente IA
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">Consultas técnicas de electrónica automotriz</p>
        </div>
        {messages.length > 0 && (
          <button onClick={clearChat} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-400 transition px-2 py-1.5 rounded-lg hover:bg-red-400/10">
            <Trash2 size={13} /> Limpiar chat
          </button>
        )}
      </div>

      {/* Chat area */}
      <Card className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-12">
            <div className="w-16 h-16 rounded-2xl bg-[#253652] flex items-center justify-center">
              <Bot size={32} className="text-blue-400" />
            </div>
            <div>
              <p className="text-white font-medium text-lg">¿En qué puedo ayudarte?</p>
              <p className="text-gray-500 text-sm mt-1 max-w-sm">Consultame sobre diagnósticos, códigos DTC, diagramas eléctricos, o cualquier tema de electrónica automotriz.</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {['¿Qué significa el DTC P0300?', 'Cómo probar un sensor MAF', 'Protocolo CAN Bus explicado', 'Cómo medir resistencia de tierra'].map(q => (
                <button key={q} onClick={() => setInput(q)} className="text-xs bg-[#253652] hover:bg-[#363b55] text-gray-300 px-3 py-1.5 rounded-full transition">
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((m, i) => <MsgBubble key={i} msg={m} />)}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#253652] flex items-center justify-center flex-shrink-0">
                  <Bot size={14} className="text-blue-400" />
                </div>
                <div className="bg-[#1e2d42] border border-[#253652] rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1 items-center h-5">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </Card>

      {/* Panel de docs adjuntos */}
      {showDocs && (
        <Card className="mt-2 p-3 flex-shrink-0 max-h-52 overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <Search size={13} className="text-gray-400" />
            <input
              value={docSearch}
              onChange={e => setDocSearch(e.target.value)}
              placeholder="Buscar documento..."
              className="flex-1 bg-transparent text-white text-xs focus:outline-none placeholder-gray-600"
            />
            <button onClick={() => setShowDocs(false)} className="text-gray-500 hover:text-white"><X size={14} /></button>
          </div>
          <div className="overflow-y-auto space-y-1">
            {filteredDocs.map(doc => {
              const attached = attachedDocs.some(d => d.id === doc.id)
              return (
                <button
                  key={doc.id}
                  onClick={() => setAttachedDocs(prev => attached ? prev.filter(d => d.id !== doc.id) : [...prev, doc])}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-left transition ${attached ? 'bg-blue-600/20 border border-blue-500/40 text-white' : 'text-gray-400 hover:bg-[#253652]'}`}
                >
                  <span>{doc.fileType?.includes('pdf') ? '📄' : doc.fileType?.startsWith('image') ? '🖼️' : '📁'}</span>
                  <span className="flex-1 truncate">{doc.name}</span>
                  <span className="text-gray-600 flex-shrink-0">{doc.vehicleModel || doc.category}</span>
                </button>
              )
            })}
            {filteredDocs.length === 0 && <p className="text-gray-600 text-xs text-center py-3">Sin documentos</p>}
          </div>
        </Card>
      )}

      {/* Chips de adjuntos */}
      {(files.length > 0 || attachedDocs.length > 0) && (
        <div className="flex flex-wrap gap-1.5 mt-2 flex-shrink-0">
          {files.map((f, i) => (
            <span key={i} className="flex items-center gap-1 bg-[#253652] text-gray-300 text-xs px-2 py-1 rounded-full">
              <Paperclip size={10} />{f.name}
              <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="ml-0.5 hover:text-red-400"><X size={10} /></button>
            </span>
          ))}
          {attachedDocs.map(d => (
            <span key={d.id} className="flex items-center gap-1 bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs px-2 py-1 rounded-full">
              📄 {d.name}
              <button onClick={() => setAttachedDocs(prev => prev.filter(x => x.id !== d.id))} className="ml-0.5 hover:text-red-400"><X size={10} /></button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 mt-2 flex-shrink-0">
        <input type="file" ref={fileRef} className="hidden" multiple accept=".pdf,.csv,image/*" onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files || [])])} />
        <button onClick={() => fileRef.current?.click()} className="p-2.5 rounded-xl bg-[#1e2d42] border border-[#253652] text-gray-400 hover:text-white hover:border-blue-500 transition flex-shrink-0" title="Adjuntar archivo">
          <Paperclip size={16} />
        </button>
        <button onClick={() => setShowDocs(p => !p)} className={`p-2.5 rounded-xl border transition flex-shrink-0 ${showDocs || attachedDocs.length > 0 ? 'bg-blue-600/20 border-blue-500/40 text-blue-400' : 'bg-[#1e2d42] border-[#253652] text-gray-400 hover:text-white hover:border-blue-500'}`} title="Adjuntar de biblioteca">
          <FolderOpen size={16} />
        </button>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
          placeholder="Escribí tu consulta técnica..."
          className="flex-1 bg-[#1e2d42] border border-[#253652] rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
          disabled={loading}
        />
        <button
          onClick={send}
          disabled={loading || (!input.trim() && !files.length && !attachedDocs.length)}
          className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex-shrink-0 transition"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
