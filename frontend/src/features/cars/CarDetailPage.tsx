import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router'
import { useGetCarByIdQuery, useDeleteCarMutation } from './carsApi'
import { useUpdateFineMutation } from '@/features/fines/finesApi'
import { CarStatusBadge } from './CarStatusBadge'
import { CarFormModal } from './CarFormModal'
import { InspectionCard } from './InspectionCard'
import { FineFormModal } from '@/features/fines/FineFormModal'
import { FineStatusBadge } from '@/features/fines/FineStatusBadge'
import { ContractFormModal } from '@/features/contracts/ContractFormModal'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Spinner } from '@/shared/ui/Spinner'
import { formatDate } from '@/shared/lib/formatDate'
import { formatMoney } from '@/shared/lib/formatMoney'
import { daysUntil, daysColor } from '@/shared/lib/daysUntil'
import { getApiError } from '@/shared/lib/apiError'
import { getCarModelImage } from './carModelImages'
import type { Payment, Fine } from '@/shared/types'

const FUEL_LABELS: Record<string, string> = {
  PETROL: 'Бензин', DIESEL: 'Дизель', ELECTRIC: 'Электро', HYBRID: 'Гибрид', GAS: 'Газ',
}

export function CarDetailPage() {
  const { id } = useParams<{ id: string }>()
  const carId = Number(id)
  const navigate = useNavigate()
  const { data: car, isLoading, refetch } = useGetCarByIdQuery(carId)
  const [updateFine] = useUpdateFineMutation()
  const [deleteCar, { isLoading: deleting }] = useDeleteCarMutation()
  const [showEditModal, setShowEditModal] = useState(false)
  const [showFineModal, setShowFineModal] = useState(false)
  const [showContractModal, setShowContractModal] = useState(false)
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
  const recentPayments = [...payments]
    .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
    .slice(0, 5)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Hero card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr auto', minHeight: 120 }}>

          {/* Left — plate + status + subtitle */}
          <div style={{ padding: '24px 24px 24px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: '1px solid var(--color-neutral-border)' }}>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6, fontWeight: 500 }}>{car.brand}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)', letterSpacing: '-0.01em' }}>{car.plateNumber}</h1>
              <CarStatusBadge status={car.status} />
            </div>
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{car.brand} {car.model} · {car.year} · {car.mileage?.toLocaleString('ru-RU')} км</span>
          </div>

          {/* Center — car image or SVG schema */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'linear-gradient(135deg, rgba(107,63,228,0.04) 0%, transparent 60%)' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(107,63,228,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(107,63,228,0.03) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
            {(() => {
              const imgSrc = getCarModelImage(car.brand, car.model)
              return imgSrc ? (
                <img src={imgSrc} alt={`${car.brand} ${car.model}`} style={{ height: 110, objectFit: 'contain', position: 'relative', zIndex: 1, filter: 'drop-shadow(0 8px 24px rgba(107,63,228,0.2))' }} />
              ) : (
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)', width: 340, height: 12, background: 'rgba(107,63,228,0.08)', borderRadius: '50%', filter: 'blur(6px)' }} />
                  <svg width="340" height="90" viewBox="0 0 520 140" fill="none">
                    <path d="M60 95 L60 72 Q62 58 80 50 L150 32 Q170 24 210 22 L300 22 Q340 22 370 30 L420 50 Q445 58 452 72 L460 95 Z" fill="rgba(107,63,228,0.1)" stroke="rgba(107,63,228,0.45)" strokeWidth="1.5" strokeLinejoin="round"/>
                    <path d="M150 32 Q170 24 210 22 L300 22 Q340 22 370 30 L420 50 L80 50 Z" fill="rgba(107,63,228,0.06)" stroke="rgba(107,63,228,0.25)" strokeWidth="1" strokeLinejoin="round"/>
                    <path d="M160 50 L185 26 Q200 22 230 22 L230 50 Z" fill="rgba(186,214,247,0.06)" stroke="rgba(186,214,247,0.18)" strokeWidth="1" strokeLinejoin="round"/>
                    <path d="M310 50 L310 22 Q340 22 368 30 L405 50 Z" fill="rgba(186,214,247,0.06)" stroke="rgba(186,214,247,0.18)" strokeWidth="1" strokeLinejoin="round"/>
                    <path d="M234 22 L308 22 L308 50 L234 50 Z" fill="rgba(186,214,247,0.07)" stroke="rgba(186,214,247,0.18)" strokeWidth="1"/>
                    <line x1="270" y1="50" x2="268" y2="95" stroke="rgba(107,63,228,0.2)" strokeWidth="1"/>
                    <rect x="60" y="88" width="400" height="7" rx="2" fill="rgba(107,63,228,0.15)"/>
                    <path d="M60 72 L48 80 Q44 88 46 95 L60 95 Z" fill="rgba(107,63,228,0.12)" stroke="rgba(107,63,228,0.35)" strokeWidth="1.2"/>
                    <path d="M460 72 L472 80 Q476 88 474 95 L460 95 Z" fill="rgba(107,63,228,0.12)" stroke="rgba(107,63,228,0.35)" strokeWidth="1.2"/>
                    <ellipse cx="52" cy="68" rx="6" ry="4" fill="rgba(251,191,36,0.45)" stroke="rgba(251,191,36,0.6)" strokeWidth="1"/>
                    <ellipse cx="468" cy="68" rx="6" ry="4" fill="rgba(239,68,68,0.35)" stroke="rgba(239,68,68,0.55)" strokeWidth="1"/>
                    <circle cx="140" cy="97" r="22" fill="rgba(12,12,20,0.9)" stroke="rgba(107,63,228,0.45)" strokeWidth="1.5"/>
                    <circle cx="140" cy="97" r="13" fill="rgba(107,63,228,0.12)" stroke="rgba(107,63,228,0.35)" strokeWidth="1"/>
                    <circle cx="140" cy="97" r="4" fill="rgba(107,63,228,0.55)"/>
                    <circle cx="378" cy="97" r="22" fill="rgba(12,12,20,0.9)" stroke="rgba(107,63,228,0.45)" strokeWidth="1.5"/>
                    <circle cx="378" cy="97" r="13" fill="rgba(107,63,228,0.12)" stroke="rgba(107,63,228,0.35)" strokeWidth="1"/>
                    <circle cx="378" cy="97" r="4" fill="rgba(107,63,228,0.55)"/>
                  </svg>
                </div>
              )
            })()}
          </div>

          {/* Right — stats + buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px 24px', borderLeft: '1px solid var(--color-neutral-border)', minWidth: 340 }}>
            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {[
                { icon: '⊙', label: 'Пробег', value: `${car.mileage?.toLocaleString('ru-RU')} км` },
                { icon: '◷', label: 'Год', value: String(car.year) },
                { icon: '⚙', label: 'Двигатель', value: car.engineVolume ? `${car.engineVolume} л` : '—' },
                { icon: '⛽', label: 'Топливо', value: car.fuelType ? FUEL_LABELS[car.fuelType] : '—' },
              ].map(({ icon, label, value }) => (
                <div key={label} style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(186,214,247,0.04)', border: '1px solid var(--color-neutral-border)' }}>
                  <p style={{ margin: '0 0 4px', fontSize: 18, lineHeight: 1 }}>{icon}</p>
                  <p style={{ margin: '0 0 2px', fontSize: 11, color: 'var(--color-text-muted)' }}>{label}</p>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{value}</p>
                </div>
              ))}
            </div>
            {/* Buttons */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
              {car.status === 'FREE' && (
                <button className="btn btn-primary" onClick={() => setShowContractModal(true)}>Оформить договор</button>
              )}
              <button className="btn btn-secondary" onClick={() => setShowEditModal(true)}>Редактировать</button>
              <button className="btn btn-danger" onClick={() => { setDeleteError(''); setShowDeleteDialog(true) }}>Удалить</button>
            </div>
          </div>
        </div>
      </div>

      {/* Photo inspection */}
      <InspectionCard carId={carId} />

      {/* 3-column bottom */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 300px', gap: 16, alignItems: 'start' }}>

        {/* Left — Documents */}
        <div className="card">
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Документы</h3>
          {[
            { label: 'ОСАГО', date: car.osagoBefore },
            { label: 'Техосмотр', date: car.inspectionBefore },
          ].map(({ label, date }) => {
            const days = date ? daysUntil(date) : null
            return (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid var(--color-neutral-border)' }}>
                <span style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>{label}</span>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>{date ? formatDate(date) : '—'}</span>
                  {days !== null && (
                    <span style={{ display: 'block', fontSize: 12 }} className={daysColor(days)}>
                      {days > 0 ? `${days} дн.` : 'Истёк'}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>Пробег</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{car.mileage?.toLocaleString('ru-RU') ?? '—'} км</span>
          </div>
        </div>

        {/* Center — Contract + Payments */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Current contract */}
          <div className="card">
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Текущий договор</h3>
            {activeContract ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>Водитель</span>
                    <Link to={`/drivers/${activeContract.driverId}`} style={{ fontSize: 14, color: 'var(--color-accent-text)', textDecoration: 'none' }}>{activeContract.driver?.fullName ?? '—'}</Link>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>Начало</span>
                    <span style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>{formatDate(activeContract.startDate)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>Платёж/мес</span>
                    <span style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>{formatMoney(activeContract.monthlyPayment)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>Остаток</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-accent-text)' }}>{formatMoney(Number(activeContract.totalAmount) - paidAmount)}</span>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Выкуп {paidCount}/{payments.length}</span>
                    <span style={{ fontSize: 12, color: 'var(--color-accent-text)' }}>{progress}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 999, background: 'rgba(186,214,247,0.1)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progress}%`, background: 'var(--color-accent)', borderRadius: 999, transition: 'width 0.3s' }} />
                  </div>
                </div>
              </>
            ) : (
              <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Нет активного договора</p>
            )}
          </div>

          {/* Payment history */}
          <div className="card">
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: 'var(--color-text-secondary)' }}>История платежей</h3>
            {recentPayments.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Нет платежей</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Дата', 'Сумма', 'Статус'].map(h => (
                      <th key={h} style={{ textAlign: 'left', fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 500, paddingBottom: 8, paddingRight: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map((p: Payment) => (
                    <tr key={p.id} style={{ borderTop: '1px solid var(--color-neutral-border)' }}>
                      <td style={{ padding: '10px 12px 10px 0', fontSize: 14, color: 'var(--color-text-secondary)' }}>{formatDate(p.dueDate)}</td>
                      <td style={{ padding: '10px 12px 10px 0', fontSize: 14, color: 'var(--color-text-primary)' }}>{formatMoney(p.amount)}</td>
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
        </div>

        {/* Right — Fines */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Штрафы</h3>
            <button className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: 13 }} onClick={() => setShowFineModal(true)}>+ Добавить</button>
          </div>
          {(car.fines ?? []).length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Штрафов нет</p>
          ) : (
            <div>
              {(car.fines ?? []).map((fine: Fine) => (
                <div key={fine.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid var(--color-neutral-border)' }}>
                  <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                    <p style={{ margin: '0 0 2px', fontSize: 13, color: 'var(--color-text-primary)', lineHeight: 1.3 }}>{fine.description}</p>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)' }}>{formatDate(fine.fineDate)} · {formatMoney(fine.amount)}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                    <FineStatusBadge status={fine.status} />
                    <div style={{ display: 'flex', gap: 4 }}>
                      {fine.status !== 'PAID' && (
                        <button onClick={() => updateFine({ id: fine.id, status: 'PAID' }).then(() => refetch())} style={{ padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(74,222,128,0.3)', background: 'rgba(74,222,128,0.08)', color: 'var(--color-success)', fontSize: 11, cursor: 'pointer' }}>✓</button>
                      )}
                      {fine.status !== 'DISPUTED' && (
                        <button onClick={() => updateFine({ id: fine.id, status: 'DISPUTED' }).then(() => refetch())} style={{ padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(251,146,60,0.3)', background: 'rgba(251,146,60,0.08)', color: 'var(--color-warning)', fontSize: 11, cursor: 'pointer' }}>⚖</button>
                      )}
                      {fine.status !== 'UNPAID' && (
                        <button onClick={() => updateFine({ id: fine.id, status: 'UNPAID' }).then(() => refetch())} style={{ padding: '3px 8px', borderRadius: 6, border: '1px solid var(--color-neutral-border)', background: 'rgba(186,214,247,0.06)', color: 'var(--color-text-muted)', fontSize: 11, cursor: 'pointer' }}>↺</button>
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
      <ContractFormModal
        open={showContractModal}
        onClose={() => { setShowContractModal(false); refetch() }}
        preselectedCarId={car.id}
        preselectedCarLabel={`${car.plateNumber} — ${car.brand} ${car.model}`}
      />
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
