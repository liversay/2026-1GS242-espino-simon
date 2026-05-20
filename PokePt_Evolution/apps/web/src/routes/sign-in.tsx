import { createFileRoute } from '@tanstack/react-router'
import { SignIn } from '@clerk/clerk-react'
import styles from './form.module.css'

export const Route = createFileRoute('/sign-in')({
  component: SignInPage,
})

function SignInPage() {
  return (
    <main className={styles.shell}>
      <a href="/" className={styles.back}>← Back</a>
      <div className={styles.layout} style={{ justifyContent: 'center' }}>
        <SignIn
          routing="hash"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/"
        />
      </div>
    </main>
  )
}
