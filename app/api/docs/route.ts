import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q') || ''
  const vehicleModel = req.nextUrl.searchParams.get('vehicleModel') || ''

  const docs = await prisma.techDoc.findMany({
    where: {
      ...(q && { OR: [{ name: { contains: q } }, { description: { contains: q } }, { category: { contains: q } }, { vehicleModel: { contains: q } }] }),
      ...(vehicleModel && { vehicleModel }),
    },
    orderBy: [{ vehicleModel: 'asc' }, { category: 'asc' }, { name: 'asc' }],
  })
  return NextResponse.json(docs)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const formData = await req.formData()
  const category = formData.get('category') as string || 'General'
  const vehicleModel = formData.get('vehicleModel') as string || ''
  const description = formData.get('description') as string || ''
  const localPaths = JSON.parse(formData.get('localPaths') as string || '[]') as string[]
  const files = formData.getAll('files') as File[]

  const created = []

  // Registrar archivos locales (sin copiar)
  for (const localPath of localPaths) {
    const name = path.basename(localPath).replace(/\.[^.]+$/, '')
    const ext = path.extname(localPath).toLowerCase()
    const typeMap: Record<string, string> = { '.pdf': 'application/pdf', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
    const fileType = typeMap[ext] || 'application/octet-stream'

    const doc = await prisma.techDoc.create({
      data: {
        name,
        category,
        vehicleModel: vehicleModel || null,
        description: description || null,
        filePath: `local:${localPath}`,
        fileType,
        fileSize: null,
      },
    })
    created.push(doc)
  }

  // Subir archivos (con copia)
  if (files.length) {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'docs')
    await mkdir(uploadDir, { recursive: true })
    for (const file of files) {
      const ext = path.extname(file.name) || '.bin'
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
      const buffer = Buffer.from(await file.arrayBuffer())
      await writeFile(path.join(uploadDir, filename), buffer)
      const doc = await prisma.techDoc.create({
        data: {
          name: file.name.replace(/\.[^.]+$/, ''),
          category,
          vehicleModel: vehicleModel || null,
          description: description || null,
          filePath: `/uploads/docs/${filename}`,
          fileType: file.type || 'application/octet-stream',
          fileSize: file.size,
        },
      })
      created.push(doc)
    }
  }

  if (!created.length) return NextResponse.json({ error: 'Sin archivos para registrar' }, { status: 400 })
  return NextResponse.json(created, { status: 201 })
}
