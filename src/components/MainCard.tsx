import { aircraftLabel, flightTitle, formatAltitude, formatMiles, lookPhrase, routeLine } from '../format'
import { getRoute } from '../hooks/useRoutes'
import type { OverheadResult } from '../overhead'

type MainCardProps = {
  result: OverheadResult
}

function MainCard({ result }: MainCardProps) {
  const { main, label } = result
  const route = getRoute(main.plane.callsign)
  const routeText = routeLine(route)

  const details: string[] = []
  const aircraft = aircraftLabel(main.plane)
  if (aircraft !== null) {
    details.push(aircraft)
  }
  details.push(formatAltitude(main.altitudeFeet))
  details.push(formatMiles(main.distanceMeters))

  return (
    <section className="main-card">
      <p className="label">{label}</p>
      <h1 className="title">{flightTitle(main.plane, route)}</h1>
      {routeText !== null && <p className="route">{routeText}</p>}
      <p className="details">{details.join(' · ')}</p>
      <p className="look">{lookPhrase(main)}</p>
    </section>
  )
}

export default MainCard
