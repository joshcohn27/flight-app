import { aircraftLabel, flightTitle, formatAltitude } from '../format'
import { aircraftLookup, readLookup, routeLookup } from '../hooks/useLookups'
import type { SkyPlane } from '../overhead'
import RouteText from './RouteText'

type OtherPlanesProps = {
  planes: SkyPlane[]
}

function OtherPlanes({ planes }: OtherPlanesProps) {
  if (planes.length === 0) {
    return null
  }

  return (
    <section className="others-section">
      <h2 className="others-heading">Also nearby</h2>
      <ul className="others">
        {planes.map((skyPlane) => {
          const plane = skyPlane.plane
          const route = readLookup(routeLookup, plane.callsign)
          const info = readLookup(aircraftLookup, plane.hex)
          const aircraft = aircraftLabel(plane, info)

          return (
            <li key={plane.hex} className="other">
              <div className="other-top">
                <span className="other-name">{flightTitle(plane, route)}</span>
                <span className="other-altitude">{formatAltitude(skyPlane.altitudeFeet)}</span>
              </div>
              {route !== null && (
                <div className="other-line">
                  <RouteText route={route} />
                </div>
              )}
              {aircraft !== null && <div className="other-line">{aircraft}</div>}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default OtherPlanes
