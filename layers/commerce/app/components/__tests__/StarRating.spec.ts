import { mount } from '@vue/test-utils'
import StarRating from '../StarRating.vue'

describe('StarRating', () => {
  it('renders 5 SVG stars', () => {
    const wrapper = mount(StarRating, { props: { rating: 3 } })
    expect(wrapper.findAll('svg').length).toBe(5)
  })

  it('sets aria-label to reflect the rating', () => {
    const wrapper = mount(StarRating, { props: { rating: 4 } })
    expect(wrapper.attributes('aria-label')).toBe('4 out of 5 stars')
  })

  it('fills all stars 100% when rating is 5', () => {
    const wrapper = mount(StarRating, { props: { rating: 5 } })
    const stops = wrapper.findAll('stop[stop-color="#F59E0B"]')
    stops.forEach((stop) => expect(stop.attributes('offset')).toBe('100%'))
  })

  it('fills no stars when rating is 0', () => {
    const wrapper = mount(StarRating, { props: { rating: 0 } })
    const stops = wrapper.findAll('stop[stop-color="#F59E0B"]')
    stops.forEach((stop) => expect(stop.attributes('offset')).toBe('0%'))
  })

  it('calculates partial fill for fractional ratings', () => {
    // rating 3.5: stars 1-3 fully filled, star 4 half, star 5 empty
    const wrapper = mount(StarRating, { props: { rating: 3.5 } })
    const stops = wrapper.findAll('stop[stop-color="#F59E0B"]')
    expect(stops[0]!.attributes('offset')).toBe('100%')
    expect(stops[1]!.attributes('offset')).toBe('100%')
    expect(stops[2]!.attributes('offset')).toBe('100%')
    expect(stops[3]!.attributes('offset')).toBe('50%')
    expect(stops[4]!.attributes('offset')).toBe('0%')
  })

  it('uses the correct pixel size for each size variant', () => {
    const cases: Array<['xs' | 'sm' | 'md' | 'lg', string]> = [
      ['xs', '12'],
      ['sm', '14'],
      ['md', '18'],
      ['lg', '22'],
    ]
    cases.forEach(([size, px]) => {
      const wrapper = mount(StarRating, { props: { rating: 3, size } })
      expect(wrapper.find('svg').attributes('width')).toBe(px)
      expect(wrapper.find('svg').attributes('height')).toBe(px)
    })
  })

  it('defaults to md (18px) when size is omitted', () => {
    const wrapper = mount(StarRating, { props: { rating: 3 } })
    expect(wrapper.find('svg').attributes('width')).toBe('18')
  })
})
