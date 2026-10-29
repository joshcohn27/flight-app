import { useEffect, useState } from 'react'
import type { Route } from '../types'

const REQUEST_TIMEOUT_MS = 10000
const RETRY_MS = 60000

// only real answers go in here, so they're kept for the whole session
const routeCache = new Map<string, Route | null>()

// callsigns being looked up now, or waiting out a failed lookup
const pending = new Set<string>()

type RouteLookup =
  | { answered: true; route: Route | null }
  | { answered: false }

async function lookupRoute(callsign: string): Promise<RouteLookup> {
  try {
    const params = new URLSearchParams({ callsign })
    const response = await fetch(`/api/route?${params}`, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
    if (response.status >= 500) {
      return { answered: false }
    }
    // a 4xx means this callsign will never have a route
    if (!response.ok) {
      return { answered: true, route: null }
    }
    const route: Route | null = await response.json()
    return { answered: true, route }
  } catch {
    // network error or timeout
    return { answered: false }
  }
}

export function getRoute(callsign: string | null): Route | null {
  if (callsign === null) {
    return null
  }
  return routeCache.get(callsign) ?? null
}

export function useRoutes(callsigns: (string | null)[]): void {
  // bumped when a route loads or a retry is due, so the screen and effect catch up
  const [refreshCount, setRefreshCount] = useState(0)

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
      lookupRoute(callsign).then((lookup) => {
        if (lookup.answered) {
          routeCache.set(callsign, lookup.route)
          pending.delete(callsign)
          setRefreshCount((count) => count + 1)
          return
        }
        // hold off for a minute, then let the effect try it again
        window.setTimeout(() => {
          pending.delete(callsign)
          setRefreshCount((count) => count + 1)
        }, RETRY_MS)
      })
    }
  }, [key, refreshCount])
}
