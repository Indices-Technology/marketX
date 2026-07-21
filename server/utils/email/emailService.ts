// server/utils/email/emailService.ts
/**
 * Email Service
 * Handles all email sending via Resend
 */

import { Resend } from 'resend'

let resendInstance: Resend | null = null

/**
 * Get Resend instance (singleton)
 */
function getResendClient(): Resend {
  if (!resendInstance) {
    const config = useRuntimeConfig()
    const apiKey = config.resendApiKey

    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured')
    }

    resendInstance = new Resend(apiKey)
  }

  return resendInstance
}

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
}

/**
 * Send email via Resend
 */
export async function sendEmail(
  options: EmailOptions,
): Promise<{ id: string }> {
  const resend = getResendClient()
  const config = useRuntimeConfig()
  const senderEmail = config.public.senderEmail as string

  try {
    const response = await resend.emails.send({
      from: senderEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
    })

    if (response.error) {
      throw new Error(response.error.message)
    }

    return { id: response.data?.id || '' }
  } catch (error: any) {
    console.error('Failed to send email:', error.message)
    throw error
  }
}

/**
 * Send verification email
 */
export async function sendVerificationEmail(
  email: string,
  token: string,
  appUrl: string,
  appName?: string,
): Promise<{ id: string }> {
  const verificationLink = `${appUrl}/verify-email?token=${token}`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
          .header { text-align: center; margin-bottom: 20px; }
          .header h1 { color: #333; margin: 0; }
          .content { margin: 20px 0; line-height: 1.6; color: #555; }
          .button { display: inline-block; padding: 12px 30px; background-color: #7c3aed; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Verify Your Email</h1>
          </div>
          
          <div class="content">
            <p>Welcome to ${appName}! Please verify your email address to complete your registration.</p>
            
            <p>Click the button below to verify your email:</p>
            
            <a href="${verificationLink}" class="button">Verify Email</a>
            
            <p>Or copy and paste this link in your browser:</p>
            <p><small>${verificationLink}</small></p>
            
            <p>This link will expire in 24 hours.</p>
            
            <p>If you didn't create this account, please ignore this email.</p>
          </div>
          
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} MarketX. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: 'Verify your email address',
    html,
    text: `Verify your email: ${verificationLink}`,
  })
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  token: string,
  appUrl: string = 'http://localhost:3000',
  appName?: string,
): Promise<{ id: string }> {
  const resetLink = `${appUrl}/reset-password?token=${token}`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
          .header { text-align: center; margin-bottom: 20px; }
          .header h1 { color: #333; margin: 0; }
          .content { margin: 20px 0; line-height: 1.6; color: #555; }
          .button { display: inline-block; padding: 12px 30px; background-color: #7c3aed; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #999; }
          .warning { background-color: #fff3cd; padding: 10px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
          <div class="header"><h1>${appName}</h1></div>
            <h1>Reset Your Password</h1>
          </div>
          
          <div class="content">
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            
            <a href="${resetLink}" class="button">Reset Password</a>
            
            <p>Or copy and paste this link in your browser:</p>
            <p><small>${resetLink}</small></p>
            
            <div class="warning">
              <strong>⚠️ Important:</strong> This link will expire in 15 minutes. If you didn't request this, please ignore this email and your password will remain unchanged.
            </div>
            
            <p>For security reasons, never share this link with anyone.</p>
          </div>
          
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} MarketX. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: 'Reset your password',
    html,
    text: `Reset your password: ${resetLink}`,
  })
}

/**
 * Send checkout OTP email
 */
export async function sendOtpEmail(
  email: string,
  code: string,
  isNewUser: boolean,
  appName = 'MarketX',
): Promise<{ id: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 480px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; }
          .header { background: #e31837; padding: 28px 32px; text-align: center; }
          .header h1 { color: #fff; margin: 0; font-size: 22px; }
          .body { padding: 32px; }
          .otp { display: block; font-size: 42px; font-weight: 800; letter-spacing: 10px; color: #e31837; text-align: center; margin: 24px 0; }
          .note { font-size: 13px; color: #888; text-align: center; margin-top: 8px; }
          .footer { text-align: center; padding: 16px; font-size: 12px; color: #aaa; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>${appName}</h1></div>
          <div class="body">
            <p style="color:#333;font-size:15px;margin:0 0 8px;">
              ${isNewUser ? 'Welcome! Use the code below to verify your email and complete your order.' : 'Use the code below to confirm your identity and complete your order.'}
            </p>
            <span class="otp">${code}</span>
            <p class="note">This code expires in <strong>10 minutes</strong> and can only be used once.</p>
            <p class="note" style="margin-top:16px;">If you didn't attempt to check out on ${appName}, you can safely ignore this email.</p>
          </div>
          <div class="footer">&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</div>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: `${code} is your ${appName} verification code`,
    html,
    text: `Your ${appName} verification code is: ${code}\n\nExpires in 10 minutes.`,
  })
}

// ─── Notification email builders ─────────────────────────────────────────────
// These return { subject, html, text } ready to pass to emailQueue.enqueue().

export function buildNewOrderSellerEmail(
  orderId: number,
  itemCount: number,
  totalKobo: number,
  storeName: string,
  appName = 'MarketX',
): { subject: string; html: string; text: string } {
  const amount = `₦${(totalKobo / 100).toLocaleString('en-NG')}`
  const subject = `🛍️ New order #${orderId} — ${storeName}`
  const detail = `You have a new order (#${orderId}) for ${itemCount} item${itemCount !== 1 ? 's' : ''} totalling ${amount}. Log in to confirm and prepare it for shipment.`
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:0}
.wrap{max-width:480px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden}
.hd{background:#e31837;padding:28px 32px;text-align:center}
.hd h1{color:#fff;margin:0;font-size:20px}
.bd{padding:32px}
.badge{display:inline-block;font-size:13px;background:#dcfce7;color:#166534;padding:4px 10px;border-radius:20px;margin-bottom:16px}
.amt{font-size:28px;font-weight:800;color:#e31837;margin:12px 0}
p{font-size:15px;color:#333;line-height:1.6;margin:0 0 12px}
.ft{text-align:center;padding:16px;font-size:12px;color:#aaa}
</style></head><body>
<div class="wrap"><div class="hd"><h1>${appName}</h1></div>
<div class="bd"><span class="badge">New Order #${orderId}</span>
<div class="amt">${amount}</div>
<p>${detail}</p>
<p style="color:#888;font-size:13px">Log in to your seller dashboard to confirm the order.</p>
</div><div class="ft">&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</div></div>
</body></html>`
  return { subject, html, text: `New Order #${orderId}\n\n${detail}` }
}

export function buildFundsReleasedEmail(
  orderId: number,
  amountKobo: number,
  appName = 'MarketX',
): { subject: string; html: string; text: string } {
  const amount = `₦${(amountKobo / 100).toLocaleString('en-NG')}`
  const subject = `💰 Funds released — Order #${orderId}`
  const detail = `${amount} from Order #${orderId} has been released to your wallet balance and is now available for withdrawal.`
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:0}
.wrap{max-width:480px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden}
.hd{background:#e31837;padding:28px 32px;text-align:center}
.hd h1{color:#fff;margin:0;font-size:20px}
.bd{padding:32px}
.badge{display:inline-block;font-size:13px;background:#dcfce7;color:#166534;padding:4px 10px;border-radius:20px;margin-bottom:16px}
.amt{font-size:28px;font-weight:800;color:#16a34a;margin:12px 0}
p{font-size:15px;color:#333;line-height:1.6;margin:0 0 12px}
.ft{text-align:center;padding:16px;font-size:12px;color:#aaa}
</style></head><body>
<div class="wrap"><div class="hd"><h1>${appName}</h1></div>
<div class="bd"><span class="badge">💰 Funds Released</span>
<div class="amt">${amount}</div>
<p>${detail}</p>
<p style="color:#888;font-size:13px">Visit your wallet to withdraw or track your earnings.</p>
</div><div class="ft">&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</div></div>
</body></html>`
  return { subject, html, text: `Funds Released\n\n${detail}` }
}

export function buildSellerVerificationEmail(
  storeName: string,
  status: 'VERIFIED' | 'REJECTED',
  reason?: string,
  appName = 'MarketX',
): { subject: string; html: string; text: string } {
  const isVerified = status === 'VERIFIED'
  const subject = isVerified
    ? `✅ Your store "${storeName}" is verified!`
    : `❌ Store verification update — ${storeName}`
  const detail = isVerified
    ? `Congratulations! Your store "${storeName}" has been verified on ${appName}. You can now sell to customers across the platform.`
    : `Your store "${storeName}" verification was not approved${reason ? `: ${reason}` : '. Please review your store details and reapply.'}`
  const color = isVerified ? '#16a34a' : '#dc2626'
  const bg = isVerified ? '#dcfce7' : '#fee2e2'
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:0}
.wrap{max-width:480px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden}
.hd{background:#e31837;padding:28px 32px;text-align:center}
.hd h1{color:#fff;margin:0;font-size:20px}
.bd{padding:32px}
.badge{display:inline-block;font-size:13px;background:${bg};color:${color};padding:4px 10px;border-radius:20px;margin-bottom:16px;font-weight:600}
p{font-size:15px;color:#333;line-height:1.6;margin:0 0 12px}
.ft{text-align:center;padding:16px;font-size:12px;color:#aaa}
</style></head><body>
<div class="wrap"><div class="hd"><h1>${appName}</h1></div>
<div class="bd"><span class="badge">${isVerified ? '✅ Verified' : '❌ Not Approved'}</span>
<p><strong>${storeName}</strong></p>
<p>${detail}</p>
${!isVerified && reason ? `<p style="color:#888;font-size:13px">Reason: ${reason}</p>` : ''}
</div><div class="ft">&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</div></div>
</body></html>`
  return { subject, html, text: `Store Verification Update\n\n${detail}` }
}

export function buildAccountStatusEmail(
  action: 'SUSPENDED' | 'BANNED' | 'DISABLED' | 'ENABLED',
  reason?: string,
  durationDays?: number,
  appName = 'MarketX',
): { subject: string; html: string; text: string } {
  const messages: Record<
    string,
    { subject: string; detail: string; color: string; bg: string }
  > = {
    SUSPENDED: {
      subject: `⚠️ Your ${appName} account has been suspended`,
      detail: `Your account has been suspended for ${durationDays} day${durationDays !== 1 ? 's' : ''}${reason ? ` — ${reason}` : ''}. It will be automatically restored after this period.`,
      color: '#92400e',
      bg: '#fef3c7',
    },
    BANNED: {
      subject: `🚫 Your ${appName} account has been banned`,
      detail: `Your account has been permanently banned${reason ? `: ${reason}` : '. If you believe this is an error, please contact support.'}`,
      color: '#991b1b',
      bg: '#fee2e2',
    },
    DISABLED: {
      subject: `⚠️ Your ${appName} account has been disabled`,
      detail: `Your account has been disabled by an administrator${reason ? `: ${reason}` : '. Contact support if you believe this is an error.'}`,
      color: '#92400e',
      bg: '#fef3c7',
    },
    ENABLED: {
      subject: `✅ Your ${appName} account has been restored`,
      detail: `Your account has been re-enabled. You can now log in and access all features.`,
      color: '#166534',
      bg: '#dcfce7',
    },
  }
  const { subject, detail, color, bg } = messages[action]!
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:0}
.wrap{max-width:480px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden}
.hd{background:#e31837;padding:28px 32px;text-align:center}
.hd h1{color:#fff;margin:0;font-size:20px}
.bd{padding:32px}
.badge{display:inline-block;font-size:13px;background:${bg};color:${color};padding:4px 10px;border-radius:20px;margin-bottom:16px;font-weight:600}
p{font-size:15px;color:#333;line-height:1.6;margin:0 0 12px}
.ft{text-align:center;padding:16px;font-size:12px;color:#aaa}
</style></head><body>
<div class="wrap"><div class="hd"><h1>${appName}</h1></div>
<div class="bd"><span class="badge">Account ${action.charAt(0) + action.slice(1).toLowerCase()}</span>
<p>${detail}</p>
<p style="color:#888;font-size:13px">Questions? Contact our support team.</p>
</div><div class="ft">&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</div></div>
</body></html>`
  return { subject, html, text: `Account Update\n\n${detail}` }
}

export interface OrderEmailItem {
  title: string
  quantity: number
  priceKobo: number
  /** Absolute image URL (http(s)); anything else is skipped to avoid broken images. */
  image?: string
}

export interface OrderStatusEmailOptions {
  trackingNumber?: string
  shipper?: string
  appName?: string
  /** Link to the buyer's order page — powers the Track / View button. */
  orderUrl?: string
  items?: OrderEmailItem[]
  itemsTotalKobo?: number
  shippingKobo?: number
  shipTo?: { name?: string; address?: string; phone?: string }
  /** Carrier SMSes the buyer a PIN they must give the courier to collect (GIG).
   *  Set by the caller when the order ships with a carrier that does this. */
  deliveryPinNote?: boolean
}

const ngn = (kobo: number): string =>
  `₦${(Math.round(kobo) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function orderItemsHtml(items: OrderEmailItem[]): string {
  const rows = items
    .map((it) => {
      const img =
        it.image && /^https?:\/\//.test(it.image)
          ? `<td width="52" style="padding:0 12px 0 0;vertical-align:top"><img src="${it.image}" width="48" height="48" alt="" style="width:48px;height:48px;border-radius:8px;object-fit:cover;background:#f1f1f1;display:block"></td>`
          : ''
      return `<tr>
${img}
<td style="vertical-align:top;padding:8px 0">
  <div style="font-size:14px;color:#111;font-weight:600;line-height:1.3">${it.title}</div>
  <div style="font-size:12px;color:#888;margin-top:2px">Qty ${it.quantity}</div>
</td>
<td style="vertical-align:top;padding:8px 0;text-align:right;font-size:14px;color:#111;white-space:nowrap">${ngn(it.priceKobo)}</td>
</tr>`
    })
    .join('')
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eee;border-bottom:1px solid #eee;margin:8px 0 4px">${rows}</table>`
}

export function buildOrderStatusEmail(
  orderId: number,
  status: 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED',
  options: OrderStatusEmailOptions = {},
): { subject: string; html: string; text: string } {
  const {
    trackingNumber,
    shipper,
    appName = 'MarketX',
    orderUrl,
    items,
    itemsTotalKobo,
    shippingKobo,
    shipTo,
    deliveryPinNote,
  } = options

  const info: Record<
    string,
    { emoji: string; headline: string; detail: string; cta: string }
  > = {
    CONFIRMED: {
      emoji: '✅',
      headline: 'Order confirmed',
      detail:
        'The seller has confirmed your order and is preparing it for shipment.',
      cta: 'View order',
    },
    SHIPPED: {
      emoji: '📦',
      headline: 'Your order is on its way',
      detail: trackingNumber
        ? `It's been shipped${shipper ? ` with ${shipper}` : ''}. Track its progress any time — and funds release to the seller in 7 days unless you confirm delivery sooner.`
        : `It's been shipped. Funds release to the seller in 7 days unless you confirm delivery sooner.`,
      cta: 'Track order',
    },
    DELIVERED: {
      emoji: '🎉',
      headline: 'Delivered',
      detail:
        'Your order has been marked as delivered. If it arrived safely, confirm receipt to release the seller — we hope you love it!',
      cta: 'View order',
    },
    CANCELLED: {
      emoji: '❌',
      headline: 'Order cancelled',
      detail:
        'The seller has cancelled your order. If you were charged, the refund is on its way — contact support if you have questions.',
      cta: 'View order',
    },
  }
  const { emoji, headline, detail, cta } = info[status] ?? info.CONFIRMED!
  const subject = `${emoji} Order #${orderId} — ${headline}`

  const trackRow =
    trackingNumber && status === 'SHIPPED'
      ? `<p style="font-size:13px;color:#555;margin:0 0 16px"><strong>${shipper || 'Carrier'}</strong> · Tracking ${trackingNumber}</p>`
      : ''

  const button = orderUrl
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 20px"><tr><td style="border-radius:8px;background:#e31837"><a href="${orderUrl}" style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:600;color:#fff;text-decoration:none;border-radius:8px">${cta} →</a></td></tr></table>`
    : ''

  // Heads-up so the SMS PIN isn't a surprise at the door.
  const pinBlock =
    deliveryPinNote && status === 'SHIPPED'
      ? `<div style="margin:0 0 18px;padding:11px 13px;border-radius:8px;background:#fff7ed;color:#9a3412;font-size:13px;line-height:1.5">
🔐 <strong>You'll get a delivery PIN by SMS.</strong> When your parcel reaches the delivery point, ${shipper || 'the carrier'} texts you a PIN — give it to the courier to release your order. Keep it private until then.
</div>`
      : ''

  const itemsBlock = items?.length ? orderItemsHtml(items) : ''

  const totalsBlock = (() => {
    if (itemsTotalKobo == null && shippingKobo == null) return ''
    const subtotal = itemsTotalKobo ?? 0
    const shipping = shippingKobo ?? 0
    const total = subtotal + shipping
    const line = (label: string, val: string, bold = false) =>
      `<tr><td style="padding:2px 0;font-size:13px;color:${bold ? '#111' : '#666'};${bold ? 'font-weight:700' : ''}">${label}</td><td style="padding:2px 0;text-align:right;font-size:13px;color:${bold ? '#111' : '#666'};${bold ? 'font-weight:700' : ''}">${val}</td></tr>`
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 4px">
${itemsTotalKobo != null ? line('Subtotal', ngn(subtotal)) : ''}
${shippingKobo != null ? line('Shipping', shipping === 0 ? 'Free' : ngn(shipping)) : ''}
${line('Total', ngn(total), true)}
</table>`
  })()

  const shipBlock = shipTo?.address
    ? `<div style="margin-top:16px;padding-top:16px;border-top:1px solid #eee">
<div style="font-size:12px;color:#888;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px">Ship to</div>
<div style="font-size:14px;color:#111;font-weight:600">${shipTo.name ?? ''}</div>
<div style="font-size:13px;color:#555;line-height:1.5">${shipTo.address}</div>
${shipTo.phone ? `<div style="font-size:13px;color:#555">${shipTo.phone}</div>` : ''}
</div>`
    : ''

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
body{font-family:-apple-system,Segoe UI,Arial,sans-serif;background:#f4f4f5;margin:0;padding:0}
.wrap{max-width:520px;margin:32px auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #eee}
.hd{background:#e31837;padding:22px 32px}
.hd h1{color:#fff;margin:0;font-size:18px;letter-spacing:.02em}
.bd{padding:28px 32px}
.eyebrow{font-size:12px;color:#888;margin:0 0 6px}
.h2{font-size:20px;color:#111;font-weight:800;margin:0 0 8px}
.lead{font-size:15px;color:#444;line-height:1.6;margin:0 0 18px}
.ft{padding:20px 32px;font-size:12px;color:#999;border-top:1px solid #f0f0f0}
.ft a{color:#999}
</style></head><body>
<div class="wrap">
<div class="hd"><h1>${appName}</h1></div>
<div class="bd">
<p class="eyebrow">Order #${orderId}</p>
<p class="h2">${emoji} ${headline}</p>
<p class="lead">${detail}</p>
${trackRow}
${button}
${pinBlock}
${itemsBlock}
${totalsBlock}
${shipBlock}
</div>
<div class="ft">Questions about this order? Just reply to this email.<br>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</div>
</div>
</body></html>`

  const textLines = [
    `${emoji} ${headline} — Order #${orderId}`,
    '',
    detail,
    trackingNumber && status === 'SHIPPED'
      ? `Tracking: ${trackingNumber}${shipper ? ` (${shipper})` : ''}`
      : '',
    orderUrl ? `${cta}: ${orderUrl}` : '',
    deliveryPinNote && status === 'SHIPPED'
      ? `Delivery PIN: ${shipper || 'the carrier'} will SMS you a PIN on arrival — give it to the courier to release your order.`
      : '',
    itemsTotalKobo != null
      ? `Total: ${ngn((itemsTotalKobo ?? 0) + (shippingKobo ?? 0))}`
      : '',
  ].filter(Boolean)

  return { subject, html, text: textLines.join('\n') }
}

export function buildOrderCancelledSellerEmail(
  orderId: number,
  storeName: string,
  appName = 'MarketX',
): { subject: string; html: string; text: string } {
  const subject = `❌ Order #${orderId} has been cancelled`
  const detail = `Order #${orderId} placed at ${storeName} has been cancelled by the buyer. No action needed — stock has been automatically restored.`
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:0}
.wrap{max-width:480px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden}
.hd{background:#e31837;padding:28px 32px;text-align:center}
.hd h1{color:#fff;margin:0;font-size:20px}
.bd{padding:32px}
.badge{display:inline-block;font-size:13px;background:#fee2e2;color:#991b1b;padding:4px 10px;border-radius:20px;margin-bottom:16px}
p{font-size:15px;color:#333;line-height:1.6;margin:0 0 12px}
.ft{text-align:center;padding:16px;font-size:12px;color:#aaa}
</style></head><body>
<div class="wrap"><div class="hd"><h1>${appName}</h1></div>
<div class="bd"><span class="badge">Order #${orderId} cancelled</span>
<p>${detail}</p>
</div><div class="ft">&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</div></div>
</body></html>`
  return { subject, html, text: `Order #${orderId} Cancelled\n\n${detail}` }
}

export function buildReviewReceivedEmail(
  targetName: string,
  rating: number,
  reviewTitle?: string,
  appName = 'MarketX',
): { subject: string; html: string; text: string } {
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating)
  const subject = `New ${rating}-star review on ${targetName}`
  const detail = `You received a ${rating}-star review${reviewTitle ? ` titled "${reviewTitle}"` : ''} on ${targetName}.`
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:0}
.wrap{max-width:480px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden}
.hd{background:#e31837;padding:28px 32px;text-align:center}
.hd h1{color:#fff;margin:0;font-size:20px}
.bd{padding:32px}
.stars{font-size:28px;color:#f59e0b;letter-spacing:2px;margin:0 0 12px;display:block}
p{font-size:15px;color:#333;line-height:1.6;margin:0 0 12px}
.ft{text-align:center;padding:16px;font-size:12px;color:#aaa}
</style></head><body>
<div class="wrap"><div class="hd"><h1>${appName}</h1></div>
<div class="bd"><span class="stars">${stars}</span>
<p>${detail}</p>
</div><div class="ft">&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</div></div>
</body></html>`
  return { subject, html, text: `New Review: ${stars}\n\n${detail}` }
}

export function buildNewConversationEmail(
  senderName: string,
  productTitle?: string,
  appName = 'MarketX',
): { subject: string; html: string; text: string } {
  const subject = `New message from ${senderName}${productTitle ? ` about "${productTitle}"` : ''}`
  const detail = `${senderName} started a conversation with you${productTitle ? ` about "${productTitle}"` : ''}. Open the app to reply.`
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:0}
.wrap{max-width:480px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden}
.hd{background:#e31837;padding:28px 32px;text-align:center}
.hd h1{color:#fff;margin:0;font-size:20px}
.bd{padding:32px}
p{font-size:15px;color:#333;line-height:1.6;margin:0}
.ft{text-align:center;padding:16px;font-size:12px;color:#aaa}
</style></head><body>
<div class="wrap"><div class="hd"><h1>${appName}</h1></div>
<div class="bd"><p>💬 ${detail}</p></div>
<div class="ft">&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</div></div>
</body></html>`
  return { subject, html, text: `New message from ${senderName}\n\n${detail}` }
}

export function buildContentModerationEmail(
  action: 'WARNED' | 'HIDDEN' | 'REMOVED',
  contentType: 'POST' | 'PRODUCT' | 'COMMENT',
  reason?: string,
  appName = 'MarketX',
): { subject: string; html: string; text: string } {
  const label = contentType.charAt(0) + contentType.slice(1).toLowerCase()
  const info = {
    WARNED: {
      subject: `⚠️ Your ${label} has received a warning`,
      detail: `Your ${label.toLowerCase()} has received a warning from our moderation team${reason ? `: ${reason}` : '. Please review our community guidelines.'}`,
      color: '#92400e',
      bg: '#fef3c7',
      badge: '⚠️ Warning',
    },
    HIDDEN: {
      subject: `👁 Your ${label} has been hidden`,
      detail: `Your ${label.toLowerCase()} has been hidden from public view${reason ? `: ${reason}` : '. It will not be visible to other users.'}`,
      color: '#1e40af',
      bg: '#dbeafe',
      badge: '👁 Hidden',
    },
    REMOVED: {
      subject: `🚫 Your ${label} has been removed`,
      detail: `Your ${label.toLowerCase()} has been removed for violating our community guidelines${reason ? `: ${reason}` : '.'}`,
      color: '#991b1b',
      bg: '#fee2e2',
      badge: '🚫 Removed',
    },
  }
  const { subject, detail, color, bg, badge } = info[action]
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
                  body{font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:0}
                    .wrap{max-width:480px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden}
                    .hd{background:#e31837;padding:28px 32px;text-align:center}
                    .hd h1{color:#fff;margin:0;font-size:20px}
                    .bd{padding:32px}
                    .badge{display:inline-block;font-size:13px;background:${bg};color:${color};padding:4px 10px;border-radius:20px;margin-bottom:16px;font-weight:600}
                    p{font-size:15px;color:#333;line-height:1.6;margin:0 0 12px}
                    .ft{text-align:center;padding:16px;font-size:12px;color:#aaa}
                    </style></head><body>
                    <div class="wrap"><div class="hd"><h1>${appName}</h1></div>
                    <div class="bd"><span class="badge">${badge}</span>
                    <p>${detail}</p>
                    <p style="color:#888;font-size:13px">If you believe this was a mistake, please contact our support team.</p>
                    </div><div class="ft">&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</div></div>
                  </body></html>`
  return { subject, html, text: `Content Moderation Notice\n\n${detail}` }
}

export function buildRoleChangeEmail(
  role: string,
  appName = 'MarketX',
): { subject: string; html: string; text: string } {
  const isPromotion =
    role === 'moderator' || role === 'admin' || role === 'support_agent'
  const roleLabel =
    role === 'moderator' ? 'Moderator'
    : role === 'admin' ? 'Admin'
    : role === 'support_agent' ? 'Support Agent'
    : 'User'
  const subject = isPromotion
    ? `🎉 You've been granted ${roleLabel} access on ${appName}`
    : `Your ${appName} role has been updated`
  const detail = isPromotion
    ? `Congratulations! You have been granted ${roleLabel} access on ${appName}. You now have access to additional tools and responsibilities to help keep our community safe and thriving.`
    : `Your account role has been updated to ${roleLabel}. If you have questions about this change, please contact support.`
  const color = isPromotion ? '#166534' : '#92400e'
  const bg = isPromotion ? '#dcfce7' : '#fef3c7'
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:0}
.wrap{max-width:480px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden}
.hd{background:#e31837;padding:28px 32px;text-align:center}
.hd h1{color:#fff;margin:0;font-size:20px}
.bd{padding:32px}
.badge{display:inline-block;font-size:13px;background:${bg};color:${color};padding:4px 10px;border-radius:20px;margin-bottom:16px;font-weight:600}
p{font-size:15px;color:#333;line-height:1.6;margin:0 0 12px}
.ft{text-align:center;padding:16px;font-size:12px;color:#aaa}
</style></head><body>
<div class="wrap"><div class="hd"><h1>${appName}</h1></div>
<div class="bd"><span class="badge">${isPromotion ? '🎉' : '🔄'} ${roleLabel}</span>
<p>${detail}</p>
</div><div class="ft">&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</div></div>
</body></html>`
  return { subject, html, text: `Role Update\n\n${detail}` }
}

export function buildSuspensionLiftedEmail(appName = 'MarketX'): {
  subject: string
  html: string
  text: string
} {
  const subject = `✅ Your ${appName} suspension has been lifted`
  const detail = `Your account suspension has been lifted and your account is now fully restored. Welcome back!`
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:0}
.wrap{max-width:480px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden}
.hd{background:#e31837;padding:28px 32px;text-align:center}
.hd h1{color:#fff;margin:0;font-size:20px}
.bd{padding:32px}
.badge{display:inline-block;font-size:13px;background:#dcfce7;color:#166534;padding:4px 10px;border-radius:20px;margin-bottom:16px;font-weight:600}
p{font-size:15px;color:#333;line-height:1.6;margin:0 0 12px}
.ft{text-align:center;padding:16px;font-size:12px;color:#aaa}
</style></head><body>
<div class="wrap"><div class="hd"><h1>${appName}</h1></div>
<div class="bd"><span class="badge">✅ Suspension Lifted</span>
<p>${detail}</p>
<p style="color:#888;font-size:13px">Please remember to follow our community guidelines going forward.</p>
</div><div class="ft">&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</div></div>
</body></html>`
  return { subject, html, text: `Account Restored\n\n${detail}` }
}

// ── Support / disputes ───────────────────────────────────────────────────────

/** Acknowledgement when a ticket is created (works for guest emails too). */
export function buildSupportTicketCreatedEmail(
  ref: string,
  subjectLine: string,
  appName = 'MarketX',
): { subject: string; html: string; text: string } {
  const subject = `[${ref}] We've received your request`
  const detail = `Thanks for reaching out. Your support ticket <strong>${ref}</strong> — "${subjectLine}" — has been logged. Our team typically replies within 24 hours. You can reply to this email or track it in the app.`
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:0}
.wrap{max-width:480px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden}
.hd{background:#e31837;padding:28px 32px;text-align:center}
.hd h1{color:#fff;margin:0;font-size:20px}
.bd{padding:32px}
.badge{display:inline-block;font-size:13px;background:#e0f2fe;color:#075985;padding:4px 10px;border-radius:20px;margin-bottom:16px;font-weight:600}
p{font-size:15px;color:#333;line-height:1.6;margin:0 0 12px}
.ft{text-align:center;padding:16px;font-size:12px;color:#aaa}
</style></head><body>
<div class="wrap"><div class="hd"><h1>${appName} Support</h1></div>
<div class="bd"><span class="badge">🎫 ${ref}</span>
<p>${detail}</p>
</div><div class="ft">&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</div></div>
</body></html>`
  return {
    subject,
    html,
    text: `We've received your request (${ref})\n\n${subjectLine}\n\nOur team typically replies within 24 hours.`,
  }
}

/** An agent replied, or the ticket status/resolution changed. */
export function buildSupportReplyEmail(
  ref: string,
  message: string,
  appName = 'MarketX',
): { subject: string; html: string; text: string } {
  const subject = `[${ref}] New reply from ${appName} Support`
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:0}
.wrap{max-width:480px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden}
.hd{background:#e31837;padding:28px 32px;text-align:center}
.hd h1{color:#fff;margin:0;font-size:20px}
.bd{padding:32px}
.badge{display:inline-block;font-size:13px;background:#f1f5f9;color:#334155;padding:4px 10px;border-radius:20px;margin-bottom:16px;font-weight:600}
.quote{border-left:3px solid #e31837;padding:4px 0 4px 14px;color:#444;font-size:15px;line-height:1.6;margin:0 0 12px}
.ft{text-align:center;padding:16px;font-size:12px;color:#aaa}
</style></head><body>
<div class="wrap"><div class="hd"><h1>${appName} Support</h1></div>
<div class="bd"><span class="badge">🎫 ${ref}</span>
<div class="quote">${message.replace(/\n/g, '<br>')}</div>
</div><div class="ft">&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</div></div>
</body></html>`
  return { subject, html, text: `New reply on ${ref}\n\n${message}` }
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(
  email: string,
  userName: string = 'User',
  appName?: string,
): Promise<{ id: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
          .header { text-align: center; margin-bottom: 20px; }
          .header h1 { color: #333; margin: 0; }
          .content { margin: 20px 0; line-height: 1.6; color: #555; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to ${appName}!</h1>
          </div>
          
          <div class="content">
            <p>Hi ${userName},</p>
            
            <p>Thank you for joining ${appName}! We're excited to have you in our community.</p>
            
            <p>You can now:</p>
            <ul>
              <li>Browse our curated fashion collections</li>
              <li>Connect with sellers worldwide</li>
              <li>Express your unique style</li>
            </ul>
            
            <p>If you have any questions, feel free to reach out to our support team.</p>
            
            <p>Happy shopping!</p>
          </div>
          
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} MarketX. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: `Welcome to ${appName}, ${userName}!`,
    html,
    text: `Welcome to ${appName}, ${userName}! Happy shopping!`,
  })
}
