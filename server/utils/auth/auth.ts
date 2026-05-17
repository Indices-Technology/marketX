// FILE PATH: server/utils/auth/auth.ts

import { hash, verify } from 'argon2'
import jwt from 'jsonwebtoken'

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('[auth] JWT_SECRET is not set')
  return secret
}

const getJwtRefreshSecret = () => {
  const secret = process.env.JWT_REFRESH_SECRET
  if (!secret) throw new Error('[auth] JWT_REFRESH_SECRET is not set')
  return secret
}

// ==================== PASSWORD HASHING ====================

export async function hashPassword(password: string): Promise<string> {
  return await hash(password, {
    type: 2, // argon2id
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  })
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  try {
    return await verify(hash, password)
  } catch {
    return false
  }
}

// ==================== JWT TOKENS ====================

export interface TokenPayload {
  userId: string
  email: string
  role: string
  sessionId?: string
  iat?: number
  exp?: number
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId, jti: crypto.randomUUID() }, getJwtRefreshSecret(), {
    expiresIn: '7d',
  })
}

export function generateTokens(
  userId: string,
  email?: string,
  role: string = 'user',
  sessionId?: string,
) {
  const accessToken = jwt.sign(
    { userId, email, role, ...(sessionId ? { sessionId } : {}) },
    getJwtSecret(),
    { expiresIn: '1h' },
  )

  const refreshToken = generateRefreshToken(userId)

  return { accessToken, refreshToken }
}

export function jwtVerify(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as TokenPayload
    return decoded
  } catch (error) {
    throw new Error('Invalid or expired token')
  }
}

export function jwtVerifyRefresh(token: string): { userId: string } {
  try {
    const decoded = jwt.verify(token, getJwtRefreshSecret()) as { userId: string }
    return decoded
  } catch (error) {
    throw new Error('Invalid or expired refresh token')
  }
}

export function jwtDecode(token: string): TokenPayload | null {
  try {
    return jwt.decode(token) as TokenPayload
  } catch {
    return null
  }
}
