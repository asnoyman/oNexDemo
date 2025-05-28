import { Arg, Ctx, Mutation, Query, Resolver } from 'type-graphql';
import { Context } from '../context';

// We'll need to create this type
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
    // To be implemented
    throw new Error('Not implemented');
  }

  // Get a club by ID
  @Query(() => Club, { nullable: true })
  async club(
    @Arg('id', () => Number) id: number,
    @Ctx() ctx: Context
  ): Promise<Club | null> {
    // To be implemented
    throw new Error('Not implemented');
  }

  // Get all clubs
  @Query(() => [Club])
  async clubs(
    @Ctx() ctx: Context
  ): Promise<Club[]> {
    // To be implemented
    throw new Error('Not implemented');
  }
}
