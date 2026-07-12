<template>
  <div
    class="relative min-h-screen overflow-hidden bg-gray-50 dark:bg-neutral-950"
  >
    <div
      class="flex min-h-screen flex-col items-center justify-center px-5 py-10"
    >
      <div
        class="w-full max-w-sm rounded-2xl border border-gray-200/80 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
      >
        <!-- Header -->
        <div class="border-b border-gray-200 px-6 py-5 dark:border-neutral-800">
          <div class="flex items-center gap-3">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-sm font-black text-white"
            >
              MX
            </div>
            <div>
              <p
                class="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-neutral-500"
              >
                Authorization Request
              </p>
              <h1
                class="text-[15px] font-extrabold text-gray-900 dark:text-neutral-50"
              >
                {{ clientName }} wants access
              </h1>
            </div>
          </div>
        </div>

        <!-- Permissions list -->
        <div class="px-6 py-4 text-[13px] text-gray-600 dark:text-neutral-400">
          <p class="mb-3 font-semibold text-gray-700 dark:text-neutral-300">
            <span class="font-bold text-gray-900 dark:text-neutral-100">{{
              clientName
            }}</span>
            is requesting access to your MarketX account:
          </p>
          <ul class="space-y-2">
            <li
              v-for="perm in permissions"
              :key="perm.label"
              class="flex items-start gap-2"
            >
              <Icon
                :name="perm.icon"
                size="15"
                class="mt-0.5 shrink-0 text-brand"
              />
              <span>{{ perm.label }}</span>
            </li>
          </ul>
        </div>

        <!-- Error banner -->
        <div
          v-if="errorMsg"
          class="mx-6 mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700 dark:border-red-800/40 dark:bg-red-950/25 dark:text-red-300"
        >
          {{ errorMsg }}
        </div>

        <!-- If logged in: approve / deny -->
        <template v-if="isLoggedIn">
          <div class="flex flex-col gap-2 px-6 pb-6 pt-2">
            <p class="mb-1 text-[12px] text-gray-500 dark:text-neutral-500">
              Signed in as
              <span class="font-semibold text-gray-700 dark:text-neutral-300">{{
                userEmail
              }}</span>
            </p>
            <button
              :disabled="approving"
              class="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-[14px] font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
              @click="approve"
            >
              <svg
                v-if="approving"
                class="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="3"
                />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              <span>{{ approving ? 'Authorizing…' : 'Approve Access' }}</span>
            </button>
            <button
              :disabled="approving"
              class="flex w-full items-center justify-center rounded-xl border border-gray-200 px-4 py-2.5 text-[13px] font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-60 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              @click="deny"
            >
              Deny
            </button>
          </div>
        </template>

        <!-- If not logged in: show login form -->
        <template v-else>
          <form class="px-6 pb-6 pt-2" @submit.prevent="handleLogin">
            <p class="mb-4 text-[12px] text-gray-500 dark:text-neutral-500">
              Sign in to MarketX to continue
            </p>

            <div class="space-y-3">
              <input
                v-model="email"
                type="email"
                required
                placeholder="Email address"
                class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[13px] text-gray-900 placeholder-gray-400 transition focus:border-brand/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/10 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
              />
              <input
                v-model="password"
                type="password"
                required
                placeholder="Password"
                class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[13px] text-gray-900 placeholder-gray-400 transition focus:border-brand/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/10 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
              />
            </div>

            <button
              type="submit"
              :disabled="loginLoading"
              class="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-[14px] font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
            >
              <svg
                v-if="loginLoading"
                class="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="3"
                />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              <span>{{
                loginLoading ? 'Signing in…' : 'Sign in & Approve'
              }}</span>
            </button>

            <p
              class="mt-3 text-center text-[11px] text-gray-400 dark:text-neutral-600"
            >
              <a href="/user-login" class="underline hover:text-brand"
                >Forgot password?</a
              >
            </p>
          </form>
        </template>

        <!-- Footer -->
        <div class="border-t border-gray-200 px-6 py-3 dark:border-neutral-800">
          <p
            class="text-center text-[11px] text-gray-400 dark:text-neutral-600"
          >
            By approving you allow {{ clientName }} to access your account on
            MarketX.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSeo } from '~~/layers/core/app/composables/useSeo'
import { useRoute } from 'vue-router'
import { useAuthStore } from '~~/layers/core/app/stores/auth.store'
import { useProfileStore } from '~~/layers/profile/app/stores/profile.store'
import { useAuthApi } from '~~/layers/core/app/services/auth.api'

defineOptions({ name: 'OAuthAuthorizePage' })

useSeo().setPrivatePage('Authorize')

const route = useRoute()
const authApi = useAuthApi()
const authStore = useAuthStore()
const profileStore = useProfileStore()

// ─── Query params ──────────────────────────────────────────────────────────────
// route.query is empty after Nuxt hydration on server-side redirects;
// window.location.search is the reliable source on the client.
const clientId = ref((route.query.client_id as string) ?? '')
const redirectUri = ref((route.query.redirect_uri as string) ?? '')
const state = ref(route.query.state as string | undefined)

// ─── State ─────────────────────────────────────────────────────────────────────
const isLoggedIn = computed(() => !!authStore.accessToken)
const userEmail = computed(() => profileStore.me?.email ?? '')

const email = ref('')
const password = ref('')
const loginLoading = ref(false)
const approving = ref(false)
const errorMsg = ref<string | null>(null)

// ─── Client meta ───────────────────────────────────────────────────────────────
const CLIENT_NAMES: Record<string, string> = {
  dassah: 'Dassah AI',
}
const clientName = computed(
  () => CLIENT_NAMES[clientId.value] ?? clientId.value,
)

const permissions = [
  {
    label: 'Read your public profile (name and username)',
    icon: 'solar:user-linear',
  },
  { label: 'Read your email address', icon: 'solar:letter-linear' },
]

// ─── Validate params on mount ─────────────────────────────────────────────────
onMounted(() => {
  const params = new URLSearchParams(window.location.search)
  if (!clientId.value && params.get('client_id'))
    clientId.value = params.get('client_id')!
  if (!redirectUri.value && params.get('redirect_uri'))
    redirectUri.value = params.get('redirect_uri')!
  if (!state.value && params.get('state')) state.value = params.get('state')!

  if (!clientId.value || !redirectUri.value) {
    errorMsg.value =
      'Invalid authorization request. Missing required parameters.'
  }
})

// ─── Approve ──────────────────────────────────────────────────────────────────
async function approve() {
  if (!clientId.value || !redirectUri.value) return
  approving.value = true
  errorMsg.value = null
  try {
    const result = await authApi.createOAuthCode(
      {
        client_id: clientId.value,
        redirect_uri: redirectUri.value,
        state: state.value,
      },
      {
        skipAuth: true,
        silent: true,
        headers: authStore.accessToken
          ? { Authorization: `Bearer ${authStore.accessToken}` }
          : {},
      },
    )
    window.location.assign(result.redirectUrl)
  } catch (e: any) {
    errorMsg.value =
      e?.data?.statusMessage ?? 'Authorization failed. Please try again.'
    approving.value = false
  }
}

// ─── Deny ─────────────────────────────────────────────────────────────────────
function deny() {
  const params = new URLSearchParams({
    error: 'access_denied',
    ...(state.value ? { state: state.value } : {}),
  })
  window.location.assign(`${redirectUri.value}?${params.toString()}`)
}

// ─── Login then approve ───────────────────────────────────────────────────────
async function handleLogin() {
  loginLoading.value = true
  errorMsg.value = null
  try {
    const result = await authApi.login(
      { email: email.value, password: password.value },
      { skipAuth: true, silent: true },
    )
    authStore.setAccessToken(result.accessToken)
    // Immediately approve after successful login
    await approve()
  } catch (e: any) {
    errorMsg.value =
      e?.data?.statusMessage ?? 'Login failed. Check your credentials.'
    loginLoading.value = false
  }
}
</script>
