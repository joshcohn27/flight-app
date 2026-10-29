export type Coords = {
  lat: number
  lon: number
}

export type Plane = {
  hex: string
  callsign: string | null
  registration: string | null
  typeCode: string | null
  typeName: string | null
  altitude: number | 'ground' | null
  lat: number | null
  lon: number | null
  groundSpeed: number | null
  track: number | null
  verticalRate: number | null
  squawk: string | null
  emergency: string | null
}

export type Airport = {
  city: string
  name: string | null
  iata: string | null
  lat: number | null
  lon: number | null
}

export type Route = {
  airline: string | null
  origin: Airport
  destination: Airport
}

export type AircraftInfo = {
  manufacturer: string | null
  model: string | null
  icaoType: string | null
  registration: string | null
  owner: string | null
  country: string | null
  photoUrl: string | null
}

export type Weather = {
  code: number
  isDay: boolean
}
