import { AuthResolver } from '../../graphql/resolvers/AuthResolver';
import { clearAuthCookie } from '../../middleware/auth';
import { Context } from '../../graphql/context';
import { Request, Response } from 'express';
import { UserPayload } from '../../middleware/auth';

// Explicitly declare Jest globals to fix TypeScript errors
declare const jest: any;
declare const describe: any;
declare const beforeEach: any;
declare const it: any;
declare const expect: any;

// Mock dependencies
jest.mock('../../middleware/auth', () => ({
  clearAuthCookie: jest.fn(),
}));

describe('AuthResolver.logout', () => {
  let authResolver: AuthResolver;
  
  beforeEach(() => {
    authResolver = new AuthResolver();
    
    // Reset all mocks
    jest.clearAllMocks();
  });
  
  it('should logout a user successfully', async () => {
    // Create mock context with authenticated user
    const mockUserPayload: UserPayload = {
      userId: 1,
      email: 'test@example.com'
    };
    
    const mockRequest = {
      user: mockUserPayload
    } as Request;
    
    const mockResponse = {
      clearCookie: jest.fn()
    } as unknown as Response;
    
    const mockContext: Context = {
      req: mockRequest,
      res: mockResponse,
      user: mockUserPayload
    };
    
    // Call logout method
    const result = await authResolver.logout(mockContext);
    
    // Assertions
    expect(clearAuthCookie).toHaveBeenCalledWith(mockContext.res);
    expect(result).toBe(true);
  });
  
  it('should return false if no user is authenticated', async () => {
    // Create mock context without authenticated user
    const mockRequest = {} as Request;
    const mockResponse = {
      clearCookie: jest.fn()
    } as unknown as Response;
    
    const mockContext: Context = {
      req: mockRequest,
      res: mockResponse
    };
    
    // Call logout method
    const result = await authResolver.logout(mockContext);
    
    // Assertions
    expect(clearAuthCookie).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });
});
