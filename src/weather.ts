import type { Weather } from './types'

export type Sky = 'clear' | 'partly-cloudy' | 'cloudy' | 'fog' | 'rain' | 'snow' | 'storm'

// open-meteo sends wmo weather codes
export function skyFromCode(code: number): Sky {
  if (code >= 95) {
    return 'storm'
  }
  if (code >= 71 && code <= 77) {
    return 'snow'
  }
  if (code === 85 || code === 86) {
    return 'snow'
  }
  if (code >= 51) {
    return 'rain'
  }
  if (code === 45 || code === 48) {
    return 'fog'
  }
  if (code === 3) {
    return 'cloudy'
  }
  if (code === 2) {
    return 'partly-cloudy'
  }
  return 'clear'
}

// bright daytime skies need dark text to stay readable
export function isLightSky(weather: Weather): boolean {
  if (!weather.isDay) {
    return false
  }
  const sky = skyFromCode(weather.code)
  if (sky === 'rain' || sky === 'storm') {
    return false
  }
  return true
}
