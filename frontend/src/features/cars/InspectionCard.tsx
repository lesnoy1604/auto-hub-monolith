import { useState } from 'react'
import { useGetCarInspectionsQuery } from './inspectionsApi'
import { InspectionModal } from './InspectionModal'
import { formatDate } from '@/shared/lib/formatDate'
import type { InspectionAngle } from './inspectionsApi'

const ANGLES: { key: InspectionAngle; label: string }[] = [
  { key: 'front',    label: 'Спереди'   },
  { key: 'back',     label: 'Сзади'     },
  { key: 'left',     label: 'Левый бок' },
  { key: 'right',    label: 'Правый бок'},
  { key: 'interior', label: 'Салон'     },
  { key: 'odometer', label: 'Одометр'   },
]

interface Props {
  carId: number
}

export function InspectionCard({ carId }: Props) {
  const { data: inspections = [], refetch } = useGetCarInspectionsQuery(carId)
  const [showModal, setShowModal] = useState(false)
  const [selectedInspectionIdx, setSelectedInspectionIdx] = useState(0)
  const [lightbox, setLightbox] = useState<string | null>(null)

  const latest = inspections[selectedInspectionIdx] ?? null
  const photoMap = Object.fromEntries((latest?.photos ?? []).map(p => [p.angle, p.url]))

  return (
    <>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)' }}>Фотоосмотр</h3>
            {inspections.length > 0 ? (
              <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
                Последний осмотр: {formatDate(inspections[0].inspectedAt)}
              </p>
            ) : (
              <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>Осмотров ещё не было</p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {inspections.length > 1 && (
              <select
                value={selectedInspectionIdx}
                onChange={e => setSelectedInspectionIdx(Number(e.target.value))}
                style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--color-neutral-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)', fontSize: 13 }}
              >
                {inspections.map((insp, i) => (
                  <option key={insp.id} value={i}>{formatDate(insp.inspectedAt)}</option>
                ))}
              </select>
            )}
            <button
              className="btn btn-secondary"
              style={{ padding: '7px 14px', fontSize: 13 }}
              onClick={() => setShowModal(true)}
            >
              Новый осмотр
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
          {ANGLES.map(({ key, label }) => {
            const url = photoMap[key]
            return (
              <div key={key}>
                <div
                  onClick={() => url && setLightbox(url)}
                  style={{
                    height: 100, borderRadius: 10, border: '1px solid var(--color-neutral-border)',
                    background: 'rgba(186,214,247,0.04)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', overflow: 'hidden',
                    cursor: url ? 'pointer' : 'default', position: 'relative',
                  }}
                >
                  {url ? (
                    <img src={url} alt={label} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(186,214,247,0.2)" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  )}
                </div>
                <p style={{ margin: '5px 0 0', fontSize: 11, color: 'var(--color-text-muted)', textAlign: 'center' }}>{label}</p>
              </div>
            )
          })}
        </div>

        {latest?.notes && (
          <p style={{ margin: '16px 0 0', fontSize: 13, color: 'var(--color-text-muted)', padding: '10px 14px', borderRadius: 8, background: 'rgba(186,214,247,0.04)', border: '1px solid var(--color-neutral-border)' }}>
            {latest.notes}
          </p>
        )}
      </div>

      {showModal && (
        <InspectionModal
          carId={carId}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); refetch(); setSelectedInspectionIdx(0) }}
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
    </>
  )
}
