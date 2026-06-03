/** Layout con topbar (marca, Coronas, UserButton) y contenedor. */

import { RedirectToSignIn, UserButton, useAuth } from "@clerk/tanstack-react-start";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { clerkAppearance } from "@/lib/clerkAppearance";
import { useProfile } from "@/lib/profile";

export function CoronasChip({ amount }: { amount: number }) {
  return (
    <span className="coronas" data-tooltip="Tu saldo de Coronas — gánalas jugando o cómpralas">
      <span className="crown">👑</span>
      {amount.toLocaleString("es")}
    </span>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { profile } = useProfile();

  if (!isLoaded) {
    return (
      <div className="layout">
        <main className="container center">
          <img
            src="/quings-logo.svg"
            alt="Quings"
            className="spin-slow"
            style={{ width: 80, height: 80, marginTop: 80 }}
          />
        </main>
      </div>
    );
  }
  if (!isSignedIn) return <RedirectToSignIn />;

  return (
    <div className="layout">
      <header className="topbar">
        <div className="inner">
          <Link to="/" className="brand">
            <img src="/quings-logo.svg" alt="Quings" />
            <span className="name">QUINGS</span>
          </Link>
          <div className="row">
            {profile && <CoronasChip amount={profile.coronas} />}
            <UserButton appearance={clerkAppearance} />
          </div>
        </div>
      </header>
      <main className="container">{children}</main>
    </div>
  );
}
