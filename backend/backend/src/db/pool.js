const { Pool } = require("pg");

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT, 10),
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 2_000,
});

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL pool error:", err);
});

// Simple health-check helper
const testConnection = async () => {
  const client = await pool.connect();
  await client.query("SELECT 1");
  client.release();
};

module.exports = { pool, testConnection };
