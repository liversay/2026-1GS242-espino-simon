import { useUser, useClerk } from '@clerk/clerk-react'
import { useEffect, useRef, useState } from 'react'
import styles from './UserAvatar.module.css'

export function UserAvatar() {
  const { user, isSignedIn } = useUser()
  const { signOut } = useClerk()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  if (!isSignedIn || !user) return null

  const initials = (
    user.firstName?.[0] ?? user.emailAddresses[0]?.emailAddress[0] ?? '?'
  ).toUpperCase()

  return (
    <div ref={wrapRef} className={styles.wrap}>
      <button
        type="button"
        className={styles.avatarBtn}
        onClick={() => setOpen((o) => !o)}
        aria-label="User menu"
        aria-expanded={open}
      >
        {user.imageUrl
          ? <img src={user.imageUrl} alt={user.fullName ?? 'User'} className={styles.avatarImg} />
          : <span className={styles.avatarInitials}>{initials}</span>
        }
      </button>

      {open && (
        <div className={styles.menu} role="menu">
          <span className={styles.menuChip}>PP-EVO / TRAINER</span>
          {user.fullName && <p className={styles.menuName}>{user.fullName}</p>}
          <p className={styles.menuEmail}>{user.primaryEmailAddress?.emailAddress}</p>
          <hr className={styles.menuDivider} />
          <button
            type="button"
            className={styles.signOutBtn}
            onClick={() => signOut()}
            role="menuitem"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
