/** Carga y expone las variables de entorno del backend. */

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    // No abortamos el arranque (algunos endpoints funcionan sin todas las claves),
    // pero avisamos para facilitar la configuración del .env.
    console.warn(`⚠️  Falta la variable de entorno ${name}`);
  }
  return v ?? "";
}

export const env = {
  PORT: Number(process.env.PORT ?? 8080),
  MONGODB_URI: required("MONGODB_URI"),
  CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY ?? "",
  CLERK_SECRET_KEY: required("CLERK_SECRET_KEY"),
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? "",
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  AI_SERVICE_URL: process.env.AI_SERVICE_URL ?? "http://localhost:7070",
  FRONTEND_URL: process.env.FRONTEND_URL ?? "http://localhost:3000",
  CORONAS_INICIALES: Number(process.env.CORONAS_INICIALES ?? 300),
};
