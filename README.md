# SearchGrid

**Coordinador de búsqueda offline-first** — Aplicación PWA para coordinar búsquedas de personas o objetos en terreno, con soporte para conectividad intermitente.

## Arquitectura

```
┌─────────────────────────────────────────────────────┐
│  SERVIDOR (Express + Socket.io + SQLite)            │
│  Puerto 3001                                        │
│  - API REST (CRUD misiones, buscadores, sync)       │
│  - WebSocket para eventos en tiempo real            │
│  - División de polígono en cuadrícula de sectores   │
│  - Validación de palabra clave                      │
└──────────┬──────────────────────────────────────────┘
           │ Proxy Vite (/api → :3001, /socket.io → :3001)
           │
┌──────────▼──────────────────────────────────────────┐
│  CLIENTE (Vite + Preact + Leaflet + IndexedDB)      │
│  Puerto 5173                                        │
│                                                      │
│  ┌─────────────────┐    ┌────────────────────────┐  │
│  │  DASHBOARD       │    │  BUSCADOR              │  │
│  │  (Requiere       │    │  (Offline-first PWA)   │  │
│  │   internet)      │    │                        │  │
│  │                  │    │  - IndexedDB local     │  │
│  │  - Crear misión  │    │  - Cola de ops pend.  │  │
│  │  - Dibujar       │    │  - GPS tracking       │  │
│  │    polígono      │    │  - Marcar sectores    │  │
│  │  - Ver tiempo    │    │  - Sync automático    │  │
│  │    real          │    │  - Funciona sin señal  │  │
│  └─────────────────┘    └────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Tecnologías

| Capa | Tecnología | Propósito |
|------|-----------|-----------|
| **Frontend** | Preact + TypeScript | UI liviana (~5KB runtime) |
| **Mapa** | Leaflet | Mapas interactivos sin dependencias pesadas |
| **PWA** | vite-plugin-pwa + Workbox | Offline, service worker, cache de tiles |
| **DB Local** | IndexedDB | Almacenamiento offline sin WASM |
| **Backend** | Express + Node.js | API REST |
| **Tiempo real** | Socket.io | Notificaciones push al dashboard |
| **BD Servidor** | better-sqlite3 | Persistencia centralizada |
| **Proxy** | Vite dev server | Redirección de /api al backend |

## Cómo ejecutar

```bash
# Instalar dependencias
cd client && npm install
cd .. && npm install

# Iniciar ambos servidores (backend + frontend)
npm run dev
```

O por separado:

```bash
# Servidor (puerto 3001)
npm run server

# Cliente (puerto 5173)
cd client && npx vite --host 0.0.0.0 --port 5173
```

Abrir en el navegador: `http://localhost:5173`

## Cómo usar

### Dashboard (Coordinador)

1. Abrir `http://localhost:5173/dashboard`
2. **Crear búsqueda**: ingresar título, marcar puntos en el mapa para definir el polígono de búsqueda
3. Opcional: activar **"Proteger con palabra clave"** para controlar acceso
4. Al crear, se genera un **enlace compartible** con ID único
5. Compartir el enlace por WhatsApp o copiarlo
6. El dashboard muestra en **tiempo real**:
   - Posición de cada buscador
   - Sectores pendientes / en búsqueda / revisados
   - Estadísticas de progreso
   - Lista de buscadores conectados

### Buscador (Terreno)

1. Abrir el enlace compartido: `http://localhost:5173/searcher/<ID>`
2. O ingresar manualmente el ID de la misión
3. Si la misión tiene **palabra clave**, ingresarla
4. Ingresar nombre y presionar **"Unirse"**
5. Activar **GPS** para compartir ubicación (cada 30s)
6. **Tocar sectores** en el mapa para marcarlos:
   - Primer toque → "buscando" (amarillo)
   - Segundo toque → "revisado" (verde)
7. Las marcas se guardan localmente y se sincronizan automáticamente al recuperar conexión
8. Botón **"Sincronizar"** para forzar sync manual

## API REST

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/missions` | Listar misiones activas |
| `POST` | `/api/missions` | Crear misión (body: `{title, polygon, keyword?}`) |
| `GET` | `/api/missions/:id` | Detalle de misión con sectores y buscadores |
| `GET` | `/api/missions/:id/info` | Info pública (sin sectores): título, si requiere clave |
| `GET` | `/api/missions/:id/state` | Estado completo (misión, sectores parseados, buscadores) |
| `POST` | `/api/missions/:id/join` | Unirse a misión (body: `{name, keyword?}`) |
| `POST` | `/api/sync` | Sincronizar operaciones offline (body: `{deviceId, missionId, operations}`) |

### Eventos WebSocket

| Evento | Dirección | Descripción |
|--------|-----------|-------------|
| `join:mission` | Cliente → Servidor | Unirse a sala de misión |
| `leave:mission` | Cliente → Servidor | Salir de sala |
| `searcher:joined` | Servidor → Clientes | Nuevo buscador |
| `location:updated` | Servidor → Clientes | Actualización de ubicación |
| `sector:updated` | Servidor → Clientes | Sector marcado como buscando/revisado |

## Estrategia Offline

1. **IndexedDB** almacena sectores, misión actual y cola de operaciones pendientes
2. Cada acción (marcar sector, ubicación GPS) se guarda en `pending_ops`
3. Al recuperar conexión, el **evento `online`** dispara sync automático
4. El sync envía todas las operaciones pendientes en un solo `POST /api/sync`
5. El servidor procesa el lote y broadcast a los dashboards vía WebSocket
6. Service Worker cachea tiles de OpenStreetMap para visualización offline

## Licencia

MIT
