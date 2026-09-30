import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@/shared/lib/zodResolver'
import { z } from 'zod'
import { Modal } from '@/shared/ui/Modal'
import { Input } from '@/shared/ui/Input'
import { Select } from '@/shared/ui/Select'
import { useCreateContractMutation, useUpdateContractMutation } from './contractsApi'
import { useGetCarsQuery } from '@/features/cars/carsApi'
import { useGetDriversQuery } from '@/features/drivers/driversApi'
import { formatMoney } from '@/shared/lib/formatMoney'
import type { Contract } from '@/shared/types'

const createSchema = z.object({
  carId: z.coerce.number().min(1, 'Выберите машину'),
  driverId: z.coerce.number().min(1, 'Выберите водителя'),
  totalAmount: z.coerce.number().min(1, 'Обязательное поле'),
  monthlyPayment: z.coerce.number().min(1, 'Обязательное поле'),
  startDate: z.string().min(1, 'Обязательное поле'),
})

const editSchema = z.object({
  status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']),
  endDate: z.string().optional(),
})

type CreateData = z.infer<typeof createSchema>
type EditData = z.infer<typeof editSchema>

interface Props {
  open: boolean
  onClose: () => void
  contract?: Contract
  preselectedCarId?: number
  preselectedCarLabel?: string
}

export function ContractFormModal({ open, onClose, contract, preselectedCarId, preselectedCarLabel }: Props) {
  const isEdit = !!contract
  const [createContract, { isLoading: creating, error: createError }] = useCreateContractMutation()
  const [updateContract, { isLoading: updating, error: updateError }] = useUpdateContractMutation()
  const { data: freeCarsData } = useGetCarsQuery({ status: 'FREE' }, { skip: isEdit || !!preselectedCarId })
  const freeCars = freeCarsData?.cars ?? []
  const { data: activeDriversData } = useGetDriversQuery({ status: 'ACTIVE' }, { skip: isEdit })
  const activeDrivers = activeDriversData?.drivers ?? []

  const isLoading = creating || updating
  const apiError = createError || updateError

  const createForm = useForm<CreateData>({ resolver: zodResolver(createSchema) })
  const editForm = useForm<EditData>({
    resolver: zodResolver(editSchema),
    defaultValues: { status: contract?.status ?? 'ACTIVE', endDate: contract?.endDate ?? '' },
  })

  const { watch: watchCreate } = createForm
  const totalAmount = watchCreate('totalAmount')
  const monthlyPayment = watchCreate('monthlyPayment')
  const months = totalAmount && monthlyPayment ? Math.ceil(Number(totalAmount) / Number(monthlyPayment)) : 0
  const lastPayment = totalAmount && monthlyPayment && months > 0 ? Number(totalAmount) % Number(monthlyPayment) || Number(monthlyPayment) : 0

  const watchedStatus = editForm.watch('status')

  useEffect(() => {
    if (open && isEdit) {
      editForm.reset({ status: contract?.status ?? 'ACTIVE', endDate: contract?.endDate ?? '' })
    }
    if (open && !isEdit && preselectedCarId) {
      createForm.setValue('carId', preselectedCarId)
    }
  }, [open, contract, isEdit, editForm, preselectedCarId, createForm])

  const onSubmitCreate = async (data: CreateData) => {
    await createContract({ ...data, startDate: data.startDate + 'T00:00:00Z' }).unwrap()
    onClose()
  }

  const onSubmitEdit = async (data: EditData) => {
    if (!contract) return
    await updateContract({
      id: contract.id,
      ...data,
      endDate: data.endDate ? `${data.endDate}T00:00:00Z` : undefined,
    }).unwrap()
    onClose()
  }

  const ErrorBlock = () => apiError ? (
    <div style={{ marginBottom: '16px', padding: '12px', borderRadius: '8px', background: '#FDEAEA', border: '1px solid #C62828', color: '#C62828', fontSize: '13px' }}>
      Ошибка при сохранении
    </div>
  ) : null

  const Buttons = ({ disabled }: { disabled: boolean }) => (
    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
      <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: '12px', border: '1px solid #E0DCEC', background: 'transparent', cursor: 'pointer', color: '#615D73', fontSize: '14px' }}>Отмена</button>
      <button type="submit" disabled={disabled} style={{ padding: '10px 24px', borderRadius: '12px', border: 'none', background: '#6B3FE4', color: 'white', cursor: 'pointer', fontWeight: 500, fontSize: '14px', opacity: disabled ? 0.7 : 1 }}>
        {disabled ? 'Сохранение...' : 'Сохранить'}
      </button>
    </div>
  )

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Редактировать договор' : 'Новый договор'}>
      {isEdit ? (
        <form onSubmit={editForm.handleSubmit(onSubmitEdit)}>
          <Select label="Статус" {...editForm.register('status')} error={editForm.formState.errors.status?.message}>
            <option value="ACTIVE">Активен</option>
            <option value="COMPLETED">Завершён</option>
            <option value="CANCELLED">Отменён</option>
          </Select>
          {watchedStatus !== 'ACTIVE' && (
            <Input label="Дата окончания" type="date" {...editForm.register('endDate')} error={editForm.formState.errors.endDate?.message} />
          )}
          <ErrorBlock />
          <Buttons disabled={isLoading} />
        </form>
      ) : (
        <form onSubmit={createForm.handleSubmit(onSubmitCreate)}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#615D73' }}>Машина</label>
            {preselectedCarId ? (
              <div style={{ padding: '10px 14px', borderRadius: '14px', background: '#F5F4FA', border: '1px solid #E6E3F0', fontSize: '15px', color: '#1a1a2e' }}>{preselectedCarLabel ?? `ID ${preselectedCarId}`}</div>
            ) : freeCars.length === 0 ? (
              <div style={{ padding: '10px 14px', borderRadius: '14px', background: '#FFF8E1', border: '1px solid #FFE082', color: '#9A7200', fontSize: '14px' }}>Нет свободных машин</div>
            ) : (
              <select {...createForm.register('carId')} style={{ width: '100%', height: '44px', borderRadius: '14px', background: '#F5F4FA', border: '1px solid #E6E3F0', padding: '0 14px', fontSize: '15px', color: '#1a1a2e', outline: 'none', boxSizing: 'border-box' }}>
                <option value="">Выберите машину</option>
                {freeCars.map(c => <option key={c.id} value={c.id}>{c.plateNumber} — {c.brand} {c.model}</option>)}
              </select>
            )}
            {createForm.formState.errors.carId && <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#C62828' }}>{createForm.formState.errors.carId.message}</p>}
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#615D73' }}>Водитель</label>
            <select {...createForm.register('driverId')} style={{ width: '100%', height: '44px', borderRadius: '14px', background: '#F5F4FA', border: '1px solid #E6E3F0', padding: '0 14px', fontSize: '15px', color: '#1a1a2e', outline: 'none', boxSizing: 'border-box' }}>
              <option value="">Выберите водителя</option>
              {activeDrivers.map(d => <option key={d.id} value={d.id}>{d.fullName}</option>)}
            </select>
            {createForm.formState.errors.driverId && <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#C62828' }}>{createForm.formState.errors.driverId.message}</p>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Input label="Сумма выкупа" type="number" {...createForm.register('totalAmount')} error={createForm.formState.errors.totalAmount?.message} />
            <Input label="Платёж / мес" type="number" {...createForm.register('monthlyPayment')} error={createForm.formState.errors.monthlyPayment?.message} />
          </div>
          <Input label="Дата начала" type="date" {...createForm.register('startDate')} error={createForm.formState.errors.startDate?.message} />
          {months > 0 && (
            <div style={{ marginBottom: '16px', padding: '12px 14px', borderRadius: '10px', background: '#F0EEFF', border: '1px solid #D4C8FF', fontSize: '13px', color: '#4A3A8A' }}>
              График: {months} мес. по {formatMoney(monthlyPayment)} · последний {formatMoney(lastPayment)}
            </div>
          )}
          <ErrorBlock />
          <Buttons disabled={isLoading || (!preselectedCarId && freeCars.length === 0)} />
        </form>
      )}
    </Modal>
  )
}
