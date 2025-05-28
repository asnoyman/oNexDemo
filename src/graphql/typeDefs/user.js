import gql from 'graphql-tag';

export const userTypeDefs = gql`
  # User type definition
  type User {
    id: ID!
    email: String!
    firstName: String!
    lastName: String!
    profilePictureUrl: String
    createdAt: String!
    updatedAt: String!
  }

  # Authentication payload returned after login/register
  type AuthPayload {
    token: String!
    user: User!
  }

  # Input types for user mutations
  input RegisterInput {
    email: String!
    password: String!
    firstName: String!
    lastName: String!
    profilePictureUrl: String
  }

  input LoginInput {
    email: String!
    password: String!
  }

  # Authentication status type
  type AuthStatus {
    isAuthenticated: Boolean!
    user: User
  }

  extend type Query {
    # User queries
    me: User
    user(id: ID!): User
    users: [User!]!
    # Authentication status check
    authStatus: AuthStatus!
  }

  extend type Mutation {
    # Authentication mutations
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    logout: Boolean!
  }
`;
