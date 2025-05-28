import { Request, Response } from 'express';
import { UserPayload } from '../middleware/auth';

// Define the context type for GraphQL resolvers
export interface Context {
  req: Request;
  res: Response;
  user?: UserPayload;
}

// Create context for GraphQL resolvers
export const createContext = ({ req, res }: { req: Request; res: Response }): Context => {
  return {
    req,
    res,
    user: req.user
  };
};
