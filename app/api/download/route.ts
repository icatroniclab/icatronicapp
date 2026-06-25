import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'URL requerida' }, { status: 400 })

  // Solo permitir dominios de Google
  const allowed = ['drive.google.com', 'lh3.googleusercontent.com', 'photos.google.com', 'photos.app.goo.gl']
  const isAllowed = allowed.some(d => url.includes(d))
  if (!isAllowed) return NextResponse.json({ error: 'Dominio no permitido' }, { status: 403 })

  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const contentType = res.headers.get('content-type') || 'application/octet-stream'
    const buffer = await res.arrayBuffer()

    // Nombre del archivo a partir de la URL
    const ext = contentType.includes('jpeg') ? '.jpg'
      : contentType.includes('png') ? '.png'
      : contentType.includes('webp') ? '.webp'
      : contentType.includes('mp4') ? '.mp4'
      : contentType.includes('pdf') ? '.pdf'
      : ''
    const filename = `foto${ext}`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: 'No se pudo descargar el archivo' }, { status: 502 })
  }
}
