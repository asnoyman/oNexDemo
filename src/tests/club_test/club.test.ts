import { db } from '../../db/db';
import { clubs, clubMembers } from '../../db/schema';
import { Context } from '../../graphql/context';
import { Request, Response } from 'express';
import { UserPayload } from '../../middleware/auth';
import { ClubResolver } from '../../graphql/resolvers/ClubResolver';

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
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create mock user payload
    const mockUserPayload: UserPayload = {
      userId: 1,
      email: 'test@example.com'
    };
    
    // Create authenticated context
    authenticatedContext = {
      req: { user: mockUserPayload } as Request,
      res: {} as Response,
      user: mockUserPayload
    };
    
    // Create unauthenticated context
    unauthenticatedContext = {
      req: {} as Request,
      res: {} as Response
    };
    
    // Create admin context
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
      // Mock db.insert for clubs
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
      
      (db.insert as any).mockImplementation(() => ({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockClub]),
        }),
      }));
      
      // Mock db.insert for club members (to add creator as admin)
      const mockClubMember = {
        id: 1,
        clubId: 1,
        userId: 1,
        isAdmin: true,
        joinedAt: new Date()
      };
      
      // Second call to db.insert will be for club members
      (db.insert as any).mockImplementationOnce(() => ({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockClub]),
        }),
      })).mockImplementationOnce(() => ({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockClubMember]),
        }),
      }));
      
      // Call createClub method
      const result = await clubResolver.createClub(
        'Test Club',
        'A test club',
        false,
        authenticatedContext,
        'https://example.com/logo.jpg',
        'https://example.com/cover.jpg'
      );
      
      // Assertions
      expect(db.insert).toHaveBeenCalledWith(clubs);
      expect(db.insert).toHaveBeenCalledWith(clubMembers);
      expect(result).toEqual(mockClub);
    });
    
    it('should throw an error when user is not authenticated', async () => {
      // Call createClub method and expect it to throw
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
      
      // Verify db.insert was not called
      expect(db.insert).not.toHaveBeenCalled();
    });
  });
});
