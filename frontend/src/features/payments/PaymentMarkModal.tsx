import { useState } from 'react'
import { useMarkPaymentMutation } from './paymentsApi'
import { formatDate } from '@/shared/lib/formatDate'
import { formatMoney } from '@/shared/lib/formatMoney'

interface Props {
  payment: { id: number; contractId: number; dueDate: string; amount: number }
  car?: { plateNumber: string; brand?: string; model?: string }
  driver?: { fullName: string }
  onClose: () => void
  onSuccess: () => void
}

export function PaymentMarkModal({ payment, car, driver, onClose, onSuccess }: Props) {
  const [paidDate, setPaidDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [markPayment, { isLoading, error }] = useMarkPaymentMutation()

  const handleConfirm = async () => {
    await markPayment({ contractId: payment.contractId, paymentId: payment.id }).unwrap()
    onSuccess()
  }

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(32,30,29,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
    >
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '22px', maxWidth: '440px', width: '100%', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1a1a2e' }}>Отметить оплату</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#615D73' }}>×</button>
        </div>

        <div style={{ marginBottom: '20px', padding: '16px', borderRadius: '12px', background: '#F8F6FF', border: '1px solid #E6E3F0' }}>
          {car && <p style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 600, color: '#1a1a2e' }}>{car.plateNumber} {car.brand && car.model ? `— ${car.brand} ${car.model}` : ''}</p>}
          {driver && <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#615D73' }}>{driver.fullName}</p>}
          <p style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: 700, color: '#1a1a2e' }}>{formatMoney(payment.amount)}</p>
          <p style={{ margin: 0, fontSize: '13px', color: '#615D73' }}>По графику: {formatDate(payment.dueDate)}</p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#615D73' }}>
            Фактическая дата оплаты
          </label>
          <input
            type="date"
            value={paidDate}
            onChange={e => setPaidDate(e.target.value)}
            style={{ width: '100%', height: '44px', borderRadius: '14px', background: '#F5F4FA', border: '1px solid #E6E3F0', padding: '0 14px', fontSize: '15px', color: '#1a1a2e', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {error && (
          <div style={{ marginBottom: '16px', padding: '12px', borderRadius: '8px', background: '#FDEAEA', border: '1px solid #C62828', color: '#C62828', fontSize: '13px' }}>
            Ошибка при сохранении
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: '12px', border: '1px solid #E0DCEC', background: 'transparent', cursor: 'pointer', color: '#615D73', fontSize: '14px' }}>
            Отмена
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            style={{ padding: '10px 24px', borderRadius: '12px', border: 'none', background: '#6B3FE4', color: 'white', cursor: 'pointer', fontWeight: 500, fontSize: '14px', opacity: isLoading ? 0.7 : 1 }}
          >
            {isLoading ? 'Сохранение...' : 'Отметить оплаченным'}
          </button>
        </div>
      </div>
    </div>
  )
}
