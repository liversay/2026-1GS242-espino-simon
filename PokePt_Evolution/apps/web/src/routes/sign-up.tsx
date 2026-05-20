import { createFileRoute } from '@tanstack/react-router'
import { SignUp } from '@clerk/clerk-react'
import styles from './form.module.css'

export const Route = createFileRoute('/sign-up')({
  component: SignUpPage,
})

function SignUpPage() {
  return (
    <main className={styles.shell}>
      <a href="/" className={styles.back}>← Back</a>
      <div className={styles.layout} style={{ justifyContent: 'center' }}>
        <SignUp
          routing="hash"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/"
        />
      </div>
    </main>
  )
}
