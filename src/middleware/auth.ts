import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

// Define the user payload structure for JWT
export interface UserPayload {
  userId: number;
  email: string;
}

// Extend Express Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

// Get JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET!;

// Create JWT token
export const createToken = (user: { id: number; email: string }): string => {
  return jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Verify JWT token
export const verifyToken = (token: string): UserPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
  } catch (error) {
    return null;
  }
};

// Authentication middleware
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // Get token from cookies
  const token = req.cookies?.authToken;
  
  if (token) {
    const payload = verifyToken(token);
    
    if (payload) {
      // Set user in request
      req.user = payload;
      
      // Check if user still exists in database
      const userExists = await db.select({ id: users.id })
        .from(users)
        .where(eq(users.id, payload.userId))
        .then(result => result.length > 0);
      
      if (!userExists) {
        // User no longer exists, clear cookie
        res.clearCookie('authToken');
        req.user = undefined;
      }
    } else {
      // Invalid token, clear cookie
      res.clearCookie('authToken');
    }
  }
  
  next();
};

// Get current user from database
export const getCurrentUser = async (userId: number) => {
  const result = await db.select().from(users).where(eq(users.id, userId));
  return result.length > 0 ? result[0] : null;
};

// Check if user is authenticated
export const isAuthenticated = (req: Request): boolean => {
  return !!req.user;
};

// Set authentication cookie
export const setAuthCookie = (res: Response, token: string) => {
  res.cookie('authToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: 'strict'
  });
};

// Clear authentication cookie
export const clearAuthCookie = (res: Response) => {
  res.clearCookie('authToken');
};
