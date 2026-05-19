import { Outlet, createRootRoute } from '@tanstack/react-router'
import { MusicManager } from '../components/MusicManager'

export const Route = createRootRoute({
  component: () => (
    <>
      <div className="app-shell">
        <Outlet />
      </div>
      <MusicManager />
    </>
  ),
})
