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
}
