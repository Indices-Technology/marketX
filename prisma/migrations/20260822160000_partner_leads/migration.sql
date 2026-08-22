-- Partnership and API-waitlist leads submitted from the public /partners page.
--
-- WHY NOT A SUPPORT TICKET
--
-- SupportTicket already accepts guests, so reusing it was tempting. But a
-- ticket is a conversation that gets RESOLVED and CLOSED, while a lead is a row
-- in a pipeline that has to stay queryable long after the first reply — "who
-- applied for API access in Q3" is not a question you can ask a closed ticket
-- queue. Reusing tickets would also have dropped the company / volume / use-case
-- fields these submissions are entirely about, and buried sales leads in the
-- support agents' inbox.
--
-- WHY THE (email, type) UNIQUE
--
-- Someone who submits twice is one lead with better information, not two leads.
-- The unique lets the write path upsert instead of stacking duplicates. It is
-- scoped to `type` so a partner can also join the API waitlist without one
-- overwriting the other. The service deliberately excludes `status` and `notes`
-- from the update, so a re-submit can never reset a lead we have already
-- contacted or rejected back to NEW.

CREATE TYPE "PartnerLeadType" AS ENUM ('PARTNERSHIP', 'API');

CREATE TYPE "PartnerLeadStatus" AS ENUM (
  'NEW',
  'CONTACTED',
  'APPROVED',
  'REJECTED'
);

CREATE TABLE "PartnerLead" (
  "id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "type"           "PartnerLeadType" NOT NULL DEFAULT 'PARTNERSHIP',
  "contactName"    TEXT NOT NULL,
  "email"          TEXT NOT NULL,
  "phone"          TEXT,
  "company"        TEXT NOT NULL,
  "website"        TEXT,
  -- Job title. Decides who on our side should reply.
  "role"           TEXT,
  "useCase"        TEXT NOT NULL,
  -- Self-reported band ("<1k/mo", "10k+"). Text, not an integer: the answer is
  -- never precise, and a number would imply an accuracy it does not have.
  "expectedVolume" TEXT,
  "status"         "PartnerLeadStatus" NOT NULL DEFAULT 'NEW',
  -- Internal pipeline notes. Never returned by the public endpoint.
  "notes"          TEXT,
  "utmSource"      TEXT,
  "utmMedium"      TEXT,
  "utmCampaign"    TEXT,
  "contactedAt"    TIMESTAMPTZ,
  "created_at"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX "PartnerLead_email_type_key"
  ON "PartnerLead"("email", "type");

CREATE INDEX "PartnerLead_status_created_at_idx"
  ON "PartnerLead"("status", "created_at" DESC);

CREATE INDEX "PartnerLead_type_status_idx"
  ON "PartnerLead"("type", "status");
