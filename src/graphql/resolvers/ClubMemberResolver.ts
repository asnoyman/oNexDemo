import { Arg, Ctx, Mutation, Query, Resolver } from 'type-graphql';
import { Context } from '../context';

// We'll need to create these types
import { ClubMember } from '../types/ClubMember';

@Resolver(() => ClubMember)
export class ClubMemberResolver {
  // Join a club
  @Mutation(() => ClubMember)
  async joinClub(
    @Arg('clubId', () => Number) clubId: number,
    @Ctx() ctx: Context
  ): Promise<ClubMember> {
    // To be implemented
    throw new Error('Not implemented');
  }

  // Leave a club
  @Mutation(() => Boolean)
  async leaveClub(
    @Arg('clubId', () => Number) clubId: number,
    @Ctx() ctx: Context
  ): Promise<boolean> {
    // To be implemented
    throw new Error('Not implemented');
  }

  // Get all members of a club
  @Query(() => [ClubMember])
  async getClubMembers(
    @Arg('clubId', () => Number) clubId: number,
    @Ctx() ctx: Context
  ): Promise<ClubMember[]> {
    // To be implemented
    throw new Error('Not implemented');
  }
}
