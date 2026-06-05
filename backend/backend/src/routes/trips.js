const router = require("express").Router();
const traccar = require("../traccar");
const { pool } = require("../db/pool");

/**
 * GET /api/trips?deviceId=X&from=ISO&to=ISO
 *
 * Required query params:
 *   deviceId  – Traccar device ID
 *   from      – ISO-8601 start time  (e.g. 2024-01-01T00:00:00Z)
 *   to        – ISO-8601 end time
 */
router.get("/", async (req, res, next) => {
  try {
    const { deviceId, from, to } = req.query;
    if (!deviceId || !from || !to) {
      return res.status(400).json({ error: "deviceId, from, and to are required." });
    }

    const trips = await traccar.getTrips(deviceId, from, to);

    // Persist to DB
    for (const t of trips) {
      await pool.query(
        `INSERT INTO trips
           (device_id, start_time, end_time,
            start_lat, start_lon, end_lat, end_lon,
            start_address, end_address,
            distance, average_speed, max_speed, duration, attributes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         ON CONFLICT DO NOTHING`,
        [
          t.deviceId,
          t.startTime, t.endTime,
          t.startLat,  t.startLon,
          t.endLat,    t.endLon,
          t.startAddress, t.endAddress,
          t.distance,  t.averageSpeed, t.maxSpeed,
          t.duration,  JSON.stringify(t.attributes ?? {}),
        ]
      );
    }

    res.json({ count: trips.length, data: trips });
  } catch (err) { next(err); }
});

/**
 * GET /api/trips/history?deviceId=X&limit=50
 * Returns persisted trips from local DB (fast, no Traccar call).
 */
router.get("/history", async (req, res, next) => {
  try {
    const { deviceId, limit = 50 } = req.query;
    const params = deviceId ? [deviceId, limit] : [limit];
    const whereClause = deviceId ? "WHERE device_id = $1" : "";
    const limitParam  = deviceId ? "$2" : "$1";

    const { rows } = await pool.query(
      `SELECT * FROM trips ${whereClause} ORDER BY start_time DESC LIMIT ${limitParam}`,
      params
    );
    res.json({ count: rows.length, data: rows });
  } catch (err) { next(err); }
});

/**
 * GET /api/trips/route?deviceId=X&from=ISO&to=ISO
 *
 * Returns position history (route points) for a device within a time range.
 * Required query params:
 *   deviceId  – Traccar device ID
 *   from      – ISO-8601 start time
 *   to        – ISO-8601 end time
 */
router.get("/route", async (req, res, next) => {
  try {
    const { deviceId, from, to } = req.query;
    if (!deviceId || !from || !to) {
      return res.status(400).json({ error: "deviceId, from, and to are required." });
    }

    // Get positions from Traccar
    const positions = await traccar.getPositions({
      deviceId,
      from,
      to,
    });

    res.json(positions);
  } catch (err) { next(err); }
});

module.exports = router;
