import { useEffect, useState } from 'react'
import type { AircraftInfo, Route } from '../types'

const REQUEST_TIMEOUT_MS = 10000
const RETRY_MS = 60000

export type Lookup<T> = {
  buildUrl: (key: string) => string
  // only real answers go in here, so they're kept for the whole session
  cache: Map<string, T | null>
  // keys being looked up now, or waiting out a failed lookup
  pending: Set<string>
}

type LookupResult<T> =
  | { answered: true; value: T | null }
  | { answered: false }

function createLookup<T>(buildUrl: (key: string) => string): Lookup<T> {
  return {
    buildUrl,
    cache: new Map(),
    pending: new Set(),
  }
}

export const routeLookup = createLookup<Route>((callsign) => {
  const params = new URLSearchParams({ callsign })
  return `/api/route?${params}`
})

export const aircraftLookup = createLookup<AircraftInfo>((hex) => {
  const params = new URLSearchParams({ hex })
  return `/api/aircraft?${params}`
})

async function runLookup<T>(lookup: Lookup<T>, key: string): Promise<LookupResult<T>> {
  try {
    const response = await fetch(lookup.buildUrl(key), {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
    if (response.status >= 500) {
      return { answered: false }
    }
    // a 4xx means this key will never have an answer
    if (!response.ok) {
      return { answered: true, value: null }
    }
    const value: T | null = await response.json()
    return { answered: true, value }
  } catch {
    // network error or timeout
    return { answered: false }
  }
}

export function readLookup<T>(lookup: Lookup<T>, key: string | null): T | null {
  if (key === null) {
    return null
  }
  return lookup.cache.get(key) ?? null
}

export function useLookups<T>(lookup: Lookup<T>, keys: (string | null)[]): void {
  // bumped when an answer loads or a retry is due, so the screen and effect catch up
  const [refreshCount, setRefreshCount] = useState(0)

  // a plain string key so the effect only runs when the keys change
  const joinedKeys = keys.filter((key) => key !== null).join(',')

  useEffect(() => {
    if (joinedKeys === '') {
      return
    }

    for (const key of joinedKeys.split(',')) {
      if (lookup.cache.has(key) || lookup.pending.has(key)) {
        continue
      }
      lookup.pending.add(key)
      runLookup(lookup, key).then((result) => {
        if (result.answered) {
          lookup.cache.set(key, result.value)
          lookup.pending.delete(key)
          setRefreshCount((count) => count + 1)
          return
        }
        // hold off for a minute, then let the effect try it again
        window.setTimeout(() => {
          lookup.pending.delete(key)
          setRefreshCount((count) => count + 1)
        }, RETRY_MS)
      })
    }
  }, [lookup, joinedKeys, refreshCount])
}
