interface EmptyStateProps { message?: string }

export function EmptyState({ message = 'Ничего не найдено' }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '60px 20px', color: 'var(--color-text-muted)', gap: '12px',
    }}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
      </svg>
      <p style={{ margin: 0, fontSize: '15px' }}>{message}</p>
    </div>
  )
}
