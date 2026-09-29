import { useState, useRef } from 'react'
import { useCreateInspectionMutation, useUploadPhotoMutation } from './inspectionsApi'
import type { InspectionAngle, CarInspection } from './inspectionsApi'

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
  onClose: () => void
  onSuccess: (inspection: CarInspection) => void
}

export function InspectionModal({ carId, onClose, onSuccess }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)
  const [notes, setNotes] = useState('')
  const [files, setFiles] = useState<Partial<Record<InspectionAngle, File>>>({})
  const [previews, setPreviews] = useState<Partial<Record<InspectionAngle, string>>>({})
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRefs = useRef<Partial<Record<InspectionAngle, HTMLInputElement>>>({})

  const [createInspection] = useCreateInspectionMutation()
  const [uploadPhoto] = useUploadPhotoMutation()

  const handleFile = (angle: InspectionAngle, file: File) => {
    setFiles(f => ({ ...f, [angle]: file }))
    const url = URL.createObjectURL(file)
    setPreviews(p => ({ ...p, [angle]: url }))
  }

  const handleSubmit = async () => {
    if (!date) { setError('Укажите дату осмотра'); return }
    setError('')
    setUploading(true)
    try {
      const insp = await createInspection({
        carId,
        inspectedAt: `${date}T00:00:00Z`,
        notes,
      }).unwrap()

      await Promise.all(
        (Object.entries(files) as [InspectionAngle, File][]).map(([angle, file]) =>
          uploadPhoto({ inspectionId: insp.id, angle, file, carId }).unwrap()
        )
      )

      onSuccess(insp)
    } catch {
      setError('Ошибка при сохранении')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="card" style={{ width: 640, maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20, padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)' }}>Новый осмотр</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 20, padding: 4 }}>✕</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 6 }}>Дата осмотра</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-neutral-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)', fontSize: 14 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 6 }}>Заметки</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Необязательно"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-neutral-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)', fontSize: 14 }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {ANGLES.map(({ key, label }) => {
            const preview = previews[key]
            return (
              <div key={key}>
                <p style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--color-text-muted)' }}>{label}</p>
                <div
                  onClick={() => fileRefs.current[key]?.click()}
                  style={{
                    height: 110, borderRadius: 10, border: `1px dashed ${preview ? 'var(--color-accent)' : 'var(--color-neutral-border)'}`,
                    background: 'rgba(186,214,247,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', overflow: 'hidden', position: 'relative',
                  }}
                >
                  {preview ? (
                    <img src={preview} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(186,214,247,0.3)" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                      <p style={{ margin: '4px 0 0', fontSize: 11, color: 'rgba(186,214,247,0.3)' }}>Загрузить</p>
                    </div>
                  )}
                </div>
                <input
                  ref={el => { if (el) fileRefs.current[key] = el }}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(key, f) }}
                />
              </div>
            )
          })}
        </div>

        {error && <p style={{ margin: 0, fontSize: 13, color: 'var(--color-danger)' }}>{error}</p>}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={uploading}>Отмена</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={uploading}>
            {uploading ? 'Сохранение...' : 'Сохранить осмотр'}
          </button>
        </div>
      </div>
    </div>
  )
}
