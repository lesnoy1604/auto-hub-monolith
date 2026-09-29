import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useGetDriversQuery } from './driversApi'
import { DriverFormModal } from './DriverFormModal'
import { FilterChips } from '@/shared/ui/FilterChips'
import { SearchInput } from '@/shared/ui/SearchInput'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Spinner } from '@/shared/ui/Spinner'
import type { Driver } from '@/shared/types'

const FILTERS = [
  { label: 'Все', value: '' },
  { label: 'Активные', value: 'ACTIVE' },
  { label: 'Неактивные', value: 'INACTIVE' },
]

export function DriversPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const { data, isLoading } = useGetDriversQuery({
    ...(status ? { status } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  })
  const drivers = data?.drivers ?? []

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '34px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
          Водители <span style={{ fontSize: '20px', color: 'var(--color-text-muted)', fontWeight: 400 }}>{drivers.length}</span>
        </h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Добавить водителя</button>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <FilterChips chips={FILTERS} active={status} onChange={setStatus} />
        <SearchInput value={search} onChange={setSearch} placeholder="Поиск по ФИО..." />
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '40px' }}><Spinner size={32} /></div>
      ) : drivers.length === 0 ? (
        <EmptyState message="Водители не найдены" />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-neutral-border)' }}>
                {['ФИО', 'Телефон', 'Паспорт', 'Статус', 'Текущая машина'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '14px 16px', fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {drivers.map((d: Driver) => {
                const activeContract = d.contracts?.find(c => c.status === 'ACTIVE')
                return (
                  <tr key={d.id} onClick={() => navigate(`/drivers/${d.id}`)} style={{ borderBottom: '1px solid var(--color-neutral-border)', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(186,214,247,0.03)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '14px 16px', fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{d.fullName}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>{d.phone}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{d.passportNum}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className={d.status === 'ACTIVE' ? 'badge badge-success' : 'badge'} style={d.status === 'INACTIVE' ? { background: 'rgba(186,214,247,0.08)', color: 'var(--color-text-muted)' } : undefined}>
                        {d.status === 'ACTIVE' ? 'Активен' : 'Неактивен'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: activeContract ? 'var(--color-accent-text)' : 'var(--color-text-muted)' }}>
                      {activeContract ? (activeContract.car?.plateNumber ?? '—') : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <DriverFormModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  )
}
