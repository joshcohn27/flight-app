import { useEffect, useRef, useState } from 'react'
import type { Coords, Plane } from '../types'

const POLL_MS = 5000
const REQUEST_TIMEOUT_MS = 10000

export type PlanesState = {
  planes: Plane[] | null
  lastUpdated: number | null
  failed: boolean
}

async function fetchNearby(coords: Coords): Promise<Plane[]> {
  const params = new URLSearchParams({
    lat: String(coords.lat),
    lon: String(coords.lon),
  })
  const response = await fetch(`/api/nearby?${params}`, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  if (!response.ok) {
    throw new Error(`nearby returned ${response.status}`)
  }
  const data = await response.json()
  return data.planes
}

export function usePlanes(coords: Coords | null): PlanesState {
  const [state, setState] = useState<PlanesState>({
    planes: null,
    lastUpdated: null,
    failed: false,
  })

  // polling reads the latest spot without restarting on every gps update
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
    let inFlight = false
    let timer: number | null = null

    function clearTimer() {
      if (timer !== null) {
        window.clearTimeout(timer)
        timer = null
      }
    }

    function scheduleNext() {
      if (stopped || inFlight || timer !== null) {
        return
      }
      if (document.hidden) {
        return
      }
      timer = window.setTimeout(poll, POLL_MS)
    }

    async function poll() {
      timer = null
      const current = coordsRef.current
      if (current === null) {
        scheduleNext()
        return
      }

      inFlight = true
      try {
        const planes = await fetchNearby(current)
        if (!stopped) {
          setState({ planes, lastUpdated: Date.now(), failed: false })
        }
      } catch {
        if (!stopped) {
          setState((previous) => ({ ...previous, failed: true }))
        }
      }
      inFlight = false
      scheduleNext()
    }

    function onVisibilityChange() {
      clearTimer()
      if (document.hidden) {
        return
      }
      // refresh right away when coming back, unless a request is already going
      if (!inFlight) {
        poll()
      }
    }

    poll()
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      stopped = true
      clearTimer()
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [hasCoords])

  return state
}
