/**
 * Generic ops alerting — send a message to whichever channels are configured
 * via env vars. Used by auth monitoring (authMonitoring.ts) and BullMQ
 * permanent-failure alerts (queueAlerts.ts). Add new integrations here so
 * every caller gets them for free.
 */

export type AlertSeverity = 'info' | 'warning' | 'critical'

export async function sendAlert(message: string, severity: AlertSeverity) {
  // Slack
  if (process.env.SLACK_WEBHOOK_URL) {
    try {
      const color = {
        info: '#36a64f',
        warning: '#ff9900',
        critical: '#ff0000',
      }[severity]

      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attachments: [
            {
              color,
              title: `MarketX Alert - ${severity.toUpperCase()}`,
              text: message,
              ts: Math.floor(Date.now() / 1000),
            },
          ],
        }),
      })
    } catch (error) {
      console.error('Failed to send Slack alert:', error)
    }
  }

  // DataDog
  if (process.env.DATADOG_API_KEY) {
    try {
      await fetch('https://api.datadoghq.com/api/v1/events', {
        method: 'POST',
        headers: {
          'DD-API-KEY': process.env.DATADOG_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'MarketX Alert',
          text: message,
          priority: severity === 'critical' ? 'high' : 'normal',
          alert_type: severity === 'critical' ? 'error' : 'info',
          tags: ['marketx'],
        }),
      })
    } catch (error) {
      console.error('Failed to send DataDog alert:', error)
    }
  }

  // PagerDuty
  if (process.env.PAGERDUTY_INTEGRATION_KEY) {
    try {
      await fetch('https://events.pagerduty.com/v2/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routing_key: process.env.PAGERDUTY_INTEGRATION_KEY,
          event_action: severity === 'critical' ? 'trigger' : 'info',
          payload: {
            summary: message,
            severity,
            source: 'marketx',
            custom_details: { message },
          },
        }),
      })
    } catch (error) {
      console.error('Failed to send PagerDuty alert:', error)
    }
  }

  // Console fallback — always fires, so alerts are never silently dropped
  // even when no channel is configured yet.
  console.error(`[${severity.toUpperCase()}] ${message}`)
}
