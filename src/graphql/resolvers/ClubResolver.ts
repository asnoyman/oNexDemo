import { Arg, Ctx, Mutation, Query, Resolver } from 'type-graphql';
import { Context } from '../context';
import { db } from '../../db/db';
import { clubs, clubMembers } from '../../db/schema';
import { eq } from 'drizzle-orm';

// Import the Club type
import { Club } from '../types/Club';

@Resolver(() => Club)
export class ClubResolver {
  // Create a new club
  @Mutation(() => Club)
  async createClub(
    @Arg('name', () => String) name: string,
    @Arg('description', () => String) description: string,
    @Arg('isPrivate', () => Boolean, { defaultValue: false }) isPrivate: boolean,
    @Ctx() ctx: Context,
    @Arg('logoUrl', () => String, { nullable: true }) logoUrl?: string,
    @Arg('coverImageUrl', () => String, { nullable: true }) coverImageUrl?: string
  ): Promise<Club> {
    // Check if user is authenticated
    if (!ctx.user) {
      throw new Error('You must be logged in to create a club');
    }
    
    // Ensure we have a valid user ID
    const userId = ctx.user.userId;

    // Create the club
    const insertedClub = await db.transaction(async (tx) => {
      // Insert the club
      const [club] = await tx.insert(clubs)
        .values({
          name,
          description,
          isPrivate,
          logoUrl,
          coverImageUrl,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      // Make the creator an admin of the club
      await tx.insert(clubMembers)
        .values({
          clubId: club.id,
          userId: userId,
          isAdmin: true,
          joinedAt: new Date()
        });

      // Convert database result to Club type
      return {
        id: club.id,
        name: club.name,
        description: club.description || undefined,
        isPrivate: Boolean(club.isPrivate),
        logoUrl: club.logoUrl || undefined,
        coverImageUrl: club.coverImageUrl || undefined,
        createdAt: club.createdAt || new Date(),
        updatedAt: club.updatedAt || new Date()
      };
    });

    return insertedClub;
  }

  // Get a club by ID
  @Query(() => Club, { nullable: true })
  async club(
    @Arg('id', () => Number) id: number,
    @Ctx() ctx: Context
  ): Promise<Club | null> {
    // Find the club by ID
    const result = await db.select()
      .from(clubs)
      .where(eq(clubs.id, id));
    
    // Return the club if found, null otherwise
    if (result.length === 0) return null;
    
    // Convert database result to Club type
    const club = result[0];
    return {
      id: club.id,
      name: club.name,
      description: club.description || undefined,
      isPrivate: Boolean(club.isPrivate),
      logoUrl: club.logoUrl || undefined,
      coverImageUrl: club.coverImageUrl || undefined,
      createdAt: club.createdAt || new Date(),
      updatedAt: club.updatedAt || new Date()
    };
  }

  // Get all clubs
  @Query(() => [Club])
  async clubs(
    @Ctx() ctx: Context
  ): Promise<Club[]> {
    // Get all clubs
    const result = await db.select().from(clubs);
    
    // Convert database results to Club type
    return result.map(club => ({
      id: club.id,
      name: club.name,
      description: club.description || undefined,
      isPrivate: Boolean(club.isPrivate),
      logoUrl: club.logoUrl || undefined,
      coverImageUrl: club.coverImageUrl || undefined,
      createdAt: club.createdAt || new Date(),
      updatedAt: club.updatedAt || new Date()
    }));
  }
}
