export function openDirections(lat: number, lng: number) {
  if (typeof window === 'undefined') return
  const dest = `${lat},${lng}`
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  window.open(
    isIOS
      ? `maps://maps.apple.com/?daddr=${dest}`
      : `https://www.google.com/maps/dir/?api=1&destination=${dest}`,
    '_blank',
    'noopener',
  )
}
