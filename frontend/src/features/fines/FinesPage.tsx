import { useState } from 'react'
import { Link } from 'react-router'
import { useGetFinesQuery, useUpdateFineMutation, useDeleteFineMutation } from './finesApi'
import { FineStatusBadge } from './FineStatusBadge'
import { FineFormModal } from './FineFormModal'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { FilterChips } from '@/shared/ui/FilterChips'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Spinner } from '@/shared/ui/Spinner'
import { formatDate } from '@/shared/lib/formatDate'
import { formatMoney } from '@/shared/lib/formatMoney'
import { getApiError } from '@/shared/lib/apiError'
import type { Fine } from '@/shared/types'

const FILTERS = [
  { label: 'Все', value: '' },
  { label: 'Не оплачены', value: 'UNPAID' },
  { label: 'Оспариваются', value: 'DISPUTED' },
  { label: 'Оплачены', value: 'PAID' },
]

export function FinesPage() {
  const [status, setStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const { data, isLoading } = useGetFinesQuery(status ? { status } : {})
  const fines = data?.fines ?? []
  const [updateFine] = useUpdateFineMutation()
  const [deleteFine, { isLoading: deleting }] = useDeleteFineMutation()
  const [deleteTarget, setDeleteTarget] = useState<Fine | null>(null)
  const [deleteError, setDeleteError] = useState('')

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteFine(deleteTarget.id).unwrap()
      setDeleteTarget(null)
    } catch (err) {
      setDeleteError(getApiError(err))
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '34px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
          Штрафы <span style={{ fontSize: '20px', color: 'var(--color-text-muted)', fontWeight: 400 }}>{fines.length}</span>
        </h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Добавить штраф</button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <FilterChips chips={FILTERS} active={status} onChange={setStatus} />
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '40px' }}><Spinner size={32} /></div>
      ) : fines.length === 0 ? (
        <EmptyState message="Штрафы не найдены" />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-neutral-border)' }}>
                {['Дата', 'Машина', 'Водитель', 'Сумма', 'Описание', 'Статус', 'Действия'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '14px 16px', fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fines.map((f: Fine) => (
                <tr key={f.id} style={{ borderBottom: '1px solid var(--color-neutral-border)' }}>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: 'var(--color-text-muted)' }}>{formatDate(f.fineDate)}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <Link to={`/cars/${f.carId}`} style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-accent-text)' }}>{f.car?.plateNumber ?? '—'}</Link>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>{f.driver?.fullName ?? '—'}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{formatMoney(f.amount)}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: 'var(--color-text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.description}</td>
                  <td style={{ padding: '14px 16px' }}><FineStatusBadge status={f.status} /></td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {f.status !== 'PAID' && (
                        <button
                          onClick={() => updateFine({ id: f.id, status: 'PAID' })}
                          title="Оплачен"
                          style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid rgba(74,222,128,0.3)', background: 'rgba(74,222,128,0.08)', color: 'var(--color-success)', fontSize: '12px', cursor: 'pointer' }}
                        >✓ Оплачен</button>
                      )}
                      {f.status !== 'DISPUTED' && (
                        <button
                          onClick={() => updateFine({ id: f.id, status: 'DISPUTED' })}
                          title="Оспорить"
                          style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid rgba(251,146,60,0.3)', background: 'rgba(251,146,60,0.08)', color: 'var(--color-warning)', fontSize: '12px', cursor: 'pointer' }}
                        >⚖ Оспорить</button>
                      )}
                      {f.status !== 'UNPAID' && (
                        <button
                          onClick={() => updateFine({ id: f.id, status: 'UNPAID' })}
                          title="Сбросить"
                          style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--color-neutral-border)', background: 'rgba(186,214,247,0.06)', color: 'var(--color-text-muted)', fontSize: '12px', cursor: 'pointer' }}
                        >↺ Сбросить</button>
                      )}
                      <button
                        onClick={() => { setDeleteError(''); setDeleteTarget(f) }}
                        title="Удалить"
                        style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid rgba(198,40,40,0.3)', background: 'rgba(198,40,40,0.06)', color: '#C62828', fontSize: '12px', cursor: 'pointer' }}
                      >✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <FineFormModal open={showModal} onClose={() => setShowModal(false)} />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Удалить штраф"
        message={deleteTarget ? `Удалить штраф на ${formatMoney(deleteTarget.amount)} (${deleteTarget.description})?` : ''}
        loading={deleting}
        error={deleteError}
        onConfirm={handleDelete}
      />
    </div>
  )
}
