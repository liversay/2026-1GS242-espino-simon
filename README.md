# PokePt Evolution

Aplicación web de batallas Pokémon 1v1 por salas con código, look retro/arcade inspirado en Pokémon Platinum.

> **Stack**: TanStack Router · React 18 · Vite · Bun · Hono · MongoDB · Docker Compose  
> **Datos**: ~325 Pokémon importados desde [PokéAPI](https://pokeapi.co/) y persistidos en MongoDB. La aplicación no consulta PokéAPI durante el juego.

---

## ¿Qué hay adentro?

- **Salas 1v1** con código de 6 caracteres. El primer jugador es _host_; un segundo se une con el código.
- **Selector de escenario** (solo el host): **23 escenarios** como imágenes PNG reales — playa, cueva, desierto, lago, montaña, océano, camino, nieve, pradera alta, bajo el agua, y variantes nocturnas.
- **Equipo de exactamente 6 Pokémon** por jugador, cada uno con 4 movimientos importados desde PokéAPI. Máximo 1 legendario por equipo.
- **Motor de batalla en el servidor**: el frontend solo envía decisiones; daño, tipos, estados y victoria se resuelven en el API.
- **Música de fondo adaptativa**: `alder-encounter` en menú/lobby, `pokemon-battle` durante la batalla. Cross-fade de 500ms al cambiar. Botón 🔊/🔇 con persistencia en `localStorage`.
- **Estética neo-pixel editorial**: Press Start 2P / Silkscreen / Jersey 15 / VT323, paleta violeta-acerado con acentos cálidos, paneles DS-cartucho con `clip-path` diagonal, scanlines + grano SVG.
- **Animaciones CSS** orquestadas turno a turno: lunge, shake, crit-burst, faint-fall, flash de efectividad, switch, typewriter en el log de batalla.

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
│       ├── public/
│       │   ├── scenarios/    # 23 PNG de escenarios de batalla
│       │   └── sounds/       # alder-encounter.mp3, pokemon-battle.mp3
│       └── src/
│           ├── routes/{index,create,join,lobby.$code,battle.$code}.tsx
│           ├── components/
│           │   ├── BattleLog, HpBox, MoveButton, PokemonStage
│           │   ├── SwitchMenu, TeamPicker, StagePicker
│           │   ├── CoinFlip, VictoryBanner, TypeChart
│           │   ├── MusicManager, StatusBadge, TypeChip
│           │   └── stages/Stage.tsx  (carga PNG por stageId)
│           ├── styles/{tokens,animations,app,reset}.css
│           ├── lib/{api,storage}.ts
│           └── hooks/usePolling.ts
├── packages/
│   └── shared/src/types.ts   # tipos compartidos API ↔ Web
├── docker-compose.yml
└── apps/{api,web}/Dockerfile
```

---

## Setup A — Docker (canónico)

Requiere Docker (en Mac se recomienda **Colima** sin Docker Desktop):

```bash
# 1) Instalar Docker stack en Mac
brew install colima docker docker-compose docker-buildx
colima start --cpu 2 --memory 4 --disk 30

# 2) Construir y levantar
cd PokePt_Evolution
docker compose up --build -d

# 3) Importar los ~325 Pokémon (una sola vez; persiste en el volumen)
docker compose exec api bun run import

# Listo:
#   Web → http://localhost:3000
#   API → http://localhost:3001
```

Cuando hagas cambios en el código:

```bash
docker compose build api web && docker compose up -d
```

## Setup B — Desarrollo local sin Docker

Requiere: **Bun 1.1+** y **MongoDB** en `localhost:27017`. Lo más simple es levantar solo Mongo en Docker:

```bash
docker run -d --name pp-mongo -p 27017:27017 -v pp-mongo-data:/data/db mongo:7
```

Luego en el monorepo:

```bash
cd PokePt_Evolution
bun install
bun --filter @pokept/api import           # importa ~325 Pokémon a Mongo (una vez)
# terminal 1:
bun --filter @pokept/api dev              # API en http://localhost:3001
# terminal 2:
bun --filter @pokept/web dev              # Web en http://localhost:3000
```

Variables de entorno:

| Var | Default | Dónde |
|-----|---------|-------|
| `MONGO_URL` | `mongodb://localhost:27017` | API |
| `MONGO_DB`  | `pokept` | API |
| `PORT`      | `3001` | API |
| `VITE_API_BASE` | `/api` (proxy de Vite hacia `3001`) | Web |

> **Nota**: `bun --hot` a veces no recarga módulos internos correctamente. Si un cambio en la API no surte efecto, reinicia el proceso.

---

## Demo paso a paso

1. Abrí `http://localhost:3000` en **dos navegadores distintos** (uno normal + uno incógnito, o dos computadoras en la misma red).
2. **Navegador A** → "Crear sala" → ingresá tu nombre → te lleva al lobby con un código de 6 chars (ej. `K7M2QX`).
3. **Navegador B** → "Unirse con código" → pegá el código y tu nombre.
4. **Ambos eligen exactamente 6 Pokémon** en el TeamPicker y presionan "Confirmar equipo". Máximo 1 legendario por equipo.
5. **Solo el host** elige el escenario en el StagePicker (23 opciones con PNG). El guest ve la elección en tiempo real.
6. El host presiona **"⚡ Start battle!"**.
7. **Coin flip**: el guest elige cara o cruz; el ganador ataca primero.
8. Cada turno: elige entre **FIGHT** (usar un movimiento), **POKEMON** (cambio voluntario), **RUN** (rendirse) o **HELP** (tabla de tipos).
9. Cuando un Pokémon cae, su dueño elige el reemplazo — eso **consume el turno**, el rival ataca primero al nuevo Pokémon.

### Cosas para mostrar en demo

| Situación | Cómo provocarla |
|-----------|-----------------|
| Súper efectivo (x4) | Pikachu (eléctrico) vs Gyarados (agua/volador) con Thunderbolt |
| Inmune (x0) | Ataque Normal vs Pokémon Fantasma |
| Estado burn | Will-O-Wisp → status visible 3 turnos, -5% HP por turno en físicos |
| Estado poison | Toxic → -5% HP por turno, 3 turnos |
| Switch limpia estado | Aplicar burn, cambiar Pokémon y volver → status borrado |
| Switch forzado | KO al Pokémon rival → debe elegir reemplazo, **el atacante actúa primero** |
| Victoria | Llevar a 0 HP todo el equipo enemigo → VictoryBanner inline |

---

## Reglas del motor

| Aspecto | Implementación |
|---------|----------------|
| Nivel de batalla | Fijo en **50**. IVs aleatorios al iniciar, persistidos en el documento `Battle`. |
| Movimientos | 4 por Pokémon, seleccionados del pool `level-up`: power > 0 o status modelable. Si < 4 disponibles, el Pokémon se descarta. ~15 descartados (Caterpie, Magikarp, Ditto, Smeargle…). |
| Orden de turno | Coin flip inicial determina quién ataca primero. Alterna cada turno. Sin velocidad ni prioridad de movimiento (MVP). |
| Daño | Fórmula completa: `randomFactor 85–100%`, `STAB ×1.5`, multiplicador de tipo combinado (hasta ×4 o ×0), `crit ×1.5` (prob 1/24), `burnMod ×0.5` para físicos con quemadura. Sin clima. |
| Tipos | 18 tipos desde PokéAPI. Dos tipos defensores se multiplican: ×2·×2 = ×4, ×0 corta a 0. |
| Estados | Burn/Poison: `floor(maxHp × 0.05)` por turno, 3 turnos. Parálisis: badge visual 3 turnos, **sin** reducción de velocidad ni fallo (MVP). Bajadas de stat permanentes hasta switch. |
| Switch forzado | Elegir reemplazo tras un KO **consume el turno** — el rival actúa primero contra el nuevo Pokémon (comportamiento canónico). |
| Switch voluntario | También consume el turno. El switch limpia status y stat stages del Pokémon retirado. |
| Coin flip | Obligatorio al inicio. Solo el **guest** elige cara (host recibe 403). El resultado es 50/50. |
| Leyendarios | Máximo 1 por equipo (validado en `/rooms/:code/team`). |
| Sincronización | Polling cada **400ms** desde el cliente. Sin WebSockets ni SSE. |

---

## Endpoints API

| Método | Ruta | Propósito |
|--------|------|-----------|
| POST | `/rooms` | Crear sala. Body: `{ playerName }`. Devuelve `code`, `playerId`. |
| GET  | `/rooms/:code` | Estado del lobby (polling). |
| POST | `/rooms/:code/join` | Unirse con código. Body: `{ playerName }`. |
| POST | `/rooms/:code/team` | Enviar equipo exacto de 6. Body: `{ playerId, pokedexIds: number[6] }`. |
| POST | `/rooms/:code/stage` | Elegir escenario (solo host). Body: `{ playerId, stageId }`. |
| POST | `/rooms/:code/start` | Iniciar batalla (solo host, ambos ready). Body: `{ playerId }`. |
| GET  | `/battles/:code` | Estado de batalla (polling). |
| POST | `/battles/:code/coin-flip-choice` | Guest elige cara. Body: `{ playerId, choice: 'heads'|'tails' }`. |
| POST | `/battles/:code/coinflip-acknowledge` | Guest confirma resultado del flip. Body: `{ playerId }`. |
| POST | `/battles/:code/action` | Enviar acción del turno. Body: `{ playerId, action: { type: 'move', moveId } \| { type: 'switch', targetIndex } }`. |
| POST | `/battles/:code/forfeit` | Rendirse. Body: `{ playerId }`. |
| GET  | `/pokemon` | Catálogo paginado. Query: `page`, `pageSize`, `search`. |
| GET  | `/health` | Healthcheck. |

---

## Importador PokéAPI

Script idempotente (upsert por `pokedexId` / `moveId` / `name`):

```bash
bun --filter @pokept/api import
# con Docker:
docker compose exec api bun run import
```

- Trae los primeros **340 Pokémon** de PokéAPI → ~325 importados tras descartes.
- Importa los **18 tipos** con relaciones de daño completas.
- **Sprites**: cascada `versions.generation-iv.platinum.front_default` → `heartgold-soulsilver` → `diamond-pearl` → `front_default`.
- Concurrencia 10 + retry exponencial. Tarda **~30–60 segundos** según red.

---

## Créditos

- Datos y sprites: [PokéAPI](https://pokeapi.co/) / Game Freak / Nintendo.
- Música: pistas de Pokémon Black/White (uso académico).
