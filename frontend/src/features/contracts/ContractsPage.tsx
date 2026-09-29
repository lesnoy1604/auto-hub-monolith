import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useGetContractsQuery } from './contractsApi'
import { ContractStatusBadge } from './ContractStatusBadge'
import { ContractFormModal } from './ContractFormModal'
import { FilterChips } from '@/shared/ui/FilterChips'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Spinner } from '@/shared/ui/Spinner'
import { formatDate } from '@/shared/lib/formatDate'
import { formatMoney } from '@/shared/lib/formatMoney'
import type { Contract } from '@/shared/types'

const FILTERS = [
  { label: 'Все', value: '' },
  { label: 'Активные', value: 'ACTIVE' },
  { label: 'Завершённые', value: 'COMPLETED' },
  { label: 'Отменённые', value: 'CANCELLED' },
]

export function ContractsPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const { data, isLoading } = useGetContractsQuery(status ? { status } : {})
  const contracts = data?.contracts ?? []

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '34px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
          Договоры <span style={{ fontSize: '20px', color: 'var(--color-text-muted)', fontWeight: 400 }}>{contracts.length}</span>
        </h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Новый договор</button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <FilterChips chips={FILTERS} active={status} onChange={setStatus} />
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '40px' }}><Spinner size={32} /></div>
      ) : contracts.length === 0 ? (
        <EmptyState message="Договоры не найдены" />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-neutral-border)' }}>
                {['Машина', 'Водитель', 'Начало', 'Платёж/мес', 'Остаток', 'Статус'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '14px 16px', fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contracts.map((c: Contract) => {
                const paidAmount = c.payments?.filter(p => p.status === 'PAID').reduce((s, p) => s + Number(p.amount), 0) ?? 0
                const remaining = Number(c.totalAmount) - paidAmount
                return (
                  <tr key={c.id} onClick={() => navigate(`/contracts/${c.id}`)} style={{ borderBottom: '1px solid var(--color-neutral-border)', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(186,214,247,0.03)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '14px 16px', fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{c.car?.plateNumber ?? '—'}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>{c.driver?.fullName ?? '—'}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: 'var(--color-text-muted)' }}>{formatDate(c.startDate)}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>{formatMoney(c.monthlyPayment)}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 600, color: remaining === 0 ? 'var(--color-success)' : 'var(--color-accent-text)' }}>{formatMoney(remaining)}</td>
                    <td style={{ padding: '14px 16px' }}><ContractStatusBadge status={c.status} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <ContractFormModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  )
}
