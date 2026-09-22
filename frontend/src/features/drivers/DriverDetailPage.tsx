import { useState } from 'react'
import { useParams, Link } from 'react-router'
import { useGetDriverByIdQuery } from './driversApi'
import { DriverFormModal } from './DriverFormModal'
import { ContractStatusBadge } from '@/features/contracts/ContractStatusBadge'
import { Spinner } from '@/shared/ui/Spinner'
import { formatDate } from '@/shared/lib/formatDate'
import { formatMoney } from '@/shared/lib/formatMoney'
import type { Contract } from '@/shared/types'

export function DriverDetailPage() {
  const { id } = useParams<{ id: string }>()
  const driverId = Number(id)
  const { data: driver, isLoading } = useGetDriverByIdQuery(driverId)
  const [showEditModal, setShowEditModal] = useState(false)

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}><Spinner size={36} /></div>
  if (!driver) return <div style={{ color: 'var(--color-text-muted)', padding: 40 }}>Водитель не найден</div>

  const activeContract = driver.contracts?.find(c => c.status === 'ACTIVE')
  const paidAmount = activeContract?.payments?.filter(p => p.status === 'PAID').reduce((s, p) => s + Number(p.amount), 0) ?? 0
  const remaining = activeContract ? Number(activeContract.totalAmount) - paidAmount : 0
  const progress = activeContract ? Math.min(100, Math.round((paidAmount / Number(activeContract.totalAmount)) * 100)) : 0

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '34px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>{driver.fullName}</h1>
          <p style={{ margin: 0, fontSize: '15px', color: 'var(--color-text-muted)' }}>{driver.phone}</p>
        </div>
        <button className="btn btn-secondary" onClick={() => setShowEditModal(true)}>Редактировать</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        {/* Documents */}
        <div className="card">
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Документы</h3>
          {[
            { label: 'Паспорт', value: driver.passportNum },
            { label: 'Водительское удостоверение', value: driver.licenseNum },
            { label: 'Дата добавления', value: formatDate(driver.createdAt) },
            { label: 'Статус', value: driver.status === 'ACTIVE' ? 'Активен' : 'Неактивен' },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--color-neutral-border)' }}>
              <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>{label}</span>
              <span style={{ fontSize: '14px', color: 'var(--color-text-primary)', fontFamily: label === 'Паспорт' || label === 'Водительское удостоверение' ? 'var(--font-mono)' : undefined }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Active contract */}
        <div className="card">
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Текущий договор</h3>
          {activeContract ? (
            <>
              <div style={{ marginBottom: '12px' }}>
                {[
                  { label: 'Машина', value: <Link to={`/cars/${activeContract.carId}`} style={{ color: 'var(--color-accent-text)' }}>{activeContract.car?.plateNumber ?? '—'}</Link> },
                  { label: 'Начало', value: formatDate(activeContract.startDate) },
                  { label: 'Платёж/мес', value: formatMoney(activeContract.monthlyPayment) },
                  { label: 'Остаток', value: formatMoney(remaining) },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>{label}</span>
                    <span style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{value}</span>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Выкуп</span>
                  <span style={{ fontSize: '12px', color: 'var(--color-accent-text)' }}>{progress}%</span>
                </div>
                <div style={{ height: '6px', borderRadius: '999px', background: 'rgba(186,214,247,0.1)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progress}%`, background: 'var(--color-accent)', borderRadius: '999px' }} />
                </div>
              </div>
            </>
          ) : <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Нет активного договора</p>}
        </div>
      </div>

      {/* Contract history */}
      <div className="card">
        <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>История договоров</h3>
        {(driver.contracts ?? []).length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Нет договоров</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-neutral-border)' }}>
                {['Начало', 'Машина', 'Сумма', 'Статус'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 16px 10px 0', fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...(driver.contracts ?? [])].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map((c: Contract) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--color-neutral-border)' }}>
                  <td style={{ padding: '12px 16px 12px 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>{formatDate(c.startDate)}</td>
                  <td style={{ padding: '12px 16px 12px 0' }}>
                    <Link to={`/cars/${c.carId}`} style={{ fontSize: '14px', color: 'var(--color-accent-text)' }}>{c.car?.plateNumber ?? '—'}</Link>
                  </td>
                  <td style={{ padding: '12px 16px 12px 0', fontSize: '14px', color: 'var(--color-text-primary)' }}>{formatMoney(c.totalAmount)}</td>
                  <td style={{ padding: '12px 0' }}><ContractStatusBadge status={c.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <DriverFormModal open={showEditModal} onClose={() => setShowEditModal(false)} driver={driver} />
    </div>
  )
}
