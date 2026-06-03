import { ClerkProvider } from "@clerk/tanstack-react-start";
import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { clerkAppearance } from "@/lib/clerkAppearance";
import { ProfileProvider } from "@/lib/profile";
import { SettingsProvider } from "@/lib/settings";
import appCss from "@/styles/quings.css?url";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ?? "";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Quings 👑 — Damas con IA" },
      { name: "description", content: "Damas contra una IA con A*. Gana Coronas, compra skins y escala el ranking." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/quings-logo.svg" },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      {PUBLISHABLE_KEY ? (
        <ClerkProvider publishableKey={PUBLISHABLE_KEY} appearance={clerkAppearance}>
          <SettingsProvider>
            <ProfileProvider>
              <Outlet />
            </ProfileProvider>
          </SettingsProvider>
        </ClerkProvider>
      ) : (
        <ConfigNotice />
      )}
    </RootDocument>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body className="crt">
        <div id="app">{children}</div>
        <Scripts />
      </body>
    </html>
  );
}

function ConfigNotice() {
  return (
    <div className="layout">
      <main className="container" style={{ maxWidth: 640 }}>
        <div className="brand" style={{ justifyContent: "center", marginBottom: 24 }}>
          <img src="/quings-logo.svg" alt="Quings" style={{ width: 64, height: 64 }} />
          <span className="name" style={{ fontSize: 44 }}>
            QUINGS
          </span>
        </div>
        <div className="notice stack center">
          <h2 style={{ fontSize: 28, color: "var(--gold-400)" }}>Configura Clerk para empezar</h2>
          <p className="muted">
            Agrega tu clave en <code>frontend/.env</code>:
          </p>
          <pre
            style={{
              background: "rgba(0,0,0,0.4)",
              padding: 14,
              borderRadius: 10,
              textAlign: "left",
              overflowX: "auto",
            }}
          >
            VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
          </pre>
          <p className="muted">Luego reinicia el servidor de desarrollo.</p>
        </div>
      </main>
    </div>
  );
}
