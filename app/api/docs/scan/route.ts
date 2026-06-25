import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { readdir, stat } from 'fs/promises'
import path from 'path'

const SUPPORTED = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt', '.jpg', '.jpeg', '.png', '.webp', '.mp4', '.mov']

async function scanDir(dir: string, recursive: boolean): Promise<{ name: string; path: string; size: number; ext: string }[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const results: any[] = []
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory() && recursive) {
      results.push(...await scanDir(fullPath, recursive))
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase()
      if (SUPPORTED.includes(ext)) {
        const s = await stat(fullPath)
        results.push({ name: entry.name, path: fullPath, size: s.size, ext })
      }
    }
  }
  return results
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const folder = req.nextUrl.searchParams.get('folder')
  const recursive = req.nextUrl.searchParams.get('recursive') === '1'
  if (!folder) return NextResponse.json({ error: 'Carpeta requerida' }, { status: 400 })

  try {
    const files = await scanDir(folder, recursive)
    return NextResponse.json(files)
  } catch {
    return NextResponse.json({ error: 'No se pudo leer la carpeta. Verificá la ruta.' }, { status: 404 })
  }
}
