export function Spinner({ size = 24 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size,
      border: `${size * 0.1}px solid rgba(186,214,247,0.15)`,
      borderTopColor: 'var(--color-accent)',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
    }} />
  )
}
