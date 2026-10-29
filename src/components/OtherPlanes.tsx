import { flightTitle, formatAltitude, routeLine } from '../format'
import { getRoute } from '../hooks/useRoutes'
import type { SkyPlane } from '../overhead'

type OtherPlanesProps = {
  planes: SkyPlane[]
}

function OtherPlanes({ planes }: OtherPlanesProps) {
  if (planes.length === 0) {
    return null
  }

  return (
    <ul className="others">
      {planes.map((skyPlane) => {
        const route = getRoute(skyPlane.plane.callsign)
        const routeText = routeLine(route)

        let name = flightTitle(skyPlane.plane, route)
        if (routeText !== null) {
          name = `${name} · ${routeText}`
        }

        return (
          <li key={skyPlane.plane.hex} className="other">
            <span className="other-name">{name}</span>
            <span className="other-altitude">{formatAltitude(skyPlane.altitudeFeet)}</span>
          </li>
        )
      })}
    </ul>
  )
}

export default OtherPlanes
