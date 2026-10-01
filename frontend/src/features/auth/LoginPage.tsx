import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { login } from './authSlice'
import './LoginPage.css'

// ── Live clock ─────────────────────────────────────────────────
const DAYS = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ']
const two = (n: number) => String(n).padStart(2, '0')

function Clock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const hh = two(now.getHours())
  const mm = two(now.getMinutes())
  const dateStr = `${DAYS[now.getDay()]} · ${two(now.getDate())}.${two(now.getMonth() + 1)}.${now.getFullYear()}`
  const digits = (hh + mm).split('')

  return (
    <div className="lp-clock">
      <div className="lp-clock-time">
        {digits.map((c, i) =>
          i === 2
            ? [
                <span key="colon" className="lp-clock-colon">:</span>,
                <span key={i} className="lp-clock-tile">
                  {c}
                  <span className="lp-clock-split" />
                </span>,
              ]
            : (
              <span key={i} className="lp-clock-tile">
                {c}
                <span className="lp-clock-split" />
              </span>
            )
        )}
      </div>
      <span className="lp-clock-date">{dateStr}</span>
    </div>
  )
}

// ── Flap cells field ───────────────────────────────────────────
function FlapField({ label, type, n, placeholder, value, onChange, onFocus, onBlur, focused, autoComplete }: {
  label: string
  type: 'email' | 'password'
  n: number
  placeholder: string
  value: string
  onChange: (v: string) => void
  onFocus: () => void
  onBlur: () => void
  focused: boolean
  autoComplete: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const isPassword = type === 'password'
  const mask = isPassword ? '•'.repeat(value.length) : value
  const empty = value.length === 0
  const shown = empty ? placeholder : mask.slice(-(n - 1))
  const activeIdx = focused ? (empty ? 0 : shown.length) : -1

  return (
    <label className="lp-field" onClick={() => inputRef.current?.focus()}>
      <span className="lp-field-label">{label}</span>
      <span className={`lp-cells${isPassword ? ' lp-cells--password' : ''}`}>
        {Array.from({ length: n }, (_, i) => {
          const char = shown[i] || ' '
          const isPlaceholder = empty
          const isActive = activeIdx === i
          return (
            <span
              key={i}
              className={[
                'lp-cell',
                isPlaceholder ? 'lp-cell--placeholder' : '',
                isActive ? 'lp-cell--active' : '',
              ].filter(Boolean).join(' ')}
            >
              {char}
              <span className="lp-cell-split" />
            </span>
          )
        })}
        <input
          ref={inputRef}
          type={type}
          autoComplete={autoComplete}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </span>
    </label>
  )
}

// ── Login page ─────────────────────────────────────────────────
export function LoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { status, error } = useAppSelector(s => s.auth)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailFocused, setEmailFocused] = useState(false)
  const [passFocused, setPassFocused] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    const result = await dispatch(login({ email, password }))
    if (login.fulfilled.match(result)) navigate('/')
  }

  const submitChars = ['В', 'О', 'Й', 'Т', 'И', ' ', '→']

  return (
    <div className="lp-page">

      {/* Desktop tire tracks */}
      <svg className="lp-tracks" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <pattern id="tread" width="110" height="40" patternUnits="userSpaceOnUse">
            <path d="M10 30 L55 10 L100 30" stroke="#14131d" strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 4 V16 M107 4 V16" stroke="#100f18" strokeWidth="4" strokeLinecap="round"/>
          </pattern>
        </defs>
        <g transform="translate(64 0)">
          <rect x="0" y="0" width="110" height="900" fill="url(#tread)"/>
          <rect x="170" y="0" width="110" height="900" fill="url(#tread)"/>
        </g>
        <g transform="translate(1096 0)">
          <rect x="0" y="0" width="110" height="900" fill="url(#tread)"/>
          <rect x="170" y="0" width="110" height="900" fill="url(#tread)"/>
        </g>
      </svg>

      {/* Mobile tire tracks — top */}
      <svg className="lp-tracks-m lp-tracks-m--top" aria-hidden="true">
        <defs>
          <pattern id="treadMTop" width="40" height="44" patternUnits="userSpaceOnUse">
            <path d="M10 6 L30 22 L10 38" stroke="#14131d" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M36 2 H40 M36 42 H40" stroke="#100f18" strokeWidth="3" strokeLinecap="round"/>
          </pattern>
        </defs>
        <rect x="0" y="12" width="100%" height="44" fill="url(#treadMTop)"/>
        <rect x="0" y="76" width="100%" height="44" fill="url(#treadMTop)"/>
      </svg>

      {/* Mobile tire tracks — bottom */}
      <svg className="lp-tracks-m lp-tracks-m--bottom" aria-hidden="true">
        <defs>
          <pattern id="treadMBottom" width="40" height="44" patternUnits="userSpaceOnUse">
            <path d="M10 6 L30 22 L10 38" stroke="#14131d" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M36 2 H40 M36 42 H40" stroke="#100f18" strokeWidth="3" strokeLinecap="round"/>
          </pattern>
        </defs>
        <rect x="0" y="12" width="100%" height="44" fill="url(#treadMBottom)"/>
        <rect x="0" y="76" width="100%" height="44" fill="url(#treadMBottom)"/>
      </svg>

      {/* Form */}
      <form className="lp-form" onSubmit={onSubmit} noValidate>

        {/* Logo */}
        <h1 className="lp-brand" aria-label="АвтоХаб">
          {['А', 'В', 'Т', 'О'].map((c, i) => (
            <li key={i} className="lp-brand-tile">
              {c}
              <span className="lp-brand-split" />
            </li>
          ))}
          {['Х', 'А', 'Б'].map((c, i) => (
            <li key={i} className="lp-brand-tile lp-brand-tile--accent">
              {c}
              <span className="lp-brand-split lp-brand-split--accent" />
            </li>
          ))}
        </h1>

        {/* Email */}
        <FlapField
          label="ПОЧТА"
          type="email"
          n={20}
          placeholder="name@company.ru"
          value={email}
          onChange={setEmail}
          onFocus={() => setEmailFocused(true)}
          onBlur={() => setEmailFocused(false)}
          focused={emailFocused}
          autoComplete="email"
        />

        {/* Password */}
        <FlapField
          label="ПАРОЛЬ"
          type="password"
          n={12}
          placeholder="••••••••"
          value={password}
          onChange={setPassword}
          onFocus={() => setPassFocused(true)}
          onBlur={() => setPassFocused(false)}
          focused={passFocused}
          autoComplete="current-password"
        />

        {/* Error */}
        {error && <div className="lp-error">{error}</div>}

        {/* Actions */}
        <div className="lp-actions">
          <button
            type="submit"
            className="lp-submit"
            disabled={status === 'loading'}
            aria-label="Войти"
          >
            {submitChars.map((c, i) => (
              <span key={i} className="lp-submit-tile">
                {c}
                <span className="lp-submit-split" />
              </span>
            ))}
          </button>
          <a href="#" className="lp-forgot">Забыли пароль?</a>
        </div>
      </form>

      {/* Clock */}
      <Clock />
    </div>
  )
}
