import gql from 'graphql-tag';

export const baseTypeDefs = gql`
  # Base empty types that will be extended
  type Query {
    _empty: String
  }

  type Mutation {
    _empty: String
  }
`;
