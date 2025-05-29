import { Field, ID, ObjectType, registerEnumType } from "type-graphql";
import { Club } from "./Club";
import { User } from "./User";
import { ChallengeEntry } from "./ChallengeEntry";

// Enum for challenge status
export enum ChallengeStatus {
  ACTIVE = "active",
  COMPLETED = "completed",
  ARCHIVED = "archived"
}

// Enum for challenge duration
export enum ChallengeDuration {
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly"
}

// Register enums with type-graphql
registerEnumType(ChallengeStatus, {
  name: "ChallengeStatus",
  description: "Status of a challenge"
});

registerEnumType(ChallengeDuration, {
  name: "ChallengeDuration",
  description: "Duration type of a challenge"
});

// Top score entry type
@ObjectType()
export class TopScoreEntry {
  @Field(() => ID)
  userId!: number;

  @Field(() => String)
  userName!: string;

  @Field(() => String)
  score!: string;

  @Field(() => Date)
  achievedAt!: Date;
}

@ObjectType()
export class Challenge {
  @Field(() => ID)
  id!: number;

  @Field(() => ID)
  clubId!: number;

  @Field(() => String)
  title!: string;

  @Field(() => String)
  description!: string;

  @Field(() => ChallengeDuration)
  duration!: ChallengeDuration;

  @Field(() => ChallengeStatus)
  status!: ChallengeStatus;

  @Field(() => Date)
  startDate!: Date;

  @Field(() => Date)
  endDate!: Date;

  @Field(() => ID)
  createdById!: number;

  @Field(() => String)
  scoreType!: string;

  @Field(() => String, { nullable: true })
  scoreUnit?: string;

  @Field(() => Boolean)
  isHigherBetter!: boolean;

  @Field(() => [TopScoreEntry], { nullable: true })
  topScores?: TopScoreEntry[];

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;

  // Relationships
  @Field(() => Club, { nullable: true })
  club?: Club;

  @Field(() => User, { nullable: true })
  createdBy?: User;

  @Field(() => [() => ChallengeEntry], { nullable: true })
  entries?: ChallengeEntry[];
}
