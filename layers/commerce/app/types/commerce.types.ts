import type {
  Products,
  ProductVariant,
  Orders,
  OrderItem,
  CartItem,
} from '@prisma/client'

export interface IProduct extends Products {
  seller?: {
    store_slug: string
    store_logo?: string | null
    store_name?: string | null
    default_currency?: string | null
    is_verified?: boolean | null
    locationLabel?: string | null
  }
  media?: Array<{
    id: string
    url: string
    type: 'IMAGE' | 'VIDEO' | 'AUDIO'
    isBgMusic?: boolean
  }>
  variants?: IProductVariant[]
  offers?: IProductOffer[]
  _count?: {
    likes: number
    comments: number
    shares: number
  }
  category?: Array<{
    category: { id: number; name: string; slug: string }
  }>
}

export interface IProductVariant extends ProductVariant {}

export interface IProductOffer {
  id: number
  productId: number
  minQuantity: number
  discount: number
  label?: string | null
  isActive: boolean
}

export interface ICartItem extends CartItem {
  variant?: IProductVariant & {
    product?: IProduct
  }
}

export interface GuestCartVariant {
  id: number
  size: string
  price: number | null
  stock: number
  productId: number
  product: {
    id: number
    title: string
    slug: string
    price: number
    discount: number | null
    seller: { store_slug: string; store_name: string }
    media: Array<{ url: string; type: string }>
    offers: Array<{
      id: number
      minQuantity: number
      discount: number
      label: string | null
      isActive: boolean
    }>
  } | null
}

export interface IOrder extends Orders {
  orderItem?: IOrderItem[]
}

export interface IOrderItem extends OrderItem {
  variant?: IProductVariant & {
    product?: IProduct
  }
}
