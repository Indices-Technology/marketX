// layers/auth/app/services/auth.api.ts

/**
 * Auth API Service
 * Handles all auth API calls
 * Extends BaseApiClient for token injection, error handling, etc.
 */

import { BaseApiClient, type ApiServiceOptions } from './base.api'
import type {
  IAuthUser as User,
  IAuthUser,
  IAuthResponse as LoginResponse,
  IAuthSession,
} from '~~/shared/types/auth'

export class AuthApiClient extends BaseApiClient {
  // ==================== REGISTER ====================

  /**
   * Handles user registration requests with security best practices.
   *
   * Validates registration credentials, manages rate limiting and account locking,
   * sets secure HTTP-only cookies for tokens, and returns user data.
   *
   * @param data - Registration data containing email, username, password, and confirmPassword
   * @returns Promise resolving to login response with tokens and user data
   * @throws {Error} 400 - Invalid input validation error
   * @throws {Error} 401 - Authentication failed (invalid credentials, locked account, etc.)
   * @throws {Error} 429 - Rate limit exceeded
   * @throws {Error} 500 - Unexpected server error
   */
  async register(data: {
    email: string
    username: string
    password: string
    confirmPassword: string
  }): Promise<User> {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: data,
    })
  }

  // ==================== USERNAME AVAILABILITY ====================

  /**
   * Checks whether a username can still be claimed. Public — called from the
   * signup form on every debounced keystroke, which is why it is `silent`
   * (a transient failure shouldn't pop a global toast; the field handles it).
   *
   * @param username - Candidate username
   * @returns `{ available, message, suggestions }`
   */
  async checkUsername(username: string): Promise<{
    success: boolean
    username: string
    available: boolean
    message: string
    suggestions: string[]
  }> {
    return this.request('/api/auth/check-username', {
      method: 'GET',
      params: { username },
      skipAuth: true,
      silent: true,
    })
  }

  // ==================== REGISTER SELLER (account + store, auto-login) ==========

  /**
   * Registers a new user account AND creates their store in one atomic flow,
   * then auto-logs-in (tokens in body + httpOnly cookies). Unauthenticated —
   * called from the seller onboarding wizard for brand-new visitors.
   *
   * @param data - Account fields + store fields
   * @returns Promise resolving to tokens, user, and the created store
   */
  async registerSeller(data: {
    email: string
    username: string
    password: string
    confirmPassword: string
    store_name: string
    store_slug: string
    store_description?: string
    store_location?: string
    store_logo?: string
    store_currency?: string
    // Shipping origin (optional) — enables live carrier rates at checkout
    shipFromName?: string
    shipFromAddress?: string
    shipFromCity?: string
    shipFromState?: string
    shipFromZip?: string
    shipFromCountry?: string
    shipFromPhone?: string
  }): Promise<{
    success: boolean
    accessToken: string
    refreshToken: string
    user: IAuthUser
    store: { store_slug: string; store_name: string }
  }> {
    return this.request('/api/auth/register-seller', {
      method: 'POST',
      body: data,
    })
  }

  // ==================== LOGIN ====================

  /**
   * Handles user login requests with security best practices.
   *
   * Validates login credentials, manages rate limiting and account locking,
   * sets secure HTTP-only cookies for tokens, and returns user data.
   *
   * @param data - Login data containing email and password
   * @returns Promise resolving to login response with tokens and user data
   * @throws {Error} 400 - Invalid input validation error
   * @throws {Error} 401 - Authentication failed (invalid credentials, locked account, etc.)
   * @throws {Error} 429 - Rate limit exceeded
   * @throws {Error} 500 - Unexpected server error
   */
  async login(
    data: {
      email: string
      password: string
    },
    options: ApiServiceOptions = {},
  ): Promise<LoginResponse> {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: data,
      ...options,
    })
  }

  /**
   * Exchange an approved authorization request for an OAuth code/redirect.
   * Caller passes the bearer token + handles errors inline (oauth consent UI),
   * so pass skipAuth/silent to opt out of the default 401 redirect behaviour.
   */
  async createOAuthCode(
    data: { client_id: string; redirect_uri: string; state?: string },
    options: ApiServiceOptions = {},
  ): Promise<{ redirectUrl: string }> {
    return this.request('/api/oauth/code', {
      method: 'POST',
      body: data,
      ...options,
    })
  }

  // ==================== LOGOUT ====================

  async logout(): Promise<{ success: boolean; message: string }> {
    return this.request('/api/auth/logout', {
      method: 'POST',
    })
  }

  // ==================== SESSION MANAGEMENT ====================

  /**
   * List every device the user is currently signed in on. The caller's own
   * session comes back with `isCurrent: true`.
   */
  async getSessions(): Promise<{ success: boolean; sessions: IAuthSession[] }> {
    return this.request('/api/auth/sessions')
  }

  /**
   * Sign out one device. `wasCurrent` is true when the revoked session was this
   * one — the caller should then clear local tokens and redirect to login.
   */
  async revokeSession(
    sessionId: string,
  ): Promise<{ success: boolean; message: string; wasCurrent: boolean }> {
    return this.request(`/api/auth/sessions/${sessionId}`, {
      method: 'DELETE',
    })
  }

  /**
   * Sign out other devices, keeping this one. Pass `includeCurrent` to sign out
   * everywhere — `signedOutCurrent` then comes back true.
   */
  async revokeOtherSessions(includeCurrent = false): Promise<{
    success: boolean
    message: string
    count: number
    signedOutCurrent: boolean
  }> {
    return this.request('/api/auth/sessions/revoke-all', {
      method: 'POST',
      body: { includeCurrent },
    })
  }

  // ==================== EMAIL VERIFICATION ====================

  async verifyEmail(
    token: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.request('/api/auth/verify-email', {
      method: 'POST',
      body: { token },
    })
  }

  async resendVerificationEmail(
    email: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.request('/api/auth/send-verification-email', {
      method: 'POST',
      body: { email },
    })
  }

  // ==================== PASSWORD RESET ====================

  async requestPasswordReset(
    email: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.request('/api/auth/forgot-password', {
      method: 'POST',
      body: { email },
    })
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.request('/api/auth/reset-password', {
      method: 'POST',
      body: { token, password: newPassword, confirmPassword: newPassword },
    })
  }

  // ==================== REFRESH TOKEN ====================

  async refreshAccessToken(): Promise<{ accessToken: string }> {
    return this.request('/api/auth/refresh-token', {
      method: 'POST',
    })
  }

  async sendCheckoutOtp(data: {
    email: string
    name?: string
    phone?: string
  }): Promise<{ isNewUser: boolean }> {
    return this.request('/api/auth/checkout-otp/send', {
      method: 'POST',
      body: data,
      skipAuth: true,
      silent: true,
    })
  }

  async verifyCheckoutOtp(data: {
    email: string
    code: string
    name?: string
    phone?: string
  }): Promise<{
    success: boolean
    isNewUser: boolean
    accessToken: string
    refreshToken: string
    user: {
      id: string
      email: string
      username: string
      emailVerified: boolean
      role: string
    }
  }> {
    return this.request('/api/auth/checkout-otp/verify', {
      method: 'POST',
      body: data,
      skipAuth: true,
      silent: true,
    })
  }

  // ==================== PHONE / WHATSAPP OTP ====================

  async sendPhoneOtp(
    phone: string,
  ): Promise<{ success: boolean; isNewUser: boolean }> {
    return this.request('/api/auth/phone/send-otp', {
      method: 'POST',
      body: { phone },
      skipAuth: true,
      silent: true,
    })
  }

  async verifyPhoneOtp(
    phone: string,
    code: string,
  ): Promise<{
    success: boolean
    isNewUser: boolean
    accessToken: string
    refreshToken: string
    user: IAuthUser & { phone: string; phoneVerified: boolean }
  }> {
    return this.request('/api/auth/phone/verify-otp', {
      method: 'POST',
      body: { phone, code },
      skipAuth: true,
      silent: true,
    })
  }

  /**
   * Verify a phone OTP and attach it as the LOGGED-IN user's verified phone
   * (used for login + WhatsApp notifications). Unlike verifyPhoneOtp above,
   * this requires an existing session — call sendPhoneOtp first to get the code.
   */
  async verifyPhoneAttach(
    phone: string,
    code: string,
  ): Promise<{ success: boolean; phone: string; phoneVerified: boolean }> {
    return this.request('/api/auth/phone/verify-attach', {
      method: 'POST',
      body: { phone, code },
      silent: true,
    })
  }
}

/**
 * Composable to use AuthApiClient
 * Returns singleton instance
 */
let instance: AuthApiClient | null = null

export const useAuthApi = () => {
  if (!instance) {
    instance = new AuthApiClient()
  }
  return instance
}
