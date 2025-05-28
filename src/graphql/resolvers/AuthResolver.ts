import { Arg, Ctx, Mutation, Query, Resolver } from 'type-graphql';
import { User } from '../types/User';
import { db } from '../../db/db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { Context } from '../context';
import { createToken, setAuthCookie, clearAuthCookie } from '../../middleware/auth';

// Helper function to convert database user to GraphQL User type
function mapDbUserToGraphQL(dbUser: any): User {
  return {
    id: dbUser.id,
    email: dbUser.email,
    firstName: dbUser.firstName,
    lastName: dbUser.lastName,
    profilePictureUrl: dbUser.profilePictureUrl || undefined,
    createdAt: dbUser.createdAt || new Date(),
    updatedAt: dbUser.updatedAt || new Date()
  };
}

@Resolver(() => User)
export class AuthResolver {
  // Get the currently authenticated user
  @Query(() => User, { nullable: true })
  async me(@Ctx() ctx: Context): Promise<User | undefined> {
    if (!ctx.user) {
      return undefined;
    }

    const result = await db.select().from(users).where(eq(users.id, ctx.user.userId));
    return result.length > 0 ? mapDbUserToGraphQL(result[0]) : undefined;
  }

  // Register a new user
  @Mutation(() => User)
  async register(
    @Arg('email', () => String) email: string,
    @Arg('firstName', () => String) firstName: string,
    @Arg('lastName', () => String) lastName: string,
    @Arg('password', () => String) password: string,
    @Ctx() ctx: Context,
    @Arg('profilePictureUrl', () => String, { nullable: true }) profilePictureUrl?: string
  ): Promise<User> {
    // Check if user already exists
    const existingUser = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.email, email));
    
    if (existingUser.length > 0) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await db.insert(users).values({
      email,
      firstName,
      lastName,
      password: hashedPassword,
      profilePictureUrl
    }).returning();

    const newUser = result[0];
    
    // Create and set JWT token
    const token = createToken(newUser);
    setAuthCookie(ctx.res, token);
    
    return mapDbUserToGraphQL(newUser);
  }

  // Login user
  @Mutation(() => User)
  async login(
    @Arg('email', () => String) email: string,
    @Arg('password', () => String) password: string,
    @Ctx() ctx: Context
  ): Promise<User> {
    // Find user by email
    const result = await db.select().from(users).where(eq(users.email, email));
    
    if (result.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = result[0];
    
    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      throw new Error('Invalid email or password');
    }
    
    // Create and set JWT token
    const token = createToken(user);
    setAuthCookie(ctx.res, token);
    
    return mapDbUserToGraphQL(user);
  }

  // Logout user
  @Mutation(() => Boolean)
  async logout(@Ctx() ctx: Context): Promise<boolean> {
    if (!ctx.user) {
      return false;
    }
    
    clearAuthCookie(ctx.res);
    return true;
  }
}
