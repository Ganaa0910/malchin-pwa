# Traccar Backend — Express + PostgreSQL

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your DB credentials and Traccar server URL
```

### 3. Create the database
```bash
psql -U postgres -c "CREATE DATABASE traccar_app;"
```

### 4. Run migrations (creates all tables)
```bash
npm run migrate
```

### 5. Start the server
```bash
npm run dev      # development (auto-reload)
npm start        # production
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server + DB health check |
| **Devices** | | |
| GET | `/api/devices` | Fetch all devices from Traccar, sync to DB |
| GET | `/api/devices/:id` | Single device |
| GET | `/api/devices/cache` | Devices from local DB (fast) |
| **Positions** | | |
| GET | `/api/positions?deviceId=X` | Live positions (all or one device) |
| GET | `/api/positions/latest` | Latest cached position per device |
| **Trips** | | |
| GET | `/api/trips?deviceId=X&from=ISO&to=ISO` | Trip history from Traccar |
| GET | `/api/trips/history?deviceId=X&limit=50` | Trips from local DB |
| **Geofences** | | |
| GET | `/api/geofences` | List all geofences |
| POST | `/api/geofences` | Create geofence |
| PUT | `/api/geofences/:id` | Update geofence |
| DELETE | `/api/geofences/:id` | Delete geofence |
| GET | `/api/geofences/events?deviceId=X&from=ISO&to=ISO` | Geofence enter/exit events |
| GET | `/api/geofences/alerts?deviceId=X&limit=100` | Alerts from local DB |

---

## Geofence Area Format (Traccar)
```
Circle:  CIRCLE (LAT LON, RADIUS_METRES)
Polygon: POLYGON ((LON1 LAT1, LON2 LAT2, ...))
```

## Date Format
All `from` / `to` params must be ISO-8601:
```
2024-06-01T00:00:00Z
```

---

## Database Tables
- `devices` — synced from Traccar
- `positions` — live + historical positions cache
- `trips` — trip reports cache
- `geofences` — geofence definitions
- `events` — geofence alerts & events log
