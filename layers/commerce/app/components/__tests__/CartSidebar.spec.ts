import { mount } from '@vue/test-utils'
import { vi } from 'vitest'
import { ref } from 'vue'
import CartSidebar from '../CartSidebar.vue'

vi.mock('~~/layers/profile/app/stores/profile.store', () => ({
  useProfileStore: vi.fn(() => ({ isLoggedIn: false, me: null })),
}))

vi.mock('~~/layers/core/app/utils/cloudinary', () => ({
  imgThumb: (url: string) => url,
}))

vi.mock('~~/layers/commerce/app/stores/cart.store', () => ({
  effectiveUnitPrice: (item: any) => item.variant?.price ?? 0,
}))

// ── Helpers ───────────────────────────────────────────────────────────────────
const makeItem = (overrides = {}) => ({
  variantId: 10,
  quantity: 2,
  variant: {
    price: 5000,
    size: 'M',
    product: { title: 'Test Shirt', price: 5000, discount: 0, offers: [], media: [] },
  },
  ...overrides,
})

const global = {
  stubs: {
    Teleport: { template: '<div><slot /></div>' },
    Transition: { template: '<div><slot /></div>' },
    Icon: { template: '<span />' },
    NuxtLink: { template: '<a><slot /></a>' },
  },
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('CartSidebar', () => {
  it('renders nothing when isOpen is false', () => {
    const wrapper = mount(CartSidebar, { props: { isOpen: false }, global })
    expect(wrapper.find('.fixed').exists()).toBe(false)
  })

  it('shows empty state when open with no items', () => {
    const wrapper = mount(CartSidebar, { props: { isOpen: true }, global })
    expect(wrapper.text()).toContain('Your cart is empty')
  })

  it('emits close when backdrop is clicked', async () => {
    const wrapper = mount(CartSidebar, { props: { isOpen: true }, global })
    await wrapper.find('.absolute.inset-0').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('emits close when the header X button is clicked', async () => {
    const wrapper = mount(CartSidebar, { props: { isOpen: true }, global })
    // First button in the header is the X close button
    await wrapper.findAll('button')[0].trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('shows cart count badge when cartCount > 0', () => {
    vi.stubGlobal('useCart', () => ({
      items: ref([]),
      cartCount: ref(3),
      cartTotal: ref(0),
      isLoading: ref(false),
      hasFetchedOnce: ref(true),
      fetchCart: vi.fn(),
      updateQuantity: vi.fn(),
      removeFromCart: vi.fn(),
      addToCart: vi.fn(),
    }))
    const wrapper = mount(CartSidebar, { props: { isOpen: true }, global })
    expect(wrapper.text()).toContain('3')
  })

  it('renders cart item title and price', () => {
    vi.stubGlobal('useCart', () => ({
      items: ref([makeItem()]),
      cartCount: ref(1),
      cartTotal: ref(10000),
      isLoading: ref(false),
      hasFetchedOnce: ref(true),
      fetchCart: vi.fn(),
      updateQuantity: vi.fn(),
      removeFromCart: vi.fn(),
      addToCart: vi.fn(),
    }))
    const wrapper = mount(CartSidebar, { props: { isOpen: true }, global })
    expect(wrapper.text()).toContain('Test Shirt')
    expect(wrapper.text()).toContain('₦10000') // 5000 × 2
  })

  it('shows item size when present', () => {
    vi.stubGlobal('useCart', () => ({
      items: ref([makeItem()]),
      cartCount: ref(1),
      cartTotal: ref(0),
      isLoading: ref(false),
      hasFetchedOnce: ref(true),
      fetchCart: vi.fn(),
      updateQuantity: vi.fn(),
      removeFromCart: vi.fn(),
      addToCart: vi.fn(),
    }))
    const wrapper = mount(CartSidebar, { props: { isOpen: true }, global })
    expect(wrapper.text()).toContain('Size: M')
  })

  it('shows subtotal and checkout link when items are present', () => {
    vi.stubGlobal('useCart', () => ({
      items: ref([makeItem()]),
      cartCount: ref(1),
      cartTotal: ref(10000),
      isLoading: ref(false),
      hasFetchedOnce: ref(true),
      fetchCart: vi.fn(),
      updateQuantity: vi.fn(),
      removeFromCart: vi.fn(),
      addToCart: vi.fn(),
    }))
    const wrapper = mount(CartSidebar, { props: { isOpen: true }, global })
    expect(wrapper.text()).toContain('Subtotal')
    expect(wrapper.text()).toContain('₦10000')
    expect(wrapper.text()).toContain('Checkout')
  })

  it('calls removeFromCart when decrement is clicked at qty=1', async () => {
    const removeFromCart = vi.fn()
    vi.stubGlobal('useCart', () => ({
      items: ref([makeItem({ quantity: 1 })]),
      cartCount: ref(1),
      cartTotal: ref(5000),
      isLoading: ref(false),
      hasFetchedOnce: ref(true),
      fetchCart: vi.fn(),
      updateQuantity: vi.fn(),
      removeFromCart,
      addToCart: vi.fn(),
    }))
    const wrapper = mount(CartSidebar, { props: { isOpen: true }, global })
    const qtyControls = wrapper.find('.flex.items-center.overflow-hidden')
    await qtyControls.findAll('button')[0].trigger('click')
    expect(removeFromCart).toHaveBeenCalledWith(10)
  })

  it('calls updateQuantity when decrement is clicked at qty>1', async () => {
    const updateQuantity = vi.fn()
    vi.stubGlobal('useCart', () => ({
      items: ref([makeItem({ quantity: 3 })]),
      cartCount: ref(1),
      cartTotal: ref(15000),
      isLoading: ref(false),
      hasFetchedOnce: ref(true),
      fetchCart: vi.fn(),
      updateQuantity,
      removeFromCart: vi.fn(),
      addToCart: vi.fn(),
    }))
    const wrapper = mount(CartSidebar, { props: { isOpen: true }, global })
    const qtyControls = wrapper.find('.flex.items-center.overflow-hidden')
    await qtyControls.findAll('button')[0].trigger('click')
    expect(updateQuantity).toHaveBeenCalledWith(10, 2)
  })

  it('calls updateQuantity when increment is clicked', async () => {
    const updateQuantity = vi.fn()
    vi.stubGlobal('useCart', () => ({
      items: ref([makeItem({ quantity: 2 })]),
      cartCount: ref(1),
      cartTotal: ref(10000),
      isLoading: ref(false),
      hasFetchedOnce: ref(true),
      fetchCart: vi.fn(),
      updateQuantity,
      removeFromCart: vi.fn(),
      addToCart: vi.fn(),
    }))
    const wrapper = mount(CartSidebar, { props: { isOpen: true }, global })
    const qtyControls = wrapper.find('.flex.items-center.overflow-hidden')
    await qtyControls.findAll('button')[1].trigger('click')
    expect(updateQuantity).toHaveBeenCalledWith(10, 3)
  })

  it('shows unavailable warning when item has an unavailable validation result', async () => {
    vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({
      data: {
        items: [{ variantId: 10, status: 'unavailable' }],
        hasIssues: true,
      },
    }))
    const { useProfileStore } = await import('~~/layers/profile/app/stores/profile.store')
    vi.mocked(useProfileStore).mockReturnValue({ isLoggedIn: true, me: null } as any)

    vi.stubGlobal('useCart', () => ({
      items: ref([makeItem()]),
      cartCount: ref(1),
      cartTotal: ref(10000),
      isLoading: ref(false),
      hasFetchedOnce: ref(true),
      fetchCart: vi.fn().mockResolvedValue(undefined),
      updateQuantity: vi.fn(),
      removeFromCart: vi.fn(),
      addToCart: vi.fn(),
    }))

    // Mount closed first so the watch fires on the transition closed→open
    const wrapper = mount(CartSidebar, { props: { isOpen: false }, global })
    await wrapper.setProps({ isOpen: true })
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('no longer available')
  })

  it('renders thumbnail image when media is provided', () => {
    vi.stubGlobal('useCart', () => ({
      items: ref([
        makeItem({
          variant: {
            price: 5000,
            size: 'L',
            product: {
              title: 'Shirt',
              price: 5000,
              discount: 0,
              offers: [],
              media: [{ url: 'https://cdn.example.com/shirt.jpg' }],
            },
          },
        }),
      ]),
      cartCount: ref(1),
      cartTotal: ref(5000),
      isLoading: ref(false),
      hasFetchedOnce: ref(true),
      fetchCart: vi.fn(),
      updateQuantity: vi.fn(),
      removeFromCart: vi.fn(),
      addToCart: vi.fn(),
    }))
    const wrapper = mount(CartSidebar, { props: { isOpen: true }, global })
    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('https://cdn.example.com/shirt.jpg')
  })
})
