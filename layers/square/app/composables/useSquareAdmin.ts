import { computed } from 'vue'
import type { Ref } from 'vue'
import { useProfileStore } from '~~/layers/profile/app/stores/profile.store'

type OfficerRole = 'CHAIRMAN' | 'SECRETARY' | 'TREASURER' | 'MODERATOR' | 'GOVT_REP' | null

interface SquareContext {
  isOfficer: boolean
  officerRole: OfficerRole
}

/**
 * Role-capability guard for square admin pages.
 * Pass the square ref (from getSquare API) which already carries
 * isOfficer and officerRole for the authenticated user.
 */
export const useSquareAdmin = (square: Ref<SquareContext | null | undefined>) => {
  const profileStore = useProfileStore()

  const isSuperUser = computed(() => profileStore.me?.role === 'admin')
  const role = computed(() => square.value?.officerRole ?? null)

  const isChairman  = computed(() => role.value === 'CHAIRMAN')
  const isSecretary = computed(() => role.value === 'SECRETARY')
  const isModerator = computed(() => role.value === 'MODERATOR')
  const isTreasurer = computed(() => role.value === 'TREASURER')
  const isGovtRep   = computed(() => role.value === 'GOVT_REP')

  /** Can accept/reject join requests or suspend/remove members */
  const canManageMembers = computed(
    () => isSuperUser.value || isChairman.value || isSecretary.value,
  )

  /** Can edit square name, description, banner, rules */
  const canEditSettings = computed(() => isSuperUser.value || isChairman.value)

  /** Can appoint or remove officers */
  const canManageOfficers = computed(() => isSuperUser.value || isChairman.value)

  /** Can delete or pin posts within the square */
  const canModeratePosts = computed(
    () => isSuperUser.value || isChairman.value || isModerator.value,
  )

  /** Can view the association wallet and initiate payouts */
  const canViewFinances = computed(
    () => isSuperUser.value || isChairman.value || isTreasurer.value,
  )

  /** Any admin access at all — used to show/hide the Admin button */
  const hasAnyAdminAccess = computed(
    () => isSuperUser.value || !!square.value?.isOfficer,
  )

  return {
    isSuperUser,
    isChairman,
    isSecretary,
    isModerator,
    isTreasurer,
    isGovtRep,
    canManageMembers,
    canEditSettings,
    canManageOfficers,
    canModeratePosts,
    canViewFinances,
    hasAnyAdminAccess,
  }
}
