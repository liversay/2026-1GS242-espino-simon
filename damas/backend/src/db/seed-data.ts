/**
 * Datos funcionales de catálogo (NO son ejemplos): skins de fichas y paquetes de Coronas.
 * Se cargan con `bun run seed`.
 */

import type { CoronaPackDoc, SkinDoc } from "./collections";

export const SKINS: SkinDoc[] = [
  // ---- common ----
  {
    _id: "classic",
    name: "Clásica",
    rarity: "common",
    priceCoronas: 0,
    pieceStyle: { baseColor: "#F4EEDD", accentColor: "#C8922B", crownColor: "#EBB63F", material: "matte" },
    thumbnail: "♟️",
    description: "La ficha de siempre. Gratis y equipada por defecto.",
  },
  {
    _id: "ivory",
    name: "Marfil",
    rarity: "common",
    priceCoronas: 150,
    pieceStyle: { baseColor: "#EDE6D2", accentColor: "#9C8B6B", crownColor: "#D8C7A0", material: "matte" },
    thumbnail: "🤍",
    description: "Marfil mate, sobrio y elegante.",
  },
  {
    _id: "onyx",
    name: "Ónix",
    rarity: "common",
    priceCoronas: 150,
    pieceStyle: { baseColor: "#23262B", accentColor: "#5A6470", crownColor: "#8A95A3", material: "matte" },
    thumbnail: "🖤",
    description: "Piedra oscura para los jugadores serios.",
  },

  // ---- rare ----
  {
    _id: "gold-knight",
    name: "Caballero Dorado",
    rarity: "rare",
    priceCoronas: 400,
    pieceStyle: { baseColor: "#EBB63F", accentColor: "#8A5A12", crownColor: "#FFF1B8", material: "metallic", icon: "👑" },
    thumbnail: "🟡",
    description: "Oro pulido con borde brillante.",
  },
  {
    _id: "royal-steel",
    name: "Acero Real",
    rarity: "rare",
    priceCoronas: 400,
    pieceStyle: { baseColor: "#9FBBD8", accentColor: "#2C4763", crownColor: "#D8E6F4", material: "metallic" },
    thumbnail: "🔵",
    description: "Acero azulado del lado del Rey.",
  },
  {
    _id: "rose-brass",
    name: "Latón Rosa",
    rarity: "rare",
    priceCoronas: 400,
    pieceStyle: { baseColor: "#E29FB6", accentColor: "#8A3A56", crownColor: "#F6CFDA", material: "metallic" },
    thumbnail: "🌸",
    description: "Latón rosado del lado de la Reina.",
  },

  // ---- epic ----
  {
    _id: "aurora",
    name: "Aurora",
    rarity: "epic",
    priceCoronas: 900,
    pieceStyle: { baseColor: "#3FE0C5", accentColor: "#7A3FE0", crownColor: "#F8D86B", material: "foil", icon: "✦" },
    thumbnail: "🌈",
    description: "Reflejo iridiscente que cambia al pasar el cursor.",
  },
  {
    _id: "emerald-foil",
    name: "Esmeralda Foil",
    rarity: "epic",
    priceCoronas: 900,
    pieceStyle: { baseColor: "#0F9F6E", accentColor: "#063D2A", crownColor: "#9BF5C9", material: "foil" },
    thumbnail: "💚",
    description: "Lámina esmeralda con destello animado.",
  },
  {
    _id: "crimson-foil",
    name: "Carmesí Foil",
    rarity: "epic",
    priceCoronas: 900,
    pieceStyle: { baseColor: "#D9466F", accentColor: "#5A0F22", crownColor: "#FFC2D4", material: "foil" },
    thumbnail: "❤️",
    description: "Carmesí metálico con brillo profundo.",
  },

  // ---- legendary ----
  {
    _id: "neon-monarch",
    name: "Monarca Neón",
    rarity: "legendary",
    priceCoronas: 2000,
    pieceStyle: { baseColor: "#16131F", accentColor: "#00E5FF", crownColor: "#FF2BD6", material: "neon", icon: "👑" },
    thumbnail: "💠",
    description: "Glow de neón, partículas y captura especial.",
  },
  {
    _id: "void-sovereign",
    name: "Soberano del Vacío",
    rarity: "legendary",
    priceCoronas: 2000,
    pieceStyle: { baseColor: "#0B0B14", accentColor: "#A855F7", crownColor: "#22D3EE", material: "neon", icon: "♛" },
    thumbnail: "🟣",
    description: "Energía del vacío con estela luminosa.",
  },
];

export const CORONA_PACKS: CoronaPackDoc[] = [
  { _id: "bronce", name: "Bronce", coronas: 500, priceUsd: 0.99, stripePriceLabel: "Quings · 500 Coronas" },
  { _id: "plata", name: "Plata", coronas: 1200, priceUsd: 1.99, stripePriceLabel: "Quings · 1200 Coronas" },
  { _id: "oro", name: "Oro", coronas: 3000, priceUsd: 4.99, stripePriceLabel: "Quings · 3000 Coronas" },
  { _id: "diamante", name: "Diamante", coronas: 7000, priceUsd: 9.99, stripePriceLabel: "Quings · 7000 Coronas" },
];

export const DEFAULT_SKIN_ID = "classic";
