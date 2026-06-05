const router = require("express").Router();
const traccar = require("../traccar");
const { pool } = require("../db/pool");

// ── Helpers ───────────────────────────────────────────────────────────────────

async function syncGeofence(g) {
  await pool.query(
    `INSERT INTO geofences (traccar_id, name, description, area, attributes, updated_at)
     VALUES ($1,$2,$3,$4,$5,NOW())
     ON CONFLICT (traccar_id) DO UPDATE
       SET name=$2, description=$3, area=$4, attributes=$5, updated_at=NOW()`,
    [g.id, g.name, g.description ?? "", g.area, JSON.stringify(g.attributes ?? {})]
  );
}

// ── Routes ────────────────────────────────────────────────────────────────────

/** GET /api/geofences – list all, sync to DB */
router.get("/", async (req, res, next) => {
  try {
    const geofences = await traccar.getGeofences();
    for (const g of geofences) await syncGeofence(g);
    res.json({ count: geofences.length, data: geofences });
  } catch (err) { next(err); }
});

/** POST /api/geofences – create a new geofence in Traccar + DB
 *
 * Body example:
 * {
 *   "name": "Warehouse",
 *   "area": "CIRCLE (47.9184 106.9177, 500)",
 *   "description": "Main warehouse zone"
 * }
 */
router.post("/", async (req, res, next) => {
  try {
    const created = await traccar.createGeofence(req.body);
    await syncGeofence(created);
    res.status(201).json(created);
  } catch (err) { next(err); }
});

/** PUT /api/geofences/:id – update */
router.put("/:id", async (req, res, next) => {
  try {
    const updated = await traccar.updateGeofence(req.params.id, req.body);
    await syncGeofence(updated);
    res.json(updated);
  } catch (err) { next(err); }
});

/** DELETE /api/geofences/:id */
router.delete("/:id", async (req, res, next) => {
  try {
    await traccar.deleteGeofence(req.params.id);
    await pool.query("DELETE FROM geofences WHERE traccar_id = $1", [req.params.id]);
    res.json({ message: "Geofence deleted." });
  } catch (err) { next(err); }
});

// ── Events / Alerts ───────────────────────────────────────────────────────────

/**
 * GET /api/geofences/events?deviceId=X&from=ISO&to=ISO
 * Fetches geofence enter/exit events and persists them.
 */
router.get("/events", async (req, res, next) => {
  try {
    const { deviceId, from, to } = req.query;
    if (!deviceId || !from || !to) {
      return res.status(400).json({ error: "deviceId, from, and to are required." });
    }

    const events = await traccar.getEvents(deviceId, from, to);

    for (const e of events) {
      await pool.query(
        `INSERT INTO events
           (traccar_id, device_id, type, event_time, position_id, geofence_id, attributes)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (traccar_id) DO NOTHING`,
        [e.id, e.deviceId, e.type, e.eventTime, e.positionId, e.geofenceId,
         JSON.stringify(e.attributes ?? {})]
      );
    }

    res.json({ count: events.length, data: events });
  } catch (err) { next(err); }
});

/**
 * GET /api/geofences/alerts?deviceId=X&limit=100
 * Returns persisted events/alerts from local DB.
 */
router.get("/alerts", async (req, res, next) => {
  try {
    const { deviceId, limit = 100 } = req.query;
    const params = deviceId ? [deviceId, limit] : [limit];
    const whereClause = deviceId ? "WHERE device_id = $1" : "";
    const limitParam  = deviceId ? "$2" : "$1";

    const { rows } = await pool.query(
      `SELECT * FROM events ${whereClause} ORDER BY event_time DESC LIMIT ${limitParam}`,
      params
    );
    res.json({ count: rows.length, data: rows });
  } catch (err) { next(err); }
});

module.exports = router;
