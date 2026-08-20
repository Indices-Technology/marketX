// server/utils/monitoring/authMonitoring.ts
/**
 * Auth Layer Monitoring & Alerting
 * Tracks security metrics and triggers alerts
 */

import { prisma } from '../db'
import { sendAlert } from './alerts'

export interface AuthMetrics {
  failedLogins24h: number
  accountLockouts24h: number
  registrations24h: number
  passwordResets24h: number
  suspiciousActivities24h: number
  averageLoginTime: number
  authEndpointErrors: number
}

export interface AlertThreshold {
  failedLoginsPerHour: number // Alert if exceeded
  accountLockoutsPerDay: number
  suspiciousActivitiesPerDay: number
  errorRatePercent: number
  loginLatencyMs: number
}

// Default alert thresholds (adjust based on your app size)
export const defaultThresholds: AlertThreshold = {
  failedLoginsPerHour: 20,
  accountLockoutsPerDay: 50,
  suspiciousActivitiesPerDay: 10,
  errorRatePercent: 5,
  loginLatencyMs: 150,
}

/**
 * Get auth metrics for the last 24 hours.
 *
 * One grouped scan, not one COUNT per event type. This runs on a timer in
 * production (server/plugins/monitoring.ts), so five separate counts over an
 * append-only audit table was five times the billed work, forever, whether or
 * not anything had happened.
 */
export async function getAuthMetrics(): Promise<AuthMetrics> {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const TRACKED = [
    'LOGIN_FAILED',
    'ACCOUNT_LOCKED',
    'REGISTER_SUCCESS',
    'PASSWORD_RESET_SUCCESS',
    'SUSPICIOUS_ACTIVITY',
  ] as const

  const grouped = await prisma.auditLog.groupBy({
    by: ['event_type'],
    where: { event_type: { in: [...TRACKED] }, created_at: { gte: last24h } },
    _count: { _all: true },
  })

  const tally = (type: (typeof TRACKED)[number]) =>
    grouped.find((g) => g.event_type === type)?._count._all ?? 0

  return {
    failedLogins24h: tally('LOGIN_FAILED'),
    accountLockouts24h: tally('ACCOUNT_LOCKED'),
    registrations24h: tally('REGISTER_SUCCESS'),
    passwordResets24h: tally('PASSWORD_RESET_SUCCESS'),
    suspiciousActivities24h: tally('SUSPICIOUS_ACTIVITY'),
    averageLoginTime: 75, // Would come from tracing/monitoring service
    authEndpointErrors: 0, // Would come from error tracking service
  }
}

/**
 * Check if metrics exceed thresholds and trigger alerts
 */
export async function checkAlerts(
  thresholds: AlertThreshold = defaultThresholds,
): Promise<string[]> {
  const alerts: string[] = []
  const metrics = await getAuthMetrics()
  const now = new Date()

  // Check failed logins
  const failedLoginsPerHour = Math.ceil(metrics.failedLogins24h / 24)
  if (failedLoginsPerHour > thresholds.failedLoginsPerHour) {
    alerts.push(
      `🚨 HIGH FAILED LOGINS: ${failedLoginsPerHour}/hour (threshold: ${thresholds.failedLoginsPerHour})`,
    )
  }

  // Check account lockouts
  if (metrics.accountLockouts24h > thresholds.accountLockoutsPerDay) {
    alerts.push(
      `🚨 EXCESSIVE LOCKOUTS: ${metrics.accountLockouts24h}/day (threshold: ${thresholds.accountLockoutsPerDay})`,
    )
  }

  // Check suspicious activities
  if (metrics.suspiciousActivities24h > thresholds.suspiciousActivitiesPerDay) {
    alerts.push(
      `🔴 SUSPICIOUS ACTIVITY: ${metrics.suspiciousActivities24h}/day (threshold: ${thresholds.suspiciousActivitiesPerDay})`,
    )
  }

  // Check login latency
  if (metrics.averageLoginTime > thresholds.loginLatencyMs) {
    alerts.push(
      `⚠️ HIGH LATENCY: ${metrics.averageLoginTime}ms (threshold: ${thresholds.loginLatencyMs}ms)`,
    )
  }

  return alerts
}

/**
 * Get detailed suspicious activity report
 */
export async function getSuspiciousActivityReport(hours: number = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000)

  // Multiple failed logins from same IP
  const suspiciousIPs = (await prisma.$queryRaw`
    SELECT 
      ip_address,
      COUNT(*) as attempt_count,
      COUNT(DISTINCT email) as unique_emails,
      MAX(created_at) as last_attempt
    FROM "AuditLog"
    WHERE 
      event_type = 'LOGIN_FAILED'
      AND created_at >= $1
      AND ip_address IS NOT NULL
    GROUP BY ip_address
    HAVING COUNT(*) > 10
    ORDER BY attempt_count DESC
    LIMIT 20
  `) as any[]

  // Multiple account lockouts
  const frequentLockouts = (await prisma.$queryRaw`
    SELECT 
      email,
      COUNT(*) as lockout_count,
      MAX(created_at) as last_lockout
    FROM "AuditLog"
    WHERE 
      event_type = 'ACCOUNT_LOCKED'
      AND created_at >= $1
    GROUP BY email
    HAVING COUNT(*) > 2
    ORDER BY lockout_count DESC
    LIMIT 10
  `) as any[]

  // Multiple emails from same IP
  const emailSpamming = (await prisma.$queryRaw`
    SELECT 
      ip_address,
      COUNT(DISTINCT email) as unique_emails,
      COUNT(*) as total_attempts,
      MAX(created_at) as last_attempt
    FROM "AuditLog"
    WHERE 
      event_type IN ('REGISTER_FAILED', 'LOGIN_FAILED')
      AND created_at >= $1
      AND ip_address IS NOT NULL
    GROUP BY ip_address
    HAVING COUNT(DISTINCT email) > 5
    ORDER BY unique_emails DESC
    LIMIT 10
  `) as any[]

  return {
    reportTime: new Date(),
    timeframe: `${hours} hours`,
    suspiciousIPs,
    frequentLockouts,
    emailSpamming,
  }
}

/**
 * Run periodic monitoring checks
 * Call this every 5 minutes in a scheduled job
 */
export async function runMonitoringChecks() {
  try {
    const alerts = await checkAlerts()

    // Send alerts
    for (const alert of alerts) {
      const severity = alert.includes('🔴')
        ? 'critical'
        : alert.includes('🚨')
          ? 'warning'
          : 'info'
      await sendAlert(alert, severity as any)
    }

    // Get suspicious activity report if there are critical alerts
    if (alerts.some((a) => a.includes('🔴'))) {
      const report = await getSuspiciousActivityReport(1) // Last hour
      console.log(
        'Suspicious Activity Report:',
        JSON.stringify(report, null, 2),
      )
    }
  } catch (error) {
    console.error('Monitoring check failed:', error)
  }
}

/**
 * Setup scheduled monitoring
 * Add to your app initialization
 */
export function startMonitoring(intervalMinutes: number = 60) {
  // Deliberately no check on boot. These are 24-hour rolling metrics, so an
  // immediate run tells you nothing a run one interval later won't — and on a
  // platform that starts and stops instances, "on every cold start" is a
  // surprising amount of database traffic for something with nothing new to
  // report. Short-lived instances now cost zero monitoring queries.
  setInterval(runMonitoringChecks, intervalMinutes * 60 * 1000)

  console.log(
    `✅ Auth monitoring started (checks every ${intervalMinutes} min)`,
  )
}
