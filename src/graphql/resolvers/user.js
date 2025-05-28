import { db } from '../../db.js';
import { users } from '../../schema.js';
import { sql } from 'drizzle-orm';
import { generateToken, hashPassword, comparePasswords } from '../../utils/auth.js';

export const userResolvers = {
  Query: {
    me: (_, __, { user }) => {
      if (!user) return null;
      return user;
    },
    user: async (_, { id }) => {
      const result = await db.select().from(users).where(sql`id = ${id}`).limit(1);
      return result[0] || null;
    },
    users: async () => {
      try {
        console.log('Executing users query...');
        const result = await db.select().from(users);
        console.log(`Found ${result.length} users:`, result);
        return result;
      } catch (error) {
        console.error('Error in users query:', error);
        throw error;
      }
    },
    // Authentication status check resolver
    authStatus: (_, __, context) => {
      // If user exists in context, they are authenticated
      const isAuthenticated = !!context.user;
      
      return {
        isAuthenticated,
        user: context.user || null
      };
    },
  },
  
  Mutation: {
    register: async (_, { input }) => {
      const { email, password, firstName, lastName, profilePictureUrl } = input;
      
      // Check if user already exists
      const existingUser = await db.select().from(users).where(sql`email = ${email}`).limit(1);
      if (existingUser.length > 0) {
        throw new Error('User with this email already exists');
      }
      
      // Hash password
      const hashedPassword = await hashPassword(password);
      
      // Create new user
      const newUser = await db.insert(users).values({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        profilePictureUrl
      }).returning();
      
      // Generate JWT token
      const token = generateToken(newUser[0]);
      
      return {
        token,
        user: newUser[0]
      };
    },
    
    login: async (_, { input }) => {
      const { email, password } = input;
      
      // Find user by email
      const user = await db.select().from(users).where(sql`email = ${email}`).limit(1);
      if (user.length === 0) {
        throw new Error('Invalid email or password');
      }
      
      // Check password using secure bcrypt comparison
      const isPasswordValid = await comparePasswords(password, user[0].password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }
      
      // Generate JWT token
      const token = generateToken(user[0]);
      
      return {
        token,
        user: user[0]
      };
    },
    
    // Logout resolver
    logout: (_, __, { user }) => {
      // In GraphQL, we can't directly invalidate tokens on the server side
      // since JWT tokens are stateless. The client should discard the token.
      // This resolver is mainly for API consistency and future extensions.
      
      // We return true to indicate successful logout
      // The client should remove the token from storage upon receiving this response
      return true;
    },
  }
};
