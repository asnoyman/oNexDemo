import { Arg, Mutation, Query, Resolver, Int } from "type-graphql";
import { User } from "../types/User";
import { db } from "../../db/db";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";

// Helper function to convert database user to GraphQL User type
function mapDbUserToGraphQL(dbUser: any): User {
  return {
    id: dbUser.id,
    email: dbUser.email,
    firstName: dbUser.firstName,
    lastName: dbUser.lastName,
    profilePictureUrl: dbUser.profilePictureUrl || undefined, // Convert null to undefined
    createdAt: dbUser.createdAt || new Date(),
    updatedAt: dbUser.updatedAt || new Date()
  };
}

@Resolver(() => User)
export class UserResolver {
  @Query(() => [User])
  async users(): Promise<User[]> {
    const dbUsers = await db.select().from(users);
    return dbUsers.map(mapDbUserToGraphQL);
  }

  @Query(() => User, { nullable: true })
  async user(@Arg("id", () => Int) id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result.length > 0 ? mapDbUserToGraphQL(result[0]) : undefined;
  }

  @Query(() => User, { nullable: true })
  async userByEmail(@Arg("email", () => String) email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result.length > 0 ? mapDbUserToGraphQL(result[0]) : undefined;
  }

  @Mutation(() => User)
  async createUser(
    @Arg("email", () => String) email: string,
    @Arg("firstName", () => String) firstName: string,
    @Arg("lastName", () => String) lastName: string,
    @Arg("password", () => String) password: string,
    @Arg("profilePictureUrl", () => String, { nullable: true }) profilePictureUrl?: string
  ): Promise<User> {
    // In a real application, you would hash the password here
    const result = await db.insert(users).values({
      email,
      firstName,
      lastName,
      password,
      profilePictureUrl
    }).returning();
    
    return mapDbUserToGraphQL(result[0]);
  }

  @Mutation(() => User, { nullable: true })
  async updateUser(
    @Arg("id", () => Int) id: number,
    @Arg("firstName", () => String, { nullable: true }) firstName?: string,
    @Arg("lastName", () => String, { nullable: true }) lastName?: string,
    @Arg("profilePictureUrl", () => String, { nullable: true }) profilePictureUrl?: string
  ): Promise<User | undefined> {
    const updateData: any = {};
    
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (profilePictureUrl !== undefined) updateData.profilePictureUrl = profilePictureUrl;
    
    if (Object.keys(updateData).length === 0) {
      // No fields to update
      const user = await db.select().from(users).where(eq(users.id, id));
      return user.length > 0 ? mapDbUserToGraphQL(user[0]) : undefined;
    }
    
    const result = await db.update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    
    return result.length > 0 ? mapDbUserToGraphQL(result[0]) : undefined;
  }

  @Mutation(() => Boolean)
  async deleteUser(@Arg("id", () => Int) id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }
}
