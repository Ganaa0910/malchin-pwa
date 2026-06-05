require("dotenv").config();
const express      = require("express");
const cors         = require("cors");
const { testConnection } = require("./db/pool");
const traccar      = require("./traccar");
const errorHandler = require("./middleware/errorHandler");

// ── Routes ────────────────────────────────────────────────────────────────────
const devicesRouter    = require("./routes/devices");
const positionsRouter  = require("./routes/positions");
const tripsRouter      = require("./routes/trips");
const geofencesRouter  = require("./routes/geofences");

const app  = express();
const PORT = process.env.PORT ?? 3000;

// ── Global Middleware ─────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", async (_req, res) => {
  try {
    await testConnection();
    res.json({ status: "ok", db: "connected", timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: "error", db: "disconnected" });
  }
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/devices",    devicesRouter);
app.use("/api/positions",  positionsRouter);
app.use("/api/trips",      tripsRouter);
app.use("/api/geofences",  geofencesRouter);

// ── Error Handler (must be last) ──────────────────────────────────────────────
app.use(errorHandler);

// ── Boot ──────────────────────────────────────────────────────────────────────
(async () => {
  try {
    await testConnection();
    console.log("✅  PostgreSQL connected");

    await traccar.authenticate();
    console.log("✅  Traccar authenticated");

    app.listen(PORT, () =>
      console.log(`🚀  Server running on http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error("❌  Startup failed:", err.message);
    process.exit(1);
  }
})();
