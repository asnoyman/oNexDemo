import { Field, ID, ObjectType } from "type-graphql";
import { Challenge } from "./Challenge";
import { User } from "./User";

@ObjectType()
export class ChallengeEntry {
  @Field(() => ID)
  id!: number;

  @Field(() => ID)
  challengeId!: number;

  @Field(() => ID)
  userId!: number;

  @Field(() => String)
  score!: string;

  @Field(() => String, { nullable: true })
  notes?: string;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;

  // Relationships
  @Field(() => Challenge, { nullable: true })
  challenge?: Challenge;

  @Field(() => User, { nullable: true })
  user?: User;
}
