import { db } from '../../db/db';
import { clubs, clubMembers, users, clubInvitations } from '../../db/schema';
import { Context } from '../../graphql/context';
import { Request, Response } from 'express';
import { UserPayload } from '../../middleware/auth';
import { eq, and } from 'drizzle-orm';
import { ClubMemberResolver } from '../../graphql/resolvers/ClubMemberResolver';
import { ClubInvitationResolver } from '../../graphql/resolvers/ClubInvitationResolver';

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

describe('Club Invitation Tests', () => {
  let clubMemberResolver: ClubMemberResolver;
  let clubInvitationResolver: ClubInvitationResolver;
  let authenticatedContext: Context;
  let unauthenticatedContext: Context;
  let adminContext: Context;
  
  beforeEach(() => {
    clubMemberResolver = new ClubMemberResolver();
    clubInvitationResolver = new ClubInvitationResolver();
    
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
    it('should throw an error when trying to join a private club without an invitation', async () => {
      (db.select as any).mockImplementationOnce(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ id: 1, isPrivate: true }]), // Club exists but is private
        }),
      }));
      
      (db.select as any).mockImplementationOnce(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]), // No invitation exists
        }),
      }));
      
      await expect(
        clubMemberResolver.joinClub(1, authenticatedContext)
      ).rejects.toThrow('You need an invitation to join this private club');
      
      expect(db.insert).not.toHaveBeenCalled();
    });
    
    it('should allow a user to join a private club with a valid invitation', async () => {
      (db.select as any).mockImplementationOnce(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ id: 1, isPrivate: true }]), // Club exists and is private
        }),
      }));
      
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
      
      (db.update as any).mockImplementation(() => ({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue({ rowCount: 1 }),
        }),
      }));
      
      const result = await clubMemberResolver.joinClub(1, authenticatedContext);
      
      expect(db.select).toHaveBeenCalledTimes(3); // Check club exists + check invitation + check membership
      expect(db.insert).toHaveBeenCalledWith(clubMembers);
      expect(db.update).toHaveBeenCalledWith(clubInvitations); // Should update invitation to accepted
      expect(result).toEqual(mockClubMember);
    });
  });
  
  describe('inviteToClub', () => {
    it('should allow an admin to invite a user to a private club', async () => {
      (db.select as any).mockImplementationOnce(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ isAdmin: true }]), // Is an admin
        }),
      }));
      
      (db.select as any).mockImplementationOnce(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ id: 1, isPrivate: true }]), // Club is private
        }),
      }));
      
      (db.select as any).mockImplementationOnce(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ id: 3 }]), // User exists
        }),
      }));
      
      (db.select as any).mockImplementationOnce(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]), // No invitation exists yet
        }),
      }));
      
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
      
      const result = await clubInvitationResolver.inviteToClub(
        1, 
        3, // Using userId instead of email
        adminContext
      );
      
      expect(db.select).toHaveBeenCalledTimes(4);
      expect(db.insert).toHaveBeenCalledWith(clubInvitations);
      expect(result).toEqual(mockInvitation);
    });
    
    it('should throw an error when invitation already exists', async () => {
      (db.select as any).mockImplementationOnce(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ isAdmin: true }]), // Is an admin
        }),
      }));
      
      (db.select as any).mockImplementationOnce(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ id: 1, isPrivate: true }]), // Club is private
        }),
      }));
      
      (db.select as any).mockImplementationOnce(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ id: 3 }]), // User exists
        }),
      }));
      
      (db.select as any).mockImplementationOnce(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ id: 1 }]), // Invitation already exists
        }),
      }));
      
      await expect(
        clubInvitationResolver.inviteToClub(1, 3, adminContext)
      ).rejects.toThrow('User has already been invited to this club');
      
      expect(db.insert).not.toHaveBeenCalled();
    });
  });
});
