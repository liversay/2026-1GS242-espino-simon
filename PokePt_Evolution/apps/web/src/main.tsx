import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import './styles/reset.css'
import './styles/tokens.css'
import './styles/animations.css'
import './styles/app.css'

const router = createRouter({ routeTree, defaultPreload: 'intent' })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const el = document.getElementById('app')
if (!el) throw new Error('mount node #app not found')
createRoot(el).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
