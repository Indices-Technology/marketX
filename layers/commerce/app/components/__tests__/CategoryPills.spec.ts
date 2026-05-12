import { mount } from '@vue/test-utils'
import CategoryPills from '../CategoryPills.vue'

const categories = [
  { id: 1, name: 'Clothing', slug: 'clothing' },
  { id: 2, name: 'Electronics', slug: 'electronics', thumbnailCatUrl: 'https://example.com/thumb.jpg' },
  { id: 3, name: 'Shoes', slug: 'shoes' },
]

describe('CategoryPills', () => {
  it('renders an "All" button', () => {
    const wrapper = mount(CategoryPills, { props: { categories, modelValue: null } })
    expect(wrapper.findAll('button')[0]!.text()).toBe('All')
  })

  it('renders a button for each category', () => {
    const wrapper = mount(CategoryPills, { props: { categories, modelValue: null } })
    // buttons[0] is "All", then one per category
    expect(wrapper.findAll('button').length).toBe(categories.length + 1)
  })

  it('renders category names', () => {
    const wrapper = mount(CategoryPills, { props: { categories, modelValue: null } })
    categories.forEach((cat) => expect(wrapper.text()).toContain(cat.name))
  })

  it('renders a thumbnail image when thumbnailCatUrl is provided', () => {
    const wrapper = mount(CategoryPills, { props: { categories, modelValue: null } })
    const img = wrapper.find('img[alt="Electronics"]')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('https://example.com/thumb.jpg')
  })

  it('does not render an img when thumbnailCatUrl is absent', () => {
    const wrapper = mount(CategoryPills, { props: { categories, modelValue: null } })
    expect(wrapper.find('img[alt="Clothing"]').exists()).toBe(false)
  })

  it('emits update:modelValue with null when "All" is clicked', async () => {
    const wrapper = mount(CategoryPills, { props: { categories, modelValue: 'clothing' } })
    await wrapper.findAll('button')[0]!.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[null]])
  })

  it('emits update:modelValue with the category slug when a category button is clicked', async () => {
    const wrapper = mount(CategoryPills, { props: { categories, modelValue: null } })
    await wrapper.findAll('button')[1]!.trigger('click') // Clothing
    expect(wrapper.emitted('update:modelValue')).toEqual([['clothing']])
  })

  it('applies active styles to "All" when modelValue is null', () => {
    const wrapper = mount(CategoryPills, { props: { categories, modelValue: null } })
    expect(wrapper.findAll('button')[0]!.classes()).toContain('bg-brand')
  })

  it('does not apply active styles to "All" when another category is selected', () => {
    const wrapper = mount(CategoryPills, { props: { categories, modelValue: 'shoes' } })
    expect(wrapper.findAll('button')[0]!.classes()).not.toContain('bg-brand')
  })

  it('applies active styles to the currently selected category', () => {
    const wrapper = mount(CategoryPills, { props: { categories, modelValue: 'electronics' } })
    // buttons: [All, Clothing, Electronics, Shoes]
    expect(wrapper.findAll('button')[2]!.classes()).toContain('bg-brand')
  })

  it('does not apply active styles to unselected categories', () => {
    const wrapper = mount(CategoryPills, { props: { categories, modelValue: 'electronics' } })
    expect(wrapper.findAll('button')[1]!.classes()).not.toContain('bg-brand') // Clothing
    expect(wrapper.findAll('button')[3]!.classes()).not.toContain('bg-brand') // Shoes
  })
})
