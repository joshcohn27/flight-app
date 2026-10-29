import { useEffect, useState } from 'react'
import type { Coords } from '../types'

export type LocationState =
  | { status: 'unsupported' }
  | { status: 'asking' }
  | { status: 'denied' }
  | { status: 'unavailable' }
  | { status: 'ready'; coords: Coords }

function initialState(): LocationState {
  if (!('geolocation' in navigator)) {
    return { status: 'unsupported' }
  }
  return { status: 'asking' }
}

export function useLocation(): LocationState {
  const [state, setState] = useState<LocationState>(initialState)

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      return
    }

    function onPosition(position: GeolocationPosition) {
      setState({
        status: 'ready',
        coords: {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        },
      })
    }

    function onError(error: GeolocationPositionError) {
      if (error.code === error.PERMISSION_DENIED) {
        setState({ status: 'denied' })
        return
      }
      // a gps hiccup while driving shouldn't wipe out a good position
      setState((current) => {
        if (current.status === 'ready') {
          return current
        }
        return { status: 'unavailable' }
      })
    }

    const watchId = navigator.geolocation.watchPosition(onPosition, onError, {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 20000,
    })

    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [])

  return state
}
