import type { Airport, Route } from '../types'

type RouteTextProps = {
  route: Route
}

// a drawn arrow so it can be much bolder than the text arrow
function Arrow() {
  return (
    <svg className="arrow" viewBox="0 0 48 24" role="img" aria-label="to">
      <path d="M4 12h28" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
      <path
        d="M27 3l18 9-18 9z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// "Philadelphia (PHL)", or just the city when there's no code
function airportLabel(airport: Airport): string {
  if (airport.iata === null) {
    return airport.city
  }
  return `${airport.city} (${airport.iata})`
}

function RouteText({ route }: RouteTextProps) {
  return (
    <>
      {airportLabel(route.origin)}
      <Arrow />
      {airportLabel(route.destination)}
    </>
  )
}

export default RouteText
