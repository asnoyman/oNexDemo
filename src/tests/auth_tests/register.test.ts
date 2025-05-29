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
    insert: jest.fn(),
  },
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

jest.mock('../../middleware/auth', () => ({
  createToken: jest.fn(),
  setAuthCookie: jest.fn(),
}));

describe('AuthResolver.register', () => {
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
  
  it('should register a new user successfully', async () => {
    // Mock db.select to return empty array (user doesn't exist)
    (db.select as any).mockImplementation(() => ({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    }));
    
    // Mock bcrypt.hash
    (bcrypt.hash as any).mockResolvedValue('hashedPassword123');
    
    // Mock db.insert
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      profilePictureUrl: 'https://example.com/profile.jpg',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    (db.insert as any).mockImplementation(() => ({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([mockUser]),
      }),
    }));
    
    // Mock createToken
    (createToken as any).mockReturnValue('jwt-token-123');
    
    // Call register method
    const result = await authResolver.register(
      'test@example.com',
      'Test',
      'User',
      'password123',
      mockContext,
      'https://example.com/profile.jpg'
    );
    
    // Assertions
    expect(db.select).toHaveBeenCalled();
    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    expect(db.insert).toHaveBeenCalledWith(users);
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
  
  it('should throw an error if user already exists', async () => {
    // Mock db.select to return a user (user already exists)
    (db.select as any).mockImplementation(() => ({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([{ id: 1 }]),
      }),
    }));
    
    // Call register method and expect it to throw
    await expect(
      authResolver.register(
        'existing@example.com',
        'Existing',
        'User',
        'password123',
        mockContext
      )
    ).rejects.toThrow('User with this email already exists');
    
    // Verify bcrypt.hash and db.insert were not called
    expect(bcrypt.hash).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });
  
  it('should register a user without a profile picture', async () => {
    // Mock db.select to return empty array (user doesn't exist)
    (db.select as any).mockImplementation(() => ({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    }));
    
    // Mock bcrypt.hash
    (bcrypt.hash as any).mockResolvedValue('hashedPassword123');
    
    // Mock db.insert
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      profilePictureUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    (db.insert as any).mockImplementation(() => ({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([mockUser]),
      }),
    }));
    
    // Mock createToken
    (createToken as any).mockReturnValue('jwt-token-123');
    
    // Call register method without profilePictureUrl
    const result = await authResolver.register(
      'test@example.com',
      'Test',
      'User',
      'password123',
      mockContext
    );
    
    // Assertions
    expect(db.select).toHaveBeenCalled();
    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    expect(db.insert).toHaveBeenCalledWith(users);
    
    // Verify returned user
    expect(result.profilePictureUrl).toBeUndefined();
  });
});
