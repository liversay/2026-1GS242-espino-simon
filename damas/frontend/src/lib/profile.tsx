/** Contexto de perfil: carga /api/me una vez para el usuario autenticado y lo comparte. */

import { useAuth } from "@clerk/tanstack-react-start";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useApi } from "./api";
import type { Profile } from "./types";

interface ProfileCtx {
  profile: Profile | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setProfile: (p: Profile) => void;
}

const Ctx = createContext<ProfileCtx | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const api = useApi();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isSignedIn) {
      setProfile(null);
      setLoading(false);
      return;
    }
    try {
      setProfile(await api.getProfile());
    } catch {
      /* ignore — el usuario verá el estado de error en cada pantalla */
    } finally {
      setLoading(false);
    }
  }, [api, isSignedIn]);

  useEffect(() => {
    if (!isLoaded) return;
    void refresh();
  }, [isLoaded, isSignedIn, refresh]);

  return (
    <Ctx.Provider value={{ profile, loading, refresh, setProfile }}>{children}</Ctx.Provider>
  );
}

export function useProfile(): ProfileCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProfile fuera de ProfileProvider");
  return ctx;
}
