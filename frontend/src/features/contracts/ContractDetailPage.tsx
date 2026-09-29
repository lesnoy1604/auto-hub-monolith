import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router'
import { useGetContractByIdQuery, useDeleteContractMutation } from './contractsApi'
import { ContractStatusBadge } from './ContractStatusBadge'
import { ContractFormModal } from './ContractFormModal'
import { PaymentMarkModal } from '@/features/payments/PaymentMarkModal'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Spinner } from '@/shared/ui/Spinner'
import { formatDate } from '@/shared/lib/formatDate'
import { formatMoney } from '@/shared/lib/formatMoney'
import { getApiError } from '@/shared/lib/apiError'
import type { Payment } from '@/shared/types'

export function ContractDetailPage() {
  const { id } = useParams<{ id: string }>()
  const contractId = Number(id)
  const navigate = useNavigate()
  const { data: contract, isLoading, refetch } = useGetContractByIdQuery(contractId)
  const [deleteContract, { isLoading: deleting }] = useDeleteContractMutation()
  const [showEditModal, setShowEditModal] = useState(false)
  const [payModal, setPayModal] = useState<Payment | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const handleDelete = async () => {
    try {
      await deleteContract(contractId).unwrap()
      navigate('/contracts')
    } catch (err) {
      setDeleteError(getApiError(err))
    }
  }

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}><Spinner size={36} /></div>
  if (!contract) return <div style={{ color: 'var(--color-text-muted)', padding: 40 }}>Договор не найден</div>

  const payments = contract.payments ?? []
  const paidAmount = payments.filter(p => p.status === 'PAID').reduce((s, p) => s + Number(p.amount), 0)
  const remaining = Number(contract.totalAmount) - paidAmount
  const progress = Math.min(100, Math.round((paidAmount / Number(contract.totalAmount)) * 100))
  const monthsTotal = Math.ceil(Number(contract.totalAmount) / Number(contract.monthlyPayment))

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <h1 style={{ margin: 0, fontSize: '34px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
              Договор №{contract.id}
            </h1>
            <ContractStatusBadge status={contract.status} />
          </div>
          <p style={{ margin: 0, fontSize: '15px', color: 'var(--color-text-muted)' }}>{contract.car?.plateNumber} · {contract.driver?.fullName}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {contract.status === 'ACTIVE' && (
            <button className="btn btn-secondary" onClick={() => setShowEditModal(true)}>Редактировать</button>
          )}
          {contract.status !== 'ACTIVE' && (
            <button className="btn btn-danger" onClick={() => { setDeleteError(''); setShowDeleteDialog(true) }}>Удалить</button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        {/* Conditions */}
        <div className="card">
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Условия договора</h3>
          {[
            { label: 'Машина', value: <Link to={`/cars/${contract.carId}`} style={{ color: 'var(--color-accent-text)' }}>{contract.car?.plateNumber} — {contract.car?.brand} {contract.car?.model}</Link> },
            { label: 'Водитель', value: <Link to={`/drivers/${contract.driverId}`} style={{ color: 'var(--color-accent-text)' }}>{contract.driver?.fullName}</Link> },
            { label: 'Начало', value: formatDate(contract.startDate) },
            { label: 'Окончание', value: contract.endDate ? formatDate(contract.endDate) : '—' },
            { label: 'Платёж/мес', value: formatMoney(contract.monthlyPayment) },
            { label: 'Срок', value: `${monthsTotal} мес.` },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>{label}</span>
              <span style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Buyout */}
        <div className="card">
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Выкуп</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            {[
              { label: 'Сумма', value: formatMoney(contract.totalAmount) },
              { label: 'Выплачено', value: formatMoney(paidAmount) },
              { label: 'Остаток', value: formatMoney(remaining) },
              { label: 'Прогресс', value: `${progress}%` },
            ].map(({ label, value }) => (
              <div key={label}>
                <p style={{ margin: '0 0 2px', fontSize: '12px', color: 'var(--color-text-muted)' }}>{label}</p>
                <p style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{value}</p>
              </div>
            ))}
          </div>
          <div style={{ height: '8px', borderRadius: '999px', background: 'rgba(186,214,247,0.1)', overflow: 'hidden', marginBottom: '8px' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: progress === 100 ? 'var(--color-success)' : 'var(--color-accent)', borderRadius: '999px', transition: 'width 0.3s' }} />
          </div>
          {progress === 100 && (
            <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--color-success-bg)', color: 'var(--color-success)', fontSize: '13px', fontWeight: 500, textAlign: 'center' }}>
              Выкуп завершён
            </div>
          )}
        </div>
      </div>

      {/* Payment schedule */}
      <div className="card">
        <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>График платежей</h3>
        {payments.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Нет платежей</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-neutral-border)' }}>
                {['№', 'Дата', 'Сумма', 'Оплачено', 'Статус', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 12px 10px 0', fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...payments].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).map((p: Payment, idx) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--color-neutral-border)' }}>
                  <td style={{ padding: '12px 12px 12px 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>{idx + 1}</td>
                  <td style={{ padding: '12px 12px 12px 0', fontSize: '14px', color: 'var(--color-text-secondary)' }}>{formatDate(p.dueDate)}</td>
                  <td style={{ padding: '12px 12px 12px 0', fontSize: '14px', color: 'var(--color-text-primary)' }}>{formatMoney(p.amount)}</td>
                  <td style={{ padding: '12px 12px 12px 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>{p.paidDate ? formatDate(p.paidDate) : '—'}</td>
                  <td style={{ padding: '12px 12px 12px 0' }}>
                    <span className={p.status === 'PAID' ? 'badge badge-success' : p.status === 'OVERDUE' ? 'badge badge-danger' : 'badge badge-warning'}>
                      {p.status === 'PAID' ? 'Оплачен' : p.status === 'OVERDUE' ? 'Просрочен' : 'Ожидается'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 0' }}>
                    {p.status !== 'PAID' && (
                      <button onClick={() => setPayModal(p)} style={{ padding: '4px 12px', borderRadius: '6px', border: 'none', background: 'var(--color-accent-bg)', color: 'var(--color-accent-text)', fontSize: '12px', cursor: 'pointer', fontWeight: 500 }}>
                        Оплатить
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ContractFormModal open={showEditModal} onClose={() => setShowEditModal(false)} contract={contract} />
      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="Удалить договор"
        message={`Удалить договор №${contract.id}? Все платежи по нему также будут удалены.`}
        loading={deleting}
        error={deleteError}
        onConfirm={handleDelete}
      />
      {payModal && (
        <PaymentMarkModal
          payment={payModal}
          car={contract.car}
          driver={contract.driver}
          onClose={() => setPayModal(null)}
          onSuccess={() => { setPayModal(null); refetch() }}
        />
      )}
    </div>
  )
}
