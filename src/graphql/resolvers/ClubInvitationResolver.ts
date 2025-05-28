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
    /// To be implemented
    throw new Error('Not implemented');
  }

  // Get all invitations for a club
  @Query(() => [ClubInvitation])
  async getClubInvitations(
    @Arg('clubId', () => Number) clubId: number,
    @Ctx() ctx: Context
  ): Promise<ClubInvitation[]> {
    // To be implemented
    throw new Error('Not implemented');
  }

  // Get all invitations for the current user
  @Query(() => [ClubInvitation])
  async getMyInvitations(
    @Ctx() ctx: Context
  ): Promise<ClubInvitation[]> {
    // To be implemented
    throw new Error('Not implemented');
  }

  // Accept an invitation
  @Mutation(() => Boolean)
  async acceptInvitation(
    @Arg('invitationId', () => Number) invitationId: number,
    @Ctx() ctx: Context
  ): Promise<boolean> {
    // To be implemented
    throw new Error('Not implemented');
  }
}
