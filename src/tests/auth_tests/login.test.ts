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
  
  it('should login a user successfully', async () => {
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
    
    (db.select as any).mockImplementation(() => ({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([mockUser]),
      }),
    }));
    
    (bcrypt.compare as any).mockResolvedValue(true);
    
    (createToken as any).mockReturnValue('jwt-token-123');
    
    const result = await authResolver.login(
      'test@example.com',
      'password123',
      mockContext
    );
    
    expect(db.select).toHaveBeenCalled();
    expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword123');
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
  
  it('should throw an error if user does not exist', async () => {
    (db.select as any).mockImplementation(() => ({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    }));
    
    await expect(
      authResolver.login(
        'nonexistent@example.com',
        'password123',
        mockContext
      )
    ).rejects.toThrow('Invalid email or password');
    
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });
  
  it('should throw an error if password is incorrect', async () => {
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
    
    (db.select as any).mockImplementation(() => ({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([mockUser]),
      }),
    }));
    
    (bcrypt.compare as any).mockResolvedValue(false);
    
    await expect(
      authResolver.login(
        'test@example.com',
        'wrongpassword',
        mockContext
      )
    ).rejects.toThrow('Invalid email or password');
    
    expect(createToken).not.toHaveBeenCalled();
    expect(setAuthCookie).not.toHaveBeenCalled();
  });
});
