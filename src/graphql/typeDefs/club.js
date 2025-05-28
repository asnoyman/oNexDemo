import gql from 'graphql-tag';

export const clubTypeDefs = gql`
  # Club type definition
  type Club {
    id: ID!
    name: String!
    description: String
    logoUrl: String
    coverImageUrl: String
    createdAt: String!
    updatedAt: String!
  }

  # Club membership type definition
  type ClubMember {
    id: ID!
    clubId: ID!
    userId: ID!
    isAdmin: Boolean!
    joinedAt: String!
    club: Club
    user: User
  }

  extend type Query {
    # Club queries
    club(id: ID!): Club
    clubs: [Club!]!
    
    # Club membership queries
    clubMember(id: ID!): ClubMember
    clubMembers(clubId: ID): [ClubMember!]!
    myClubs: [Club!]!
  }
`;
