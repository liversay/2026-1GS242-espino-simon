import { Outlet, createRootRoute } from '@tanstack/react-router'
import { MusicManager } from '../components/MusicManager'
import { UserAvatar } from '../components/UserAvatar'

export const Route = createRootRoute({
  component: () => (
    <>
      <div className="app-shell">
        <Outlet />
      </div>
      <MusicManager />
      <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 1000 }}>
        <UserAvatar />
      </div>
    </>
  ),
})
