import { AuthResolver } from '../../graphql/resolvers/AuthResolver';
import { clearAuthCookie } from '../../middleware/auth';
import { Context } from '../../graphql/context';
import { Request, Response } from 'express';
import { UserPayload } from '../../middleware/auth';


declare const jest: any;
declare const describe: any;
declare const beforeEach: any;
declare const it: any;
declare const expect: any;


jest.mock('../../middleware/auth', () => ({
  clearAuthCookie: jest.fn(),
}));

describe('AuthResolver.logout', () => {
  let authResolver: AuthResolver;
  
  beforeEach(() => {
    authResolver = new AuthResolver();
    

    jest.clearAllMocks();
  });
  
  it('should logout a user successfully', async () => {

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
    
    const result = await authResolver.logout(mockContext);
    
    expect(clearAuthCookie).toHaveBeenCalledWith(mockContext.res);
    expect(result).toBe(true);
  });
  
  it('should return false if no user is authenticated', async () => {

    const mockRequest = {} as Request;
    const mockResponse = {
      clearCookie: jest.fn()
    } as unknown as Response;
    
    const mockContext: Context = {
      req: mockRequest,
      res: mockResponse
    };
    
    const result = await authResolver.logout(mockContext);
    
    expect(clearAuthCookie).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });
});
