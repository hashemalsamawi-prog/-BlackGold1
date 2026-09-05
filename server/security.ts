import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';

let devEphemeralSecret: string | null = null;

/**
 * Retrieve the active JWT Secret strictly adhering to environment configuration.
 * In production mode, absence of JWT_SECRET triggers an immediate error to prevent insecure boots.
 */
export function getJwtSecret(): string {
  const envSecret = process.env.JWT_SECRET;
  if (!envSecret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL SECURITY ERROR: JWT_SECRET environment variable is missing in production. Halting authentication.');
    }
    if (!devEphemeralSecret) {
      devEphemeralSecret = crypto.randomBytes(32).toString('hex');
      console.warn('⚠️ [Security Warning] JWT_SECRET is not set in environment variables. Using in-memory ephemeral key for development session.');
    }
    return devEphemeralSecret;
  }
  return envSecret;
}

/**
 * Cryptographic HMAC-SHA256 hash using the secret key
 * Eliminates all static or hardcoded salt strings.
 */
export function hashSecret(secret: string): string {
  if (!secret) return '';
  const key = getJwtSecret();
  return crypto.createHmac('sha256', key).update(secret).digest('hex');
}

/**
 * Timing-safe string comparison to prevent timing side-channel attacks
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Convert Arabic-Indic / Persian digits to standard ASCII numerals (e.g., ٧٧٧٧ -> 7777)
 */
export function normalizeDigits(input: string = ''): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
    .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
    .trim();
}

/**
 * Validate Yemeni mobile phone numbers (9 digits starting with 77, 78, 73, 71, 70 or landline 01, 02)
 */
export function validateYemeniPhone(rawPhone: string): { isValid: boolean; normalized: string } {
  const digits = normalizeDigits(rawPhone).replace(/\D/g, '');
  
  // Format standard: e.g. 770001111 (9 digits) or with leading 0 (0770001111) or 967 prefix (967770001111)
  let clean = digits;
  if (clean.startsWith('967') && clean.length >= 12) {
    clean = clean.slice(3);
  }
  if (clean.startsWith('0') && clean.length === 10) {
    clean = clean.slice(1);
  }

  const isValid = /^(77|78|73|71|70|01|02)[0-9]{7}$/.test(clean);
  return { isValid, normalized: clean };
}

/**
 * Generate cryptographically signed JWT Token
 */
export function generateToken(payload: { userId: string; role: string; phone: string; name: string }): string {
  const secret = getJwtSecret();
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days expiration
  const body = Buffer.from(JSON.stringify({ ...payload, iat: Date.now(), exp })).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

/**
 * Verify JWT Token and check expiration
 */
export function verifyToken(token: string): { userId: string; role: string; phone: string; name: string } | null {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const secret = getJwtSecret();
    const expectedSig = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
    
    if (!timingSafeEqual(signature, expectedSig)) return null;

    const decoded = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (decoded.exp && decoded.exp < Date.now()) {
      return null; // Expired
    }
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Sanitize text inputs against script tags, HTML injection, and control characters
 */
export function sanitizeInputString(input: string = '', maxLength: number = 255): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim()
    .slice(0, maxLength);
}

export interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
  message?: string;
}

/**
 * In-memory IP rate limiter for protecting sensitive authentication and transaction endpoints
 */
export function createRateLimiter(options: RateLimiterOptions) {
  const ipRequests = new Map<string, { count: number; resetTime: number }>();

  // Cleanup interval every 60 seconds
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of ipRequests.entries()) {
      if (now > entry.resetTime) {
        ipRequests.delete(ip);
      }
    }
  }, 60000);
  if (timer.unref) timer.unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress) || '127.0.0.1';
    const now = Date.now();
    const record = ipRequests.get(ip);

    if (!record || now > record.resetTime) {
      ipRequests.set(ip, { count: 1, resetTime: now + options.windowMs });
      return next();
    }

    if (record.count >= options.maxRequests) {
      return res.status(429).json({
        success: false,
        message: options.message || 'تم تجاوز عدد المحاولات المسموح بها. يرجى الانتظار قليلاً ثم إعادة المحاولة.'
      });
    }

    record.count += 1;
    return next();
  };
}

