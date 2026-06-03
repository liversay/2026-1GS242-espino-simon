/**
 * start.ts — Configuración global de TanStack Start.
 * Registra el middleware de Clerk en `requestMiddleware` para que la sesión esté
 * disponible en server functions (auth() de @clerk/tanstack-react-start/server).
 */

import { clerkMiddleware } from "@clerk/tanstack-react-start/server";
import { createStart } from "@tanstack/react-start";

export const startInstance = createStart(() => {
  return {
    requestMiddleware: [clerkMiddleware()],
  };
});
