import { Arg, Ctx, Mutation, Query, Resolver } from 'type-graphql';
import { Context } from '../context';
import { db } from '../../db/db';
import { clubs, clubInvitations, users, clubMembers } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { ClubInvitation } from '../types/ClubInvitation';

@Resolver(() => ClubInvitation)
export class ClubInvitationResolver {
  // Create an invitation to a club
  @Mutation(() => ClubInvitation)
  async inviteToClub(
    @Arg('clubId', () => Number) clubId: number,
    @Arg('userId', () => Number) userId: number,
    @Ctx() ctx: Context
  ): Promise<ClubInvitation> {
    // Check if user is authenticated
    if (!ctx.user) {
      throw new Error('You must be logged in to invite users');
    }
    
    const inviterId = ctx.user.userId;
    
    // Check if the inviter is an admin of the club
    const adminCheck = await db.select()
      .from(clubMembers)
      .where(
        and(
          eq(clubMembers.clubId, clubId),
          eq(clubMembers.userId, inviterId),
          eq(clubMembers.isAdmin, true)
        )
      );
      
    if (adminCheck.length === 0) {
      throw new Error('Only club admins can invite users');
    }
    
    // Check if the club is private (only private clubs need invitations)
    const clubCheck = await db.select()
      .from(clubs)
      .where(eq(clubs.id, clubId));
      
    if (clubCheck.length === 0) {
      throw new Error('Club not found');
    }
    
    if (!clubCheck[0].isPrivate) {
      throw new Error('Invitations are only needed for private clubs');
    }
    
    // Check if the user to invite exists
    const userCheck = await db.select()
      .from(users)
      .where(eq(users.id, userId));
      
    if (userCheck.length === 0) {
      throw new Error('User not found');
    }
    
    // Check if an invitation already exists
    const invitationCheck = await db.select()
      .from(clubInvitations)
      .where(
        and(
          eq(clubInvitations.clubId, clubId),
          eq(clubInvitations.userId, userId)
        )
      );
      
    if (invitationCheck.length > 0) {
      throw new Error('User has already been invited to this club');
    }
    
    // Create the invitation
    const [invitation] = await db.insert(clubInvitations)
      .values({
        clubId,
        userId,
        invitedBy: inviterId,
        invitedAt: new Date(),
        accepted: false
      })
      .returning();
      
    return {
      id: invitation.id,
      clubId: invitation.clubId,
      userId: invitation.userId,
      invitedBy: invitation.invitedBy,
      invitedAt: invitation.invitedAt || new Date(),
      accepted: Boolean(invitation.accepted),
      acceptedAt: invitation.acceptedAt || undefined
    };
  }

  // Get all invitations for a club
  @Query(() => [ClubInvitation])
  async getClubInvitations(
    @Arg('clubId', () => Number) clubId: number,
    @Ctx() ctx: Context
  ): Promise<ClubInvitation[]> {
    // Check if user is authenticated
    if (!ctx.user) {
      throw new Error('You must be logged in to view invitations');
    }
    
    // Check if the user is an admin of the club
    const adminCheck = await db.select()
      .from(clubMembers)
      .where(
        and(
          eq(clubMembers.clubId, clubId),
          eq(clubMembers.userId, ctx.user.userId),
          eq(clubMembers.isAdmin, true)
        )
      );
      
    if (adminCheck.length === 0) {
      throw new Error('Only club admins can view all invitations');
    }
    
    // Get all invitations for the club
    const invitations = await db.select()
      .from(clubInvitations)
      .where(eq(clubInvitations.clubId, clubId));
      
    // Convert to ClubInvitation type
    return invitations.map(invitation => ({
      id: invitation.id,
      clubId: invitation.clubId,
      userId: invitation.userId,
      invitedBy: invitation.invitedBy,
      invitedAt: invitation.invitedAt || new Date(),
      accepted: Boolean(invitation.accepted),
      acceptedAt: invitation.acceptedAt || undefined
    }));
  }

  // Get all invitations for the current user
  @Query(() => [ClubInvitation])
  async getMyInvitations(
    @Ctx() ctx: Context
  ): Promise<ClubInvitation[]> {
    // Check if user is authenticated
    if (!ctx.user) {
      throw new Error('You must be logged in to view your invitations');
    }
    
    // Get all invitations for the current user that are not accepted
    const invitations = await db.select()
      .from(clubInvitations)
      .where(
        and(
          eq(clubInvitations.userId, ctx.user.userId),
          eq(clubInvitations.accepted, false)
        )
      );
      
    // Convert to ClubInvitation type
    return invitations.map(invitation => ({
      id: invitation.id,
      clubId: invitation.clubId,
      userId: invitation.userId,
      invitedBy: invitation.invitedBy,
      invitedAt: invitation.invitedAt || new Date(),
      accepted: Boolean(invitation.accepted),
      acceptedAt: invitation.acceptedAt || undefined
    }));
  }

  // Accept an invitation
  @Mutation(() => Boolean)
  async acceptInvitation(
    @Arg('invitationId', () => Number) invitationId: number,
    @Ctx() ctx: Context
  ): Promise<boolean> {
    // Check if user is authenticated
    if (!ctx.user) {
      throw new Error('You must be logged in to accept an invitation');
    }
    
    // Check if the invitation exists and belongs to the current user
    const invitationCheck = await db.select()
      .from(clubInvitations)
      .where(
        and(
          eq(clubInvitations.id, invitationId),
          eq(clubInvitations.userId, ctx.user.userId)
        )
      );
      
    if (invitationCheck.length === 0) {
      throw new Error('Invitation not found or does not belong to you');
    }
    
    const invitation = invitationCheck[0];
    
    // Check if the invitation is already accepted
    if (invitation.accepted) {
      throw new Error('Invitation has already been accepted');
    }
    
    // Update the invitation to accepted
    await db.update(clubInvitations)
      .set({
        accepted: true,
        acceptedAt: new Date()
      })
      .where(eq(clubInvitations.id, invitationId));
      
    // Add the user to the club
    await db.insert(clubMembers)
      .values({
        clubId: invitation.clubId,
        userId: ctx.user.userId,
        isAdmin: false,
        joinedAt: new Date()
      })
      .returning();
      
    return true;
  }
}
