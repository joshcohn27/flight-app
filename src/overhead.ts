import type { Coords, Plane } from './types'

const EARTH_RADIUS_METERS = 6371000
const METERS_PER_FOOT = 0.3048
const OVERHEAD_MIN_ANGLE = 15
const OTHER_PLANES_COUNT = 3

const COMPASS_WORDS = [
  'north',
  'northeast',
  'east',
  'southeast',
  'south',
  'southwest',
  'west',
  'northwest',
]

export type SkyHeight = 'high' | 'medium' | 'low'

export type SkyPlane = {
  plane: Plane
  altitudeFeet: number
  distanceMeters: number
  elevationDegrees: number
  bearingDegrees: number
  direction: string
}

export type OverheadResult = {
  label: 'Overhead' | 'Nearest'
  main: SkyPlane
  others: SkyPlane[]
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI
}

// haversine
export function groundDistanceMeters(from: Coords, to: Coords): number {
  const lat1 = toRadians(from.lat)
  const lat2 = toRadians(to.lat)
  const deltaLat = toRadians(to.lat - from.lat)
  const deltaLon = toRadians(to.lon - from.lon)

  const sinLat = Math.sin(deltaLat / 2)
  const sinLon = Math.sin(deltaLon / 2)
  const a = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return EARTH_RADIUS_METERS * c
}

export function elevationAngleDegrees(altitudeMeters: number, distanceMeters: number): number {
  return toDegrees(Math.atan2(altitudeMeters, distanceMeters))
}

// 0 is north, 90 is east
export function bearingDegrees(from: Coords, to: Coords): number {
  const lat1 = toRadians(from.lat)
  const lat2 = toRadians(to.lat)
  const deltaLon = toRadians(to.lon - from.lon)

  const y = Math.sin(deltaLon) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon)
  const bearing = toDegrees(Math.atan2(y, x))

  return (bearing + 360) % 360
}

export function compassWord(bearing: number): string {
  const index = Math.round(bearing / 45) % COMPASS_WORDS.length
  return COMPASS_WORDS[index]
}

export function skyHeight(elevationDegrees: number): SkyHeight {
  if (elevationDegrees >= 45) {
    return 'high'
  }
  if (elevationDegrees >= 20) {
    return 'medium'
  }
  return 'low'
}

// null if the plane is on the ground or has no position
function toSkyPlane(plane: Plane, me: Coords): SkyPlane | null {
  if (typeof plane.altitude !== 'number') {
    return null
  }
  if (plane.lat === null || plane.lon === null) {
    return null
  }

  const planeCoords = { lat: plane.lat, lon: plane.lon }
  const distanceMeters = groundDistanceMeters(me, planeCoords)
  const altitudeMeters = plane.altitude * METERS_PER_FOOT
  const bearing = bearingDegrees(me, planeCoords)

  return {
    plane,
    altitudeFeet: plane.altitude,
    distanceMeters,
    elevationDegrees: elevationAngleDegrees(altitudeMeters, distanceMeters),
    bearingDegrees: bearing,
    direction: compassWord(bearing),
  }
}

export function findOverhead(planes: Plane[], me: Coords): OverheadResult | null {
  const skyPlanes: SkyPlane[] = []
  for (const plane of planes) {
    const skyPlane = toSkyPlane(plane, me)
    if (skyPlane !== null) {
      skyPlanes.push(skyPlane)
    }
  }

  if (skyPlanes.length === 0) {
    return null
  }

  // highest in the sky first
  skyPlanes.sort((a, b) => b.elevationDegrees - a.elevationDegrees)

  const main = skyPlanes[0]
  const others = skyPlanes.slice(1, 1 + OTHER_PLANES_COUNT)

  let label: OverheadResult['label'] = 'Nearest'
  if (main.elevationDegrees >= OVERHEAD_MIN_ANGLE) {
    label = 'Overhead'
  }

  return { label, main, others }
}
