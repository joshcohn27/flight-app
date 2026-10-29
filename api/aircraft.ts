import type { AircraftInfo } from '../src/types'

const TIMEOUT_MS = 4000
const HEX_PATTERN = /^[0-9A-F]{6}$/

// details for one airframe almost never change, so cache them for a day
const AIRCRAFT_CACHE = 'public, s-maxage=86400, stale-while-revalidate=604800'
const NO_CACHE = 'no-store'

type AircraftResponse = {
  response?: {
    aircraft?: {
      manufacturer?: unknown
      type?: unknown
      icao_type?: unknown
      registration?: unknown
      registered_owner?: unknown
      registered_owner_country_name?: unknown
      url_photo?: unknown
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

// only pass along photo links we can show on an https page
function readPhotoUrl(value: unknown): string | null {
  const url = readText(value)
  if (url === null || !url.startsWith('https://')) {
    return null
  }
  return url
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
  const hex = (params.get('hex') ?? '').trim().toUpperCase()
  if (!HEX_PATTERN.test(hex)) {
    return json({ error: 'a valid hex code is required' }, 400, NO_CACHE)
  }

  let response: Response
  try {
    const url = `https://api.adsbdb.com/v0/aircraft/${hex}`
    response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
  } catch {
    return json({ error: 'aircraft data is unavailable' }, 502, NO_CACHE)
  }

  // 404 just means adsbdb doesn't know this airframe
  if (response.status === 404) {
    return json(null, 200, AIRCRAFT_CACHE)
  }
  if (!response.ok) {
    return json({ error: 'aircraft data is unavailable' }, 502, NO_CACHE)
  }

  const data = (await response.json()) as AircraftResponse | null
  const raw = data?.response?.aircraft
  if (!raw) {
    return json(null, 200, AIRCRAFT_CACHE)
  }

  const aircraft: AircraftInfo = {
    manufacturer: readText(raw.manufacturer),
    model: readText(raw.type),
    icaoType: readText(raw.icao_type),
    registration: readText(raw.registration),
    owner: readText(raw.registered_owner),
    country: readText(raw.registered_owner_country_name),
    photoUrl: readPhotoUrl(raw.url_photo),
  }
  return json(aircraft, 200, AIRCRAFT_CACHE)
}
