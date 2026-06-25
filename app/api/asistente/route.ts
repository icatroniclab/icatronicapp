import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const formData = await req.formData()
    const workOrderId = formData.get('workOrderId') as string
    const message = formData.get('message') as string
    const history = JSON.parse(formData.get('history') as string || '[]')
    const attachedDocs = JSON.parse(formData.get('attachedDocs') as string || '[]')
    const files = formData.getAll('files') as File[]

    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        vehicle: { include: { client: true } },
        tracking: { include: { dtcCodes: true, diagnosticLog: { orderBy: { createdAt: 'asc' } } } },
        budgetItems: true,
      },
    })

    if (!workOrder) return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })

    // Buscar trabajos finalizados similares
    const dtcCode = workOrder.tracking?.dtcCodes?.[0]?.code || ''
    const motivoWord = workOrder.motive.split(' ')[0] || ''

    const workOrConditions: any[] = [
      { vehicle: { brand: { contains: workOrder.vehicle.brand } } },
    ]
    if (dtcCode) workOrConditions.push({ tracking: { dtcCodes: { some: { code: { contains: dtcCode } } } } })
    if (motivoWord.length > 3) workOrConditions.push({ motive: { contains: motivoWord } })

    const trabajosFinalizados = await prisma.workOrder.findMany({
      where: {
        id: { not: workOrderId },
        workStatus: { in: ['LISTO', 'ENTREGADO'] },
        OR: workOrConditions,
      },
      include: {
        vehicle: true,
        tracking: { include: { dtcCodes: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 4,
    })

    // Buscar documentación técnica relevante automáticamente
    const docSearchTerms = [
      workOrder.vehicle.brand,
      workOrder.vehicle.model,
      dtcCode,
      ...(workOrder.motive.split(' ').filter((w: string) => w.length > 4).slice(0, 3)),
    ].filter(Boolean)

    const docOrConditions = docSearchTerms.map((term: string) => ({
      OR: [
        { name: { contains: term } },
        { description: { contains: term } },
        { category: { contains: term } },
      ]
    }))

    const relevantDocs = docOrConditions.length > 0
      ? await prisma.techDoc.findMany({
          where: { OR: docOrConditions },
          take: 3,
          orderBy: { updatedAt: 'desc' },
        })
      : []

    // Mantener base de casos manual como fallback
    const orConditions: any[] = [
      { vehicle: { contains: workOrder.vehicle.brand } },
    ]
    if (dtcCode) orConditions.push({ dtcCodes: { contains: dtcCode } })
    if (motivoWord.length > 3) orConditions.push({ symptoms: { contains: motivoWord } })

    const casos = await prisma.diagnosticCase.findMany({
      where: { status: 'VERIFICADO', OR: orConditions },
      take: 3,
    })

    const lights = ['checkEngine', 'abs', 'airbag', 'battery', 'oil', 'temperature', 'brakes', 'stability', 'steering', 'tpms', 'fuel', 'esp']
    const lightLabels: Record<string, string> = { checkEngine: 'Check Engine', abs: 'ABS', airbag: 'Airbag', battery: 'Batería', oil: 'Aceite', temperature: 'Temperatura', brakes: 'Frenos', stability: 'Estabilidad', steering: 'Dirección', tpms: 'TPMS', fuel: 'Combustible', esp: 'ESP' }
    const activeLights = lights.filter(l => (workOrder as any)[l]).map(l => lightLabels[l])

    // Parsear datos del tracking
    const measurements = workOrder.tracking?.measurements ? JSON.parse(workOrder.tracking.measurements) : null
    const scannedModules: string[] = workOrder.tracking?.scannedModules ? JSON.parse(workOrder.tracking.scannedModules) : []
    const diagnosticLog: any[] = workOrder.tracking?.diagnosticLog || []

    const measurementsText = measurements ? [
      measurements.batteryRest      && `Batería reposo: ${measurements.batteryRest}V`,
      measurements.batteryLoad      && `Batería con motor: ${measurements.batteryLoad}V`,
      measurements.batteryStart     && `Batería en arranque: ${measurements.batteryStart}V`,
      measurements.alternator       && `Alternador: ${measurements.alternator}V`,
      measurements.ground           && `Resistencia tierra: ${measurements.ground}Ω`,
      measurements.batteryAnalyzerState && `Analizador batería: ${measurements.batteryAnalyzerState}`,
      measurements.batteryCcaMeasured   && `CCA medido: ${measurements.batteryCcaMeasured}`,
      measurements.batteryCcaNominal    && `CCA nominal: ${measurements.batteryCcaNominal}`,
      measurements.transponder          && `Transponder: ${measurements.transponder}`,
    ].filter(Boolean).join(' | ') : 'sin mediciones registradas'

    const systemPrompt = `Sos un experto en diagnóstico de electrónica automotriz del taller "IcatronicApp". Respondés siempre en español, de forma técnica pero clara.

**VEHÍCULO EN DIAGNÓSTICO:**
- Patente: ${workOrder.vehicle.plate}
- Vehículo: ${workOrder.vehicle.brand} ${workOrder.vehicle.model} ${workOrder.vehicle.year || ''}
- KM: ${workOrder.vehicle.km || 'no registrado'}
- Color: ${workOrder.vehicle.color || 'no registrado'}
- Motor: ${(workOrder.vehicle as any).engineType || 'no registrado'} ${(workOrder.vehicle as any).displacement || ''} ${(workOrder.vehicle as any).engineCode ? `(${(workOrder.vehicle as any).engineCode})` : ''}

**MOTIVO DE INGRESO:** ${workOrder.motive}

**LUCES TABLERO ENCENDIDAS:** ${activeLights.length > 0 ? activeLights.join(', ') : 'ninguna'}

**CÓDIGOS DTC ESCANEADOS:** ${workOrder.tracking?.dtcCodes.map(d => `${d.code}${d.description ? ` (${d.description})` : ''}`).join(', ') || 'ninguno aún'}

**MÓDULOS ESCANEADOS:** ${scannedModules.length > 0 ? scannedModules.join(', ') : 'ninguno registrado'}

**MEDICIONES ELÉCTRICAS:** ${measurementsText}

**INFORME ESCÁNER:** ${workOrder.tracking?.scannerReport || 'sin informe aún'}

**CAUSA RAÍZ CONFIRMADA:** ${workOrder.tracking?.rootCause || 'pendiente de determinar'}

**BITÁCORA DE DIAGNÓSTICO:**
${diagnosticLog.length > 0 ? diagnosticLog.map(e => `- ${new Date(e.createdAt).toLocaleString('es-AR')} — ${e.text}`).join('\n') : '(sin entradas)'}

**NOTAS DEL TÉCNICO:** ${workOrder.tracking?.notes || 'sin notas'}

${trabajosFinalizados.length > 0 ? `**TRABAJOS SIMILARES RESUELTOS EN EL TALLER:**
${trabajosFinalizados.map(t => {
  const dtcs = t.tracking?.dtcCodes?.map((d: any) => d.code).join(', ') || 'sin DTC'
  const causa = (t.tracking as any)?.rootCause || 'no registrada'
  return `- ${t.vehicle.brand} ${t.vehicle.model} ${t.vehicle.year || ''} | Motivo: ${t.motive} | DTC: ${dtcs} | Causa raíz: ${causa}`
}).join('\n')}` : ''}
${casos.length > 0 ? `**CASOS DE LA BASE DE CONOCIMIENTO:**\n${casos.map(c => `- ${c.title} | DTC: ${c.dtcCodes || 'N/A'} | Causa: ${c.rootCause || 'N/A'} | Solución: ${c.solution || 'N/A'}`).join('\n')}` : ''}

Analizá la información y ayudá con el diagnóstico. Podés recibir imágenes, PDFs y CSVs adjuntos del escáner para analizarlos.
${relevantDocs.length > 0 ? `\n**DOCUMENTACIÓN TÉCNICA ENCONTRADA AUTOMÁTICAMENTE:**\n${relevantDocs.map((d: any) => `- ${d.name} (${d.category})${d.description ? ': ' + d.description : ''}`).join('\n')}\nEstos documentos fueron adjuntados automáticamente a esta consulta.` : ''}`

    // Construir contenido del mensaje
    const contentParts: Anthropic.MessageParam['content'] = []

    // Adjuntar docs encontrados automáticamente
    const allDocs = [...relevantDocs.filter((d: any) => !attachedDocs.find((a: any) => a.id === d.id)), ...attachedDocs]
    for (const doc of allDocs) {
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
          // Verificar que empiece con %PDF
          if (!buffer.slice(0, 4).toString('ascii').startsWith('%PDF')) continue
          contentParts.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } } as any)
          contentParts.push({ type: 'text', text: `[Documento adjunto de biblioteca: ${doc.name} — ${doc.category}]` })
        } else if (doc.fileType?.startsWith('image/')) {
          contentParts.push({ type: 'image', source: { type: 'base64', media_type: doc.fileType, data: base64 } } as any)
          contentParts.push({ type: 'text', text: `[Imagen adjunta de biblioteca: ${doc.name}]` })
        }
      } catch {}
    }

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const base64 = buffer.toString('base64')

      if (file.type.startsWith('image/')) {
        contentParts.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
            data: base64,
          },
        })
      } else if (file.type === 'application/pdf') {
        contentParts.push({
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: base64 },
        } as any)
      } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        const text = buffer.toString('utf-8')
        contentParts.push({ type: 'text', text: `[CSV adjunto - ${file.name}]:\n${text}` })
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

    // Guardar/actualizar caso automáticamente
    const dtcCodes = workOrder.tracking?.dtcCodes?.map((d: any) => d.code).join(', ') || ''
    const rootCause = (workOrder.tracking as any)?.rootCause || ''
    const parts = workOrder.budgetItems
      ?.filter((b: any) => b.type === 'REPUESTO')
      .map((b: any) => `${b.description} (${b.quantity})`)
      .join(', ') || ''

    await prisma.diagnosticCase.upsert({
      where: { workOrderId },
      create: {
        workOrderId,
        title: `${workOrder.vehicle.brand} ${workOrder.vehicle.model} ${workOrder.vehicle.year || ''} — ${workOrder.motive.slice(0, 60)}`,
        vehicle: `${workOrder.vehicle.brand} ${workOrder.vehicle.model} ${workOrder.vehicle.year || ''}`,
        dtcCodes: dtcCodes || null,
        symptoms: workOrder.motive,
        rootCause: rootCause || null,
        solution: null,
        parts: parts || null,
        aiAnalysis: text,
        status: 'BORRADOR',
      },
      update: {
        dtcCodes: dtcCodes || undefined,
        rootCause: rootCause || undefined,
        parts: parts || undefined,
        aiAnalysis: text,
        ...(rootCause && { status: 'VERIFICADO' }),
      },
    })

    return NextResponse.json({ response: text })

  } catch (error: any) {
    console.error('[Asistente IA error]', error)
    const msg = error?.message || 'Error interno del servidor'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
