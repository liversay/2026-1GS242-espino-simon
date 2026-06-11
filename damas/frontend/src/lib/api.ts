/**
 * api.ts — Cliente REST hacia el backend de Quings.
 * Adjunta el token de sesión de Clerk (Authorization: Bearer) en cada petición.
 */

import { useAuth } from "@clerk/tanstack-react-start";
import { useCallback, useMemo } from "react";
import type {
  Board,
  CoronaPack,
  Game,
  Move,
  MoveResult,
  Profile,
  RankingResult,
  Skin,
} from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function useApi() {
  const { getToken } = useAuth();

  const request = useCallback(
    async <T>(path: string, init?: RequestInit): Promise<T> => {
      const token = await getToken();
      const res = await fetch(`${API_URL}${path}`, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(init?.headers ?? {}),
        },
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({ error: res.statusText }))) as {
          error?: string;
        };
        throw new ApiError(res.status, body.error ?? "Error de red");
      }
      if (res.status === 204) return undefined as T;
      return (await res.json()) as T;
    },
    [getToken],
  );

  return useMemo(
    () => ({
      getProfile: () => request<Profile>("/api/me"),
      setUsername: (username: string) =>
        request<Profile>("/api/me", { method: "PATCH", body: JSON.stringify({ username }) }),

      createGame: (difficulty?: number) =>
        request<Game>("/api/games", {
          method: "POST",
          body: JSON.stringify({ difficulty }),
        }),
      listGames: () => request<Game[]>("/api/games"),
      getGame: (id: string) => request<Game>(`/api/games/${id}`),
      move: (id: string, move: Move, difficulty?: number) =>
        request<MoveResult>(`/api/games/${id}/move`, {
          method: "POST",
          body: JSON.stringify({ ...move, difficulty }),
        }),
      resign: (id: string) => request<Game>(`/api/games/${id}/resign`, { method: "POST" }),

      ranking: () => request<RankingResult>("/api/ranking"),

      skins: () => request<Skin[]>("/api/skins"),
      buySkin: (id: string) =>
        request<{ coronas: number; ownedSkinIds: string[] }>(`/api/skins/${id}/buy`, {
          method: "POST",
        }),
      equipSkin: (id: string) =>
        request<{ equippedSkinId: string }>(`/api/skins/${id}/equip`, { method: "POST" }),

      boards: () => request<Board[]>("/api/boards"),
      buyBoard: (id: string) =>
        request<{ coronas: number; ownedBoardIds: string[] }>(`/api/boards/${id}/buy`, {
          method: "POST",
        }),
      equipBoard: (id: string) =>
        request<{ equippedBoardId: string }>(`/api/boards/${id}/equip`, { method: "POST" }),

      coronaPacks: () => request<CoronaPack[]>("/api/corona-packs"),
      checkout: (packId: string) =>
        request<{ url: string }>("/api/checkout", {
          method: "POST",
          body: JSON.stringify({ packId }),
        }),
      confirmCheckout: (sessionId: string) =>
        request<{ coronas: number; credited: number }>("/api/checkout/confirm", {
          method: "POST",
          body: JSON.stringify({ sessionId }),
        }),
    }),
    [request],
  );
}
