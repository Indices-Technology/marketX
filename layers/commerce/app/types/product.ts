import type { User } from '~~/layers/core/app/types/user'

export interface ProductComment {
  id: string
  text: string
  user: Partial<User>
  createdAt: string
  replies: ProductComment[]
}

export interface ProductDetailVariant {
  id: number
  size: string
  price: number
  stock: number
}

export interface ProductDetailMedia {
  id: string
  url: string
  type: string
  isBgMusic: boolean
}

export interface ProductDetail {
  id: number
  slug: string
  title: string
  description: string | null
  price: number
  discount: number | null
  status: string
  seller: {
    store_slug: string
    store_name: string
    store_logo: string | null
    default_currency?: string | null
  }
  media: ProductDetailMedia[]
  variants: ProductDetailVariant[]
}
