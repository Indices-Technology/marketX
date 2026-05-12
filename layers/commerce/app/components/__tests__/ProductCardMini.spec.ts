import { mount } from '@vue/test-utils'
import { vi } from 'vitest'
import ProductCardMini from '../ProductCardMini.vue'

// ── Module mocks (explicit imports in the component) ──────────────────────────
vi.mock('@kyvg/vue3-notification', () => ({ notify: vi.fn() }))

vi.mock('~~/layers/profile/app/stores/profile.store', () => ({
  useProfileStore: () => ({ isLoggedIn: false }),
}))

vi.mock('~~/layers/core/app/utils/cloudinary', () => ({
  imgThumb: (url: string) => url,
  videoThumb: (url: string) => url,
}))

// ── Shared fixture ────────────────────────────────────────────────────────────
const makeProduct = (overrides = {}) => ({
  id: 1,
  title: 'Adire Tie-Dye Maxi Dress',
  slug: 'adire-tie-dye',
  price: 15000,
  discount: 0,
  isThrift: false,
  media: [],
  variants: [{ id: 10, stock: 5 }],
  _count: { likes: 3, comments: 0 },
  seller: { store_name: 'Balogun Fabrics', store_slug: 'balogun-fabrics' },
  ...overrides,
})

const global = { stubs: { Icon: { template: '<span />' } } }

describe('ProductCardMini', () => {
  it('renders the product title', () => {
    const wrapper = mount(ProductCardMini, { props: { product: makeProduct() }, global })
    expect(wrapper.text()).toContain('Adire Tie-Dye Maxi Dress')
  })

  it('renders the formatted price', () => {
    const wrapper = mount(ProductCardMini, { props: { product: makeProduct() }, global })
    expect(wrapper.text()).toContain('₦15000')
  })

  it('renders the store name', () => {
    const wrapper = mount(ProductCardMini, { props: { product: makeProduct() }, global })
    expect(wrapper.text()).toContain('Balogun Fabrics')
  })

  it('shows the discounted price and original price when discount > 0', () => {
    const product = makeProduct({ price: 20000, discount: 25 })
    const wrapper = mount(ProductCardMini, { props: { product }, global })
    expect(wrapper.text()).toContain('₦15000') // 20000 × 0.75
    expect(wrapper.text()).toContain('₦20000') // original
  })

  it('shows "Thrift" badge when isThrift is true', () => {
    const wrapper = mount(ProductCardMini, { props: { product: makeProduct({ isThrift: true }) }, global })
    expect(wrapper.text()).toContain('Thrift')
  })

  it('shows discount badge when discount > 0', () => {
    const wrapper = mount(ProductCardMini, { props: { product: makeProduct({ discount: 20 }) }, global })
    expect(wrapper.text()).toContain('−20%')
  })

  it('does not show badges when product is neither thrift nor discounted', () => {
    const wrapper = mount(ProductCardMini, { props: { product: makeProduct() }, global })
    expect(wrapper.text()).not.toContain('Thrift')
    expect(wrapper.text()).not.toContain('%')
  })

  it('shows "Sold out" when lowest stock is 0', () => {
    const product = makeProduct({ variants: [{ id: 10, stock: 0 }] })
    const wrapper = mount(ProductCardMini, { props: { product }, global })
    expect(wrapper.text()).toContain('Sold out')
  })

  it('shows low-stock warning when lowest stock is <= 5', () => {
    const product = makeProduct({ variants: [{ id: 10, stock: 3 }] })
    const wrapper = mount(ProductCardMini, { props: { product }, global })
    expect(wrapper.text()).toContain('Only 3 left')
  })

  it('shows no stock warning when stock is above threshold', () => {
    const product = makeProduct({ variants: [{ id: 10, stock: 20 }] })
    const wrapper = mount(ProductCardMini, { props: { product }, global })
    expect(wrapper.text()).not.toContain('Sold out')
    expect(wrapper.text()).not.toContain('left')
  })

  it('emits open-detail with the product when the card is clicked', async () => {
    const product = makeProduct()
    const wrapper = mount(ProductCardMini, { props: { product }, global })
    await wrapper.find('.group').trigger('click')
    expect(wrapper.emitted('open-detail')).toBeTruthy()
    expect(wrapper.emitted('open-detail')![0]![0]).toMatchObject({ id: 1 })
  })

  it('disables the cart button when out of stock', () => {
    const product = makeProduct({ variants: [{ id: 10, stock: 0 }] })
    const wrapper = mount(ProductCardMini, { props: { product }, global })
    const cartBtn = wrapper.find('button[title="Out of stock"]')
    expect(cartBtn.attributes('disabled')).toBeDefined()
  })

  it('renders an image when media contains an IMAGE entry', () => {
    const product = makeProduct({
      media: [{ id: 1, type: 'IMAGE', url: 'https://cdn.example.com/img.jpg', isBgMusic: false }],
    })
    const wrapper = mount(ProductCardMini, { props: { product }, global })
    expect(wrapper.find('img').exists()).toBe(true)
    expect(wrapper.find('img').attributes('src')).toBe('https://cdn.example.com/img.jpg')
  })
})
