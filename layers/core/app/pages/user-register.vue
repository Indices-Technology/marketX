<template>
  <div class="relative min-h-screen overflow-hidden">
    <!-- Background -->
    <div class="absolute inset-0 z-0">
      <img
        src="https://res.cloudinary.com/dcci05bzj/image/upload/q_auto/f_auto/v1775835271/freepik_horizontal-site-backgroun_2758965030_gtxztq.png"
        alt="Background"
        class="h-full w-full object-cover object-center brightness-[0.78] contrast-[1.08] saturate-[1.15]"
      />
      <div
        class="absolute inset-0 bg-gradient-to-t from-black/65 via-black/45 to-black/30"
      />
    </div>

    <div
      class="relative z-10 flex min-h-screen flex-col items-center justify-center px-5 py-10 sm:px-6 md:py-12 lg:px-8"
    >
      <!-- ── STEP 0: Choose path ─────────────────────────────────────────────── -->
      <div v-if="step === 0" class="fade-in w-full max-w-xl">
        <div class="mb-8 text-center">
          <div
            class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand shadow-2xl shadow-brand/40"
          >
            <span class="text-base font-black italic text-white">MX</span>
          </div>
          <h1 class="text-3xl font-black tracking-tight text-white sm:text-4xl">
            Join MarketX
          </h1>
          <p class="mt-2 text-base text-white/70">What brings you here?</p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <!-- Buyer card -->
          <button
            class="group flex flex-col items-center gap-4 rounded-2xl border-2 border-white/10 bg-white/10 p-8 text-left backdrop-blur-md transition-all hover:border-brand hover:bg-white/15 hover:shadow-2xl"
            @click="chooseType('buyer')"
          >
            <div
              class="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-3xl transition-all group-hover:scale-110 group-hover:bg-brand/20"
            >
              🛍️
            </div>
            <div>
              <p class="text-lg font-black text-white">I'm a Buyer</p>
              <p class="mt-1 text-sm leading-relaxed text-white/60">
                Browse the feed, discover products, and buy directly from
                African creators.
              </p>
            </div>
            <div
              class="mt-auto flex w-full items-center justify-end text-[11px] font-black uppercase tracking-widest text-white/40 transition-colors group-hover:text-brand"
            >
              Get started →
            </div>
          </button>

          <!-- Seller card -->
          <button
            class="group flex flex-col items-center gap-4 rounded-2xl border-2 border-white/10 bg-white/10 p-8 text-left backdrop-blur-md transition-all hover:border-brand hover:bg-white/15 hover:shadow-2xl"
            @click="chooseType('seller')"
          >
            <div
              class="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-3xl transition-all group-hover:scale-110 group-hover:bg-brand/20"
            >
              🏪
            </div>
            <div>
              <p class="text-lg font-black text-white">I want to Sell</p>
              <p class="mt-1 text-sm leading-relaxed text-white/60">
                Open your store, list products, and sell to buyers across Africa
                and beyond.
              </p>
            </div>
            <div
              class="mt-auto flex w-full items-center justify-end text-[11px] font-black uppercase tracking-widest text-white/40 transition-colors group-hover:text-brand"
            >
              Open a store →
            </div>
          </button>
        </div>

        <p class="mt-6 text-center text-sm text-white/50">
          Already have an account?
          <NuxtLink
            to="/user-login"
            class="font-semibold text-white transition hover:text-brand"
            >Sign in</NuxtLink
          >
        </p>
      </div>

      <!-- ── STEP 1: Account details ─────────────────────────────────────────── -->
      <div
        v-else-if="step === 1"
        class="fade-in bg-white/88 dark:bg-neutral-900/82 w-full max-w-xl rounded-2xl p-6 shadow-2xl backdrop-blur-xl sm:p-8 md:p-10 dark:shadow-black/40"
      >
        <!-- Step indicator (seller only) -->
        <div
          v-if="accountType === 'seller'"
          class="mb-5 flex items-center gap-2"
        >
          <button
            class="text-xs text-gray-400 transition hover:text-gray-600 dark:text-neutral-500 dark:hover:text-neutral-300"
            @click="step = 0"
          >
            ← Back
          </button>
          <div class="ml-auto flex items-center gap-1.5">
            <div class="h-1.5 w-8 rounded-full bg-brand" />
            <div
              class="h-1.5 w-8 rounded-full bg-gray-200 dark:bg-neutral-700"
            />
            <div
              class="h-1.5 w-8 rounded-full bg-gray-200 dark:bg-neutral-700"
            />
          </div>
        </div>

        <div class="mb-7 text-center">
          <h1
            class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white"
          >
            {{
              accountType === 'seller'
                ? 'Create your account'
                : $t('auth.register.welcomeTitle', {
                    site: $config.public.siteName || 'MarketX',
                  })
            }}
          </h1>
          <p
            class="mt-2.5 text-base leading-relaxed text-gray-700 dark:text-gray-300"
          >
            {{
              accountType === 'seller'
                ? 'Step 1 of 2 — your personal account details'
                : $t('auth.register.welcomeSubtitle')
            }}
          </p>
        </div>

        <!-- Alerts -->
        <div v-if="error || message" class="mb-5 space-y-3">
          <div
            v-if="error"
            class="rounded-xl border border-red-200/80 bg-red-50/70 p-4 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-950/25 dark:text-red-300"
          >
            {{ error }}
          </div>
          <div
            v-if="message"
            class="rounded-xl border border-green-200/80 bg-green-50/70 p-4 text-sm text-green-700 dark:border-green-800/40 dark:bg-green-950/25 dark:text-green-300"
          >
            {{ message }}
          </div>
        </div>

        <!-- Social logins -->
        <div class="flex items-center gap-4">
          <button
            type="button"
            :disabled="isBusy"
            :title="$t('auth.register.continueWithGoogle')"
            :aria-label="$t('auth.register.continueWithGoogle')"
            class="flex flex-1 items-center justify-center rounded-xl border border-gray-300 bg-white/80 py-3 shadow-sm transition hover:bg-gray-50 disabled:opacity-60 dark:border-neutral-600 dark:bg-neutral-800/60 dark:hover:bg-neutral-700"
            @click="handleSocial('google')"
          >
            <Icon name="mdi:google" class="h-6 w-6 text-[#4285F4]" />
          </button>
          <button
            type="button"
            :disabled="isBusy"
            title="Continue with TikTok"
            aria-label="Continue with TikTok"
            class="flex flex-1 items-center justify-center rounded-xl border border-gray-300 bg-white/80 py-3 shadow-sm transition hover:bg-gray-50 disabled:opacity-60 dark:border-neutral-600 dark:bg-neutral-800/60 dark:hover:bg-neutral-700"
            @click="handleSocial('tiktok')"
          >
            <Icon
              name="simple-icons:tiktok"
              class="h-5 w-5 text-black dark:text-white"
            />
          </button>
          <button
            type="button"
            :disabled="isBusy"
            title="Continue with Facebook"
            aria-label="Continue with Facebook"
            class="flex flex-1 items-center justify-center rounded-xl border border-[#1877F2] bg-[#1877F2]/90 py-3 shadow-sm transition hover:bg-[#1877F2] disabled:opacity-60"
            @click="handleSocial('facebook')"
          >
            <Icon name="mdi:facebook" class="h-6 w-6 text-white" />
          </button>
        </div>

        <div class="my-6 flex items-center justify-center space-x-4">
          <span class="h-px w-full bg-gray-300 dark:bg-neutral-700"></span>
          <span
            class="whitespace-nowrap text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-400"
            >{{ $t('auth.register.orWithEmail') }}</span
          >
          <span class="h-px w-full bg-gray-300 dark:bg-neutral-700"></span>
        </div>

        <!-- Account form -->
        <form class="space-y-5" novalidate @submit.prevent="handleAccountStep">
          <!-- Username -->
          <div>
            <div class="relative">
              <Icon
                name="mdi:account-outline"
                class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size="20"
              />
              <input
                v-model="form.username"
                type="text"
                :placeholder="$t('auth.register.usernamePlaceholder')"
                autocomplete="username"
                :disabled="isBusy"
                class="w-full rounded-xl border bg-white/60 py-3.5 pl-11 pr-4 text-base placeholder-gray-500 transition focus:border-brand focus:ring-2 focus:ring-brand/30 dark:border-neutral-600 dark:bg-neutral-800/50 dark:text-white dark:placeholder-gray-400"
                :class="{
                  'border-red-400 dark:border-red-600': errors.username,
                }"
              />
            </div>
            <p
              v-if="errors.username"
              class="mt-1.5 text-xs text-red-600 dark:text-red-400"
            >
              {{ errors.username }}
            </p>
          </div>

          <!-- Email -->
          <div>
            <div class="relative">
              <Icon
                name="mdi:at"
                class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size="20"
              />
              <input
                v-model="form.email"
                type="email"
                :placeholder="$t('auth.register.emailPlaceholder')"
                autocomplete="email"
                :disabled="isBusy"
                class="w-full rounded-xl border bg-white/60 py-3.5 pl-11 pr-4 text-base placeholder-gray-500 transition focus:border-brand focus:ring-2 focus:ring-brand/30 dark:border-neutral-600 dark:bg-neutral-800/50 dark:text-white dark:placeholder-gray-400"
                :class="{ 'border-red-400 dark:border-red-600': errors.email }"
              />
            </div>
            <p
              v-if="errors.email"
              class="mt-1.5 text-xs text-red-600 dark:text-red-400"
            >
              {{ errors.email }}
            </p>
          </div>

          <!-- Password -->
          <div class="grid gap-5 sm:grid-cols-2">
            <div>
              <div class="relative">
                <Icon
                  name="mdi:lock-outline"
                  class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size="20"
                />
                <input
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  :placeholder="$t('auth.register.passwordPlaceholder')"
                  autocomplete="new-password"
                  :disabled="isBusy"
                  class="w-full rounded-xl border bg-white/60 py-3.5 pl-11 pr-11 text-base placeholder-gray-500 transition focus:border-brand focus:ring-2 focus:ring-brand/30 dark:border-neutral-600 dark:bg-neutral-800/50 dark:text-white dark:placeholder-gray-400"
                  :class="{
                    'border-red-400 dark:border-red-600': errors.password,
                  }"
                />
                <button
                  type="button"
                  :disabled="isBusy"
                  class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  @click="showPassword = !showPassword"
                >
                  <Icon
                    :name="
                      showPassword ? 'mdi:eye-off-outline' : 'mdi:eye-outline'
                    "
                    size="20"
                  />
                </button>
              </div>
              <p
                v-if="errors.password"
                class="mt-1.5 text-xs text-red-600 dark:text-red-400"
              >
                {{ errors.password }}
              </p>
            </div>
            <div>
              <div class="relative">
                <Icon
                  name="mdi:lock-check-outline"
                  class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size="20"
                />
                <input
                  v-model="form.confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  :placeholder="$t('auth.register.confirmPasswordPlaceholder')"
                  autocomplete="new-password"
                  :disabled="isBusy"
                  class="w-full rounded-xl border bg-white/60 py-3.5 pl-11 pr-11 text-base placeholder-gray-500 transition focus:border-brand focus:ring-2 focus:ring-brand/30 dark:border-neutral-600 dark:bg-neutral-800/50 dark:text-white dark:placeholder-gray-400"
                  :class="{
                    'border-red-400 dark:border-red-600':
                      errors.confirmPassword,
                  }"
                />
                <button
                  type="button"
                  :disabled="isBusy"
                  class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  @click="showConfirmPassword = !showConfirmPassword"
                >
                  <Icon
                    :name="
                      showConfirmPassword
                        ? 'mdi:eye-off-outline'
                        : 'mdi:eye-outline'
                    "
                    size="20"
                  />
                </button>
              </div>
              <p
                v-if="errors.confirmPassword"
                class="mt-1.5 text-xs text-red-600 dark:text-red-400"
              >
                {{ errors.confirmPassword }}
              </p>
            </div>
          </div>

          <PasswordStrengthMeter
            v-if="form.password"
            :password="form.password"
          />

          <!-- Terms -->
          <label
            for="terms"
            class="flex items-start gap-3 rounded-xl border border-gray-200/70 bg-gray-50/60 p-4 dark:border-neutral-700/50 dark:bg-neutral-800/40"
          >
            <input
              id="terms"
              v-model="agreedToTerms"
              type="checkbox"
              :disabled="isBusy"
              class="mt-0.5 h-5 w-5 rounded border-gray-300 text-brand focus:ring-brand/40 dark:border-neutral-600 dark:bg-neutral-800"
            />
            <span
              class="text-sm leading-relaxed text-gray-700 dark:text-gray-300"
            >
              {{ $t('auth.register.agreePrefix') }}
              <NuxtLink
                to="/Terms"
                class="font-semibold text-brand hover:opacity-80"
                >{{ $t('auth.register.terms') }}</NuxtLink
              >
              {{ $t('auth.register.agreeMid') }}
              <NuxtLink
                to="/Privacy"
                class="font-semibold text-brand hover:opacity-80"
                >{{ $t('auth.register.privacy') }}</NuxtLink
              >
            </span>
          </label>

          <button
            type="submit"
            :disabled="isBusy || !agreedToTerms"
            class="w-full rounded-xl bg-brand py-3.5 text-base font-semibold text-white shadow transition hover:bg-brand/90 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span
              v-if="isLoading"
              class="flex items-center justify-center gap-2.5"
            >
              <div
                class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
              />
              {{
                accountType === 'seller'
                  ? 'Continuing…'
                  : $t('auth.register.creating')
              }}
            </span>
            <span v-else>{{
              accountType === 'seller'
                ? 'Continue to store setup →'
                : $t('auth.register.createButton')
            }}</span>
          </button>
        </form>

        <div class="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            {{
              $t('auth.register.alreadyHaveAccount', {
                site: $config.public.siteName || 'MarketX',
              })
            }}
            <NuxtLink
              to="/user-login"
              class="font-semibold text-brand transition hover:text-brand/80"
              >{{ $t('nav.signIn') }}</NuxtLink
            >
          </p>
        </div>
      </div>

      <!-- ── STEP 2: Store setup (seller only) ──────────────────────────────── -->
      <div
        v-else-if="step === 2"
        class="fade-in bg-white/88 dark:bg-neutral-900/82 w-full max-w-xl rounded-2xl p-6 shadow-2xl backdrop-blur-xl sm:p-8 md:p-10 dark:shadow-black/40"
      >
        <!-- Step indicator -->
        <div class="mb-5 flex items-center gap-2">
          <button
            class="text-xs text-gray-400 transition hover:text-gray-600 dark:text-neutral-500 dark:hover:text-neutral-300"
            @click="step = 1"
          >
            ← Back
          </button>
          <div class="ml-auto flex items-center gap-1.5">
            <div class="h-1.5 w-8 rounded-full bg-brand" />
            <div class="h-1.5 w-8 rounded-full bg-brand" />
            <div
              class="h-1.5 w-8 rounded-full bg-gray-200 dark:bg-neutral-700"
            />
          </div>
        </div>

        <div class="mb-6 text-center">
          <h2
            class="text-2xl font-black tracking-tight text-gray-900 dark:text-white"
          >
            Set up your store
          </h2>
          <p class="mt-1.5 text-sm text-gray-500 dark:text-neutral-400">
            Step 2 of 2 — you can always edit this later
          </p>
        </div>

        <div
          v-if="storeError"
          class="mb-4 rounded-xl border border-red-200 bg-red-50/70 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400"
        >
          {{ storeError }}
        </div>

        <form class="space-y-5" @submit.prevent="handleSellerSubmit">
          <!-- Logo upload -->
          <div class="flex items-center gap-4">
            <div
              class="group relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 transition-colors hover:border-brand dark:border-neutral-700 dark:bg-neutral-800"
              @click="logoInput?.click()"
            >
              <img
                v-if="storeForm.logoPreview"
                :src="storeForm.logoPreview"
                class="h-full w-full object-cover"
              />
              <div
                v-else
                class="flex h-full w-full flex-col items-center justify-center text-gray-400"
              >
                <Icon name="mdi:store-plus-outline" size="22" />
              </div>
              <div
                v-if="storeForm.uploadingLogo"
                class="absolute inset-0 flex items-center justify-center bg-black/40"
              >
                <Icon
                  name="eos-icons:loading"
                  size="16"
                  class="animate-spin text-white"
                />
              </div>
            </div>
            <div>
              <p
                class="text-[13px] font-semibold text-gray-700 dark:text-neutral-300"
              >
                Store Logo
                <span class="font-normal text-gray-400">(optional)</span>
              </p>
              <p class="text-[11px] text-gray-400">
                Square image, 200×200px min
              </p>
              <button
                type="button"
                class="mt-1 text-[11px] font-semibold text-brand hover:text-[#d81b36]"
                @click="logoInput?.click()"
              >
                {{ storeForm.logoPreview ? 'Change' : 'Upload logo' }}
              </button>
            </div>
            <input
              ref="logoInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleLogoUpload"
            />
          </div>

          <!-- Store name -->
          <div>
            <label
              class="mb-1.5 block text-[12px] font-semibold text-gray-600 dark:text-neutral-400"
              >Store Name <span class="text-brand">*</span></label
            >
            <input
              v-model="storeForm.name"
              type="text"
              placeholder="e.g. Lagos Streetwear Co."
              maxlength="100"
              class="w-full rounded-xl border bg-gray-50 px-4 py-2.5 text-[14px] text-gray-900 placeholder-gray-400 transition focus:outline-none focus:ring-2 dark:bg-neutral-800 dark:text-neutral-100"
              :class="
                storeErrors.name
                  ? 'border-red-400 focus:ring-red-400/20'
                  : 'border-gray-200 focus:border-brand focus:ring-brand/20 dark:border-neutral-700'
              "
              @input="onStoreNameChange"
            />
            <p v-if="storeErrors.name" class="mt-1 text-[11px] text-red-500">
              {{ storeErrors.name }}
            </p>
          </div>

          <!-- Store slug -->
          <div>
            <label
              class="mb-1.5 block text-[12px] font-semibold text-gray-600 dark:text-neutral-400"
              >Store URL <span class="text-brand">*</span></label
            >
            <div class="relative">
              <span
                class="absolute left-3.5 top-1/2 -translate-y-1/2 select-none text-[13px] text-gray-400 dark:text-neutral-500"
              >
                {{ $config.public.brandDomain || 'marketx.app' }}/
              </span>
              <input
                v-model="storeForm.slug"
                type="text"
                placeholder="your-store"
                maxlength="50"
                class="w-full rounded-xl border bg-gray-50 py-2.5 pr-10 text-[14px] text-gray-900 placeholder-gray-400 transition focus:outline-none focus:ring-2 dark:bg-neutral-800 dark:text-neutral-100"
                :style="{ paddingLeft: `${slugPrefixWidth}px` }"
                :class="
                  slugStatus === 'available'
                    ? 'border-emerald-400 focus:ring-emerald-400/20'
                    : slugStatus === 'taken'
                      ? 'border-red-400 focus:ring-red-400/20'
                      : 'border-gray-200 focus:border-brand focus:ring-brand/20 dark:border-neutral-700'
                "
                @input="onSlugInput"
              />
              <div class="absolute right-3 top-1/2 -translate-y-1/2">
                <Icon
                  v-if="slugStatus === 'available'"
                  name="mdi:check-circle"
                  size="18"
                  class="text-emerald-500"
                />
                <Icon
                  v-else-if="slugStatus === 'taken'"
                  name="mdi:close-circle"
                  size="18"
                  class="text-red-500"
                />
                <Icon
                  v-else-if="slugChecking"
                  name="eos-icons:loading"
                  size="16"
                  class="animate-spin text-gray-400"
                />
              </div>
            </div>
            <p v-if="storeErrors.slug" class="mt-1 text-[11px] text-red-500">
              {{ storeErrors.slug }}
            </p>
            <p
              v-else-if="slugStatus === 'available'"
              class="mt-1 text-[11px] text-emerald-600"
            >
              Available!
            </p>
          </div>

          <!-- Currency + Location -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label
                class="mb-1.5 block text-[12px] font-semibold text-gray-600 dark:text-neutral-400"
                >Currency</label
              >
              <select
                v-model="storeForm.currency"
                class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-[14px] text-gray-900 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              >
                <option v-for="c in CURRENCIES" :key="c" :value="c">
                  {{ c }}
                </option>
              </select>
            </div>
            <div>
              <label
                class="mb-1.5 block text-[12px] font-semibold text-gray-600 dark:text-neutral-400"
                >Location
                <span class="font-normal text-gray-400">(optional)</span></label
              >
              <input
                v-model="storeForm.location"
                type="text"
                placeholder="Lagos, Nigeria"
                class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-[13px] text-gray-900 placeholder-gray-400 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              />
            </div>
          </div>

          <!-- Description -->
          <div>
            <label
              class="mb-1.5 block text-[12px] font-semibold text-gray-600 dark:text-neutral-400"
              >Description
              <span class="font-normal text-gray-400">(optional)</span></label
            >
            <textarea
              v-model="storeForm.description"
              placeholder="Tell buyers about your store…"
              rows="2"
              maxlength="300"
              class="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-[14px] text-gray-900 placeholder-gray-400 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            />
          </div>

          <button
            type="submit"
            :disabled="
              storeSubmitting || slugStatus === 'taken' || slugChecking
            "
            class="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3.5 text-[14px] font-bold text-white shadow-lg shadow-brand/25 transition-all hover:bg-[#d81b36] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Icon
              v-if="storeSubmitting"
              name="eos-icons:loading"
              size="18"
              class="animate-spin"
            />
            {{
              storeSubmitting ? 'Creating your store…' : 'Launch my store 🚀'
            }}
          </button>
        </form>
      </div>

      <!-- ── STEP 3: Success ─────────────────────────────────────────────────── -->
      <div v-else-if="step === 3" class="fade-in w-full max-w-xl text-center">
        <div class="mb-6">
          <div
            class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 shadow-2xl shadow-emerald-500/30"
          >
            <Icon name="mdi:check" size="40" class="text-white" />
          </div>
          <h1 class="text-3xl font-black text-white sm:text-4xl">
            Your store is live!
          </h1>
          <p class="mt-2 text-base text-white/70">
            Welcome to MarketX, {{ form.username }}.
          </p>
        </div>

        <!-- Store link card -->
        <div
          class="mb-6 overflow-hidden rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md"
        >
          <div class="border-b border-white/10 px-6 py-4">
            <p
              class="text-[10px] font-black uppercase tracking-widest text-white/50"
            >
              Your store URL
            </p>
            <p class="mt-1 text-lg font-black text-white">
              {{ $config.public.brandDomain || 'marketx.app' }}/<span
                class="text-brand"
                >{{ createdStoreSlug }}</span
              >
            </p>
          </div>
          <button
            class="flex w-full items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
            @click="copyStoreLink"
          >
            <Icon
              :name="linkCopied ? 'mdi:check' : 'mdi:content-copy'"
              size="16"
            />
            {{ linkCopied ? 'Copied!' : 'Copy link' }}
          </button>
        </div>

        <!-- CTA buttons -->
        <div class="flex flex-col gap-3 sm:flex-row">
          <NuxtLink
            :to="`/seller/${createdStoreSlug}/products/create`"
            class="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-brand px-6 py-4 font-bold text-white shadow-2xl shadow-brand/30 transition hover:bg-[#d81b36]"
          >
            <Icon name="mdi:plus" size="18" />
            Add first product
          </NuxtLink>
          <NuxtLink
            to="/discover"
            class="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-white/20 px-6 py-4 font-bold text-white transition hover:border-white/40 hover:bg-white/10"
          >
            Browse the feed
          </NuxtLink>
        </div>

        <NuxtLink
          :to="`/${createdStoreSlug}`"
          class="mt-4 block text-sm text-white/50 transition hover:text-white"
        >
          Preview your store →
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { definePageMeta, useSeoMeta } from '#imports'
import { useAuth } from '../composables/useAuth'
import PasswordStrengthMeter from '../components/PasswordStrengthMeter.vue'
import { useMediaUpload } from '~~/layers/core/app/composables/useMediaUpload'
import { useSellerManagement } from '~~/layers/seller/app/composables/useSellerManagement'

definePageMeta({ layout: false, middleware: 'guest' })

useSeoMeta({
  title: 'Create Account',
  description: 'Join MarketX - buy, sell, and discover amazing products.',
  robots: 'noindex',
})

const config = useRuntimeConfig()
const {
  register: authRegister,
  registerSeller,
  socialLogin,
  isLoading: authLoading,
  error: authError,
  message: authMessage,
} = useAuth()
const { checkSlugAvailability } = useSellerManagement()
const { uploadMedia } = useMediaUpload()

// ── Wizard state ──────────────────────────────────────────────────────────────
const step = ref<0 | 1 | 2 | 3>(0)
const accountType = ref<'buyer' | 'seller'>('buyer')
const createdStoreSlug = ref('')

const chooseType = (type: 'buyer' | 'seller') => {
  accountType.value = type
  step.value = 1
}

// ── Account form ──────────────────────────────────────────────────────────────
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const agreedToTerms = ref(false)
const isSocialLoading = ref(false)

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
})
const errors = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const isLoading = computed(() => authLoading.value)
const isBusy = computed(
  () => authLoading.value || isSocialLoading.value || storeSubmitting.value,
)
const error = computed(() => authError.value)
const message = computed(() => authMessage.value)

const validateAccountForm = () => {
  errors.username = ''
  errors.email = ''
  errors.password = ''
  errors.confirmPassword = ''

  if (!form.username.trim()) {
    errors.username = 'Username is required'
    return false
  }
  if (form.username.trim().length < 3) {
    errors.username = 'Username must be at least 3 characters'
    return false
  }
  if (form.username.trim().length > 20) {
    errors.username = 'Username must be at most 20 characters'
    return false
  }
  if (!form.email.trim()) {
    errors.email = 'Email is required'
    return false
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Enter a valid email address'
    return false
  }
  if (!form.password) {
    errors.password = 'Password is required'
    return false
  }
  if (form.password.length < 8) {
    errors.password = 'Password must be at least 8 characters'
    return false
  }
  if (!form.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password'
    return false
  }
  if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
    return false
  }
  return true
}

const handleAccountStep = async () => {
  if (!validateAccountForm()) return

  if (accountType.value === 'seller') {
    // Don't call API yet — move to store setup step
    step.value = 2
    return
  }

  // Buyer path — same as before
  await authRegister(
    form.email.trim(),
    form.username.trim(),
    form.password,
    form.confirmPassword,
    '/user-login',
  )
}

const handleSocial = async (provider: 'google' | 'facebook' | 'tiktok') => {
  isSocialLoading.value = true
  await socialLogin(provider, '/')
}

// ── Store form ────────────────────────────────────────────────────────────────
const storeForm = reactive({
  name: '',
  slug: '',
  description: '',
  location: '',
  currency: 'NGN',
  logo: '',
  logoPreview: '',
  uploadingLogo: false,
})
const storeErrors = reactive({ name: '', slug: '' })
const storeError = ref('')
const storeSubmitting = ref(false)

const logoInput = ref<HTMLInputElement | null>(null)

const CURRENCIES = ['NGN', 'USD', 'GBP', 'EUR', 'GHS', 'KES', 'ZAR', 'CAD']

// Slug prefix measured in CSS (approx px for "marketx.app/")
const slugPrefixWidth = computed(() => {
  const domain = config.public.brandDomain || 'marketx.app'
  return domain.length * 7.5 + 24
})

const onStoreNameChange = () => {
  storeErrors.name = ''
  if (!storeForm.slug) {
    const base = storeForm.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    storeForm.slug = base
    triggerSlugCheck()
  }
}

const slugStatus = ref<'idle' | 'available' | 'taken'>('idle')
const slugChecking = ref(false)
let slugTimer: ReturnType<typeof setTimeout> | null = null

const onSlugInput = () => {
  storeErrors.slug = ''
  slugStatus.value = 'idle'
  triggerSlugCheck()
}

const triggerSlugCheck = () => {
  if (slugTimer) clearTimeout(slugTimer)
  slugTimer = setTimeout(async () => {
    const slug = storeForm.slug
    if (!slug || slug.length < 3) return
    slugChecking.value = true
    const available = await checkSlugAvailability(slug)
    slugStatus.value = available ? 'available' : 'taken'
    if (!available) storeErrors.slug = 'This URL is already taken'
    slugChecking.value = false
  }, 500)
}

const handleLogoUpload = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  storeForm.uploadingLogo = true
  try {
    const result = await uploadMedia({ file })
    storeForm.logo = result.url
    storeForm.logoPreview = result.url
  } finally {
    storeForm.uploadingLogo = false
  }
}

const handleSellerSubmit = async () => {
  storeErrors.name = ''
  storeErrors.slug = ''
  storeError.value = ''

  if (!storeForm.name.trim() || storeForm.name.trim().length < 3) {
    storeErrors.name = 'Store name must be at least 3 characters'
    return
  }
  if (!storeForm.slug.trim() || storeForm.slug.trim().length < 3) {
    storeErrors.slug = 'Store URL must be at least 3 characters'
    return
  }
  if (slugStatus.value === 'taken') {
    storeErrors.slug = 'This URL is already taken — choose another'
    return
  }

  storeSubmitting.value = true
  try {
    const res = await registerSeller({
      email: form.email.trim(),
      username: form.username.trim(),
      password: form.password,
      confirmPassword: form.confirmPassword,
      store_name: storeForm.name.trim(),
      store_slug: storeForm.slug.trim().toLowerCase(),
      store_description: storeForm.description || undefined,
      store_location: storeForm.location || undefined,
      store_logo: storeForm.logo || undefined,
      store_currency: storeForm.currency,
    })

    createdStoreSlug.value = res.store.store_slug
    step.value = 3
  } catch (e: any) {
    const msg =
      e?.data?.statusMessage ||
      e?.statusMessage ||
      e?.message ||
      'Registration failed'
    storeError.value = msg
  } finally {
    storeSubmitting.value = false
  }
}

// ── Success copy link ─────────────────────────────────────────────────────────
const linkCopied = ref(false)
const copyStoreLink = async () => {
  const domain = config.public.brandDomain || 'marketx.app'
  const url = import.meta.client
    ? `${window.location.protocol}//${window.location.host}/${createdStoreSlug.value}`
    : `https://${domain}/${createdStoreSlug.value}`
  await navigator.clipboard.writeText(url).catch(() => {})
  linkCopied.value = true
  setTimeout(() => {
    linkCopied.value = false
  }, 2000)
}

onUnmounted(() => {
  if (slugTimer) clearTimeout(slugTimer)
})
</script>

<style scoped>
.fade-in {
  animation: fadeInUp 0.45s ease-out forwards;
}
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
