/**
 * Geocoding against third-party providers, kept out of components so no view
 * calls `$fetch` directly. These are external services (not our API), so they
 * deliberately bypass BaseApiClient (no auth/CSRF/baseURL).
 */
export interface NominatimResult {
  display_name: string
  lat: string
  lon: string
  [key: string]: unknown
}

export interface ReverseGeocode {
  city?: string
  principalSubdivision?: string
  [key: string]: unknown
}

export const useGeocode = () => {
  /** Forward search: free-text query → candidate places (OpenStreetMap). */
  const searchLocations = async (
    q: string,
    limit = 3,
  ): Promise<NominatimResult[]> => {
    const res = await $fetch<NominatimResult[]>(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=${limit}`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'MarketX/1.0' } },
    )
    return res ?? []
  }

  /** Reverse geocode: coordinates → city/state (BigDataCloud). */
  const reverseGeocode = async (
    lat: number,
    lng: number,
  ): Promise<ReverseGeocode> => {
    return await $fetch<ReverseGeocode>(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
    )
  }

  return { searchLocations, reverseGeocode }
}
