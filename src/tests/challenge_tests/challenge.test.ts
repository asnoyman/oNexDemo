import { db } from '../../db/db';
import { challenges, clubs, clubMembers } from '../../db/schema';
import { Context } from '../../graphql/context';
import { Request, Response } from 'express';
import { UserPayload } from '../../middleware/auth';
import { ChallengeResolver } from '../../graphql/resolvers/ChallengeResolver';
import { ChallengeDuration, ChallengeStatus } from '../../graphql/types/Challenge';

declare const jest: any;
declare const describe: any;
declare const beforeEach: any;
declare const it: any;
declare const expect: any;

jest.mock('../../db/db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    transaction: jest.fn(),
  },
}));

describe('ChallengeResolver', () => {
  let challengeResolver: ChallengeResolver;
  let authenticatedContext: Context;
  let unauthenticatedContext: Context;
  let adminContext: Context;
  let regularUserContext: Context;
  
  beforeEach(() => {
    challengeResolver = new ChallengeResolver();
    
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

    const regularUserPayload: UserPayload = {
      userId: 3,
      email: 'regular@example.com'
    };
    
    regularUserContext = {
      req: { user: regularUserPayload } as Request,
      res: {} as Response,
      user: regularUserPayload
    };
  });
  
  describe('createChallenge', () => {
    it('should create a challenge successfully when user is an admin of the club', async () => {
      const mockFrom = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValue([
        { isAdmin: true } // User is admin
      ]);
      (db.select as jest.Mock).mockReturnValue({
        from: mockFrom,
        where: mockWhere
      });
      
      const mockTx = {
        insert: jest.fn()
      };
      
      const mockChallenge = {
        id: 1,
        clubId: 1,
        title: 'Test Challenge',
        description: 'A test challenge',
        duration: 'weekly',
        status: 'active',
        startDate: new Date('2025-06-01'),
        endDate: new Date('2025-06-07'),
        createdById: 2,
        scoreType: 'reps',
        scoreUnit: 'count',
        isHigherBetter: true,
        topScores: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      (db.transaction as jest.Mock).mockImplementation(async (callback) => {
        mockTx.insert.mockImplementationOnce(() => ({
          values: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockChallenge])
          })
        }));
        
        return await callback(mockTx);
      });
      
      const result = await challengeResolver.createChallenge(
        1, // clubId
        'Test Challenge',
        'A test challenge',
        ChallengeDuration.WEEKLY,
        new Date('2025-06-01'),
        new Date('2025-06-07'),
        'reps',
        true,
        adminContext,
        'count',
        ChallengeStatus.ACTIVE
      );
      
      expect(mockFrom).toHaveBeenCalledWith(clubMembers);
      expect(db.transaction).toHaveBeenCalled();
      expect(mockTx.insert).toHaveBeenCalledWith(challenges);
      
      expect(result).toEqual({
        id: 1,
        clubId: 1,
        title: 'Test Challenge',
        description: 'A test challenge',
        duration: 'weekly',
        status: 'active',
        startDate: expect.any(Date),
        endDate: expect.any(Date),
        createdById: 2,
        scoreType: 'reps',
        scoreUnit: 'count',
        isHigherBetter: true,
        topScores: [],
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });
    });
    
    it('should throw an error when user is not an admin of the club', async () => {
      const mockFrom = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValue([]); // Empty array means user is not admin
      (db.select as jest.Mock).mockReturnValue({
        from: mockFrom,
        where: mockWhere
      });
      
      await expect(
        challengeResolver.createChallenge(
          1, // clubId
          'Test Challenge',
          'A test challenge',
          ChallengeDuration.WEEKLY,
          new Date('2025-06-01'),
          new Date('2025-06-07'),
          'reps',
          true,
          regularUserContext,
          'count',
          ChallengeStatus.ACTIVE
        )
      ).rejects.toThrow('Only club admins can create challenges');
      
      expect(db.transaction).not.toHaveBeenCalled();
    });
    
    it('should throw an error when user is not authenticated', async () => {
      await expect(
        challengeResolver.createChallenge(
          1, // clubId
          'Test Challenge',
          'A test challenge',
          ChallengeDuration.WEEKLY,
          new Date('2025-06-01'),
          new Date('2025-06-07'),
          'reps',
          true,
          unauthenticatedContext,
          'count',
          ChallengeStatus.ACTIVE
        )
      ).rejects.toThrow('You must be logged in to create a challenge');
      
      expect(db.select).not.toHaveBeenCalled();
    });
  });

  describe('challenge', () => {
    it('should return a challenge by ID', async () => {
      const mockChallenge = {
        id: 1,
        clubId: 1,
        title: 'Test Challenge',
        description: 'A test challenge',
        duration: 'weekly',
        status: 'active',
        startDate: new Date('2025-06-01'),
        endDate: new Date('2025-06-07'),
        createdById: 2,
        scoreType: 'reps',
        scoreUnit: 'count',
        isHigherBetter: true,
        topScores: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const mockFrom = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValue([mockChallenge]);
      (db.select as jest.Mock).mockReturnValue({
        from: mockFrom,
        where: mockWhere
      });
      
      const result = await challengeResolver.challenge(1, authenticatedContext);
      
      expect(mockFrom).toHaveBeenCalledWith(challenges);
      expect(result).toEqual(mockChallenge);
    });
    
    it('should return null if challenge not found', async () => {
      const mockFrom = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValue([]);
      (db.select as jest.Mock).mockReturnValue({
        from: mockFrom,
        where: mockWhere
      });
      
      const result = await challengeResolver.challenge(999, authenticatedContext);
      
      expect(mockFrom).toHaveBeenCalledWith(challenges);
      expect(result).toBeNull();
    });
  });

  describe('clubChallenges', () => {
    it('should return all challenges for a club', async () => {
      const mockChallenges = [
        {
          id: 1,
          clubId: 1,
          title: 'Challenge 1',
          description: 'Description 1',
          duration: 'weekly',
          status: 'active',
          startDate: new Date('2025-06-01'),
          endDate: new Date('2025-06-07'),
          createdById: 2,
          scoreType: 'reps',
          scoreUnit: 'count',
          isHigherBetter: true,
          topScores: [],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          clubId: 1,
          title: 'Challenge 2',
          description: 'Description 2',
          duration: 'monthly',
          status: 'active',
          startDate: new Date('2025-06-01'),
          endDate: new Date('2025-06-30'),
          createdById: 2,
          scoreType: 'distance',
          scoreUnit: 'km',
          isHigherBetter: true,
          topScores: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      const mockFrom = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValue(mockChallenges);
      (db.select as jest.Mock).mockReturnValue({
        from: mockFrom,
        where: mockWhere
      });
      
      const result = await challengeResolver.clubChallenges(1, authenticatedContext);
      
      expect(mockFrom).toHaveBeenCalledWith(challenges);
      expect(result).toEqual(mockChallenges);
      expect(result.length).toBe(2);
    });
  });

  describe('updateChallengeStatus', () => {
    it('should update challenge status when user is an admin of the club', async () => {
      const mockChallenge = {
        id: 1,
        clubId: 1,
        title: 'Test Challenge',
        description: 'A test challenge',
        duration: 'weekly',
        status: 'active',
        startDate: new Date('2025-06-01'),
        endDate: new Date('2025-06-07'),
        createdById: 2,
        scoreType: 'reps',
        scoreUnit: 'count',
        isHigherBetter: true,
        topScores: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const mockFrom1 = jest.fn().mockReturnThis();
      const mockWhere1 = jest.fn().mockResolvedValueOnce([mockChallenge]);
      (db.select as jest.Mock).mockReturnValueOnce({
        from: mockFrom1,
        where: mockWhere1
      });
      
      const mockFrom2 = jest.fn().mockReturnThis();
      const mockWhere2 = jest.fn().mockResolvedValueOnce([
        { isAdmin: true } // User is admin
      ]);
      (db.select as jest.Mock).mockReturnValueOnce({
        from: mockFrom2,
        where: mockWhere2
      });
      
      (db.update as jest.Mock).mockImplementationOnce(() => ({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([{
              ...mockChallenge,
              status: 'completed',
              updatedAt: new Date()
            }])
          })
        })
      }));
      
      const result = await challengeResolver.updateChallengeStatus(
        1,
        ChallengeStatus.COMPLETED,
        adminContext
      );
      
      expect(mockFrom1).toHaveBeenCalledWith(challenges);
      expect(mockFrom2).toHaveBeenCalledWith(clubMembers);
      expect(db.update).toHaveBeenCalledWith(challenges);
      expect(result.status).toBe('completed');
    });
    
    it('should throw an error when user is not an admin of the club', async () => {
      const mockChallenge = {
        id: 1,
        clubId: 1,
        title: 'Test Challenge',
        description: 'A test challenge',
        duration: 'weekly',
        status: 'active',
        startDate: new Date('2025-06-01'),
        endDate: new Date('2025-06-07'),
        createdById: 2,
        scoreType: 'reps',
        scoreUnit: 'count',
        isHigherBetter: true,
        topScores: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const mockFrom1 = jest.fn().mockReturnThis();
      const mockWhere1 = jest.fn().mockResolvedValueOnce([mockChallenge]);
      (db.select as jest.Mock).mockReturnValueOnce({
        from: mockFrom1,
        where: mockWhere1
      });
      
      const mockFrom2 = jest.fn().mockReturnThis();
      const mockWhere2 = jest.fn().mockResolvedValueOnce([]); // Empty array means user is not admin
      (db.select as jest.Mock).mockReturnValueOnce({
        from: mockFrom2,
        where: mockWhere2
      });
      
      (db.update as jest.Mock).mockReturnValue({
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest.fn()
      });
      
      await expect(
        challengeResolver.updateChallengeStatus(
          1,
          ChallengeStatus.COMPLETED,
          regularUserContext
        )
      ).rejects.toThrow('Only club admins can update challenge status');
      
      expect(db.update).not.toHaveBeenCalled();
    });
    
    it('should throw an error when user is not authenticated', async () => {
      await expect(
        challengeResolver.updateChallengeStatus(
          1,
          ChallengeStatus.COMPLETED,
          unauthenticatedContext
        )
      ).rejects.toThrow('You must be logged in to update a challenge');
      
      expect(db.select).not.toHaveBeenCalled();
    });
  });
});
