import { db } from '../../db/db';
import { clubs, clubMembers, users, clubInvitations } from '../../db/schema';
import { Context } from '../../graphql/context';
import { Request, Response } from 'express';
import { UserPayload } from '../../middleware/auth';
import { eq, and } from 'drizzle-orm';
import { ClubMemberResolver } from '../../graphql/resolvers/ClubMemberResolver';

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
  
  describe('joinClub', () => {
    it('should allow a user to join a public club when authenticated', async () => {
      (db.select as any).mockImplementationOnce(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ id: 1 }]), // Club exists
        }),
      }));
      
      (db.select as any).mockImplementationOnce(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]), // Not a member yet
        }),
      }));
      
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
      
      const result = await clubMemberResolver.joinClub(1, authenticatedContext);
      
      expect(db.select).toHaveBeenCalledTimes(2); // Check club exists + check membership
      expect(db.insert).toHaveBeenCalledWith(clubMembers);
      expect(result).toEqual(mockClubMember);
    });
    
    it('should throw an error when user is not authenticated', async () => {
      await expect(
        clubMemberResolver.joinClub(1, unauthenticatedContext)
      ).rejects.toThrow('You must be logged in to join a club');
      
      expect(db.select).not.toHaveBeenCalled();
      expect(db.insert).not.toHaveBeenCalled();
    });
    
    it('should throw an error when club does not exist', async () => {
      (db.select as any).mockImplementation(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]), // Club doesn't exist
        }),
      }));
      
      await expect(
        clubMemberResolver.joinClub(999, authenticatedContext)
      ).rejects.toThrow('Club not found');
      
      expect(db.select).toHaveBeenCalledTimes(1); // Only the first check
      expect(db.insert).not.toHaveBeenCalled();
    });
    
    it('should throw an error when user is already a member', async () => {
      (db.select as any).mockImplementationOnce(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ id: 1 }]), // Club exists
        }),
      }));
      
      (db.select as any).mockImplementationOnce(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ id: 1 }]), // Already a member
        }),
      }));
      
      await expect(
        clubMemberResolver.joinClub(1, authenticatedContext)
      ).rejects.toThrow('You are already a member of this club');
      
      expect(db.insert).not.toHaveBeenCalled();
    });
  });
  
  describe('leaveClub', () => {
    it('should allow a user to leave a club when authenticated', async () => {
      (db.select as any).mockImplementation(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ id: 1 }]), // Is a member
        }),
      }));
      
      (db.delete as any).mockImplementation(() => ({
        where: jest.fn().mockResolvedValue({ rowCount: 1 }), // 1 record deleted
      }));
      
      const result = await clubMemberResolver.leaveClub(1, authenticatedContext);
      
      expect(db.select).toHaveBeenCalled(); // Check membership
      expect(db.delete).toHaveBeenCalledWith(clubMembers);
      expect(result).toBe(true);
    });
    
    it('should throw an error when user is not authenticated', async () => {
      await expect(
        clubMemberResolver.leaveClub(1, unauthenticatedContext)
      ).rejects.toThrow('You must be logged in to leave a club');
      
      expect(db.select).not.toHaveBeenCalled();
      expect(db.delete).not.toHaveBeenCalled();
    });
    
    it('should throw an error when user is not a member of the club', async () => {
      (db.select as any).mockImplementation(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]), // Not a member
        }),
      }));
      
      await expect(
        clubMemberResolver.leaveClub(1, authenticatedContext)
      ).rejects.toThrow('You are not a member of this club');
      
      expect(db.delete).not.toHaveBeenCalled();
    });
  });
  
  describe('getClubMembers', () => {
    it('should return all members of a club when authenticated', async () => {
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
      
      (db.select as any).mockImplementationOnce(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ id: 1 }]), // Club exists
        }),
      }));
      
      (db.select as any).mockImplementationOnce(() => ({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(mockClubMembers),
          }),
        }),
      }));
      
      const result = await clubMemberResolver.getClubMembers(1, authenticatedContext);
      
      expect(db.select).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockClubMembers);
    });
    
    it('should throw an error when user is not authenticated', async () => {
      await expect(
        clubMemberResolver.getClubMembers(1, unauthenticatedContext)
      ).rejects.toThrow('You must be logged in to view club members');
      
      expect(db.select).not.toHaveBeenCalled();
    });
    
    it('should throw an error when club does not exist', async () => {
      (db.select as any).mockImplementation(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]), // Club doesn't exist
        }),
      }));
      
      await expect(
        clubMemberResolver.getClubMembers(999, authenticatedContext)
      ).rejects.toThrow('Club not found');
      
      expect(db.select).toHaveBeenCalledTimes(1);
    });
  });
});
