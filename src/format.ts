import { skyHeight } from './overhead'
import type { SkyPlane } from './overhead'
import type { Plane, Route } from './types'

const METERS_PER_MILE = 1609.344

// icao airline prefix followed by the flight number, like UAL1234
const AIRLINE_CALLSIGN_PATTERN = /^[A-Z]{3}(\d[A-Z0-9]*)$/

const SKY_PHRASES = {
  high: 'high in the sky',
  medium: 'halfway up the sky',
  low: 'low in the sky',
}

// "United Airlines" reads better out loud as "United"
export function shortAirlineName(name: string): string {
  return name.replace(/\s+(Airlines|Air Lines)$/i, '')
}

export function flightTitle(plane: Plane, route: Route | null): string {
  const callsign = plane.callsign
  if (callsign !== null && route !== null && route.airline !== null) {
    const match = AIRLINE_CALLSIGN_PATTERN.exec(callsign)
    if (match !== null) {
      return `${shortAirlineName(route.airline)} ${match[1]}`
    }
  }

  if (callsign !== null) {
    return callsign
  }
  if (plane.registration !== null) {
    return plane.registration
  }
  return plane.hex.toUpperCase()
}

export function routeLine(route: Route | null): string | null {
  if (route === null) {
    return null
  }
  return `${route.origin.city} → ${route.destination.city}`
}

// type names come in all caps, so soften the plain words
function softenCaps(text: string): string {
  const words = text.split(' ')
  const softened = words.map((word) => {
    const isPlainWord = /^[A-Z]{4,}$/.test(word)
    if (!isPlainWord) {
      return word
    }
    return word[0] + word.slice(1).toLowerCase()
  })
  return softened.join(' ')
}

export function aircraftLabel(plane: Plane): string | null {
  if (plane.typeName !== null) {
    return softenCaps(plane.typeName)
  }
  return plane.typeCode
}

export function formatAltitude(feet: number): string {
  const rounded = Math.round(feet)
  return `${rounded.toLocaleString('en-US')} ft`
}

export function formatMiles(meters: number): string {
  const miles = meters / METERS_PER_MILE
  if (miles < 10) {
    return `${miles.toFixed(1)} mi`
  }
  return `${Math.round(miles)} mi`
}

export function lookPhrase(skyPlane: SkyPlane): string {
  const height = skyHeight(skyPlane.elevationDegrees)
  return `Look ${skyPlane.direction}, ${SKY_PHRASES[height]}`
}
