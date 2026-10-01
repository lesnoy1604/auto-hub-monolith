import { useRef, useState } from 'react'
import type { DriverDocType } from './driverDocumentsApi'
import { useUploadDriverDocumentMutation } from './driverDocumentsApi'

const DOC_TYPES: { value: DriverDocType; label: string }[] = [
  { value: 'passport', label: 'Паспорт' },
  { value: 'license', label: 'Водительское удостоверение' },
  { value: 'photo', label: 'Фото' },
  { value: 'other', label: 'Другое' },
]

interface Props {
  driverId: number
  onClose: () => void
}

export function DriverDocumentUploadModal({ driverId, onClose }: Props) {
  const [docType, setDocType] = useState<DriverDocType>('other')
  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const [upload, { isLoading }] = useUploadDriverDocumentMutation()

  const handleSubmit = async () => {
    if (!file) { setError('Выберите файл'); return }
    setError('')
    try {
      await upload({ driverId, docType, title: title || file.name, file }).unwrap()
      onClose()
    } catch {
      setError('Ошибка при загрузке')
    }
  }

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(32,30,29,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    >
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 22, maxWidth: 480, width: '100%', padding: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#1a1a2e' }}>Загрузить документ</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#615D73' }}>×</button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 6, fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#615D73' }}>
            Тип документа
          </label>
          <select
            value={docType}
            onChange={e => setDocType(e.target.value as DriverDocType)}
            style={{ width: '100%', height: 44, borderRadius: 14, background: '#F5F4FA', border: '1px solid #E6E3F0', padding: '0 14px', fontSize: 15, color: '#1a1a2e', outline: 'none', boxSizing: 'border-box' }}
          >
            {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 6, fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#615D73' }}>
            Название (необязательно)
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Например: Паспорт Иванова"
            style={{ width: '100%', height: 44, borderRadius: 14, background: '#F5F4FA', border: '1px solid #E6E3F0', padding: '0 14px', fontSize: 15, color: '#1a1a2e', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 6, fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#615D73' }}>
            Файл
          </label>
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              height: 80, borderRadius: 14, border: `2px dashed ${file ? '#6B3FE4' : '#E6E3F0'}`,
              background: file ? '#F0EEFF' : '#F5F4FA', display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', flexDirection: 'column', gap: 4,
            }}
          >
            {file ? (
              <>
                <span style={{ fontSize: 13, color: '#6B3FE4', fontWeight: 500 }}>{file.name}</span>
                <span style={{ fontSize: 11, color: '#9B89CC' }}>{(file.size / 1024).toFixed(0)} KB</span>
              </>
            ) : (
              <>
                <span style={{ fontSize: 13, color: '#9B89CC' }}>Нажмите чтобы выбрать файл</span>
                <span style={{ fontSize: 11, color: '#C4B8E8' }}>PDF, JPG, PNG, до 20 МБ</span>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" style={{ display: 'none' }} accept=".pdf,.jpg,.jpeg,.png,.heic,.webp" onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f) }} />
        </div>

        {error && <p style={{ margin: '0 0 16px', fontSize: 13, color: '#C62828' }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 12, border: '1px solid #E0DCEC', background: 'transparent', cursor: 'pointer', color: '#615D73', fontSize: 14 }}>
            Отмена
          </button>
          <button onClick={handleSubmit} disabled={isLoading || !file} style={{ padding: '10px 24px', borderRadius: 12, border: 'none', background: '#6B3FE4', color: 'white', cursor: 'pointer', fontWeight: 500, fontSize: 14, opacity: isLoading || !file ? 0.7 : 1 }}>
            {isLoading ? 'Загрузка...' : 'Загрузить'}
          </button>
        </div>
      </div>
    </div>
  )
}
