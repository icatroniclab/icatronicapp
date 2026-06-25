'use client'
import { useState, useEffect } from 'react'
import { Bell, BellOff, Loader2 } from 'lucide-react'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!

function urlBase64ToUint8Array(base64: string) {
  const padded = base64.replace(/-/g, '+').replace(/_/g, '/').padEnd(base64.length + (4 - base64.length % 4) % 4, '=')
  const raw = atob(padded)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

export function PushNotificationToggle() {
  const [enabled, setEnabled]       = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [loading, setLoading]       = useState(true)
  const [status, setStatus]         = useState('')
  const [supported, setSupported]   = useState(true)

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setSupported(false)
      setLoading(false)
      return
    }
    setPermission(Notification.permission)
    fetch('/api/push/settings')
      .then(r => r.json())
      .then(d => setEnabled(d.enabled ?? false))
      .finally(() => setLoading(false))
  }, [])

  async function getOrRegisterSW() {
    const reg = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready
    return reg
  }

  async function subscribe(reg: ServiceWorkerRegistration) {
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })
    const json = sub.toJSON()
    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
    })
    if (!res.ok) throw new Error('Error al guardar suscripción')
  }

  async function unsubscribe(reg: ServiceWorkerRegistration) {
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      })
      await sub.unsubscribe()
    }
  }

  async function toggle() {
    if (!supported) return
    setLoading(true)
    setStatus('')
    try {
      const nextEnabled = !enabled

      if (nextEnabled) {
        const perm = await Notification.requestPermission()
        setPermission(perm)
        if (perm !== 'granted') {
          setStatus('Permiso denegado. Habilitá las notificaciones en la configuración del navegador.')
          return
        }
        const reg = await getOrRegisterSW()
        await subscribe(reg)
      } else {
        const reg = await getOrRegisterSW()
        await unsubscribe(reg)
      }

      await fetch('/api/push/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: nextEnabled }),
      })

      setEnabled(nextEnabled)
      setStatus(nextEnabled ? '¡Notificaciones activadas!' : 'Notificaciones desactivadas.')
      setTimeout(() => setStatus(''), 3000)
    } catch (err: any) {
      setStatus(err.message || 'Error al cambiar configuración')
    } finally {
      setLoading(false)
    }
  }

  if (!supported) {
    return (
      <p className="text-xs text-gray-500 italic">
        Tu navegador no soporta notificaciones push.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white font-medium flex items-center gap-2">
            {enabled ? <Bell size={14} className="text-[#00e5ff]" /> : <BellOff size={14} className="text-gray-500" />}
            Notificaciones de turnos
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {enabled
              ? 'Recibirás alertas 2 horas antes de cada turno'
              : 'Activá para recibir alertas de turnos próximos'}
          </p>
          {permission === 'denied' && (
            <p className="text-xs text-yellow-500 mt-1">
              Permiso bloqueado en el navegador — habilitalo manualmente en Configuración del sitio.
            </p>
          )}
        </div>
        <button
          onClick={toggle}
          disabled={loading || permission === 'denied'}
          className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: enabled ? '#00e5ff' : '#374151',
            borderColor: enabled ? '#00e5ff' : '#374151',
          }}
        >
          <span
            className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200"
            style={{ transform: enabled ? 'translateX(20px)' : 'translateX(0px)' }}
          >
            {loading && (
              <span className="flex items-center justify-center h-full">
                <Loader2 size={10} className="animate-spin text-gray-400" />
              </span>
            )}
          </span>
        </button>
      </div>
      {status && (
        <p className="text-xs text-[#00e5ff]">{status}</p>
      )}
    </div>
  )
}
