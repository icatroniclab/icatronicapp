import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function parseNum(s: string): number {
  return parseFloat(s.replace(/\./g, '').replace(',', '.'))
}

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const res = await fetch('https://dolarhoy.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      next: { revalidate: 0 },
    })

    if (!res.ok) return NextResponse.json({ error: 'No se pudo conectar a dolarhoy.com' }, { status: 502 })

    const html = await res.text()

    // Estructura: <a href="/cotizaciondolarblue">...<div class="compra">1395,00</div><div class="venta">1415,00</div></a>
    const cleanMatch = html.match(
      /cotizaciondolarblue[^>]*>[\s\S]{0,200}?<div class="compra">([0-9.,]+)<\/div>[\s\S]{0,200}?<div class="venta">([0-9.,]+)<\/div>/i
    )

    let compra: number | null = null
    let venta: number | null = null

    if (cleanMatch) {
      compra = parseNum(cleanMatch[1])
      venta  = parseNum(cleanMatch[2])
    }

    // Fallback: buscar el bloque con class="val" dentro de la sección blue
    if (!compra || !venta) {
      const blueMatch = html.match(
        /blue[^<]{0,60}<\/a[^>]*>[\s\S]{0,300}?class="compra"[\s\S]{0,100}?class="val">\$([0-9.,]+)<\/div>[\s\S]{0,400}?class="venta"[\s\S]{0,100}?class="val">\$([0-9.,]+)<\/div>/i
      )
      if (blueMatch) {
        compra = parseNum(blueMatch[1])
        venta  = parseNum(blueMatch[2])
      }
    }

    if (!compra || !venta || isNaN(compra) || isNaN(venta)) {
      return NextResponse.json({ error: 'No se pudo extraer la cotización blue' }, { status: 422 })
    }

    const promedio = Math.round((compra + venta) / 2)

    await Promise.all([
      prisma.config.upsert({ where: { key: 'exchangeRate' },   update: { value: String(promedio) },          create: { key: 'exchangeRate',   value: String(promedio) } }),
      prisma.config.upsert({ where: { key: 'dolarCompra' },    update: { value: String(Math.round(compra)) }, create: { key: 'dolarCompra',    value: String(Math.round(compra)) } }),
      prisma.config.upsert({ where: { key: 'dolarVenta' },     update: { value: String(Math.round(venta)) },  create: { key: 'dolarVenta',     value: String(Math.round(venta)) } }),
    ])

    return NextResponse.json({ compra: Math.round(compra), venta: Math.round(venta), promedio, source: 'dolarhoy.com' })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
