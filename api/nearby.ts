import type { Plane } from '../src/types'

const RADIUS_NM = 15
const TIMEOUT_MS = 4000

type RawAircraft = {
  hex?: unknown
  flight?: unknown
  r?: unknown
  t?: unknown
  desc?: unknown
  alt_baro?: unknown
  lat?: unknown
  lon?: unknown
  gs?: unknown
  track?: unknown
}

type AircraftResponse = {
  ac?: unknown
}

function readText(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }
  const trimmed = value.trim()
  if (trimmed === '') {
    return null
  }
  return trimmed
}

function readNumber(value: unknown): number | null {
  if (typeof value !== 'number') {
    return null
  }
  if (!Number.isFinite(value)) {
    return null
  }
  return value
}

function readAltitude(value: unknown): number | 'ground' | null {
  if (value === 'ground') {
    return 'ground'
  }
  return readNumber(value)
}

function toPlane(raw: RawAircraft): Plane {
  return {
    hex: readText(raw.hex) ?? '',
    callsign: readText(raw.flight),
    registration: readText(raw.r),
    typeCode: readText(raw.t),
    typeName: readText(raw.desc),
    altitude: readAltitude(raw.alt_baro),
    lat: readNumber(raw.lat),
    lon: readNumber(raw.lon),
    groundSpeed: readNumber(raw.gs),
    track: readNumber(raw.track),
  }
}

function parseCoordinate(text: string | null, limit: number): number | null {
  if (text === null || text.trim() === '') {
    return null
  }
  const value = Number(text)
  if (!Number.isFinite(value)) {
    return null
  }
  if (Math.abs(value) > limit) {
    return null
  }
  return value
}

async function fetchAircraft(url: string): Promise<RawAircraft[]> {
  const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
  if (!response.ok) {
    throw new Error(`upstream returned ${response.status}`)
  }
  const data = (await response.json()) as AircraftResponse | null
  if (!Array.isArray(data?.ac)) {
    throw new Error('upstream sent no aircraft list')
  }
  return data.ac as RawAircraft[]
}

// tries each source in order and returns the first one that works
async function fetchFromAnySource(urls: string[]): Promise<RawAircraft[] | null> {
  for (const url of urls) {
    try {
      return await fetchAircraft(url)
    } catch {
      // move on to the next source
    }
  }
  return null
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
    },
  })
}

export async function GET(request: Request): Promise<Response> {
  const params = new URL(request.url).searchParams
  const lat = parseCoordinate(params.get('lat'), 90)
  const lon = parseCoordinate(params.get('lon'), 180)
  if (lat === null || lon === null) {
    return json({ error: 'lat and lon are required' }, 400)
  }

  const latText = lat.toFixed(4)
  const lonText = lon.toFixed(4)
  const urls = [
    `https://api.adsb.lol/v2/lat/${latText}/lon/${lonText}/dist/${RADIUS_NM}`,
    `https://api.airplanes.live/v2/point/${latText}/${lonText}/${RADIUS_NM}`,
  ]

  const aircraft = await fetchFromAnySource(urls)
  if (aircraft === null) {
    return json({ error: 'flight data is unavailable' }, 502)
  }

  const planes = aircraft.map(toPlane)
  return json({ planes }, 200)
}
