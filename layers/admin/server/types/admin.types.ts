import type {
  ModerationStatus,
  ReportReason,
  ReportStatus,
  ContentType,
  ModerationAction,
} from '@prisma/client'

export interface IReport {
  id: string
  reporterId: string
  contentType: ContentType
  contentId: string
  reason: ReportReason
  note: string | null
  status: ReportStatus
  moderatorId: string | null
  moderatorNote: string | null
  action: ModerationAction | null
  createdAt: Date
  resolvedAt: Date | null
  reporter: { id: string; username: string | null; avatar: string | null }
  moderator?: { id: string; username: string | null } | null
}

export interface IResolveReportBody {
  action: ModerationAction
  moderatorNote?: string
}

export interface ISuspendUserBody {
  reason: string
  durationDays?: number // omit for permanent ban
}

export interface IModerateContentBody {
  status: ModerationStatus
  reason?: string
}

export interface IAdminStats {
  pendingReports: number
  resolvedToday: number
  activeUsers: number
  activeSellers: number
  bannedUsers: number
  flaggedContent: number
}
