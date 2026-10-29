import {
  aircraftLabel,
  flightTitle,
  formatAltitude,
  formatMiles,
  lookPhrase,
  operatedByLine,
} from '../format'
import { aircraftLookup, readLookup, routeLookup } from '../hooks/useLookups'
import type { OverheadResult } from '../overhead'
import RouteText from './RouteText'

type MainCardProps = {
  result: OverheadResult
}

function MainCard({ result }: MainCardProps) {
  const { main, label } = result
  const route = readLookup(routeLookup, main.plane.callsign)
  const info = readLookup(aircraftLookup, main.plane.hex)
  const aircraft = aircraftLabel(main.plane, info)
  const operatedBy = operatedByLine(main.plane, route, info)

  const altitude = formatAltitude(main.altitudeFeet)
  const distance = formatMiles(main.distanceMeters)

  return (
    <section className="main-card">
      <p className="label">{label}</p>
      <h1 className="title">{flightTitle(main.plane, route, info)}</h1>
      {operatedBy !== null && <p className="operated-by">{operatedBy}</p>}
      {route !== null && (
        <p className="route">
          <RouteText route={route} />
        </p>
      )}
      {aircraft !== null && <p className="aircraft">{aircraft}</p>}
      <p className="details">
        {altitude} up, {distance} away
      </p>
      <p className="look">{lookPhrase(main)}</p>
    </section>
  )
}

export default MainCard
