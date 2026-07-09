-- Accessibility: user preference to minimize pulsing/animated effects.
-- Gated client-side alongside the OS-level prefers-reduced-motion media query.
ALTER TABLE "UserSettings" ADD COLUMN "reduce_motion" BOOLEAN NOT NULL DEFAULT false;
