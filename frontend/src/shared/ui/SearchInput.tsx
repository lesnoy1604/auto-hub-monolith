interface SearchInputProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}

export function SearchInput({ value, onChange, placeholder = 'Поиск...' }: SearchInputProps) {
  return (
    <div style={{ position: 'relative' }}>
      <svg
        width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="var(--color-text-muted)" strokeWidth="2"
        style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
      >
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          height: '38px', paddingLeft: '36px', paddingRight: '14px',
          borderRadius: '999px', border: '1px solid var(--color-neutral-border)',
          background: 'var(--color-neutral-surface)', color: 'var(--color-text-primary)',
          fontSize: '14px', outline: 'none', width: '240px', boxSizing: 'border-box',
        }}
      />
    </div>
  )
}
