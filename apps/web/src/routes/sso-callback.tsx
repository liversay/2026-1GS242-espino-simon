import { createFileRoute } from '@tanstack/react-router'
import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react'

export const Route = createFileRoute('/sso-callback')({
  component: SsoCallbackPage,
})

function SsoCallbackPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 10,
          letterSpacing: '0.2em',
          color: 'var(--pp-electric)',
          animation: 'blink 0.85s ease-in-out infinite',
        }}
      >
        Connecting…
      </span>
      <AuthenticateWithRedirectCallback />
    </main>
  )
}
