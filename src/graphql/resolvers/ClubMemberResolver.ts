import { Arg, Ctx, Mutation, Query, Resolver } from 'type-graphql';
import { Context } from '../context';
import { db } from '../../db/db';
import { clubs, clubMembers, users, clubInvitations } from '../../db/schema';
import { eq, and } from 'drizzle-orm';

// Import types
import { ClubMember } from '../types/ClubMember';

@Resolver(() => ClubMember)
export class ClubMemberResolver {
  // Join a club
  @Mutation(() => ClubMember)
  async joinClub(
    @Arg('clubId', () => Number) clubId: number,
    @Ctx() ctx: Context
  ): Promise<ClubMember> {
    // Check if user is authenticated
    if (!ctx.user) {
      throw new Error('You must be logged in to join a club');
    }
    
    const userId = ctx.user.userId;
    
    // Check if club exists
    const clubCheck = await db.select()
      .from(clubs)
      .where(eq(clubs.id, clubId));
      
    if (clubCheck.length === 0) {
      throw new Error('Club not found');
    }
    
    // Check if the club is private
    if (clubCheck[0].isPrivate) {
      // Check if the user has an accepted invitation
      const invitationCheck = await db.select()
        .from(clubInvitations)
        .where(
          and(
            eq(clubInvitations.clubId, clubId),
            eq(clubInvitations.userId, userId),
            eq(clubInvitations.accepted, true)
          )
        );
      
      if (invitationCheck.length === 0) {
        throw new Error('You need an invitation to join this private club');
      }
      
      // Update the invitation to accepted if it's not already
      const invitation = invitationCheck[0];
      if (!invitation.accepted) {
        await db.update(clubInvitations)
          .set({
            accepted: true,
            acceptedAt: new Date()
          })
          .where(eq(clubInvitations.id, invitation.id));
      }
    }
    
    // Check if user is already a member
    const memberCheck = await db.select()
      .from(clubMembers)
      .where(
        and(
          eq(clubMembers.clubId, clubId),
          eq(clubMembers.userId, userId)
        )
      );
      
    if (memberCheck.length > 0) {
      throw new Error('You are already a member of this club');
    }
    
    // Add user as a member
    const [newMember] = await db.insert(clubMembers)
      .values({
        clubId,
        userId,
        isAdmin: false,
        joinedAt: new Date()
      })
      .returning();
      
    // Convert to ClubMember type
    return {
      id: newMember.id,
      clubId: newMember.clubId,
      userId: newMember.userId,
      isAdmin: Boolean(newMember.isAdmin),
      joinedAt: newMember.joinedAt || new Date()
    };
  }

  // Leave a club
  @Mutation(() => Boolean)
  async leaveClub(
    @Arg('clubId', () => Number) clubId: number,
    @Ctx() ctx: Context
  ): Promise<boolean> {
    // Check if user is authenticated
    if (!ctx.user) {
      throw new Error('You must be logged in to leave a club');
    }
    
    const userId = ctx.user.userId;
    
    // Check if user is a member of the club
    const memberCheck = await db.select()
      .from(clubMembers)
      .where(
        and(
          eq(clubMembers.clubId, clubId),
          eq(clubMembers.userId, userId)
        )
      );
      
    if (memberCheck.length === 0) {
      throw new Error('You are not a member of this club');
    }
    
    // Remove user from the club
    await db.delete(clubMembers)
      .where(
        and(
          eq(clubMembers.clubId, clubId),
          eq(clubMembers.userId, userId)
        )
      );
      
    return true;
  }

  // Get all members of a club
  @Query(() => [ClubMember])
  async getClubMembers(
    @Arg('clubId', () => Number) clubId: number,
    @Ctx() ctx: Context
  ): Promise<any[]> {
    // Check if user is authenticated
    if (!ctx.user) {
      throw new Error('You must be logged in to view club members');
    }
    
    // Check if club exists
    const clubCheck = await db.select()
      .from(clubs)
      .where(eq(clubs.id, clubId));
      
    if (clubCheck.length === 0) {
      throw new Error('Club not found');
    }
    
    // Get all members of the club with user details
    const membersData = await db.select({
      id: clubMembers.id,
      clubId: clubMembers.clubId,
      userId: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      profilePictureUrl: users.profilePictureUrl,
      isAdmin: clubMembers.isAdmin,
      joinedAt: clubMembers.joinedAt
    })
    .from(clubMembers)
    .innerJoin(users, eq(clubMembers.userId, users.id))
    .where(eq(clubMembers.clubId, clubId));
    
    // Return members with user details exactly as expected by tests
    return membersData.map(member => ({
      id: member.id,
      userId: member.userId,
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      profilePictureUrl: member.profilePictureUrl || null,
      isAdmin: Boolean(member.isAdmin),
      joinedAt: member.joinedAt || new Date()
    }));
  }
}
