import { GraphQLError } from 'graphql';

/**
 * Authentication middleware to protect GraphQL operations
 * @param {Object} resolverFunction - The resolver function to protect
 * @param {Boolean} requireAuth - Whether authentication is required (default: true)
 * @returns {Function} - Protected resolver function
 */
export const authMiddleware = (resolverFunction, requireAuth = true) => {
  return async (parent, args, context, info) => {
    // Public operations (login, register) don't require authentication
    if (!requireAuth) {
      return resolverFunction(parent, args, context, info);
    }
    
    // Check if user exists in context (set by the JWT verification)
    if (!context.user) {
      throw new GraphQLError('Authentication required. Please log in.', {
        extensions: {
          code: 'UNAUTHENTICATED',
          http: { status: 401 }
        }
      });
    }
    
    // User is authenticated, proceed with the resolver
    return resolverFunction(parent, args, context, info);
  };
};

/**
 * Helper to apply authentication middleware to all resolvers except specified ones
 * @param {Object} resolvers - The resolvers object
 * @param {Array} publicOperations - Array of operations that don't require auth, format: ['Query.me', 'Mutation.login']
 * @returns {Object} - Protected resolvers
 */
export const protectResolvers = (resolvers, publicOperations = []) => {
  const protectedResolvers = { ...resolvers };
  
  // Process each resolver type (Query, Mutation, etc.)
  Object.keys(resolvers).forEach(type => {
    if (typeof resolvers[type] === 'object') {
      // Process each resolver in the type
      Object.keys(resolvers[type]).forEach(field => {
        const path = `${type}.${field}`;
        const isPublic = publicOperations.includes(path);
        
        // Wrap resolver with auth middleware
        protectedResolvers[type][field] = authMiddleware(
          resolvers[type][field],
          !isPublic
        );
      });
    }
  });
  
  return protectedResolvers;
};
