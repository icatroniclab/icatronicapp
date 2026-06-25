'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

export function DeleteModuloButton({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('¿Eliminar este registro de módulos por completo? Esta acción no se puede deshacer.')) return
    setLoading(true)
    await fetch(`/api/modulos/${id}`, { method: 'DELETE' })
    router.push('/modulos')
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      title="Eliminar registro"
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 border border-red-900/50 bg-red-900/10 hover:bg-red-900/25 transition disabled:opacity-50"
    >
      <Trash2 size={13} />
      {loading ? 'Eliminando...' : 'Eliminar'}
    </button>
  )
}
