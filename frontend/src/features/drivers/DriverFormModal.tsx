import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@/shared/lib/zodResolver'
import { z } from 'zod'
import { Modal } from '@/shared/ui/Modal'
import { Input } from '@/shared/ui/Input'
import { Select } from '@/shared/ui/Select'
import { useCreateDriverMutation, useUpdateDriverMutation } from './driversApi'
import type { Driver } from '@/shared/types'

const schema = z.object({
  fullName: z.string().min(1, 'Обязательное поле'),
  phone: z.string().min(1, 'Обязательное поле'),
  passportNum: z.string().min(1, 'Обязательное поле'),
  licenseNum: z.string().min(1, 'Обязательное поле'),
  status: z.enum(['ACTIVE', 'INACTIVE']),
})
type FormData = z.infer<typeof schema>

interface Props { open: boolean; onClose: () => void; driver?: Driver }

export function DriverFormModal({ open, onClose, driver }: Props) {
  const [createDriver, { isLoading: creating, error: createError }] = useCreateDriverMutation()
  const [updateDriver, { isLoading: updating, error: updateError }] = useUpdateDriverMutation()
  const isLoading = creating || updating
  const apiError = createError || updateError

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: driver ? { fullName: driver.fullName, phone: driver.phone, passportNum: driver.passportNum, licenseNum: driver.licenseNum, status: driver.status } : { status: 'ACTIVE' },
  })

  useEffect(() => {
    if (open) reset(driver ? { fullName: driver.fullName, phone: driver.phone, passportNum: driver.passportNum, licenseNum: driver.licenseNum, status: driver.status } : { status: 'ACTIVE' })
  }, [open, driver, reset])

  const onSubmit = async (data: FormData) => {
    if (driver) await updateDriver({ id: driver.id, ...data }).unwrap()
    else await createDriver(data).unwrap()
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={driver ? 'Редактировать водителя' : 'Добавить водителя'}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Input label="ФИО" {...register('fullName')} error={errors.fullName?.message} />
        <Input label="Телефон" {...register('phone')} error={errors.phone?.message} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <Input label="Паспорт серия и номер" {...register('passportNum')} error={errors.passportNum?.message} />
          <Input label="Номер водит. удостоверения" {...register('licenseNum')} error={errors.licenseNum?.message} />
        </div>
        <Select label="Статус" {...register('status')} error={errors.status?.message}>
          <option value="ACTIVE">Активен</option>
          <option value="INACTIVE">Неактивен</option>
        </Select>

        {apiError && (
          <div style={{ marginBottom: '16px', padding: '12px', borderRadius: '8px', background: '#FDEAEA', border: '1px solid #C62828', color: '#C62828', fontSize: '13px' }}>
            Ошибка при сохранении
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: '12px', border: '1px solid #E0DCEC', background: 'transparent', cursor: 'pointer', color: '#615D73', fontSize: '14px' }}>Отмена</button>
          <button type="submit" disabled={isLoading} style={{ padding: '10px 24px', borderRadius: '12px', border: 'none', background: '#6B3FE4', color: 'white', cursor: 'pointer', fontWeight: 500, fontSize: '14px', opacity: isLoading ? 0.7 : 1 }}>
            {isLoading ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
