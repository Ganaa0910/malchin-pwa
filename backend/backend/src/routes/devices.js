const router = require("express").Router();
const traccar = require("../traccar");
const { pool } = require("../db/pool");

/**
 * GET /api/devices
 * Returns all devices, syncs to local DB, then returns cached list.
 */
router.get("/", async (req, res, next) => {
  try {
    const devices = await traccar.getDevices();

    // Upsert into local DB
    for (const d of devices) {
      await pool.query(
        `INSERT INTO devices (traccar_id, name, unique_id, status, last_update, position_id, attributes, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
         ON CONFLICT (traccar_id) DO UPDATE
           SET name=$2, unique_id=$3, status=$4, last_update=$5, position_id=$6, attributes=$7, updated_at=NOW()`,
        [d.id, d.name, d.uniqueId, d.status, d.lastUpdate, d.positionId, JSON.stringify(d.attributes ?? {})]
      );
    }

    res.json({ count: devices.length, data: devices });
  } catch (err) { next(err); }
});

/**
 * GET /api/devices/:id
 * Single device detail from Traccar.
 */
router.get("/:id", async (req, res, next) => {
  try {
    const device = await traccar.getDevice(req.params.id);
    res.json(device);
  } catch (err) { next(err); }
});

/**
 * GET /api/devices/cache
 * Returns devices from local PostgreSQL (no Traccar call – fast).
 */
router.get("/cache", async (req, res, next) => {
  try {
    const { rows } = await pool.query("SELECT * FROM devices ORDER BY name");
    res.json({ count: rows.length, data: rows });
  } catch (err) { next(err); }
});

/**
 * POST /api/devices
 * Create a new device in Traccar and save to local DB.
 *
 * Body:
 * {
 *   "name":     "Truck 01",        (required)
 *   "uniqueId": "123456789012345", (required – IMEI or any unique identifier)
 *   "groupId":  0,                 (optional – Traccar group)
 *   "phone":    "+97611223344",    (optional)
 *   "model":    "FMB920",          (optional)
 *   "contact":  "Driver name",     (optional)
 *   "category": "truck"            (optional – arrow/car/truck/van/moped/motorcycle/bicycle/person/animal/helicopter/ship/bus/scooter/default)
 * }
 */
router.post("/", async (req, res, next) => {
  try {
    const { name, uniqueId } = req.body;
    if (!name || !uniqueId) {
      return res.status(400).json({ error: "name and uniqueId are required." });
    }

    const created = await traccar._post("/devices", req.body);

    await pool.query(
      `INSERT INTO devices (traccar_id, name, unique_id, status, attributes, updated_at)
       VALUES ($1,$2,$3,'unknown',$4,NOW())
       ON CONFLICT (traccar_id) DO UPDATE
         SET name=$2, unique_id=$3, updated_at=NOW()`,
      [created.id, created.name, created.uniqueId, JSON.stringify(created.attributes ?? {})]
    );

    res.status(201).json(created);
  } catch (err) { next(err); }
});

/**
 * PUT /api/devices/:id
 * Update an existing device in Traccar and sync to local DB.
 *
 * Body: same fields as POST (all optional except id must match param)
 */
router.put("/:id", async (req, res, next) => {
  try {
    const updated = await traccar._put(`/devices/${req.params.id}`, {
      id: parseInt(req.params.id),
      ...req.body,
    });

    await pool.query(
      `UPDATE devices SET name=$1, unique_id=$2, attributes=$3, updated_at=NOW()
       WHERE traccar_id=$4`,
      [updated.name, updated.uniqueId, JSON.stringify(updated.attributes ?? {}), updated.id]
    );

    res.json(updated);
  } catch (err) { next(err); }
});

/**
 * DELETE /api/devices/:id
 * Delete a device from Traccar and remove from local DB.
 */
router.delete("/:id", async (req, res, next) => {
  try {
    await traccar._delete(`/devices/${req.params.id}`);
    await pool.query("DELETE FROM devices WHERE traccar_id = $1", [req.params.id]);
    res.json({ message: `Device ${req.params.id} deleted.` });
  } catch (err) { next(err); }
});

module.exports = router;
