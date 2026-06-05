const router = require("express").Router();
const traccar = require("../traccar");
const { pool } = require("../db/pool");

/**
 * GET /api/positions
 * Query params: deviceId (optional) – if omitted, returns all live positions.
 */
router.get("/", async (req, res, next) => {
  try {
    const params = req.query.deviceId ? { deviceId: req.query.deviceId } : {};
    const positions = await traccar.getPositions(params);

    // Cache in DB
    for (const p of positions) {
      await pool.query(
        `INSERT INTO positions
           (traccar_id, device_id, protocol, server_time, device_time, fix_time,
            valid, latitude, longitude, altitude, speed, course, address, attributes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         ON CONFLICT (traccar_id) DO UPDATE
           SET device_id=$2, server_time=$4, device_time=$5, fix_time=$6,
               valid=$7, latitude=$8, longitude=$9, altitude=$10,
               speed=$11, course=$12, address=$13, attributes=$14`,
        [
          p.id, p.deviceId, p.protocol,
          p.serverTime, p.deviceTime, p.fixTime,
          p.valid, p.latitude, p.longitude,
          p.altitude, p.speed, p.course,
          p.address, JSON.stringify(p.attributes ?? {}),
        ]
      );
    }

    res.json({ count: positions.length, data: positions });
  } catch (err) { next(err); }
});

/**
 * GET /api/positions/latest
 * Returns the most recent cached position per device.
 */
router.get("/latest", async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT DISTINCT ON (device_id) *
      FROM positions
      ORDER BY device_id, fix_time DESC NULLS LAST
    `);
    res.json({ count: rows.length, data: rows });
  } catch (err) { next(err); }
});

module.exports = router;
