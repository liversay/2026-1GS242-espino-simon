import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useSignIn } from '@clerk/clerk-react'
import { useRef, useState } from 'react'
import styles from './auth.module.css'

export const Route = createFileRoute('/sign-in')({
  component: SignInPage,
})

type Method = 'password' | 'code'
type Screen = 'form' | 'otp'

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function SignInPage() {
  const { isLoaded, signIn, setActive } = useSignIn()
  const navigate = useNavigate()

  const [method, setMethod] = useState<Method>('password')
  const [screen, setScreen] = useState<Screen>('form')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  function clerkError(e: unknown): string {
    const ce = e as { errors?: { longMessage?: string; message?: string }[] }
    return ce.errors?.[0]?.longMessage ?? ce.errors?.[0]?.message ?? 'Something went wrong'
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isLoaded || !signIn) return
    setLoading(true)
    setError(null)
    try {
      if (method === 'password') {
        const result = await signIn.create({ identifier: email, password })
        if (result.status === 'complete') {
          await setActive({ session: result.createdSessionId })
          navigate({ to: '/' })
        }
      } else {
        const si = await signIn.create({ identifier: email })
        const factor = si.supportedFirstFactors?.find((f) => f.strategy === 'email_code')
        if (factor) {
          await signIn.prepareFirstFactor({
            strategy: 'email_code',
            emailAddressId: (factor as { emailAddressId: string }).emailAddressId,
          })
        }
        setScreen('otp')
      }
    } catch (e) {
      setError(clerkError(e))
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!isLoaded || !signIn) return
    setLoading(true)
    setError(null)
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'email_code',
        code: otp.join(''),
      })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        navigate({ to: '/' })
      }
    } catch (e) {
      setError(clerkError(e))
      setOtp(['', '', '', '', '', ''])
      otpRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    if (!isLoaded || !signIn) return
    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: window.location.origin + '/sso-callback',
        redirectUrlComplete: '/',
      })
    } catch (e) {
      setError(clerkError(e))
    }
  }

  function handleOtpChange(i: number, val: string) {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]
    next[i] = val.slice(-1)
    setOtp(next)
    if (val && i < 5) otpRefs.current[i + 1]?.focus()
  }

  function handleOtpKey(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus()
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!text) return
    e.preventDefault()
    const next = Array(6).fill('')
    text.split('').forEach((ch, i) => { next[i] = ch })
    setOtp(next)
    otpRefs.current[Math.min(text.length, 5)]?.focus()
  }

  if (screen === 'otp') {
    return (
      <main className={styles.shell}>
        <a href="/" className={styles.back}>← Exit</a>
        <div className={styles.card}>
          <span className={styles.chip}>PP-EVO / AUTH</span>
          <div className={styles.header}>
            <span className={styles.logo}>PokéPt Evolution</span>
            <h1 className={styles.title}>Check email</h1>
          </div>

          <p className={styles.otpHint}>
            Code sent to<br /><strong>{email}</strong>
          </p>

          <form onSubmit={handleVerify} className={styles.form}>
            <div className={styles.otpRow}>
              {[0, 1, 2].map((i) => (
                <input
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el }}
                  className={styles.otpBox}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={otp[i]}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKey(i, e)}
                  onPaste={handleOtpPaste}
                  autoFocus={i === 0}
                  autoComplete="one-time-code"
                />
              ))}
              <span className={styles.otpSep} />
              {[3, 4, 5].map((i) => (
                <input
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el }}
                  className={styles.otpBox}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={otp[i]}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKey(i, e)}
                  onPaste={handleOtpPaste}
                />
              ))}
            </div>

            {error && <div className={styles.errorBox}>{error}</div>}

            <button
              type="submit"
              className="btn btn--hot"
              style={{ width: '100%' }}
              disabled={loading || otp.join('').length < 6}
            >
              {loading ? <span className={styles.blink}>Verifying…</span> : '→ Verify'}
            </button>
          </form>

          <button
            type="button"
            className={styles.cardBack}
            onClick={() => { setScreen('form'); setError(null); setOtp(['', '', '', '', '', '']) }}
          >
            ← Use a different method
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.shell}>
      <a href="/" className={styles.back}>← Exit</a>
      <div className={styles.card}>
        <span className={styles.chip}>PP-EVO / AUTH</span>

        <div className={styles.header}>
          <span className={styles.logo}>PokéPt Evolution</span>
          <h1 className={styles.title}>Sign In</h1>
        </div>

        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab} ${method === 'password' ? styles.tabActive : ''}`}
            onClick={() => { setMethod('password'); setError(null) }}
          >
            Password
          </button>
          <button
            type="button"
            className={`${styles.tab} ${method === 'code' ? styles.tabActive : ''}`}
            onClick={() => { setMethod('code'); setError(null) }}
          >
            Email code
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="signin-email">Email address</label>
            <input
              id="signin-email"
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="trainer@example.com"
              autoComplete="email"
              required
            />
          </div>

          {method === 'password' && (
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="signin-password">Password</label>
              <input
                id="signin-password"
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>
          )}

          {error && <div className={styles.errorBox}>{error}</div>}

          <button
            type="submit"
            className="btn btn--hot"
            style={{ width: '100%' }}
            disabled={loading || !isLoaded}
          >
            {loading
              ? <span className={styles.blink}>Loading…</span>
              : method === 'password' ? '→ Sign in' : '→ Send code'}
          </button>
        </form>

        <div className={styles.divider}>
          <span className={styles.dividerText}>OR</span>
        </div>

        <button
          type="button"
          className={styles.googleBtn}
          onClick={handleGoogle}
          disabled={loading || !isLoaded}
        >
          <GoogleIcon />
          Sign in with Google
        </button>

        <p className={styles.authSwitch}>
          No account? <Link to="/sign-up">Create one →</Link>
        </p>
      </div>
    </main>
  )
}
