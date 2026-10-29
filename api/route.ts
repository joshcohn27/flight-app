import type { Airport, Route } from '../src/types'

const TIMEOUT_MS = 4000
const CALLSIGN_PATTERN = /^[A-Z0-9]{2,8}$/

// routes barely change, so let vercel hold them for a few hours
const ROUTE_CACHE = 'public, s-maxage=10800, stale-while-revalidate=86400'
const NO_CACHE = 'no-store'

type RawAirport = {
  name?: unknown
  municipality?: unknown
  iata_code?: unknown
  latitude?: unknown
  longitude?: unknown
}

type RouteResponse = {
  response?: {
    flightroute?: {
      airline?: { name?: unknown } | null
      origin?: RawAirport
      destination?: RawAirport
    }
  }
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

function toAirport(raw: RawAirport | undefined): Airport | null {
  if (!raw) {
    return null
  }
  const city = readText(raw.municipality) ?? readText(raw.name)
  if (city === null) {
    return null
  }
  return {
    city,
    name: readText(raw.name),
    iata: readText(raw.iata_code),
    lat: readNumber(raw.latitude),
    lon: readNumber(raw.longitude),
  }
}

function json(body: unknown, status: number, cacheControl: string): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      'cache-control': cacheControl,
    },
  })
}

export async function GET(request: Request): Promise<Response> {
  const params = new URL(request.url).searchParams
  const callsign = (params.get('callsign') ?? '').trim().toUpperCase()
  if (!CALLSIGN_PATTERN.test(callsign)) {
    return json({ error: 'a valid callsign is required' }, 400, NO_CACHE)
  }

  let response: Response
  try {
    const url = `https://api.adsbdb.com/v0/callsign/${callsign}`
    response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
  } catch {
    return json({ error: 'route data is unavailable' }, 502, NO_CACHE)
  }

  // 404 just means adsbdb doesn't know this callsign
  if (response.status === 404) {
    return json(null, 200, ROUTE_CACHE)
  }
  if (!response.ok) {
    return json({ error: 'route data is unavailable' }, 502, NO_CACHE)
  }

  const data = (await response.json()) as RouteResponse | null
  const flightroute = data?.response?.flightroute
  if (!flightroute) {
    return json(null, 200, ROUTE_CACHE)
  }

  const origin = toAirport(flightroute.origin)
  const destination = toAirport(flightroute.destination)
  if (origin === null || destination === null) {
    return json(null, 200, ROUTE_CACHE)
  }

  const route: Route = {
    airline: readText(flightroute.airline?.name),
    origin,
    destination,
  }
  return json(route, 200, ROUTE_CACHE)
}
