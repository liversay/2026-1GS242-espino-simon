# PokePt Evolution

Aplicación web de batallas Pokémon 1P vs 1P por salas con código, look retro/arcade inspirado en Pokémon Platinum.

> **Stack**: TanStack Router · React 18 · Vite · Bun · Hono · MongoDB · Docker Compose.
> **Datos**: ≥300 Pokémon importados desde [PokéAPI](https://pokeapi.co/) y persistidos en MongoDB. La aplicación no consulta a PokéAPI durante el juego.

---

## ¿Qué hay adentro?

- **Salas 1v1** con código de 6 caracteres. El primer jugador es _host_; un segundo se une con el código.
- **Selector de escenario** (solo el host): **6 escenarios** construidos con CSS puro — Pradera de Sinnoh, Mt. Coronet, Lago Veraz, Estadio Liga Pokémon, Bosque Eterno, Cumbre Nevada.
- **Equipo de 1–6 Pokémon** por jugador, cada uno con exactamente **4 movimientos** importados desde PokéAPI.
- **Motor de batalla en el servidor**: el frontend solo envía decisiones; daño, tipos, estados y victoria se resuelven en el API.
- **Estética neo-pixel editorial**: tres tipografías distintivas (Silkscreen / Jersey 15 / VT323), paleta dominante violeta-acerado con acentos cálidos, paneles DS-cartucho con clip-path de corte diagonal, scanlines + grano SVG.
- **+25 animaciones CSS** orquestadas turn-by-turn: lunge, shake, crit-burst, super-effective-strobe, faint-fall, switch-recall/summon, status overlays, dialog typewriter, victory confetti + shimmer.

---

## Arquitectura

```
PokePt_Evolution/
├── apps/
│   ├── api/                  # Hono + MongoDB + motor de batalla
│   │   └── src/
│   │       ├── index.ts
│   │       ├── routes/{rooms,battles,catalog}.ts
│   │       ├── battle/{engine,damage,stats,status,types,order,init}.ts
│   │       ├── db/{mongo,repo/*}.ts
│   │       └── importer/{importAll,mapMove,concurrency}.ts
│   └── web/                  # Vite + React 18 + @tanstack/react-router
│       └── src/
│           ├── routes/{index,create,join,lobby.$code,battle.$code}.tsx
│           ├── components/{BattleScene, HpBox, MoveButton, BattleLog, TeamPicker, StagePicker, VictoryScreen, ...}.tsx
│           ├── components/stages/{PraderaSinnoh, MtCoronet, LagoVeraz, LigaPokemon, BosqueEterno, CumbreNevada}.tsx
│           ├── styles/{tokens, animations, app, reset}.css
│           ├── lib/{api, storage}.ts
│           └── hooks/usePolling.ts
├── packages/
│   └── shared/src/types.ts   # tipos compartidos API ↔ Web
├── docker-compose.yml
└── apps/{api,web}/Dockerfile
```

---

## Setup A — Docker (canónico)

Requiere Docker (en Mac, se recomienda **Colima** sin Docker Desktop):

```bash
# 1) Instalar Docker stack en Mac
brew install colima docker docker-compose docker-buildx
colima start --cpu 2 --memory 4 --disk 30

# 2) Construir y levantar
cd PokePt_Evolution
docker compose up --build -d

# 3) Importar los 300+ Pokémon (una sola vez; persistente en el volumen)
docker compose exec api bun run import

# Listo:
#   Web → http://localhost:3000
#   API → http://localhost:3001
```

## Setup B — Desarrollo local sin Docker

Requiere: **Bun 1.1+**, **Node 18+** (para vite-preview en algunos casos) y **MongoDB** accesible en `localhost:27017`. Lo más simple es seguir teniendo Colima encendido y correr solo Mongo en contenedor:

```bash
docker run -d --name pp-mongo -p 27017:27017 -v pp-mongo-data:/data/db mongo:7
```

Luego, en el monorepo:

```bash
cd PokePt_Evolution
bun install
bun --filter @pokept/api import           # importa 300+ Pokémon a Mongo
# en una terminal:
bun --filter @pokept/api dev              # http://localhost:3001
# en otra terminal:
bun --filter @pokept/web dev              # http://localhost:3000
```

Variables de entorno relevantes:

| Var | Default | Dónde |
|-----|---------|-------|
| `MONGO_URL` | `mongodb://localhost:27017` | API |
| `MONGO_DB`  | `pokept` | API |
| `PORT`      | `3001` | API |
| `VITE_API_BASE` | `/api` (proxy de Vite hacia `3001`) | Web |

---

## Demo paso a paso

1. Abrí `http://localhost:3000` en **dos navegadores distintos** (uno normal + uno incógnito; o dos computadoras conectadas a la misma red apuntando a la IP del host).
2. Navegador A → "Crear sala" → ingresá tu nombre → te lleva al lobby con un código de 6 chars (ej. `K7M2QX`).
3. Navegador B → "Unirse con código" → pegá el código y tu nombre.
4. **Ambos eligen 2–6 Pokémon** en el TeamPicker (paginado, con búsqueda) y presionan "Listo".
5. **Solo el host** selecciona el escenario en el StagePicker (carrusel de las 6 opciones). El guest ve la elección en vivo.
6. El host presiona "⚡ ¡Iniciar batalla!".
7. Cada turno: ambos eligen movimiento o cambio. Cuando ambos enviaron, el turno se resuelve en el servidor y el log muestra la coreografía completa.

### Para mostrar en demo

- **Súper efectivo**: Pikachu (eléctrico) vs Gyarados (agua/volador) con Thunderbolt → daño x4, log dice "¡Es súper efectivo!".
- **Estado de 3 turnos**: usar Toxic (poison) o Will-O-Wisp (burn) → status visible junto al HP por 3 turnos, daño cada turno en burn/poison, mensaje "el estado X terminó" al acabar.
- **Switch limpia el estado**: aplicar burn, cambiar a otro Pokémon, volver al original → el status ya no aparece.
- **Victoria**: llevar a 0 HP a todo el equipo enemigo → pantalla de victoria con confetti.

---

## Reglas del motor (decisiones MVP)

| Aspecto | Implementación |
|---------|----------------|
| Nivel de batalla | Fijo en **50**; IVs aleatorios al iniciar, persistidos en el documento Battle. |
| Selección de 4 movs | De los moves `level-up` con power>0 o status modelable, en orden por nivel descendente. Si tras filtrar < 4, el Pokémon se descarta del catálogo. **15 Pokémon descartados** (Caterpie, Metapod, Magikarp, Ditto, Smeargle, etc.); ver log del importador. |
| Orden de turno | **Coin flip** entre movimientos. Switch siempre actúa antes que un move. Sin velocidad ni prioridad de movimiento (MVP estricto). |
| Daño | Fórmula completa con `randomFactor 85–100%`, `STAB 1.5`, multiplicador por tipo combinado, `crit 1.5` con prob `1/24`, `burnMod 0.5` para movimientos físicos si el atacante está quemado. **Sin field modifier** (sin clima). |
| Tipos | Cargados desde PokéAPI: `doubleDamageFrom`, `halfDamageFrom`, `noDamageFrom`. Multiplicadores se combinan por cada tipo defensor (x2 · x2 = x4, x0.5 · x0.5 = x0.25, x0 corta a 0). |
| Estados | Burn, Poison, Paralysis duran **3 turnos**. Burn/Poison aplican `floor(maxHp * 0.05)` por turno. **Parálisis NO** reduce velocidad ni añade fallo (MVP estricto). Bajadas de stat (atk-/def-/spe-) son stages permanentes hasta switch (no contador). |
| Switch | Limpia status y stat stages del Pokémon retirado. |
| Concurrencia | El segundo POST `/action` del mismo jugador en un turno responde **409**. El move debe pertenecer al activo no debilitado o devuelve **400**. Si el guest intenta `POST /rooms/:code/stage` recibe **403**. |
| Sincronización | Polling cada **1.5s** desde el cliente. Sin WebSockets ni SSE. |

---

## Endpoints API

| Método | Ruta | Propósito |
|--------|------|----------|
| POST | `/rooms` | Crear sala. Body: `{ playerName }`. Devuelve `code`, `playerId`. |
| GET  | `/rooms/:code` | Estado del lobby (polling). |
| POST | `/rooms/:code/join` | Unirse con código. |
| POST | `/rooms/:code/team` | Enviar equipo (1–6 pokedexIds). Marca `ready`. |
| POST | `/rooms/:code/stage` | Elegir escenario (solo host). |
| POST | `/rooms/:code/start` | Iniciar batalla (solo host, ambos ready). |
| GET  | `/battles/:code` | Estado de batalla (polling). |
| POST | `/battles/:code/action` | Enviar acción del turno. Body: `{ playerId, action: { type: 'move'/'switch', moveId?/targetIndex? } }`. |
| GET  | `/pokemon?page&pageSize&search` | Catálogo paginado para el TeamPicker. |
| GET  | `/pokemon/:id` | Detalle de un Pokémon. |
| GET  | `/health` | Healthcheck. |

---

## Importador PokéAPI

Script idempotente que upsertea por `pokedexId` / `moveId` / `name`:

```bash
bun --filter @pokept/api import
# o, con Docker:
docker compose exec api bun run import
```

- Trae los primeros **340 Pokémon** de PokéAPI para garantizar ≥300 importados tras descartes.
- Por cada Pokémon: filtra moves `level-up`, ordena por nivel desc, toma los 4 primeros que sean utilizables (power>0 o status modelable).
- Cachea cada move referenciado en `moves` con `power`, `accuracy`, `priority`, `damageClass`, `effect`.
- Importa los **18 tipos** con sus `doubleDamageFrom`, `halfDamageFrom`, `noDamageFrom`.
- **Sprites**: cascada `versions.generation-iv.platinum.front_default` → `heartgold-soulsilver` → `diamond-pearl` → `front_default`.
- Concurrencia 10 + retry exponencial; tarda **~30–60 segundos** según red.
- Logs al final: `[importer] OK: 325 Pokémon importados, 338 movimientos, 18 tipos`.

---

## Estructura visual / animaciones (resumen)

Catálogo en `apps/web/src/styles/animations.css`:

| Categoría | Keyframes |
|-----------|-----------|
| Sprites | `idle-bob`, `attack-lunge-ally`, `attack-lunge-foe`, `attack-flash` |
| Daño | `hit-shake`, `hit-tint`, `damage-popup`, `damage-popup-crit`, `crit-burst` |
| Efectividad | `super-effective-strobe`, `not-very-effective-mute`, `no-effect-puff` |
| Switch/faint | `faint-fall`, `switch-recall`, `switch-summon` |
| HP/estados | `hp-low-pulse`, `status-burn-flicker`, `status-poison-bubble`, `status-paralysis-spark`, `stat-down-arrow` |
| Diálogo | `dialog-typewriter`, `dialog-arrow-blink` |
| Victoria | `victory-confetti`, `victory-shimmer` |
| Splash | `title-letter-drop`, `title-glow`, `screen-shake` |
| Utilidades | `bounce-in`, `slide-in-left`, `spin-slow` |

Las animaciones se orquestan turn-by-turn en `battle.$code.tsx` mediante un reducer de log: cada entry nuevo se reproduce secuencialmente con `await sleep(durationMs)` para que las animaciones no se solapen.

---

## Créditos

- Datos: [PokéAPI](https://pokeapi.co/).
- Sprites: Game Freak / Nintendo (vía PokéAPI Gen-IV Platinum).
