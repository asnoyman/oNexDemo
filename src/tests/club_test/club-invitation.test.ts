import { db } from '../../db/db';
import { clubs, clubMembers, users, clubInvitations } from '../../db/schema';
import { Context } from '../../graphql/context';
import { Request, Response } from 'express';
import { UserPayload } from '../../middleware/auth';
import { eq, and } from 'drizzle-orm';
import { ClubMemberResolver } from '../../graphql/resolvers/ClubMemberResolver';
import { ClubInvitationResolver } from '../../graphql/resolvers/ClubInvitationResolver';

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

describe('Club Invitation Tests', () => {
  let clubMemberResolver: ClubMemberResolver;
  let clubInvitationResolver: ClubInvitationResolver;
  let authenticatedContext: Context;
  let unauthenticatedContext: Context;
  let adminContext: Context;
  
  beforeEach(() => {
    clubMemberResolver = new ClubMemberResolver();
    clubInvitationResolver = new ClubInvitationResolver();
    
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
    it('should throw an error when trying to join a private club without an invitation', async () => {
      // Mock db.select to check if club exists
      (db.select as any).mockImplementationOnce(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ id: 1, isPrivate: true }]), // Club exists but is private
        }),
      }));
      
      // Mock db.select to check if user has an invitation
      (db.select as any).mockImplementationOnce(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]), // No invitation exists
        }),
      }));
      
      // Call joinClub method and expect it to throw
      await expect(
        clubMemberResolver.joinClub(1, authenticatedContext)
      ).rejects.toThrow('You need an invitation to join this private club');
      
      // Verify db.insert was not called
      expect(db.insert).not.toHaveBeenCalled();
    });
    
    it('should allow a user to join a private club with a valid invitation', async () => {
      // Mock db.select to check if club exists
      (db.select as any).mockImplementationOnce(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ id: 1, isPrivate: true }]), // Club exists and is private
        }),
      }));
      
      // Mock db.select to check if user has an invitation
      (db.select as any).mockImplementationOnce(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ 
            id: 1, 
            clubId: 1, 
            userId: 1, 
            invitedBy: 2, 
            accepted: false 
          }]), // Invitation exists
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
      
      // Mock db.update for invitation acceptance
      (db.update as any).mockImplementation(() => ({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue({ rowCount: 1 }),
        }),
      }));
      
      // Call joinClub method
      const result = await clubMemberResolver.joinClub(1, authenticatedContext);
      
      // Assertions
      expect(db.select).toHaveBeenCalledTimes(3); // Check club exists + check invitation + check membership
      expect(db.insert).toHaveBeenCalledWith(clubMembers);
      expect(db.update).toHaveBeenCalledWith(clubInvitations); // Should update invitation to accepted
      expect(result).toEqual(mockClubMember);
    });
  });
  
  describe('inviteToClub', () => {
    it('should allow an admin to invite a user to a private club', async () => {
      // Mock db.select to check if user is an admin
      (db.select as any).mockImplementationOnce(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ isAdmin: true }]), // Is an admin
        }),
      }));
      
      // Mock db.select to check if club is private
      (db.select as any).mockImplementationOnce(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ id: 1, isPrivate: true }]), // Club is private
        }),
      }));
      
      // Mock db.select to check if user exists
      (db.select as any).mockImplementationOnce(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ id: 3 }]), // User exists
        }),
      }));
      
      // Mock db.select to check if invitation already exists
      (db.select as any).mockImplementationOnce(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]), // No invitation exists yet
        }),
      }));
      
      // Mock db.insert for club invitation
      const mockInvitation = {
        id: 1,
        clubId: 1,
        userId: 3,
        invitedBy: 2,
        invitedAt: new Date(),
        accepted: false
      };
      
      (db.insert as any).mockImplementation(() => ({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockInvitation]),
        }),
      }));
      
      // Call inviteToClub method
      const result = await clubInvitationResolver.inviteToClub(
        1, 
        3, // Using userId instead of email
        adminContext
      );
      
      // Assertions
      expect(db.select).toHaveBeenCalledTimes(4);
      expect(db.insert).toHaveBeenCalledWith(clubInvitations);
      expect(result).toEqual(mockInvitation);
    });
    
    it('should throw an error when invitation already exists', async () => {
      // Mock db.select to check if user is an admin
      (db.select as any).mockImplementationOnce(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ isAdmin: true }]), // Is an admin
        }),
      }));
      
      // Mock db.select to check if club is private
      (db.select as any).mockImplementationOnce(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ id: 1, isPrivate: true }]), // Club is private
        }),
      }));
      
      // Mock db.select to check if user exists
      (db.select as any).mockImplementationOnce(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ id: 3 }]), // User exists
        }),
      }));
      
      // Mock db.select to check if invitation already exists
      (db.select as any).mockImplementationOnce(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ id: 1 }]), // Invitation already exists
        }),
      }));
      
      // Call inviteToClub method and expect it to throw
      await expect(
        clubInvitationResolver.inviteToClub(1, 3, adminContext)
      ).rejects.toThrow('User has already been invited to this club');
      
      // Verify db.insert was not called
      expect(db.insert).not.toHaveBeenCalled();
    });
  });
});
