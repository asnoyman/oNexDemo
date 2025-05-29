import { AuthResolver } from '../../graphql/resolvers/AuthResolver';
import { db } from '../../db/db';
import bcrypt from 'bcrypt';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { createToken, setAuthCookie } from '../../middleware/auth';
import { Context } from '../../graphql/context';
import { Request, Response } from 'express';

declare const jest: any;
declare const describe: any;
declare const beforeEach: any;
declare const it: any;
declare const expect: any;

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
    
    const mockRequest = {} as Request;
    const mockResponse = {
      cookie: jest.fn(),
      clearCookie: jest.fn()
    } as unknown as Response;
    
    mockContext = {
      req: mockRequest,
      res: mockResponse,
    };
    
    jest.clearAllMocks();
  });
  
  it('should register a new user successfully', async () => {
    (db.select as any).mockImplementation(() => ({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    }));
    
    (bcrypt.hash as any).mockResolvedValue('hashedPassword123');
    
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
    
    (createToken as any).mockReturnValue('jwt-token-123');
    
    const result = await authResolver.register(
      'test@example.com',
      'Test',
      'User',
      'password123',
      mockContext,
      'https://example.com/profile.jpg'
    );
    
    expect(db.select).toHaveBeenCalled();
    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    expect(db.insert).toHaveBeenCalledWith(users);
    expect(createToken).toHaveBeenCalledWith(mockUser);
    expect(setAuthCookie).toHaveBeenCalledWith(mockContext.res, 'jwt-token-123');
    
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
    (db.select as any).mockImplementation(() => ({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([{ id: 1 }]),
      }),
    }));
    
    await expect(
      authResolver.register(
        'existing@example.com',
        'Existing',
        'User',
        'password123',
        mockContext
      )
    ).rejects.toThrow('User with this email already exists');
    
    expect(bcrypt.hash).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });
  
  it('should register a user without a profile picture', async () => {
    (db.select as any).mockImplementation(() => ({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    }));
    
    (bcrypt.hash as any).mockResolvedValue('hashedPassword123');
    
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
    
    (createToken as any).mockReturnValue('jwt-token-123');
    
    const result = await authResolver.register(
      'test@example.com',
      'Test',
      'User',
      'password123',
      mockContext
    );
    
    expect(db.select).toHaveBeenCalled();
    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    expect(db.insert).toHaveBeenCalledWith(users);
    
    expect(result.profilePictureUrl).toBeUndefined();
  });
});
