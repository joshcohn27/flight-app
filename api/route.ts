import type { Airport, Route } from '../src/types'

const TIMEOUT_MS = 4000
const CALLSIGN_PATTERN = /^[A-Z0-9]{2,8}$/

const AEROAPI_FLIGHTS_URL = 'https://aeroapi.flightaware.com/aeroapi/flights'

// stored routes barely change, so let vercel hold them for a few hours
const ROUTE_CACHE = 'public, s-maxage=10800, stale-while-revalidate=86400'

// flightaware gives today's real flight, but the same number flies another leg later,
// so only hold those for half an hour
const LIVE_ROUTE_CACHE = 'public, s-maxage=1800'

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

type AeroAirport = {
  name?: unknown
  city?: unknown
  code_iata?: unknown
}

type AeroFlight = {
  origin?: AeroAirport | null
  destination?: AeroAirport | null
  actual_off?: unknown
  actual_on?: unknown
}

type AeroResponse = {
  flights?: unknown
}

type Legs = {
  origin: Airport
  destination: Airport
}

// answered means adsbdb replied, even if it had no route for this callsign
type StoredLookup =
  | { answered: true; route: Route | null }
  | { answered: false }

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

function toAeroAirport(raw: AeroAirport | null | undefined): Airport | null {
  if (!raw) {
    return null
  }
  const city = readText(raw.city) ?? readText(raw.name)
  if (city === null) {
    return null
  }
  // flightaware doesn't send coordinates here, and its routes don't need the position check
  return {
    city,
    name: readText(raw.name),
    iata: readText(raw.code_iata),
    lat: null,
    lon: null,
  }
}

// the one that has taken off and hasn't landed yet
function airborneFlight(flights: AeroFlight[]): AeroFlight | null {
  for (const flight of flights) {
    if (readText(flight.actual_off) === null) {
      continue
    }
    if (readText(flight.actual_on) !== null) {
      continue
    }
    return flight
  }
  return null
}

// today's real route from flightaware. null without an api key, on any error,
// or when the flight isn't in the air, and then the stored route is used instead
async function fetchLiveLegs(callsign: string): Promise<Legs | null> {
  const apiKey = process.env.FLIGHTAWARE_API_KEY
  if (!apiKey) {
    return null
  }

  try {
    const url = `${AEROAPI_FLIGHTS_URL}/${callsign}?ident_type=designator&max_pages=1`
    const response = await fetch(url, {
      headers: { 'x-apikey': apiKey },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (!response.ok) {
      return null
    }

    const data = (await response.json()) as AeroResponse | null
    if (!Array.isArray(data?.flights)) {
      return null
    }
    const flight = airborneFlight(data.flights as AeroFlight[])
    if (flight === null) {
      return null
    }

    const origin = toAeroAirport(flight.origin)
    const destination = toAeroAirport(flight.destination)
    if (origin === null || destination === null) {
      return null
    }
    return { origin, destination }
  } catch {
    return null
  }
}

// adsbdb's stored route, which also has the airline name
async function fetchStoredRoute(callsign: string): Promise<StoredLookup> {
  let response: Response
  try {
    const url = `https://api.adsbdb.com/v0/callsign/${callsign}`
    response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
  } catch {
    return { answered: false }
  }

  // 404 just means adsbdb doesn't know this callsign
  if (response.status === 404) {
    return { answered: true, route: null }
  }
  if (!response.ok) {
    return { answered: false }
  }

  const data = (await response.json()) as RouteResponse | null
  const flightroute = data?.response?.flightroute
  if (!flightroute) {
    return { answered: true, route: null }
  }

  const origin = toAirport(flightroute.origin)
  const destination = toAirport(flightroute.destination)
  if (origin === null || destination === null) {
    return { answered: true, route: null }
  }

  const route: Route = {
    airline: readText(flightroute.airline?.name),
    origin,
    destination,
  }
  return { answered: true, route }
}

export async function GET(request: Request): Promise<Response> {
  const params = new URL(request.url).searchParams
  const callsign = (params.get('callsign') ?? '').trim().toUpperCase()
  if (!CALLSIGN_PATTERN.test(callsign)) {
    return json({ error: 'a valid callsign is required' }, 400, NO_CACHE)
  }

  const [stored, live] = await Promise.all([fetchStoredRoute(callsign), fetchLiveLegs(callsign)])

  if (live !== null) {
    let airline = null
    if (stored.answered && stored.route !== null) {
      airline = stored.route.airline
    }
    const route: Route = {
      airline,
      origin: live.origin,
      destination: live.destination,
    }
    return json(route, 200, LIVE_ROUTE_CACHE)
  }

  if (!stored.answered) {
    return json({ error: 'route data is unavailable' }, 502, NO_CACHE)
  }
  return json(stored.route, 200, ROUTE_CACHE)
}
