// GET /api/commerce/products/variants/:id  (public — no auth required)
// Returns the minimal variant + product fields the cart UI needs.
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Invalid variant id' })

  const variant = await prisma.productVariant.findUnique({
    where: { id },
    select: {
      id: true,
      size: true,
      price: true,
      stock: true,
      productId: true,
      product: {
        select: {
          id: true,
          title: true,
          slug: true,
          price: true,
          discount: true,
          seller: { select: { store_slug: true, store_name: true } },
          media: {
            where: { isBgMusic: false },
            orderBy: { created_at: 'asc' },
            take: 1,
            select: { url: true, type: true },
          },
          offers: {
            where: { isActive: true },
            select: {
              id: true, minQuantity: true, discount: true,
              label: true, isActive: true,
            },
          },
        },
      },
    },
  })

  if (!variant) throw createError({ statusCode: 404, statusMessage: 'Variant not found' })

  // Normalize Prisma floats — keep null as null so effectiveUnitPrice falls
  // through to product.price when a variant has no per-variant price set.
  return {
    success: true,
    data: {
      ...variant,
      price: variant.price != null ? Number(variant.price) : null,
      product: variant.product
        ? {
            ...variant.product,
            price: Number(variant.product.price),
          }
        : null,
    },
  }
})
