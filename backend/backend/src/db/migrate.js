require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const { pool } = require("./pool");

const SQL = `
/* ── Devices cache ────────────────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS devices (
  id              SERIAL PRIMARY KEY,
  traccar_id      INTEGER UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  unique_id       TEXT NOT NULL,           -- IMEI / identifier sent by device
  status          TEXT DEFAULT 'unknown',  -- online | offline | unknown
  last_update     TIMESTAMPTZ,
  position_id     INTEGER,
  attributes      JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

/* ── Positions cache ──────────────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS positions (
  id              SERIAL PRIMARY KEY,
  traccar_id      INTEGER UNIQUE NOT NULL,
  device_id       INTEGER REFERENCES devices(traccar_id) ON DELETE CASCADE,
  protocol        TEXT,
  server_time     TIMESTAMPTZ,
  device_time     TIMESTAMPTZ,
  fix_time        TIMESTAMPTZ,
  valid           BOOLEAN DEFAULT TRUE,
  latitude        DOUBLE PRECISION NOT NULL,
  longitude       DOUBLE PRECISION NOT NULL,
  altitude        DOUBLE PRECISION DEFAULT 0,
  speed           DOUBLE PRECISION DEFAULT 0,  -- knots
  course          DOUBLE PRECISION DEFAULT 0,
  address         TEXT,
  attributes      JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_positions_device_id  ON positions(device_id);
CREATE INDEX IF NOT EXISTS idx_positions_fix_time   ON positions(fix_time DESC);

/* ── Geofences ────────────────────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS geofences (
  id              SERIAL PRIMARY KEY,
  traccar_id      INTEGER UNIQUE,
  name            TEXT NOT NULL,
  description     TEXT,
  area            TEXT NOT NULL,           -- WKT polygon / circle stored by Traccar
  attributes      JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

/* ── Alerts / Events log ──────────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS events (
  id              SERIAL PRIMARY KEY,
  traccar_id      INTEGER UNIQUE,
  device_id       INTEGER REFERENCES devices(traccar_id) ON DELETE SET NULL,
  type            TEXT NOT NULL,           -- geofenceEnter | geofenceExit | alarm | etc.
  event_time      TIMESTAMPTZ,
  position_id     INTEGER,
  geofence_id     INTEGER,
  attributes      JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_events_device_id ON events(device_id);
CREATE INDEX IF NOT EXISTS idx_events_type      ON events(type);

/* ── Trips cache ──────────────────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS trips (
  id              SERIAL PRIMARY KEY,
  device_id       INTEGER REFERENCES devices(traccar_id) ON DELETE CASCADE,
  start_time      TIMESTAMPTZ NOT NULL,
  end_time        TIMESTAMPTZ NOT NULL,
  start_lat       DOUBLE PRECISION,
  start_lon       DOUBLE PRECISION,
  end_lat         DOUBLE PRECISION,
  end_lon         DOUBLE PRECISION,
  start_address   TEXT,
  end_address     TEXT,
  distance        DOUBLE PRECISION DEFAULT 0,  -- metres
  average_speed   DOUBLE PRECISION DEFAULT 0,  -- knots
  max_speed       DOUBLE PRECISION DEFAULT 0,
  duration        INTEGER DEFAULT 0,           -- seconds
  attributes      JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trips_device_id  ON trips(device_id);
CREATE INDEX IF NOT EXISTS idx_trips_start_time ON trips(start_time DESC);
`;

(async () => {
  try {
    console.log("Running migrations…");
    await pool.query(SQL);
    console.log("✅  All tables created / verified.");
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
