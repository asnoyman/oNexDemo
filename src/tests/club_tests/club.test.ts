import { db } from '../../db/db';
import { clubs, clubMembers } from '../../db/schema';
import { Context } from '../../graphql/context';
import { Request, Response } from 'express';
import { UserPayload } from '../../middleware/auth';
import { ClubResolver } from '../../graphql/resolvers/ClubResolver';

declare const jest: any;
declare const describe: any;
declare const beforeEach: any;
declare const it: any;
declare const expect: any;

jest.mock('../../db/db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    delete: jest.fn(),
    transaction: jest.fn(),
  },
}));

describe('ClubResolver', () => {
  let clubResolver: ClubResolver;
  let authenticatedContext: Context;
  let unauthenticatedContext: Context;
  let adminContext: Context;
  
  beforeEach(() => {
    clubResolver = new ClubResolver();
    
    jest.clearAllMocks();
    
    const mockUserPayload: UserPayload = {
      userId: 1,
      email: 'test@example.com'
    };
    
    authenticatedContext = {
      req: { user: mockUserPayload } as Request,
      res: {} as Response,
      user: mockUserPayload
    };
    
    unauthenticatedContext = {
      req: {} as Request,
      res: {} as Response
    };
    
    const adminUserPayload: UserPayload = {
      userId: 2,
      email: 'admin@example.com'
    };
    
    adminContext = {
      req: { user: adminUserPayload } as Request,
      res: {} as Response,
      user: adminUserPayload
    };
  });
  
  describe('createClub', () => {
    it('should create a club successfully when user is authenticated', async () => {
      const mockTx = {
        insert: jest.fn()
      };
      
      const mockClub = {
        id: 1,
        name: 'Test Club',
        description: 'A test club',
        isPrivate: false,
        logoUrl: 'https://example.com/logo.jpg',
        coverImageUrl: 'https://example.com/cover.jpg',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const mockClubMember = {
        id: 1,
        clubId: 1,
        userId: 1,
        isAdmin: true,
        joinedAt: new Date()
      };
      
      (db.transaction as jest.Mock).mockImplementation(async (callback) => {
        mockTx.insert.mockImplementationOnce(() => ({
          values: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockClub])
          })
        }));
        
        mockTx.insert.mockImplementationOnce(() => ({
          values: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockClubMember])
          })
        }));
        
        return await callback(mockTx);
      });
      
      const result = await clubResolver.createClub(
        'Test Club',
        'A test club',
        false,
        authenticatedContext,
        'https://example.com/logo.jpg',
        'https://example.com/cover.jpg'
      );
      
      expect(db.transaction).toHaveBeenCalled();
      expect(mockTx.insert).toHaveBeenCalledTimes(2);
      expect(mockTx.insert).toHaveBeenNthCalledWith(1, clubs);
      expect(mockTx.insert).toHaveBeenNthCalledWith(2, clubMembers);
      
      expect(result).toEqual({
        id: 1,
        name: 'Test Club',
        description: 'A test club',
        isPrivate: false, // Match the input parameter
        logoUrl: 'https://example.com/logo.jpg',
        coverImageUrl: 'https://example.com/cover.jpg',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });
    });
    
    it('should throw an error when user is not authenticated', async () => {
      await expect(
        clubResolver.createClub(
          'Test Club',
          'A test club',
          false,
          unauthenticatedContext,
          'https://example.com/logo.jpg',
          'https://example.com/cover.jpg'
        )
      ).rejects.toThrow('You must be logged in to create a club');
      
      expect(db.insert).not.toHaveBeenCalled();
    });
  });
});
