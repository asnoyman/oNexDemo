import { AuthResolver } from '../../graphql/resolvers/AuthResolver';
import { db } from '../../db/db';
import bcrypt from 'bcrypt';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { createToken, setAuthCookie } from '../../middleware/auth';
import { Context } from '../../graphql/context';
import { Request, Response } from 'express';

// Explicitly declare Jest globals to fix TypeScript errors
declare const jest: any;
declare const describe: any;
declare const beforeEach: any;
declare const it: any;
declare const expect: any;

// Mock dependencies
jest.mock('../../db/db', () => ({
  db: {
    select: jest.fn(),
  },
}));

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

jest.mock('../../middleware/auth', () => ({
  createToken: jest.fn(),
  setAuthCookie: jest.fn(),
}));

describe('AuthResolver.login', () => {
  let authResolver: AuthResolver;
  let mockContext: Context;
  
  beforeEach(() => {
    authResolver = new AuthResolver();
    
    // Create mock request and response objects
    const mockRequest = {} as Request;
    const mockResponse = {
      cookie: jest.fn(),
      clearCookie: jest.fn()
    } as unknown as Response;
    
    mockContext = {
      req: mockRequest,
      res: mockResponse,
    };
    
    // Reset all mocks
    jest.clearAllMocks();
  });
  
  it('should login a user successfully', async () => {
    // Mock user data
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      password: 'hashedPassword123',
      profilePictureUrl: 'https://example.com/profile.jpg',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Mock db.select to return the user
    (db.select as any).mockImplementation(() => ({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([mockUser]),
      }),
    }));
    
    // Mock bcrypt.compare to return true (password is valid)
    (bcrypt.compare as any).mockResolvedValue(true);
    
    // Mock createToken
    (createToken as any).mockReturnValue('jwt-token-123');
    
    // Call login method
    const result = await authResolver.login(
      'test@example.com',
      'password123',
      mockContext
    );
    
    // Assertions
    expect(db.select).toHaveBeenCalled();
    expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword123');
    expect(createToken).toHaveBeenCalledWith(mockUser);
    expect(setAuthCookie).toHaveBeenCalledWith(mockContext.res, 'jwt-token-123');
    
    // Verify returned user
    expect(result).toEqual({
      id: mockUser.id,
      email: mockUser.email,
      firstName: mockUser.firstName,
      lastName: mockUser.lastName,
      profilePictureUrl: mockUser.profilePictureUrl,
      createdAt: mockUser.createdAt,
      updatedAt: mockUser.updatedAt,
    });
  });
  
  it('should throw an error if user does not exist', async () => {
    // Mock db.select to return empty array (user doesn't exist)
    (db.select as any).mockImplementation(() => ({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    }));
    
    // Call login method and expect it to throw
    await expect(
      authResolver.login(
        'nonexistent@example.com',
        'password123',
        mockContext
      )
    ).rejects.toThrow('Invalid email or password');
    
    // Verify bcrypt.compare was not called
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });
  
  it('should throw an error if password is incorrect', async () => {
    // Mock user data
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      password: 'hashedPassword123',
      profilePictureUrl: 'https://example.com/profile.jpg',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Mock db.select to return the user
    (db.select as any).mockImplementation(() => ({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([mockUser]),
      }),
    }));
    
    // Mock bcrypt.compare to return false (password is invalid)
    (bcrypt.compare as any).mockResolvedValue(false);
    
    // Call login method and expect it to throw
    await expect(
      authResolver.login(
        'test@example.com',
        'wrongpassword',
        mockContext
      )
    ).rejects.toThrow('Invalid email or password');
    
    // Verify createToken and setAuthCookie were not called
    expect(createToken).not.toHaveBeenCalled();
    expect(setAuthCookie).not.toHaveBeenCalled();
  });
});
