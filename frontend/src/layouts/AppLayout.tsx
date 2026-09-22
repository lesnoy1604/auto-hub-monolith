import { Outlet, NavLink, useNavigate } from 'react-router'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { logout } from '@/features/auth/authSlice'

const navItems = [
  { to: '/', label: 'Дашборд', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  )},
  { to: '/cars', label: 'Машины', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v9a2 2 0 01-2 2h-2"/>
      <circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>
    </svg>
  )},
  { to: '/contracts', label: 'Договоры', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/>
    </svg>
  )},
  { to: '/drivers', label: 'Водители', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )},
  { to: '/payments', label: 'Должники', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  )},
  { to: '/fines', label: 'Штрафы', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  )},
]

export function AppLayout() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const user = useAppSelector((s) => s.auth.user)

  const handleLogout = async () => {
    await dispatch(logout())
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
      {/* Background grid */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(rgba(186,215,247,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(186,215,247,0.04) 1px, transparent 1px)`,
        backgroundSize: '80px 80px',
        WebkitMaskImage: 'radial-gradient(ellipse 100% 60% at 50% 0%, rgba(0,0,0,0.5), transparent 80%)',
        maskImage: 'radial-gradient(ellipse 100% 60% at 50% 0%, rgba(0,0,0,0.5), transparent 80%)',
      }} />

      {/* Sidebar */}
      <aside style={{
        width: '230px', minHeight: '100vh', flexShrink: 0,
        background: '#090a14',
        borderRight: '1px solid rgba(186,215,247,0.07)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0,
        zIndex: 10,
      }}>
        {/* Brand */}
        <div style={{ padding: '24px 20px 16px' }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700,
            background: 'linear-gradient(135deg, #98c0ef, #d8ecf8)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Автопарк
          </span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '8px 12px' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '10px', marginBottom: '2px',
                textDecoration: 'none', fontSize: '14px', fontWeight: 500,
                transition: 'all 0.15s',
                ...(isActive ? {
                  background: 'var(--color-accent-bg)',
                  color: 'var(--color-text-primary)',
                  boxShadow: 'inset 0 0 0 1px rgba(102,58,243,0.35)',
                } : {
                  color: 'var(--color-moon-mist)',
                  background: 'transparent',
                }),
              })}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User block */}
        <div style={{
          padding: '16px 12px',
          borderTop: '1px solid rgba(186,215,247,0.07)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--color-accent-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-accent-text)',
              flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name ?? user?.email ?? 'Пользователь'}
            </span>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', padding: '7px 12px', borderRadius: '8px',
              background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
              color: 'var(--color-danger)', fontSize: '13px', fontWeight: 500,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            Выйти
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ marginLeft: '230px', flex: 1, padding: '32px', position: 'relative', zIndex: 1, minHeight: '100vh' }}>
        <Outlet />
      </main>
    </div>
  )
}
