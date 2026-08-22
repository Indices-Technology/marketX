/**
 * Rate Limiting Configuration
 * All values come from environment variables
 * Can be changed without redeploying code
 */

export const RATE_LIMITS = {
  // Register endpoint: Prevent spam account creation
  REGISTER: {
    maxAttempts: parseInt(process.env.RATE_LIMIT_REGISTER_MAX || '3', 10),
    windowMs: parseInt(
      process.env.RATE_LIMIT_REGISTER_WINDOW || String(60 * 60 * 1000),
      10,
    ), // 1 hour
    message: 'Too many registration attempts',
    lockoutMs: 60 * 60 * 1000, // 1 hour lockout
    keyPrefix: 'auth:register',
  },

  // Login endpoint: Prevent brute force attacks
  LOGIN: {
    maxAttempts: parseInt(process.env.RATE_LIMIT_LOGIN_MAX || '5', 10),
    windowMs: parseInt(
      process.env.RATE_LIMIT_LOGIN_WINDOW || String(15 * 60 * 1000),
      10,
    ), // 15 minutes
    message: 'Too many login attempts',
    lockoutMs: 30 * 60 * 1000, // 30 minutes lockout
    keyPrefix: 'auth:login',
  },

  // Forgot password endpoint: Prevent email spam
  FORGOT_PASSWORD: {
    maxAttempts: parseInt(
      process.env.RATE_LIMIT_FORGOT_PASSWORD_MAX || '3',
      10,
    ),
    windowMs: parseInt(
      process.env.RATE_LIMIT_FORGOT_PASSWORD_WINDOW || String(60 * 60 * 1000),
      10,
    ), // 1 hour
    message: 'Too many password reset requests',
    lockoutMs: 60 * 60 * 1000, // 1 hour lockout
    keyPrefix: 'auth:forgot-password',
  },

  // Email verification - Send request: Prevent email spam
  VERIFY_EMAIL_SEND: {
    maxAttempts: parseInt(
      process.env.RATE_LIMIT_VERIFY_EMAIL_SEND_MAX || '5',
      10,
    ),
    windowMs: parseInt(
      process.env.RATE_LIMIT_VERIFY_EMAIL_SEND_WINDOW || String(15 * 60 * 1000),
      10,
    ), // 15 minutes
    message: 'Too many verification email requests',
    lockoutMs: 30 * 60 * 1000, // 30 minutes lockout
    keyPrefix: 'auth:verify-email-send',
  },

  // Email verification - Token verification: Prevent token brute force
  VERIFY_EMAIL_TOKEN: {
    maxAttempts: parseInt(
      process.env.RATE_LIMIT_VERIFY_EMAIL_TOKEN_MAX || '5',
      10,
    ),
    windowMs: parseInt(
      process.env.RATE_LIMIT_VERIFY_EMAIL_TOKEN_WINDOW ||
        String(15 * 60 * 1000),
      10,
    ), // 15 minutes
    message: 'Too many verification attempts',
    lockoutMs: 30 * 60 * 1000, // 30 minutes lockout
    keyPrefix: 'auth:verify-email',
  },

  // Refresh token endpoint: Prevent token abuse
  REFRESH_TOKEN: {
    maxAttempts: parseInt(process.env.RATE_LIMIT_REFRESH_TOKEN_MAX || '10', 10),
    windowMs: parseInt(
      process.env.RATE_LIMIT_REFRESH_TOKEN_WINDOW || String(5 * 60 * 1000),
      10,
    ), // 5 minutes
    message: 'Too many token refresh attempts',
    lockoutMs: 15 * 60 * 1000, // 15 minutes lockout
    keyPrefix: 'auth:refresh',
  },
  // Seller registration (account + store in one call). Its own namespace and
  // a looser cap than REGISTER — the wizard is longer, so a retry after a
  // validation bounce is normal. keyPrefix stays 'reg' to match the keys
  // already live in Redis.
  REGISTER_SELLER: {
    maxAttempts: parseInt(
      process.env.RATE_LIMIT_REGISTER_SELLER_MAX || '5',
      10,
    ),
    windowMs: parseInt(
      process.env.RATE_LIMIT_REGISTER_SELLER_WINDOW || String(15 * 60 * 1000),
      10,
    ), // 15 minutes
    message: 'Too many store creation attempts',
    lockoutMs: 15 * 60 * 1000, // 15 minutes lockout
    keyPrefix: 'reg',
  },

  // Seller verification lookup. Public and unauthenticated, and now driven by
  // the search dock's typeahead, so it needs a ceiling — each call can cost up
  // to four DB lookups. Generous enough that a buyer checking a few sellers in
  // a row never notices.
  VERIFY_SELLER: {
    maxAttempts: parseInt(process.env.RATE_LIMIT_VERIFY_SELLER_MAX || '40', 10),
    windowMs: parseInt(
      process.env.RATE_LIMIT_VERIFY_SELLER_WINDOW || String(5 * 60 * 1000),
      10,
    ), // 5 minutes
    message: 'Too many verification checks',
    lockoutMs: 5 * 60 * 1000, // 5 minutes lockout
    keyPrefix: 'reputation:verify',
  },

  // Username availability check: a typeahead endpoint, so the ceiling is high
  // enough for real typing but still caps scripted enumeration of usernames.
  CHECK_USERNAME: {
    maxAttempts: parseInt(
      process.env.RATE_LIMIT_CHECK_USERNAME_MAX || '60',
      10,
    ),
    windowMs: parseInt(
      process.env.RATE_LIMIT_CHECK_USERNAME_WINDOW || String(5 * 60 * 1000),
      10,
    ), // 5 minutes
    message: 'Too many username checks',
    lockoutMs: 5 * 60 * 1000, // 5 minutes lockout
    keyPrefix: 'auth:check-username',
  },

  // Partner / API waitlist form: public and unauthenticated, so it needs a
  // ceiling. Low cap — a genuine applicant submits once, maybe twice after a
  // validation bounce; anything past that is a bot filling the sales pipeline
  // with junk.
  PARTNER_LEAD: {
    maxAttempts: parseInt(process.env.RATE_LIMIT_PARTNER_LEAD_MAX || '5', 10),
    windowMs: parseInt(
      process.env.RATE_LIMIT_PARTNER_LEAD_WINDOW || String(60 * 60 * 1000),
      10,
    ), // 1 hour
    message: 'Too many applications',
    lockoutMs: 60 * 60 * 1000, // 1 hour lockout
    keyPrefix: 'partners:lead',
  },

  PROFILE_FETCH: {
    maxAttempts: parseInt(process.env.RATE_LIMIT_REFRESH_TOKEN_MAX || '10', 10),
    windowMs: parseInt(
      process.env.RATE_LIMIT_REFRESH_TOKEN_WINDOW || String(5 * 60 * 1000),
      10,
    ), // 5 minutes
    message: 'Too many token refresh attempts',
  },
}

export default RATE_LIMITS
