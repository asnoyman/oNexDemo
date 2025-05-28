import { Field, ID, ObjectType } from "type-graphql";
import { Club } from "./Club";
import { User } from "./User";

@ObjectType()
export class ClubMember {
  @Field(() => ID)
  id!: number;

  @Field(() => Number)
  clubId!: number;

  @Field(() => Number)
  userId!: number;

  @Field(() => Boolean)
  isAdmin!: boolean;

  @Field(() => Date)
  joinedAt!: Date;

  // Relationships
  @Field(() => Club)
  club?: Club;

  @Field(() => User)
  user?: User;
}
