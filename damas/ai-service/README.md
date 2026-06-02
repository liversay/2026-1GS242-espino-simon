# ai-service — IA de Quings con A\*

Microservicio **stateless** que decide la jugada de la computadora. Se comporta como una
**función pura**: recibe un tablero y devuelve el mejor movimiento. **No usa LLMs** ni base de datos.

## Endpoints

- `GET /health` → `{ status, service, algorithm }`
- `POST /move`
  ```jsonc
  // Request
  { "board": [[0,2,0, ...], ...], "currentPlayer": "ai" }
  // Response
  {
    "from": { "row": 5, "col": 2 },
    "to":   { "row": 3, "col": 4 },
    "captures": [ { "row": 4, "col": 3 } ],   // [] si no hay captura
    "analysis": { "score": 42, "nodesExplored": 137, "depth": 3 }
  }
  ```

## Algoritmo A\* (`src/astar.ts`)

Búsqueda con `f(n) = g(n) + h(n)`:

- **Nodo** = estado del tablero. **Aristas** = movimientos legales generados por
  `@quings/game-engine` (incluye captura obligatoria; una cadena de captura es una sola arista).
- **`g(n)`** = profundidad / costo acumulado del camino desde la raíz.
- **`h(n)`** = heurística `evaluate(board)` (perspectiva de la IA, `src/heuristic.ts`).
- **`f(n)` = `g(n) + h(n)`**.
- **Frontera** = cola de prioridad ordenada por `f(n)`. Se expande primero el nodo más
  prometedor (best-first). Al llegar a **profundidad 3** o a un estado terminal, la hoja se
  evalúa y su valor se **propaga hacia la raíz** con respaldo MIN/MAX:
  - nodo donde mueve la **IA** → **MAX** (maximiza su evaluación),
  - nodo donde mueve el **rival** → **MIN** (minimiza la evaluación de la IA).
- Se devuelve el **movimiento de primer nivel** que conduce al mejor valor para la IA.

## Heurística (`src/heuristic.ts`)

Principal (minimizadora): número de formas en que el oponente puede capturar fichas de la IA.
Combinada (perspectiva IA, mayor = mejor):

```
eval = 10 * (materialIA - materialRival)      // peón = 1, reina = 1.6
     - 15 * amenazasDeCapturaContraIA          // heurística principal (minimizar)
     +  8 * capturasDisponiblesParaIA          // favorecer capturar
     +  2 * (centroIA - centroRival)           // control del centro
     -  6 * fichasIAExpuestas                  // evitar exponer fichas
     +  3 * reinasIA + cercaníaDePromociónIA   // valorar reinas / avanzar a coronar
```

## Desarrollo

```bash
bun install          # desde la raíz del monorepo
bun run dev          # dentro de ai-service/ (watch)
bun test             # pruebas del A* y la heurística
```

Fuera de alcance: reinforcement learning y self-play.
