import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const PAYMENT_STATUS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  SENA: 'Seña',
  PARCIAL: 'Parcial',
  PAGADO: 'Pagado',
}

export const WORK_STATUS: Record<string, string> = {
  INGRESADO: 'Ingresado',
  EN_PROCESO: 'En proceso',
  LISTO: 'Listo',
  ENTREGADO: 'Entregado',
}

export const EXPENSE_CATEGORIES: Record<string, string> = {
  REPUESTOS: 'Repuestos',
  GASTOS_FIJOS: 'Gastos fijos',
  HERRAMIENTAS: 'Herramientas',
  SUELDOS: 'Sueldos',
  OTROS: 'Otros',
}

export const DASHBOARD_LIGHTS: { key: string; label: string }[] = [
  { key: 'checkEngine', label: 'Check Engine' },
  { key: 'abs', label: 'ABS' },
  { key: 'airbag', label: 'Airbag' },
  { key: 'battery', label: 'Batería' },
  { key: 'oil', label: 'Aceite' },
  { key: 'temperature', label: 'Temperatura' },
  { key: 'brakes', label: 'Frenos' },
  { key: 'stability', label: 'Estabilidad' },
  { key: 'steering', label: 'Dirección' },
  { key: 'tpms', label: 'TPMS' },
  { key: 'fuel', label: 'Combustible' },
  { key: 'esp', label: 'ESP' },
]

export const DAMAGE_ZONES = [
  'Frente', 'Paragolpes delantero', 'Capot', 'Techo', 'Baúl',
  'Paragolpes trasero', 'Lateral izquierdo', 'Lateral derecho',
  'Rueda delantera izquierda', 'Rueda delantera derecha',
  'Rueda trasera izquierda', 'Rueda trasera derecha',
  'Espejo izquierdo', 'Espejo derecho', 'Parabrisas', 'Luneta',
]

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount)
}

export function parseGoogleLink(url: string): string | null {
  try {
    const u = url.trim()

    // Google Drive — file/d/{ID}
    const driveFile = u.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)
    if (driveFile) return `https://drive.google.com/uc?export=view&id=${driveFile[1]}`

    // Google Drive — open?id= o uc?id=
    const driveId = u.match(/drive\.google\.com\/(?:open|uc)\?.*id=([a-zA-Z0-9_-]+)/)
    if (driveId) return `https://drive.google.com/uc?export=view&id=${driveId[1]}`

    // Google Fotos — lh3.googleusercontent.com (URL directa de imagen)
    if (u.includes('lh3.googleusercontent.com')) return u

    // Google Fotos — photos.google.com/photo/{ID}
    const photosId = u.match(/photos\.google\.com\/photo\/([a-zA-Z0-9_-]+)/)
    if (photosId) return u  // se guarda tal cual, abre en nueva pestaña

    // Google Fotos — photos.app.goo.gl (link corto)
    if (u.includes('photos.app.goo.gl')) return u

  } catch {}
  return null
}

// Alias para compatibilidad
export const parseDriveLink = parseGoogleLink

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}
