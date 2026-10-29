import { useEffect, useState } from 'react'
import type { Route } from '../types'

// lives for the whole session so each callsign is only looked up once
const routeCache = new Map<string, Route | null>()
const pending = new Set<string>()

async function fetchRoute(callsign: string): Promise<Route | null> {
  try {
    const params = new URLSearchParams({ callsign })
    const response = await fetch(`/api/route?${params}`)
    if (!response.ok) {
      return null
    }
    return await response.json()
  } catch {
    return null
  }
}

export function getRoute(callsign: string | null): Route | null {
  if (callsign === null) {
    return null
  }
  return routeCache.get(callsign) ?? null
}

export function useRoutes(callsigns: (string | null)[]): void {
  const [, setLoadedCount] = useState(0)

  // a plain string key so the effect only runs when the callsigns change
  const key = callsigns.filter((callsign) => callsign !== null).join(',')

  useEffect(() => {
    if (key === '') {
      return
    }

    for (const callsign of key.split(',')) {
      if (routeCache.has(callsign) || pending.has(callsign)) {
        continue
      }
      pending.add(callsign)
      fetchRoute(callsign).then((route) => {
        routeCache.set(callsign, route)
        pending.delete(callsign)
        setLoadedCount((count) => count + 1)
      })
    }
  }, [key])
}
