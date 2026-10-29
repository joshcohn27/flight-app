import { AIRCRAFT_TYPES } from './aircraftTypes'
import { compassWord, skyHeight } from './overhead'
import type { SkyPlane } from './overhead'
import type { AircraftInfo, Airport, Plane, Route } from './types'

const METERS_PER_MILE = 1609.344
const MPH_PER_KNOT = 1.15078

// anything slower than this is basically level flight
const LEVEL_FLIGHT_FPM = 250

// icao airline prefix followed by the flight number, like UAL1234
const AIRLINE_CALLSIGN_PATTERN = /^[A-Z]{3}(\d[A-Z0-9]*)$/

const SKY_PHRASES = {
  high: 'high in the sky',
  medium: 'halfway up the sky',
  low: 'low in the sky',
}

export type Fact = {
  label: string
  value: string
}

// "United Airlines" reads better out loud as "United"
export function shortAirlineName(name: string): string {
  return name.replace(/\s+(Airlines|Air Lines)$/i, '')
}

function capitalize(text: string): string {
  return text[0].toUpperCase() + text.slice(1)
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

function typeCode(plane: Plane, info: AircraftInfo | null): string | null {
  if (plane.typeCode !== null) {
    return plane.typeCode
  }
  if (info !== null) {
    return info.icaoType
  }
  return null
}

// adsbdb's exact model, like "Boeing 737MAX 9"
function modelText(info: AircraftInfo | null): string | null {
  if (info === null || info.model === null) {
    return null
  }
  if (info.manufacturer === null) {
    return info.model
  }
  return `${info.manufacturer} ${info.model}`
}

export function aircraftLabel(plane: Plane, info: AircraftInfo | null): string | null {
  const code = typeCode(plane, info)
  if (code !== null) {
    const knownName = AIRCRAFT_TYPES[code]
    if (knownName !== undefined) {
      return knownName
    }
  }

  const model = modelText(info)
  if (model !== null) {
    return model
  }
  if (plane.typeName !== null) {
    return softenCaps(plane.typeName)
  }
  return code
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

function speedText(knots: number | null): string | null {
  if (knots === null) {
    return null
  }
  const mph = Math.round(knots * MPH_PER_KNOT)
  return `${mph} mph`
}

function headingText(track: number | null): string | null {
  if (track === null) {
    return null
  }
  const word = capitalize(compassWord(track))
  return `${word} (${Math.round(track)}°)`
}

function verticalText(feetPerMinute: number | null): string | null {
  if (feetPerMinute === null) {
    return null
  }
  if (Math.abs(feetPerMinute) < LEVEL_FLIGHT_FPM) {
    return 'Level'
  }

  const rate = Math.abs(Math.round(feetPerMinute)).toLocaleString('en-US')
  if (feetPerMinute > 0) {
    return `Climbing ${rate} ft/min`
  }
  return `Descending ${rate} ft/min`
}

function airportText(airport: Airport): string {
  const name = airport.name ?? airport.city
  if (airport.iata === null) {
    return name
  }
  return `${name} (${airport.iata})`
}

export function planeFacts(plane: Plane, route: Route | null, info: AircraftInfo | null): Fact[] {
  const facts: Fact[] = []

  function add(label: string, value: string | null) {
    if (value !== null) {
      facts.push({ label, value })
    }
  }

  let registration = plane.registration
  if (registration === null && info !== null) {
    registration = info.registration
  }

  // skip the exact model when it's already the big type line
  let model = modelText(info)
  if (model === aircraftLabel(plane, info)) {
    model = null
  }

  add('Callsign', plane.callsign)
  add('Registration', registration)
  add('Type code', typeCode(plane, info))
  add('Model', model)
  if (info !== null) {
    add('Owner', info.owner)
    add('Registered in', info.country)
  }
  if (route !== null) {
    add('From', airportText(route.origin))
    add('To', airportText(route.destination))
  }
  add('Speed', speedText(plane.groundSpeed))
  add('Heading', headingText(plane.track))
  add('Vertical', verticalText(plane.verticalRate))
  add('Squawk', plane.squawk)
  add('Emergency', plane.emergency)
  add('Mode S code', plane.hex.toUpperCase())

  return facts
}
