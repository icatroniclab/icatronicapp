import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await fetch('https://dolarapi.com/v1/dolares', {
      next: { revalidate: 300 },
    })
    if (!res.ok) throw new Error('API no disponible')
    const data: any[] = await res.json()
    const blue = data.find(d => d.casa === 'blue')
    const oficial = data.find(d => d.casa === 'oficial')
    return NextResponse.json({
      blue: blue?.venta ?? null,
      oficial: oficial?.venta ?? null,
    })
  } catch {
    return NextResponse.json({ error: 'No se pudo obtener la cotización' }, { status: 503 })
  }
}
