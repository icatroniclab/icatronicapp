'use client'
import { useState } from 'react'
import { VEHICLE_BRANDS, BRAND_NAMES } from '@/lib/vehicleData'

const CUSTOM = '__custom__'

const inputClass =
  'w-full bg-[#111c2e] border border-[rgba(0,229,255,0.18)] rounded-[2px] px-3 py-2.5 text-[#e8f0f4] placeholder-[#4a6a80] focus:outline-none focus:border-[#00b8cc] focus:shadow-[0_0_0_3px_rgba(0,229,255,0.18)] transition-all duration-200 text-sm font-light'

function resolveBrandSel(brand: string) {
  if (!brand) return ''
  return BRAND_NAMES.includes(brand) ? brand : CUSTOM
}

function resolveModelSel(brand: string, model: string) {
  if (!model) return ''
  const models = VEHICLE_BRANDS[brand] ?? []
  return models.includes(model) ? model : CUSTOM
}

interface Props {
  brand: string
  model: string
  onBrandChange: (v: string) => void
  onModelChange: (v: string) => void
}

export function BrandModelSelect({ brand, model, onBrandChange, onModelChange }: Props) {
  const [brandSel, setBrandSel] = useState(() => resolveBrandSel(brand))
  const [modelSel, setModelSel] = useState(() => resolveModelSel(brand, model))
  const [customBrand, setCustomBrand] = useState(() => resolveBrandSel(brand) === CUSTOM ? brand : '')
  const [customModel, setCustomModel] = useState(() => resolveModelSel(brand, model) === CUSTOM ? model : '')

  function handleBrandSel(val: string) {
    setBrandSel(val)
    setModelSel('')
    setCustomModel('')
    onModelChange('')
    if (val === CUSTOM) {
      onBrandChange(customBrand)
    } else {
      onBrandChange(val)
    }
  }

  function handleCustomBrand(val: string) {
    setCustomBrand(val)
    onBrandChange(val)
  }

  function handleModelSel(val: string) {
    setModelSel(val)
    if (val === CUSTOM) {
      onModelChange(customModel)
    } else {
      setCustomModel('')
      onModelChange(val)
    }
  }

  function handleCustomModel(val: string) {
    setCustomModel(val)
    onModelChange(val)
  }

  const availableModels = brandSel && brandSel !== CUSTOM ? (VEHICLE_BRANDS[brandSel] ?? []) : []

  return (
    <>
      {/* Marca */}
      <div>
        <label className="text-xs text-gray-400 mb-1 block">Marca *</label>
        <select
          value={brandSel}
          onChange={e => handleBrandSel(e.target.value)}
          required
          className={inputClass}
        >
          <option value="" disabled>Seleccionar marca...</option>
          {BRAND_NAMES.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
          <option value={CUSTOM}>— Otra marca —</option>
        </select>
        {brandSel === CUSTOM && (
          <input
            type="text"
            value={customBrand}
            onChange={e => handleCustomBrand(e.target.value)}
            required
            placeholder="Escribir marca..."
            className={`${inputClass} mt-2`}
          />
        )}
      </div>

      {/* Modelo */}
      <div>
        <label className="text-xs text-gray-400 mb-1 block">Modelo *</label>
        {brandSel && brandSel !== CUSTOM ? (
          <>
            <select
              value={modelSel}
              onChange={e => handleModelSel(e.target.value)}
              required
              className={inputClass}
            >
              <option value="" disabled>Seleccionar modelo...</option>
              {availableModels.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
              <option value={CUSTOM}>— Otro modelo —</option>
            </select>
            {modelSel === CUSTOM && (
              <input
                type="text"
                value={customModel}
                onChange={e => handleCustomModel(e.target.value)}
                required
                placeholder="Escribir modelo..."
                className={`${inputClass} mt-2`}
              />
            )}
          </>
        ) : (
          <input
            type="text"
            value={brandSel === CUSTOM ? customModel : ''}
            onChange={e => handleCustomModel(e.target.value)}
            required={brandSel === CUSTOM}
            placeholder={brandSel === CUSTOM ? 'Escribir modelo...' : 'Seleccionar marca primero'}
            disabled={!brandSel}
            className={`${inputClass} ${!brandSel ? 'opacity-40 cursor-not-allowed' : ''}`}
          />
        )}
      </div>
    </>
  )
}
