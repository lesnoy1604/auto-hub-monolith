import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'success' | 'warning' | 'danger' | 'accent' | 'neutral'
}

export function Badge({ children, variant = 'neutral' }: BadgeProps) {
  const cls = variant === 'success' ? 'badge badge-success'
    : variant === 'warning' ? 'badge badge-warning'
    : variant === 'danger' ? 'badge badge-danger'
    : variant === 'accent' ? 'badge'
    : 'badge'
  const style = variant === 'accent'
    ? { background: 'var(--color-accent-bg)', color: 'var(--color-accent-text)' }
    : variant === 'neutral'
    ? { background: 'rgba(186,214,247,0.08)', color: 'var(--color-text-muted)' }
    : {}
  return <span className={cls} style={style}>{children}</span>
}
