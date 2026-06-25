'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { BrandModelSelect } from '@/components/BrandModelSelect'
import { DASHBOARD_LIGHTS, DAMAGE_ZONES, parseDriveLink } from '@/lib/utils'
import { ArrowLeft, Upload, X, Search, UserCheck, Link as LinkIcon, Car } from 'lucide-react'
import { PhotoThumb } from '@/components/ui/PhotoThumb'
import Link from 'next/link'

export default function NuevoVehiculoPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [photos, setPhotos] = useState<string[]>([])
  const [driveInput, setDriveInput] = useState('')
  const [clientSearch, setClientSearch] = useState('')
  const [clientSuggestions, setClientSuggestions] = useState<any[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [plateSuggestions, setPlateSuggestions] = useState<any[]>([])
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)
  const searchTimeout = useRef<any>(null)
  const plateTimeout = useRef<any>(null)
  const [form, setForm] = useState({
    // Cliente
    clientName: '', clientPhone: '', clientEmail: '', clientDni: '',
    // Vehículo
    plate: '', brand: '', model: '', year: '', km: '', color: '',
    engineType: '', displacement: '', engineCode: '',
    // Trabajo
    entryDate: new Date().toISOString().slice(0, 16),
    motive: '', missingItems: '', valuables: '', notes: '',
    budget: '', paymentStatus: 'PENDIENTE',
    // Luces
    checkEngine: false, abs: false, airbag: false, battery: false,
    oil: false, temperature: false, brakes: false, stability: false,
    steering: false, tpms: false, fuel: false, esp: false,
    // Daños
    damageZones: [] as string[],
  })

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  function searchClients(q: string) {
    setClientSearch(q)
    setSelectedClientId(null)
    clearTimeout(searchTimeout.current)
    if (!q.trim()) { setClientSuggestions([]); return }
    searchTimeout.current = setTimeout(async () => {
      const res = await fetch(`/api/clientes?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setClientSuggestions(data.slice(0, 6))
    }, 300)
  }

  function selectClient(c: any) {
    setSelectedClientId(c.id)
    setClientSearch(c.name)
    setClientSuggestions([])
    setForm(f => ({
      ...f,
      clientName: c.name,
      clientPhone: c.phone || '',
      clientEmail: c.email || '',
      clientDni: c.dni || '',
    }))
  }

  function searchByPlate(value: string) {
    const upper = value.toUpperCase()
    set('plate', upper)
    setSelectedVehicleId(null)
    clearTimeout(plateTimeout.current)
    if (upper.length < 2) { setPlateSuggestions([]); return }
    plateTimeout.current = setTimeout(async () => {
      const res = await fetch(`/api/vehiculos?q=${encodeURIComponent(upper)}`)
      const data = await res.json()
      const filtered = (data as any[]).filter(v => v.plate.includes(upper)).slice(0, 5)
      setPlateSuggestions(filtered)
    }, 300)
  }

  function selectVehicle(v: any) {
    setSelectedVehicleId(v.id)
    setPlateSuggestions([])
    setForm(f => ({
      ...f,
      plate: v.plate,
      brand: v.brand,
      model: v.model,
      year: v.year?.toString() || '',
      km: v.km?.toString() || '',
      color: v.color || '',
      engineType: v.engineType || '',
      displacement: v.displacement || '',
      engineCode: v.engineCode || '',
      clientName: v.client?.name || f.clientName,
      clientPhone: v.client?.phone || f.clientPhone,
      clientEmail: v.client?.email || f.clientEmail,
      clientDni: v.client?.dni || f.clientDni,
    }))
    if (v.client) {
      setSelectedClientId(v.client.id)
      setClientSearch(v.client.name)
    }
  }

  function clearClient() {
    setSelectedClientId(null)
    setClientSearch('')
    setForm(f => ({ ...f, clientName: '', clientPhone: '', clientEmail: '', clientDni: '' }))
  }

  async function uploadPhotos(files: FileList) {
    setUploadingPhotos(true)
    const urls: string[] = []
    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'ingresos')
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) urls.push(data.url)
    }
    setPhotos(prev => [...prev, ...urls])
    setUploadingPhotos(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/vehiculos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: { id: selectedClientId, name: form.clientName, phone: form.clientPhone, email: form.clientEmail, dni: form.clientDni },
          vehicle: { plate: form.plate, brand: form.brand, model: form.model, year: form.year, km: form.km, color: form.color, engineType: form.engineType, displacement: form.displacement, engineCode: form.engineCode },
          workOrder: {
            entryDate: form.entryDate,
            motive: form.motive,
            checkEngine: form.checkEngine, abs: form.abs, airbag: form.airbag, battery: form.battery,
            oil: form.oil, temperature: form.temperature, brakes: form.brakes, stability: form.stability,
            steering: form.steering, tpms: form.tpms, fuel: form.fuel, esp: form.esp,
            damageZones: form.damageZones,
            missingItems: form.missingItems, valuables: form.valuables, notes: form.notes,
            budget: form.budget, paymentStatus: form.paymentStatus,
            photos,
          },
        }),
      })
      const data = await res.json()
      if (res.ok) router.push(`/vehiculos/${data.vehicleId}`)
      else alert(data.error || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/vehiculos"><Button variant="ghost" size="sm"><ArrowLeft size={16} /> Volver</Button></Link>
        <h1 className="text-2xl font-bold text-white">Nueva ficha de ingreso</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cliente */}
        <Card>
          <h2 className="font-semibold text-white mb-4">Datos del cliente</h2>

          {/* Buscador de clientes existentes */}
          <div className="relative mb-4">
            <label className="text-xs text-gray-400 mb-1 block">Buscar cliente existente</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={clientSearch}
                onChange={e => searchClients(e.target.value)}
                placeholder="Escribí nombre, teléfono o DNI..."
                className="w-full bg-[#111c2e] border border-[#253652] rounded-lg pl-8 pr-8 py-2 text-white text-sm focus:outline-none focus:border-blue-500 placeholder-gray-600"
              />
              {selectedClientId && (
                <button type="button" onClick={clearClient} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-400">
                  <X size={14} />
                </button>
              )}
            </div>
            {clientSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-[#1e2d42] border border-[#253652] rounded-lg overflow-hidden shadow-xl">
                {clientSuggestions.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectClient(c)}
                    className="w-full text-left px-3 py-2.5 hover:bg-[#253652] transition border-b border-[#253652] last:border-0"
                  >
                    <span className="block text-white text-sm font-medium">{c.name}</span>
                    <span className="block text-gray-500 text-xs">{[c.phone, c.email, c.dni].filter(Boolean).join(' · ')}</span>
                  </button>
                ))}
              </div>
            )}
            {selectedClientId && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-400">
                <UserCheck size={12} /> Cliente existente seleccionado
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nombre *" required value={form.clientName} onChange={e => { set('clientName', e.target.value); setSelectedClientId(null) }} placeholder="Apellido, Nombre" />
            <Input label="Teléfono" value={form.clientPhone} onChange={e => set('clientPhone', e.target.value)} placeholder="+54 9 11..." type="tel" />
            <Input label="Email" value={form.clientEmail} onChange={e => set('clientEmail', e.target.value)} type="email" />
            <Input label="DNI / CUIT" value={form.clientDni} onChange={e => set('clientDni', e.target.value)} />
          </div>
        </Card>

        {/* Vehículo */}
        <Card>
          <h2 className="font-semibold text-white mb-4">Datos del vehículo</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {/* Patente con búsqueda automática */}
            <div className="col-span-2 sm:col-span-3 relative">
              <label className="text-xs text-gray-400 mb-1 block">Patente *</label>
              <input
                type="text"
                value={form.plate}
                onChange={e => searchByPlate(e.target.value)}
                required
                placeholder="ABC123 — buscará vehículos registrados"
                className="w-full bg-[#111c2e] border border-[#253652] rounded-lg px-3 py-2 text-white text-sm uppercase tracking-widest focus:outline-none focus:border-[#00b8cc] focus:shadow-[0_0_0_3px_rgba(0,229,255,0.10)] placeholder-gray-600 placeholder:uppercase placeholder:tracking-normal transition"
              />
              {plateSuggestions.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-[#1e2d42] border border-[#253652] rounded-lg overflow-hidden shadow-xl">
                  {plateSuggestions.map(v => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => selectVehicle(v)}
                      className="w-full text-left px-3 py-2.5 hover:bg-[#253652] transition border-b border-[#253652] last:border-0 flex items-center gap-3"
                    >
                      <span className="font-mono font-bold text-[#00e5ff] text-sm tracking-widest">{v.plate}</span>
                      <span className="text-white text-sm">{v.brand} {v.model}{v.year ? ` (${v.year})` : ''}</span>
                      {v.client && <span className="text-gray-500 text-xs ml-auto">{v.client.name}</span>}
                    </button>
                  ))}
                </div>
              )}
              {selectedVehicleId && (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[#00e5ff]">
                  <Car size={12} /> Vehículo registrado — datos completados automáticamente
                </div>
              )}
            </div>
            <BrandModelSelect
              key={selectedVehicleId || 'manual'}
              brand={form.brand}
              model={form.model}
              onBrandChange={v => set('brand', v)}
              onModelChange={v => set('model', v)}
            />
            <Input label="Año" value={form.year} onChange={e => set('year', e.target.value)} type="number" placeholder="2020" />
            <Input label="KM" value={form.km} onChange={e => set('km', e.target.value)} type="number" placeholder="85000" />
            <Input label="Color" value={form.color} onChange={e => set('color', e.target.value)} placeholder="Blanco" />
            <Select label="Tipo de motor" value={form.engineType} onChange={e => set('engineType', e.target.value)}>
              <option value="">— No especificado —</option>
              <option value="Nafta">Nafta</option>
              <option value="Diesel">Diesel</option>
              <option value="GNC">GNC</option>
              <option value="Nafta/GNC">Nafta + GNC</option>
              <option value="Híbrido">Híbrido</option>
              <option value="Eléctrico">Eléctrico</option>
            </Select>
            <Input label="Cilindrada" value={form.displacement} onChange={e => set('displacement', e.target.value)} placeholder="1.6 / 2000cc" />
            <Input label="Código de motor" value={form.engineCode} onChange={e => set('engineCode', e.target.value.toUpperCase())} placeholder="1NZ-FE" />
          </div>
        </Card>

        {/* Motivo */}
        <Card>
          <h2 className="font-semibold text-white mb-4">Motivo de ingreso</h2>
          <div className="mb-3">
            <label className="text-xs text-gray-400 mb-1 block">Fecha de ingreso</label>
            <input
              type="datetime-local"
              value={form.entryDate}
              onChange={e => set('entryDate', e.target.value)}
              className="w-full bg-[#111c2e] border border-[#253652] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <Textarea label="Descripción *" required rows={3} value={form.motive} onChange={e => set('motive', e.target.value)} placeholder="Describe el motivo de la falla o ingreso..." />
        </Card>

        {/* Luces tablero */}
        <Card>
          <h2 className="font-semibold text-white mb-4">Luces del tablero encendidas</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {DASHBOARD_LIGHTS.map(l => (
              <label key={l.key} className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition ${(form as any)[l.key] ? 'border-yellow-500 bg-yellow-900/20 text-yellow-300' : 'border-[#253652] text-gray-400 hover:border-gray-500'}`}>
                <input type="checkbox" className="hidden" checked={(form as any)[l.key]} onChange={e => set(l.key, e.target.checked)} />
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${(form as any)[l.key] ? 'bg-yellow-400' : 'bg-gray-600'}`} />
                <span className="text-xs font-medium">{l.label}</span>
              </label>
            ))}
          </div>
        </Card>

        {/* Daños */}
        <Card>
          <h2 className="font-semibold text-white mb-4">Golpes y daños por zona</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {DAMAGE_ZONES.map(z => (
              <label key={z} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition text-sm ${form.damageZones.includes(z) ? 'border-red-500 bg-red-900/20 text-red-300' : 'border-[#253652] text-gray-400 hover:border-gray-500'}`}>
                <input type="checkbox" className="hidden" checked={form.damageZones.includes(z)} onChange={e => set('damageZones', e.target.checked ? [...form.damageZones, z] : form.damageZones.filter(x => x !== z))} />
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${form.damageZones.includes(z) ? 'bg-red-400' : 'bg-gray-600'}`} />
                {z}
              </label>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Textarea label="Faltantes" rows={2} value={form.missingItems} onChange={e => set('missingItems', e.target.value)} placeholder="Objetos que faltan en el vehículo..." />
            <Textarea label="Objetos de valor declarados" rows={2} value={form.valuables} onChange={e => set('valuables', e.target.value)} placeholder="Objetos de valor que trae el cliente..." />
          </div>
        </Card>

        {/* Fotos */}
        <Card>
          <h2 className="font-semibold text-white mb-4">Fotos de ingreso</h2>
          <label className="flex items-center gap-3 p-4 border-2 border-dashed border-[#253652] rounded-lg cursor-pointer hover:border-blue-500 transition">
            <Upload size={20} className="text-gray-400" />
            <span className="text-gray-400 text-sm">{uploadingPhotos ? 'Subiendo...' : 'Subir fotos (jpg, png, webp)'}</span>
            <input type="file" className="hidden" multiple accept="image/*" disabled={uploadingPhotos} onChange={e => e.target.files && uploadPhotos(e.target.files)} />
          </label>
          <div className="flex gap-2 mt-3">
            <div className="relative flex-1">
              <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={driveInput}
                onChange={e => setDriveInput(e.target.value)}
                placeholder="Pegar link de Google Drive o Google Fotos..."
                className="w-full bg-[#111c2e] border border-[#253652] rounded-lg pl-8 pr-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 placeholder-gray-600"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                const url = parseDriveLink(driveInput)
                if (url) { setPhotos(p => [...p, url]); setDriveInput('') }
                else alert('Link de Drive inválido. Asegurate de que sea un link de compartir.')
              }}
              className="px-3 py-2 bg-[#253652] hover:bg-[#2e4565] text-gray-300 text-sm rounded-lg transition"
            >
              Agregar
            </button>
          </div>
          {photos.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {photos.map((url, i) => (
                <PhotoThumb key={i} url={url} onRemove={() => setPhotos(p => p.filter((_, j) => j !== i))} />
              ))}
            </div>
          )}
        </Card>

        {/* Presupuesto */}
        <Card>
          <h2 className="font-semibold text-white mb-4">Presupuesto y pago</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Presupuesto ($)" value={form.budget} onChange={e => set('budget', e.target.value)} type="number" step="0.01" placeholder="0.00" />
            <Select label="Estado de pago" value={form.paymentStatus} onChange={e => set('paymentStatus', e.target.value)}>
              <option value="PENDIENTE">Pendiente</option>
              <option value="SENA">Seña</option>
              <option value="PARCIAL">Parcial</option>
              <option value="PAGADO">Pagado</option>
            </Select>
          </div>
          <div className="mt-4">
            <Textarea label="Notas" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Observaciones adicionales..." />
          </div>
        </Card>

        <div className="flex justify-end gap-3 pb-8">
          <Link href="/vehiculos"><Button variant="secondary" type="button">Cancelar</Button></Link>
          <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Crear ficha de ingreso'}</Button>
        </div>
      </form>
    </div>
  )
}
