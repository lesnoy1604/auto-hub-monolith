import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router'
import { useGetCarByIdQuery, useDeleteCarMutation } from './carsApi'
import { useGetCarInspectionsQuery } from './inspectionsApi'
import { useUpdateFineMutation } from '@/features/fines/finesApi'
import { CarStatusBadge } from './CarStatusBadge'
import { CarFormModal } from './CarFormModal'
import { InspectionCard } from './InspectionCard'
import { InspectionModal } from './InspectionModal'
import { FineFormModal } from '@/features/fines/FineFormModal'
import { FineStatusBadge } from '@/features/fines/FineStatusBadge'
import { ContractFormModal } from '@/features/contracts/ContractFormModal'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Spinner } from '@/shared/ui/Spinner'
import { formatDate } from '@/shared/lib/formatDate'
import { formatMoney } from '@/shared/lib/formatMoney'
import { daysUntil, daysColor } from '@/shared/lib/daysUntil'
import { getApiError } from '@/shared/lib/apiError'
import { getCarBodyTypeImage } from './carModelImages'
import type { Payment, Fine } from '@/shared/types'
import type { InspectionAngle } from './inspectionsApi'

const FUEL_LABELS: Record<string, string> = {
  PETROL: 'Бензин', DIESEL: 'Дизель', ELECTRIC: 'Электро', HYBRID: 'Гибрид', GAS: 'Газ',
}

const ANGLES: { key: InspectionAngle; label: string }[] = [
  { key: 'front',    label: 'Спереди'    },
  { key: 'back',     label: 'Сзади'      },
  { key: 'left',     label: 'Левый бок'  },
  { key: 'right',    label: 'Правый бок' },
  { key: 'interior', label: 'Салон'      },
  { key: 'odometer', label: 'Одометр'    },
]

function parsePlate(plate: string) {
  const m = plate.match(/^(.*?)(\d{2,3})$/)
  return m ? { main: m[1], region: m[2] } : { main: plate, region: null }
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
  const [heroTab, setHeroTab] = useState<'illustration' | 'photos'>('illustration')
  const [selectedInspectionIdx, setSelectedInspectionIdx] = useState(0)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [showInspectionModal, setShowInspectionModal] = useState(false)
  const { data: inspections = [], refetch: refetchInspections } = useGetCarInspectionsQuery(carId)

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

  const totalPhotos = inspections.reduce((s, i) => s + i.photos.length, 0)
  const currentInspection = inspections[selectedInspectionIdx] ?? null
  const photoMap = Object.fromEntries((currentInspection?.photos ?? []).map(p => [p.angle, p.url]))
  const { main: plateMain, region: plateRegion } = parsePlate(car.plateNumber)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Hero card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '40% 60%' }}>

          {/* Left — title + plate + stats + buttons */}
          <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20, borderRight: '1px solid var(--color-neutral-border)' }}>

            {/* Title + status */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {car.brand} {car.model}
                </h1>
                <CarStatusBadge status={car.status} />
              </div>
              {/* License plate */}
              <div style={{ display: 'inline-flex', alignItems: 'stretch', borderRadius: 7, border: '2px solid rgba(186,214,247,0.25)', overflow: 'hidden', background: 'rgba(186,214,247,0.06)' }}>
                {/* RU flag stripe */}
                <div style={{ display: 'flex', flexDirection: 'column', width: 10, flexShrink: 0 }}>
                  <div style={{ flex: 1, background: '#fff' }} />
                  <div style={{ flex: 1, background: '#003791' }} />
                  <div style={{ flex: 1, background: '#D52B1E' }} />
                </div>
                <span style={{ padding: '7px 14px', fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: 3 }}>
                  {plateMain}
                </span>
                {plateRegion && (
                  <>
                    <span style={{ width: 1, background: 'rgba(186,214,247,0.2)', alignSelf: 'stretch' }} />
                    <span style={{ padding: '7px 12px', fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: 1 }}>
                      {plateRegion}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { label: 'Пробег',    value: `${car.mileage?.toLocaleString('ru-RU')} км` },
                { label: 'Год',       value: String(car.year) },
                { label: 'Двигатель', value: car.engineVolume ? `${car.engineVolume} л` : '—' },
                { label: 'Топливо',   value: car.fuelType ? FUEL_LABELS[car.fuelType] : '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p style={{ margin: '0 0 4px', fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              {car.status === 'FREE' && (
                <button className="btn btn-primary" onClick={() => setShowContractModal(true)}>Оформить договор</button>
              )}
              <button className="btn btn-secondary" onClick={() => setShowEditModal(true)}>Редактировать</button>
              <button className="btn btn-danger" onClick={() => { setDeleteError(''); setShowDeleteDialog(true) }}>Удалить</button>
            </div>
          </div>

          {/* Right — illustration / photos */}
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 280 }}>
            {/* Content */}
            {heroTab === 'illustration' ? (
              <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'linear-gradient(135deg, rgba(107,63,228,0.04) 0%, transparent 60%)' }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(107,63,228,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(107,63,228,0.03) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
                {(() => {
                  const imgSrc = getCarBodyTypeImage(car.bodyType)
                  return imgSrc ? (
                    <img src={imgSrc} alt={`${car.brand} ${car.model}`} style={{ width: '80%', height: '80%', objectFit: 'contain', position: 'relative', zIndex: 1 }} />
                  ) : (
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{ position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)', width: 340, height: 12, background: 'rgba(107,63,228,0.08)', borderRadius: '50%', filter: 'blur(6px)' }} />
                      <svg width="380" height="100" viewBox="0 0 520 140" fill="none">
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
            ) : (
              <div style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {inspections.length > 1 && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Осмотр:</span>
                    <select
                      value={selectedInspectionIdx}
                      onChange={e => setSelectedInspectionIdx(Number(e.target.value))}
                      style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--color-neutral-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)', fontSize: 12 }}
                    >
                      {inspections.map((insp, i) => (
                        <option key={insp.id} value={i}>{formatDate(insp.inspectedAt)}</option>
                      ))}
                    </select>
                  </div>
                )}
                {inspections.length === 0 ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-muted)' }}>Осмотров ещё не было</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
                    {ANGLES.map(({ key, label }) => {
                      const url = photoMap[key]
                      return (
                        <div key={key}>
                          <div
                            onClick={() => url && setLightbox(url)}
                            style={{ height: 60, borderRadius: 8, border: '1px solid var(--color-neutral-border)', background: 'rgba(186,214,247,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: url ? 'pointer' : 'default', position: 'relative' }}
                          >
                            {url ? (
                              <img src={url} alt={label} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(186,214,247,0.2)" strokeWidth="1.5">
                                <rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/>
                                <polyline points="21 15 16 10 5 21"/>
                              </svg>
                            )}
                          </div>
                          <p style={{ margin: '4px 0 0', fontSize: 10, color: 'var(--color-text-muted)', textAlign: 'center' }}>{label}</p>
                        </div>
                      )
                    })}
                  </div>
                )}
                {currentInspection?.notes && (
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)', padding: '8px 12px', borderRadius: 6, background: 'rgba(186,214,247,0.04)', border: '1px solid var(--color-neutral-border)' }}>
                    {currentInspection.notes}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Photo inspection */}
      <InspectionCard carId={carId} />

      {/* 3-column bottom */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, alignItems: 'start' }}>

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Текущий договор</h3>
              {activeContract && (
                <Link to={`/contracts/${activeContract.id}`} className="link-accent" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                  Открыть <span style={{ fontSize: 16, lineHeight: 1 }}>→</span>
                </Link>
              )}
            </div>
            {activeContract ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>Водитель</span>
                    <Link to={`/drivers/${activeContract.driverId}`} className="link-accent" style={{ fontSize: 14 }}>{activeContract.driver?.fullName ?? '—'}</Link>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--color-text-secondary)' }}>История платежей</h3>
              {activeContract && (
                <Link to={`/contracts/${activeContract.id}`} className="link-accent" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                  Все платежи <span style={{ fontSize: 16, lineHeight: 1 }}>→</span>
                </Link>
              )}
            </div>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Штрафы</h3>
              <Link to="/fines" className="link-accent" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                Все <span style={{ fontSize: 16, lineHeight: 1 }}>→</span>
              </Link>
            </div>
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
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)' }}>
                      {formatDate(fine.fineDate)} · {formatMoney(fine.amount)}
                      {fine.driverId && (
                        <> · <Link to={`/drivers/${fine.driverId}`} className="link-accent">
                          {fine.driver?.fullName ?? 'Водитель'}
                        </Link></>
                      )}
                    </p>
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
      {showInspectionModal && (
        <InspectionModal
          carId={carId}
          onClose={() => setShowInspectionModal(false)}
          onSuccess={() => { setShowInspectionModal(false); refetchInspections(); setSelectedInspectionIdx(0); setHeroTab('photos') }}
        />
      )}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, cursor: 'zoom-out' }}
        >
          <img src={lightbox} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, objectFit: 'contain' }} />
        </div>
      )}
    </div>
  )
}
