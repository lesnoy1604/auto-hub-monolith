import type { ContractStatus } from '@/shared/types'

const config: Record<ContractStatus, { label: string; cls: string; style?: React.CSSProperties }> = {
  ACTIVE:    { label: 'Активен',   cls: 'badge badge-success' },
  COMPLETED: { label: 'Завершён',  cls: 'badge', style: { background: 'rgba(186,214,247,0.08)', color: 'var(--color-text-muted)' } },
  CANCELLED: { label: 'Отменён',   cls: 'badge badge-danger' },
}

export function ContractStatusBadge({ status }: { status: ContractStatus }) {
  const { label, cls, style } = config[status]
  return <span className={cls} style={style}>{label}</span>
}
