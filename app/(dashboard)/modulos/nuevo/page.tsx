'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Cpu, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { ClientSearchInput } from '@/components/ClientSearchInput'

interface ModuleItem {
  moduleTypeId: string
  moduleBrand: string
  partNumber: string
  serialNumber: string
  notes: string
}

const emptyModule = (): ModuleItem => ({
  moduleTypeId: '',
  moduleBrand: '',
  partNumber: '',
  serialNumber: '',
  notes: '',
})

export default function NuevoModuloPage() {
  const router = useRouter()
  const [moduleTypes, setModuleTypes] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [selectedClient, setSelectedClient] = useState<any>(null)

  const [form, setForm] = useState({
    clientType: 'TALLERISTA',
    vehicleBrand: '',
    vehicleModel: '',
    vehicleYear: '',
    motive: '',
    workType: 'DIAGNOSTICO',
    notes: '',
  })

  const [modules, setModules] = useState<ModuleItem[]>([emptyModule()])

  useEffect(() => {
    fetch('/api/modulos/tipos').then(r => r.json()).then(setModuleTypes)
  }, [])

  function setField(field: string, value: string | boolean) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function setModuleField(index: number, field: keyof ModuleItem, value: string) {
    setModules(ms => ms.map((m, i) => i === index ? { ...m, [field]: value } : m))
  }

  function addModule() {
    setModules(ms => [...ms, emptyModule()])
  }

  function removeModule(index: number) {
    setModules(ms => ms.filter((_, i) => i !== index))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (modules.some(m => !m.moduleTypeId)) { setError('Seleccioná el tipo para cada módulo'); return }
    if (!form.motive.trim()) { setError('El motivo es requerido'); return }

    if (!selectedClient) { setError('Seleccioná o creá un cliente'); return }
    setSaving(true)
    setError('')
    const res = await fetch('/api/modulos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        clientId: selectedClient.id,
        techName: null,
        techPhone: null,
        modules,
      }),
    })
    if (!res.ok) {
      const e = await res.json()
      setError(e.error || 'Error al guardar')
      setSaving(false)
      return
    }
    const job = await res.json()
    router.push(`/modulos/${job.id}`)
  }

  const labelClass = 'block text-[0.7rem] font-semibold text-[#7a9aaa] uppercase tracking-[0.2em] mb-1.5'
  const inputClass = 'w-full bg-[#192638] border border-[rgba(0,229,255,0.14)] rounded-[2px] px-3 py-2.5 text-[#e8f0f4] placeholder-[#4a6070] focus:outline-none focus:border-[#00b8cc] text-sm'

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/modulos">
          <Button variant="ghost" size="sm"><ArrowLeft size={16} /> Volver</Button>
        </Link>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Cpu size={22} className="text-[#00e5ff]" /> Ingresar módulos
        </h1>
      </div>

      <form onSubmit={submit} className="space-y-5">

        {/* Cliente */}
        <Card>
          <h2 className="text-sm font-semibold text-[#00e5ff] uppercase tracking-widest mb-4">Cliente / Colega</h2>
          <ClientSearchInput
            value={selectedClient}
            onChange={c => {
              setSelectedClient(c)
              if (c) setField('clientType', c.type === 'TALLERISTA' ? 'TALLERISTA' : 'PARTICULAR')
            }}
            defaultType="TALLERISTA"
          />
          <div className="mt-3">
            <Select label="Tipo de cliente" value={form.clientType} onChange={e => setField('clientType', e.target.value)}>
              <option value="TALLERISTA">Tallerista / Colega</option>
              <option value="PARTICULAR">Particular</option>
            </Select>
          </div>
        </Card>

        {/* Vehículo */}
        <Card>
          <h2 className="text-sm font-semibold text-[#00e5ff] uppercase tracking-widest mb-4">Vehículo de origen</h2>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Marca" value={form.vehicleBrand} onChange={e => setField('vehicleBrand', e.target.value)} placeholder="Ej: Volkswagen" />
            <Input label="Modelo" value={form.vehicleModel} onChange={e => setField('vehicleModel', e.target.value)} placeholder="Ej: Golf" />
            <Input label="Año" value={form.vehicleYear} onChange={e => setField('vehicleYear', e.target.value)} type="number" placeholder="Ej: 2018" />
          </div>
        </Card>

        {/* Módulos */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#00e5ff] uppercase tracking-widest">
              Módulos ingresados
              <span className="ml-2 text-gray-500 normal-case font-normal text-xs">({modules.length})</span>
            </h2>
            <Button type="button" size="sm" onClick={addModule}>
              <Plus size={13} /> Agregar módulo
            </Button>
          </div>

          <div className="space-y-4">
            {modules.map((mod, index) => (
              <div key={index} className="bg-[#111c2e] border border-[rgba(0,229,255,0.1)] rounded-[2px] p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[#7a9aaa] text-xs uppercase tracking-widest">Módulo #{index + 1}</span>
                  {modules.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeModule(index)}
                      className="text-gray-600 hover:text-red-400 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className={labelClass}>Tipo de módulo *</label>
                    <select
                      value={mod.moduleTypeId}
                      onChange={e => setModuleField(index, 'moduleTypeId', e.target.value)}
                      className={inputClass}
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2300e5ff' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 12px center',
                        paddingRight: '36px',
                        appearance: 'none',
                      }}
                    >
                      <option value="">— Seleccionar tipo —</option>
                      {moduleTypes.map((t: any) => (
                        <option key={t.id} value={t.id}>{t.name}{t.description ? ` — ${t.description}` : ''}</option>
                      ))}
                    </select>
                  </div>
                  <Input
                    label="Marca"
                    value={mod.moduleBrand}
                    onChange={e => setModuleField(index, 'moduleBrand', e.target.value)}
                    placeholder="Ej: Bosch"
                  />
                  <Input
                    label="Nº de parte"
                    value={mod.partNumber}
                    onChange={e => setModuleField(index, 'partNumber', e.target.value)}
                    placeholder="Ej: 0281010"
                  />
                  <Input
                    label="Nº de serie"
                    value={mod.serialNumber}
                    onChange={e => setModuleField(index, 'serialNumber', e.target.value)}
                    placeholder="Opcional"
                  />
                  <Input
                    label="Notas del módulo"
                    value={mod.notes}
                    onChange={e => setModuleField(index, 'notes', e.target.value)}
                    placeholder="Condición, observaciones..."
                  />
                </div>
              </div>
            ))}
          </div>

          {moduleTypes.length === 0 && (
            <p className="text-yellow-400 text-xs mt-3">
              No hay tipos de módulo cargados.{' '}
              <Link href="/modulos/tipos" className="underline" target="_blank">Cargar tipos</Link>
            </p>
          )}
        </Card>

        {/* Trabajo */}
        <Card>
          <h2 className="text-sm font-semibold text-[#00e5ff] uppercase tracking-widest mb-4">Trabajo a realizar</h2>
          <div className="space-y-3">
            <Select label="Tipo de trabajo" value={form.workType} onChange={e => setField('workType', e.target.value)}>
              <option value="DIAGNOSTICO">Diagnóstico en banco</option>
              <option value="REPARACION">Reparación</option>
              <option value="PROGRAMACION">Programación</option>
            </Select>
            <div>
              <label className={labelClass}>Motivo de ingreso *</label>
              <textarea
                className={inputClass + ' resize-none'}
                rows={3}
                value={form.motive}
                onChange={e => setField('motive', e.target.value)}
                placeholder="Describí el problema o el trabajo solicitado..."
              />
            </div>
            <div>
              <label className={labelClass}>Notas adicionales</label>
              <textarea
                className={inputClass + ' resize-none'}
                rows={2}
                value={form.notes}
                onChange={e => setField('notes', e.target.value)}
                placeholder="Observaciones generales del ingreso..."
              />
            </div>
          </div>
        </Card>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3 justify-end">
          <Link href="/modulos"><Button variant="secondary" type="button">Cancelar</Button></Link>
          <Button type="submit" disabled={saving}>
            {saving ? 'Guardando...' : `Ingresar ${modules.length === 1 ? '1 módulo' : `${modules.length} módulos`}`}
          </Button>
        </div>
      </form>
    </div>
  )
}
