import type { FineStatus } from '@/shared/types'

const config: Record<FineStatus, { label: string; cls: string }> = {
  UNPAID:   { label: 'Не оплачен',    cls: 'badge badge-danger' },
  PAID:     { label: 'Оплачен',       cls: 'badge badge-success' },
  DISPUTED: { label: 'Оспаривается',  cls: 'badge badge-warning' },
}

export function FineStatusBadge({ status }: { status: FineStatus }) {
  const { label, cls } = config[status]
  return <span className={cls}>{label}</span>
}
