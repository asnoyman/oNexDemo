import { db } from '../../db/db';
import { clubs, clubMembers, users, clubInvitations } from '../../db/schema';
import { Context } from '../../graphql/context';
import { Request, Response } from 'express';
import { UserPayload } from '../../middleware/auth';
import { eq, and } from 'drizzle-orm';
import { ClubMemberResolver } from '../../graphql/resolvers/ClubMemberResolver';

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
    update: jest.fn(),
  },
}));

describe('ClubMemberResolver', () => {
  let clubMemberResolver: ClubMemberResolver;
  let authenticatedContext: Context;
  let unauthenticatedContext: Context;
  let adminContext: Context;
  
  beforeEach(() => {
    clubMemberResolver = new ClubMemberResolver();
    
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
  
  describe('joinClub', () => {
    it('should allow a user to join a public club when authenticated', async () => {
      // Mock db.select to check if club exists
      (db.select as any).mockImplementationOnce(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ id: 1 }]), // Club exists
        }),
      }));
      
      // Mock db.select to check if user is already a member
      (db.select as any).mockImplementationOnce(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]), // Not a member yet
        }),
      }));
      
      // Mock db.insert for club members
      const mockClubMember = {
        id: 1,
        clubId: 1,
        userId: 1,
        isAdmin: false,
        joinedAt: new Date()
      };
      
      (db.insert as any).mockImplementation(() => ({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockClubMember]),
        }),
      }));
      
      // Call joinClub method
      const result = await clubMemberResolver.joinClub(1, authenticatedContext);
      
      // Assertions
      expect(db.select).toHaveBeenCalledTimes(2); // Check club exists + check membership
      expect(db.insert).toHaveBeenCalledWith(clubMembers);
      expect(result).toEqual(mockClubMember);
    });
    
    it('should throw an error when user is not authenticated', async () => {
      // Call joinClub method and expect it to throw
      await expect(
        clubMemberResolver.joinClub(1, unauthenticatedContext)
      ).rejects.toThrow('You must be logged in to join a club');
      
      // Verify db operations were not called
      expect(db.select).not.toHaveBeenCalled();
      expect(db.insert).not.toHaveBeenCalled();
    });
    
    it('should throw an error when club does not exist', async () => {
      // Mock db.select to check if club exists
      (db.select as any).mockImplementation(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]), // Club doesn't exist
        }),
      }));
      
      // Call joinClub method and expect it to throw
      await expect(
        clubMemberResolver.joinClub(999, authenticatedContext)
      ).rejects.toThrow('Club not found');
      
      // Verify second db.select and db.insert were not called
      expect(db.select).toHaveBeenCalledTimes(1); // Only the first check
      expect(db.insert).not.toHaveBeenCalled();
    });
    
    it('should throw an error when user is already a member', async () => {
      // Mock db.select to check if club exists
      (db.select as any).mockImplementationOnce(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ id: 1 }]), // Club exists
        }),
      }));
      
      // Mock db.select to check if user is already a member
      (db.select as any).mockImplementationOnce(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ id: 1 }]), // Already a member
        }),
      }));
      
      // Call joinClub method and expect it to throw
      await expect(
        clubMemberResolver.joinClub(1, authenticatedContext)
      ).rejects.toThrow('You are already a member of this club');
      
      // Verify db.insert was not called
      expect(db.insert).not.toHaveBeenCalled();
    });
  });
  
  describe('leaveClub', () => {
    it('should allow a user to leave a club when authenticated', async () => {
      // Mock db.select to check if user is a member
      (db.select as any).mockImplementation(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ id: 1 }]), // Is a member
        }),
      }));
      
      // Mock db.delete for removing membership
      (db.delete as any).mockImplementation(() => ({
        where: jest.fn().mockResolvedValue({ rowCount: 1 }), // 1 record deleted
      }));
      
      // Call leaveClub method
      const result = await clubMemberResolver.leaveClub(1, authenticatedContext);
      
      // Assertions
      expect(db.select).toHaveBeenCalled(); // Check membership
      expect(db.delete).toHaveBeenCalledWith(clubMembers);
      expect(result).toBe(true);
    });
    
    it('should throw an error when user is not authenticated', async () => {
      // Call leaveClub method and expect it to throw
      await expect(
        clubMemberResolver.leaveClub(1, unauthenticatedContext)
      ).rejects.toThrow('You must be logged in to leave a club');
      
      // Verify db operations were not called
      expect(db.select).not.toHaveBeenCalled();
      expect(db.delete).not.toHaveBeenCalled();
    });
    
    it('should throw an error when user is not a member of the club', async () => {
      // Mock db.select to check if user is a member
      (db.select as any).mockImplementation(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]), // Not a member
        }),
      }));
      
      // Call leaveClub method and expect it to throw
      await expect(
        clubMemberResolver.leaveClub(1, authenticatedContext)
      ).rejects.toThrow('You are not a member of this club');
      
      // Verify db.delete was not called
      expect(db.delete).not.toHaveBeenCalled();
    });
  });
  
  describe('getClubMembers', () => {
    it('should return all members of a club when authenticated', async () => {
      // Mock club members data
      const mockClubMembers = [
        {
          id: 1,
          userId: 1,
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          profilePictureUrl: 'https://example.com/profile1.jpg',
          isAdmin: true,
          joinedAt: new Date()
        },
        {
          id: 2,
          userId: 2,
          firstName: 'Another',
          lastName: 'User',
          email: 'another@example.com',
          profilePictureUrl: 'https://example.com/profile2.jpg',
          isAdmin: false,
          joinedAt: new Date()
        }
      ];
      
      // Mock db.select to check if club exists
      (db.select as any).mockImplementationOnce(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ id: 1 }]), // Club exists
        }),
      }));
      
      // Mock db.select to get club members
      (db.select as any).mockImplementationOnce(() => ({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(mockClubMembers),
          }),
        }),
      }));
      
      // Call getClubMembers method
      const result = await clubMemberResolver.getClubMembers(1, authenticatedContext);
      
      // Assertions
      expect(db.select).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockClubMembers);
    });
    
    it('should throw an error when user is not authenticated', async () => {
      // Call getClubMembers method and expect it to throw
      await expect(
        clubMemberResolver.getClubMembers(1, unauthenticatedContext)
      ).rejects.toThrow('You must be logged in to view club members');
      
      // Verify db operations were not called
      expect(db.select).not.toHaveBeenCalled();
    });
    
    it('should throw an error when club does not exist', async () => {
      // Mock db.select to check if club exists
      (db.select as any).mockImplementation(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]), // Club doesn't exist
        }),
      }));
      
      // Call getClubMembers method and expect it to throw
      await expect(
        clubMemberResolver.getClubMembers(999, authenticatedContext)
      ).rejects.toThrow('Club not found');
      
      // Verify second db.select was not called
      expect(db.select).toHaveBeenCalledTimes(1);
    });
  });
});
