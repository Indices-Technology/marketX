// server/plugins/monitoring.ts
/**
 * Auth Monitoring Plugin
 *
 * Starts monitoring checks on server boot
 * Collects metrics and sends alerts
 */

import { startMonitoring } from '../utils/monitoring/authMonitoring'

export default defineNitroPlugin(() => {
  // Only run in production or if explicitly enabled
  if (
    process.env.NODE_ENV === 'production' ||
    process.env.ENABLE_MONITORING === 'true'
  ) {
    // Hourly, not every 5 minutes. The database is billed for time spent awake
    // and suspends after ~5 minutes of inactivity, so a 5-minute heartbeat sat
    // exactly on that threshold and kept the compute running 24 hours a day for
    // an app that is busy far less than that. Hourly lets it sleep between
    // checks, and lands in the same window as the POD reminder cron so the two
    // share one wake-up instead of taking one each.
    //
    // These metrics are 24-hour rolling totals compared against daily
    // thresholds, so checking twelve times less often costs almost no
    // sensitivity. Set MONITORING_INTERVAL_MINUTES if you want it tighter.
    const intervalMinutes = process.env.MONITORING_INTERVAL_MINUTES
      ? parseInt(process.env.MONITORING_INTERVAL_MINUTES, 10)
      : 60

    console.log(
      `🔍 Starting auth monitoring (checks every ${intervalMinutes} minutes)`,
    )

    startMonitoring(intervalMinutes)
  } else {
    console.log(
      'ℹ️  Auth monitoring disabled (set NODE_ENV=production or ENABLE_MONITORING=true to enable)',
    )
  }
})
