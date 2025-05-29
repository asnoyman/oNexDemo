import { Arg, Ctx, Mutation, Query, Resolver } from 'type-graphql';
import { Context } from '../context';
import { db } from '../../db/db';
import { challenges, clubs, clubMembers, users, challengeEntries } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { Challenge, ChallengeDuration, ChallengeStatus, TopScoreEntry } from '../types/Challenge';
import { ChallengeEntry } from '../types/ChallengeEntry';

@Resolver(() => Challenge)
export class ChallengeResolver {
  // Create a new challenge
  @Mutation(() => Challenge)
  async createChallenge(
    @Arg('clubId', () => Number) clubId: number,
    @Arg('title', () => String) title: string,
    @Arg('description', () => String) description: string,
    @Arg('duration', () => ChallengeDuration) duration: ChallengeDuration,
    @Arg('startDate', () => Date) startDate: Date,
    @Arg('endDate', () => Date) endDate: Date,
    @Arg('scoreType', () => String) scoreType: string,
    @Arg('isHigherBetter', () => Boolean, { defaultValue: true }) isHigherBetter: boolean,
    @Ctx() ctx: Context,
    @Arg('scoreUnit', () => String, { nullable: true }) scoreUnit?: string,
    @Arg('status', () => ChallengeStatus, { defaultValue: ChallengeStatus.ACTIVE }) status?: ChallengeStatus
  ): Promise<Challenge> {
    // Check if user is authenticated
    if (!ctx.user) {
      throw new Error('You must be logged in to create a challenge');
    }
    
    const userId = ctx.user.userId;
    
    // Check if user is an admin of the club
    const adminCheck = await db.select()
      .from(clubMembers)
      .where(and(
        eq(clubMembers.clubId, clubId),
        eq(clubMembers.userId, userId),
        eq(clubMembers.isAdmin, true)
      ));
    
    if (adminCheck.length === 0) {
      throw new Error('Only club admins can create challenges');
    }
    
    // Create the challenge
    const insertedChallenge = await db.transaction(async (tx) => {
      // Insert the challenge with empty top scores array
      const [challenge] = await tx.insert(challenges)
        .values({
          clubId,
          title,
          description,
          duration: duration as any,
          status: status as any,
          startDate,
          endDate,
          createdById: userId,
          scoreType,
          scoreUnit,
          isHigherBetter,
          topScores: [],
          createdAt: new Date(),
          updatedAt: new Date()
        } as any)
        .returning();
      
      // Convert database result to Challenge type
      return {
        id: challenge.id,
        clubId: challenge.clubId,
        title: challenge.title,
        description: challenge.description,
        duration: challenge.duration as ChallengeDuration,
        status: challenge.status as ChallengeStatus,
        startDate: new Date(challenge.startDate),
        endDate: new Date(challenge.endDate),
        createdById: challenge.createdById,
        scoreType: challenge.scoreType,
        scoreUnit: challenge.scoreUnit || undefined,
        isHigherBetter: Boolean(challenge.isHigherBetter),
        topScores: challenge.topScores as TopScoreEntry[] || [],
        createdAt: challenge.createdAt ? new Date(challenge.createdAt) : new Date(),
        updatedAt: challenge.updatedAt ? new Date(challenge.updatedAt) : new Date()
      };
    });
    
    return insertedChallenge;
  }

  // Get a challenge by ID
  @Query(() => Challenge, { nullable: true })
  async challenge(
    @Arg('id', () => Number) id: number,
    @Ctx() ctx: Context
  ): Promise<Challenge | null> {
    // Find the challenge by ID
    const result = await db.select()
      .from(challenges)
      .where(eq(challenges.id, id));
    
    // Return null if not found
    if (result.length === 0) return null;
    
    // Convert database result to Challenge type
    const challenge = result[0];
    return {
      id: challenge.id,
      clubId: challenge.clubId,
      title: challenge.title,
      description: challenge.description,
      duration: challenge.duration as ChallengeDuration,
      status: challenge.status as ChallengeStatus,
      startDate: new Date(challenge.startDate),
      endDate: new Date(challenge.endDate),
      createdById: challenge.createdById,
      scoreType: challenge.scoreType,
      scoreUnit: challenge.scoreUnit || undefined,
      isHigherBetter: Boolean(challenge.isHigherBetter),
      topScores: challenge.topScores as TopScoreEntry[] || [],
      createdAt: challenge.createdAt ? new Date(challenge.createdAt) : new Date(),
      updatedAt: challenge.updatedAt ? new Date(challenge.updatedAt) : new Date()
    };
  }

  // Get all challenges for a club
  @Query(() => [Challenge])
  async clubChallenges(
    @Arg('clubId', () => Number) clubId: number,
    @Ctx() ctx: Context
  ): Promise<Challenge[]> {
    // Find all challenges for the club
    const result = await db.select()
      .from(challenges)
      .where(eq(challenges.clubId, clubId));
    
    // Convert database results to Challenge type
    return result.map(challenge => ({
      id: challenge.id,
      clubId: challenge.clubId,
      title: challenge.title,
      description: challenge.description,
      duration: challenge.duration as ChallengeDuration,
      status: challenge.status as ChallengeStatus,
      startDate: new Date(challenge.startDate),
      endDate: new Date(challenge.endDate),
      createdById: challenge.createdById,
      scoreType: challenge.scoreType,
      scoreUnit: challenge.scoreUnit || undefined,
      isHigherBetter: Boolean(challenge.isHigherBetter),
      topScores: challenge.topScores as TopScoreEntry[] || [],
      createdAt: challenge.createdAt ? new Date(challenge.createdAt) : new Date(),
      updatedAt: challenge.updatedAt ? new Date(challenge.updatedAt) : new Date()
    }));
  }

  // Update challenge status
  @Mutation(() => Challenge)
  async updateChallengeStatus(
    @Arg('id', () => Number) id: number,
    @Arg('status', () => ChallengeStatus) status: ChallengeStatus,
    @Ctx() ctx: Context
  ): Promise<Challenge> {
    // Check if user is authenticated
    if (!ctx.user) {
      throw new Error('You must be logged in to update a challenge');
    }
    
    const userId = ctx.user.userId;
    
    // Find the challenge
    const challengeResult = await db.select()
      .from(challenges)
      .where(eq(challenges.id, id));
    
    if (challengeResult.length === 0) {
      throw new Error('Challenge not found');
    }
    
    const challenge = challengeResult[0];
    
    // Check if user is an admin of the club
    const adminCheck = await db.select()
      .from(clubMembers)
      .where(and(
        eq(clubMembers.clubId, challenge.clubId),
        eq(clubMembers.userId, userId),
        eq(clubMembers.isAdmin, true)
      ));
    
    if (adminCheck.length === 0) {
      throw new Error('Only club admins can update challenge status');
    }
    
    // Update the challenge status
    const [updatedChallenge] = await db.update(challenges)
      .set({
        status: status as any, // Type conversion for enum
        updatedAt: new Date()
      })
      .where(eq(challenges.id, id))
      .returning();
    
    // Convert database result to Challenge type
    return {
      id: updatedChallenge.id,
      clubId: updatedChallenge.clubId,
      title: updatedChallenge.title,
      description: updatedChallenge.description,
      duration: updatedChallenge.duration as ChallengeDuration,
      status: updatedChallenge.status as ChallengeStatus,
      startDate: new Date(updatedChallenge.startDate),
      endDate: new Date(updatedChallenge.endDate),
      createdById: updatedChallenge.createdById,
      scoreType: updatedChallenge.scoreType,
      scoreUnit: updatedChallenge.scoreUnit || undefined,
      isHigherBetter: Boolean(updatedChallenge.isHigherBetter),
      topScores: updatedChallenge.topScores as TopScoreEntry[] || [],
      createdAt: updatedChallenge.createdAt ? new Date(updatedChallenge.createdAt) : new Date(),
      updatedAt: updatedChallenge.updatedAt ? new Date(updatedChallenge.updatedAt) : new Date()
    };
  }
}
