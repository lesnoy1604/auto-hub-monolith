import { Modal } from './Modal'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  loading?: boolean
  error?: string
  onConfirm: () => void
}

export function ConfirmDialog({ open, onClose, title, message, confirmLabel = 'Удалить', danger = true, loading, error, onConfirm }: Props) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p style={{ margin: '0 0 20px', fontSize: '15px', color: '#444', lineHeight: 1.6 }}>{message}</p>
      {error && (
        <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '8px', background: '#FDEAEA', border: '1px solid #C62828', color: '#C62828', fontSize: '13px' }}>
          {error}
        </div>
      )}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          style={{ padding: '10px 20px', borderRadius: '12px', border: '1px solid #E0DCEC', background: 'transparent', cursor: 'pointer', color: '#615D73', fontSize: '14px' }}
        >
          Отмена
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          style={{
            padding: '10px 24px', borderRadius: '12px', border: 'none',
            background: danger ? '#C62828' : '#6B3FE4',
            color: 'white', cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 500, fontSize: '14px', opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Удаление...' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
