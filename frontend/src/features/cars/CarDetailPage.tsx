import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router'
import { useGetCarByIdQuery, useDeleteCarMutation } from './carsApi'
import { useUpdateFineMutation } from '@/features/fines/finesApi'
import { CarStatusBadge } from './CarStatusBadge'
import { CarFormModal } from './CarFormModal'
import { FineFormModal } from '@/features/fines/FineFormModal'
import { FineStatusBadge } from '@/features/fines/FineStatusBadge'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Spinner } from '@/shared/ui/Spinner'
import { formatDate } from '@/shared/lib/formatDate'
import { formatMoney } from '@/shared/lib/formatMoney'
import { daysUntil, daysColor } from '@/shared/lib/daysUntil'
import { getApiError } from '@/shared/lib/apiError'
import type { Payment, Fine } from '@/shared/types'

export function CarDetailPage() {
  const { id } = useParams<{ id: string }>()
  const carId = Number(id)
  const navigate = useNavigate()
  const { data: car, isLoading, refetch } = useGetCarByIdQuery(carId)
  const [updateFine] = useUpdateFineMutation()
  const [deleteCar, { isLoading: deleting }] = useDeleteCarMutation()
  const [showEditModal, setShowEditModal] = useState(false)
  const [showFineModal, setShowFineModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const handleDelete = async () => {
    try {
      await deleteCar(carId).unwrap()
      navigate('/cars')
    } catch (err) {
      setDeleteError(getApiError(err))
    }
  }

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}><Spinner size={36} /></div>
  if (!car) return <div style={{ color: 'var(--color-text-muted)', padding: 40 }}>Машина не найдена</div>

  const activeContract = car.contracts?.find(c => c.status === 'ACTIVE')
  const payments = activeContract?.payments ?? []
  const paidCount = payments.filter(p => p.status === 'PAID').length
  const paidAmount = payments.filter(p => p.status === 'PAID').reduce((s, p) => s + Number(p.amount), 0)
  const progress = activeContract ? Math.round((paidAmount / Number(activeContract.totalAmount)) * 100) : 0
  const lastPayments = [...payments].sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()).slice(0, 4)

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <h1 style={{ margin: 0, fontSize: '34px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>{car.plateNumber}</h1>
            <CarStatusBadge status={car.status} />
          </div>
          <p style={{ margin: 0, fontSize: '16px', color: 'var(--color-text-muted)' }}>{car.brand} {car.model} · {car.year} · {car.mileage?.toLocaleString('ru-RU')} км</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={() => setShowEditModal(true)}>Редактировать</button>
          <button className="btn btn-danger" onClick={() => { setDeleteError(''); setShowDeleteDialog(true) }}>Удалить</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Documents */}
        <div className="card">
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Документы</h3>
          {[
            { label: 'ОСАГО', date: car.osagoBefore },
            { label: 'Техосмотр', date: car.inspectionBefore },
          ].map(({ label, date }) => {
            const days = date ? daysUntil(date) : null
            return (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--color-neutral-border)' }}>
                <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>{label}</span>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{date ? formatDate(date) : '—'}</span>
                  {days !== null && (
                    <span style={{ display: 'block', fontSize: '12px' }} className={daysColor(days)}>{days > 0 ? `${days} дн.` : 'Истёк'}</span>
                  )}
                </div>
              </div>
            )
          })}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>Пробег</span>
            <span style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{car.mileage?.toLocaleString('ru-RU') ?? '—'} км</span>
          </div>
        </div>

        {/* Active contract */}
        <div className="card">
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Текущий договор</h3>
          {activeContract ? (
            <>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>Водитель</span>
                  <Link to={`/drivers/${activeContract.driverId}`} style={{ fontSize: '14px', color: 'var(--color-accent-text)' }}>{activeContract.driver?.fullName ?? '—'}</Link>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>Начало</span>
                  <span style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{formatDate(activeContract.startDate)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>Платёж/мес</span>
                  <span style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{formatMoney(activeContract.monthlyPayment)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>Остаток</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-accent-text)' }}>{formatMoney(Number(activeContract.totalAmount) - paidAmount)}</span>
                </div>
              </div>
              {/* Progress */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Выкуп {paidCount}/{payments.length}</span>
                  <span style={{ fontSize: '12px', color: 'var(--color-accent-text)' }}>{progress}%</span>
                </div>
                <div style={{ height: '6px', borderRadius: '999px', background: 'rgba(186,214,247,0.1)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progress}%`, background: 'var(--color-accent)', borderRadius: '999px', transition: 'width 0.3s' }} />
                </div>
              </div>
            </>
          ) : (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Нет активного договора</p>
          )}
        </div>

        {/* Payments history */}
        <div className="card">
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>История платежей</h3>
          {lastPayments.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Нет платежей</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Дата', 'Сумма', 'Статус'].map(h => (
                    <th key={h} style={{ textAlign: 'left', fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 500, paddingBottom: '8px', paddingRight: '12px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lastPayments.map((p: Payment) => (
                  <tr key={p.id} style={{ borderTop: '1px solid var(--color-neutral-border)' }}>
                    <td style={{ padding: '10px 12px 10px 0', fontSize: '14px', color: 'var(--color-text-secondary)' }}>{formatDate(p.dueDate)}</td>
                    <td style={{ padding: '10px 12px 10px 0', fontSize: '14px', color: 'var(--color-text-primary)' }}>{formatMoney(p.amount)}</td>
                    <td style={{ padding: '10px 0' }}>
                      <span className={p.status === 'PAID' ? 'badge badge-success' : p.status === 'OVERDUE' ? 'badge badge-danger' : 'badge badge-warning'}>
                        {p.status === 'PAID' ? 'Оплачен' : p.status === 'OVERDUE' ? 'Просрочен' : 'Ожидается'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Fines */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Штрафы</h3>
            <button className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '13px' }} onClick={() => setShowFineModal(true)}>+ Добавить</button>
          </div>
          {(car.fines ?? []).length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Штрафов нет</p>
          ) : (
            <div>
              {(car.fines ?? []).map((fine: Fine) => (
                <div key={fine.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--color-neutral-border)' }}>
                  <div>
                    <p style={{ margin: '0 0 2px', fontSize: '14px', color: 'var(--color-text-primary)' }}>{fine.description}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-muted)' }}>{formatDate(fine.fineDate)} · {formatMoney(fine.amount)}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FineStatusBadge status={fine.status} />
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {fine.status !== 'PAID' && (
                        <button onClick={() => updateFine({ id: fine.id, status: 'PAID' }).then(() => refetch())} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(74,222,128,0.3)', background: 'rgba(74,222,128,0.08)', color: 'var(--color-success)', fontSize: '12px', cursor: 'pointer' }}>✓</button>
                      )}
                      {fine.status !== 'DISPUTED' && (
                        <button onClick={() => updateFine({ id: fine.id, status: 'DISPUTED' }).then(() => refetch())} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(251,146,60,0.3)', background: 'rgba(251,146,60,0.08)', color: 'var(--color-warning)', fontSize: '12px', cursor: 'pointer' }}>⚖</button>
                      )}
                      {fine.status !== 'UNPAID' && (
                        <button onClick={() => updateFine({ id: fine.id, status: 'UNPAID' }).then(() => refetch())} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--color-neutral-border)', background: 'rgba(186,214,247,0.06)', color: 'var(--color-text-muted)', fontSize: '12px', cursor: 'pointer' }}>↺</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <CarFormModal open={showEditModal} onClose={() => setShowEditModal(false)} car={car} />
      <FineFormModal open={showFineModal} onClose={() => { setShowFineModal(false); refetch() }} preselectedCarId={car.id} />
      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="Удалить машину"
        message={`Удалить ${car.brand} ${car.model} (${car.plateNumber})? Это действие необратимо.`}
        loading={deleting}
        error={deleteError}
        onConfirm={handleDelete}
      />
    </div>
  )
}
