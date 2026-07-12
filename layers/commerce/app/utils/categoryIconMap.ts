export interface CategoryVisual {
  icon: string
  color: string   // single brand color for small usage (pill dot, etc.)
  gradient: string
}

// Keywords matched against category name/slug (lowercase, partial match)
const RULES: Array<{ terms: string[] } & CategoryVisual> = [
  {
    terms: ['electronic', 'phone', 'gadget', 'tech', 'computer', 'mobile', 'device', 'laptop'],
    icon: 'solar:smartphone-linear',
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
  },
  {
    terms: ['fashion', 'cloth', 'wear', 'apparel', 'dress', 'style', 'outfit'],
    icon: 'solar:hanger-2-linear',
    color: '#ec4899',
    gradient: 'linear-gradient(135deg, #ec4899, #be185d)',
  },
  {
    terms: ['men', 'masculine', 'suit'],
    icon: 'solar:t-shirt-linear',
    color: '#6366f1',
    gradient: 'linear-gradient(135deg, #6366f1, #4338ca)',
  },
  {
    terms: ['shoe', 'footwear', 'sneaker', 'sandal', 'boot', 'heel'],
    icon: 'mdi:shoe-sneaker',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b, #b45309)',
  },
  {
    terms: ['bag', 'luggage', 'purse', 'handbag', 'backpack', 'wallet'],
    icon: 'solar:bag-linear',
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
  },
  {
    terms: ['accessori', 'jewel', 'watch', 'ring', 'necklace', 'bracelet'],
    icon: 'mdi:diamond-stone',
    color: '#f43f5e',
    gradient: 'linear-gradient(135deg, #f43f5e, #be123c)',
  },
  {
    terms: ['beauty', 'cosmetic', 'makeup', 'skin', 'hair', 'fragrance', 'personal care'],
    icon: 'solar:user-rounded-linear',
    color: '#a855f7',
    gradient: 'linear-gradient(135deg, #a855f7, #7c3aed)',
  },
  {
    terms: ['care', 'health', 'wellness', 'hygiene', 'grooming'],
    icon: 'solar:heart-pulse-linear',
    color: '#ec4899',
    gradient: 'linear-gradient(135deg, #ec4899, #9d174d)',
  },
  {
    terms: ['food', 'drink', 'grocery', 'snack', 'beverage', 'restaurant', 'eat'],
    icon: 'solar:chef-hat-linear',
    color: '#22c55e',
    gradient: 'linear-gradient(135deg, #22c55e, #15803d)',
  },
  {
    terms: ['sport', 'fitness', 'gym', 'exercise', 'outdoor', 'athletic'],
    icon: 'solar:dumbbells-2-linear',
    color: '#06b6d4',
    gradient: 'linear-gradient(135deg, #06b6d4, #0e7490)',
  },
  {
    terms: ['home', 'furniture', 'interior', 'kitchen', 'living', 'decor', 'house'],
    icon: 'solar:home-linear',
    color: '#f97316',
    gradient: 'linear-gradient(135deg, #f97316, #c2410c)',
  },
  {
    terms: ['kid', 'baby', 'child', 'infant', 'toy'],
    icon: 'solar:smile-circle-linear',
    color: '#34d399',
    gradient: 'linear-gradient(135deg, #34d399, #059669)',
  },
  {
    terms: ['book', 'education', 'stationery', 'school', 'study', 'learning'],
    icon: 'solar:book-2-bold',
    color: '#64748b',
    gradient: 'linear-gradient(135deg, #64748b, #334155)',
  },
  {
    terms: ['game', 'gaming', 'console', 'play'],
    icon: 'solar:gamepad-linear',
    color: '#7c3aed',
    gradient: 'linear-gradient(135deg, #7c3aed, #4c1d95)',
  },
  {
    terms: ['ankara', 'african', 'traditional', 'native', 'ethnic', 'cultural'],
    icon: 'solar:palette-linear',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b, #92400e)',
  },
  {
    terms: ['service', 'repair', 'install', 'consult', 'professional', 'hire'],
    icon: 'solar:settings-minimalistic-linear',
    color: '#6366f1',
    gradient: 'linear-gradient(135deg, #6366f1, #4338ca)',
  },
  {
    terms: ['preloved', 'thrift', 'second', 'used', 'vintage', 'pre-own'],
    icon: 'solar:recive-square-linear',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b, #b45309)',
  },
]

const FALLBACK: CategoryVisual = {
  icon: 'solar:tag-linear',
  color: '#6b7280',
  gradient: 'linear-gradient(135deg, #6b7280, #374151)',
}

export function getCategoryVisual(name: string, slug?: string): CategoryVisual {
  const haystack = `${name} ${slug ?? ''}`.toLowerCase()
  for (const rule of RULES) {
    if (rule.terms.some((t) => haystack.includes(t))) {
      return { icon: rule.icon, color: rule.color, gradient: rule.gradient }
    }
  }
  return FALLBACK
}
