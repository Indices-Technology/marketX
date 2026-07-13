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
  const pad = Math.round(width * 0.07)
  const footer = Math.round(height * 0.05)
  const availW = width - pad * 2
  const availH = height - pad * 2 - footer
  const scale = Math.min(availW / img.width, availH / img.height)
  const cw = img.width * scale
  const ch = img.height * scale
  const x = (width - cw) / 2
  const y = (height - ch - footer) / 2

  // Soft shadow under the card.
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.35)'
  ctx.shadowBlur = Math.round(width * 0.025)
  ctx.shadowOffsetY = Math.round(width * 0.008)
  ctx.drawImage(img, x, y, cw, ch)
  ctx.restore()

  // Footer line.
  ctx.fillStyle = isPrint ? '#0f172a' : '#ffffff'
  ctx.textAlign = 'center'
  ctx.font = `600 ${Math.round(width * 0.026)}px system-ui, sans-serif`
  ctx.fillText('Discover more on MarketX', width / 2, height - Math.round(pad * 0.9))

  return canvas.toDataURL('image/png')
}
