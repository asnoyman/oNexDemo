import { db } from '../../db.js';
import { clubs, clubMembers } from '../../schema.js';
import { sql } from 'drizzle-orm';

export const clubResolvers = {
  Query: {
    club: async (_, { id }) => {
      const result = await db.select().from(clubs).where(sql`id = ${id}`).limit(1);
      return result[0] || null;
    },
    clubs: async () => {
      return await db.select().from(clubs);
    },
    clubMember: async (_, { id }) => {
      const result = await db.select().from(clubMembers).where(sql`id = ${id}`).limit(1);
      return result[0] || null;
    },
    clubMembers: async (_, { clubId }) => {
      if (clubId) {
        return await db.select().from(clubMembers).where(sql`club_id = ${clubId}`);
      }
      return await db.select().from(clubMembers);
    },
    myClubs: async (_, __, { user }) => {
      if (!user) return [];
      
      // Get all club memberships for the user
      const memberships = await db.select().from(clubMembers).where(sql`user_id = ${user.id}`);
      
      // Get the club details for each membership
      const clubIds = memberships.map(membership => membership.clubId);
      
      if (clubIds.length === 0) return [];
      
      return await db.select().from(clubs).where(sql`id IN (${clubIds})`);
    }
  },
  
  ClubMember: {
    club: async (parent) => {
      const result = await db.select().from(clubs).where(sql`id = ${parent.clubId}`).limit(1);
      return result[0] || null;
    },
    user: async (parent, _, { db, users }) => {
      const result = await db.select().from(users).where(sql`id = ${parent.userId}`).limit(1);
      return result[0] || null;
    }
  }
};
