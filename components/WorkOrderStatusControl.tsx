'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatCurrency } from '@/lib/utils'

export function WorkOrderStatusControl({ order }: { order: any }) {
  const router = useRouter()
  const [workStatus, setWorkStatus] = useState(order.workStatus)
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus)
  const [budget, setBudget] = useState(order.budget?.toString() || '')
  const [amountPaid, setAmountPaid] = useState(order.amountPaid?.toString() || '0')
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    await fetch(`/api/ordenes/${order.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workStatus, paymentStatus, budget, amountPaid }),
    })
    setSaving(false)
    router.refresh()
  }

  const budgetNum = parseFloat(budget) || 0
  const paidNum = parseFloat(amountPaid) || 0
  const saldo = budgetNum - paidNum

  return (
    <div className="bg-[#111c2e] border border-[#253652] rounded-lg p-4 space-y-3">
      <p className="text-xs text-gray-400 uppercase tracking-wide">Actualizar estado</p>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[140px]">
          <Select label="Estado trabajo" value={workStatus} onChange={e => setWorkStatus(e.target.value)}>
            <option value="INGRESADO">Ingresado</option>
            <option value="EN_PROCESO">En proceso</option>
            <option value="LISTO">Listo</option>
            <option value="ENTREGADO">Entregado</option>
          </Select>
        </div>
        <div className="flex-1 min-w-[140px]">
          <Select label="Estado pago" value={paymentStatus} onChange={e => {
            setPaymentStatus(e.target.value)
            if (e.target.value === 'PAGADO' && budgetNum > 0) setAmountPaid(budget)
          }}>
            <option value="PENDIENTE">Pendiente</option>
            <option value="SENA">Seña</option>
            <option value="PARCIAL">Parcial</option>
            <option value="PAGADO">Pagado</option>
          </Select>
        </div>
        <div className="flex-1 min-w-[120px]">
          <Input label="Presupuesto ($)" value={budget} onChange={e => setBudget(e.target.value)} type="number" step="0.01" />
        </div>
        <div className="flex-1 min-w-[120px]">
          <Input label="Pagado ($)" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} type="number" step="0.01" />
        </div>
        <Button onClick={save} disabled={saving} variant="secondary">
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>

      {budgetNum > 0 && (
        <div className="flex gap-4 pt-1 border-t border-[#253652] flex-wrap">
          <div className="text-xs">
            <span className="text-gray-400">Presupuesto: </span>
            <span className="text-white font-medium">{formatCurrency(budgetNum)}</span>
          </div>
          <div className="text-xs">
            <span className="text-gray-400">Pagado: </span>
            <span className="text-emerald-400 font-medium">{formatCurrency(paidNum)}</span>
          </div>
          <div className="text-xs">
            <span className="text-gray-400">Saldo: </span>
            <span className={`font-medium ${saldo > 0 ? 'text-yellow-400' : 'text-emerald-400'}`}>
              {formatCurrency(saldo)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
