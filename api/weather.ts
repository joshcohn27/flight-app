import type { Weather } from '../src/types'

const TIMEOUT_MS = 4000

// weather moves slowly, ten minutes is plenty fresh
const WEATHER_CACHE = 'public, s-maxage=600, stale-while-revalidate=1800'
const NO_CACHE = 'no-store'

type ForecastResponse = {
  current?: {
    weather_code?: unknown
    is_day?: unknown
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
  const lat = parseCoordinate(params.get('lat'), 90)
  const lon = parseCoordinate(params.get('lon'), 180)
  if (lat === null || lon === null) {
    return json({ error: 'lat and lon are required' }, 400, NO_CACHE)
  }

  const query = new URLSearchParams({
    latitude: lat.toFixed(2),
    longitude: lon.toFixed(2),
    current: 'weather_code,is_day',
  })

  let response: Response
  try {
    const url = `https://api.open-meteo.com/v1/forecast?${query}`
    response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
  } catch {
    return json({ error: 'weather is unavailable' }, 502, NO_CACHE)
  }
  if (!response.ok) {
    return json({ error: 'weather is unavailable' }, 502, NO_CACHE)
  }

  const data = (await response.json()) as ForecastResponse | null
  const code = data?.current?.weather_code
  if (typeof code !== 'number') {
    return json({ error: 'weather is unavailable' }, 502, NO_CACHE)
  }

  const weather: Weather = {
    code,
    isDay: data?.current?.is_day === 1,
  }
  return json(weather, 200, WEATHER_CACHE)
}
