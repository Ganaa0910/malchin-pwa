/**
 * Cow Geofence Simulation — Baganuur
 * Realistic speed (1.5–3 km/h), grazes frequently.
 * The moment it touches the restricted zone boundary the collar
 * emits a deterrent tone and the cow immediately turns back.
 *
 * Run: node simulate-cow.js
 */

const http = require("http");

// ── Config ────────────────────────────────────────────────────────────────────
const TRACCAR_HOST       = process.env.TRACCAR_HOST || "localhost";
const TRACCAR_PORT       = Number(process.env.TRACCAR_PORT) || 5055;
const COW_DEVICE_ID      = "COW001";
const UPDATE_INTERVAL_MS = 2000;   // 1 position every 2 seconds

// Realistic cow speeds
const WALK_SPEED_MS  = 0.7;   // ~2.5 km/h  — normal grazing walk
const MAX_SPEED_MS   = 0.9;   // ~3.2 km/h  — purposeful walk
const EXC_SPEED_MS   = 2.2;   // ~7.9 km/h  — striding to the fence with intent
const FLEE_SPEED_MS  = 2.6;   // ~9.4 km/h  — spooked, hurrying home

// ── Baganuur geofence polygon ─────────────────────────────────────────────────
const FENCE = [
  [108.4100972,47.7587111],[108.4169306,47.7562472],[108.4161222,47.755625],
  [108.4157667,47.7552556],[108.4154389,47.7553833],[108.4147639,47.7544694],
  [108.4163722,47.7534972],[108.4169639,47.7539417],[108.4190167,47.7529194],
  [108.4211667,47.7548111],[108.4304222,47.751375],[108.4259944,47.7421333],
  [108.4236528,47.7422528],[108.4170556,47.7445861],[108.4120778,47.7456722],
  [108.4095278,47.7459639],[108.4078083,47.7459806],[108.4069139,47.7459583],
  [108.4006833,47.7459444],[108.39875,47.7459278],[108.3944111,47.7476111],
  [108.3942722,47.7474556],[108.3901611,47.7447972],[108.3986889,47.7431639],
  [108.4011111,47.7427056],[108.397475,47.7340556],[108.3845361,47.7362194],
  [108.3823528,47.7366639],[108.3775111,47.7376694],[108.3753333,47.7382667],
  [108.3701028,47.7393889],[108.3639139,47.7282694],[108.3728972,47.7262611],
  [108.3684056,47.7161333],[108.3674972,47.7148806],[108.3646222,47.7002194],
  [108.3415806,47.6862333],[108.2912889,47.6663944],[108.2447583,47.6860889],
  [108.2441806,47.6866806],[108.2435722,47.6871056],[108.2443528,47.6876917],
  [108.2532278,47.7037056],[108.2653722,47.7245583],[108.2775583,47.7453639],
  [108.2775833,47.7453917],[108.2834944,47.7530556],[108.2881889,47.7590278],
  [108.2927444,47.7648361],[108.2945417,47.76695],[108.2960028,47.768675],
  [108.2984111,47.7708389],[108.3016556,47.7731556],[108.3042861,47.7746917],
  [108.3060333,47.7755167],[108.3069583,47.7759611],[108.3068028,47.7768667],
  [108.3067972,47.7775269],[108.3070333,47.7778778],[108.2949667,47.7924778],
  [108.29215,47.8176167],[108.3433583,47.8359472],[108.3685389,47.8124306],
  [108.4018306,47.8148083],[108.4034028,47.8148444],[108.4143889,47.8115556],
  [108.4155139,47.7751639],[108.4160889,47.7727556],[108.3984806,47.7665278],
  [108.3990389,47.7655056],[108.3993806,47.7648],[108.3998083,47.7637139],
  [108.3999167,47.7630556],[108.4001972,47.7612083],[108.4003444,47.7599972],
  [108.4004806,47.7578806],[108.4005,47.7545167],[108.4004722,47.7522903],
  [108.4004167,47.7498861],[108.4003389,47.748475],[108.3998,47.7451028],
  [108.3992139,47.7429167],[108.3988889,47.7415472],[108.3976611,47.7370944],
  [108.3971861,47.7362306],[108.3969056,47.7296389],[108.3967833,47.72675],
  [108.3957611,47.7198611],[108.3946444,47.6862806]
];

// ── Geo helpers ───────────────────────────────────────────────────────────────
const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

function ptInPoly(lon, lat) {
  let inside = false;
  for (let i = 0, j = FENCE.length - 1; i < FENCE.length; j = i++) {
    const [xi, yi] = FENCE[i], [xj, yj] = FENCE[j];
    if (((yi > lat) !== (yj > lat)) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}

function bearingTo(fromLon, fromLat, toLon, toLat) {
  const dL = (toLon - fromLon) * D2R;
  const y  = Math.sin(dL) * Math.cos(toLat * D2R);
  const x  = Math.cos(fromLat * D2R) * Math.sin(toLat * D2R)
           - Math.sin(fromLat * D2R) * Math.cos(toLat * D2R) * Math.cos(dL);
  return (Math.atan2(y, x) * R2D + 360) % 360;
}

function movePoint(lon, lat, meters, bear) {
  const d    = meters / 6371000;
  const b    = bear * D2R;
  const lat1 = lat * D2R, lon1 = lon * D2R;
  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(b));
  const lon2 = lon1 + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(lat1), Math.cos(d) - Math.sin(lat1) * Math.sin(lat2));
  return [lon2 * R2D, lat2 * R2D];
}

function rand(min, max) { return min + Math.random() * (max - min); }

// ── Geo distance helper (metres) ───────────────────────────────────────────────
function distM(aLon, aLat, bLon, bLat) {
  const dx = (aLon - bLon) * Math.cos(((aLat + bLat) / 2) * D2R) * 111_320;
  const dy = (aLat - bLat) * 111_320;
  return Math.sqrt(dx * dx + dy * dy);
}

// ── Build path ────────────────────────────────────────────────────────────────
// Natural grazing walk. The cow meanders around its home range with frequent
// grazing clusters (tight knots of jittered fixes), makes one curious excursion
// toward the fence — where the collar fires and it turns back — then ambles home.
// Heading carries momentum and drifts gradually, so the track wanders in BOTH
// latitude and longitude instead of tracing a straight east–west line.
function buildPath() {
  const path = [];

  // Home range centre — open pasture ~600 m west of the fence, clear of the
  // 500 m alert band, so the cow rests "safe" and only enters the band during
  // its periodic curious runs at the boundary.
  const HOME_LON = 108.268, HOME_LAT = 47.748;
  const RANGE_M  = 120;            // tight home range so resting stays clear
  const TARGET   = 1200;           // total fixes to emit (~40 min at 2 s each)
  const EXCURSION_GAP = 170;       // fixes between fence runs (~6 min apart)

  let lon = HOME_LON, lat = HOME_LAT;
  let heading = rand(0, 360);      // travel direction, with momentum
  let speed   = WALK_SPEED_MS;
  let phase   = "graze";           // graze | roam | excursion | flee
  let stepsInPhase = 0;
  let lastExcursion = 30 - EXCURSION_GAP;  // first fence run after ~30 fixes
  let wrapping = false;

  while (true) {
    const fromHome = distM(lon, lat, HOME_LON, HOME_LAT);
    stepsInPhase++;

    // Once enough fixes are emitted, amble straight home so the lap ends at the
    // home point — the next lap then continues from there with no teleport.
    if (!wrapping && path.length >= TARGET) wrapping = true;
    if (wrapping) {
      if (fromHome < 30) break;
      const homeBear = bearingTo(lon, lat, HOME_LON, HOME_LAT);
      heading = (homeBear + rand(-10, 10) + 360) % 360;
      speed = Math.max(0.5, Math.min(MAX_SPEED_MS, speed + rand(-0.08, 0.1)));
      [lon, lat] = movePoint(lon, lat, speed * (UPDATE_INTERVAL_MS / 1000), heading);
      path.push({ lon, lat, speed: speed * 3.6, phase: "roam" });
      continue;
    }

    // ── GRAZE: stand and graze, emitting a tight cluster of jittered fixes ───
    if (phase === "graze") {
      const grazeFixes = Math.floor(rand(4, 12));
      for (let g = 0; g < grazeFixes && path.length < TARGET; g++) {
        const jLon = lon + rand(-1.5, 1.5) / (111_320 * Math.cos(lat * D2R));
        const jLat = lat + rand(-1.5, 1.5) / 111_320;
        path.push({ lon: jLon, lat: jLat, speed: rand(0, 0.3), phase: "grazing" });
      }
      // When the cooldown has elapsed and the cow is back near home, make
      // another curious run at the fence; otherwise just roam and graze.
      const wantExcursion =
        (path.length - lastExcursion) >= EXCURSION_GAP && fromHome < RANGE_M;
      phase = wantExcursion ? "excursion" : "roam";
      heading = (heading + rand(-60, 60) + 360) % 360;
      stepsInPhase = 0;
      continue;
    }

    // ── ROAM: amble within the home range, heading drifting gradually ────────
    if (phase === "roam") {
      heading = (heading + rand(-22, 22) + 360) % 360;
      if (fromHome > RANGE_M) {                       // soft pull back near the edge
        const homeBear = bearingTo(lon, lat, HOME_LON, HOME_LAT);
        heading = (heading * 0.5 + homeBear * 0.5 + rand(-15, 15) + 360) % 360;
      }
      speed = Math.max(0.4, Math.min(MAX_SPEED_MS, speed + rand(-0.1, 0.1)));
      const step = speed * (UPDATE_INTERVAL_MS / 1000);
      [lon, lat] = movePoint(lon, lat, step, heading);
      path.push({ lon, lat, speed: speed * 3.6, phase: "roam" });

      if (Math.random() < 0.22) { phase = "graze"; stepsInPhase = 0; }  // stop to graze often
      continue;
    }

    // ── EXCURSION: curious wander toward the fence (still meandering) ─────────
    if (phase === "excursion") {
      const goalBear = bearingTo(lon, lat, 108.282, 47.746);
      heading = (heading * 0.55 + goalBear * 0.4 + rand(-16, 16) + 360) % 360;
      speed = Math.max(1.2, Math.min(EXC_SPEED_MS, speed + rand(-0.1, 0.25)));
      const step = speed * (UPDATE_INTERVAL_MS / 1000);
      const [nLon, nLat] = movePoint(lon, lat, step, heading);

      // The instant the next step would cross into the zone → collar fires
      if (ptInPoly(nLon, nLat)) {
        for (let k = 0; k < 3; k++) path.push({ lon, lat, speed: 0, phase: "collar_alert" });
        lastExcursion = path.length;     // reset cooldown for the next run
        phase = "flee";
        heading = (bearingTo(lon, lat, HOME_LON, HOME_LAT) + rand(-25, 25) + 360) % 360;
        stepsInPhase = 0;
        continue;
      }

      lon = nLon; lat = nLat;
      path.push({ lon, lat, speed: speed * 3.6, phase: "approach" });

      // Safety only: if the boundary is somehow never reached, fall back to grazing.
      if (stepsInPhase > 400) { phase = "graze"; stepsInPhase = 0; }
      continue;
    }

    // ── FLEE: spooked amble home — brisker, fewer pauses, still meandering ────
    if (phase === "flee") {
      const homeBear = bearingTo(lon, lat, HOME_LON, HOME_LAT);
      heading = (heading * 0.55 + homeBear * 0.45 + rand(-15, 15) + 360) % 360;
      speed = Math.max(WALK_SPEED_MS, Math.min(FLEE_SPEED_MS, speed + rand(-0.05, 0.1)));
      const step = speed * (UPDATE_INTERVAL_MS / 1000);
      [lon, lat] = movePoint(lon, lat, step, heading);
      path.push({ lon, lat, speed: speed * 3.6, phase: "flee" });

      if (fromHome < 120) { phase = "graze"; stepsInPhase = 0; }  // settled back home
      continue;
    }
  }

  return path;
}

// ── Send to Traccar ───────────────────────────────────────────────────────────
function sendPosition({ lon, lat, speed }) {
  const params = new URLSearchParams({
    id:        COW_DEVICE_ID,
    lat:       lat.toFixed(7),
    lon:       lon.toFixed(7),
    speed:     speed.toFixed(1),
    altitude:  1100,
    accuracy:  6,
    timestamp: Math.floor(Date.now() / 1000),
  });
  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: TRACCAR_HOST, port: TRACCAR_PORT, path: `/?${params}`, method: "GET" },
      (res) => { res.resume(); resolve(res.statusCode); }
    );
    req.on("error", reject);
    req.end();
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────
// Runs forever: the cow grazes, makes periodic curious runs at the fence (collar
// fires, it turns back), then ambles home — over and over — so anyone trying the
// demo keeps getting live proximity alerts. Each lap ends at the home point, so
// laps stitch together seamlessly. A Traccar blip retries instead of exiting.
async function simulate() {
  console.log("\n🐄  COW001 continuous grazing simulation — Baganuur geofence");
  console.log(`    Traccar : http://${TRACCAR_HOST}:${TRACCAR_PORT}`);
  console.log(`    Mode    : looping forever (Ctrl+C to stop)\n`);

  for (let lap = 1; ; lap++) {
    const path = buildPath();
    const collars = path.filter(p => p.phase === "collar_alert").length / 3;
    console.log(`\n  ── lap ${lap}: ${path.length} fixes, ~${Math.round(collars)} fence run(s) ──`);

    for (let i = 0; i < path.length; i++) {
      const pos = path[i];
      try {
        await sendPosition(pos);
      } catch {
        console.error(`\n  ⚠️  Traccar unreachable on ${TRACCAR_HOST}:${TRACCAR_PORT} — retrying in 5s…`);
        await new Promise(r => setTimeout(r, 5000));
        i--;            // retry the same fix, keep the loop alive
        continue;
      }

      const tag =
        pos.phase === "collar_alert" ? "🔔 COLLAR FIRED — turning back" :
        pos.phase === "flee"         ? "↩️  heading home              " :
        pos.phase === "grazing"      ? "🌿 grazing                    " :
                                       "🟢 approaching                ";

      process.stdout.write(
        `\r  lap ${lap} [${String(Math.round((i / path.length) * 100)).padStart(3)}%]  ${tag}  ${pos.lat.toFixed(6)}, ${pos.lon.toFixed(6)}  ${pos.speed.toFixed(1)} km/h  `
      );

      await new Promise(r => setTimeout(r, UPDATE_INTERVAL_MS));
    }
  }
}

simulate();
