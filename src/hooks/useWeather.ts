import { useEffect, useRef, useState } from 'react'
import type { Coords, Weather } from '../types'

const REFRESH_MS = 10 * 60 * 1000
const REQUEST_TIMEOUT_MS = 10000

async function fetchWeather(coords: Coords): Promise<Weather> {
  // rounded so nearby requests share vercel's cache
  const params = new URLSearchParams({
    lat: coords.lat.toFixed(2),
    lon: coords.lon.toFixed(2),
  })
  const response = await fetch(`/api/weather?${params}`, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  if (!response.ok) {
    throw new Error(`weather returned ${response.status}`)
  }
  return await response.json()
}

export function useWeather(coords: Coords | null): Weather | null {
  const [weather, setWeather] = useState<Weather | null>(null)

  const coordsRef = useRef(coords)
  useEffect(() => {
    coordsRef.current = coords
  }, [coords])

  const hasCoords = coords !== null

  useEffect(() => {
    if (!hasCoords) {
      return
    }

    let stopped = false
    let lastFetched = 0

    async function refresh() {
      const current = coordsRef.current
      if (current === null || document.hidden) {
        return
      }
      lastFetched = Date.now()
      try {
        const latest = await fetchWeather(current)
        if (!stopped) {
          setWeather(latest)
        }
      } catch {
        // keep showing whatever sky we had
      }
    }

    // after a long time in the background the sky may have changed
    function onVisibilityChange() {
      if (Date.now() - lastFetched >= REFRESH_MS) {
        refresh()
      }
    }

    refresh()
    const intervalId = window.setInterval(refresh, REFRESH_MS)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      stopped = true
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [hasCoords])

  return weather
}
