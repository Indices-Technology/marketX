import { describe, it, expect } from 'vitest'
import {
  sellerIdentifierKind,
  slugFromSellerLink,
  sellerPublicIdFrom,
  phoneTailFrom,
  handleFrom,
} from '../sellerIdentifier'

describe('sellerIdentifierKind', () => {
  it('reads a pasted MarketX profile link as a link', () => {
    expect(
      sellerIdentifierKind(
        'https://marketx.africa/sellers/profile/lagos-fabrics',
      ),
    ).toBe('link')
  })

  it('reads a public Seller ID however it is punctuated', () => {
    expect(sellerIdentifierKind('MX-LAG-J8KP')).toBe('id')
    expect(sellerIdentifierKind('mx lag j8kp')).toBe('id')
  })

  it('reads phone numbers, local and international', () => {
    expect(sellerIdentifierKind('08031234567')).toBe('phone')
    expect(sellerIdentifierKind('+234 803 123 4567')).toBe('phone')
  })

  it('reads an @handle as a person', () => {
    expect(sellerIdentifierKind('@lagos_fabrics')).toBe('handle')
  })

  // The whole reason the dock can merge search and verify into one box: an
  // ordinary query must never be mistaken for someone to look up, even though
  // it is a syntactically valid handle.
  it('leaves ordinary searches alone', () => {
    expect(sellerIdentifierKind('shoes')).toBeNull()
    expect(sellerIdentifierKind('ankara gown')).toBeNull()
    expect(sellerIdentifierKind('lagos_fabrics')).toBeNull()
    expect(sellerIdentifierKind('')).toBeNull()
    expect(sellerIdentifierKind('   ')).toBeNull()
  })

  // A short digit string is a size or a model number, not a phone number.
  it('does not read a short number as a phone', () => {
    expect(sellerIdentifierKind('42')).toBeNull()
    expect(sellerIdentifierKind('2024')).toBeNull()
  })
})

describe('identifier normalizers', () => {
  it('pulls the slug out of a link with query junk attached', () => {
    expect(
      slugFromSellerLink(
        'https://marketx.africa/sellers/profile/abc-store?ref=wa',
      ),
    ).toBe('abc-store')
    expect(slugFromSellerLink('https://example.com/shop/abc')).toBeNull()
  })

  it('collapses a Seller ID to its normalized form', () => {
    expect(sellerPublicIdFrom('MX-LAG-J8KP')).toBe('MXLAGJ8KP')
    expect(sellerPublicIdFrom('J8KP')).toBeNull()
  })

  it('reduces a phone to a tail that survives +234 / 0 variants', () => {
    // Same line, three ways people write it.
    expect(phoneTailFrom('08031234567')).toBe('031234567')
    expect(phoneTailFrom('+2348031234567')).toBe('031234567')
    expect(phoneTailFrom('234 803 123 4567')).toBe('031234567')
    expect(phoneTailFrom('12345')).toBeNull()
  })

  it('strips the sigil from a handle', () => {
    expect(handleFrom('@Lagos_Fabrics')).toBe('lagos_fabrics')
    expect(handleFrom('lagos fabrics')).toBeNull()
  })
})
