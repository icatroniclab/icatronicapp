'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { BrandModelSelect } from '@/components/BrandModelSelect'

const LIGHTS = [
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

const DAMAGE_ZONES = [
  'Frente', 'Paragolpes delantero', 'Capot', 'Techo', 'Baúl',
  'Paragolpes trasero', 'Lateral izquierdo', 'Lateral derecho',
  'Espejo izquierdo', 'Espejo derecho', 'Parabrisas', 'Luneta',
]

const ENGINE_TYPES = ['Nafta', 'Diesel', 'GNC', 'Híbrido', 'Eléctrico']

export default function EditarVehiculoPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [vehicle, setVehicle] = useState<any>(null)
  const [vForm, setVForm] = useState<any>({})
  const [orders, setOrders] = useState<any[]>([])
  const [orderForms, setOrderForms] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/vehiculos/${id}`)
      .then(r => r.json())
      .then(data => {
        setVehicle(data)
        setVForm({
          plate: data.plate || '',
          brand: data.brand || '',
          model: data.model || '',
          year: data.year?.toString() || '',
          km: data.km?.toString() || '',
          color: data.color || '',
          engineType: data.engineType || '',
          displacement: data.displacement || '',
          engineCode: data.engineCode || '',
        })
        setOrders(data.workOrders || [])
        const forms: Record<string, any> = {}
        for (const wo of data.workOrders || []) {
          forms[wo.id] = {
            motive: wo.motive || '',
            entryDate: wo.entryDate ? new Date(wo.entryDate).toISOString().slice(0, 16) : '',
            missingItems: wo.missingItems || '',
            valuables: wo.valuables || '',
            notes: wo.notes || '',
            damageZones: wo.damageZones ? JSON.parse(wo.damageZones) : [],
            ...Object.fromEntries(LIGHTS.map(l => [l.key, !!(wo as any)[l.key]])),
          }
        }
        setOrderForms(forms)
        if (data.workOrders?.length > 0) setExpandedOrder(data.workOrders[0].id)
      })
  }, [id])

  function showSaved(msg: string) {
    setSavedMsg(msg)
    setTimeout(() => setSavedMsg(null), 2500)
  }

  async function saveVehicle() {
    setSaving('vehicle')
    const payload = {
      ...vForm,
      year: vForm.year ? parseInt(vForm.year) : null,
      km: vForm.km ? parseInt(vForm.km) : null,
    }
    await fetch(`/api/vehiculos/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    setSaving(null)
    showSaved('Vehículo guardado')
  }

  async function saveOrder(orderId: string) {
    setSaving(orderId)
    const form = orderForms[orderId]
    await fetch(`/api/ordenes/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(null)
    showSaved('Ingreso guardado')
  }

  function setOrderField(orderId: string, field: string, value: any) {
    setOrderForms(prev => ({ ...prev, [orderId]: { ...prev[orderId], [field]: value } }))
  }

  function toggleDamage(orderId: string, zone: string) {
    setOrderForms(prev => {
      const curr = prev[orderId]?.damageZones || []
      return {
        ...prev,
        [orderId]: {
          ...prev[orderId],
          damageZones: curr.includes(zone) ? curr.filter((z: string) => z !== zone) : [...curr, zone],
        },
      }
    })
  }

  if (!vehicle) return <div className="text-gray-400 p-8">Cargando...</div>

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition">
          <ArrowLeft size={16} /> Volver
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Editar vehículo</h1>
          <p className="text-gray-400 text-sm">{vehicle.plate} — {vehicle.brand} {vehicle.model}</p>
        </div>
        {savedMsg && <span className="text-emerald-400 text-sm font-medium">{savedMsg} ✓</span>}
      </div>

      {/* Datos del vehículo */}
      <Card>
        <h2 className="font-semibold text-white mb-4">Datos del vehículo</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Patente" value={vForm.plate} onChange={v => setVForm((p: any) => ({ ...p, plate: v }))} />
          <BrandModelSelect
            key={vehicle?.id}
            brand={vForm.brand}
            model={vForm.model}
            onBrandChange={v => setVForm((p: any) => ({ ...p, brand: v }))}
            onModelChange={v => setVForm((p: any) => ({ ...p, model: v }))}
          />
          <Field label="Año" value={vForm.year} onChange={v => setVForm((p: any) => ({ ...p, year: v }))} type="number" />
          <Field label="KM" value={vForm.km} onChange={v => setVForm((p: any) => ({ ...p, km: v }))} type="number" />
          <Field label="Color" value={vForm.color} onChange={v => setVForm((p: any) => ({ ...p, color: v }))} />
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Motor</label>
            <select value={vForm.engineType} onChange={e => setVForm((p: any) => ({ ...p, engineType: e.target.value }))} className="w-full bg-[#1e2d42] border border-[#253652] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
              <option value="">—</option>
              {ENGINE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <Field label="Cilindrada" value={vForm.displacement} onChange={v => setVForm((p: any) => ({ ...p, displacement: v }))} placeholder="ej: 1.6" />
          <Field label="Cód. motor" value={vForm.engineCode} onChange={v => setVForm((p: any) => ({ ...p, engineCode: v }))} placeholder="ej: BFQ" />
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={saveVehicle} disabled={saving === 'vehicle'}>
            <Save size={14} /> {saving === 'vehicle' ? 'Guardando...' : 'Guardar vehículo'}
          </Button>
        </div>
      </Card>

      {/* Órdenes de trabajo */}
      <h2 className="text-lg font-semibold text-white">Ingresos / Órdenes</h2>
      {orders.map((wo, idx) => {
        const form = orderForms[wo.id] || {}
        const isOpen = expandedOrder === wo.id
        return (
          <Card key={wo.id} className="overflow-hidden">
            <button
              onClick={() => setExpandedOrder(isOpen ? null : wo.id)}
              className="w-full flex items-center justify-between text-left"
            >
              <div>
                <p className="font-medium text-white text-sm">
                  {idx === 0 ? 'Último ingreso' : `Ingreso #${orders.length - idx}`}
                  <span className="ml-2 text-gray-500 font-normal text-xs">
                    {new Date(wo.entryDate).toLocaleDateString('es-AR')}
                  </span>
                </p>
                <p className="text-gray-400 text-xs mt-0.5 truncate max-w-sm">{wo.motive}</p>
              </div>
              {isOpen ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
            </button>

            {isOpen && (
              <div className="mt-4 space-y-4 border-t border-[#253652] pt-4">
                {/* Fecha de ingreso */}
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Fecha de ingreso</label>
                  <input
                    type="datetime-local"
                    value={form.entryDate}
                    onChange={e => setOrderField(wo.id, 'entryDate', e.target.value)}
                    className="w-full bg-[#1e2d42] border border-[#253652] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Motivo */}
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Motivo de ingreso</label>
                  <textarea
                    value={form.motive}
                    onChange={e => setOrderField(wo.id, 'motive', e.target.value)}
                    rows={2}
                    className="w-full bg-[#1e2d42] border border-[#253652] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                {/* Luces de tablero */}
                <div>
                  <label className="text-xs text-gray-400 mb-2 block">Luces de tablero encendidas</label>
                  <div className="flex flex-wrap gap-2">
                    {LIGHTS.map(l => (
                      <button
                        key={l.key}
                        onClick={() => setOrderField(wo.id, l.key, !form[l.key])}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                          form[l.key]
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                            : 'bg-[#1e2d42] border-[#253652] text-gray-400 hover:border-gray-500'
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Zonas de daño */}
                <div>
                  <label className="text-xs text-gray-400 mb-2 block">Zonas con daño / marcas</label>
                  <div className="flex flex-wrap gap-2">
                    {DAMAGE_ZONES.map(z => {
                      const active = form.damageZones?.includes(z)
                      return (
                        <button
                          key={z}
                          onClick={() => toggleDamage(wo.id, z)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                            active
                              ? 'bg-red-500/20 border-red-500/50 text-red-300'
                              : 'bg-[#1e2d42] border-[#253652] text-gray-400 hover:border-gray-500'
                          }`}
                        >
                          {z}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Faltantes / Objetos de valor / Notas */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="Faltantes" value={form.missingItems} onChange={v => setOrderField(wo.id, 'missingItems', v)} />
                  <Field label="Objetos de valor" value={form.valuables} onChange={v => setOrderField(wo.id, 'valuables', v)} />
                </div>
                <Field label="Notas" value={form.notes} onChange={v => setOrderField(wo.id, 'notes', v)} />

                <div className="flex justify-end">
                  <Button onClick={() => saveOrder(wo.id)} disabled={saving === wo.id}>
                    <Save size={14} /> {saving === wo.id ? 'Guardando...' : 'Guardar ingreso'}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )
      })}

      {orders.length === 0 && (
        <Card className="text-center py-6">
          <p className="text-gray-500 text-sm">Sin ingresos registrados</p>
        </Card>
      )}
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder = '' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string
}) {
  return (
    <div>
      <label className="text-xs text-gray-400 mb-1 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#1e2d42] border border-[#253652] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
      />
    </div>
  )
}
