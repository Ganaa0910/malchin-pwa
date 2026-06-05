/**
 * Deterministic seed generator for Малчин mock data.
 *
 *   node scripts/gen-seed.mjs
 *
 * Produces:
 *   src/data/owner.json     — single herder profile
 *   src/data/herds.json     — 3 logical herd groupings
 *   src/data/zones.json     — 4 geofence polygons
 *   src/data/animals.json   — 248 animals (60/25/10/5 хонь/ямаа/үхэр/морь)
 *   src/data/devices.json   — collar/ear-tag devices + 1 base station
 *   src/data/alerts.json    — mixed priority alerts (breach, battery, etc.)
 *   src/data/weather.json   — 7-day forecast + dzud risk
 *
 * Uses a fixed-seed PRNG so re-running produces identical data.
 */

import { writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const OUT = resolve("src/data");
await mkdir(OUT, { recursive: true });

// ── Seeded PRNG (mulberry32) ────────────────────────────────────────
let _state = 0x4d_61_6c_63;
function rand() {
  _state |= 0;
  _state = (_state + 0x6d_2b_79_f5) | 0;
  let t = Math.imul(_state ^ (_state >>> 15), 1 | _state);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
}
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const between = (min, max) => min + rand() * (max - min);
const intBetween = (min, max) => Math.floor(between(min, max + 1));
const roundTo = (n, d) => Number(n.toFixed(d));
const chance = (p) => rand() < p;

// ── Setting ─────────────────────────────────────────────────────────
const OWNER = {
  id: "owner-1",
  name: "Батсайхан Дорж",
  phone: "+976 9911-4488",
  aimag: "Хэнтий",
  sum: "Хэрлэн",
  bagh: "3-р баг",
  baseLat: 48.05,
  baseLng: 109.65,
  baseName: "Цэнхэр бэлчээр",
};

const NOW = new Date("2026-05-28T08:00:00+08:00");
const isoMinutesAgo = (m) =>
  new Date(NOW.getTime() - m * 60_000).toISOString();
const isoDaysAhead = (d) =>
  new Date(NOW.getTime() + d * 86_400_000).toISOString();

// ── Name pools ──────────────────────────────────────────────────────
const HORSE_NAMES = [
  "Хүрэн", "Хээр", "Бор", "Шар", "Хар", "Алаг", "Цагаан", "Хонгор",
  "Хөх", "Шарга", "Бууралд", "Жонон", "Жанжин", "Тулга", "Алтай",
  "Зэв", "Майчин", "Балдан", "Хайрхан", "Сэрхэлэн",
];
const SHEEP_NAMES = [
  "Мангалай", "Цоохор", "Хонгор", "Сахалт", "Шурх", "Цагаан хошуу",
  "Хар толгойт", "Бөгсний", "Эвэртэй", "Хагдар",
];
const GOAT_NAMES = [
  "Хошой", "Эвэр", "Сахалт", "Цоохор", "Хөнөг",
];
const COW_NAMES = [
  "Ялам", "Хошой", "Дэгдэх", "Сүүт", "Хөв", "Цоохор", "Шарага",
];
const HORSE_BREEDS = ["Монгол адуу", "Хэнтийн адуу", "Тахь"];
const SHEEP_BREEDS = [
  "Монгол хонь", "Хальхын хонь", "Дөрвөдийн хонь", "Орхон хонь",
];
const GOAT_BREEDS = [
  "Монгол ямаа", "Гоби ямаа", "Хан хөхийн ямаа",
];
const COW_BREEDS = ["Монгол үхэр", "Барууны үхэр"];

const COLORS_BASE = [
  "Хүрэн", "Хээр", "Бор", "Шар", "Хар", "Алаг", "Цагаан", "Хөх", "Бууралд",
];

// ── Geo helpers ─────────────────────────────────────────────────────
function offsetLatLng(lat, lng, distM, bearingDeg) {
  const R = 6_371_000;
  const br = (bearingDeg * Math.PI) / 180;
  const dr = distM / R;
  const φ1 = (lat * Math.PI) / 180;
  const λ1 = (lng * Math.PI) / 180;
  const φ2 = Math.asin(
    Math.sin(φ1) * Math.cos(dr) +
      Math.cos(φ1) * Math.sin(dr) * Math.cos(br),
  );
  const λ2 =
    λ1 +
    Math.atan2(
      Math.sin(br) * Math.sin(dr) * Math.cos(φ1),
      Math.cos(dr) - Math.sin(φ1) * Math.sin(φ2),
    );
  return [(φ2 * 180) / Math.PI, (λ2 * 180) / Math.PI];
}
function haversineM(lat1, lng1, lat2, lng2) {
  const R = 6_371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// ── Zones ───────────────────────────────────────────────────────────
function circlePoly(centerLat, centerLng, radiusM, points = 16) {
  const out = [];
  for (let i = 0; i < points; i++) {
    const bearing = (i / points) * 360;
    const r = radiusM * (0.85 + rand() * 0.3); // irregular border
    out.push(offsetLatLng(centerLat, centerLng, r, bearing));
  }
  return out;
}

const ZONES = [
  {
    id: "zone-main",
    name: "Үндсэн бэлчээр",
    type: "pasture",
    coordinates: circlePoly(OWNER.baseLat, OWNER.baseLng, 3500),
    color: "#1D9E75",
    bufferM: 300,
    deterM: 80,
    active: true,
  },
  {
    id: "zone-winter",
    name: "Өвөлжөө",
    type: "camp",
    coordinates: circlePoly(
      ...offsetLatLng(OWNER.baseLat, OWNER.baseLng, 2200, 200),
      900,
      12,
    ),
    color: "#D98A3D",
    bufferM: 150,
    deterM: 40,
    active: true,
  },
  {
    id: "zone-spring",
    name: "Хаваржаа",
    type: "camp",
    coordinates: circlePoly(
      ...offsetLatLng(OWNER.baseLat, OWNER.baseLng, 4500, 70),
      1100,
      12,
    ),
    color: "#9BE564",
    bufferM: 150,
    deterM: 40,
    active: true,
  },
  {
    id: "zone-hayfield",
    name: "Хадлангийн талбай",
    type: "forbidden",
    coordinates: circlePoly(
      ...offsetLatLng(OWNER.baseLat, OWNER.baseLng, 3200, 290),
      600,
      10,
    ),
    color: "#e54d4d",
    bufferM: 100,
    deterM: 30,
    active: true,
  },
];

// ── Herds ───────────────────────────────────────────────────────────
const HERDS = [
  { id: "herd-sheep", ownerId: OWNER.id, name: "Хонин сүрэг", species: "хонь", count: 0 },
  { id: "herd-goat",  ownerId: OWNER.id, name: "Ямаан сүрэг", species: "ямаа", count: 0 },
  { id: "herd-cow",   ownerId: OWNER.id, name: "Үхрийн сүрэг", species: "үхэр", count: 0 },
  { id: "herd-horse", ownerId: OWNER.id, name: "Адууны сүрэг", species: "морь", count: 0 },
];
const herdBySpecies = Object.fromEntries(HERDS.map((h) => [h.species, h.id]));

// ── Animals ─────────────────────────────────────────────────────────
const SPECIES_DIST = [
  { sp: "хонь", n: 149, names: SHEEP_NAMES, breeds: SHEEP_BREEDS, wMin: 40, wMax: 80, ageMax: 8, namingRate: 0.15 },
  { sp: "ямаа", n: 62,  names: GOAT_NAMES,  breeds: GOAT_BREEDS,  wMin: 25, wMax: 50, ageMax: 8, namingRate: 0.18 },
  { sp: "үхэр", n: 25,  names: COW_NAMES,   breeds: COW_BREEDS,   wMin: 250, wMax: 500, ageMax: 15, namingRate: 0.6 },
  { sp: "морь", n: 12,  names: HORSE_NAMES, breeds: HORSE_BREEDS, wMin: 350, wMax: 500, ageMax: 20, namingRate: 1.0 },
];

const ANIMALS = [];
let idCounter = 1;
for (const block of SPECIES_DIST) {
  HERDS.find((h) => h.species === block.sp).count = block.n;
  for (let i = 0; i < block.n; i++) {
    const id = `A-${String(idCounter).padStart(3, "0")}`;
    idCounter++;
    const name = chance(block.namingRate) ? pick(block.names) : null;

    // Spatial distribution: most clustered in main zone, some scattered.
    // Horses range widest (5km), then cattle (3km), goats (2.5km), sheep (2km).
    const radiusBySpecies = {
      хонь: 2000,
      ямаа: 2500,
      үхэр: 3000,
      морь: 5000,
    }[block.sp];
    const bearing = rand() * 360;
    const r = Math.pow(rand(), 0.55) * radiusBySpecies;
    const [lat, lng] = offsetLatLng(OWNER.baseLat, OWNER.baseLng, r, bearing);

    // Status mix: 85% safe, 10% warning, 3% danger, 2% offline
    const roll = rand();
    let status, proximity;
    if (roll < 0.85) {
      status = "safe";
      proximity = "SAFE";
    } else if (roll < 0.95) {
      status = "warning";
      proximity = "WARNING";
    } else if (roll < 0.98) {
      status = "danger";
      proximity = "DETER";
    } else {
      status = "offline";
      proximity = "SAFE";
    }

    // Speed: usually 0-2 km/h (grazing), occasionally higher
    const speedKmh =
      status === "offline" ? 0 : chance(0.85) ? roundTo(rand() * 2, 1) : roundTo(rand() * 12, 1);

    // Health flags — sparse
    const healthFlags = [];
    if (chance(0.04)) healthFlags.push("pregnant");
    if (chance(0.02) && block.ageMax <= 8) healthFlags.push("newborn");
    if (chance(0.015)) healthFlags.push("lame");
    if (chance(0.01)) healthFlags.push("sick");
    if (chance(0.005)) healthFlags.push("wounded");

    // Most animals have a device, ~12% don't
    const hasDevice = chance(0.88);
    const deviceId = hasDevice
      ? `D-${String(idCounter - 1).padStart(3, "0")}`
      : null;

    const minutesSinceSeen =
      status === "offline"
        ? intBetween(60, 720)
        : intBetween(0, 12);

    ANIMALS.push({
      id,
      tag: `MGN-${String(idCounter - 1).padStart(4, "0")}`,
      name,
      species: block.sp,
      breed: pick(block.breeds),
      age: intBetween(1, block.ageMax),
      sex: chance(0.55) ? "female" : "male",
      weightKg: roundTo(between(block.wMin, block.wMax), 1),
      color: pick(COLORS_BASE),
      ownerId: OWNER.id,
      herdId: herdBySpecies[block.sp],
      deviceId,
      lat: roundTo(lat, 6),
      lng: roundTo(lng, 6),
      altitudeM: intBetween(1100, 1450),
      lastSeenAt: isoMinutesAgo(minutesSinceSeen),
      status,
      proximity,
      speedKmh,
      distanceFromBaseM: Math.round(
        haversineM(OWNER.baseLat, OWNER.baseLng, lat, lng),
      ),
      healthFlags,
    });
  }
}

// ── Devices ─────────────────────────────────────────────────────────
const DEVICES = [];
for (const a of ANIMALS) {
  if (!a.deviceId) continue;
  // Battery distribution skewed toward 30-90%, ~5% under 15% to trigger alerts
  let battery;
  const r = rand();
  if (r < 0.05) battery = intBetween(3, 14);
  else if (r < 0.2) battery = intBetween(15, 30);
  else if (r < 0.7) battery = intBetween(30, 70);
  else battery = intBetween(70, 100);

  const offlineFlag = a.status === "offline";
  DEVICES.push({
    id: a.deviceId,
    serial: `MGN-COLLAR-2025-${a.deviceId.slice(2)}`,
    type: "collar",
    animalId: a.id,
    battery,
    signal: offlineFlag ? 0 : intBetween(40, 100),
    firmwareVersion: pick(["1.4.2", "1.4.3", "1.5.0", "1.5.1"]),
    lastPingAt: a.lastSeenAt,
    online: !offlineFlag,
  });
}
// One base station
DEVICES.push({
  id: "BS-001",
  serial: "MGN-BASE-2024-0001",
  type: "base-station",
  animalId: null,
  battery: 100,
  signal: 95,
  firmwareVersion: "2.1.0",
  lastPingAt: isoMinutesAgo(1),
  online: true,
});

// ── Alerts ──────────────────────────────────────────────────────────
const ALERTS = [];

// Critical: animals currently in DETER or status=danger
const breachAnimals = ANIMALS.filter((a) => a.proximity === "DETER").slice(0, 5);
breachAnimals.forEach((a, i) => {
  ALERTS.push({
    id: `AL-${String(i + 1).padStart(3, "0")}`,
    type: "breach",
    priority: "critical",
    title: `${a.name ?? a.id} бэлчээр давсан`,
    message: `${a.species} ${a.id} бэлчээрээс ${Math.round(
      a.distanceFromBaseM,
    )} м-ийн зайд. Эргүүлэх хэрэгтэй.`,
    animalId: a.id,
    deviceId: a.deviceId,
    zoneId: "zone-main",
    createdAt: isoMinutesAgo(intBetween(2, 30)),
    resolvedAt: null,
    acknowledged: false,
    lat: a.lat,
    lng: a.lng,
  });
});

// High: low battery devices
const lowBatt = DEVICES.filter((d) => d.battery < 15 && d.type === "collar").slice(0, 4);
lowBatt.forEach((d, i) => {
  const a = ANIMALS.find((x) => x.id === d.animalId);
  ALERTS.push({
    id: `AL-${String(ALERTS.length + 1).padStart(3, "0")}`,
    type: "low-battery",
    priority: "high",
    title: `${d.id} батарей ${d.battery}%`,
    message: `${a?.species ?? "Мал"} ${a?.id ?? ""}-ийн GPS-ийн цэнэг ${d.battery}% болсон. Цэнэглэе.`,
    animalId: a?.id ?? null,
    deviceId: d.id,
    zoneId: null,
    createdAt: isoMinutesAgo(intBetween(10, 240)),
    resolvedAt: null,
    acknowledged: i > 1,
    lat: a?.lat,
    lng: a?.lng,
  });
});

// Predator proximity (synthetic)
ALERTS.push({
  id: `AL-${String(ALERTS.length + 1).padStart(3, "0")}`,
  type: "predator",
  priority: "critical",
  title: "Чоно ойртсон",
  message:
    "Сүргийн хойд талд (1.2 км) сэжигтэй хөдөлгөөн. Магадгүй чоно.",
  animalId: null,
  deviceId: null,
  zoneId: "zone-main",
  createdAt: isoMinutesAgo(8),
  resolvedAt: null,
  acknowledged: false,
  lat: OWNER.baseLat + 0.012,
  lng: OWNER.baseLng - 0.004,
});

// Missing animal
const offlineAnimals = ANIMALS.filter((a) => a.status === "offline").slice(0, 2);
offlineAnimals.forEach((a) => {
  ALERTS.push({
    id: `AL-${String(ALERTS.length + 1).padStart(3, "0")}`,
    type: "missing",
    priority: "high",
    title: `${a.name ?? a.id} холбоогүй`,
    message: `${a.species} ${a.id}-ийн GPS дохио ${Math.round(
      (new Date(NOW).getTime() - new Date(a.lastSeenAt).getTime()) / 60_000,
    )} мин өмнө тасарсан.`,
    animalId: a.id,
    deviceId: a.deviceId,
    zoneId: null,
    createdAt: isoMinutesAgo(intBetween(30, 300)),
    resolvedAt: null,
    acknowledged: false,
    lat: a.lat,
    lng: a.lng,
  });
});

// Base station lost (resolved earlier today)
ALERTS.push({
  id: `AL-${String(ALERTS.length + 1).padStart(3, "0")}`,
  type: "base-station",
  priority: "medium",
  title: "Гол станц богино хугацаанд тасарсан",
  message: "BS-001 станц 6 минут офлайн байв. Одоо хэвийн.",
  animalId: null,
  deviceId: "BS-001",
  zoneId: null,
  createdAt: isoMinutesAgo(180),
  resolvedAt: isoMinutesAgo(173),
  acknowledged: true,
});

// Weather warning
ALERTS.push({
  id: `AL-${String(ALERTS.length + 1).padStart(3, "0")}`,
  type: "weather",
  priority: "medium",
  title: "Цас орно",
  message:
    "Маргааш орой 15–20 см цас орох төлөвтэй. Зуданд бэлдье.",
  animalId: null,
  deviceId: null,
  zoneId: null,
  createdAt: isoMinutesAgo(45),
  resolvedAt: null,
  acknowledged: false,
});

// Health alert
const lameAnimal = ANIMALS.find((a) => a.healthFlags.includes("lame"));
if (lameAnimal) {
  ALERTS.push({
    id: `AL-${String(ALERTS.length + 1).padStart(3, "0")}`,
    type: "health",
    priority: "low",
    title: `${lameAnimal.id} доголж байна`,
    message:
      "GPS-ийн дагуу хөдөлгөөн удааширсан. Биеийг нь шалгая.",
    animalId: lameAnimal.id,
    deviceId: lameAnimal.deviceId,
    zoneId: null,
    createdAt: isoMinutesAgo(intBetween(60, 600)),
    resolvedAt: null,
    acknowledged: chance(0.5),
    lat: lameAnimal.lat,
    lng: lameAnimal.lng,
  });
}

// ── Weather ─────────────────────────────────────────────────────────
const FORECAST = [];
const conditionsCycle = ["sunny", "cloudy", "windy", "snow", "cloudy", "sunny", "rain"];
for (let i = 0; i < 7; i++) {
  const c = conditionsCycle[i];
  FORECAST.push({
    date: isoDaysAhead(i).slice(0, 10),
    tempMaxC: roundTo(between(8, 18) - i * 0.5, 1),
    tempMinC: roundTo(between(-6, 2) - i * 0.5, 1),
    conditions: c,
    windKmh: roundTo(between(5, 25), 1),
    precipMm: c === "rain" ? roundTo(between(2, 12), 1) : 0,
    snowCm: c === "snow" ? roundTo(between(8, 22), 1) : 0,
  });
}

const WEATHER = {
  locationName: "Хэнтий, Хэрлэн",
  lat: OWNER.baseLat,
  lng: OWNER.baseLng,
  currentTempC: 9.4,
  currentConditions: "cloudy",
  dzudRisk: "elevated",
  dzudFactors: [
    "Маргаашийн цас 15-20см",
    "Шөнийн хүйтэн -8°C хүртэл",
    "Хадлан хомс — 60% хүрэлцэхгүй",
  ],
  forecast: FORECAST,
  updatedAt: isoMinutesAgo(15),
};

// ── Write ───────────────────────────────────────────────────────────
async function dump(name, data) {
  await writeFile(
    resolve(OUT, `${name}.json`),
    JSON.stringify(data, null, 2),
    "utf-8",
  );
}
await dump("owner", OWNER);
await dump("herds", HERDS);
await dump("zones", ZONES);
await dump("animals", ANIMALS);
await dump("devices", DEVICES);
await dump("alerts", ALERTS);
await dump("weather", WEATHER);

console.log(
  `seeded: 1 owner, ${HERDS.length} herds, ${ZONES.length} zones, ` +
    `${ANIMALS.length} animals, ${DEVICES.length} devices, ` +
    `${ALERTS.length} alerts, 1 weather`,
);
