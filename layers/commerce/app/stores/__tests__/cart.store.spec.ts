import { setActivePinia, createPinia } from 'pinia'
import { useCartStore } from '../cart.store'
import type { ICartItem } from '../../types/commerce.types'

const item = (variantId: number, id: string, quantity = 1): ICartItem =>
  ({ id, variantId, quantity } as ICartItem)

describe('cart.store — setItems', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('deduplicates same variantId by summing quantities', () => {
    const store = useCartStore()
    store.setItems([item(5, 'guest_5_111', 1), item(5, 'guest_5_222', 2)])
    expect(store.items).toHaveLength(1)
    expect(store.items[0].quantity).toBe(3)
  })

  it('keeps distinct variantIds as separate entries', () => {
    const store = useCartStore()
    store.setItems([item(5, 'guest_5_111'), item(6, 'guest_6_222')])
    expect(store.items).toHaveLength(2)
  })

  it('preserves first-occurrence id and variant data', () => {
    const store = useCartStore()
    const variant = { price: 500 } as ICartItem['variant']
    store.setItems([
      { ...item(5, 'guest_5_first'), variant },
      item(5, 'guest_5_second'),
    ])
    expect(store.items[0].id).toBe('guest_5_first')
    expect(store.items[0].variant).toStrictEqual(variant)
  })

  it('handles empty array', () => {
    const store = useCartStore()
    store.setItems([])
    expect(store.items).toHaveLength(0)
  })

  it('handles single item with no duplicates', () => {
    const store = useCartStore()
    store.setItems([item(5, 'guest_5_111', 3)])
    expect(store.items).toHaveLength(1)
    expect(store.items[0].quantity).toBe(3)
  })
})

describe('cart.store — addItem', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('increments quantity when same variantId added twice', () => {
    const store = useCartStore()
    store.addItem(item(5, 'guest_5_111'))
    store.addItem(item(5, 'guest_5_222'))
    expect(store.items).toHaveLength(1)
    expect(store.items[0].quantity).toBe(2)
  })

  it('same-millisecond id collision still deduplicates by variantId', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1716000000000)
    const store = useCartStore()
    store.addItem(item(5, `guest_5_${Date.now()}`))
    store.addItem(item(5, `guest_5_${Date.now()}`))
    expect(store.items).toHaveLength(1)
    expect(store.items[0].quantity).toBe(2)
    vi.restoreAllMocks()
  })

  it('different variantIds are separate entries', () => {
    const store = useCartStore()
    store.addItem(item(5, 'guest_5_111'))
    store.addItem(item(6, 'guest_6_222'))
    expect(store.items).toHaveLength(2)
  })
})
