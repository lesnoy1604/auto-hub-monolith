import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@/shared/lib/zodResolver'
import { z } from 'zod'
import { Modal } from '@/shared/ui/Modal'
import { Input } from '@/shared/ui/Input'
import { useCreateFineMutation } from './finesApi'
import { useGetCarsQuery } from '@/features/cars/carsApi'
import { useGetDriversQuery } from '@/features/drivers/driversApi'

const schema = z.object({
  carId: z.coerce.number().min(1, 'Выберите машину'),
  driverId: z.coerce.number().min(1, 'Выберите водителя'),
  contractId: z.coerce.number().optional(),
  amount: z.coerce.number().min(1, 'Обязательное поле'),
  description: z.string().min(1, 'Обязательное поле'),
  fineDate: z.string().min(1, 'Обязательное поле'),
})
type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  preselectedCarId?: number
}

export function FineFormModal({ open, onClose, preselectedCarId }: Props) {
  const [createFine, { isLoading, error }] = useCreateFineMutation()
  const { data: cars = [] } = useGetCarsQuery({})
  const { data: drivers = [] } = useGetDriversQuery({})

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      carId: preselectedCarId,
      fineDate: new Date().toISOString().slice(0, 10),
    },
  })

  useEffect(() => {
    if (open) reset({ carId: preselectedCarId, fineDate: new Date().toISOString().slice(0, 10) })
  }, [open, preselectedCarId, reset])

  const onSubmit = async (data: FormData) => {
    await createFine({
      carId: data.carId,
      driverId: data.driverId,
      contractId: data.contractId || undefined,
      amount: data.amount,
      description: data.description,
      fineDate: data.fineDate,
    }).unwrap()
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Добавить штраф">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#615D73' }}>Машина</label>
          <select {...register('carId')} style={{ width: '100%', height: '44px', borderRadius: '14px', background: '#F5F4FA', border: errors.carId ? '1px solid #C62828' : '1px solid #E6E3F0', padding: '0 14px', fontSize: '15px', color: '#1a1a2e', outline: 'none', boxSizing: 'border-box' }}>
            <option value="">Выберите машину</option>
            {cars.map(c => <option key={c.id} value={c.id}>{c.plateNumber} — {c.brand} {c.model}</option>)}
          </select>
          {errors.carId && <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#C62828' }}>{errors.carId.message}</p>}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#615D73' }}>Водитель</label>
          <select {...register('driverId')} style={{ width: '100%', height: '44px', borderRadius: '14px', background: '#F5F4FA', border: errors.driverId ? '1px solid #C62828' : '1px solid #E6E3F0', padding: '0 14px', fontSize: '15px', color: '#1a1a2e', outline: 'none', boxSizing: 'border-box' }}>
            <option value="">Выберите водителя</option>
            {drivers.map(d => <option key={d.id} value={d.id}>{d.fullName}</option>)}
          </select>
          {errors.driverId && <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#C62828' }}>{errors.driverId.message}</p>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <Input label="Сумма" type="number" {...register('amount')} error={errors.amount?.message} />
          <Input label="Дата штрафа" type="date" {...register('fineDate')} error={errors.fineDate?.message} />
        </div>
        <Input label="Описание нарушения" {...register('description')} error={errors.description?.message} />

        {error && (
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
