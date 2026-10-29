import MainCard from './components/MainCard'
import OtherPlanes from './components/OtherPlanes'
import StaleNote from './components/StaleNote'
import StatusMessage from './components/StatusMessage'
import { useLocation } from './hooks/useLocation'
import type { LocationState } from './hooks/useLocation'
import { usePlanes } from './hooks/usePlanes'
import type { PlanesState } from './hooks/usePlanes'
import { useRoutes } from './hooks/useRoutes'
import { useWakeLock } from './hooks/useWakeLock'
import { findOverhead } from './overhead'
import type { OverheadResult } from './overhead'
import type { Coords } from './types'

function locationMessage(location: LocationState) {
  if (location.status === 'unsupported') {
    return (
      <StatusMessage
        title="No location here"
        detail="This browser can't share your location, so there's no way to find planes above you."
      />
    )
  }
  if (location.status === 'denied') {
    return (
      <StatusMessage
        title="Location is turned off"
        detail="Open Settings, then Privacy & Security, then Location Services, then Safari Websites, and pick While Using the App. Then reopen Flight Overhead."
      />
    )
  }
  if (location.status === 'unavailable') {
    return (
      <StatusMessage
        title="Can't find you yet"
        detail="Make sure Location Services is on. Still trying..."
      />
    )
  }
  return (
    <StatusMessage
      title="Finding your location..."
      detail="Tap Allow if Safari asks to use your location."
    />
  )
}

type PlanesViewProps = {
  planesState: PlanesState
  result: OverheadResult | null
}

function PlanesView({ planesState, result }: PlanesViewProps) {
  const { planes, lastUpdated, failed } = planesState

  if (planes === null) {
    if (failed) {
      return (
        <StatusMessage
          title="Can't reach flight data"
          detail="Check your connection. Trying again every few seconds."
        />
      )
    }
    return <StatusMessage title="Looking for planes..." detail="Scanning the sky around you." />
  }

  let staleNote = null
  if (failed && lastUpdated !== null) {
    staleNote = <StaleNote lastUpdated={lastUpdated} />
  }

  if (result === null) {
    return (
      <>
        <StatusMessage
          title="No planes nearby"
          detail="Nothing is flying within about 15 miles right now. Keep an eye out."
        />
        {staleNote}
      </>
    )
  }

  return (
    <>
      <MainCard result={result} />
      {staleNote}
      <OtherPlanes planes={result.others} />
    </>
  )
}

function App() {
  useWakeLock()
  const location = useLocation()

  let coords: Coords | null = null
  if (location.status === 'ready') {
    coords = location.coords
  }

  const planesState = usePlanes(coords)

  let result: OverheadResult | null = null
  if (planesState.planes !== null && coords !== null) {
    result = findOverhead(planesState.planes, coords)
  }

  const callsigns: (string | null)[] = []
  if (result !== null) {
    callsigns.push(result.main.plane.callsign)
    for (const other of result.others) {
      callsigns.push(other.plane.callsign)
    }
  }
  useRoutes(callsigns)

  let content = locationMessage(location)
  if (location.status === 'ready') {
    content = <PlanesView planesState={planesState} result={result} />
  }

  return (
    <>
      <main className="screen">{content}</main>
      <footer className="footer">Data: adsb.lol, airplanes.live, adsbdb</footer>
    </>
  )
}

export default App
