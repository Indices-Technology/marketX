-- Adds the missing foreign-key indexes on Media and OrderItem.
--
-- Both tables were fully unindexed on their lookup columns (Media had only
-- public_id @unique; OrderItem had none at all), so every access was a
-- sequential scan. That is cheap today at a few hundred rows, but both tables
-- grow with content/orders, and OrderItem sits under the reputation query
-- (orders → orderItem → variant → product.sellerId) that powers Trust Cards.
--
-- Safe to run online: these tables are small, so CREATE INDEX completes
-- effectively instantly. If they ever grow large, build the equivalent indexes
-- with CREATE INDEX CONCURRENTLY outside a transaction instead.

-- CreateIndex
CREATE INDEX "Media_productId_idx" ON "Media"("productId");

-- CreateIndex
CREATE INDEX "Media_postId_idx" ON "Media"("postId");

-- CreateIndex
CREATE INDEX "Media_authorId_created_at_idx" ON "Media"("authorId", "created_at" DESC);

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_variantId_idx" ON "OrderItem"("variantId");
