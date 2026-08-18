import { z } from 'zod'

// ==================== LOGIN ====================
// Login validation is lighter; we just need to know if they provided a string.
// We don't enforce complexity here to avoid revealing policy details to attackers.
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})
export type LoginInput = z.infer<typeof loginSchema>

// ==================== USERNAME ====================
// Single source of truth for username rules. Shared by registration and by the
// live availability check so the typeahead can never say "looks fine" about a
// username that registration would later reject.
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Username can only contain letters, numbers, underscores, and hyphens',
  )

export const checkUsernameSchema = z.object({ username: usernameSchema })
export type CheckUsernameInput = z.infer<typeof checkUsernameSchema>

// ==================== REGISTER ====================
export const registerSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    username: usernameSchema,

    // Use the Enhanced Schema here
    password: enhancedPasswordSchema,

    confirmPassword: z.string(),

    role: z.enum(['user', 'seller']).default('user').optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
export type RegisterInput = z.infer<typeof registerSchema>

// ==================== EMAIL VERIFICATION ====================
export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
})
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>

// ==================== FORGOT PASSWORD ====================
export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

// ==================== RESET PASSWORD ====================
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Token is required'),

    // Use the Enhanced Schema here too
    password: enhancedPasswordSchema,

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

// ==================== REFRESH TOKEN ====================
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
})
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>
