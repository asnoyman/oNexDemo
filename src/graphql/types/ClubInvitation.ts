import { Field, ID, ObjectType } from 'type-graphql';
import { Club } from './Club';
import { User } from './User';

// This tells TypeScript that we're ok with properties being initialized elsewhere
// (they'll be initialized when we fetch from the database or create new instances)
// @ts-ignore
@ObjectType({ isAbstract: true })

export class ClubInvitation {
  @Field(() => ID)
  id!: number;

  @Field(() => Number)
  clubId!: number;

  @Field(() => Club, { nullable: true })
  club?: Club;

  @Field(() => Number)
  userId!: number;

  @Field(() => User, { nullable: true })
  user?: User;

  @Field(() => Number)
  invitedBy!: number;

  @Field(() => User, { nullable: true })
  inviter?: User;

  @Field(() => Date)
  invitedAt!: Date;

  @Field(() => Boolean)
  accepted!: boolean;

  @Field(() => Date, { nullable: true })
  acceptedAt?: Date;
}
