<template>
  <div class="relative" ref="root">
    <button
      class="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
      @click="open = !open"
    >
      <Icon name="mdi:dots-horizontal" size="16" />
    </button>

    <Transition name="fade">
      <div
        v-if="open"
        class="absolute right-0 top-8 z-20 w-52 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 text-[13px] shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
      >
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
          :class="r.value === 'admin' ? 'text-rose-600 dark:text-rose-400' : 'text-gray-600 dark:text-neutral-400'"
          @click="changeRole(r.value)"
        >
          <Icon :name="r.icon" size="15" />
          {{ r.label }}
        </button>
      </div>
    </Transition>
  </div>

  <!-- Suspend / Ban modal -->
  <Teleport to="body">
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div class="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-2xl dark:bg-neutral-900">
        <h3 class="font-bold text-gray-900 dark:text-neutral-100">
          {{ permanentBan ? 'Permanently ban' : 'Suspend' }} @{{ user.username }}
        </h3>
        <div class="space-y-3">
          <div v-if="!permanentBan" class="space-y-1">
            <label class="text-[12px] font-medium text-gray-600 dark:text-neutral-400">Duration (days)</label>
            <input
              v-model.number="durationDays"
              type="number"
              min="1"
              max="365"
              class="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-rose-400 dark:border-neutral-700 dark:bg-neutral-800"
            />
          </div>
          <div class="space-y-1">
            <label class="text-[12px] font-medium text-gray-600 dark:text-neutral-400">Reason</label>
            <textarea
              v-model="reason"
              rows="3"
              placeholder="Describe the reason…"
              class="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-rose-400 dark:border-neutral-700 dark:bg-neutral-800"
            />
          </div>
        </div>
        <div class="flex gap-2">
          <button
            class="flex-1 rounded-xl border border-gray-200 py-2 text-[13px] dark:border-neutral-700"
            @click="showModal = false"
          >
            Cancel
          </button>
          <button
            :disabled="!reason.trim() || submitting"
            class="flex-1 rounded-xl bg-rose-500 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-rose-600 disabled:opacity-50"
            @click="confirmSuspend"
          >
            {{ submitting ? 'Saving…' : 'Confirm' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import { useProfileStore } from '~~/layers/profile/app/stores/profile.store'
import { useAdminApi } from '~~/layers/admin/app/services/admin.api'

const props = defineProps<{ user: any }>()
const emit = defineEmits<{ updated: [] }>()

const open = ref(false)
const showModal = ref(false)
const permanentBan = ref(false)
const durationDays = ref(7)
const reason = ref('')
const submitting = ref(false)
const root = ref<HTMLElement | null>(null)

const adminApi = useAdminApi()
const profileStore = useProfileStore()
const isAdmin = computed(() => profileStore.me?.role === 'admin')

const isBanned = computed(() => !!props.user.bannedAt)
const isSuspended = computed(
  () => props.user.suspendedUntil && new Date(props.user.suspendedUntil) > new Date(),
)

const ROLE_OPTIONS: Record<string, { label: string; icon: string }[]> = {
  user: [
    { label: 'Promote to Moderator', icon: 'mdi:shield-account-outline', value: 'moderator' } as any,
  ],
  moderator: [
    { label: 'Demote to User', icon: 'mdi:account-outline', value: 'user' } as any,
  ],
  admin: [],
}

const availableRoles = computed(() => {
  const base = ROLE_OPTIONS[props.user.role] ?? []
  if (isAdmin.value && props.user.role !== 'admin') {
    if (props.user.role === 'user') {
      return [...base, { label: 'Promote to Admin', icon: 'mdi:shield-crown-outline', value: 'admin' }]
    }
    if (props.user.role === 'moderator') {
      return [...base, { label: 'Promote to Admin', icon: 'mdi:shield-crown-outline', value: 'admin' }]
    }
  }
  return base
})

onClickOutside(root, () => { open.value = false })

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

async function changeRole(role: 'user' | 'moderator' | 'admin') {
  open.value = false
  try {
    await adminApi.setUserRole(props.user.id, role)
    emit('updated')
  } catch {}
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s, transform 0.15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
