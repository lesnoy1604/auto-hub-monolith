import { useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@/shared/lib/zodResolver'
import { z } from 'zod'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { login } from './authSlice'

const schema = z.object({
  email: z.string().min(1, 'Введите email'),
  password: z.string().min(1, 'Введите пароль'),
})
type FormData = z.infer<typeof schema>

export function LoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { status, error } = useAppSelector((s) => s.auth)
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    const result = await dispatch(login(data))
    if (login.fulfilled.match(result)) {
      navigate('/')
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#05060f', position: 'relative', overflow: 'hidden',
    }}>
      {/* Grid background */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(rgba(186,215,247,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(186,215,247,0.04) 1px, transparent 1px)`,
        backgroundSize: '80px 80px',
      }} />
      {/* Spotlight */}
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '600px', height: '400px', pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(102,58,243,0.15) 0%, transparent 70%)',
      }} />

      <div style={{
        position: 'relative', width: '100%', maxWidth: '380px', padding: '40px 36px',
        background: 'rgba(186,214,247,0.04)',
        border: '1px solid rgba(186,215,247,0.1)',
        borderRadius: '22px',
        backdropFilter: 'blur(20px)',
      }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{
            margin: '0 0 8px',
            fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700,
            background: 'linear-gradient(135deg, #98c0ef, #d8ecf8)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Автопарк</h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Введите данные вашей учётной записи
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Email */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block', marginBottom: '6px',
              fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 500,
              textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)',
            }}>Email</label>
            <input
              {...register('email')}
              type="email"
              placeholder="admin@example.com"
              style={{
                width: '100%', height: '44px', padding: '0 14px', boxSizing: 'border-box',
                borderRadius: '8px', background: 'rgba(186,214,247,0.06)',
                border: errors.email ? '1px solid var(--color-danger)' : '1px solid rgba(186,215,247,0.15)',
                color: 'var(--color-text-primary)', fontSize: '15px', outline: 'none',
              }}
            />
            {errors.email && <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--color-danger)' }}>{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block', marginBottom: '6px',
              fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 500,
              textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)',
            }}>Пароль</label>
            <input
              {...register('password')}
              type="password"
              placeholder="••••••••"
              style={{
                width: '100%', height: '44px', padding: '0 14px', boxSizing: 'border-box',
                borderRadius: '8px', background: 'rgba(186,214,247,0.06)',
                border: errors.password ? '1px solid var(--color-danger)' : '1px solid rgba(186,215,247,0.15)',
                color: 'var(--color-text-primary)', fontSize: '15px', outline: 'none',
              }}
            />
            {errors.password && <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--color-danger)' }}>{errors.password.message}</p>}
          </div>

          {/* Error */}
          {error && (
            <div style={{
              marginBottom: '16px', padding: '12px 14px', borderRadius: '8px',
              background: 'var(--color-danger-bg)', border: '1px solid rgba(248,113,113,0.3)',
              color: 'var(--color-danger)', fontSize: '14px',
            }}>{error}</div>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            style={{
              width: '100%', height: '44px', borderRadius: '6px',
              background: 'var(--color-accent)', color: 'white',
              border: 'none', fontSize: '15px', fontWeight: 500, cursor: 'pointer',
              opacity: status === 'loading' ? 0.7 : 1,
            }}
          >
            {status === 'loading' ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  )
}
