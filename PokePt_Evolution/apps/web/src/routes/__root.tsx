import { Outlet, createRootRoute } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: () => (
    <div className="app-shell">
      <Outlet />
    </div>
  ),
})
