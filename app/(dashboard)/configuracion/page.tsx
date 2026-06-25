'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, Trash2, Download, Upload, Users, Database, Store, Hash, Bell, DollarSign, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { PushNotificationToggle } from '@/components/PushNotificationToggle'

export default function ConfiguracionPage() {
  const { data: session } = useSession()
  const isAdmin = (session?.user as any)?.role === 'ADMIN'
  const [users, setUsers] = useState<any[]>([])
  const [showUserModal, setShowUserModal] = useState(false)
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'OPERARIO' })
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)
  const [backfilling, setBackfilling] = useState(false)
  const [backfillResult, setBackfillResult] = useState<any>(null)

  async function backfillOrders() {
    if (!confirm('¿Asignar números de orden a todos los registros sin número? Comenzará desde 1000.')) return
    setBackfilling(true)
    setBackfillResult(null)
    const res = await fetch('/api/admin/backfill-orders', { method: 'POST' })
    const data = await res.json()
    setBackfillResult(data)
    setBackfilling(false)
  }

  // Datos del taller
  const [tallerForm, setTallerForm] = useState({
    tallerNombre: '', tallerSubtitulo: '', tallerTelefono: '', tallerDireccion: '', tallerEmail: '',
  })
  const [savingTaller, setSavingTaller] = useState(false)
  const [tallerSaved, setTallerSaved] = useState(false)

  const [tarifasForm, setTarifasForm] = useState({ tarifaHoraUSD: '40', tarifaDiagnosticoUSD: '100', tipoCambioUSD: '' })
  const [savingTarifas, setSavingTarifas] = useState(false)
  const [tarifasSaved, setTarifasSaved] = useState(false)
  const [fetchingRate, setFetchingRate] = useState(false)
  const [rateInfo, setRateInfo] = useState('')

  useEffect(() => {
    fetch('/api/config').then(r => r.json()).then(cfg => {
      setTallerForm({
        tallerNombre:    cfg.tallerNombre    ?? '',
        tallerSubtitulo: cfg.tallerSubtitulo ?? '',
        tallerTelefono:  cfg.tallerTelefono  ?? '',
        tallerDireccion: cfg.tallerDireccion ?? '',
        tallerEmail:     cfg.tallerEmail     ?? '',
      })
      setTarifasForm({
        tarifaHoraUSD:         cfg.tarifaHoraUSD         ?? '40',
        tarifaDiagnosticoUSD:  cfg.tarifaDiagnosticoUSD  ?? '100',
        tipoCambioUSD:         cfg.tipoCambioUSD          ?? '',
      })
    })
  }, [])

  async function saveTarifas() {
    setSavingTarifas(true)
    await fetch('/api/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tarifasForm),
    })
    setSavingTarifas(false)
    setTarifasSaved(true)
    setTimeout(() => setTarifasSaved(false), 2500)
  }

  async function fetchDollarRate() {
    setFetchingRate(true)
    setRateInfo('')
    try {
      const res = await fetch('/api/dolar')
      const data = await res.json()
      if (data.error) { setRateInfo('No se pudo obtener la cotización'); return }
      if (data.blue) {
        setTarifasForm(f => ({ ...f, tipoCambioUSD: Math.round(data.blue).toString() }))
        setRateInfo(`Dólar blue: $${data.blue.toLocaleString('es-AR')}${data.oficial ? ` · Oficial: $${data.oficial.toLocaleString('es-AR')}` : ''}`)
      }
    } catch {
      setRateInfo('Error al consultar la cotización')
    } finally {
      setFetchingRate(false)
    }
  }

  async function saveTaller() {
    setSavingTaller(true)
    await fetch('/api/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tallerForm),
    })
    setSavingTaller(false)
    setTallerSaved(true)
    setTimeout(() => setTallerSaved(false), 2500)
  }

  useEffect(() => {
    if (isAdmin) fetch('/api/usuarios').then(r => r.json()).then(setUsers)
  }, [isAdmin])

  async function createUser() {
    setSaving(true)
    const res = await fetch('/api/usuarios', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userForm) })
    if (res.ok) {
      const u = await res.json()
      setUsers(prev => [...prev, u])
      setShowUserModal(false)
      setUserForm({ name: '', email: '', password: '', role: 'OPERARIO' })
    } else {
      const e = await res.json().catch(() => ({}))
      alert(e.error || 'Error al crear usuario')
    }
    setSaving(false)
  }

  async function deleteUser(id: string) {
    if (!confirm('¿Eliminar este usuario?')) return
    await fetch(`/api/usuarios/${id}`, { method: 'DELETE' })
    setUsers(prev => prev.filter(u => u.id !== id))
  }

  async function importBackup(file: File) {
    setImporting(true)
    setImportResult(null)
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      const res = await fetch('/api/backup/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
      })
      const result = await res.json()
      setImportResult(result)
    } catch (e) {
      setImportResult({ error: 'Archivo JSON inválido' })
    }
    setImporting(false)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-white">Configuración</h1>

      {/* Datos del taller */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Store size={18} className="text-[#00e5ff]" />
          <h2 className="font-semibold text-white">Datos del taller</h2>
        </div>
        <p className="text-gray-400 text-xs mb-4">Esta información aparece en el encabezado y pie del informe PDF para el cliente.</p>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nombre del taller"
              value={tallerForm.tallerNombre}
              onChange={e => setTallerForm(f => ({ ...f, tallerNombre: e.target.value }))}
              placeholder="ICATRONIC"
            />
            <Input
              label="Subtítulo / Rubro"
              value={tallerForm.tallerSubtitulo}
              onChange={e => setTallerForm(f => ({ ...f, tallerSubtitulo: e.target.value }))}
              placeholder="Laboratorio de Electrónica Automotriz"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Teléfono"
              value={tallerForm.tallerTelefono}
              onChange={e => setTallerForm(f => ({ ...f, tallerTelefono: e.target.value }))}
              placeholder="Ej: 11-1234-5678"
            />
            <Input
              label="Email"
              type="email"
              value={tallerForm.tallerEmail}
              onChange={e => setTallerForm(f => ({ ...f, tallerEmail: e.target.value }))}
              placeholder="taller@email.com"
            />
          </div>
          <Input
            label="Dirección"
            value={tallerForm.tallerDireccion}
            onChange={e => setTallerForm(f => ({ ...f, tallerDireccion: e.target.value }))}
            placeholder="Ej: Av. Corrientes 1234, Buenos Aires"
          />
        </div>
        <div className="flex items-center gap-3 mt-4">
          <Button onClick={saveTaller} disabled={savingTaller}>
            {savingTaller ? 'Guardando...' : 'Guardar datos del taller'}
          </Button>
          {tallerSaved && <span className="text-emerald-400 text-sm">¡Guardado!</span>}
        </div>
      </Card>

      {/* Tarifas */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <DollarSign size={18} className="text-emerald-400" />
          <h2 className="font-semibold text-white">Tarifas</h2>
        </div>
        <p className="text-gray-400 text-xs mb-4">
          Las tarifas en USD y el tipo de cambio se usan para calcular el precio en pesos automáticamente al cargar horas de trabajo o diagnóstico.
        </p>
        <div className="space-y-4">

          {/* Tipo de cambio */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Tipo de cambio (USD → ARS)</label>
            <div className="flex gap-2">
              <input
                type="number" min="0" step="1"
                value={tarifasForm.tipoCambioUSD}
                onChange={e => setTarifasForm(f => ({ ...f, tipoCambioUSD: e.target.value }))}
                placeholder="Ingresá o actualizá"
                className="flex-1 bg-[#111c2e] border border-[#253652] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              />
              <button
                type="button" onClick={fetchDollarRate} disabled={fetchingRate}
                title="Obtener cotización dólar blue actual"
                className="px-3 py-2 bg-[#253652] hover:bg-[#2e4565] text-gray-300 text-sm rounded-lg transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw size={14} className={fetchingRate ? 'animate-spin' : ''} />
                <span className="text-xs">Dólar blue</span>
              </button>
            </div>
            {rateInfo && <p className="text-xs text-gray-500 mt-1">{rateInfo}</p>}
          </div>

          {/* Tarifas hora */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Mano de obra (USD/h)</label>
              <input
                type="number" min="0" step="0.5"
                value={tarifasForm.tarifaHoraUSD}
                onChange={e => setTarifasForm(f => ({ ...f, tarifaHoraUSD: e.target.value }))}
                placeholder="40"
                className="w-full bg-[#111c2e] border border-[#253652] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Diagnóstico (USD/h)</label>
              <input
                type="number" min="0" step="0.5"
                value={tarifasForm.tarifaDiagnosticoUSD}
                onChange={e => setTarifasForm(f => ({ ...f, tarifaDiagnosticoUSD: e.target.value }))}
                placeholder="100"
                className="w-full bg-[#111c2e] border border-[#253652] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Preview */}
          {tarifasForm.tipoCambioUSD && (() => {
            const cambio = Number(tarifasForm.tipoCambioUSD)
            const obra   = Number(tarifasForm.tarifaHoraUSD   || 40)
            const diag   = Number(tarifasForm.tarifaDiagnosticoUSD || 100)
            const fmt    = (n: number) => `$${Math.round(n).toLocaleString('es-AR')}`
            return (
              <div className="rounded-lg border border-[#253652] divide-y divide-[#253652] text-sm overflow-hidden">
                <div className="flex justify-between px-3 py-2 bg-[#111c2e]">
                  <span className="text-gray-400">Mano de obra / hora</span>
                  <span className="text-emerald-400 font-medium">{fmt(obra * cambio)}</span>
                </div>
                <div className="flex justify-between px-3 py-2 bg-[#111c2e]">
                  <span className="text-gray-400">Diagnóstico básico <span className="text-gray-600">(0.5 h)</span></span>
                  <span className="text-yellow-400 font-medium">{fmt(diag * cambio * 0.5)}</span>
                </div>
                <div className="flex justify-between px-3 py-2 bg-[#111c2e]">
                  <span className="text-gray-400">Diagnóstico medio <span className="text-gray-600">(1 h)</span></span>
                  <span className="text-yellow-400 font-medium">{fmt(diag * cambio * 1)}</span>
                </div>
                <div className="flex justify-between px-3 py-2 bg-[#111c2e]">
                  <span className="text-gray-400">Diagnóstico complejo <span className="text-gray-600">(2.5 h)</span></span>
                  <span className="text-yellow-400 font-medium">{fmt(diag * cambio * 2.5)}</span>
                </div>
              </div>
            )
          })()}
        </div>
        <div className="flex items-center gap-3 mt-4">
          <Button onClick={saveTarifas} disabled={savingTarifas}>
            {savingTarifas ? 'Guardando...' : 'Guardar tarifas'}
          </Button>
          {tarifasSaved && <span className="text-emerald-400 text-sm">¡Guardado!</span>}
        </div>
      </Card>

      {/* Usuarios */}
      {isAdmin && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-blue-400" />
              <h2 className="font-semibold text-white">Usuarios</h2>
            </div>
            <Button size="sm" onClick={() => setShowUserModal(true)}><Plus size={14} /> Agregar</Button>
          </div>
          <div className="space-y-2">
            {users.map(u => (
              <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-[#111c2e] border border-[#253652]">
                <div>
                  <p className="text-white text-sm font-medium">{u.name}</p>
                  <p className="text-gray-400 text-xs">{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={u.role === 'ADMIN' ? 'info' : 'outline'}>{u.role}</Badge>
                  {u.email !== session?.user?.email && (
                    <button onClick={() => deleteUser(u.id)} className="text-gray-500 hover:text-red-400 transition"><Trash2 size={14} /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Numeración de órdenes */}
      {isAdmin && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Hash size={18} className="text-[#00e5ff]" />
            <h2 className="font-semibold text-white">Numeración de órdenes</h2>
          </div>
          <p className="text-gray-400 text-sm mb-4">Asigna números de orden correlativos (desde 1000) a todos los trabajos y módulos que aún no tienen número asignado.</p>
          <Button variant="secondary" onClick={backfillOrders} disabled={backfilling}>
            <Hash size={15} /> {backfilling ? 'Asignando...' : 'Asignar números a registros existentes'}
          </Button>
          {backfillResult && (
            <div className={`mt-3 p-3 rounded-lg text-sm ${backfillResult.error ? 'bg-red-900/20 border border-red-800 text-red-300' : 'bg-emerald-900/20 border border-emerald-800 text-emerald-300'}`}>
              {backfillResult.error ? backfillResult.error : (
                <p>Se asignaron <strong>{backfillResult.assigned}</strong> números ({backfillResult.ordenes} órdenes de trabajo, {backfillResult.modulos} módulos)</p>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Backup */}
      {isAdmin && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Database size={18} className="text-blue-400" />
            <h2 className="font-semibold text-white">Backup de datos</h2>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-gray-400 text-sm mb-3">Exportar todos los datos como JSON</p>
              <a href="/api/backup/export" download>
                <Button variant="secondary"><Download size={16} /> Exportar backup</Button>
              </a>
            </div>
            <div className="border-t border-[#253652] pt-4">
              <p className="text-gray-400 text-sm mb-3">Importar datos desde JSON (vehículos, stock, gastos, casos)</p>
              <label className="cursor-pointer inline-flex items-center gap-2 bg-[#253652] hover:bg-[#2e4565] text-gray-200 px-4 py-2 text-sm font-medium rounded-lg transition">
                <Upload size={16} /> {importing ? 'Importando...' : 'Importar backup'}
                <input type="file" accept=".json" className="hidden" disabled={importing} onChange={e => e.target.files?.[0] && importBackup(e.target.files[0])} />
              </label>
              {importResult && (
                <div className={`mt-3 p-3 rounded-lg text-sm ${importResult.error ? 'bg-red-900/20 border border-red-800 text-red-300' : 'bg-emerald-900/20 border border-emerald-800 text-emerald-300'}`}>
                  {importResult.error ? importResult.error : (
                    <div>
                      <p className="font-semibold mb-1">Importación completada:</p>
                      <ul className="space-y-0.5 text-xs">
                        <li>Vehículos: {importResult.stats?.vehiculos}</li>
                        <li>Clientes: {importResult.stats?.clientes}</li>
                        <li>Stock: {importResult.stats?.stock}</li>
                        <li>Gastos: {importResult.stats?.gastos}</li>
                        <li>Casos: {importResult.stats?.casos}</li>
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Notificaciones */}
      <Card>
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Bell size={16} className="text-[#00e5ff]" /> Notificaciones
        </h2>
        <PushNotificationToggle />
      </Card>

      {/* Info */}
      <Card>
        <h2 className="font-semibold text-white mb-3">Acerca de</h2>
        <div className="space-y-2 text-sm text-gray-400">
          <p><span className="text-white font-semibold">IcatronicApp</span> — Sistema de gestión para taller de electrónica automotriz</p>
          <p>Versión 1.0.0</p>
          <p>Usuario activo: <span className="text-white">{session?.user?.name}</span> ({(session?.user as any)?.role})</p>
        </div>
      </Card>

      <Modal open={showUserModal} onClose={() => setShowUserModal(false)} title="Nuevo usuario">
        <div className="space-y-4">
          <Input label="Nombre *" required value={userForm.name} onChange={e => setUserForm(f => ({ ...f, name: e.target.value }))} />
          <Input label="Email *" type="email" required value={userForm.email} onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} />
          <Input label="Contraseña *" type="password" required value={userForm.password} onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))} />
          <Select label="Rol" value={userForm.role} onChange={e => setUserForm(f => ({ ...f, role: e.target.value }))}>
            <option value="OPERARIO">Operario</option>
            <option value="ADMIN">Administrador</option>
          </Select>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowUserModal(false)}>Cancelar</Button>
            <Button onClick={createUser} disabled={saving || !userForm.name || !userForm.email || !userForm.password}>{saving ? 'Creando...' : 'Crear usuario'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
