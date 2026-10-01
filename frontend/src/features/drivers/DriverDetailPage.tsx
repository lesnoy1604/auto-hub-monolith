import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router'
import { useGetDriverByIdQuery, useDeleteDriverMutation } from './driversApi'
import { DriverFormModal } from './DriverFormModal'
import { DriverDocumentsCard } from './DriverDocumentsCard'
import { ContractStatusBadge } from '@/features/contracts/ContractStatusBadge'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { PaymentMarkModal } from '@/features/payments/PaymentMarkModal'
import { Spinner } from '@/shared/ui/Spinner'
import { formatDate } from '@/shared/lib/formatDate'
import { formatMoney } from '@/shared/lib/formatMoney'
import { getApiError } from '@/shared/lib/apiError'
import type { Contract, Payment } from '@/shared/types'

const MONTHS_RU = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']

function dotColor(status: string) {
  if (status === 'PAID') return '#4ade80'
  if (status === 'OVERDUE') return '#ef4444'
  return '#fb923c'
}

export function DriverDetailPage() {
  const { id } = useParams<{ id: string }>()
  const driverId = Number(id)
  const navigate = useNavigate()
  const { data: driver, isLoading, refetch } = useGetDriverByIdQuery(driverId)
  const [deleteDriver, { isLoading: deleting }] = useDeleteDriverMutation()
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [payModal, setPayModal] = useState<Payment | null>(null)

  const handleDelete = async () => {
    try {
      await deleteDriver(driverId).unwrap()
      navigate('/drivers')
    } catch (err) {
      setDeleteError(getApiError(err))
    }
  }

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}><Spinner size={36} /></div>
  if (!driver) return <div style={{ color: 'var(--color-text-muted)', padding: 40 }}>Водитель не найден</div>

  const contracts: Contract[] = (driver.contracts ?? []) as unknown as Contract[]
  const sortedContracts = [...contracts].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
  const activeContract = contracts.find(c => c.status === 'ACTIVE')
  const displayContract = activeContract ?? sortedContracts[0] ?? null
  const payments: Payment[] = (displayContract?.payments ?? []) as Payment[]
  const sortedPayments = [...payments].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

  const paidAmount = Number(displayContract?.paidAmount ?? 0)
  const totalAmount = Number(displayContract?.totalAmount ?? 0)
  const remaining = totalAmount - paidAmount
  const progress = totalAmount > 0 ? Math.min(100, Math.round((paidAmount / totalAmount) * 100)) : 0

  // События
  const events: { color: string; title: string; subtitle: string }[] = []
  events.push({ color: '#6B3FE4', title: 'Клиент добавлен в систему', subtitle: formatDate(driver.createdAt) })
  for (const c of sortedContracts) {
    const car = (c as any).car
    const plate = car?.plateNumber ?? '—'
    if (c.endDate && new Date(c.endDate) < new Date() && c.status !== 'COMPLETED') {
      events.unshift({ color: '#fb923c', title: 'Срок договора истёк, выкуп не завершён', subtitle: formatDate(c.endDate) })
    }
    events.push({ color: '#4ade80', title: `Договор открыт · ${plate}`, subtitle: `${formatDate(c.startDate)} · ${formatMoney(c.totalAmount)}` })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Header card */}
      <div className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', padding: '24px' }}>
        {/* Avatar */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: 88, height: 88, borderRadius: '16px', border: '2px dashed rgba(186,214,247,0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(186,214,247,0.04)', gap: 4 }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(107,63,228,0.6)" strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
            <span style={{ fontSize: '9px', color: 'rgba(186,214,247,0.3)', fontFamily: 'var(--font-mono)' }}>Фото водителя</span>
          </div>
          <div style={{ position: 'absolute', bottom: -6, right: -6, width: 24, height: 24, borderRadius: '50%', background: '#6B3FE4', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M20.4 14.5A8 8 0 1 1 9.5 3.6"/><path d="M15 3h6v6"/><path d="M10 14L21 3"/></svg>
          </div>
        </div>

        {/* Name + phone */}
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: '0 0 4px', fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)', lineHeight: 1.2 }}>{driver.fullName}</h1>
          <p style={{ margin: '0 0 16px', fontSize: '15px', color: 'var(--color-text-muted)' }}>{driver.phone}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <span className={driver.status === 'ACTIVE' ? 'badge badge-success' : 'badge badge-neutral'}>
              {driver.status === 'ACTIVE' ? 'Активен' : 'Неактивен'}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
              Паспорт <span style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>{driver.passportNum}</span>
            </span>
            <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
              ВУ <span style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>{driver.licenseNum}</span>
            </span>
            <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
              Добавлен <span style={{ color: 'var(--color-text-primary)' }}>{formatDate(driver.createdAt)}</span>
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          {activeContract && (
            <Link
              to={`/contracts/${activeContract.id}`}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
              Активный договор
            </Link>
          )}
          <button className="btn btn-secondary" onClick={() => setShowEditModal(true)}>Редактировать</button>
          <button className="btn btn-danger" onClick={() => { setDeleteError(''); setShowDeleteDialog(true) }}>Удалить</button>
        </div>
      </div>

      {/* Main 2-column */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px', alignItems: 'start' }}>

        {/* Left — buyout card */}
        {displayContract ? (
          <div className="card">
            {/* Contract header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Выкуп автомобиля</span>
                <Link
                  to={`/cars/${(displayContract as any).car?.id ?? ''}`}
                  style={{ padding: '3px 10px', borderRadius: '999px', background: 'rgba(107,63,228,0.15)', color: 'var(--color-accent-text)', fontSize: '13px', fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-mono)' }}
                >
                  {(displayContract as any).car?.plateNumber ?? '—'}
                </Link>
              </div>
              <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                {formatDate(displayContract.startDate)}{displayContract.endDate ? ` — ${formatDate(displayContract.endDate)}` : ''}
              </span>
            </div>

            {/* Amounts */}
            <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--color-text-muted)' }}>Осталось выплатить</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '20px' }}>
              <span style={{ fontSize: '42px', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>{formatMoney(remaining)}</span>
              <div style={{ display: 'flex', gap: '32px', paddingBottom: '4px' }}>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: '0 0 2px', fontSize: '12px', color: 'var(--color-text-muted)' }}>Оплачено</p>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{formatMoney(paidAmount)}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: '0 0 2px', fontSize: '12px', color: 'var(--color-text-muted)' }}>Платёж/мес</p>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{formatMoney(displayContract.monthlyPayment)}</p>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ height: '6px', borderRadius: '999px', background: 'rgba(186,214,247,0.1)', overflow: 'hidden', marginBottom: '6px' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: progress === 100 ? 'var(--color-success)' : 'var(--color-accent)', borderRadius: '999px', transition: 'width 0.3s' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{progress}%</span>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Выкуплено {formatMoney(paidAmount)} из {formatMoney(totalAmount)}</span>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>100%</span>
              </div>
            </div>

            {/* Payment months grid — grouped by year */}
            {sortedPayments.length > 0 && (() => {
              const currentYear = new Date().getFullYear()
              const byYear: Record<number, Payment[]> = {}
              for (const p of sortedPayments) {
                const y = new Date(p.dueDate).getFullYear()
                if (!byYear[y]) byYear[y] = []
                byYear[y].push(p)
              }
              const years = Object.keys(byYear).map(Number).sort((a, b) => b - a)
              const multiYear = years.length > 1

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {years.map(year => {
                    const all = byYear[year]
                    const visible = all
                    if (visible.length === 0) return null
                    return (
                      <div key={year}>
                        {multiYear && (
                          <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{year}</p>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
                          {visible.map(p => {
                            const d = new Date(p.dueDate)
                            const clickable = p.status !== 'PAID'
                            return (
                              <button
                                key={p.id}
                                onClick={() => clickable && setPayModal(p)}
                                style={{
                                  padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--color-neutral-border)',
                                  background: 'rgba(186,214,247,0.04)', textAlign: 'left',
                                  cursor: clickable ? 'pointer' : 'default', transition: 'background 0.15s',
                                }}
                                onMouseEnter={e => clickable && (e.currentTarget.style.background = 'rgba(186,214,247,0.09)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(186,214,247,0.04)')}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                  <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>{MONTHS_RU[d.getMonth()]}</span>
                                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor(p.status), flexShrink: 0 }} />
                                </div>
                                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{formatMoney(p.amount)}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        ) : (
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '15px' }}>Нет активного договора</p>
          </div>
        )}

        {/* Right — events + actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="card">
            <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)' }}>События</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {events.map((ev, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: ev.color, flexShrink: 0, marginTop: 3 }} />
                  <div>
                    <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)', lineHeight: 1.4 }}>{ev.title}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-muted)' }}>{ev.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* History table */}
      <div className="card">
        <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)' }}>История договоров</h3>
        {contracts.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Нет договоров</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-neutral-border)' }}>
                {['Период', 'Машина', 'Сумма', 'Оплачено', 'Статус'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 16px 10px 0', fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...contracts].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map((c: Contract) => {
                const car = (c as any).car
                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--color-neutral-border)' }}>
                    <td style={{ padding: '14px 16px 14px 0', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                      {formatDate(c.startDate)}{c.endDate ? ` — ${formatDate(c.endDate)}` : ''}
                    </td>
                    <td style={{ padding: '14px 16px 14px 0' }}>
                      {car ? (
                        <Link to={`/cars/${car.id ?? ''}`} style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-accent-text)', textDecoration: 'none', fontFamily: 'var(--font-mono)' }}>{car.plateNumber}</Link>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '14px 16px 14px 0', fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{formatMoney(c.totalAmount)}</td>
                    <td style={{ padding: '14px 16px 14px 0', fontSize: '14px', color: 'var(--color-text-secondary)' }}>{formatMoney(Number(c.paidAmount ?? 0))}</td>
                    <td style={{ padding: '14px 0' }}><ContractStatusBadge status={c.status} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <DriverDocumentsCard driverId={driverId} />

      <DriverFormModal open={showEditModal} onClose={() => setShowEditModal(false)} driver={driver} />
      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="Удалить водителя"
        message={`Удалить ${driver.fullName}? Это действие необратимо.`}
        loading={deleting}
        error={deleteError}
        onConfirm={handleDelete}
      />
      {payModal && displayContract && (
        <PaymentMarkModal
          payment={payModal}
          car={(displayContract as any).car}
          driver={{ fullName: driver.fullName }}
          onClose={() => setPayModal(null)}
          onSuccess={() => { setPayModal(null); refetch() }}
        />
      )}
    </div>
  )
}
