<template>
  <BaseDropdownMenu v-model="open" placement="right" width="md">
    <template #trigger="{ toggle }">
      <BaseButton
        variant="icon"
        size="sm"
        aria-label="User actions"
        icon-left="mdi:dots-horizontal"
        @click="toggle"
      />
    </template>
    <template #default>
        <!-- Account state -->
        <button
          v-if="!user.isActive"
          class="flex w-full items-center gap-2 px-3 py-2 text-green-600 transition-colors hover:bg-green-50 dark:hover:bg-green-900/20"
          @click="toggleActive(true)"
        >
          <Icon name="mdi:account-check-outline" size="15" /> Enable account
        </button>
        <button
          v-else-if="!isBanned && !isSuspended"
          class="flex w-full items-center gap-2 px-3 py-2 text-gray-600 transition-colors hover:bg-gray-50 dark:text-neutral-400 dark:hover:bg-neutral-800"
          @click="toggleActive(false)"
        >
          <Icon name="mdi:account-off-outline" size="15" /> Disable account
        </button>

        <button
          v-if="!isBanned && !isSuspended && user.isActive"
          class="flex w-full items-center gap-2 px-3 py-2 text-amber-600 transition-colors hover:bg-amber-50 dark:hover:bg-amber-900/20"
          @click="openSuspend(false)"
        >
          <Icon name="mdi:clock-outline" size="15" /> Suspend
        </button>
        <button
          v-if="!isBanned"
          class="flex w-full items-center gap-2 px-3 py-2 text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
          @click="openSuspend(true)"
        >
          <Icon name="mdi:ban" size="15" /> Ban permanently
        </button>
        <button
          v-if="isBanned || isSuspended"
          class="flex w-full items-center gap-2 px-3 py-2 text-green-600 transition-colors hover:bg-green-50 dark:hover:bg-green-900/20"
          @click="lift"
        >
          <Icon name="mdi:account-check-outline" size="15" /> Lift suspension
        </button>

        <!-- Role -->
        <div class="mx-3 my-1 h-px bg-gray-100 dark:bg-neutral-800" />
        <p class="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-neutral-600">
          Role
        </p>
        <button
          v-for="r in availableRoles"
          :key="r.value"
          class="flex w-full items-center gap-2 px-3 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800"
          :class="r.value === 'admin' ? 'text-rose-600 dark:text-rose-400' : r.value === 'support_agent' ? 'text-sky-600 dark:text-sky-400' : 'text-gray-600 dark:text-neutral-400'"
          @click="changeRole(r.value)"
        >
          <Icon :name="r.icon" size="15" />
          {{ r.label }}
        </button>
    </template>
  </BaseDropdownMenu>

  <!-- Suspend / Ban modal -->
  <BaseModal
    v-model="showModal"
    :title="`${permanentBan ? 'Permanently ban' : 'Suspend'} @${user.username}`"
    max-width="sm"
    :persistent="submitting"
  >
    <div class="space-y-3">
      <BaseInput
        v-if="!permanentBan"
        v-model="durationDays"
        type="number"
        min="1"
        max="365"
        label="Duration (days)"
        size="sm"
      />
      <BaseTextarea
        v-model="reason"
        rows="3"
        label="Reason"
        placeholder="Describe the reason..."
        resize="none"
        size="sm"
      />
    </div>

    <template #footer>
      <div class="flex gap-2">
        <BaseButton
          variant="secondary"
          size="sm"
          class="flex-1"
          :disabled="submitting"
          @click="showModal = false"
        >
          Cancel
        </BaseButton>
        <BaseButton
          variant="danger"
          size="sm"
          class="flex-1"
          :loading="submitting"
          :disabled="!reason.trim() || submitting"
          @click="confirmSuspend"
        >
          {{ submitting ? 'Saving...' : 'Confirm' }}
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { useProfileStore } from '~~/layers/profile/app/stores/profile.store'
import { useAdminApi } from '~~/layers/admin/app/services/admin.api'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import BaseDropdownMenu from '~~/layers/ui/app/components/BaseDropdownMenu.vue'
import BaseInput from '~~/layers/ui/app/components/BaseInput.vue'
import BaseModal from '~~/layers/ui/app/components/BaseModal.vue'
import BaseTextarea from '~~/layers/ui/app/components/BaseTextarea.vue'

const props = defineProps<{ user: any }>()
const emit = defineEmits<{ updated: [] }>()

const open = ref(false)
const showModal = ref(false)
const permanentBan = ref(false)
const durationDays = ref(7)
const reason = ref('')
const submitting = ref(false)

const adminApi = useAdminApi()
const profileStore = useProfileStore()
const isAdmin = computed(() => profileStore.me?.role === 'admin')

const isBanned = computed(() => !!props.user.bannedAt)
const isSuspended = computed(
  () => props.user.suspendedUntil && new Date(props.user.suspendedUntil) > new Date(),
)

type RoleValue = 'user' | 'moderator' | 'admin' | 'support_agent'

const ROLE_OPTIONS: Record<string, { label: string; icon: string; value: RoleValue }[]> = {
  user: [
    { label: 'Promote to Moderator', icon: 'mdi:shield-account-outline', value: 'moderator' },
  ],
  moderator: [
    { label: 'Demote to User', icon: 'mdi:account-outline', value: 'user' },
  ],
  support_agent: [
    { label: 'Remove agent role', icon: 'mdi:account-outline', value: 'user' },
  ],
  admin: [],
}

const availableRoles = computed(() => {
  const base = ROLE_OPTIONS[props.user.role] ?? []
  // Granting privileged roles is admin-only (matches the requireAdmin endpoint).
  if (!isAdmin.value || props.user.role === 'admin') return base

  const extra: { label: string; icon: string; value: RoleValue }[] = []
  // Support agent is orthogonal to moderator/admin — offer it to anyone not already one.
  if (props.user.role !== 'support_agent') {
    extra.push({ label: 'Make Support Agent', icon: 'mdi:headset', value: 'support_agent' })
  }
  extra.push({ label: 'Promote to Admin', icon: 'mdi:shield-crown-outline', value: 'admin' })
  return [...base, ...extra]
})

function openSuspend(ban: boolean) {
  permanentBan.value = ban
  reason.value = ''
  durationDays.value = 7
  open.value = false
  showModal.value = true
}

async function confirmSuspend() {
  submitting.value = true
  try {
    await adminApi.suspendUser(props.user.id, {
      reason: reason.value,
      durationDays: permanentBan.value ? undefined : durationDays.value,
    })
    showModal.value = false
    emit('updated')
  } catch {
  } finally {
    submitting.value = false
  }
}

async function lift() {
  open.value = false
  try {
    await adminApi.unsuspendUser(props.user.id)
    emit('updated')
  } catch {}
}

async function toggleActive(isActive: boolean) {
  open.value = false
  try {
    await adminApi.toggleUserActive(props.user.id, isActive)
    emit('updated')
  } catch {}
}

async function changeRole(role: RoleValue) {
  open.value = false
  try {
    await adminApi.setUserRole(props.user.id, role)
    emit('updated')
  } catch {}
}
</script>
