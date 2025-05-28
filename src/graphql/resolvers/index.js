import { userResolvers } from './user.js';
import { clubResolvers } from './club.js';
import { challengeResolvers } from './challenge.js';
import { protectResolvers } from '../../utils/authMiddleware.js';

// Helper function to merge resolvers
const mergeResolvers = (resolversArray) => {
  const merged = {};
  
  resolversArray.forEach(resolverObj => {
    Object.keys(resolverObj).forEach(key => {
      if (!merged[key]) {
        merged[key] = {};
      }
      
      Object.assign(merged[key], resolverObj[key]);
    });
  });
  
  return merged;
};

// Define operations that don't require authentication
const publicOperations = [
  'Mutation.login',
  'Mutation.register',
  'Mutation.logout',
  'Query.authStatus'
];

// Merge all resolvers
const mergedResolvers = mergeResolvers([
  userResolvers,
  clubResolvers,
  challengeResolvers
]);

// Apply authentication protection to all resolvers except public ones
export const resolvers = protectResolvers(mergedResolvers, publicOperations);
