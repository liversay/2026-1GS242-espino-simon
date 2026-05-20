import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { ClerkProvider, useAuth } from '@clerk/clerk-react'
import { routeTree } from './routeTree.gen'
import { setTokenProvider } from './lib/api'
import './styles/reset.css'
import './styles/tokens.css'
import './styles/animations.css'
import './styles/app.css'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined
if (!PUBLISHABLE_KEY) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY — add it to .env.local')
}

const router = createRouter({ routeTree, defaultPreload: 'intent' })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function ClerkTokenBridge() {
  const { getToken } = useAuth()
  useEffect(() => {
    setTokenProvider(() => getToken())
    return () => setTokenProvider(() => Promise.resolve(null))
  }, [getToken])
  return null
}

const el = document.getElementById('app')
if (!el) throw new Error('mount node #app not found')
createRoot(el).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <ClerkTokenBridge />
      <RouterProvider router={router} />
    </ClerkProvider>
  </StrictMode>,
)
