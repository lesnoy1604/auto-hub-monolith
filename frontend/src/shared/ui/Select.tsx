import { forwardRef } from 'react'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  children: React.ReactNode
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ label, error, id, children, ...props }, ref) => {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div style={{ marginBottom: '16px' }}>
      {label && (
        <label htmlFor={inputId} style={{
          display: 'block', marginBottom: '6px',
          fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 500,
          textTransform: 'uppercase', letterSpacing: '0.05em', color: '#615D73',
        }}>
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={inputId}
        {...props}
        style={{
          width: '100%', height: '44px', borderRadius: '14px',
          background: '#F5F4FA', border: '1px solid #E6E3F0',
          padding: '0 14px', fontSize: '15px', color: '#1a1a2e',
          outline: 'none', boxSizing: 'border-box', cursor: 'pointer',
          ...(error ? { borderColor: '#C62828' } : {}),
        }}
      >
        {children}
      </select>
      {error && <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#C62828' }}>{error}</p>}
    </div>
  )
})
Select.displayName = 'Select'
