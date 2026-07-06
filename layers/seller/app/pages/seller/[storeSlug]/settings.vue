<template>
  <div class="max-w-2xl px-4 py-6 sm:px-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-neutral-100">
        Store Settings
      </h1>
      <p class="mt-1 text-[13px] text-gray-400 dark:text-neutral-500">
        @{{ storeSlug }}
      </p>
    </div>

    <!-- Loading skeleton -->
    <div v-if="pageLoading" class="animate-pulse space-y-4">
      <div class="h-32 rounded-2xl bg-gray-100 dark:bg-neutral-800" />
      <div class="h-10 rounded-xl bg-gray-100 dark:bg-neutral-800" />
      <div class="h-10 rounded-xl bg-gray-100 dark:bg-neutral-800" />
      <div class="h-10 rounded-xl bg-gray-100 dark:bg-neutral-800" />
    </div>

    <template v-else>
      <!-- Success -->
      <div
        v-if="saveSuccess"
        class="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
      >
        <Icon name="mdi:check-circle" size="16" />
        Store updated successfully!
      </div>

      <!-- Error -->
      <div
        v-if="error"
        class="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400"
      >
        {{ error }}
      </div>

      <form class="space-y-5" @submit.prevent="handleSubmit">
        <!-- Banner -->
        <div
          class="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <h2
            class="text-[14px] font-semibold text-gray-900 dark:text-neutral-100"
          >
            Store Branding
          </h2>

          <!-- Banner upload -->
          <div>
            <label
              class="mb-1.5 block text-[12px] font-semibold text-gray-600 dark:text-neutral-400"
              >Store Banner</label
            >
            <div
              class="group relative h-32 cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 transition-colors hover:border-brand dark:border-neutral-700 dark:bg-neutral-800"
              :style="
                bannerPreview
                  ? {
                      backgroundImage: `url(${bannerPreview})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : {}
              "
              @click="bannerInput?.click()"
            >
              <div
                v-if="!bannerPreview"
                class="absolute inset-0 flex flex-col items-center justify-center gap-1 text-gray-400"
              >
                <Icon name="mdi:image-plus-outline" size="28" />
                <span class="text-[11px] font-medium">Upload banner</span>
              </div>
              <div
                v-else
                class="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30"
              >
                <Icon
                  name="mdi:pencil"
                  size="22"
                  class="text-white opacity-0 transition-opacity group-hover:opacity-100"
                />
              </div>
              <div
                v-if="isUploadingBanner"
                class="absolute inset-0 flex items-center justify-center bg-black/40"
              >
                <Icon
                  name="eos-icons:loading"
                  size="24"
                  class="animate-spin text-white"
                />
              </div>
            </div>
            <input
              ref="bannerInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleBannerUpload"
            />
          </div>

          <!-- Logo upload -->
          <div class="flex items-center gap-4">
            <div
              class="group relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 transition-colors hover:border-brand dark:border-neutral-700 dark:bg-neutral-800"
              @click="logoInput?.click()"
            >
              <img
                v-if="logoPreview"
                :src="logoPreview"
                class="h-full w-full object-cover"
              />
              <div
                v-else
                class="flex h-full w-full flex-col items-center justify-center text-gray-400"
              >
                <Icon name="mdi:store-plus-outline" size="22" />
              </div>
              <div
                v-if="isUploadingLogo"
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
              </p>
              <button
                type="button"
                class="mt-1 text-[11px] font-semibold text-brand transition-colors hover:text-[#d81b36]"
                @click="logoInput?.click()"
              >
                {{ logoPreview ? 'Change logo' : 'Upload logo' }}
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
        </div>

        <!-- Store Info -->
        <div
          class="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <h2
            class="text-[14px] font-semibold text-gray-900 dark:text-neutral-100"
          >
            Store Information
          </h2>

          <!-- Store Name -->
          <div>
            <label
              class="mb-1.5 block text-[12px] font-semibold text-gray-600 dark:text-neutral-400"
            >
              Store Name <span class="text-brand">*</span>
            </label>
            <input
              v-model="form.store_name"
              type="text"
              maxlength="100"
              required
              class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-[14px] text-gray-900 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            />
          </div>

          <!-- Slug (read-only) -->
          <div>
            <label
              class="mb-1.5 block text-[12px] font-semibold text-gray-600 dark:text-neutral-400"
            >
              Store URL
              <span class="text-[11px] font-normal text-gray-400"
                >(cannot be changed)</span
              >
            </label>
            <div
              class="w-full select-none rounded-xl border border-gray-200 bg-gray-100 px-4 py-2.5 text-[14px] text-gray-500 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-400"
            >
              {{
                $config.public.brandDomain || 'marketx.africa'
              }}/sellers/profile/{{ storeSlug }}
            </div>
          </div>

          <!-- Currency -->
          <div>
            <label
              class="mb-1.5 block text-[12px] font-semibold text-gray-600 dark:text-neutral-400"
              >Store Currency</label
            >
            <select
              v-model="form.default_currency"
              class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-[14px] text-gray-900 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            >
              <option v-for="c in SUPPORTED_CURRENCIES" :key="c" :value="c">
                {{ c }}
              </option>
            </select>
          </div>

          <!-- Description -->
          <div>
            <label
              class="mb-1.5 block text-[12px] font-semibold text-gray-600 dark:text-neutral-400"
              >Description</label
            >
            <textarea
              v-model="form.store_description"
              rows="3"
              maxlength="500"
              class="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-[14px] text-gray-900 placeholder-gray-400 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            />
            <p class="mt-0.5 text-right text-[11px] text-gray-400">
              {{ form.store_description?.length ?? 0 }}/500
            </p>
          </div>
        </div>

        <!-- Contact -->
        <div
          class="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <h2
            class="text-[14px] font-semibold text-gray-900 dark:text-neutral-100"
          >
            Contact & Location
          </h2>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label
                class="mb-1.5 block text-[12px] font-semibold text-gray-600 dark:text-neutral-400"
                >Location</label
              >
              <input
                v-model="form.store_location"
                type="text"
                placeholder="Lagos, Nigeria"
                class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-[13px] text-gray-900 placeholder-gray-400 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              />
            </div>
            <div>
              <label
                class="mb-1.5 block text-[12px] font-semibold text-gray-600 dark:text-neutral-400"
                >Phone</label
              >
              <input
                v-model="form.store_phone"
                type="tel"
                class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-[13px] text-gray-900 placeholder-gray-400 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              />
            </div>
          </div>

          <div>
            <label
              class="mb-1.5 block text-[12px] font-semibold text-gray-600 dark:text-neutral-400"
              >Website</label
            >
            <input
              v-model="form.store_website"
              type="url"
              placeholder="https://yourstore.com"
              class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-[14px] text-gray-900 placeholder-gray-400 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            />
          </div>
        </div>

        <!-- Map Discovery -->
        <div
          class="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div class="flex items-center justify-between">
            <div>
              <h2
                class="text-[14px] font-semibold text-gray-900 dark:text-neutral-100"
              >
                Map Discovery
              </h2>
              <p class="mt-0.5 text-[12px] text-gray-500 dark:text-neutral-400">
                Let buyers find your store on the Near Me map
              </p>
            </div>
            <button
              type="button"
              class="flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-semibold transition"
              :class="
                form.hideLocation
                  ? 'bg-gray-100 text-gray-500 dark:bg-neutral-800 dark:text-neutral-400'
                  : 'bg-brand/10 text-brand'
              "
              @click="form.hideLocation = !form.hideLocation"
            >
              <Icon
                :name="
                  form.hideLocation ? 'mdi:eye-off-outline' : 'mdi:eye-outline'
                "
                size="15"
              />
              {{ form.hideLocation ? 'Hidden' : 'Visible on map' }}
            </button>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label
                class="mb-1.5 block text-[12px] font-semibold text-gray-600 dark:text-neutral-400"
                >City</label
              >
              <input
                v-model="form.city"
                type="text"
                placeholder="Lagos"
                class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-[13px] text-gray-900 placeholder-gray-400 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              />
            </div>
            <div>
              <label
                class="mb-1.5 block text-[12px] font-semibold text-gray-600 dark:text-neutral-400"
                >State / Region</label
              >
              <select
                v-model="form.state"
                class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-[13px] text-gray-900 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              >
                <option value="" disabled>Select state</option>
                <option v-for="s in NIGERIA_STATES" :key="s" :value="s">
                  {{ s }}
                </option>
              </select>
            </div>
          </div>

          <div>
            <label
              class="mb-1.5 block text-[12px] font-semibold text-gray-600 dark:text-neutral-400"
              >Display location label</label
            >
            <input
              v-model="form.locationLabel"
              type="text"
              placeholder="e.g. Yaba, Lagos"
              class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-[13px] text-gray-900 placeholder-gray-400 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            />
          </div>

          <div>
            <div class="mb-1.5 flex items-center justify-between">
              <label
                class="text-[12px] font-semibold text-gray-600 dark:text-neutral-400"
                >GPS Coordinates</label
              >
              <button
                type="button"
                :disabled="gettingLocation"
                class="flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1.5 text-[11px] font-semibold text-gray-600 transition hover:bg-brand/10 hover:text-brand disabled:opacity-50 dark:bg-neutral-800 dark:text-neutral-300"
                @click="detectLocation"
              >
                <Icon
                  :name="gettingLocation ? 'mdi:loading' : 'mdi:crosshairs-gps'"
                  size="13"
                  :class="gettingLocation && 'animate-spin'"
                />
                {{ gettingLocation ? 'Detecting…' : 'Detect my location' }}
              </button>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <input
                v-model.number="form.latitude"
                type="number"
                step="0.000001"
                placeholder="Latitude e.g. 6.5244"
                class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-[13px] text-gray-900 placeholder-gray-400 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              />
              <input
                v-model.number="form.longitude"
                type="number"
                step="0.000001"
                placeholder="Longitude e.g. 3.3792"
                class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-[13px] text-gray-900 placeholder-gray-400 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              />
            </div>
            <p class="mt-1.5 text-[11px] text-gray-400 dark:text-neutral-500">
              Used to show your store on the buyer map. City-level precision
              recommended.
            </p>
          </div>
        </div>

        <!-- Shipping Origin -->
        <div
          class="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div>
            <h2
              class="text-[14px] font-semibold text-gray-900 dark:text-neutral-100"
            >
              Shipping Origin
            </h2>
            <p class="mt-0.5 text-[12px] text-gray-400 dark:text-neutral-500">
              Where your orders ship from. Used to calculate accurate shipping
              rates at checkout.
            </p>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="col-span-2">
              <label
                class="mb-1.5 block text-[12px] font-semibold text-gray-600 dark:text-neutral-400"
                >Sender Name (for shipping labels)</label
              >
              <input
                v-model="form.shipFromName"
                type="text"
                placeholder="e.g. Lagos Warehouse"
                class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-[13px] text-gray-900 placeholder-gray-400 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              />
            </div>
            <div class="col-span-2">
              <label
                class="mb-1.5 block text-[12px] font-semibold text-gray-600 dark:text-neutral-400"
                >Street Address <span class="text-brand">*</span></label
              >
              <input
                v-model="form.shipFromAddress"
                type="text"
                placeholder="123 Market Street"
                class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-[13px] text-gray-900 placeholder-gray-400 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              />
            </div>
            <div>
              <label
                class="mb-1.5 block text-[12px] font-semibold text-gray-600 dark:text-neutral-400"
                >City <span class="text-brand">*</span></label
              >
              <input
                v-model="form.shipFromCity"
                type="text"
                placeholder="Lagos"
                class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-[13px] text-gray-900 placeholder-gray-400 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              />
            </div>
            <div>
              <label
                class="mb-1.5 block text-[12px] font-semibold text-gray-600 dark:text-neutral-400"
                >State / Province</label
              >
              <select
                v-if="form.shipFromCountry === 'NG'"
                v-model="form.shipFromState"
                class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-[13px] text-gray-900 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              >
                <option value="" disabled>Select state</option>
                <option v-for="s in NIGERIA_STATES" :key="s" :value="s">
                  {{ s }}
                </option>
              </select>
              <input
                v-else
                v-model="form.shipFromState"
                type="text"
                placeholder="State / Province"
                class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-[13px] text-gray-900 placeholder-gray-400 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              />
            </div>
            <div>
              <label
                class="mb-1.5 block text-[12px] font-semibold text-gray-600 dark:text-neutral-400"
                >Postal / ZIP Code</label
              >
              <input
                v-model="form.shipFromZip"
                type="text"
                placeholder="100001"
                class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-[13px] text-gray-900 placeholder-gray-400 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              />
            </div>
            <div>
              <label
                class="mb-1.5 block text-[12px] font-semibold text-gray-600 dark:text-neutral-400"
                >Country</label
              >
              <select
                v-model="form.shipFromCountry"
                class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-[13px] text-gray-900 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              >
                <option
                  v-for="c in SHIP_FROM_COUNTRIES"
                  :key="c.code"
                  :value="c.code"
                >
                  {{ c.name }}
                </option>
              </select>
            </div>
            <div class="col-span-2">
              <label
                class="mb-1.5 block text-[12px] font-semibold text-gray-600 dark:text-neutral-400"
                >Contact Phone</label
              >
              <input
                v-model="form.shipFromPhone"
                type="tel"
                placeholder="+2348012345678"
                class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-[13px] text-gray-900 placeholder-gray-400 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              />
            </div>
          </div>

          <div
            v-if="!form.shipFromAddress || !form.shipFromCity"
            class="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3.5 py-3 text-[12px] text-amber-700 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-400"
          >
            <Icon name="mdi:alert-outline" size="14" class="mt-0.5 shrink-0" />
            Shipping rates won't be shown at checkout until you save your
            ship-from address and city.
          </div>
        </div>

        <!-- Pay on Delivery -->
        <div class="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-[14px] font-semibold text-gray-900 dark:text-neutral-100">Pay on Delivery</h2>
              <p class="mt-0.5 text-[12px] text-gray-400 dark:text-neutral-500">Buyers prepay shipping; a courier collects the product amount in cash on delivery. We're finishing the courier integration.</p>
            </div>
            <span
              class="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
            >
              Coming soon
            </span>
          </div>

          <!-- POD config hidden until the courier COD integration is live -->
          <template v-if="false">
            <!-- GIG (the only POD courier) picks up from the ship-from origin -->
            <p
              v-if="!form.shipFromAddress || !form.shipFromCity"
              class="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12px] text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-400"
            >
              <Icon name="mdi:alert-outline" size="15" class="mt-0.5 shrink-0" />
              <span>
                Pay on Delivery is fulfilled by <strong>GIG Logistics</strong>,
                which picks up from your <strong>Shipping Origin</strong>. Add
                your ship-from address above, or POD won't be offered to buyers.
              </span>
            </p>

            <!-- Delivery window -->
            <div>
              <label class="mb-1.5 block text-[12px] font-semibold text-gray-600 dark:text-neutral-400">
                Delivery window (days)
              </label>
              <input
                v-model.number="form.pod_delivery_days"
                type="number"
                min="1"
                max="30"
                class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-[13px] text-gray-900 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              />
              <p class="mt-0.5 text-[11px] text-gray-400">Buyers will be reminded if delivery takes longer than this.</p>
            </div>

            <!-- Zone selector -->
            <div>
              <label class="mb-1.5 block text-[12px] font-semibold text-gray-600 dark:text-neutral-400">
                Eligible states (leave empty = all of Nigeria)
              </label>
              <div class="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                <label
                  v-for="state in NIGERIAN_STATES"
                  :key="state"
                  class="flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[12px] transition"
                  :class="form.pod_zones.includes(state)
                    ? 'border-brand bg-brand/5 text-brand dark:bg-brand/10'
                    : 'border-gray-200 text-gray-600 dark:border-neutral-700 dark:text-neutral-400'"
                >
                  <input
                    type="checkbox"
                    class="hidden"
                    :checked="form.pod_zones.includes(state)"
                    @change="toggleZone(state)"
                  />
                  {{ state }}
                </label>
              </div>
              <p v-if="form.pod_zones.length" class="mt-1.5 text-[11px] text-gray-400">
                {{ form.pod_zones.length }} state(s) selected
              </p>
            </div>
          </template>
        </div>

        <!-- Self / Own Delivery (BYOS) -->
        <div class="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-[14px] font-semibold text-gray-900 dark:text-neutral-100">Self / Own Delivery</h2>
              <p class="mt-0.5 text-[12px] text-gray-400 dark:text-neutral-500">Deliver orders yourself (own rider / hand delivery) instead of, or alongside, a carrier. Shown as an option at checkout.</p>
            </div>
            <button
              type="button"
              @click="form.byos_enabled = !form.byos_enabled"
              class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors"
              :class="form.byos_enabled ? 'bg-brand' : 'bg-gray-200 dark:bg-neutral-700'"
            >
              <span
                class="inline-block h-4 w-4 translate-x-1 transform rounded-full bg-white shadow transition-transform"
                :class="form.byos_enabled ? 'translate-x-6' : 'translate-x-1'"
              />
            </button>
          </div>

          <template v-if="form.byos_enabled">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 block text-[12px] font-semibold text-gray-600 dark:text-neutral-400">Flat delivery fee (₦)</label>
                <input
                  v-model.number="form.byos_flat"
                  type="number" min="0" step="50"
                  class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-[13px] text-gray-900 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                />
                <p class="mt-0.5 text-[11px] text-gray-400">What the buyer pays for delivery. Leave 0 for free.</p>
              </div>
              <div>
                <label class="mb-1.5 block text-[12px] font-semibold text-gray-600 dark:text-neutral-400">Free delivery over (₦)</label>
                <input
                  v-model.number="form.byos_freeOver"
                  type="number" min="0" step="500"
                  class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-[13px] text-gray-900 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                />
                <p class="mt-0.5 text-[11px] text-gray-400">Order subtotal above this delivers free. 0 = off.</p>
              </div>
            </div>

            <div>
              <label class="mb-1.5 block text-[12px] font-semibold text-gray-600 dark:text-neutral-400">Delivery time (shown to buyer)</label>
              <input
                v-model="form.byos_eta"
                type="text" maxlength="120" placeholder="e.g. 2–4 days (delivered by us)"
                class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-[13px] text-gray-900 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              />
            </div>

            <div class="flex items-center justify-between rounded-xl border border-gray-200 px-3.5 py-3 dark:border-neutral-700">
              <div>
                <p class="text-[13px] font-medium text-gray-900 dark:text-neutral-100">Offer in-person pickup</p>
                <p class="text-[11px] text-gray-400">A free "collect from seller" option at checkout.</p>
              </div>
              <button
                type="button"
                @click="form.byos_pickup = !form.byos_pickup"
                class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors"
                :class="form.byos_pickup ? 'bg-brand' : 'bg-gray-200 dark:bg-neutral-700'"
              >
                <span class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform" :class="form.byos_pickup ? 'translate-x-6' : 'translate-x-1'" />
              </button>
            </div>
            <div v-if="form.byos_pickup">
              <label class="mb-1.5 block text-[12px] font-semibold text-gray-600 dark:text-neutral-400">Pickup note (optional)</label>
              <input
                v-model="form.byos_pickupNote"
                type="text" maxlength="200" placeholder="e.g. Collect at Shop 12, Balogun Market, 10am–6pm"
                class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-[13px] text-gray-900 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              />
            </div>
            <p class="text-[11px] text-gray-400">Funds are still held by MarketX and released to you when the buyer confirms receipt — buyer protection is unchanged.</p>
          </template>
        </div>

        <!-- Video watermark -->
        <div
          class="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-start gap-2">
              <Icon
                name="mdi:movie-edit-outline"
                size="20"
                class="mt-0.5 shrink-0 text-brand"
              />
              <div>
                <h2 class="text-[14px] font-semibold text-gray-900 dark:text-neutral-100">
                  Video watermark
                </h2>
                <p class="text-[12px] text-gray-400 dark:text-neutral-500">
                  Stamp your handle on Reels &amp; videos, so clips reshared off
                  MarketX still point back to your store.
                </p>
              </div>
            </div>
            <button
              type="button"
              class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors"
              :class="form.watermark_enabled ? 'bg-brand' : 'bg-gray-200 dark:bg-neutral-700'"
              @click="form.watermark_enabled = !form.watermark_enabled"
            >
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
                :class="form.watermark_enabled ? 'translate-x-6' : 'translate-x-1'"
              />
            </button>
          </div>

          <template v-if="form.watermark_enabled">
            <div>
              <label
                class="mb-1 block text-[12px] font-medium text-gray-600 dark:text-neutral-400"
              >
                Watermark label
              </label>
              <input
                v-model="form.watermark_text"
                type="text"
                maxlength="24"
                :placeholder="form.store_name || 'Your store name'"
                class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-[13px] text-gray-900 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              />
              <p class="mt-1 text-[11px] text-gray-400 dark:text-neutral-500">
                {{ (form.watermark_text || '').length }}/24 · Leave blank to use
                your store name
              </p>
            </div>

            <!-- Mini preview -->
            <div
              class="relative flex h-24 items-end justify-end overflow-hidden rounded-xl bg-gradient-to-br from-neutral-700 to-neutral-900 p-2"
            >
              <Icon
                name="mdi:play-circle-outline"
                size="28"
                class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/20"
              />
              <span
                class="rounded bg-black/20 px-1.5 py-0.5 text-[11px] font-bold text-white/90"
                style="text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6)"
              >
                {{ watermarkPreview }}
              </span>
            </div>
          </template>
        </div>

        <!-- Save -->
        <button
          type="submit"
          :disabled="isSaving || isUploadingLogo || isUploadingBanner"
          class="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3.5 text-[14px] font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
        >
          <Icon
            v-if="isSaving"
            name="eos-icons:loading"
            size="18"
            class="animate-spin"
          />
          {{ isSaving ? 'Saving…' : 'Save Changes' }}
        </button>
      </form>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useSellerManagement } from '~~/layers/seller/app/composables/useSellerManagement'
import { useSeo } from '~~/layers/core/app/composables/useSeo'
import { useMediaUpload } from '~~/layers/core/app/composables/useMediaUpload'
import { useGeocode } from '~~/layers/core/app/composables/useGeocode'
import { SUPPORTED_CURRENCIES } from '~~/shared/utils/currency'
import { NIGERIA_STATES } from '~~/shared/utils/locations'

const { reverseGeocode } = useGeocode()

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT',
  'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi',
  'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo',
  'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
]

const SHIP_FROM_COUNTRIES = [
  { code: 'NG', name: 'Nigeria' },
  { code: 'GH', name: 'Ghana' },
  { code: 'KE', name: 'Kenya' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'SN', name: 'Senegal' },
  { code: 'CI', name: "Côte d'Ivoire" },
  { code: 'CM', name: 'Cameroon' },
  { code: 'TZ', name: 'Tanzania' },
  { code: 'UG', name: 'Uganda' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'AE', name: 'UAE' },
  { code: 'CN', name: 'China' },
]

definePageMeta({ middleware: 'auth', layout: 'store-layout' })

useSeo().setSettingsPage()

const route = useRoute()
const storeSlug = computed(() => route.params.storeSlug as string)

const { loadPublicSeller, updateSeller, currentSeller, error, isLoading } =
  useSellerManagement()
const { uploadMedia } = useMediaUpload()

const pageLoading = ref(true)
const isSaving = ref(false)
const saveSuccess = ref(false)
const logoInput = ref<HTMLInputElement | null>(null)
const bannerInput = ref<HTMLInputElement | null>(null)
const logoPreview = ref('')
const bannerPreview = ref('')
const isUploadingLogo = ref(false)
const isUploadingBanner = ref(false)

const form = reactive({
  store_name: '',
  store_description: '',
  store_location: '',
  store_phone: '',
  store_website: '',
  store_logo: '',
  store_banner: '',
  default_currency: 'NGN' as string,
  // Shipping origin
  shipFromName: '',
  shipFromAddress: '',
  shipFromCity: '',
  shipFromState: '',
  shipFromZip: '',
  shipFromCountry: 'NG',
  shipFromPhone: '',
  // Map / Discovery
  latitude: null as number | null,
  longitude: null as number | null,
  city: '',
  state: '',
  locationLabel: '',
  hideLocation: false,
  // Pay on Delivery
  pod_enabled: false,
  pod_zones: [] as string[],
  pod_delivery_days: 3,
  // Bring-your-own-shipping (BYOS) — money fields in major NGN
  byos_enabled: false,
  byos_flat: 0,
  byos_freeOver: 0,
  byos_pickup: false,
  byos_pickupNote: '',
  byos_eta: '',
  // Media watermark
  watermark_enabled: false,
  watermark_text: '',
})

// Live preview label for the watermark (falls back to the store name).
const watermarkPreview = computed(
  () => form.watermark_text?.trim() || form.store_name?.trim() || 'Your store',
)

const gettingLocation = ref(false)

const detectLocation = () => {
  if (!navigator.geolocation) return
  gettingLocation.value = true
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const lat = Math.round(pos.coords.latitude * 1e6) / 1e6
      const lng = Math.round(pos.coords.longitude * 1e6) / 1e6
      form.latitude = lat
      form.longitude = lng

      try {
        const geo = await reverseGeocode(lat, lng)
        if (geo?.city && !form.city) form.city = geo.city
        if (geo?.principalSubdivision && !form.state) {
          // strip trailing " State" suffix common in Nigerian responses
          form.state = geo.principalSubdivision.replace(/\s+State$/i, '').trim()
        }
        if (!form.locationLabel && geo?.city) {
          form.locationLabel = geo.principalSubdivision
            ? `${geo.city}, ${geo.principalSubdivision.replace(/\s+State$/i, '').trim()}`
            : geo.city
        }
      } catch {
        // coords are still set; city/state just won't be prefilled
      } finally {
        gettingLocation.value = false
      }
    },
    () => {
      gettingLocation.value = false
    },
    { enableHighAccuracy: false, timeout: 10000 },
  )
}

const prefillForm = (s: any) => {
  form.store_name = s.store_name ?? ''
  form.store_description = s.store_description ?? ''
  form.store_location = s.store_location ?? ''
  form.store_phone = s.store_phone ?? ''
  form.store_website = s.store_website ?? ''
  form.store_logo = s.store_logo ?? ''
  form.store_banner = s.store_banner ?? ''
  form.default_currency = s.default_currency ?? 'NGN'
  logoPreview.value = s.store_logo ?? ''
  bannerPreview.value = s.store_banner ?? ''
  // Shipping origin
  form.shipFromName = s.shipFromName ?? ''
  form.shipFromAddress = s.shipFromAddress ?? ''
  form.shipFromCity = s.shipFromCity ?? ''
  form.shipFromState = s.shipFromState ?? ''
  form.shipFromZip = s.shipFromZip ?? ''
  form.shipFromCountry = s.shipFromCountry ?? 'NG'
  form.shipFromPhone = s.shipFromPhone ?? ''
  // Map / Discovery
  form.latitude = s.latitude ?? null
  form.longitude = s.longitude ?? null
  form.city = s.city ?? ''
  form.state = s.state ?? ''
  form.locationLabel = s.locationLabel ?? ''
  form.hideLocation = s.hideLocation ?? false
  // Pay on Delivery
  form.pod_enabled = s.pod_enabled ?? false
  form.pod_zones = (s.pod_zones as string[]) ?? []
  form.pod_delivery_days = s.pod_delivery_days ?? 3
  // BYOS (stored in kobo → display in naira)
  const sc = (s.shippingConfig ?? {}) as Record<string, any>
  form.byos_enabled = !!sc.selfEnabled
  form.byos_flat = (sc.flatRateMinor ?? 0) / 100
  form.byos_freeOver = (sc.freeOverMinor ?? 0) / 100
  form.byos_pickup = !!sc.pickupEnabled
  form.byos_pickupNote = sc.pickupNote ?? ''
  form.byos_eta = sc.etaText ?? ''
  // Media watermark
  form.watermark_enabled = s.watermark_enabled ?? false
  form.watermark_text = s.watermark_text ?? ''
}

const toggleZone = (state: string) => {
  const idx = form.pod_zones.indexOf(state)
  if (idx >= 0) form.pod_zones.splice(idx, 1)
  else form.pod_zones.push(state)
}

onMounted(async () => {
  try {
    await loadPublicSeller(storeSlug.value)
    if (currentSeller.value) prefillForm(currentSeller.value)
  } finally {
    pageLoading.value = false
  }
})

watch(storeSlug, async (slug) => {
  pageLoading.value = true
  try {
    await loadPublicSeller(slug)
    if (currentSeller.value) prefillForm(currentSeller.value)
  } finally {
    pageLoading.value = false
  }
})

const handleLogoUpload = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  isUploadingLogo.value = true
  try {
    const result = await uploadMedia({ file })
    form.store_logo = result.url
    logoPreview.value = result.url
  } finally {
    isUploadingLogo.value = false
  }
}

const handleBannerUpload = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  isUploadingBanner.value = true
  try {
    const result = await uploadMedia({ file })
    form.store_banner = result.url
    bannerPreview.value = result.url
  } finally {
    isUploadingBanner.value = false
  }
}

const handleSubmit = async () => {
  if (isSaving.value || !currentSeller.value) return
  isSaving.value = true
  saveSuccess.value = false
  try {
    await updateSeller(currentSeller.value.id, {
      store_name: form.store_name || undefined,
      store_description: form.store_description || undefined,
      store_location: form.store_location || undefined,
      store_phone: form.store_phone || undefined,
      store_website: form.store_website || undefined,
      store_logo: form.store_logo || undefined,
      store_banner: form.store_banner || undefined,
      default_currency: form.default_currency,
      // Shipping origin
      shipFromName: form.shipFromName || undefined,
      shipFromAddress: form.shipFromAddress || undefined,
      shipFromCity: form.shipFromCity || undefined,
      shipFromState: form.shipFromState || undefined,
      shipFromZip: form.shipFromZip || undefined,
      shipFromCountry: form.shipFromCountry || 'NG',
      shipFromPhone: form.shipFromPhone || undefined,
      // Map / Discovery
      latitude: form.latitude,
      longitude: form.longitude,
      city: form.city || undefined,
      state: form.state || undefined,
      locationLabel: form.locationLabel || undefined,
      hideLocation: form.hideLocation,
      // Pay on Delivery
      pod_enabled: form.pod_enabled,
      pod_zones: form.pod_zones,
      pod_delivery_days: form.pod_delivery_days,
      // Bring-your-own-shipping (convert major NGN → kobo)
      shippingConfig: form.byos_enabled
        ? {
            selfEnabled: true,
            flatRateMinor: Math.max(0, Math.round(form.byos_flat * 100)),
            freeOverMinor:
              form.byos_freeOver > 0
                ? Math.round(form.byos_freeOver * 100)
                : undefined,
            pickupEnabled: form.byos_pickup,
            pickupNote: form.byos_pickupNote || undefined,
            etaText: form.byos_eta || undefined,
          }
        : { selfEnabled: false },
      // Media watermark. When enabled but blank, send null so it resets to the
      // store-name default instead of keeping a stale custom label.
      watermark_enabled: form.watermark_enabled,
      watermark_text: form.watermark_enabled
        ? form.watermark_text.trim() || null
        : undefined,
    } as any)
    saveSuccess.value = true
    setTimeout(() => {
      saveSuccess.value = false
    }, 3000)
  } finally {
    isSaving.value = false
  }
}
</script>
