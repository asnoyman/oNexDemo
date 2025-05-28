import { baseTypeDefs } from './base.js';
import { userTypeDefs } from './user.js';
import { clubTypeDefs } from './club.js';
import { challengeTypeDefs } from './challenge.js';

// Merge all type definitions
export const typeDefs = [
  baseTypeDefs,
  userTypeDefs,
  clubTypeDefs,
  challengeTypeDefs
];
