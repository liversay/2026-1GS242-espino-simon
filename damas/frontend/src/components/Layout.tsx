/** Marco/shell común de las pantallas (no del lobby): ambiente, header con Volver + título y HUD. */

import { RedirectToSignIn, useAuth } from "@clerk/tanstack-react-start";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { AmbientBackground } from "@/components/ui/AmbientBackground";
import { CoronasPill } from "@/components/ui/CoronasPill";
import { SoundToggle } from "@/components/ui/SoundToggle";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useProfile } from "@/lib/profile";
import { playSfx } from "@/lib/sound";
import { useGoldNavigate } from "@/lib/transition";

function Splash() {
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

export function Layout({
  title,
  children,
  back = true,
}: {
  title?: string;
  children: ReactNode;
  back?: boolean;
}) {
  const { isLoaded, isSignedIn } = useAuth();
  const { profile } = useProfile();
  const go = useGoldNavigate();

  if (!isLoaded) return <Splash />;
  if (!isSignedIn) return <RedirectToSignIn />;

  return (
    <div className="layout">
      <AmbientBackground />
      <header className="topbar">
        <div className="inner">
          <div className="row" style={{ gap: 12 }}>
            {back && (
              <button
                className="hud-icon-btn"
                onMouseEnter={() => playSfx("hover")}
                onClick={() => go({ to: "/" }, "back")}
                data-tooltip="Volver al menú"
                aria-label="Volver"
              >
                <ArrowLeft size={18} strokeWidth={2.2} />
              </button>
            )}
            <img className="topbar-emblem" src="/quings-logo.svg" alt="Quings" />
            {title && <span className="topbar-title">{title}</span>}
          </div>
          <div className="row" style={{ gap: 10 }}>
            {profile && <CoronasPill amount={profile.coronas} />}
            <SoundToggle />
            <UserAvatar />
          </div>
        </div>
      </header>
      <main className="container">{children}</main>
    </div>
  );
}
