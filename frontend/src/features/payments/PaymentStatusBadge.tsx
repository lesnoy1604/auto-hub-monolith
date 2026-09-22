import type { PaymentStatus } from '@/shared/types'

const config: Record<PaymentStatus, { label: string; cls: string }> = {
  PAID:    { label: 'Оплачен',    cls: 'badge badge-success' },
  UNPAID:  { label: 'Ожидается',  cls: 'badge badge-warning' },
  OVERDUE: { label: 'Просрочен',  cls: 'badge badge-danger' },
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const { label, cls } = config[status]
  return <span className={cls}>{label}</span>
}
