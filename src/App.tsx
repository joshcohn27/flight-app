import MainCard from './components/MainCard'
import OtherPlanes from './components/OtherPlanes'
import PlaneFacts from './components/PlaneFacts'
import SkyBackground from './components/SkyBackground'
import StaleNote from './components/StaleNote'
import StatusMessage from './components/StatusMessage'
import { useLocation } from './hooks/useLocation'
import type { LocationState } from './hooks/useLocation'
import { aircraftLookup, routeLookup, useLookups } from './hooks/useLookups'
import { usePlanes } from './hooks/usePlanes'
import type { PlanesState } from './hooks/usePlanes'
import { useWakeLock } from './hooks/useWakeLock'
import { useWeather } from './hooks/useWeather'
import { findOverhead } from './overhead'
import type { OverheadResult } from './overhead'
import type { Coords } from './types'
import { isLightSky } from './weather'

function locationMessage(location: LocationState) {
  if (location.status === 'unsupported') {
    return (
      <StatusMessage
        title="Location isn't available"
        detail="This browser can't share your location."
      />
    )
  }
  if (location.status === 'denied') {
    return (
      <StatusMessage
        title="Location is off"
        detail="Open Settings, then Privacy & Security, then Location Services, then Safari Websites, and pick While Using the App. Then reopen Flight Overhead."
      />
    )
  }
  if (location.status === 'unavailable') {
    return (
      <StatusMessage
        title="Can't find your location"
        detail="Make sure Location Services is on. Still trying."
      />
    )
  }
  return (
    <StatusMessage
      title="Finding your location"
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
    return <StatusMessage title="Looking for planes" detail="Checking the sky around you." />
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
          detail="Nothing is flying within about 15 miles right now."
        />
        {staleNote}
      </>
    )
  }

  return (
    <>
      <MainCard result={result} />
      {staleNote}
      <PlaneFacts plane={result.main.plane} />
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
  const weather = useWeather(coords)

  let result: OverheadResult | null = null
  if (planesState.planes !== null && coords !== null) {
    result = findOverhead(planesState.planes, coords)
  }

  const callsigns: (string | null)[] = []
  const hexes: string[] = []
  if (result !== null) {
    const shown = [result.main, ...result.others]
    for (const skyPlane of shown) {
      callsigns.push(skyPlane.plane.callsign)
      hexes.push(skyPlane.plane.hex)
    }
  }
  useLookups(routeLookup, callsigns)
  useLookups(aircraftLookup, hexes)

  let theme = 'theme-dark'
  if (weather !== null && isLightSky(weather)) {
    theme = 'theme-light'
  }

  let content = locationMessage(location)
  if (location.status === 'ready') {
    content = <PlanesView planesState={planesState} result={result} />
  }

  return (
    <div className={`app ${theme}`}>
      <SkyBackground weather={weather} />
      <main className="screen">{content}</main>
      <footer className="footer">
        Data: adsb.lol, <a href="https://adsb.fi">adsb.fi</a>, adsbdb, Open-Meteo
      </footer>
    </div>
  )
}

export default App
