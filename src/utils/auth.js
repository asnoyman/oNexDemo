import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { users } from '../schema.js';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_this';

/**
 * Generate a JWT token for a user
 * @param {Object} user - User object
 * @returns {String} JWT token
 */
export const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

/**
 * Hash a password
 * @param {String} password - Plain text password
 * @returns {Promise<String>} Hashed password
 */
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

/**
 * Compare a plain text password with a hashed password
 * @param {String} password - Plain text password
 * @param {String} hashedPassword - Hashed password
 * @returns {Promise<Boolean>} Whether passwords match
 */
export const comparePasswords = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

/**
 * Get user from token
 * @param {String} token - JWT token
 * @returns {Promise<Object|null>} User object or null
 */
export const getUserFromToken = async (token) => {
  try {
    // Remove "Bearer " prefix if present
    const tokenValue = token.startsWith('Bearer ') ? token.slice(7) : token;
    
    // Verify token
    const decoded = jwt.verify(tokenValue, JWT_SECRET);
    
    // Get user from database
    const user = await db.select().from(users).where(sql`id = ${decoded.id}`).limit(1);
    
    return user[0] || null;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
};
