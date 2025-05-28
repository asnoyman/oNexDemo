import gql from 'graphql-tag';

export const challengeTypeDefs = gql`
  # Challenge type definition
  type Challenge {
    id: ID!
    clubId: ID!
    title: String!
    description: String!
    duration: String!
    status: String!
    startDate: String!
    endDate: String!
    createdById: ID!
    scoreType: String!
    scoreUnit: String
    isHigherBetter: Boolean!
    topScores: [ChallengeEntry]
    createdAt: String!
    updatedAt: String!
    club: Club
    createdBy: User
  }

  # Challenge entry type definition
  type ChallengeEntry {
    id: ID!
    challengeId: ID!
    userId: ID!
    score: String!
    notes: String
    createdAt: String!
    updatedAt: String!
    challenge: Challenge
    user: User
  }

  extend type Query {
    # Challenge queries
    challenge(id: ID!): Challenge
    challenges(clubId: ID): [Challenge!]!
    
    # Challenge entry queries
    challengeEntry(id: ID!): ChallengeEntry
    challengeEntries(challengeId: ID): [ChallengeEntry!]!
    myChallengeEntries: [ChallengeEntry!]!
  }
`;
