/**
 * Parses Traccar WKT POLYGON strings into Leaflet LatLng arrays.
 * Drop into src/lib/wkt.ts
 */

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Parses WKT geometry into a flat polygon ring of LatLng coordinates.
 * Supported shapes: POLYGON, MULTIPOLYGON, CIRCLE.
 * Traccar stores coordinates as "lat lon" pairs (space-separated).
 */
export function parseWktPolygon(wkt: string): LatLng[] {
  const text = wkt?.trim();
  if (!text) return [];

  const polygonMatch = text.match(/^(?:SRID=\d+;)?POLYGON\s*\(\(([^)]+)\)\)/i);
  if (polygonMatch) {
    return parseWktPoints(polygonMatch[1]);
  }

  const multiMatch = text.match(/^(?:SRID=\d+;)?MULTIPOLYGON\s*\(\(\(([^)]+)\)\)\)/i);
  if (multiMatch) {
    return parseWktPoints(multiMatch[1]);
  }

  const circleMatch = text.match(/^(?:SRID=\d+;)?CIRCLE\s*\(\s*([+-]?\d+(?:\.\d+)?)\s+([+-]?\d+(?:\.\d+)?)\s*,\s*([+-]?\d+(?:\.\d+)?)\s*\)$/i);
  if (circleMatch) {
    const lat = Number(circleMatch[1]);
    const lng = Number(circleMatch[2]);
    const radius = Number(circleMatch[3]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(radius)) {
      return [];
    }
    return approximateCircle(lat, lng, radius, 64);
  }

  return [];
}

function parseWktPoints(data: string): LatLng[] {
  return data
    .trim()
    .split(",")
    .map((pair) => {
      const [lat, lng] = pair.trim().split(/\s+/).map(Number);
      return { lat, lng };
    })
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
}

function approximateCircle(lat: number, lng: number, radiusM: number, segments = 64): LatLng[] {
  const earthRadius = 6371000; // meters
  const centerLat = (lat * Math.PI) / 180;
  const centerLng = (lng * Math.PI) / 180;
  const d = radiusM / earthRadius;

  const coords: LatLng[] = [];
  for (let i = 0; i < segments; i++) {
    const theta = (2 * Math.PI * i) / segments;
    const y = Math.sin(theta) * d;
    const x = Math.cos(theta) * d;
    const latRadians = Math.asin(
      Math.sin(centerLat) * Math.cos(d) + Math.cos(centerLat) * Math.sin(d) * Math.sin(theta),
    );
    const lngRadians =
      centerLng +
      Math.atan2(
        Math.cos(d) * Math.sin(theta),
        Math.cos(centerLat) * Math.sin(d) - Math.sin(centerLat) * Math.cos(d) * Math.cos(theta),
      );
    coords.push({ lat: (latRadians * 180) / Math.PI, lng: (lngRadians * 180) / Math.PI });
  }
  return coords;
}

/** Returns the centroid of a polygon for label placement */
export function polygonCentroid(coords: LatLng[]): LatLng {
  const n = coords.length;
  if (n === 0) return { lat: 0, lng: 0 };
  const sum = coords.reduce((a, c) => ({ lat: a.lat + c.lat, lng: a.lng + c.lng }), { lat: 0, lng: 0 });
  return { lat: sum.lat / n, lng: sum.lng / n };
}
