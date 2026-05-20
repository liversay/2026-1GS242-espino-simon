import { Outlet, createRootRoute } from '@tanstack/react-router'
import { SignedIn, UserButton } from '@clerk/clerk-react'
import { MusicManager } from '../components/MusicManager'

export const Route = createRootRoute({
  component: () => (
    <>
      <div className="app-shell">
        <Outlet />
      </div>
      <MusicManager />
      <SignedIn>
        <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 1000 }}>
          <UserButton
            appearance={{
              elements: {
                avatarBox: { width: 36, height: 36 },
              },
            }}
          />
        </div>
      </SignedIn>
    </>
  ),
})
