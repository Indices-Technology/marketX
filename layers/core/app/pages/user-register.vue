<template>
  <!-- Plain surface, no background image and no glass — same reasoning as
       user-login.vue: the stock photo forced every element on top of it into
       translucency + white text, so contrast depended on the artwork behind
       it. Solid page + solid cards instead. -->
  <div class="min-h-screen bg-gray-50 dark:bg-neutral-950">
    <div
      class="flex min-h-screen flex-col items-center justify-center px-5 py-10 sm:px-6 md:py-12 lg:px-8"
    >
      <!-- Brand — identical lockup, size and link on every auth screen.
           Previously only verify-email showed a logo (via AuthLayout); the
           centered-card pages showed none, so the brand appeared, vanished
           and reappeared as you moved through sign-up → verify → reset. -->
      <NuxtLink
        to="/"
        class="mb-8 flex justify-center"
        aria-label="MarketX home"
      >
        <BrandLogo variant="wordmark" class="h-10 w-auto" />
      </NuxtLink>

      <!-- ── STEP 0: Choose path ─────────────────────────────────────────────── -->
      <div v-if="step === 0" class="fade-in w-full max-w-xl">
        <div class="mb-8 text-center">
          <h1
            class="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl dark:text-white"
          >
            Join {{ $config.public.siteName || 'MarketX' }}
          </h1>
          <p class="mt-2 text-base text-gray-600 dark:text-neutral-400">
            What brings you here?
          </p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <!-- Buyer card -->
          <button
            class="group flex flex-col items-center gap-4 rounded-2xl border-2 border-gray-200 bg-white p-8 text-left transition-all hover:border-brand hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
            @click="chooseType('buyer')"
          >
            <div
              class="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-3xl transition-all group-hover:scale-110 group-hover:bg-brand/15 dark:bg-neutral-800"
            >
              <icon
                name="solar:bag-4-linear"
                class="text-gray-900 dark:text-white"
                size="22"
              />
            </div>
            <div>
              <p class="text-lg font-black text-gray-900 dark:text-white">
                I'm a Buyer
              </p>
              <p
                class="mt-1 text-sm leading-relaxed text-gray-600 dark:text-neutral-400"
              >
                Browse the feed, discover products, and buy directly from
                African creators.
              </p>
            </div>
            <div
              class="mt-auto flex w-full items-center justify-end text-[11px] font-black uppercase tracking-widest text-gray-400 transition-colors group-hover:text-brand dark:text-neutral-500"
            >
              Get started →
            </div>
          </button>

          <!-- Seller card -->
          <button
            class="group flex flex-col items-center gap-4 rounded-2xl border-2 border-gray-200 bg-white p-8 text-left transition-all hover:border-brand hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
            @click="chooseType('seller')"
          >
            <div
              class="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-3xl transition-all group-hover:scale-110 group-hover:bg-brand/15 dark:bg-neutral-800"
            >
              <icon
                name="solar:shop-2-linear"
                class="text-gray-900 dark:text-white"
                size="22"
              />
            </div>
            <div>
              <p class="text-lg font-black text-gray-900 dark:text-white">
                I want to Sell
              </p>
              <p
                class="mt-1 text-sm leading-relaxed text-gray-600 dark:text-neutral-400"
              >
                Open your store, list products, and sell to buyers across Africa
                and beyond.
              </p>
            </div>
            <div
              class="mt-auto flex w-full items-center justify-end text-[11px] font-black uppercase tracking-widest text-gray-400 transition-colors group-hover:text-brand dark:text-neutral-500"
            >
              Open a store →
            </div>
          </button>
        </div>

        <p class="mt-6 text-center text-sm text-gray-600 dark:text-neutral-400">
          Already have an account?
          <NuxtLink
            to="/user-login"
            class="font-semibold text-gray-900 transition hover:text-brand dark:text-white"
            >Sign in</NuxtLink
          >
        </p>
      </div>

      <!-- ── STEP 1: Account details ─────────────────────────────────────────── -->
      <div
        v-else-if="step === 1"
        class="fade-in w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 md:p-10 dark:border-neutral-800 dark:bg-neutral-900"
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

        <!-- WhatsApp phone signup. Seller path passes ?intent=seller so
             phone-login.vue redirects back into step 2 (store setup) after
             verifying, instead of stranding a seller with a bare account. -->
        <NuxtLink
          :to="
            accountType === 'seller'
              ? '/phone-login?intent=seller'
              : '/phone-login'
          "
          class="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#25D366] bg-[#25D366] py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#20bd5a]"
        >
          <Icon name="simple-icons:whatsapp" size="18" />
          Continue with WhatsApp
        </NuxtLink>

        <div class="my-6 flex items-center justify-center space-x-4">
          <span class="h-px w-full bg-gray-300 dark:bg-neutral-700"></span>
          <span
            class="whitespace-nowrap text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-400"
            >Or</span
          >
          <span class="h-px w-full bg-gray-300 dark:bg-neutral-700"></span>
        </div>

        <!-- Social logins -->
        <div class="flex items-center gap-4">
          <button
            type="button"
            :disabled="isBusy"
            :title="$t('auth.register.continueWithGoogle')"
            :aria-label="$t('auth.register.continueWithGoogle')"
            class="flex flex-1 items-center justify-center rounded-xl border border-gray-300 bg-white py-3 shadow-sm transition hover:bg-gray-50 disabled:opacity-60 dark:border-neutral-600 dark:bg-neutral-800 dark:hover:bg-neutral-700"
            @click="handleSocial('google')"
          >
            <Icon name="simple-icons:google" class="h-6 w-6 text-[#4285F4]" />
          </button>
          <button
            type="button"
            :disabled="isBusy"
            title="Continue with TikTok"
            aria-label="Continue with TikTok"
            class="flex flex-1 items-center justify-center rounded-xl border border-gray-300 bg-white py-3 shadow-sm transition hover:bg-gray-50 disabled:opacity-60 dark:border-neutral-600 dark:bg-neutral-800 dark:hover:bg-neutral-700"
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
            <Icon name="simple-icons:facebook" class="h-6 w-6 text-white" />
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
          <!-- Username — availability resolves while typing, not at submit -->
          <div>
            <BaseInput
              v-model="form.username"
              :placeholder="$t('auth.register.usernamePlaceholder')"
              autocomplete="username"
              :disabled="isBusy"
              icon-left="solar:user-linear"
              :icon-right="usernameIcon"
              :icon-right-class="usernameIconClass"
              size="lg"
              :error="errors.username"
              @update:model-value="onUsernameInput"
            >
              <template v-if="usernameStatus === 'available'" #hint>
                <span class="text-emerald-600 dark:text-emerald-400"
                  >Username available</span
                >
              </template>
              <template v-else-if="usernameStatus === 'error'" #hint>
                <span class="text-amber-600 dark:text-amber-400">
                  Couldn&apos;t check this username
                  <button
                    type="button"
                    class="ml-1 font-semibold underline"
                    @click="runUsernameCheck"
                  >
                    Retry
                  </button>
                </span>
              </template>
            </BaseInput>

            <!-- Free alternatives, offered instead of just a red error -->
            <div
              v-if="usernameSuggestions.length"
              class="mt-2 flex flex-wrap items-center gap-1.5"
            >
              <span class="ink-faint text-2xs">Try:</span>
              <button
                v-for="s in usernameSuggestions"
                :key="s"
                type="button"
                class="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-600 transition-colors hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:hover:bg-blue-950/60"
                @click="pickUsernameSuggestion(s)"
              >
                {{ s }}
              </button>
            </div>
          </div>

          <!-- Email -->
          <BaseInput
            v-model="form.email"
            type="email"
            :placeholder="$t('auth.register.emailPlaceholder')"
            autocomplete="email"
            :disabled="isBusy"
            icon-left="solar:mention-circle-linear"
            size="lg"
            :error="errors.email"
          />

          <!-- Password -->
          <div class="grid gap-5 sm:grid-cols-2">
            <BaseInput
              v-model="form.password"
              type="password"
              :placeholder="$t('auth.register.passwordPlaceholder')"
              autocomplete="new-password"
              :disabled="isBusy"
              icon-left="solar:lock-keyhole-linear"
              size="lg"
              :error="errors.password"
            />
            <BaseInput
              v-model="form.confirmPassword"
              type="password"
              :placeholder="$t('auth.register.confirmPasswordPlaceholder')"
              autocomplete="new-password"
              :disabled="isBusy"
              icon-left="solar:lock-keyhole-linear"
              size="lg"
              :error="errors.confirmPassword"
            />
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
                to="/terms"
                class="font-semibold text-brand hover:opacity-80"
                >{{ $t('auth.register.terms') }}</NuxtLink
              >
              {{ $t('auth.register.agreeMid') }}
              <NuxtLink
                to="/privacy"
                class="font-semibold text-brand hover:opacity-80"
                >{{ $t('auth.register.privacy') }}</NuxtLink
              >
            </span>
          </label>

          <BaseButton
            type="submit"
            size="lg"
            class="w-full"
            :loading="isLoading"
            :disabled="isBusy || !agreedToTerms"
          >
            {{
              accountType === 'seller'
                ? 'Continue to store setup →'
                : $t('auth.register.createButton')
            }}
          </BaseButton>
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
        class="fade-in w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 md:p-10 dark:border-neutral-800 dark:bg-neutral-900"
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
                <Icon name="solar:shop-2-linear" size="22" />
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
                {{ $config.public.brandDomain || 'marketx.africa' }}/
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
                  name="solar:check-circle-bold"
                  size="18"
                  class="text-emerald-500"
                />
                <Icon
                  v-else-if="slugStatus === 'taken'"
                  name="solar:close-circle-bold"
                  size="18"
                  class="text-red-500"
                />
                <Icon
                  v-else-if="slugStatus === 'error'"
                  name="solar:danger-triangle-bold"
                  size="18"
                  class="text-amber-500"
                />
                <Icon
                  v-else-if="slugChecking"
                  name="eos-icons:loading"
                  size="16"
                  class="animate-spin text-gray-400"
                />
              </div>
            </div>
            <p
              v-if="slugStatus === 'error'"
              class="mt-1 text-[11px] text-amber-600"
            >
              {{ storeErrors.slug }}
              <button
                type="button"
                class="ml-1 font-semibold underline"
                @click="triggerSlugCheck"
              >
                Retry
              </button>
            </p>
            <p
              v-else-if="storeErrors.slug"
              class="mt-1 text-[11px] text-red-500"
            >
              {{ storeErrors.slug }}
            </p>
            <p
              v-else-if="slugStatus === 'available'"
              class="mt-1 text-[11px] text-emerald-600"
            >
              Available!
            </p>

            <!-- Suggestions -->
            <div
              v-if="slugSuggestions.length"
              class="mt-2 flex flex-wrap gap-1.5"
            >
              <button
                v-for="s in slugSuggestions"
                :key="s"
                type="button"
                class="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-600 transition-colors hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:hover:bg-blue-950/60"
                @click="pickSlugSuggestion(s)"
              >
                {{ s }}
              </button>
            </div>
            <button
              v-if="storeForm.name && !slugSuggestions.length"
              type="button"
              class="mt-1.5 text-[11px] font-semibold text-brand transition-colors hover:text-[#d81b36]"
              @click="loadSlugSuggestions"
            >
              Get suggestions →
            </button>
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

          <!-- Shipping origin — optional, collapsed by default -->
          <div
            class="overflow-hidden rounded-xl border border-gray-200 dark:border-neutral-700"
          >
            <button
              type="button"
              class="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800/50"
              @click="shipFromOpen = !shipFromOpen"
            >
              <div class="flex items-center gap-2.5">
                <div
                  class="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10"
                >
                  <Icon
                    name="solar:delivery-linear"
                    size="15"
                    class="text-brand"
                  />
                </div>
                <div>
                  <p
                    class="text-[13px] font-semibold text-gray-800 dark:text-neutral-200"
                  >
                    Shipping origin
                    <span
                      class="ml-1 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-400 dark:bg-neutral-800 dark:text-neutral-500"
                      >optional</span
                    >
                  </p>
                  <p class="text-[11px] text-gray-400 dark:text-neutral-500">
                    Where you ship from — enables live delivery rates
                  </p>
                </div>
              </div>
              <Icon
                name="solar:alt-arrow-down-linear"
                size="18"
                class="shrink-0 text-gray-400 transition-transform duration-200"
                :class="shipFromOpen ? 'rotate-180' : ''"
              />
            </button>
            <div
              v-if="shipFromOpen"
              class="space-y-2.5 border-t border-gray-200 px-4 pb-4 pt-3 dark:border-neutral-700"
            >
              <input
                v-model="storeForm.shipFromAddress"
                placeholder="Street address"
                :class="shipInputClass"
              />
              <div class="grid grid-cols-2 gap-2.5">
                <input
                  v-model="storeForm.shipFromCity"
                  placeholder="City"
                  :class="shipInputClass"
                />
                <input
                  v-model="storeForm.shipFromState"
                  placeholder="State / Region"
                  :class="shipInputClass"
                />
                <input
                  v-model="storeForm.shipFromZip"
                  placeholder="Postal / ZIP"
                  :class="shipInputClass"
                />
                <select
                  v-model="storeForm.shipFromCountry"
                  :class="shipInputClass"
                >
                  <option
                    v-for="c in SHIP_COUNTRIES"
                    :key="c.code"
                    :value="c.code"
                  >
                    {{ c.name }}
                  </option>
                </select>
              </div>
              <input
                v-model="storeForm.shipFromPhone"
                type="tel"
                placeholder="Pickup phone e.g. 08012345678 (optional)"
                :class="shipInputClass"
                @blur="
                  storeForm.shipFromPhone =
                    normalizePhone(storeForm.shipFromPhone) ||
                    storeForm.shipFromPhone
                "
              />
            </div>
          </div>

          <button
            type="submit"
            :disabled="
              storeSubmitting ||
              slugStatus === 'taken' ||
              slugStatus === 'error' ||
              slugChecking
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
            <Icon
              name="solar:check-circle-linear"
              size="40"
              class="text-white"
            />
          </div>
          <h1
            class="text-3xl font-black text-gray-900 sm:text-4xl dark:text-white"
          >
            Your store is live!
          </h1>
          <p class="mt-2 text-base text-gray-600 dark:text-neutral-400">
            Welcome to MarketX, {{ form.username }}.
          </p>
        </div>

        <!-- Store link card -->
        <div
          class="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div
            class="border-b border-gray-200 px-6 py-4 dark:border-neutral-800"
          >
            <p
              class="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-neutral-400"
            >
              Your store URL
            </p>
            <p class="mt-1 text-lg font-black text-gray-900 dark:text-white">
              {{ $config.public.brandDomain || 'marketx.africa' }}/<span
                class="text-brand"
                >{{ createdStoreSlug }}</span
              >
            </p>
          </div>
          <button
            class="flex w-full items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-gray-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
            @click="copyStoreLink"
          >
            <Icon
              :name="
                linkCopied ? 'solar:check-circle-linear' : 'solar:copy-linear'
              "
              size="16"
            />
            {{ linkCopied ? 'Copied!' : 'Copy link' }}
          </button>
        </div>

        <!-- Primary CTA -->
        <NuxtLink
          :to="`/seller/${createdStoreSlug}/products/create`"
          class="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand px-6 py-4 font-bold text-white shadow-2xl shadow-brand/30 transition hover:bg-[#d81b36]"
        >
          <Icon name="solar:add-circle-linear" size="18" />
          Add first product
        </NuxtLink>

        <!-- Most new sellers already have a catalogue somewhere else — adding
             products one at a time is the slowest way in, so offer the bulk
             routes right where the store goes live. -->
        <div class="mt-8 text-left">
          <p
            class="text-[10px] font-black uppercase tracking-widest text-brand"
          >
            Already selling somewhere?
          </p>
          <h2 class="mt-1 text-lg font-black text-gray-900 dark:text-white">
            Bring your products over
          </h2>

          <ul
            class="mt-3 divide-y divide-gray-100 rounded-2xl border border-gray-100 dark:divide-neutral-800 dark:border-neutral-800"
          >
            <li>
              <NuxtLink
                :to="`/seller/${createdStoreSlug}/products/bulk`"
                class="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800/60"
              >
                <span
                  class="flex min-w-0 items-center gap-2.5 text-sm font-medium text-gray-700 dark:text-neutral-300"
                >
                  <Icon
                    name="solar:document-text-linear"
                    size="18"
                    class="shrink-0"
                  />
                  Bulk import
                  <span
                    class="truncate text-xs font-normal text-gray-400 dark:text-neutral-500"
                  >
                    Spreadsheet or paste
                  </span>
                </span>
                <Icon
                  name="solar:alt-arrow-right-linear"
                  size="14"
                  class="shrink-0 text-gray-400 dark:text-neutral-500"
                />
              </NuxtLink>
            </li>

            <!-- Social imports are listed, not linked. Facebook import works
                 and stays reachable from Growth → Connected accounts while it's
                 being tested; it isn't pointed at brand-new sellers yet. TikTok
                 needs the video.list scope the app doesn't hold (see
                 layers/growth/server/utils/tiktok.oauth.ts). -->
            <li
              v-for="src in soonSources"
              :key="src.id"
              class="flex items-center justify-between gap-3 px-4 py-3.5"
            >
              <span
                class="flex min-w-0 items-center gap-2.5 text-sm font-medium text-gray-500 dark:text-neutral-400"
              >
                <Icon :name="src.icon" size="15" class="shrink-0" />
                {{ src.label }}
              </span>
              <span
                class="shrink-0 text-xs font-medium text-gray-400 dark:text-neutral-600"
              >
                Coming soon
              </span>
            </li>
          </ul>
        </div>

        <div
          class="mt-6 flex items-center justify-center gap-6 text-sm text-gray-500 dark:text-neutral-400"
        >
          <NuxtLink
            :to="`/${createdStoreSlug}`"
            class="transition hover:text-gray-900 dark:hover:text-white"
          >
            Preview your store →
          </NuxtLink>
          <NuxtLink
            to="/discover"
            class="transition hover:text-gray-900 dark:hover:text-white"
          >
            Browse the feed →
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import BrandLogo from '~~/layers/ui/app/components/BrandLogo.vue'
import { computed, reactive, ref, onMounted, onUnmounted } from 'vue'
import { definePageMeta, useRoute, useSeoMeta } from '#imports'
import { useAuth } from '../composables/useAuth'
import PasswordStrengthMeter from '../components/PasswordStrengthMeter.vue'
import { useMediaUpload } from '~~/layers/core/app/composables/useMediaUpload'
import { useSellerManagement } from '~~/layers/seller/app/composables/useSellerManagement'
import BaseInput from '~~/layers/ui/app/components/BaseInput.vue'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import { useRuntimeConfig } from '#imports'
import { normalizePhone } from '~~/shared/utils/phone'

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
  checkUsernameAvailability,
} = useAuth()
const { checkSlugAvailability, suggestSlugs, createSeller } =
  useSellerManagement()
const { uploadMedia } = useMediaUpload()

// ── Wizard state ──────────────────────────────────────────────────────────────
const step = ref<0 | 1 | 2 | 3>(0)
const accountType = ref<'buyer' | 'seller'>('buyer')
const createdStoreSlug = ref('')

// Post-phone-verify seller handoff — see guest.ts middleware's matching
// exception. The account already exists and is logged in; skip straight to
// store setup instead of showing the email/password step again. Tracked
// separately from step/accountType so handleSellerSubmit knows to call the
// authenticated "create a store for my account" endpoint instead of
// registerSeller (which creates a brand-new account + store together and
// would be wrong here — this user already has an account).
const isPhoneHandoff = ref(false)
onMounted(() => {
  if (useRoute().query.step === '2') {
    isPhoneHandoff.value = true
    accountType.value = 'seller'
    step.value = 2
  }
})

// Import routes that exist but aren't offered to brand-new sellers yet.
// Facebook import is built and testable from Growth → Connected accounts; it
// gets a link here once testing signs off. TikTok is waiting on a scope.
const soonSources = [
  {
    id: 'facebook',
    label: 'Import from Facebook',
    icon: 'simple-icons:facebook',
  },
  { id: 'tiktok', label: 'Import from TikTok', icon: 'simple-icons:tiktok' },
]

const chooseType = (type: 'buyer' | 'seller') => {
  accountType.value = type
  step.value = 1
}

// ── Account form ──────────────────────────────────────────────────────────────
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

// ── Live username availability ────────────────────────────────────────
// "Username taken" used to land only at submit — after email, password and
// confirm-password were all filled in. Check while they type, the same way the
// store URL field does one step later.
const usernameStatus = ref<
  'idle' | 'checking' | 'available' | 'taken' | 'error'
>('idle')
const usernameSuggestions = ref<string[]>([])
let usernameTimer: ReturnType<typeof setTimeout> | null = null
// Bumped on every keystroke: a slow response for an older value must not
// overwrite the verdict for what's currently in the box.
let usernameCheckSeq = 0

const runUsernameCheck = async () => {
  const username = form.username.trim()
  if (username.length < 3 || username.length > 20) {
    usernameStatus.value = 'idle'
    return
  }

  const seq = ++usernameCheckSeq
  usernameStatus.value = 'checking'
  const result = await checkUsernameAvailability(username)
  if (seq !== usernameCheckSeq) return

  if (!result) {
    // The check failed, not the username — don't block submit on our own
    // hiccup; registration is still the backstop.
    usernameStatus.value = 'error'
    return
  }

  usernameStatus.value = result.available ? 'available' : 'taken'
  usernameSuggestions.value = result.available ? [] : result.suggestions
  errors.username = result.available ? '' : result.message
}

const triggerUsernameCheck = () => {
  if (usernameTimer) clearTimeout(usernameTimer)
  usernameTimer = setTimeout(runUsernameCheck, 450)
}

const onUsernameInput = () => {
  errors.username = ''
  usernameStatus.value = 'idle'
  usernameSuggestions.value = []
  usernameCheckSeq += 1 // discard anything already in flight
  triggerUsernameCheck()
}

const usernameIcon = computed(() => {
  if (usernameStatus.value === 'checking') return 'eos-icons:loading'
  if (usernameStatus.value === 'available') return 'solar:check-circle-bold'
  if (usernameStatus.value === 'taken') return 'solar:close-circle-bold'
  if (usernameStatus.value === 'error') return 'solar:danger-triangle-bold'
  return undefined
})

const usernameIconClass = computed(() => {
  if (usernameStatus.value === 'checking') return 'animate-spin text-gray-400'
  if (usernameStatus.value === 'available') return 'text-emerald-500'
  if (usernameStatus.value === 'taken') return 'text-red-500'
  if (usernameStatus.value === 'error') return 'text-amber-500'
  return undefined
})

const pickUsernameSuggestion = (name: string) => {
  // Suggestions came back from the server as free, so no re-check needed.
  form.username = name
  usernameSuggestions.value = []
  usernameStatus.value = 'available'
  errors.username = ''
}

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
  if (usernameStatus.value === 'taken') {
    errors.username = 'This username is taken — choose another'
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
  // Mirror the server policy (enhancedPasswordSchema) and the strength meter:
  // 12+ chars with upper, lower, number, and special character.
  if (
    form.password.length < 12 ||
    !/[A-Z]/.test(form.password) ||
    !/[a-z]/.test(form.password) ||
    !/[0-9]/.test(form.password) ||
    !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(form.password)
  ) {
    errors.password =
      'Password must be at least 12 characters and include an uppercase letter, a lowercase letter, a number, and a special character'
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

  // A fast typist can submit before the debounce fires — settle the check here
  // rather than letting the server be the first to say "taken".
  if (usernameStatus.value === 'idle' || usernameStatus.value === 'checking') {
    if (usernameTimer) clearTimeout(usernameTimer)
    await runUsernameCheck()
  }
  if (usernameStatus.value === 'taken') {
    errors.username = 'This username is taken — choose another'
    return
  }

  if (accountType.value === 'seller') {
    // Don't call API yet — move to store setup step
    step.value = 2
    return
  }

  // Buyer path
  try {
    await authRegister(
      form.email.trim(),
      form.username.trim(),
      form.password,
      form.confirmPassword,
      '/user-login',
    )
  } catch (e: unknown) {
    // useAuth already put the message in the banner; also pin it to the field
    // that caused it so the fix is where the user is looking.
    applyServerFieldError(e)
  }
}

/**
 * Maps a duplicate-account error from the register endpoints back onto the
 * offending field. The server answers with "Email already in use" /
 * "Username already in use".
 */
const applyServerFieldError = (e: unknown): 'username' | 'email' | null => {
  const err = e as {
    data?: { statusMessage?: string }
    statusMessage?: string
    message?: string
  }
  const msg =
    err?.data?.statusMessage || err?.statusMessage || err?.message || ''
  if (/username/i.test(msg)) {
    errors.username = 'This username is taken — choose another'
    usernameStatus.value = 'taken'
    return 'username'
  }
  if (/email/i.test(msg)) {
    errors.email = msg
    return 'email'
  }
  return null
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
  // Shipping origin (optional) — enables live carrier rates at checkout
  shipFromAddress: '',
  shipFromCity: '',
  shipFromState: '',
  shipFromZip: '',
  shipFromCountry: 'NG',
  shipFromPhone: '',
})
const shipFromOpen = ref(false)
const SHIP_COUNTRIES = [
  { code: 'NG', name: 'Nigeria' },
  { code: 'GH', name: 'Ghana' },
  { code: 'KE', name: 'Kenya' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
]
const shipInputClass =
  'w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2 text-[13px] text-gray-900 placeholder-gray-400 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100'
const storeErrors = reactive({ name: '', slug: '' })
const storeError = ref('')
const storeSubmitting = ref(false)

const logoInput = ref<HTMLInputElement | null>(null)

const CURRENCIES = ['NGN', 'USD', 'GBP', 'EUR', 'GHS', 'KES', 'ZAR', 'CAD']

// Slug prefix measured in CSS (approx px for "marketx.africa/")
const slugPrefixWidth = computed(() => {
  const domain = config.public.brandDomain || 'marketx.africa'
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

const slugStatus = ref<'idle' | 'available' | 'taken' | 'error'>('idle')
const slugChecking = ref(false)
const slugSuggestions = ref<string[]>([])
let slugTimer: ReturnType<typeof setTimeout> | null = null

const onSlugInput = () => {
  storeErrors.slug = ''
  slugStatus.value = 'idle'
  slugSuggestions.value = []
  triggerSlugCheck()
}

const triggerSlugCheck = () => {
  if (slugTimer) clearTimeout(slugTimer)
  slugTimer = setTimeout(async () => {
    const slug = storeForm.slug
    if (!slug || slug.length < 3) return
    slugChecking.value = true
    const available = await checkSlugAvailability(slug)
    // null = the check itself failed (network/validation hiccup) — never
    // treat that as "taken", or the user gets stuck on a URL that was never
    // actually checked.
    if (available === null) {
      slugStatus.value = 'error'
      storeErrors.slug = "Couldn't check this URL — try again"
    } else {
      slugStatus.value = available ? 'available' : 'taken'
      storeErrors.slug = available ? '' : 'This URL is already taken'
    }
    slugChecking.value = false
  }, 500)
}

const loadSlugSuggestions = async () => {
  if (!storeForm.name) return
  const suggestions = await suggestSlugs(storeForm.name)
  slugSuggestions.value = suggestions.slice(0, 4)
}

const pickSlugSuggestion = (s: string) => {
  storeForm.slug = s
  slugSuggestions.value = []
  slugStatus.value = 'available'
  storeErrors.slug = ''
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
  if (slugStatus.value === 'error') {
    storeErrors.slug = "Couldn't check this URL — try again"
    return
  }

  storeSubmitting.value = true
  try {
    if (isPhoneHandoff.value) {
      // Already authenticated via phone OTP — attach a store to THIS account
      // rather than registering a new one. createSeller() handles its own
      // navigation (into product-creation onboarding), so no step/slug
      // bookkeeping needed here. Shipping origin isn't collected by this
      // endpoint — settable later from seller settings.
      await createSeller({
        store_name: storeForm.name.trim(),
        store_slug: storeForm.slug.trim().toLowerCase(),
        store_description: storeForm.description || undefined,
        store_location: storeForm.location || undefined,
        store_logo: storeForm.logo || undefined,
        default_currency: storeForm.currency,
      })
      return
    }

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
      // Shipping origin (optional)
      shipFromAddress: storeForm.shipFromAddress || undefined,
      shipFromCity: storeForm.shipFromCity || undefined,
      shipFromState: storeForm.shipFromState || undefined,
      shipFromZip: storeForm.shipFromZip || undefined,
      shipFromCountry: storeForm.shipFromCountry || undefined,
      shipFromPhone: storeForm.shipFromPhone || undefined,
    })

    createdStoreSlug.value = res.store.store_slug
    step.value = 3
  } catch (e: any) {
    // A taken username/email belongs to the account step — send them back to
    // the field instead of showing a store-step error about an invisible input.
    const field = applyServerFieldError(e)
    if (field) {
      step.value = 1
      return
    }
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
  const domain = config.public.brandDomain || 'marketx.africa'
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
  if (usernameTimer) clearTimeout(usernameTimer)
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
