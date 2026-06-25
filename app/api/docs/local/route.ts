import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  const map: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif',
    '.mp4': 'video/mp4', '.mov': 'video/quicktime',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.csv': 'text/csv', '.txt': 'text/plain',
  }
  return map[ext] || 'application/octet-stream'
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const filePath = req.nextUrl.searchParams.get('path')
  if (!filePath) return NextResponse.json({ error: 'Ruta requerida' }, { status: 400 })

  try {
    const buffer = await readFile(filePath)
    const contentType = getMimeType(filePath)
    return new NextResponse(buffer, {
      headers: { 'Content-Type': contentType },
    })
  } catch {
    return NextResponse.json({ error: 'Archivo no encontrado en: ' + filePath }, { status: 404 })
  }
}
