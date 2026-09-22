import { useState } from 'react'
import { Link } from 'react-router'
import { useGetDashboardQuery } from './dashboardApi'
import { Spinner } from '@/shared/ui/Spinner'
import { EmptyState } from '@/shared/ui/EmptyState'
import { formatDate } from '@/shared/lib/formatDate'
import { formatMoney } from '@/shared/lib/formatMoney'
import { daysUntil } from '@/shared/lib/daysUntil'
import type { TopDebtor, UpcomingPayment } from '@/shared/types'

export function DashboardPage() {
  const { data, isLoading, refetch } = useGetDashboardQuery()
  const [payModal, setPayModal] = useState<{ contractId: number; paymentId: number; driverName: string; carPlate: string; amount: number; dueDate: string } | null>(null)

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}><Spinner size={36} /></div>
  if (!data) return <EmptyState message="Ошибка загрузки дашборда" />

  const { cars, contracts, payments, fines, topDebtors } = data

  const handlePayDebtor = (debtor: TopDebtor) => {
    setPayModal({
      contractId: debtor.contractId,
      paymentId: debtor.firstOverduePaymentId,
      driverName: debtor.driverName,
      carPlate: debtor.carPlate,
      amount: debtor.totalDebt,
      dueDate: new Date().toISOString(),
    })
  }

  return (
    <div>
      <h1 style={{ margin: '0 0 28px', fontSize: '34px', fontWeight: 700, fontFamily: 'var(--font-display)', lineHeight: 1.14, color: 'var(--color-text-primary)' }}>
        Дашборд
      </h1>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {/* В аренде */}
        <div className="card">
          <p style={{ margin: '0 0 4px', fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>В аренде</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '40px', fontWeight: 700, lineHeight: 1.1, color: 'var(--color-accent-text)' }}>{cars.RENTED}</span>
            <span style={{ fontSize: '15px', color: 'var(--color-text-muted)' }}>из {cars.total}</span>
          </div>
        </div>

        {/* Активных договоров */}
        <div className="card">
          <p style={{ margin: '0 0 4px', fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Активных договоров</p>
          <span style={{ fontSize: '40px', fontWeight: 700, lineHeight: 1.1, color: 'var(--color-text-primary)' }}>{contracts.active}</span>
        </div>

        {/* Просрочено */}
        <div className="card" style={payments.overdueCount > 0 ? { boxShadow: 'inset 0 0 0 1px rgba(248,113,113,0.4)' } : {}}>
          <p style={{ margin: '0 0 4px', fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Просрочено</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '40px', fontWeight: 700, lineHeight: 1.1, color: payments.overdueCount > 0 ? 'var(--color-danger)' : 'var(--color-text-primary)' }}>{formatMoney(payments.overdueAmount)}</span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--color-text-muted)' }}>{payments.overdueCount} платежей</p>
        </div>

        {/* Собрано */}
        <div className="card">
          <p style={{ margin: '0 0 4px', fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Собрано за месяц</p>
          <span style={{ fontSize: '40px', fontWeight: 700, lineHeight: 1.1, color: 'var(--color-success)' }}>{formatMoney(payments.collectedThisMonth)}</span>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--color-text-muted)' }}>штрафов неоплачено: {fines.unpaidCount}</p>
        </div>
      </div>

      {/* Row 2: fleet + upcoming */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '16px', marginBottom: '24px' }}>
        {/* Fleet card */}
        <div className="card">
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Парк машин</h3>
          {(() => {
            const items = [
              { key: 'RENTED', label: 'В аренде', color: '#a78bfa', count: cars.RENTED },
              { key: 'FREE', label: 'Свободна', color: '#4ade80', count: cars.FREE },
              { key: 'REPAIR', label: 'В ремонте', color: '#fb923c', count: cars.REPAIR },
              { key: 'SOLD', label: 'Продана', color: '#9da7ba', count: cars.SOLD },
            ]
            const total = cars.total || 1
            return (
              <>
                {/* Progress bar */}
                <div style={{ display: 'flex', height: '8px', borderRadius: '999px', overflow: 'hidden', marginBottom: '16px', background: 'rgba(186,214,247,0.08)' }}>
                  {items.filter(i => i.count > 0).map(i => (
                    <div key={i.key} style={{ width: `${(i.count / total) * 100}%`, background: i.color, transition: 'width 0.3s' }} />
                  ))}
                </div>
                {/* Legend */}
                {items.map(i => (
                  <div key={i.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: i.color, flexShrink: 0 }} />
                      <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{i.label}</span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{i.count}</span>
                  </div>
                ))}
              </>
            )
          })()}
        </div>

        {/* Upcoming payments */}
        <div className="card">
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Ближайшие платежи</h3>
          {payments.upcoming.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Платежей на этой неделе нет</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Дата', 'Машина', 'Водитель', 'Сумма'].map(h => (
                    <th key={h} style={{ textAlign: 'left', fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 500, paddingBottom: '10px', paddingRight: '16px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.upcoming.map((p: UpcomingPayment) => {
                  const days = daysUntil(p.dueDate)
                  return (
                    <tr key={p.id}>
                      <td style={{ padding: '8px 16px 8px 0', fontSize: '14px', color: days <= 2 ? 'var(--color-danger)' : 'var(--color-text-secondary)' }}>{formatDate(p.dueDate)}</td>
                      <td style={{ padding: '8px 16px 8px 0' }}>
                        <Link to={`/contracts/${p.contractId}`} style={{ fontSize: '14px', color: 'var(--color-accent-text)', textDecoration: 'none' }}>
                          {p.car.plateNumber}
                        </Link>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block' }}>{p.car.brand} {p.car.model}</span>
                      </td>
                      <td style={{ padding: '8px 16px 8px 0', fontSize: '14px', color: 'var(--color-text-secondary)' }}>{p.driver.fullName}</td>
                      <td style={{ padding: '8px 0', fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{formatMoney(p.amount)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Top debtors */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Топ должников</h3>
          <Link to="/payments" style={{ fontSize: '13px', color: 'var(--color-accent-text)' }}>Все должники →</Link>
        </div>
        {topDebtors.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Должников нет</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Водитель', 'Машина', 'Платежей', 'Долг', 'Макс. дней', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 500, paddingBottom: '10px', paddingRight: '16px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topDebtors.map((d: TopDebtor) => (
                <tr key={d.driverId} style={{ borderTop: '1px solid var(--color-neutral-border)' }}>
                  <td style={{ padding: '12px 16px 12px 0', fontSize: '14px', color: 'var(--color-text-primary)' }}>{d.driverName}</td>
                  <td style={{ padding: '12px 16px 12px 0', fontSize: '14px', color: 'var(--color-text-secondary)' }}>{d.carPlate}</td>
                  <td style={{ padding: '12px 16px 12px 0', fontSize: '14px', color: 'var(--color-warning)' }}>{d.overdueCount}</td>
                  <td style={{ padding: '12px 16px 12px 0', fontSize: '14px', fontWeight: 600, color: 'var(--color-danger)' }}>{formatMoney(d.totalDebt)}</td>
                  <td style={{ padding: '12px 16px 12px 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>{d.maxDaysOverdue} дн.</td>
                  <td style={{ padding: '12px 0' }}>
                    <button
                      onClick={() => handlePayDebtor(d)}
                      style={{
                        padding: '6px 14px', borderRadius: '999px', border: 'none', cursor: 'pointer',
                        background: 'var(--color-accent-bg)', color: 'var(--color-accent-text)',
                        fontSize: '13px', fontWeight: 500,
                      }}
                    >
                      Оплатить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* TODO: PaymentMarkModal */}
      {payModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(32,30,29,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setPayModal(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#fff', borderRadius: '22px', padding: '32px',
            maxWidth: '440px', width: '100%',
          }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '18px', color: '#1a1a2e' }}>Отметить оплату</h2>
            <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#615D73' }}>
              {payModal.carPlate} · {payModal.driverName}
            </p>
            <p style={{ margin: '0 0 20px', fontSize: '20px', fontWeight: 700, color: '#1a1a2e' }}>{formatMoney(payModal.amount)}</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setPayModal(null)} style={{ padding: '10px 20px', borderRadius: '12px', border: '1px solid #E0DCEC', background: 'transparent', cursor: 'pointer', color: '#615D73' }}>Отмена</button>
              <button
                onClick={async () => {
                  try {
                    await fetch('/api/payments', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contractId: payModal.contractId, paymentId: payModal.paymentId }) })
                    setPayModal(null)
                    refetch()
                  } catch {}
                }}
                style={{ padding: '10px 20px', borderRadius: '12px', border: 'none', background: '#6B3FE4', color: 'white', cursor: 'pointer', fontWeight: 500 }}
              >Отметить оплаченным</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
