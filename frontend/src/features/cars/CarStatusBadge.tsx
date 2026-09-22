import type { CarStatus } from '@/shared/types'

const config: Record<CarStatus, { label: string; cls: string; style?: React.CSSProperties }> = {
  FREE:   { label: 'Свободна',   cls: 'badge badge-success' },
  RENTED: { label: 'В аренде',   cls: 'badge', style: { background: 'var(--color-accent-bg)', color: 'var(--color-accent-text)' } },
  REPAIR: { label: 'В ремонте',  cls: 'badge badge-warning' },
  SOLD:   { label: 'Продана',    cls: 'badge', style: { background: 'rgba(186,214,247,0.08)', color: 'var(--color-text-muted)' } },
}

export function CarStatusBadge({ status }: { status: CarStatus }) {
  const { label, cls, style } = config[status]
  return <span className={cls} style={style}>{label}</span>
}
