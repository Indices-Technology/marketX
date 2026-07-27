import { describe, it, expect } from 'vitest'
import {
  slugifyBase,
  assignUniqueSlugs,
  detectSkuCollisions,
} from '../bulkImport'

describe('slugifyBase', () => {
  it('lowercases, hyphenates non-alphanumerics, trims edges', () => {
    expect(slugifyBase('Ankara Dress 👗 (Size 8-16)')).toBe('ankara-dress-size-8-16')
    expect(slugifyBase('  Red!!!  ')).toBe('red')
  })
})

describe('assignUniqueSlugs', () => {
  it('dedupes duplicate titles WITHIN the batch', () => {
    expect(assignUniqueSlugs(['Red Dress', 'Red Dress', 'Red Dress'], new Set())).toEqual([
      'red-dress',
      'red-dress-1',
      'red-dress-2',
    ])
  })

  it('avoids slugs already taken in the DB', () => {
    expect(
      assignUniqueSlugs(['Blue Top'], new Set(['blue-top', 'blue-top-1'])),
    ).toEqual(['blue-top-2'])
  })

  it('combines DB-taken and in-batch collisions', () => {
    expect(
      assignUniqueSlugs(['Hat', 'Hat'], new Set(['hat'])),
    ).toEqual(['hat-1', 'hat-2'])
  })

  it('falls back to "product" when a title has no slug-able characters', () => {
    expect(assignUniqueSlugs(['👗', '👗'], new Set())).toEqual([
      'product',
      'product-1',
    ])
  })
})

describe('detectSkuCollisions', () => {
  it('flags SKUs already in the DB', () => {
    const c = detectSkuCollisions(['A', 'B', 'C'], new Set(['B']))
    expect([...c]).toEqual([1])
  })

  it('flags the SECOND occurrence of an in-batch duplicate, not the first', () => {
    const c = detectSkuCollisions(['X', 'Y', 'X'], new Set())
    expect([...c]).toEqual([2])
  })

  it('ignores empty / null SKUs', () => {
    const c = detectSkuCollisions([undefined, '', null, 'A'], new Set())
    expect(c.size).toBe(0)
  })
})
