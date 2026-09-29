import { useState } from 'react'
import { useGetPaymentsQuery } from './paymentsApi'
import { PaymentMarkModal } from './PaymentMarkModal'
import { PaymentStatusBadge } from './PaymentStatusBadge'
import { FilterChips } from '@/shared/ui/FilterChips'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Spinner } from '@/shared/ui/Spinner'
import { formatDate } from '@/shared/lib/formatDate'
import { formatMoney } from '@/shared/lib/formatMoney'
import { daysOverdue } from '@/shared/lib/daysUntil'
import type { Payment } from '@/shared/types'

const FILTERS = [
  { label: 'Просроченные', value: 'OVERDUE' },
  { label: 'Ожидаемые', value: 'UNPAID' },
  { label: 'Все', value: '' },
]

export function PaymentsPage() {
  const [status, setStatus] = useState('OVERDUE')
  const [sortBy, setSortBy] = useState<'days' | 'amount'>('days')
  const [payModal, setPayModal] = useState<Payment | null>(null)

  const { data, isLoading, refetch } = useGetPaymentsQuery(status ? { status } : {})
  const payments = data?.payments ?? []

  const overdueCount = payments.filter(p => p.status === 'OVERDUE').length
  const unpaidCount = payments.filter(p => p.status === 'UNPAID').length

  const sorted = [...payments].sort((a, b) => {
    if (sortBy === 'days') return daysOverdue(a.dueDate) > daysOverdue(b.dueDate) ? -1 : 1
    return Number(b.amount) - Number(a.amount)
  })

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: '0 0 6px', fontSize: '34px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>Должники</h1>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-muted)' }}>
          <span style={{ color: 'var(--color-danger)' }}>{overdueCount} просрочено</span>
          {' · '}
          <span style={{ color: 'var(--color-warning)' }}>{unpaidCount} ожидается</span>
        </p>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <FilterChips chips={FILTERS} active={status} onChange={setStatus} />
        <div style={{ display: 'flex', background: 'rgba(186,214,247,0.06)', borderRadius: '999px', padding: '3px', border: '1px solid var(--color-neutral-border)' }}>
          {(['days', 'amount'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              style={{
                padding: '5px 14px', borderRadius: '999px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500,
                background: sortBy === s ? 'var(--color-accent)' : 'transparent',
                color: sortBy === s ? 'white' : 'var(--color-text-muted)',
                transition: 'all 0.15s',
              }}
            >
              {s === 'days' ? 'По дням' : 'По сумме'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '40px' }}><Spinner size={32} /></div>
      ) : sorted.length === 0 ? (
        <EmptyState message="Должников нет" />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-neutral-border)' }}>
                {['Машина', 'Водитель', 'По графику', 'Сумма', 'Просрочено', 'Статус', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '14px 16px', fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((p: Payment) => {
                const days = daysOverdue(p.dueDate)
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--color-neutral-border)' }}>
                    <td style={{ padding: '14px 16px', fontSize: '14px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', display: 'block' }}>{p.contract?.car?.plateNumber ?? '—'}</span>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{p.contract?.car?.brand} {p.contract?.car?.model}</span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>{p.contract?.driver?.fullName ?? '—'}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: 'var(--color-text-muted)' }}>{formatDate(p.dueDate)}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{formatMoney(p.amount)}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: days > 0 ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
                      {days > 0 ? `${days} дн.` : '—'}
                    </td>
                    <td style={{ padding: '14px 16px' }}><PaymentStatusBadge status={p.status} /></td>
                    <td style={{ padding: '14px 16px' }}>
                      {p.status !== 'PAID' && (
                        <button
                          onClick={() => setPayModal(p)}
                          style={{ padding: '6px 14px', borderRadius: '999px', border: 'none', cursor: 'pointer', background: 'var(--color-accent-bg)', color: 'var(--color-accent-text)', fontSize: '13px', fontWeight: 500 }}
                        >
                          Оплатить
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {payModal && (
        <PaymentMarkModal
          payment={payModal}
          car={payModal.contract?.car}
          driver={payModal.contract?.driver}
          onClose={() => setPayModal(null)}
          onSuccess={() => { setPayModal(null); refetch() }}
        />
      )}
    </div>
  )
}
