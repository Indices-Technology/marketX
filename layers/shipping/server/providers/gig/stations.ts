/**
 * Resolve a Nigerian state to a GIG station + coordinates.
 *
 * GIG's /price needs SenderStationId + ReceiverStationId (from /localstations/get)
 * and SenderLocation/ReceiverLocation (lat/long). Stations carry no coordinates,
 * so we use the address's own coords when present, else a per-state centroid.
 */

import { getStations, type GigStation } from './client'
import type { Address } from '../../utils/types'

function norm(s: string): string {
  return (s || '').trim().toLowerCase().replace(/\s+state$/, '').replace(/\s+/g, ' ')
}

/** Our state name → GIG's StateName, where they differ. */
const STATE_ALIAS: Record<string, string> = {
  abuja: 'fct',
  'federal capital territory': 'fct',
}

/** Best-effort station for a state: first public, non-deleted station matching StateName. */
export async function resolveStation(state: string): Promise<GigStation | null> {
  const stations = await getStations()
  const n0 = norm(state)
  const n = STATE_ALIAS[n0] ?? n0
  const matches = stations.filter(
    (s) => norm(s.StateName) === n && !s.IsDeleted,
  )
  if (!matches.length) return null
  return matches.find((s) => s.IsPublic) ?? matches[0]
}

/** Approximate state centroids (lat, lng) — fallback when an address has no coords. */
const STATE_CENTROID: Record<string, [number, number]> = {
  abia: [5.45, 7.52], adamawa: [9.33, 12.4], 'akwa ibom': [5.03, 7.93],
  anambra: [6.22, 7.07], bauchi: [10.31, 9.84], bayelsa: [4.77, 6.07],
  benue: [7.33, 8.74], borno: [11.88, 13.15], 'cross river': [5.87, 8.6],
  delta: [5.53, 5.9], ebonyi: [6.26, 8.01], edo: [6.34, 5.62],
  ekiti: [7.72, 5.31], enugu: [6.46, 7.55], gombe: [10.29, 11.17],
  imo: [5.57, 7.05], jigawa: [12.23, 9.56], kaduna: [10.52, 7.44],
  kano: [12.0, 8.52], katsina: [12.99, 7.6], kebbi: [11.49, 4.23],
  kogi: [7.73, 6.69], kwara: [8.97, 4.39], lagos: [6.52, 3.38],
  nasarawa: [8.5, 8.2], niger: [9.93, 5.6], ogun: [7.16, 3.35],
  ondo: [7.1, 4.84], osun: [7.56, 4.52], oyo: [8.16, 3.61],
  plateau: [9.22, 9.52], rivers: [4.86, 6.92], sokoto: [13.06, 5.24],
  taraba: [7.87, 9.78], yobe: [12.0, 11.5], zamfara: [12.17, 6.66],
  fct: [9.06, 7.49], abuja: [9.06, 7.49], 'federal capital territory': [9.06, 7.49],
}

const DEFAULT_COORD: [number, number] = STATE_CENTROID.lagos

/** GIG location object for an address — its coords, else the state centroid. */
export function locationFor(addr: Address): { Latitude: number; Longitude: number } {
  if (typeof addr.lat === 'number' && typeof addr.lng === 'number') {
    return { Latitude: addr.lat, Longitude: addr.lng }
  }
  const [lat, lng] = STATE_CENTROID[norm(addr.state)] ?? DEFAULT_COORD
  return { Latitude: lat, Longitude: lng }
}
