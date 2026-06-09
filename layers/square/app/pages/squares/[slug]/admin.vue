<template>
  <div class="min-h-screen bg-gray-50 dark:bg-neutral-950">
    <!-- Loading -->
    <div v-if="loadingSquare" class="flex min-h-screen items-center justify-center">
      <Icon name="mdi:loading" size="32" class="animate-spin text-brand" />
    </div>

    <!-- Access denied -->
    <div
      v-else-if="!hasAnyAdminAccess"
      class="flex min-h-screen flex-col items-center justify-center gap-4 text-center"
    >
      <Icon name="mdi:shield-lock-outline" size="48" class="text-gray-300 dark:text-neutral-700" />
      <p class="text-lg font-semibold text-gray-700 dark:text-neutral-300">Access denied</p>
      <p class="text-sm text-gray-500 dark:text-neutral-500">You need to be an officer of this square.</p>
      <NuxtLink :to="`/squares/${slug}`" class="text-sm font-medium text-brand hover:underline">
        Back to square
      </NuxtLink>
    </div>

    <template v-else>
      <!-- Header -->
      <div class="border-b border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div class="mx-auto max-w-4xl px-4 py-4">
          <div class="flex items-center gap-3">
            <NuxtLink
              :to="`/squares/${slug}`"
              class="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              <Icon name="mdi:arrow-left" size="20" />
            </NuxtLink>
            <div class="flex min-w-0 items-center gap-3">
              <div class="h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-neutral-800">
                <img
                  v-if="square?.iconUrl"
                  :src="square.iconUrl"
                  class="h-full w-full object-cover"
                />
                <div v-else class="flex h-full w-full items-center justify-center">
                  <Icon name="mdi:storefront-outline" size="18" class="text-gray-400" />
                </div>
              </div>
              <div>
                <p class="truncate font-bold text-gray-900 dark:text-white">{{ square?.name }}</p>
                <p class="text-xs text-gray-500 dark:text-neutral-400">Admin Dashboard</p>
              </div>
            </div>
            <span
              class="ml-auto shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
              :class="
                square?.status === 'ACTIVE'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
              "
            >{{ square?.status }}</span>
          </div>

          <!-- Tabs -->
          <div class="mt-4 flex gap-1 overflow-x-auto">
            <button
              v-for="tab in visibleTabs"
              :key="tab.id"
              class="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors"
              :class="
                activeTab === tab.id
                  ? 'bg-brand/10 text-brand dark:bg-brand/20'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
              "
              @click="switchTab(tab.id)"
            >
              <Icon :name="tab.icon" size="16" />
              {{ tab.label }}
              <span
                v-if="tab.badge"
                class="rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white"
              >{{ tab.badge }}</span>
            </button>
          </div>
        </div>
      </div>

      <div class="mx-auto max-w-4xl px-4 py-6">

        <!-- ── Requests Tab ────────────────────────────────────────────────── -->
        <div v-if="activeTab === 'requests'">
          <div v-if="loadingRequests" class="space-y-3">
            <div
              v-for="i in 3"
              :key="i"
              class="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div class="h-12 w-12 shrink-0 animate-pulse rounded-xl bg-gray-200 dark:bg-neutral-800" />
              <div class="flex-1 space-y-2">
                <div class="h-4 w-40 animate-pulse rounded bg-gray-200 dark:bg-neutral-800" />
                <div class="h-3 w-56 animate-pulse rounded bg-gray-200 dark:bg-neutral-800" />
              </div>
            </div>
          </div>

          <div
            v-else-if="!requests.length"
            class="flex flex-col items-center justify-center gap-3 py-16 text-center"
          >
            <Icon name="mdi:inbox-outline" size="40" class="text-gray-300 dark:text-neutral-700" />
            <p class="font-semibold text-gray-600 dark:text-neutral-400">No pending requests</p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="m in requests"
              :key="m.id"
              class="rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div class="flex items-start gap-3">
                <!-- Store logo -->
                <div class="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-neutral-800">
                  <img
                    v-if="m.seller.store_logo"
                    :src="m.seller.store_logo"
                    class="h-full w-full object-cover"
                  />
                  <div v-else class="flex h-full w-full items-center justify-center">
                    <Icon name="mdi:store-outline" size="22" class="text-gray-400" />
                  </div>
                </div>

                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="font-semibold text-gray-900 dark:text-white">
                      {{ m.seller.store_name || m.seller.store_slug }}
                    </p>
                    <span
                      v-if="m.isPrimary"
                      class="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand"
                    >Primary</span>
                    <span
                      v-if="m.seller.is_verified"
                      class="flex items-center gap-0.5 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                    >
                      <Icon name="mdi:check-decagram" size="10" />Verified
                    </span>
                  </div>
                  <p class="mt-0.5 text-sm text-gray-500 dark:text-neutral-400">
                    @{{ m.seller.store_slug }}
                    <template v-if="m.seller.store_location"> · {{ m.seller.store_location }}</template>
                  </p>
                  <p class="mt-1 text-xs text-gray-400 dark:text-neutral-500">
                    Applied {{ timeAgo(m.joinedAt) }}
                  </p>
                </div>

                <!-- Actions -->
                <div class="flex shrink-0 items-center gap-2">
                  <button
                    class="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
                    :disabled="acting === m.id"
                    @click="openRejectModal(m)"
                  >Reject</button>
                  <button
                    class="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                    :disabled="acting === m.id"
                    @click="actOnMember(m.seller.id, 'APPROVE')"
                  >
                    <Icon v-if="acting === m.id" name="mdi:loading" size="14" class="animate-spin" />
                    <span v-else>Approve</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Members Tab ─────────────────────────────────────────────────── -->
        <div v-if="activeTab === 'members'">
          <!-- Filter row -->
          <div class="mb-4 flex items-center gap-3">
            <div class="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-900">
              <button
                v-for="s in ['ACTIVE', 'SUSPENDED'] as const"
                :key="s"
                class="rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors"
                :class="
                  memberStatus === s
                    ? 'bg-brand/10 text-brand'
                    : 'text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                "
                @click="setMemberStatus(s)"
              >{{ s === 'ACTIVE' ? 'Active' : 'Suspended' }}</button>
            </div>
            <p class="ml-auto text-sm text-gray-500 dark:text-neutral-400">
              {{ memberTotal }} member{{ memberTotal !== 1 ? 's' : '' }}
            </p>
          </div>

          <div v-if="loadingMembers" class="space-y-3">
            <div
              v-for="i in 5"
              :key="i"
              class="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div class="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-gray-200 dark:bg-neutral-800" />
              <div class="flex-1 space-y-2">
                <div class="h-3.5 w-36 animate-pulse rounded bg-gray-200 dark:bg-neutral-800" />
                <div class="h-3 w-48 animate-pulse rounded bg-gray-200 dark:bg-neutral-800" />
              </div>
            </div>
          </div>

          <div
            v-else-if="!members.length"
            class="flex flex-col items-center justify-center gap-3 py-16 text-center"
          >
            <Icon name="mdi:account-group-outline" size="40" class="text-gray-300 dark:text-neutral-700" />
            <p class="font-semibold text-gray-600 dark:text-neutral-400">No {{ memberStatus.toLowerCase() }} members</p>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="m in members"
              :key="m.id"
              class="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div class="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-neutral-800">
                <img v-if="m.seller.store_logo" :src="m.seller.store_logo" class="h-full w-full object-cover" />
                <div v-else class="flex h-full w-full items-center justify-center">
                  <Icon name="mdi:store-outline" size="18" class="text-gray-400" />
                </div>
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <p class="truncate text-sm font-semibold text-gray-900 dark:text-white">
                    {{ m.seller.store_name || m.seller.store_slug }}
                  </p>
                  <span
                    v-if="m.isPrimary"
                    class="shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand"
                  >Home</span>
                  <span
                    v-if="m.seller.is_verified"
                    class="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                  >Verified</span>
                </div>
                <p class="text-xs text-gray-400 dark:text-neutral-500">
                  Joined {{ timeAgo(m.joinedAt) }}
                  <template v-if="m.suspendReason"> · {{ m.suspendReason }}</template>
                </p>
              </div>
              <div class="flex items-center gap-2">
                <button
                  v-if="memberStatus === 'ACTIVE'"
                  class="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 dark:border-neutral-700 dark:text-neutral-400"
                  :disabled="acting === m.id"
                  @click="openSuspendModal(m)"
                >Suspend</button>
                <button
                  v-if="memberStatus === 'SUSPENDED'"
                  class="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-emerald-600 transition-colors hover:bg-emerald-50 dark:border-neutral-700"
                  :disabled="acting === m.id"
                  @click="actOnMember(m.seller.id, 'APPROVE')"
                >Reinstate</button>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Officers Tab ────────────────────────────────────────────────── -->
        <div v-if="activeTab === 'officers'">
          <div class="mb-4 flex items-center justify-between">
            <p class="text-sm text-gray-500 dark:text-neutral-400">
              {{ officers.length }} officer{{ officers.length !== 1 ? 's' : '' }}
            </p>
            <button
              v-if="canManageOfficers"
              class="flex items-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand/90"
              @click="appointModal = true"
            >
              <Icon name="mdi:plus" size="16" />
              Appoint Officer
            </button>
          </div>

          <div v-if="loadingOfficers" class="space-y-3">
            <div
              v-for="i in 3"
              :key="i"
              class="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div class="h-10 w-10 shrink-0 animate-pulse rounded-full bg-gray-200 dark:bg-neutral-800" />
              <div class="flex-1 space-y-2">
                <div class="h-3.5 w-32 animate-pulse rounded bg-gray-200 dark:bg-neutral-800" />
                <div class="h-3 w-24 animate-pulse rounded bg-gray-200 dark:bg-neutral-800" />
              </div>
            </div>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="o in officers"
              :key="o.id"
              class="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div class="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-neutral-800">
                <img v-if="o.profile.avatar" :src="o.profile.avatar" class="h-full w-full object-cover" />
                <div v-else class="flex h-full w-full items-center justify-center">
                  <Icon name="mdi:account-outline" size="18" class="text-gray-400" />
                </div>
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <p class="truncate text-sm font-semibold text-gray-900 dark:text-white">
                    {{ o.profile.username }}
                  </p>
                  <span
                    class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                    :class="ROLE_BADGE[o.role] ?? 'bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-neutral-400'"
                  >{{ o.role }}</span>
                </div>
                <p class="text-xs text-gray-400 dark:text-neutral-500">
                  Since {{ formatDate(o.appointedAt) }}
                </p>
              </div>
              <button
                v-if="canManageOfficers && o.role !== 'CHAIRMAN'"
                class="shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
                :disabled="removingOfficer === o.profile.id"
                @click="removeOfficer(o.profile.id)"
              >
                <Icon v-if="removingOfficer === o.profile.id" name="mdi:loading" size="14" class="animate-spin" />
                <span v-else>Remove</span>
              </button>
            </div>
          </div>
        </div>

        <!-- ── Settings Tab ────────────────────────────────────────────────── -->
        <div v-if="activeTab === 'settings'">
          <form class="space-y-5" @submit.prevent="saveSettings">
            <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
              <h3 class="mb-4 font-bold text-gray-900 dark:text-white">Square Details</h3>

              <div class="space-y-4">
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-neutral-300">Name</label>
                  <input
                    v-model="settingsForm.name"
                    type="text"
                    class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-brand focus:bg-white dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-brand dark:focus:bg-neutral-700"
                  />
                </div>
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-neutral-300">Description</label>
                  <textarea
                    v-model="settingsForm.description"
                    rows="3"
                    class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-brand focus:bg-white dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-brand dark:focus:bg-neutral-700"
                  />
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-neutral-300">City</label>
                    <input
                      v-model="settingsForm.city"
                      type="text"
                      class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-brand focus:bg-white dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-neutral-300">State</label>
                    <input
                      v-model="settingsForm.state"
                      type="text"
                      class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-brand focus:bg-white dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-neutral-300">Physical Address</label>
                  <input
                    v-model="settingsForm.physicalAddress"
                    type="text"
                    class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-brand focus:bg-white dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  />
                </div>
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-neutral-300">Accent Colour</label>
                  <div class="flex items-center gap-3">
                    <input
                      v-model="settingsForm.accentColor"
                      type="color"
                      class="h-9 w-14 cursor-pointer rounded-lg border border-gray-200 bg-transparent dark:border-neutral-700"
                    />
                    <input
                      v-model="settingsForm.accentColor"
                      type="text"
                      placeholder="#000000"
                      class="w-32 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-mono text-gray-900 outline-none focus:border-brand dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="flex items-center justify-end gap-3">
              <p v-if="settingsError" class="text-sm text-red-500">{{ settingsError }}</p>
              <p v-if="settingsSaved" class="text-sm text-emerald-600 dark:text-emerald-400">Saved!</p>
              <button
                type="submit"
                class="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand/90 disabled:opacity-60"
                :disabled="savingSettings"
              >
                <Icon v-if="savingSettings" name="mdi:loading" size="16" class="animate-spin" />
                <span v-else>Save Changes</span>
              </button>
            </div>
          </form>
        </div>

      </div>
    </template>

    <!-- ── Reject / Suspend Modal ──────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="actionModal.open"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          @click.self="actionModal.open = false"
        >
          <div class="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900">
            <h3 class="mb-1 font-bold text-gray-900 dark:text-white">
              {{ actionModal.mode === 'reject' ? 'Reject Application' : 'Suspend Member' }}
            </h3>
            <p class="mb-4 text-sm text-gray-500 dark:text-neutral-400">
              {{ actionModal.sellerName }} · Optional reason
            </p>
            <textarea
              v-model="actionModal.reason"
              rows="3"
              placeholder="Reason (optional)…"
              class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-brand dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            />
            <div class="mt-4 flex gap-2">
              <button
                class="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 dark:border-neutral-700 dark:text-neutral-400"
                @click="actionModal.open = false"
              >Cancel</button>
              <button
                class="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                :disabled="acting === actionModal.sellerId"
                @click="confirmAction"
              >Confirm</button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Appoint Officer Modal -->
      <Transition name="fade">
        <div
          v-if="appointModal"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          @click.self="appointModal = false"
        >
          <div class="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900">
            <h3 class="mb-4 font-bold text-gray-900 dark:text-white">Appoint Officer</h3>

            <!-- User search -->
            <div class="relative mb-3">
              <input
                v-model="officerSearch"
                type="text"
                placeholder="Search by username…"
                class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-brand dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              />
              <div
                v-if="officerSearchResults.length"
                class="absolute left-0 right-0 top-[calc(100%+4px)] z-10 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
              >
                <button
                  v-for="u in officerSearchResults"
                  :key="u.id"
                  class="flex w-full items-center gap-2.5 px-3 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800"
                  @click="selectOfficerUser(u)"
                >
                  <div class="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-neutral-800">
                    <img v-if="u.avatar" :src="u.avatar" class="h-full w-full object-cover" />
                    <Icon v-else name="mdi:account" size="16" class="m-auto text-gray-400" />
                  </div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">@{{ u.username }}</p>
                </button>
              </div>
            </div>

            <!-- Selected user chip -->
            <div
              v-if="appointForm.selectedUser"
              class="mb-3 flex items-center gap-2 rounded-xl bg-brand/5 px-3 py-2"
            >
              <Icon name="mdi:account-check-outline" size="16" class="text-brand" />
              <p class="flex-1 text-sm font-medium text-brand">@{{ appointForm.selectedUser.username }}</p>
              <button @click="appointForm.selectedUser = null">
                <Icon name="mdi:close" size="14" class="text-brand/60" />
              </button>
            </div>

            <!-- Role select -->
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-neutral-300">Role</label>
            <select
              v-model="appointForm.role"
              class="mb-4 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-brand dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            >
              <option v-for="r in APPOINT_ROLES" :key="r.value" :value="r.value">
                {{ r.label }}
              </option>
            </select>

            <div class="flex gap-2">
              <button
                class="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 dark:border-neutral-700 dark:text-neutral-400"
                @click="appointModal = false"
              >Cancel</button>
              <button
                class="flex-1 rounded-xl bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand/90 disabled:opacity-60"
                :disabled="!appointForm.selectedUser || appointingOfficer"
                @click="confirmAppoint"
              >
                <Icon v-if="appointingOfficer" name="mdi:loading" size="16" class="animate-spin" />
                <span v-else>Appoint</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useSquareApi } from '../../../services/square.api'
import { useSquareAdmin } from '../../../composables/useSquareAdmin'
import { notify } from '@kyvg/vue3-notification'

const route = useRoute()
const slug = computed(() => route.params.slug as string)
const squareApi = useSquareApi()

// ── Square data ───────────────────────────────────────────────────────────────

const square = ref<any>(null)
const loadingSquare = ref(true)

useSeoMeta({ title: computed(() => `Admin · ${square.value?.name ?? 'Square'}`) })

onMounted(async () => {
  try {
    const res = await squareApi.getSquare(slug.value)
    square.value = res.data ?? res
    if (hasAnyAdminAccess.value) {
      loadRequests()
      loadOfficers()
      if (canEditSettings.value) initSettingsForm()
    }
  } catch {
    await navigateTo(`/squares/${slug.value}`)
  } finally {
    loadingSquare.value = false
  }
})

// ── Role guard ────────────────────────────────────────────────────────────────

const {
  hasAnyAdminAccess,
  canManageMembers,
  canEditSettings,
  canManageOfficers,
  isChairman,
} = useSquareAdmin(square)

// ── Tabs ──────────────────────────────────────────────────────────────────────

const activeTab = ref<'requests' | 'members' | 'officers' | 'settings'>('requests')

const visibleTabs = computed(() => {
  const tabs = []
  if (canManageMembers.value) {
    tabs.push({ id: 'requests', label: 'Requests', icon: 'mdi:inbox-outline', badge: pendingCount.value || null })
    tabs.push({ id: 'members',  label: 'Members',  icon: 'mdi:account-group-outline', badge: null })
  }
  if (canManageOfficers.value)
    tabs.push({ id: 'officers', label: 'Officers', icon: 'mdi:shield-account-outline', badge: null })
  if (canEditSettings.value)
    tabs.push({ id: 'settings', label: 'Settings',  icon: 'mdi:cog-outline', badge: null })
  return tabs
})

const switchTab = (tab: typeof activeTab.value) => {
  activeTab.value = tab
  if (tab === 'requests' && !requests.value.length) loadRequests()
  if (tab === 'members'  && !members.value.length)  loadMembers()
  if (tab === 'officers' && !officers.value.length) loadOfficers()
  if (tab === 'settings' && square.value)           initSettingsForm()
}

// ── Requests (PENDING) ────────────────────────────────────────────────────────

const requests = ref<any[]>([])
const pendingCount = ref(0)
const loadingRequests = ref(false)

const loadRequests = async () => {
  loadingRequests.value = true
  try {
    const res = await squareApi.getMembers(slug.value, { status: 'PENDING', limit: 50 })
    requests.value = res.data?.memberships ?? []
    pendingCount.value = res.data?.total ?? 0
  } finally {
    loadingRequests.value = false
  }
}

// ── Members ───────────────────────────────────────────────────────────────────

const members = ref<any[]>([])
const memberTotal = ref(0)
const loadingMembers = ref(false)
const memberStatus = ref<'ACTIVE' | 'SUSPENDED'>('ACTIVE')

const loadMembers = async () => {
  loadingMembers.value = true
  try {
    const res = await squareApi.getMembers(slug.value, { status: memberStatus.value, limit: 100 })
    members.value = res.data?.memberships ?? []
    memberTotal.value = res.data?.total ?? 0
  } finally {
    loadingMembers.value = false
  }
}

const setMemberStatus = (s: 'ACTIVE' | 'SUSPENDED') => {
  memberStatus.value = s
  members.value = []
  loadMembers()
}

// ── Officers ──────────────────────────────────────────────────────────────────

const officers = ref<any[]>([])
const loadingOfficers = ref(false)
const removingOfficer = ref<string | null>(null)

const loadOfficers = async () => {
  loadingOfficers.value = true
  try {
    const res = await squareApi.getOfficers(slug.value)
    officers.value = res.data ?? []
  } finally {
    loadingOfficers.value = false
  }
}

const removeOfficer = async (profileId: string) => {
  removingOfficer.value = profileId
  try {
    await squareApi.removeOfficer(slug.value, profileId)
    officers.value = officers.value.filter((o) => o.profile.id !== profileId)
    notify({ type: 'success', text: 'Officer removed' })
  } catch (e: any) {
    notify({ type: 'error', text: e?.data?.statusMessage ?? 'Failed to remove officer' })
  } finally {
    removingOfficer.value = null
  }
}

// ── Appoint officer modal ─────────────────────────────────────────────────────

const appointModal = ref(false)
const officerSearch = ref('')
const officerSearchResults = ref<any[]>([])
const appointingOfficer = ref(false)
const appointForm = ref<{ selectedUser: any | null; role: string }>({
  selectedUser: null,
  role: 'SECRETARY',
})

const APPOINT_ROLES = [
  { value: 'SECRETARY',  label: 'Secretary — membership management' },
  { value: 'TREASURER',  label: 'Treasurer — finance read access' },
  { value: 'MODERATOR',  label: 'Moderator — content moderation' },
  { value: 'GOVT_REP',   label: 'Govt Rep — observer, read-only' },
]

let searchDebounce: ReturnType<typeof setTimeout> | null = null

watch(officerSearch, (q) => {
  if (searchDebounce) clearTimeout(searchDebounce)
  if (!q.trim() || q.length < 2) { officerSearchResults.value = []; return }
  searchDebounce = setTimeout(async () => {
    try {
      const res = await $fetch<any>(`/api/search?q=${encodeURIComponent(q)}&type=users&limit=5`)
      officerSearchResults.value = res.data?.users ?? []
    } catch {
      officerSearchResults.value = []
    }
  }, 300)
})

const selectOfficerUser = (u: any) => {
  appointForm.value.selectedUser = u
  officerSearch.value = ''
  officerSearchResults.value = []
}

const confirmAppoint = async () => {
  if (!appointForm.value.selectedUser) return
  appointingOfficer.value = true
  try {
    const res = await squareApi.appointOfficer(slug.value, {
      profileId: appointForm.value.selectedUser.id,
      role: appointForm.value.role as any,
    })
    officers.value.push(res.data)
    appointModal.value = false
    appointForm.value = { selectedUser: null, role: 'SECRETARY' }
    notify({ type: 'success', text: 'Officer appointed' })
  } catch (e: any) {
    notify({ type: 'error', text: e?.data?.statusMessage ?? 'Failed to appoint officer' })
  } finally {
    appointingOfficer.value = false
  }
}

// ── Member actions (approve / reject / suspend) ───────────────────────────────

const acting = ref<string | null>(null)

const actionModal = ref<{
  open: boolean
  mode: 'reject' | 'suspend'
  sellerId: string
  sellerName: string
  reason: string
}>({ open: false, mode: 'reject', sellerId: '', sellerName: '', reason: '' })

const openRejectModal = (m: any) => {
  actionModal.value = {
    open: true,
    mode: 'reject',
    sellerId: m.seller.id,
    sellerName: m.seller.store_name ?? m.seller.store_slug,
    reason: '',
  }
}

const openSuspendModal = (m: any) => {
  actionModal.value = {
    open: true,
    mode: 'suspend',
    sellerId: m.seller.id,
    sellerName: m.seller.store_name ?? m.seller.store_slug,
    reason: '',
  }
}

const confirmAction = () => {
  const a = actionModal.value.mode === 'reject' ? 'REJECT' : 'SUSPEND'
  actOnMember(actionModal.value.sellerId, a, actionModal.value.reason)
  actionModal.value.open = false
}

const actOnMember = async (
  sellerId: string,
  action: 'APPROVE' | 'REJECT' | 'SUSPEND',
  reason?: string,
) => {
  acting.value = sellerId
  try {
    await squareApi.actOnMember(slug.value, sellerId, action, reason)
    // Remove from current list — the item moves to a different status bucket
    requests.value = requests.value.filter((m) => m.seller.id !== sellerId)
    members.value  = members.value.filter((m) => m.seller.id !== sellerId)
    pendingCount.value = Math.max(0, pendingCount.value - 1)
    const label = action === 'APPROVE' ? 'Approved' : action === 'REJECT' ? 'Rejected' : 'Suspended'
    notify({ type: 'success', text: `${label} successfully` })
  } catch (e: any) {
    notify({ type: 'error', text: e?.data?.statusMessage ?? 'Action failed' })
  } finally {
    acting.value = null
  }
}

// ── Settings ──────────────────────────────────────────────────────────────────

const settingsForm = ref({
  name: '',
  description: '',
  city: '',
  state: '',
  physicalAddress: '',
  accentColor: '',
})
const savingSettings = ref(false)
const settingsError = ref('')
const settingsSaved = ref(false)

const initSettingsForm = () => {
  const s = square.value
  if (!s) return
  settingsForm.value = {
    name:            s.name ?? '',
    description:     s.description ?? '',
    city:            s.city ?? '',
    state:           s.state ?? '',
    physicalAddress: s.physicalAddress ?? '',
    accentColor:     s.accentColor ?? '',
  }
}

const saveSettings = async () => {
  savingSettings.value = true
  settingsError.value = ''
  settingsSaved.value = false
  try {
    const res = await squareApi.updateSquare(slug.value, {
      ...settingsForm.value,
      description:     settingsForm.value.description     || undefined,
      city:            settingsForm.value.city            || undefined,
      state:           settingsForm.value.state           || undefined,
      physicalAddress: settingsForm.value.physicalAddress || undefined,
      accentColor:     settingsForm.value.accentColor     || undefined,
    })
    square.value = { ...square.value, ...(res.data ?? {}) }
    settingsSaved.value = true
    setTimeout(() => { settingsSaved.value = false }, 3000)
  } catch (e: any) {
    settingsError.value = e?.data?.statusMessage ?? 'Failed to save'
  } finally {
    savingSettings.value = false
  }
}

// ── Utilities ─────────────────────────────────────────────────────────────────

const ROLE_BADGE: Record<string, string> = {
  CHAIRMAN:  'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400',
  SECRETARY: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  TREASURER: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  MODERATOR: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400',
  GOVT_REP:  'bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-neutral-400',
}

const timeAgo = (date: string | Date) => {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

const formatDate = (date: string | Date) =>
  new Date(date).toLocaleDateString('en-NG', { year: 'numeric', month: 'short' })


</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
