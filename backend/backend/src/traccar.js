const axios = require("axios");

/**
 * Traccar REST API client.
 * Authenticates once with basic-auth, then reuses the session cookie.
 */
class TraccarClient {
  constructor() {
    this.baseURL = process.env.TRACCAR_BASE_URL;
    this.email   = process.env.TRACCAR_EMAIL;
    this.password= process.env.TRACCAR_PASSWORD;

    this.http = axios.create({ baseURL: this.baseURL });
    this._sessionCookie = null;
  }

  // ── Auth ──────────────────────────────────────────────────────────

  async authenticate() {
    const params = new URLSearchParams({ email: this.email, password: this.password });
    const res = await this.http.post("/session", params.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    const setCookie = res.headers["set-cookie"];
    if (setCookie) {
      this._sessionCookie = setCookie.map((c) => c.split(";")[0]).join("; ");
    }
    return res.data; // user object
  }

  _authHeaders() {
    if (this._sessionCookie) return { Cookie: this._sessionCookie };
    // Fallback: basic auth
    const creds = Buffer.from(`${this.email}:${this.password}`).toString("base64");
    return { Authorization: `Basic ${creds}` };
  }

  async _get(path, params = {}) {
    try {
      const res = await this.http.get(path, {
        params,
        headers: this._authHeaders(),
      });
      return res.data;
    } catch (err) {
      if (err.response?.status === 401) {
        // Re-authenticate and retry once
        await this.authenticate();
        const res = await this.http.get(path, { params, headers: this._authHeaders() });
        return res.data;
      }
      throw err;
    }
  }

  async _post(path, data) {
    const res = await this.http.post(path, data, { headers: this._authHeaders() });
    return res.data;
  }

  async _put(path, data) {
    const res = await this.http.put(path, data, { headers: this._authHeaders() });
    return res.data;
  }

  async _delete(path) {
    const res = await this.http.delete(path, { headers: this._authHeaders() });
    return res.data;
  }

  // ── Devices ───────────────────────────────────────────────────────

  getDevices(params = {}) { return this._get("/devices", params); }
  getDevice(id)            { return this._get(`/devices/${id}`); }

  // ── Positions ─────────────────────────────────────────────────────

  /** Live positions. Pass { deviceId } or {} for all. */
  getPositions(params = {}) { return this._get("/positions", params); }

  // ── Trips ─────────────────────────────────────────────────────────

  /**
   * @param {number} deviceId
   * @param {string} from  ISO-8601 e.g. "2024-01-01T00:00:00Z"
   * @param {string} to    ISO-8601
   */
  getTrips(deviceId, from, to) {
    return this._get("/reports/trips", { deviceId, from, to });
  }

  // ── Geofences ─────────────────────────────────────────────────────

  getGeofences(params = {})  { return this._get("/geofences", params); }
  createGeofence(body)       { return this._post("/geofences", body); }
  updateGeofence(id, body)   { return this._put(`/geofences/${id}`, body); }
  deleteGeofence(id)         { return this._delete(`/geofences/${id}`); }

  // ── Events / Alerts ───────────────────────────────────────────────

  /**
   * @param {number|number[]} deviceId  single id or array
   * @param {string} from  ISO-8601
   * @param {string} to    ISO-8601
   */
  getEvents(deviceId, from, to) {
    const ids = Array.isArray(deviceId) ? deviceId : [deviceId];
    return this._get("/reports/events", { deviceId: ids, from, to });
  }

  /** Pull all notification rules configured in Traccar. */
  getNotifications() { return this._get("/notifications"); }
}

// Export a singleton
module.exports = new TraccarClient();
