import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useGetCarsQuery } from './carsApi'
import { CarStatusBadge } from './CarStatusBadge'
import { CarFormModal } from './CarFormModal'
import { FilterChips } from '@/shared/ui/FilterChips'
import { SearchInput } from '@/shared/ui/SearchInput'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Spinner } from '@/shared/ui/Spinner'
import { formatMoney } from '@/shared/lib/formatMoney'
import type { Car } from '@/shared/types'

const STATUS_FILTERS = [
  { label: 'Все', value: '' },
  { label: 'Свободна', value: 'FREE' },
  { label: 'В аренде', value: 'RENTED' },
  { label: 'В ремонте', value: 'REPAIR' },
  { label: 'Продана', value: 'SOLD' },
]

export function CarsPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const { data, isLoading } = useGetCarsQuery({
    ...(status ? { status } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  })
  const cars = data?.cars ?? []

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '34px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
          Машины <span style={{ fontSize: '20px', color: 'var(--color-text-muted)', fontWeight: 400 }}>{cars.length}</span>
        </h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Добавить машину
        </button>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <FilterChips chips={STATUS_FILTERS} active={status} onChange={setStatus} />
        <SearchInput value={search} onChange={setSearch} placeholder="Поиск по номеру..." />
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '40px' }}><Spinner size={32} /></div>
      ) : cars.length === 0 ? (
        <EmptyState message="Машины не найдены" />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-neutral-border)' }}>
                {['Гос. номер', 'Модель · год', 'Статус', 'Водитель', 'Остаток до выкупа'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '14px 16px', fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cars.map((car: Car) => {
                const activeContract = car.contracts?.find(c => c.status === 'ACTIVE')
                const paidAmount = activeContract?.payments?.filter(p => p.status === 'PAID').reduce((s, p) => s + Number(p.amount), 0) ?? 0
                const remaining = activeContract ? Number(activeContract.totalAmount) - paidAmount : null

                return (
                  <tr
                    key={car.id}
                    onClick={() => navigate(`/cars/${car.id}`)}
                    style={{ borderBottom: '1px solid var(--color-neutral-border)', cursor: 'pointer', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(186,214,247,0.03)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '14px 16px', fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{car.plateNumber}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>{car.brand} {car.model} · {car.year}</td>
                    <td style={{ padding: '14px 16px' }}><CarStatusBadge status={car.status} /></td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: 'var(--color-text-muted)' }}>
                      {activeContract ? (car.contracts?.find(c => c.id === activeContract.id)?.driver?.fullName ?? '—') : '—'}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: remaining !== null && remaining > 0 ? 'var(--color-accent-text)' : 'var(--color-success)' }}>
                      {remaining !== null ? formatMoney(remaining) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <CarFormModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  )
}
