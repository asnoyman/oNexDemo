import { Arg, Ctx, Mutation, Query, Resolver } from 'type-graphql';
import { Context } from '../context';
import { db } from '../../db/db';
import { challenges, challengeEntries, clubMembers, users } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { ChallengeEntry } from '../types/ChallengeEntry';
import { Challenge, TopScoreEntry } from '../types/Challenge';

@Resolver(() => ChallengeEntry)
export class ChallengeEntryResolver {
  // Submit a new challenge entry
  @Mutation(() => ChallengeEntry)
  async submitChallengeEntry(
    @Arg('challengeId', () => Number) challengeId: number,
    @Arg('score', () => String) score: string,
    @Arg('notes', () => String, { nullable: true }) notes: string,
    @Ctx() ctx: Context
  ): Promise<ChallengeEntry> {
    // Check if user is authenticated
    if (!ctx.user) {
      throw new Error('You must be logged in to submit a challenge entry');
    }
    
    const userId = ctx.user.userId;
    
    // Get the challenge
    const challengeResult = await db.select()
      .from(challenges)
      .where(eq(challenges.id, challengeId));
    
    if (challengeResult.length === 0) {
      throw new Error('Challenge not found');
    }
    
    const challenge = challengeResult[0];
    
    // Check if user is a member of the club
    const memberCheck = await db.select()
      .from(clubMembers)
      .where(and(
        eq(clubMembers.clubId, challenge.clubId),
        eq(clubMembers.userId, userId)
      ));
    
    if (memberCheck.length === 0) {
      throw new Error('You must be a member of the club to submit a challenge entry');
    }
    
    // Create the challenge entry within a transaction
    const result = await db.transaction(async (tx) => {
      // Insert the challenge entry
      const [entry] = await tx.insert(challengeEntries)
        .values({
          challengeId,
          userId,
          score,
          notes,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      // Check if we need to update the top scores
      if (challenge.isHigherBetter) {
        // For higher-is-better challenges
        const scoreValue = parseFloat(score);
        const topScores = challenge.topScores as TopScoreEntry[] || [];
        
        // Get user data for the top score entry
        const userData = await tx.select()
          .from(users)
          .where(eq(users.id, userId));
        
        const userName = userData.length > 0 ? 
          `${userData[0].firstName} ${userData[0].lastName}` : 
          'Unknown User';
        
        // Check if this score should be in the top scores
        let shouldUpdateTopScores = false;
        
        // If we have fewer than 5 top scores, add this one
        if (topScores.length < 5) {
          shouldUpdateTopScores = true;
        } else {
          // Check if this score is better than the lowest top score
          const lowestTopScore = Math.min(...topScores.map(ts => parseFloat(ts.score)));
          if (scoreValue > lowestTopScore) {
            shouldUpdateTopScores = true;
          }
        }
        
        if (shouldUpdateTopScores) {
          // Add this score to top scores
          const newTopScoreEntry: TopScoreEntry = {
            userId,
            userName,
            score,
            achievedAt: new Date()
          };
          
          // Add the new score and sort by score (descending)
          const newTopScores = [...topScores, newTopScoreEntry]
            .sort((a, b) => parseFloat(b.score) - parseFloat(a.score))
            .slice(0, 5); // Keep only the top 5
          
          // Update the challenge with the new top scores
          await tx.update(challenges)
            .set({
              topScores: newTopScores,
              updatedAt: new Date()
            })
            .where(eq(challenges.id, challengeId));
        }
      } else {
        // For lower-is-better challenges
        const scoreValue = parseFloat(score);
        const topScores = challenge.topScores as TopScoreEntry[] || [];
        
        // Get user data for the top score entry
        const userData = await tx.select()
          .from(users)
          .where(eq(users.id, userId));
        
        const userName = userData.length > 0 ? 
          `${userData[0].firstName} ${userData[0].lastName}` : 
          'Unknown User';
        
        // Check if this score should be in the top scores
        let shouldUpdateTopScores = false;
        
        // If we have fewer than 5 top scores, add this one
        if (topScores.length < 5) {
          shouldUpdateTopScores = true;
        } else {
          // Check if this score is better than the highest top score
          const highestTopScore = Math.max(...topScores.map(ts => parseFloat(ts.score)));
          if (scoreValue < highestTopScore) {
            shouldUpdateTopScores = true;
          }
        }
        
        if (shouldUpdateTopScores) {
          // Add this score to top scores
          const newTopScoreEntry: TopScoreEntry = {
            userId,
            userName,
            score,
            achievedAt: new Date()
          };
          
          // Add the new score and sort by score (ascending for lower-is-better)
          const newTopScores = [...topScores, newTopScoreEntry]
            .sort((a, b) => parseFloat(a.score) - parseFloat(b.score))
            .slice(0, 5); // Keep only the top 5
          
          // Update the challenge with the new top scores
          await tx.update(challenges)
            .set({
              topScores: newTopScores,
              updatedAt: new Date()
            })
            .where(eq(challenges.id, challengeId));
        }
      }
      
      return entry;
    });
    
    return {
      id: result.id,
      challengeId: result.challengeId,
      userId: result.userId,
      score: result.score,
      notes: result.notes || undefined, // Convert null to undefined
      createdAt: result.createdAt ? new Date(result.createdAt) : new Date(),
      updatedAt: result.updatedAt ? new Date(result.updatedAt) : new Date()
    };
  }

  // Get all entries for a challenge
  @Query(() => [ChallengeEntry])
  async challengeEntries(
    @Arg('challengeId', () => Number) challengeId: number,
    @Ctx() ctx: Context
  ): Promise<ChallengeEntry[]> {
    // Get all entries for the challenge
    const entries = await db.select()
      .from(challengeEntries)
      .where(eq(challengeEntries.challengeId, challengeId));
    
    // Convert to ChallengeEntry type
    return entries.map(entry => ({
      id: entry.id,
      challengeId: entry.challengeId,
      userId: entry.userId,
      score: entry.score,
      notes: entry.notes || undefined, // Convert null to undefined
      createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(),
      updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : new Date()
    }));
  }

  // Get user's entries for a challenge
  @Query(() => [ChallengeEntry])
  async userChallengeEntries(
    @Arg('challengeId', () => Number) challengeId: number,
    @Ctx() ctx: Context
  ): Promise<ChallengeEntry[]> {
    // Check if user is authenticated
    if (!ctx.user) {
      throw new Error('You must be logged in to view your challenge entries');
    }
    
    const userId = ctx.user.userId;
    
    // Get all entries for the challenge by this user
    const entries = await db.select()
      .from(challengeEntries)
      .where(and(
        eq(challengeEntries.challengeId, challengeId),
        eq(challengeEntries.userId, userId)
      ));
    
    // Convert to ChallengeEntry type
    return entries.map(entry => ({
      id: entry.id,
      challengeId: entry.challengeId,
      userId: entry.userId,
      score: entry.score,
      notes: entry.notes || undefined, // Convert null to undefined
      createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(),
      updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : new Date()
    }));
  }

  // Update a challenge entry
  @Mutation(() => ChallengeEntry)
  async updateChallengeEntry(
    @Arg('id', () => Number) id: number,
    @Arg('score', () => String, { nullable: true }) score: string,
    @Arg('notes', () => String, { nullable: true }) notes: string,
    @Ctx() ctx: Context
  ): Promise<ChallengeEntry> {
    // Check if user is authenticated
    if (!ctx.user) {
      throw new Error('You must be logged in to update a challenge entry');
    }
    
    const userId = ctx.user.userId;
    
    // Get the challenge entry
    const entryResult = await db.select()
      .from(challengeEntries)
      .where(eq(challengeEntries.id, id));
    
    if (entryResult.length === 0) {
      throw new Error('Challenge entry not found');
    }
    
    const entry = entryResult[0];
    
    // Check if the entry belongs to the user
    if (entry.userId !== userId) {
      throw new Error('You can only update your own challenge entries');
    }
    
    // Prepare update data
    const updateData: any = {
      updatedAt: new Date()
    };
    
    if (score !== undefined) {
      updateData.score = score;
    }
    
    if (notes !== undefined) {
      updateData.notes = notes;
    }
    
    // Update the challenge entry
    const [updatedEntry] = await db.update(challengeEntries)
      .set(updateData)
      .where(eq(challengeEntries.id, id))
      .returning();
    
    // If score was updated, we might need to update the challenge's top scores
    // This would require fetching the challenge and potentially updating its top scores
    // For simplicity, we'll skip this part in this implementation
    
    return {
      id: updatedEntry.id,
      challengeId: updatedEntry.challengeId,
      userId: updatedEntry.userId,
      score: updatedEntry.score,
      notes: updatedEntry.notes || undefined, // Convert null to undefined
      createdAt: updatedEntry.createdAt ? new Date(updatedEntry.createdAt) : new Date(),
      updatedAt: updatedEntry.updatedAt ? new Date(updatedEntry.updatedAt) : new Date()
    };
  }
}
