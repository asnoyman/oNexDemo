import { db } from '../../db.js';
import { challenges, challengeEntries, users, clubs } from '../../schema.js';
import { sql } from 'drizzle-orm';

export const challengeResolvers = {
  Query: {
    challenge: async (_, { id }) => {
      const result = await db.select().from(challenges).where(sql`id = ${id}`).limit(1);
      return result[0] || null;
    },
    challenges: async (_, { clubId }) => {
      if (clubId) {
        return await db.select().from(challenges).where(sql`club_id = ${clubId}`);
      }
      return await db.select().from(challenges);
    },
    challengeEntry: async (_, { id }) => {
      const result = await db.select().from(challengeEntries).where(sql`id = ${id}`).limit(1);
      return result[0] || null;
    },
    challengeEntries: async (_, { challengeId }) => {
      if (challengeId) {
        return await db.select().from(challengeEntries).where(sql`challenge_id = ${challengeId}`);
      }
      return await db.select().from(challengeEntries);
    },
    myChallengeEntries: async (_, __, { user }) => {
      if (!user) return [];
      return await db.select().from(challengeEntries).where(sql`user_id = ${user.id}`);
    }
  },
  
  Challenge: {
    club: async (parent) => {
      const result = await db.select().from(clubs).where(sql`id = ${parent.clubId}`).limit(1);
      return result[0] || null;
    },
    createdBy: async (parent) => {
      const result = await db.select().from(users).where(sql`id = ${parent.createdById}`).limit(1);
      return result[0] || null;
    },
    topScores: async (parent) => {
      // Get top entries for this challenge
      const entries = await db.select()
        .from(challengeEntries)
        .where(sql`challenge_id = ${parent.id}`)
        .orderBy(parent.isHigherBetter ? sql`score DESC` : sql`score ASC`)
        .limit(3);
      
      return entries;
    }
  },
  
  ChallengeEntry: {
    challenge: async (parent) => {
      const result = await db.select().from(challenges).where(sql`id = ${parent.challengeId}`).limit(1);
      return result[0] || null;
    },
    user: async (parent) => {
      const result = await db.select().from(users).where(sql`id = ${parent.userId}`).limit(1);
      return result[0] || null;
    }
  }
};
