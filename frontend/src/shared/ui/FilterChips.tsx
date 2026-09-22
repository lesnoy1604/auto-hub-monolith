interface FilterChip { label: string; value: string }

interface FilterChipsProps {
  chips: FilterChip[]
  active: string
  onChange: (v: string) => void
}

export function FilterChips({ chips, active, onChange }: FilterChipsProps) {
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      {chips.map((c) => (
        <button
          key={c.value}
          onClick={() => onChange(c.value)}
          style={{
            padding: '6px 14px', borderRadius: '999px',
            fontSize: '13px', fontWeight: 500, cursor: 'pointer', border: 'none',
            background: active === c.value ? 'var(--color-accent-bg)' : 'rgba(186,214,247,0.06)',
            color: active === c.value ? 'var(--color-accent-text)' : 'var(--color-text-muted)',
            boxShadow: active === c.value ? 'inset 0 0 0 1px rgba(102,58,243,0.35)' : 'inset 0 0 0 1px var(--color-neutral-border)',
            transition: 'all 0.15s',
          }}
        >
          {c.label}
        </button>
      ))}
    </div>
  )
}
