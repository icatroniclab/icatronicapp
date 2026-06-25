import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const systemPrompt = `Sos un experto en diagnóstico de electrónica automotriz del taller "IcatronicApp". Respondés siempre en español, de forma técnica pero clara.

Podés ayudar con:
- Diagnóstico de fallas eléctricas y electrónicas en vehículos
- Interpretación de códigos DTC
- Análisis de diagramas eléctricos e imágenes
- Lectura y análisis de documentos técnicos (PDFs, manuales, planos)
- Protocolos de comunicación automotriz (CAN, LIN, K-Line, etc.)
- Sistemas de inmovilizadores, airbag, ABS, ESP, cajas automáticas
- Programación y configuración de módulos ECU
- Mediciones eléctricas y su interpretación
- Consultas técnicas generales sobre vehículos

Cuando analizés documentos o imágenes adjuntos, describí en detalle lo que encontrás y cómo aplica a la consulta.`

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const formData = await req.formData()
    const message = formData.get('message') as string
    const history = JSON.parse(formData.get('history') as string || '[]')
    const attachedDocs = JSON.parse(formData.get('attachedDocs') as string || '[]')
    const files = formData.getAll('files') as File[]

    const contentParts: Anthropic.MessageParam['content'] = []

    // Adjuntar docs de biblioteca
    for (const doc of attachedDocs) {
      try {
        const base = process.env.NEXTAUTH_URL_INTERNAL || 'http://localhost:3000'
        const rawPath = doc.filePath as string
        const fileUrl = rawPath.startsWith('local:')
          ? `${base}/api/docs/local?path=${encodeURIComponent(rawPath.replace('local:', ''))}`
          : rawPath.startsWith('http') ? rawPath : `${base}${rawPath}`
        const res = await fetch(fileUrl)
        if (!res.ok) continue
        const buffer = Buffer.from(await res.arrayBuffer())
        if (buffer.length === 0) continue
        const base64 = buffer.toString('base64')
        if (doc.fileType?.includes('pdf')) {
          if (!buffer.slice(0, 4).toString('ascii').startsWith('%PDF')) continue
          contentParts.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } } as any)
          contentParts.push({ type: 'text', text: `[Documento adjunto: ${doc.name} — ${doc.category}]` })
        } else if (doc.fileType?.startsWith('image/')) {
          contentParts.push({ type: 'image', source: { type: 'base64', media_type: doc.fileType, data: base64 } } as any)
          contentParts.push({ type: 'text', text: `[Imagen adjunta: ${doc.name}]` })
        }
      } catch {}
    }

    // Adjuntar archivos enviados directamente
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const base64 = buffer.toString('base64')
      if (file.type.startsWith('image/')) {
        contentParts.push({
          type: 'image',
          source: { type: 'base64', media_type: file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp', data: base64 },
        })
      } else if (file.type === 'application/pdf') {
        contentParts.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } } as any)
      } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        contentParts.push({ type: 'text', text: `[CSV: ${file.name}]:\n${buffer.toString('utf-8')}` })
      }
    }

    if (message) contentParts.push({ type: 'text', text: message })

    const userContent = contentParts.length > 0 ? contentParts : message

    const messages: Anthropic.MessageParam[] = [
      ...history.map((h: any) => ({ role: h.role as 'user' | 'assistant', content: h.content })),
      { role: 'user', content: userContent },
    ]

    const aiResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    })

    const text = aiResponse.content[0].type === 'text' ? aiResponse.content[0].text : ''
    return NextResponse.json({ response: text })

  } catch (error: any) {
    console.error('[Asistente general error]', error)
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 })
  }
}
