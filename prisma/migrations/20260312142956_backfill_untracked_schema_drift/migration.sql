-- Baseline backfill for pre-existing schema drift: these tables/columns/enums
-- already exist in every deployed database (added via db push over time, never
-- captured in a tracked migration). Every statement is idempotent (IF NOT EXISTS /
-- duplicate_object-safe), so this is a no-op against a DB that already has them,
-- and creates them from scratch when replaying migration history on a fresh
-- shadow database. This unblocks `prisma migrate dev` going forward.

CREATE EXTENSION IF NOT EXISTS vector;

-- ── Enums ─────────────────────────────────────────────────────────────────────

DO $$ BEGIN
CREATE TYPE public."AttributionEventType" AS ENUM (
    'VIEW',
    'SCAN',
    'CLICK',
    'LEAD',
    'ORDER'
);
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
CREATE TYPE public."ContentType" AS ENUM (
    'POST',
    'PRODUCT',
    'COMMENT',
    'REVIEW',
    'SELLER_REVIEW',
    'USER',
    'STORY'
);
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
CREATE TYPE public."GrowthAssetStatus" AS ENUM (
    'DRAFT',
    'APPROVED',
    'ARCHIVED'
);
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
CREATE TYPE public."GrowthChannel" AS ENUM (
    'ORGANIC_SHARE',
    'META_FB',
    'META_IG',
    'WHATSAPP',
    'EMAIL',
    'CARD',
    'TIKTOK'
);
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
CREATE TYPE public."GrowthIntent" AS ENUM (
    'SELL',
    'PROMOTE',
    'ANNOUNCE'
);
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
CREATE TYPE public."ModerationAction" AS ENUM (
    'WARN',
    'HIDE',
    'REMOVE',
    'SUSPEND',
    'BAN',
    'REINSTATE',
    'DISMISS'
);
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
CREATE TYPE public."ReportReason" AS ENUM (
    'SPAM',
    'INAPPROPRIATE',
    'COUNTERFEIT',
    'HARASSMENT',
    'MISINFORMATION',
    'VIOLENCE',
    'OTHER'
);
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
CREATE TYPE public."ReportStatus" AS ENUM (
    'PENDING',
    'UNDER_REVIEW',
    'RESOLVED',
    'DISMISSED'
);
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
CREATE TYPE public."SquareMembershipStatus" AS ENUM (
    'PENDING',
    'ACTIVE',
    'SUSPENDED',
    'REJECTED'
);
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
CREATE TYPE public."SquareOfferStatus" AS ENUM (
    'PENDING',
    'ACCEPTED',
    'DECLINED'
);
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
CREATE TYPE public."SquareOfficerRole" AS ENUM (
    'CHAIRMAN',
    'SECRETARY',
    'TREASURER',
    'MODERATOR',
    'GOVT_REP'
);
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
CREATE TYPE public."SquareRequestStatus" AS ENUM (
    'OPEN',
    'FULFILLED',
    'EXPIRED',
    'CLOSED'
);
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
CREATE TYPE public."SquareStatus" AS ENUM (
    'PENDING',
    'ACTIVE',
    'SUSPENDED'
);
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
CREATE TYPE public."SquareType" AS ENUM (
    'GEOGRAPHIC',
    'CATEGORY'
);
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

-- ── Profile: moderation + affiliate columns ─────────────────────────────────────

ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "bannedAt" TIMESTAMPTZ(6);
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "strikeCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "suspendedUntil" TIMESTAMPTZ(6);
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "affiliateCode" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Profile_affiliateCode_key" ON "Profile"("affiliateCode");

-- ── Tables, sequences, keys, indexes, foreign keys ──────────────────────────────

CREATE TABLE IF NOT EXISTS public."AiTurnLog" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "userId" uuid NOT NULL,
    "sessionId" text NOT NULL,
    channel text NOT NULL,
    intent text,
    "userMessage" text NOT NULL,
    "assistantResponse" text NOT NULL,
    "toolsCalled" text[],
    "ragHits" integer DEFAULT 0 NOT NULL,
    "tokensPrompt" integer DEFAULT 0 NOT NULL,
    "tokensCompletion" integer DEFAULT 0 NOT NULL,
    "latencyMs" integer DEFAULT 0 NOT NULL,
    "modelUsed" text,
    "guardBlocked" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS public."AssetDistribution" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "assetId" uuid NOT NULL,
    channel public."GrowthChannel" NOT NULL,
    "shortCode" text NOT NULL,
    "remotePostId" text,
    "scheduledAt" timestamp(6) with time zone,
    "sharedAt" timestamp(6) with time zone,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS public."AttributionEvent" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "distributionId" uuid NOT NULL,
    type public."AttributionEventType" NOT NULL,
    identity jsonb,
    meta jsonb,
    occurred_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS public."BuyerTransaction" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "walletId" uuid NOT NULL,
    amount double precision NOT NULL,
    type text NOT NULL,
    "orderId" integer,
    description text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS public."BuyerWallet" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "profileId" uuid NOT NULL,
    balance double precision DEFAULT 0 NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS public."Embedding" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "entityType" text NOT NULL,
    "entityId" text NOT NULL,
    metadata jsonb NOT NULL,
    "contentHash" text NOT NULL,
    "indexedAt" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(6) with time zone NOT NULL,
    embedding public.vector(1536)
);

CREATE TABLE IF NOT EXISTS public."GrowthAsset" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "sellerId" uuid NOT NULL,
    "productId" integer,
    intent public."GrowthIntent" DEFAULT 'SELL'::public."GrowthIntent" NOT NULL,
    status public."GrowthAssetStatus" DEFAULT 'DRAFT'::public."GrowthAssetStatus" NOT NULL,
    content jsonb NOT NULL,
    commerce jsonb NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS public."GuardRailEvent" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "userId" uuid NOT NULL,
    type text NOT NULL,
    "inputFragment" text,
    "createdAt" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS public."ProductAnalytics" (
    id integer NOT NULL,
    "productId" integer NOT NULL,
    "storeSlug" text NOT NULL,
    date date NOT NULL,
    views integer DEFAULT 0 NOT NULL,
    impressions integer DEFAULT 0 NOT NULL,
    orders integer DEFAULT 0 NOT NULL,
    "unitsSold" integer DEFAULT 0 NOT NULL,
    revenue double precision DEFAULT 0 NOT NULL,
    "affiliatePaid" double precision DEFAULT 0 NOT NULL
);

CREATE SEQUENCE IF NOT EXISTS public."ProductAnalytics_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public."ProductAnalytics_id_seq" OWNED BY public."ProductAnalytics".id;

CREATE TABLE IF NOT EXISTS public."Report" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "reporterId" uuid NOT NULL,
    "contentType" public."ContentType" NOT NULL,
    "contentId" text NOT NULL,
    reason public."ReportReason" NOT NULL,
    note text,
    status public."ReportStatus" DEFAULT 'PENDING'::public."ReportStatus" NOT NULL,
    "moderatorId" uuid,
    "moderatorNote" text,
    action public."ModerationAction",
    "createdAt" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "resolvedAt" timestamp(6) with time zone
);

CREATE TABLE IF NOT EXISTS public."Square" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    type public."SquareType" DEFAULT 'CATEGORY'::public."SquareType" NOT NULL,
    status public."SquareStatus" DEFAULT 'PENDING'::public."SquareStatus" NOT NULL,
    "bannerUrl" text,
    "iconUrl" text,
    "accentColor" text,
    latitude double precision,
    longitude double precision,
    city text,
    state text,
    country text DEFAULT 'NG'::text NOT NULL,
    "physicalAddress" text,
    "associationCutPercent" double precision DEFAULT 0.5 NOT NULL,
    "memberCount" integer DEFAULT 0 NOT NULL,
    "followerCount" integer DEFAULT 0 NOT NULL,
    "postCount" integer DEFAULT 0 NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS public."SquareAnnouncement" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "squareId" uuid NOT NULL,
    "authorId" uuid NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    "isPinned" boolean DEFAULT false NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS public."SquareMembership" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "squareId" uuid NOT NULL,
    "sellerId" uuid NOT NULL,
    "isPrimary" boolean DEFAULT false NOT NULL,
    status public."SquareMembershipStatus" DEFAULT 'PENDING'::public."SquareMembershipStatus" NOT NULL,
    "verifiedById" uuid,
    "joinedAt" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "suspendedAt" timestamp(6) with time zone,
    "suspendReason" text
);

CREATE TABLE IF NOT EXISTS public."SquareOffer" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "requestId" uuid NOT NULL,
    "sellerId" uuid NOT NULL,
    "productId" integer NOT NULL,
    "variantId" integer,
    message text,
    status public."SquareOfferStatus" DEFAULT 'PENDING'::public."SquareOfferStatus" NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS public."SquareOfficer" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "squareId" uuid NOT NULL,
    "profileId" uuid NOT NULL,
    role public."SquareOfficerRole" NOT NULL,
    "appointedAt" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "appointedBy" uuid
);

CREATE TABLE IF NOT EXISTS public."SquarePayout" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "walletId" uuid NOT NULL,
    amount double precision NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "bankAccount" jsonb NOT NULL,
    "transactionRef" text,
    "requestedAt" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completedAt" timestamp(6) with time zone,
    "requestedById" uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS public."SquareRequest" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "squareId" uuid NOT NULL,
    "buyerId" uuid NOT NULL,
    "categoryId" integer,
    title text NOT NULL,
    "budgetMin" integer,
    "budgetMax" integer,
    condition text,
    "sizeSpec" text,
    "deliverTo" text,
    note text,
    "referencePhotoUrl" text,
    visibility text DEFAULT 'square'::text NOT NULL,
    "respondersOnlyVerified" boolean DEFAULT false NOT NULL,
    "isAnonymous" boolean DEFAULT false NOT NULL,
    status public."SquareRequestStatus" DEFAULT 'OPEN'::public."SquareRequestStatus" NOT NULL,
    "expiresAt" timestamp(6) with time zone NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS public."SquareTransaction" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "squareId" uuid NOT NULL,
    "walletId" uuid NOT NULL,
    "orderId" integer NOT NULL,
    "sellerAmount" double precision NOT NULL,
    "cutPercent" double precision NOT NULL,
    "cutAmount" double precision NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS public."SquareWallet" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "squareId" uuid NOT NULL,
    balance double precision DEFAULT 0 NOT NULL,
    "totalEarned" double precision DEFAULT 0 NOT NULL,
    "totalWithdrawn" double precision DEFAULT 0 NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS public."UserAIProfile" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "userId" uuid NOT NULL,
    measurements jsonb,
    preferences jsonb,
    signals jsonb,
    "rawContext" text,
    "createdAt" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(6) with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS public."UserSquareFollow" (
    "userId" uuid NOT NULL,
    "squareId" uuid NOT NULL,
    "followedAt" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS public."UserSuspension" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "userId" uuid NOT NULL,
    "moderatorId" uuid NOT NULL,
    reason text NOT NULL,
    "expiresAt" timestamp(6) with time zone,
    "liftedAt" timestamp(6) with time zone,
    "liftedById" uuid,
    "createdAt" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_ai_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "profileId" uuid NOT NULL,
    provider text NOT NULL,
    model text NOT NULL,
    "apiKey" text NOT NULL,
    "createdAt" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(6) with time zone NOT NULL
);

ALTER TABLE ONLY public."ProductAnalytics" ALTER COLUMN id SET DEFAULT nextval('public."ProductAnalytics_id_seq"'::regclass);

DO $$ BEGIN
ALTER TABLE ONLY public."AiTurnLog"
    ADD CONSTRAINT "AiTurnLog_pkey" PRIMARY KEY (id);
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
ALTER TABLE ONLY public."AssetDistribution"
    ADD CONSTRAINT "AssetDistribution_pkey" PRIMARY KEY (id);
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
ALTER TABLE ONLY public."AttributionEvent"
    ADD CONSTRAINT "AttributionEvent_pkey" PRIMARY KEY (id);
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
ALTER TABLE ONLY public."BuyerTransaction"
    ADD CONSTRAINT "BuyerTransaction_pkey" PRIMARY KEY (id);
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
ALTER TABLE ONLY public."BuyerWallet"
    ADD CONSTRAINT "BuyerWallet_pkey" PRIMARY KEY (id);
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
ALTER TABLE ONLY public."Embedding"
    ADD CONSTRAINT "Embedding_pkey" PRIMARY KEY (id);
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
ALTER TABLE ONLY public."GrowthAsset"
    ADD CONSTRAINT "GrowthAsset_pkey" PRIMARY KEY (id);
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
ALTER TABLE ONLY public."GuardRailEvent"
    ADD CONSTRAINT "GuardRailEvent_pkey" PRIMARY KEY (id);
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
ALTER TABLE ONLY public."ProductAnalytics"
    ADD CONSTRAINT "ProductAnalytics_pkey" PRIMARY KEY (id);
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
ALTER TABLE ONLY public."Report"
    ADD CONSTRAINT "Report_pkey" PRIMARY KEY (id);
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
ALTER TABLE ONLY public."SquareAnnouncement"
    ADD CONSTRAINT "SquareAnnouncement_pkey" PRIMARY KEY (id);
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
ALTER TABLE ONLY public."SquareMembership"
    ADD CONSTRAINT "SquareMembership_pkey" PRIMARY KEY (id);
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
ALTER TABLE ONLY public."SquareOffer"
    ADD CONSTRAINT "SquareOffer_pkey" PRIMARY KEY (id);
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
ALTER TABLE ONLY public."SquareOfficer"
    ADD CONSTRAINT "SquareOfficer_pkey" PRIMARY KEY (id);
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
ALTER TABLE ONLY public."SquarePayout"
    ADD CONSTRAINT "SquarePayout_pkey" PRIMARY KEY (id);
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
ALTER TABLE ONLY public."SquareRequest"
    ADD CONSTRAINT "SquareRequest_pkey" PRIMARY KEY (id);
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
ALTER TABLE ONLY public."SquareTransaction"
    ADD CONSTRAINT "SquareTransaction_pkey" PRIMARY KEY (id);
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
ALTER TABLE ONLY public."SquareWallet"
    ADD CONSTRAINT "SquareWallet_pkey" PRIMARY KEY (id);
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
ALTER TABLE ONLY public."Square"
    ADD CONSTRAINT "Square_pkey" PRIMARY KEY (id);
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
ALTER TABLE ONLY public."UserAIProfile"
    ADD CONSTRAINT "UserAIProfile_pkey" PRIMARY KEY (id);
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
ALTER TABLE ONLY public."UserSquareFollow"
    ADD CONSTRAINT "UserSquareFollow_pkey" PRIMARY KEY ("userId", "squareId");
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
ALTER TABLE ONLY public."UserSuspension"
    ADD CONSTRAINT "UserSuspension_pkey" PRIMARY KEY (id);
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
ALTER TABLE ONLY public.user_ai_config
    ADD CONSTRAINT user_ai_config_pkey PRIMARY KEY (id);
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

CREATE INDEX IF NOT EXISTS "AiTurnLog_channel_createdAt_idx" ON public."AiTurnLog" USING btree (channel, "createdAt");

CREATE INDEX IF NOT EXISTS "AiTurnLog_createdAt_idx" ON public."AiTurnLog" USING btree ("createdAt");

CREATE INDEX IF NOT EXISTS "AiTurnLog_intent_createdAt_idx" ON public."AiTurnLog" USING btree (intent, "createdAt");

CREATE INDEX IF NOT EXISTS "AiTurnLog_userId_idx" ON public."AiTurnLog" USING btree ("userId");

CREATE INDEX IF NOT EXISTS "AssetDistribution_assetId_idx" ON public."AssetDistribution" USING btree ("assetId");

CREATE INDEX IF NOT EXISTS "AssetDistribution_channel_idx" ON public."AssetDistribution" USING btree (channel);

CREATE UNIQUE INDEX IF NOT EXISTS "AssetDistribution_shortCode_key" ON public."AssetDistribution" USING btree ("shortCode");

CREATE INDEX IF NOT EXISTS "AttributionEvent_distributionId_type_idx" ON public."AttributionEvent" USING btree ("distributionId", type);

CREATE UNIQUE INDEX IF NOT EXISTS "BuyerWallet_profileId_key" ON public."BuyerWallet" USING btree ("profileId");

CREATE UNIQUE INDEX IF NOT EXISTS "Embedding_entityType_entityId_key" ON public."Embedding" USING btree ("entityType", "entityId");

CREATE INDEX IF NOT EXISTS "Embedding_entityType_idx" ON public."Embedding" USING btree ("entityType");

CREATE INDEX IF NOT EXISTS "Embedding_updatedAt_idx" ON public."Embedding" USING btree ("updatedAt");

CREATE INDEX IF NOT EXISTS "GrowthAsset_sellerId_status_idx" ON public."GrowthAsset" USING btree ("sellerId", status);

CREATE INDEX IF NOT EXISTS "GuardRailEvent_type_createdAt_idx" ON public."GuardRailEvent" USING btree (type, "createdAt");

CREATE INDEX IF NOT EXISTS "GuardRailEvent_userId_idx" ON public."GuardRailEvent" USING btree ("userId");

CREATE UNIQUE INDEX IF NOT EXISTS "ProductAnalytics_productId_date_key" ON public."ProductAnalytics" USING btree ("productId", date);

CREATE INDEX IF NOT EXISTS "ProductAnalytics_storeSlug_date_idx" ON public."ProductAnalytics" USING btree ("storeSlug", date);

CREATE INDEX IF NOT EXISTS "Report_contentType_contentId_idx" ON public."Report" USING btree ("contentType", "contentId");

CREATE INDEX IF NOT EXISTS "Report_reporterId_idx" ON public."Report" USING btree ("reporterId");

CREATE INDEX IF NOT EXISTS "Report_status_createdAt_idx" ON public."Report" USING btree (status, "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "SquareAnnouncement_squareId_created_at_idx" ON public."SquareAnnouncement" USING btree ("squareId", created_at DESC);

CREATE INDEX IF NOT EXISTS "SquareAnnouncement_squareId_isPinned_idx" ON public."SquareAnnouncement" USING btree ("squareId", "isPinned");

CREATE INDEX IF NOT EXISTS "SquareMembership_sellerId_idx" ON public."SquareMembership" USING btree ("sellerId");

CREATE UNIQUE INDEX IF NOT EXISTS "SquareMembership_squareId_sellerId_key" ON public."SquareMembership" USING btree ("squareId", "sellerId");

CREATE INDEX IF NOT EXISTS "SquareMembership_squareId_status_idx" ON public."SquareMembership" USING btree ("squareId", status);

CREATE INDEX IF NOT EXISTS "SquareOffer_requestId_idx" ON public."SquareOffer" USING btree ("requestId");

CREATE UNIQUE INDEX IF NOT EXISTS "SquareOffer_requestId_sellerId_productId_key" ON public."SquareOffer" USING btree ("requestId", "sellerId", "productId");

CREATE INDEX IF NOT EXISTS "SquareOfficer_profileId_idx" ON public."SquareOfficer" USING btree ("profileId");

CREATE INDEX IF NOT EXISTS "SquareOfficer_squareId_idx" ON public."SquareOfficer" USING btree ("squareId");

CREATE UNIQUE INDEX IF NOT EXISTS "SquareOfficer_squareId_profileId_key" ON public."SquareOfficer" USING btree ("squareId", "profileId");

CREATE INDEX IF NOT EXISTS "SquarePayout_walletId_idx" ON public."SquarePayout" USING btree ("walletId");

CREATE INDEX IF NOT EXISTS "SquareRequest_buyerId_idx" ON public."SquareRequest" USING btree ("buyerId");

CREATE INDEX IF NOT EXISTS "SquareRequest_expiresAt_idx" ON public."SquareRequest" USING btree ("expiresAt");

CREATE INDEX IF NOT EXISTS "SquareRequest_squareId_status_idx" ON public."SquareRequest" USING btree ("squareId", status);

CREATE INDEX IF NOT EXISTS "SquareTransaction_orderId_idx" ON public."SquareTransaction" USING btree ("orderId");

CREATE INDEX IF NOT EXISTS "SquareTransaction_squareId_idx" ON public."SquareTransaction" USING btree ("squareId");

CREATE UNIQUE INDEX IF NOT EXISTS "SquareWallet_squareId_key" ON public."SquareWallet" USING btree ("squareId");

CREATE INDEX IF NOT EXISTS "Square_city_state_idx" ON public."Square" USING btree (city, state);

CREATE UNIQUE INDEX IF NOT EXISTS "Square_name_key" ON public."Square" USING btree (name);

CREATE UNIQUE INDEX IF NOT EXISTS "Square_slug_key" ON public."Square" USING btree (slug);

CREATE INDEX IF NOT EXISTS "Square_type_status_idx" ON public."Square" USING btree (type, status);

CREATE INDEX IF NOT EXISTS "UserAIProfile_userId_idx" ON public."UserAIProfile" USING btree ("userId");

CREATE UNIQUE INDEX IF NOT EXISTS "UserAIProfile_userId_key" ON public."UserAIProfile" USING btree ("userId");

CREATE INDEX IF NOT EXISTS "UserSquareFollow_squareId_idx" ON public."UserSquareFollow" USING btree ("squareId");

CREATE INDEX IF NOT EXISTS "UserSquareFollow_userId_idx" ON public."UserSquareFollow" USING btree ("userId");

CREATE INDEX IF NOT EXISTS "UserSuspension_expiresAt_idx" ON public."UserSuspension" USING btree ("expiresAt");

CREATE INDEX IF NOT EXISTS "UserSuspension_userId_idx" ON public."UserSuspension" USING btree ("userId");

CREATE UNIQUE INDEX IF NOT EXISTS "user_ai_config_profileId_key" ON public.user_ai_config USING btree ("profileId");

DO $$ BEGIN
ALTER TABLE ONLY public."AssetDistribution"
    ADD CONSTRAINT "AssetDistribution_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES public."GrowthAsset"(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
ALTER TABLE ONLY public."AttributionEvent"
    ADD CONSTRAINT "AttributionEvent_distributionId_fkey" FOREIGN KEY ("distributionId") REFERENCES public."AssetDistribution"(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
ALTER TABLE ONLY public."BuyerTransaction"
    ADD CONSTRAINT "BuyerTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES public."BuyerWallet"(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
ALTER TABLE ONLY public."BuyerWallet"
    ADD CONSTRAINT "BuyerWallet_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES public."Profile"(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
ALTER TABLE ONLY public."ProductAnalytics"
    ADD CONSTRAINT "ProductAnalytics_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Products"(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
ALTER TABLE ONLY public."Report"
    ADD CONSTRAINT "Report_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES public."Profile"(id) ON UPDATE CASCADE ON DELETE SET NULL;
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
ALTER TABLE ONLY public."Report"
    ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES public."Profile"(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
ALTER TABLE ONLY public."SquareAnnouncement"
    ADD CONSTRAINT "SquareAnnouncement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public."Profile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
ALTER TABLE ONLY public."SquareAnnouncement"
    ADD CONSTRAINT "SquareAnnouncement_squareId_fkey" FOREIGN KEY ("squareId") REFERENCES public."Square"(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
ALTER TABLE ONLY public."SquareMembership"
    ADD CONSTRAINT "SquareMembership_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES public."SellerProfile"(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
ALTER TABLE ONLY public."SquareMembership"
    ADD CONSTRAINT "SquareMembership_squareId_fkey" FOREIGN KEY ("squareId") REFERENCES public."Square"(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
ALTER TABLE ONLY public."SquareMembership"
    ADD CONSTRAINT "SquareMembership_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES public."Profile"(id) ON UPDATE CASCADE ON DELETE SET NULL;
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
ALTER TABLE ONLY public."SquareOffer"
    ADD CONSTRAINT "SquareOffer_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Products"(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
ALTER TABLE ONLY public."SquareOffer"
    ADD CONSTRAINT "SquareOffer_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES public."SquareRequest"(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
ALTER TABLE ONLY public."SquareOffer"
    ADD CONSTRAINT "SquareOffer_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES public."SellerProfile"(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
ALTER TABLE ONLY public."SquareOfficer"
    ADD CONSTRAINT "SquareOfficer_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES public."Profile"(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
ALTER TABLE ONLY public."SquareOfficer"
    ADD CONSTRAINT "SquareOfficer_squareId_fkey" FOREIGN KEY ("squareId") REFERENCES public."Square"(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
ALTER TABLE ONLY public."SquarePayout"
    ADD CONSTRAINT "SquarePayout_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES public."Profile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
ALTER TABLE ONLY public."SquarePayout"
    ADD CONSTRAINT "SquarePayout_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES public."SquareWallet"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
ALTER TABLE ONLY public."SquareRequest"
    ADD CONSTRAINT "SquareRequest_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES public."Profile"(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
ALTER TABLE ONLY public."SquareRequest"
    ADD CONSTRAINT "SquareRequest_squareId_fkey" FOREIGN KEY ("squareId") REFERENCES public."Square"(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
ALTER TABLE ONLY public."SquareTransaction"
    ADD CONSTRAINT "SquareTransaction_squareId_fkey" FOREIGN KEY ("squareId") REFERENCES public."Square"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
ALTER TABLE ONLY public."SquareTransaction"
    ADD CONSTRAINT "SquareTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES public."SquareWallet"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
ALTER TABLE ONLY public."SquareWallet"
    ADD CONSTRAINT "SquareWallet_squareId_fkey" FOREIGN KEY ("squareId") REFERENCES public."Square"(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
ALTER TABLE ONLY public."UserAIProfile"
    ADD CONSTRAINT "UserAIProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Profile"(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
ALTER TABLE ONLY public."UserSquareFollow"
    ADD CONSTRAINT "UserSquareFollow_squareId_fkey" FOREIGN KEY ("squareId") REFERENCES public."Square"(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
ALTER TABLE ONLY public."UserSquareFollow"
    ADD CONSTRAINT "UserSquareFollow_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Profile"(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
ALTER TABLE ONLY public."UserSuspension"
    ADD CONSTRAINT "UserSuspension_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES public."Profile"(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
ALTER TABLE ONLY public."UserSuspension"
    ADD CONSTRAINT "UserSuspension_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Profile"(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;

DO $$ BEGIN
ALTER TABLE ONLY public.user_ai_config
    ADD CONSTRAINT "user_ai_config_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES public."Profile"(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN SQLSTATE '42P16' THEN NULL; -- multiple primary keys (PK already exists, not caught by duplicate_object)
END $$;
