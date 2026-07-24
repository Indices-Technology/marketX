/**
 * Compose a captured MarketX Card PNG onto a branded canvas sized for a share
 * template (WhatsApp/IG Story, IG Post, Facebook, printable A5). The card image
 * itself already carries the logo/contact/QR — this just frames it.
 */
export interface ShareTemplate {
  id: string
  label: string
  width: number
  height: number
}

// Download templates (the OG size lives separately in useSeo).
export const SHARE_TEMPLATES: ShareTemplate[] = [
  { id: 'story', label: 'WhatsApp / Story', width: 1080, height: 1920 },
  { id: 'square', label: 'Instagram Post', width: 1080, height: 1080 },
  { id: 'facebook', label: 'Facebook', width: 1200, height: 630 },
  { id: 'print', label: 'Printable A5', width: 1748, height: 2480 },
]

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export async function composeCardTemplate(
  cardPng: string,
  tpl: ShareTemplate,
): Promise<string> {
  const { width, height } = tpl
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return cardPng

  const isPrint = tpl.id === 'print'
  // Background: white for print, else a dark brand gradient.
  if (isPrint) {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
  } else {
    const g = ctx.createLinearGradient(0, 0, width, height)
    g.addColorStop(0, '#0f172a')
    g.addColorStop(1, '#241a2e')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, width, height)
  }

  const img = await loadImage(cardPng)

  // The card is portrait. On a landscape template (Facebook 1200×630) fitting
  // it to the full width shrank it to an unreadable thumbnail, so it takes a
  // left column at near-full height and the brand line sits beside it.
  const isLandscape = width > height
  // Pad off the SHORT side — 7% of 1200 on a 630-tall canvas ate the card.
  const pad = Math.round(Math.min(width, height) * 0.07)
  const footer = isLandscape ? 0 : Math.round(height * 0.05)
  const colW = isLandscape ? Math.round(width * 0.44) : width
  const availW = colW - pad * 2
  const availH = height - pad * 2 - footer
  const scale = Math.min(availW / img.width, availH / img.height)
  const cw = Math.round(img.width * scale)
  const ch = Math.round(img.height * scale)
  const x = Math.round((colW - cw) / 2)
  const y = Math.round((height - ch - footer) / 2)

  // Soft shadow under the card.
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.35)'
  ctx.shadowBlur = Math.round(width * 0.025)
  ctx.shadowOffsetY = Math.round(width * 0.008)
  ctx.drawImage(img, x, y, cw, ch)
  ctx.restore()

  // Brand line — beneath the card on portrait, beside it on landscape.
  const type = Math.round(Math.min(width, height) * 0.032)
  ctx.fillStyle = isPrint ? '#0f172a' : '#ffffff'
  if (isLandscape) {
    ctx.textAlign = 'left'
    const tx = colW + pad
    ctx.font = `700 ${Math.round(type * 1.25)}px system-ui, sans-serif`
    ctx.fillText('Scan to verify this seller', tx, height / 2 - type * 0.4)
    ctx.font = `500 ${type}px system-ui, sans-serif`
    ctx.fillText('Discover more on MarketX', tx, height / 2 + type * 1.2)
  } else {
    ctx.textAlign = 'center'
    ctx.font = `600 ${type}px system-ui, sans-serif`
    ctx.fillText(
      'Discover more on MarketX',
      width / 2,
      height - Math.round(pad * 0.9),
    )
  }

  return canvas.toDataURL('image/png')
}
