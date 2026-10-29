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
}

export type Airport = {
  city: string
  iata: string | null
}

export type Route = {
  airline: string | null
  origin: Airport
  destination: Airport
}
