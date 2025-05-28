import { Field, ID, ObjectType } from "type-graphql";
import { ClubMember } from "./ClubMember";

@ObjectType()
export class Club {
  @Field(() => ID)
  id!: number;

  @Field(() => String)
  name!: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => Boolean)
  isPrivate!: boolean;

  @Field(() => String, { nullable: true })
  logoUrl?: string;

  @Field(() => String, { nullable: true })
  coverImageUrl?: string;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;

  // Relationships
  @Field(() => [ClubMember], { nullable: true })
  members?: ClubMember[];
}
