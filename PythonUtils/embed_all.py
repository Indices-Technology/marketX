"""
MarketX bulk embedder — one-time (or re-run) script to populate the Embedding table
for existing PRODUCT, SELLER, and SQUARE entities.

Usage:
    python embed_all.py                     # embed all three types
    python embed_all.py --type PRODUCT      # single type
    python embed_all.py --type SELLER
    python embed_all.py --type SQUARE
    python embed_all.py --since 2026-01-01  # only entities updated after this date

Requirements:
    pip install psycopg2-binary openai python-dotenv beautifulsoup4
"""

import argparse
import hashlib
import json
import os
import sys
import time
import traceback
from datetime import datetime

import psycopg2
import psycopg2.extras
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]
OPENAI_API_KEY = os.environ["OPENAI_API_KEY"]
BATCH_SLEEP = 0.3   # seconds between OpenAI calls — stay inside rate limits

openai = OpenAI(api_key=OPENAI_API_KEY)

# ─── Helpers ──────────────────────────────────────────────────────────────────

def strip_html(text: str) -> str:
    if not text:
        return ""
    return BeautifulSoup(text, "html.parser").get_text().strip()


def sha256(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()


def generate_embedding(text: str) -> list[float]:
    res = openai.embeddings.create(model="text-embedding-3-small", input=text)
    vec = res.data[0].embedding
    if len(vec) != 1536:
        raise ValueError(f"Unexpected vector length: {len(vec)}")
    return vec


# ─── Text builders ─────────────────────────────────────────────────────────────

def build_product_text(p: dict) -> str:
    parts = [f"Product: {p.get('title', '')}"]
    desc = strip_html(p.get("description", ""))[:400]
    if desc:
        parts.append(desc)
    if p.get("seller_name"):
        parts.append(f"Sold by: {p['seller_name']}")
    if p.get("location_label"):
        parts.append(f"Seller location: {p['location_label']}")
    if p.get("city"):
        parts.append(f"City: {p['city']}")
    if p.get("state"):
        parts.append(f"State: {p['state']}")
    if p.get("price") is not None:
        parts.append(f"Price: ₦{p['price']}")
    if p.get("discount"):
        parts.append(f"Discount: {p['discount']}%")
    if p.get("is_deal"):
        parts.append("This is a flash deal.")
    if p.get("is_thrift"):
        parts.append("Pre-loved / thrift item.")
    if p.get("condition"):
        parts.append(f"Condition: {p['condition']}")
    categories = ", ".join(p.get("categories") or [])
    if categories:
        parts.append(f"Categories: {categories}")
    tags = ", ".join(p.get("tags") or [])
    if tags:
        parts.append(f"Tags: {tags}")
    sizes = ", ".join(p.get("sizes") or [])
    if sizes:
        parts.append(f"Available sizes: {sizes}")
    if p.get("in_stock") is not None:
        parts.append("In stock." if p["in_stock"] else "Currently out of stock.")
    if p.get("square_name"):
        parts.append(f"Listed in: {p['square_name']}")
    if p.get("average_rating"):
        parts.append(f"Rating: {p['average_rating']}/5 ({p.get('total_reviews', 0)} reviews)")
    return "\n".join(parts)


def build_seller_text(s: dict) -> str:
    parts = [f"Seller: {s.get('store_name', '')}"]
    if s.get("store_description"):
        parts.append(strip_html(s["store_description"])[:400])
    if s.get("location_label"):
        parts.append(f"Location: {s['location_label']}")
    if s.get("city"):
        parts.append(f"City: {s['city']}")
    if s.get("state"):
        parts.append(f"State: {s['state']}")
    if s.get("pod_enabled"):
        zones = ", ".join(s.get("pod_zones") or [])
        parts.append(f"Pay-on-delivery available{f' in: {zones}' if zones else ''}.")
    if s.get("ship_from_city"):
        parts.append(f"Ships from: {s['ship_from_city']}, {s.get('ship_from_state', '')}")
    if s.get("is_verified"):
        parts.append("Verified seller.")
    if s.get("is_premium"):
        parts.append("Premium seller.")
    if s.get("average_rating"):
        parts.append(f"Rating: {s['average_rating']}/5 ({s.get('total_reviews', 0)} reviews)")
    if s.get("followers_count"):
        parts.append(f"Followers: {s['followers_count']}")
    top_cats = ", ".join(s.get("top_categories") or [])
    if top_cats:
        parts.append(f"Top categories: {top_cats}")
    if s.get("primary_square"):
        parts.append(f"Primary market: {s['primary_square']}")
    return "\n".join(parts)


def build_square_text(sq: dict) -> str:
    parts = [f"Market/Square: {sq.get('name', '')}"]
    if sq.get("description"):
        parts.append(strip_html(sq["description"])[:400])
    sq_type = sq.get("type", "")
    parts.append(f"Type: {'Physical market' if sq_type == 'GEOGRAPHIC' else 'Online category market'}")
    if sq.get("city"):
        parts.append(f"City: {sq['city']}")
    if sq.get("state"):
        parts.append(f"State: {sq['state']}")
    if sq.get("physical_address"):
        parts.append(f"Address: {sq['physical_address']}")
    if sq.get("latitude") and sq.get("longitude"):
        parts.append(f"GPS: {sq['latitude']}, {sq['longitude']}")
    if sq.get("member_count"):
        parts.append(f"{sq['member_count']} sellers.")
    if sq.get("follower_count"):
        parts.append(f"{sq['follower_count']} followers.")
    top_cats = ", ".join(sq.get("top_categories") or [])
    if top_cats:
        parts.append(f"Top categories: {top_cats}")
    return "\n".join(parts)


# ─── DB queries ────────────────────────────────────────────────────────────────

PRODUCTS_SQL = """
SELECT
    p.id::text                                                          AS entity_id,
    p.title,
    p.description,
    p.price,
    p.discount,
    p."isThrift"                                                        AS is_thrift,
    p.condition,
    p."isDeal"                                                          AS is_deal,
    p."averageRating"                                                   AS average_rating,
    p."totalReviews"                                                    AS total_reviews,
    p."updated_at"                                                      AS updated_at,
    s.store_name                                                        AS seller_name,
    s."locationLabel"                                                   AS location_label,
    s.city,
    s.state,
    sq.name                                                             AS square_name,
    COALESCE(
        json_agg(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL), '[]'
    )::text                                                             AS categories_json,
    COALESCE(
        json_agg(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL), '[]'
    )::text                                                             AS tags_json,
    COALESCE(
        json_agg(DISTINCT pv.size) FILTER (WHERE pv.size IS NOT NULL AND pv.stock > 0), '[]'
    )::text                                                             AS sizes_json,
    EXISTS(SELECT 1 FROM "ProductVariant" pv2
           WHERE pv2."productId" = p.id AND pv2.stock > 0)             AS in_stock
FROM "Products" p
LEFT JOIN "SellerProfile"    s  ON s.id            = p."sellerId"
LEFT JOIN "Square"           sq ON sq.id           = p."squareId"
LEFT JOIN "ProductCategories" pc ON pc."productId" = p.id
LEFT JOIN "Category"          c  ON c.id           = pc."categoryId"
LEFT JOIN "ProductTags"       pt ON pt."productId" = p.id
LEFT JOIN "Tag"               t  ON t.id           = pt."tagId"
LEFT JOIN "ProductVariant"    pv ON pv."productId" = p.id
WHERE p.status = 'PUBLISHED'
{since_clause}
GROUP BY p.id, s.store_name, s."locationLabel", s.city, s.state, sq.name
ORDER BY p.id;
"""

SELLERS_SQL = """
SELECT
    s.id::text                                              AS entity_id,
    s.store_name,
    s.store_description,
    s."locationLabel"                                       AS location_label,
    s.city,
    s.state,
    s."shipFromCity"                                        AS ship_from_city,
    s."shipFromState"                                       AS ship_from_state,
    s."is_verified",
    s."isPremium"                                           AS is_premium,
    s."pod_enabled",
    s."pod_zones"                                           AS pod_zones_raw,
    s."averageRating"                                       AS average_rating,
    s."totalReviews"                                        AS total_reviews,
    s.followers_count,
    s."updated_at"                                          AS updated_at,
    sq.name                                                 AS primary_square,
    COALESCE(
        json_agg(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL), '[]'
    )::text                                                 AS top_categories_json
FROM "SellerProfile" s
LEFT JOIN "Square"   sq ON sq.id = s."primarySquareId"
LEFT JOIN "Products" p  ON p."sellerId" = s.id AND p.status = 'PUBLISHED'
LEFT JOIN "ProductCategories" pc ON pc."productId" = p.id
LEFT JOIN "Category"          c  ON c.id           = pc."categoryId"
WHERE s."is_active" = true
{since_clause}
GROUP BY s.id, sq.name
ORDER BY s.id;
"""

SQUARES_SQL = """
SELECT
    sq.id::text                                             AS entity_id,
    sq.name,
    sq.description,
    sq.type,
    sq.city,
    sq.state,
    sq."physicalAddress"                                    AS physical_address,
    sq.latitude,
    sq.longitude,
    sq."memberCount"                                        AS member_count,
    sq."followerCount"                                      AS follower_count,
    sq."updated_at"                                         AS updated_at,
    COALESCE(
        json_agg(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL), '[]'
    )::text                                                 AS top_categories_json
FROM "Square" sq
LEFT JOIN "SquareMembership"  sm ON sm."squareId"  = sq.id AND sm.status = 'ACTIVE'
LEFT JOIN "Products"          p  ON p."sellerId"   = sm."sellerId" AND p.status = 'PUBLISHED'
LEFT JOIN "ProductCategories" pc ON pc."productId" = p.id
LEFT JOIN "Category"          c  ON c.id           = pc."categoryId"
WHERE sq.status = 'ACTIVE'
{since_clause}
GROUP BY sq.id
ORDER BY sq.id;
"""

UPSERT_SQL = """
INSERT INTO "Embedding" (id, "entityType", "entityId", metadata, "contentHash", "indexedAt", "updatedAt")
VALUES (gen_random_uuid(), %s, %s, %s, %s, NOW(), NOW())
ON CONFLICT ("entityType", "entityId") DO UPDATE
    SET metadata      = EXCLUDED.metadata,
        "contentHash" = EXCLUDED."contentHash",
        "updatedAt"   = NOW()
RETURNING id;
"""

SET_VECTOR_SQL = """
UPDATE "Embedding"
SET    embedding = %s::vector
WHERE  "entityType" = %s
AND    "entityId"   = %s;
"""


# ─── Index a single batch of entities ─────────────────────────────────────────

def process_rows(cursor, conn, entity_type: str, rows: list[dict], build_text_fn, build_meta_fn):
    success = failed = skipped = 0
    total = len(rows)

    for i, row in enumerate(rows, 1):
        entity_id = row["entity_id"]
        try:
            text  = build_text_fn(row)
            chash = sha256(text)

            # Skip if hash unchanged (incremental mode check)
            cursor.execute(
                'SELECT "contentHash" FROM "Embedding" WHERE "entityType" = %s AND "entityId" = %s',
                (entity_type, entity_id),
            )
            existing = cursor.fetchone()
            if existing and existing[0] == chash:
                skipped += 1
                continue

            print(f"  [{i}/{total}] {entity_type} {entity_id} ...", end=" ", flush=True)

            vec     = generate_embedding(text)
            vec_str = "[" + ",".join(str(x) for x in vec) + "]"
            meta    = json.dumps(build_meta_fn(row, entity_type, entity_id))

            cursor.execute(UPSERT_SQL, (entity_type, entity_id, meta, chash))
            cursor.execute(SET_VECTOR_SQL, (vec_str, entity_type, entity_id))
            conn.commit()

            print("✅")
            success += 1
            time.sleep(BATCH_SLEEP)

        except Exception as e:
            print(f"❌ {e}")
            traceback.print_exc()
            conn.rollback()
            failed += 1
            time.sleep(1)

    return success, failed, skipped


# ─── Metadata builders (snapshot stored alongside vector) ─────────────────────

def product_meta(row: dict, entity_type: str, entity_id: str) -> dict:
    return {
        "entityType":  entity_type,
        "entityId":    entity_id,
        "title":       row.get("title"),
        "price":       row.get("price"),
        "discount":    row.get("discount"),
        "inStock":     row.get("in_stock"),
        "sellerName":  row.get("seller_name"),
        "locationLabel": row.get("location_label"),
        "city":        row.get("city"),
        "state":       row.get("state"),
    }


def seller_meta(row: dict, entity_type: str, entity_id: str) -> dict:
    return {
        "entityType":    entity_type,
        "entityId":      entity_id,
        "storeName":     row.get("store_name"),
        "locationLabel": row.get("location_label"),
        "city":          row.get("city"),
        "state":         row.get("state"),
        "isVerified":    row.get("is_verified"),
        "isPremium":     row.get("is_premium"),
    }


def square_meta(row: dict, entity_type: str, entity_id: str) -> dict:
    return {
        "entityType":  entity_type,
        "entityId":    entity_id,
        "name":        row.get("name"),
        "type":        row.get("type"),
        "city":        row.get("city"),
        "state":       row.get("state"),
    }


# ─── Row → dict helpers ────────────────────────────────────────────────────────

def to_product_dict(row) -> dict:
    d = dict(row)
    d["categories"] = json.loads(d.pop("categories_json", "[]"))
    d["tags"]       = json.loads(d.pop("tags_json", "[]"))
    d["sizes"]      = json.loads(d.pop("sizes_json", "[]"))
    return d


def to_seller_dict(row) -> dict:
    d = dict(row)
    d["top_categories"] = json.loads(d.pop("top_categories_json", "[]"))
    raw = d.pop("pod_zones_raw", None)
    if isinstance(raw, str):
        try:
            d["pod_zones"] = json.loads(raw)
        except Exception:
            d["pod_zones"] = []
    elif isinstance(raw, list):
        d["pod_zones"] = raw
    else:
        d["pod_zones"] = []
    return d


def to_square_dict(row) -> dict:
    d = dict(row)
    d["top_categories"] = json.loads(d.pop("top_categories_json", "[]"))
    return d


# ─── DB setup ─────────────────────────────────────────────────────────────────

def setup_db(cursor, conn):
    """Ensure pgvector extension and embedding column exist."""

    # 1. Enable pgvector extension
    cursor.execute("CREATE EXTENSION IF NOT EXISTS vector;")
    conn.commit()
    print("  ✅ pgvector extension ready")

    # 2. Add embedding column if missing
    cursor.execute("""
        SELECT column_name
        FROM   information_schema.columns
        WHERE  table_name  = 'Embedding'
        AND    column_name = 'embedding';
    """)
    if not cursor.fetchone():
        print("  ⚙️  Adding embedding vector(1536) column...")
        cursor.execute('ALTER TABLE "Embedding" ADD COLUMN embedding vector(1536);')
        conn.commit()
        print("  ✅ Column added")
    else:
        print("  ✅ embedding column already exists")

    # 3. Create HNSW index if missing (better than IVFFlat for concurrent reads)
    cursor.execute("""
        SELECT indexname
        FROM   pg_indexes
        WHERE  tablename = 'Embedding'
        AND    indexdef  LIKE '%hnsw%';
    """)
    if not cursor.fetchone():
        print("  ⚙️  Creating HNSW index (this may take a moment)...")
        cursor.execute(
            'CREATE INDEX IF NOT EXISTS "Embedding_embedding_hnsw_idx" '
            'ON "Embedding" USING hnsw (embedding vector_cosine_ops);'
        )
        conn.commit()
        print("  ✅ HNSW index created")
    else:
        print("  ✅ HNSW index already exists")


# ─── Main ──────────────────────────────────────────────────────────────────────

def run(types: list[str], since: str | None):
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    print("\n── DB setup ──────────────────────────────────────────────────")
    setup_db(cursor, conn)

    since_clause = ""
    if since:
        ts = since.replace("T", " ")
        since_clause = f"AND updated_at > '{ts}'"

    totals = {"success": 0, "failed": 0, "skipped": 0}

    for entity_type in types:
        print(f"\n{'─'*60}")
        print(f"  Indexing {entity_type}s{f' (since {since})' if since else ''}...")
        print(f"{'─'*60}")

        if entity_type == "PRODUCT":
            sql = PRODUCTS_SQL.format(since_clause=since_clause)
            cursor.execute(sql)
            rows = [to_product_dict(r) for r in cursor.fetchall()]
            print(f"  Found {len(rows)} published products")
            s, f, sk = process_rows(cursor, conn, "PRODUCT", rows, build_product_text, product_meta)

        elif entity_type == "SELLER":
            sql = SELLERS_SQL.format(since_clause=since_clause)
            cursor.execute(sql)
            rows = [to_seller_dict(r) for r in cursor.fetchall()]
            print(f"  Found {len(rows)} active sellers")
            s, f, sk = process_rows(cursor, conn, "SELLER", rows, build_seller_text, seller_meta)

        elif entity_type == "SQUARE":
            sql = SQUARES_SQL.format(since_clause=since_clause)
            cursor.execute(sql)
            rows = [to_square_dict(r) for r in cursor.fetchall()]
            print(f"  Found {len(rows)} active squares")
            s, f, sk = process_rows(cursor, conn, "SQUARE", rows, build_square_text, square_meta)

        else:
            print(f"  Unknown type: {entity_type}")
            continue

        totals["success"] += s
        totals["failed"]  += f
        totals["skipped"] += sk

    cursor.close()
    conn.close()

    print(f"\n{'='*60}")
    print("  COMPLETE")
    print(f"{'='*60}")
    print(f"  ✅ Indexed : {totals['success']}")
    print(f"  ⏭  Skipped : {totals['skipped']}  (hash unchanged)")
    print(f"  ❌ Failed  : {totals['failed']}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="MarketX bulk entity embedder")
    parser.add_argument(
        "--type",
        choices=["PRODUCT", "SELLER", "SQUARE", "ALL"],
        default="ALL",
        help="Entity type to index (default: ALL)",
    )
    parser.add_argument(
        "--since",
        default=None,
        help="Only index entities updated after this ISO timestamp (e.g. 2026-01-01)",
    )
    args = parser.parse_args()

    types = ["PRODUCT", "SELLER", "SQUARE"] if args.type == "ALL" else [args.type]

    try:
        run(types, args.since)
    except KeyboardInterrupt:
        print("\nInterrupted.")
        sys.exit(0)
