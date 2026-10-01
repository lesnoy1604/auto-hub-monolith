import { useState } from 'react'
import type { DriverDocType, DriverDocument } from './driverDocumentsApi'
import { useGetDriverDocumentsQuery, useDeleteDriverDocumentMutation } from './driverDocumentsApi'
import { DriverDocumentUploadModal } from './DriverDocumentUploadModal'
import { formatDate } from '@/shared/lib/formatDate'

const DOC_TYPE_LABEL: Record<DriverDocType, string> = {
  passport: 'Паспорт',
  license: 'ВУ',
  contract: 'Договор',
  photo: 'Фото',
  other: 'Другое',
}

const DOC_TYPE_COLOR: Record<DriverDocType, string> = {
  passport: '#3B5BDB',
  license: '#2F9E44',
  contract: '#6B3FE4',
  photo: '#E67700',
  other: '#868E96',
}

const isImage = (filename: string) => /\.(jpg|jpeg|png|webp|heic)$/i.test(filename)

function DocIcon({ docType }: { docType: DriverDocType }) {
  if (docType === 'photo') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  )
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  )
}

interface Props {
  driverId: number
}

export function DriverDocumentsCard({ driverId }: Props) {
  const { data: docs = [], isLoading } = useGetDriverDocumentsQuery(driverId)
  const [deleteDoc] = useDeleteDriverDocumentMutation()
  const [showUpload, setShowUpload] = useState(false)
  const [lightbox, setLightbox] = useState<DriverDocument | null>(null)
  const [confirmId, setConfirmId] = useState<number | null>(null)

  const handleDelete = async (id: number) => {
    await deleteDoc({ id, driverId })
    setConfirmId(null)
  }

  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)' }}>Документы и фото</h3>
        <button
          onClick={() => setShowUpload(true)}
          style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: '#6B3FE4', color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
        >
          + Загрузить
        </button>
      </div>

      {isLoading && <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Загрузка...</p>}

      {!isLoading && docs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--color-text-muted)', fontSize: 14 }}>
          Документы не загружены
        </div>
      )}

      {docs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {docs.map(doc => (
            <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, background: 'var(--color-surface)', border: '1px solid var(--color-neutral-border)' }}>
              {isImage(doc.filename) ? (
                <img
                  src={doc.url}
                  alt={doc.title}
                  onClick={() => setLightbox(doc)}
                  style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', cursor: 'pointer', flexShrink: 0 }}
                />
              ) : (
                <div style={{ width: 40, height: 40, borderRadius: 8, background: DOC_TYPE_COLOR[doc.docType] + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: DOC_TYPE_COLOR[doc.docType], flexShrink: 0 }}>
                  <DocIcon docType={doc.docType} />
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {doc.title}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 6, background: DOC_TYPE_COLOR[doc.docType] + '20', color: DOC_TYPE_COLOR[doc.docType] }}>
                    {DOC_TYPE_LABEL[doc.docType]}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{formatDate(doc.createdAt)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <a href={doc.url} target="_blank" rel="noreferrer" style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--color-neutral-border)', background: 'transparent', cursor: 'pointer', fontSize: 12, color: 'var(--color-text-muted)', textDecoration: 'none' }}>
                  Открыть
                </a>
                {confirmId === doc.id ? (
                  <>
                    <button onClick={() => handleDelete(doc.id)} style={{ padding: '6px 10px', borderRadius: 8, border: 'none', background: '#C62828', color: 'white', cursor: 'pointer', fontSize: 12 }}>Удалить</button>
                    <button onClick={() => setConfirmId(null)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--color-neutral-border)', background: 'transparent', cursor: 'pointer', fontSize: 12, color: 'var(--color-text-muted)' }}>Отмена</button>
                  </>
                ) : (
                  <button onClick={() => setConfirmId(doc.id)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #FDEAEA', background: 'transparent', cursor: 'pointer', fontSize: 12, color: '#C62828' }}>✕</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showUpload && <DriverDocumentUploadModal driverId={driverId} onClose={() => setShowUpload(false)} />}

      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={lightbox.url} alt={lightbox.title} style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, objectFit: 'contain' }} />
        </div>
      )}

    </div>
  )
}
