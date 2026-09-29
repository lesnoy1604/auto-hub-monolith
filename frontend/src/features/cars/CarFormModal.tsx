import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@/shared/lib/zodResolver'
import { z } from 'zod'
import { Modal } from '@/shared/ui/Modal'
import { Input } from '@/shared/ui/Input'
import { Select } from '@/shared/ui/Select'
import { useCreateCarMutation, useUpdateCarMutation } from './carsApi'
import type { Car } from '@/shared/types'

const schema = z.object({
  plateNumber: z.string().min(1, 'Обязательное поле'),
  vin: z.string().min(17, 'VIN — 17 символов').max(17, 'VIN — 17 символов'),
  brand: z.string().min(1, 'Обязательное поле'),
  model: z.string().min(1, 'Обязательное поле'),
  year: z.coerce.number().int().min(2000, 'Мин. 2000').max(2030, 'Макс. 2030'),
  mileage: z.coerce.number().min(0).optional(),
  engineVolume: z.coerce.number().min(0.1).max(10).optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  fuelType: z.enum(['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'GAS', '']).optional(),
  bodyType: z.enum(['SEDAN', 'HATCHBACK', 'CROSSOVER', 'MINIVAN', 'WAGON', 'SUV', 'COUPE', 'PICKUP', 'VAN', '']).optional(),
  status: z.enum(['FREE', 'RENTED', 'REPAIR', 'SOLD']),
  osagoBefore: z.string().optional(),
  inspectionBefore: z.string().optional(),
})
type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  car?: Car
}

export function CarFormModal({ open, onClose, car }: Props) {
  const [createCar, { isLoading: creating, error: createError }] = useCreateCarMutation()
  const [updateCar, { isLoading: updating, error: updateError }] = useUpdateCarMutation()
  const isLoading = creating || updating
  const apiError = createError || updateError

  const toDateInput = (d?: string | null) => d ? d.slice(0, 10) : ''
  const toRFC3339 = (d?: string) => d ? `${d}T00:00:00Z` : undefined

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: car ? {
      plateNumber: car.plateNumber,
      vin: car.vin,
      brand: car.brand,
      model: car.model,
      year: car.year,
      mileage: car.mileage,
      engineVolume: car.engineVolume ?? undefined,
      fuelType: car.fuelType ?? '',
      bodyType: car.bodyType ?? '',
      status: car.status,
      osagoBefore: toDateInput(car.osagoBefore),
      inspectionBefore: toDateInput(car.inspectionBefore),
    } : { status: 'FREE', fuelType: '', bodyType: '' },
  })

  useEffect(() => {
    if (open) {
      reset(car ? {
        plateNumber: car.plateNumber, vin: car.vin, brand: car.brand, model: car.model,
        year: car.year, mileage: car.mileage, status: car.status,
        engineVolume: car.engineVolume ?? undefined,
        fuelType: car.fuelType ?? '',
        bodyType: car.bodyType ?? '',
        osagoBefore: toDateInput(car.osagoBefore), inspectionBefore: toDateInput(car.inspectionBefore),
      } : { status: 'FREE', fuelType: '' })
    }
  }, [open, car, reset])

  const onSubmit = async (data: FormData) => {
    const payload = {
      ...data,
      fuelType: data.fuelType || undefined,
      bodyType: data.bodyType || undefined,
      osagoBefore: data.osagoBefore ? toRFC3339(data.osagoBefore) : undefined,
      inspectionBefore: data.inspectionBefore ? toRFC3339(data.inspectionBefore) : undefined,
    }
    if (car) {
      await updateCar({ id: car.id, ...payload }).unwrap()
    } else {
      await createCar(payload).unwrap()
    }
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={car ? 'Редактировать машину' : 'Добавить машину'}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <Input label="Гос. номер" {...register('plateNumber')} error={errors.plateNumber?.message} />
          <Input label="VIN" {...register('vin')} error={errors.vin?.message} />
          <Input label="Марка" {...register('brand')} error={errors.brand?.message} />
          <Input label="Модель" {...register('model')} error={errors.model?.message} />
          <Input label="Год" type="number" {...register('year')} error={errors.year?.message} />
          <Input label="Пробег км" type="number" {...register('mileage')} error={errors.mileage?.message} />
          <Input label="Объём двигателя (л)" type="number" step="0.1" {...register('engineVolume')} error={errors.engineVolume?.message} />
          <Select label="Тип топлива" {...register('fuelType')} error={errors.fuelType?.message}>
            <option value="">— не указано —</option>
            <option value="PETROL">Бензин</option>
            <option value="DIESEL">Дизель</option>
            <option value="ELECTRIC">Электро</option>
            <option value="HYBRID">Гибрид</option>
            <option value="GAS">Газ</option>
          </Select>
          <div style={{ gridColumn: '1 / -1' }}><Select label="Тип кузова" {...register('bodyType')} error={errors.bodyType?.message}>
            <option value="">— не указано —</option>
            <option value="SEDAN">Седан</option>
            <option value="HATCHBACK">Хэтчбек</option>
            <option value="CROSSOVER">Кроссовер</option>
            <option value="MINIVAN">Минивэн</option>
            <option value="WAGON">Универсал</option>
            <option value="SUV">Внедорожник</option>
            <option value="COUPE">Купе</option>
            <option value="PICKUP">Пикап</option>
            <option value="VAN">Фургон</option>
          </Select></div>
        </div>
        <Select label="Статус" {...register('status')} error={errors.status?.message}>
          <option value="FREE">Свободна</option>
          <option value="RENTED">В аренде</option>
          <option value="REPAIR">В ремонте</option>
          <option value="SOLD">Продана</option>
        </Select>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <Input label="ОСАГО до" type="date" {...register('osagoBefore')} error={errors.osagoBefore?.message} />
          <Input label="Техосмотр до" type="date" {...register('inspectionBefore')} error={errors.inspectionBefore?.message} />
        </div>

        {apiError && (
          <div style={{ marginBottom: '16px', padding: '12px', borderRadius: '8px', background: '#FDEAEA', border: '1px solid #C62828', color: '#C62828', fontSize: '13px' }}>
            Ошибка при сохранении
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: '12px', border: '1px solid #E0DCEC', background: 'transparent', cursor: 'pointer', color: '#615D73', fontSize: '14px' }}>
            Отмена
          </button>
          <button type="submit" disabled={isLoading} style={{ padding: '10px 24px', borderRadius: '12px', border: 'none', background: '#6B3FE4', color: 'white', cursor: 'pointer', fontWeight: 500, fontSize: '14px', opacity: isLoading ? 0.7 : 1 }}>
            {isLoading ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
