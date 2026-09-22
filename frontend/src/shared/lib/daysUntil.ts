export const daysUntil = (d: string | Date) =>
  Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)

export const daysOverdue = (d: string | Date) =>
  Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 86400000))

export const daysColor = (days: number) =>
  days <= 14 ? 'text-[var(--color-danger)]' : days <= 30 ? 'text-[var(--color-warning)]' : 'text-[var(--color-text-muted)]'
