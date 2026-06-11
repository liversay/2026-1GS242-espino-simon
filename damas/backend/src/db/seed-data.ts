/**
 * Datos funcionales de catálogo (NO son ejemplos): skins de fichas y paquetes de Coronas.
 * Se cargan con `bun run seed`.
 */

import type { BoardDoc, CoronaPackDoc, SkinDoc } from "./collections";

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
    priceCoronas: 450,
    pieceStyle: { baseColor: "#EDE6D2", accentColor: "#9C8B6B", crownColor: "#D8C7A0", material: "matte" },
    thumbnail: "🤍",
    description: "Marfil mate, sobrio y elegante.",
  },
  {
    _id: "onyx",
    name: "Ónix",
    rarity: "common",
    priceCoronas: 450,
    pieceStyle: { baseColor: "#23262B", accentColor: "#5A6470", crownColor: "#8A95A3", material: "matte" },
    thumbnail: "🖤",
    description: "Piedra oscura para los jugadores serios.",
  },
  {
    _id: "slate",
    name: "Pizarra",
    rarity: "common",
    priceCoronas: 450,
    pieceStyle: { baseColor: "#3A4048", accentColor: "#6B7480", crownColor: "#9AA4B0", material: "matte" },
    thumbnail: "🪨",
    description: "Gris pizarra mate, discreta y resistente.",
  },

  // ---- rare ----
  {
    _id: "gold-knight",
    name: "Caballero Dorado",
    rarity: "rare",
    priceCoronas: 1200,
    pieceStyle: { baseColor: "#EBB63F", accentColor: "#8A5A12", crownColor: "#FFF1B8", material: "metallic", icon: "👑" },
    thumbnail: "🟡",
    description: "Oro pulido con borde brillante.",
  },
  {
    _id: "royal-steel",
    name: "Acero Real",
    rarity: "rare",
    priceCoronas: 1200,
    pieceStyle: { baseColor: "#9FBBD8", accentColor: "#2C4763", crownColor: "#D8E6F4", material: "metallic" },
    thumbnail: "🔵",
    description: "Acero azulado del lado del Rey.",
  },
  {
    _id: "rose-brass",
    name: "Latón Rosa",
    rarity: "rare",
    priceCoronas: 1200,
    pieceStyle: { baseColor: "#E29FB6", accentColor: "#8A3A56", crownColor: "#F6CFDA", material: "metallic" },
    thumbnail: "🌸",
    description: "Latón rosado del lado de la Reina.",
  },
  {
    _id: "copper",
    name: "Cobre",
    rarity: "rare",
    priceCoronas: 1200,
    pieceStyle: { baseColor: "#C87F4A", accentColor: "#6E3D1D", crownColor: "#F0B27A", material: "metallic" },
    thumbnail: "🟠",
    description: "Cobre forjado con brillo cálido.",
  },

  // ---- epic ----
  {
    _id: "aurora",
    name: "Aurora",
    rarity: "epic",
    priceCoronas: 2700,
    pieceStyle: { baseColor: "#3FE0C5", accentColor: "#7A3FE0", crownColor: "#F8D86B", material: "foil", icon: "✦" },
    thumbnail: "🌈",
    description: "Reflejo iridiscente que cambia al pasar el cursor.",
  },
  {
    _id: "emerald-foil",
    name: "Esmeralda Foil",
    rarity: "epic",
    priceCoronas: 2700,
    pieceStyle: { baseColor: "#0F9F6E", accentColor: "#063D2A", crownColor: "#9BF5C9", material: "foil" },
    thumbnail: "💚",
    description: "Lámina esmeralda con destello animado.",
  },
  {
    _id: "crimson-foil",
    name: "Carmesí Foil",
    rarity: "epic",
    priceCoronas: 2700,
    pieceStyle: { baseColor: "#D9466F", accentColor: "#5A0F22", crownColor: "#FFC2D4", material: "foil" },
    thumbnail: "❤️",
    description: "Carmesí metálico con brillo profundo.",
  },
  {
    _id: "amethyst-foil",
    name: "Amatista Foil",
    rarity: "epic",
    priceCoronas: 2700,
    pieceStyle: { baseColor: "#9B5DE5", accentColor: "#3B1D5A", crownColor: "#E0C3FF", material: "foil", icon: "✦" },
    thumbnail: "💜",
    description: "Lámina de amatista con destello violeta.",
  },

  // ---- legendary ----
  {
    _id: "neon-monarch",
    name: "Monarca Neón",
    rarity: "legendary",
    priceCoronas: 6000,
    pieceStyle: { baseColor: "#16131F", accentColor: "#00E5FF", crownColor: "#FF2BD6", material: "neon", icon: "👑" },
    thumbnail: "💠",
    description: "Glow de neón, partículas y captura especial.",
  },
  {
    _id: "void-sovereign",
    name: "Soberano del Vacío",
    rarity: "legendary",
    priceCoronas: 6000,
    pieceStyle: { baseColor: "#0B0B14", accentColor: "#A855F7", crownColor: "#22D3EE", material: "neon", icon: "♛" },
    thumbnail: "🟣",
    description: "Energía del vacío con estela luminosa.",
  },
  {
    _id: "crimson-dragon",
    name: "Dragón Carmesí",
    rarity: "legendary",
    priceCoronas: 6000,
    pieceStyle: { baseColor: "#1A0D10", accentColor: "#FF3B3B", crownColor: "#FFD23B", material: "neon", icon: "🐉" },
    thumbnail: "🔥",
    description: "Brasa viva con aura de fuego y oro.",
  },
  {
    _id: "aurora-borealis",
    name: "Aurora Boreal",
    rarity: "legendary",
    priceCoronas: 6000,
    pieceStyle: { baseColor: "#0A1420", accentColor: "#2BFFB3", crownColor: "#7AF0FF", material: "neon", icon: "❄️" },
    thumbnail: "🌠",
    description: "Hielo polar con destellos verdes y cian.",
  },
];

/** Skins de tablero: cambian los colores de las casillas y el marco. Dos por rareza. */
export const BOARDS: BoardDoc[] = [
  // ---- common ----
  {
    _id: "classic-board",
    name: "Tablero Clásico",
    rarity: "common",
    priceCoronas: 0,
    boardStyle: {
      light: "#d8c19a",
      dark: "#3a6b4f",
      darkAlt: "#356046",
      frame: "linear-gradient(180deg, #1c130a, #0d0905)",
    },
    thumbnail: "🟩",
    description: "El tablero de siempre. Gratis y equipado por defecto.",
  },
  {
    _id: "candy-board",
    name: "Chicle",
    rarity: "common",
    priceCoronas: 450,
    boardStyle: {
      light: "#ffe3f1",
      dark: "#ff5fa2",
      darkAlt: "#f24d92",
      frame: "linear-gradient(180deg, #5a1b3a, #2c0d1d)",
    },
    thumbnail: "🍬",
    description: "Rosa caramelo y crema: dulce, divertido y muy llamativo.",
  },

  // ---- rare ----
  {
    _id: "marble-board",
    name: "Mármol",
    rarity: "rare",
    priceCoronas: 1200,
    boardStyle: {
      light: "#ece7dd",
      dark: "#6b7280",
      darkAlt: "#5b626e",
      frame: "linear-gradient(180deg, #2a2d33, #14161a)",
    },
    thumbnail: "🤍",
    description: "Piedra pulida en blanco y gris, sobria y de torneo.",
  },
  {
    _id: "crimson-noir-board",
    name: "Carmesí Noir",
    rarity: "rare",
    priceCoronas: 1200,
    boardStyle: {
      light: "#2a2024",
      dark: "#8a1a26",
      darkAlt: "#701420",
      frame: "linear-gradient(180deg, #1a1416, #050304)",
    },
    thumbnail: "🃏",
    description: "Rojo y negro de casino: elegante y con carácter.",
  },

  // ---- epic ----
  {
    _id: "ruby-board",
    name: "Rubí Real",
    rarity: "epic",
    priceCoronas: 2700,
    boardStyle: {
      light: "#e7c9c9",
      dark: "#b3122f",
      darkAlt: "#9c0f29",
      frame: "linear-gradient(180deg, #3a0810, #1a0306)",
    },
    thumbnail: "❤️",
    description: "Rojo rubí intenso con marco granate. Pura realeza.",
  },
  {
    _id: "oak-board",
    name: "Roble Tallado",
    rarity: "epic",
    priceCoronas: 2700,
    boardStyle: {
      light: "#d8b483",
      dark: "#6b4423",
      darkAlt: "#5e3a1d",
      frame: "linear-gradient(180deg, #2e1d0c, #140c04)",
    },
    thumbnail: "🪵",
    description: "Madera de roble clásica, cálida y artesanal.",
  },

  // ---- legendary ----
  {
    _id: "nebula-board",
    name: "Nebulosa",
    rarity: "legendary",
    priceCoronas: 6000,
    boardStyle: {
      light: "#2a2350",
      dark: "#120b2e",
      darkAlt: "#1a1140",
      frame: "linear-gradient(180deg, #1b1140, #06030f)",
    },
    thumbnail: "🌌",
    description: "Cosmos púrpura con casillas que parecen flotar en el vacío.",
  },
  {
    _id: "golden-throne-board",
    name: "Trono de Oro",
    rarity: "legendary",
    priceCoronas: 6000,
    boardStyle: {
      light: "#f6e7b0",
      dark: "#b8860b",
      darkAlt: "#a6790a",
      frame: "linear-gradient(180deg, #5a4205, #241901)",
    },
    thumbnail: "👑",
    description: "Oro macizo de lado a lado. El tablero de los campeones.",
  },
];

export const CORONA_PACKS: CoronaPackDoc[] = [
  { _id: "bronce", name: "Bronce", coronas: 250, priceUsd: 4.95, stripePriceLabel: "Quings · 250 Coronas" },
  { _id: "plata", name: "Plata", coronas: 600, priceUsd: 9.95, stripePriceLabel: "Quings · 600 Coronas" },
  { _id: "oro", name: "Oro", coronas: 1500, priceUsd: 24.95, stripePriceLabel: "Quings · 1500 Coronas" },
  { _id: "diamante", name: "Diamante", coronas: 3500, priceUsd: 49.95, stripePriceLabel: "Quings · 3500 Coronas" },
  { _id: "imperial", name: "Imperial", coronas: 8000, priceUsd: 99.95, stripePriceLabel: "Quings · 8000 Coronas" },
];

export const DEFAULT_SKIN_ID = "classic";
export const DEFAULT_BOARD_ID = "classic-board";

/**
 * Jugadores ficticios para poblar el ranking en demos (no son cuentas reales de Clerk).
 * Identificados por `clerkUserId` con prefijo `seed_` para distinguirlos.
 */
export const DEMO_USERS = [
  { clerkUserId: "seed_demo_1", username: "ReinaCobalto", bestWinMoves: 14, totalWins: 23, totalGames: 31 },
  { clerkUserId: "seed_demo_2", username: "ElMonarca", bestWinMoves: 17, totalWins: 18, totalGames: 27 },
  { clerkUserId: "seed_demo_3", username: "DamaVeloz", bestWinMoves: 21, totalWins: 12, totalGames: 20 },
  { clerkUserId: "seed_demo_4", username: "TorreNegra", bestWinMoves: 26, totalWins: 9, totalGames: 19 },
  { clerkUserId: "seed_demo_5", username: "PeonImparable", bestWinMoves: 33, totalWins: 6, totalGames: 15 },
];
