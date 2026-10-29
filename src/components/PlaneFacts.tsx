import { planeFacts } from '../format'
import { aircraftLookup, readLookup, routeLookup } from '../hooks/useLookups'
import type { Plane } from '../types'

type PlaneFactsProps = {
  plane: Plane
}

function PlaneFacts({ plane }: PlaneFactsProps) {
  const route = readLookup(routeLookup, plane.callsign)
  const info = readLookup(aircraftLookup, plane.hex)
  const facts = planeFacts(plane, route, info)

  let photoUrl = null
  if (info !== null) {
    photoUrl = info.photoUrl
  }

  return (
    <section className="facts-section">
      <dl className="facts">
        {facts.map((fact) => (
          <div key={fact.label} className="fact">
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>
      {photoUrl !== null && (
        <figure className="photo">
          <img src={photoUrl} alt="This aircraft" referrerPolicy="no-referrer" />
          <figcaption>Photo from airport-data.com</figcaption>
        </figure>
      )}
    </section>
  )
}

export default PlaneFacts
