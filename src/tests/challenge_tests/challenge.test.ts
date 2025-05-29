import { db } from '../../db/db';
import { challenges, clubs, clubMembers } from '../../db/schema';
import { Context } from '../../graphql/context';
import { Request, Response } from 'express';
import { UserPayload } from '../../middleware/auth';
import { ChallengeResolver } from '../../graphql/resolvers/ChallengeResolver';
import { ChallengeDuration, ChallengeStatus } from '../../graphql/types/Challenge';

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

    // Create regular user context
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
      // Mock db.select to check if user is admin
      const mockFrom = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValue([
        { isAdmin: true } // User is admin
      ]);
      (db.select as jest.Mock).mockReturnValue({
        from: mockFrom,
        where: mockWhere
      });
      
      // Mock db.transaction to execute the callback with a transaction object
      const mockTx = {
        insert: jest.fn()
      };
      
      // Mock challenge data
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
      
      // Setup transaction mock to execute the callback and return the mockChallenge
      (db.transaction as jest.Mock).mockImplementation(async (callback) => {
        // Setup the insert for challenges
        mockTx.insert.mockImplementationOnce(() => ({
          values: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockChallenge])
          })
        }));
        
        // Execute the callback with our mock transaction
        return await callback(mockTx);
      });
      
      // Call createChallenge method
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
      
      // Assertions
      expect(mockFrom).toHaveBeenCalledWith(clubMembers);
      expect(db.transaction).toHaveBeenCalled();
      expect(mockTx.insert).toHaveBeenCalledWith(challenges);
      
      // Verify the result matches our expected challenge
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
      // Mock db.select to check if user is admin
      const mockFrom = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValue([]); // Empty array means user is not admin
      (db.select as jest.Mock).mockReturnValue({
        from: mockFrom,
        where: mockWhere
      });
      
      // Call createChallenge method and expect it to throw
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
      
      // Verify db.transaction was not called
      expect(db.transaction).not.toHaveBeenCalled();
    });
    
    it('should throw an error when user is not authenticated', async () => {
      // Call createChallenge method and expect it to throw
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
      
      // Verify db.select was not called
      expect(db.select).not.toHaveBeenCalled();
    });
  });

  describe('challenge', () => {
    it('should return a challenge by ID', async () => {
      // Mock challenge data
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
      
      // Mock db.select to return the challenge
      const mockFrom = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValue([mockChallenge]);
      (db.select as jest.Mock).mockReturnValue({
        from: mockFrom,
        where: mockWhere
      });
      
      // Call challenge method
      const result = await challengeResolver.challenge(1, authenticatedContext);
      
      // Assertions
      expect(mockFrom).toHaveBeenCalledWith(challenges);
      expect(result).toEqual(mockChallenge);
    });
    
    it('should return null if challenge not found', async () => {
      // Mock db.select to return empty array (challenge not found)
      const mockFrom = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValue([]);
      (db.select as jest.Mock).mockReturnValue({
        from: mockFrom,
        where: mockWhere
      });
      
      // Call challenge method
      const result = await challengeResolver.challenge(999, authenticatedContext);
      
      // Assertions
      expect(mockFrom).toHaveBeenCalledWith(challenges);
      expect(result).toBeNull();
    });
  });

  describe('clubChallenges', () => {
    it('should return all challenges for a club', async () => {
      // Mock challenges data
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
      
      // Mock db.select to return the challenges
      const mockFrom = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValue(mockChallenges);
      (db.select as jest.Mock).mockReturnValue({
        from: mockFrom,
        where: mockWhere
      });
      
      // Call clubChallenges method
      const result = await challengeResolver.clubChallenges(1, authenticatedContext);
      
      // Assertions
      expect(mockFrom).toHaveBeenCalledWith(challenges);
      expect(result).toEqual(mockChallenges);
      expect(result.length).toBe(2);
    });
  });

  describe('updateChallengeStatus', () => {
    it('should update challenge status when user is an admin of the club', async () => {
      // Mock challenge data
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
      
      // Mock first db.select to return the challenge
      const mockFrom1 = jest.fn().mockReturnThis();
      const mockWhere1 = jest.fn().mockResolvedValueOnce([mockChallenge]);
      (db.select as jest.Mock).mockReturnValueOnce({
        from: mockFrom1,
        where: mockWhere1
      });
      
      // Mock second db.select to check if user is admin
      const mockFrom2 = jest.fn().mockReturnThis();
      const mockWhere2 = jest.fn().mockResolvedValueOnce([
        { isAdmin: true } // User is admin
      ]);
      (db.select as jest.Mock).mockReturnValueOnce({
        from: mockFrom2,
        where: mockWhere2
      });
      
      // Mock db.update to update the challenge status
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
      
      // Call updateChallengeStatus method
      const result = await challengeResolver.updateChallengeStatus(
        1,
        ChallengeStatus.COMPLETED,
        adminContext
      );
      
      // Assertions
      expect(mockFrom1).toHaveBeenCalledWith(challenges);
      expect(mockFrom2).toHaveBeenCalledWith(clubMembers);
      expect(db.update).toHaveBeenCalledWith(challenges);
      expect(result.status).toBe('completed');
    });
    
    it('should throw an error when user is not an admin of the club', async () => {
      // Mock challenge data
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
      
      // Mock first db.select to return the challenge
      const mockFrom1 = jest.fn().mockReturnThis();
      const mockWhere1 = jest.fn().mockResolvedValueOnce([mockChallenge]);
      (db.select as jest.Mock).mockReturnValueOnce({
        from: mockFrom1,
        where: mockWhere1
      });
      
      // Mock second db.select to check if user is admin
      const mockFrom2 = jest.fn().mockReturnThis();
      const mockWhere2 = jest.fn().mockResolvedValueOnce([]); // Empty array means user is not admin
      (db.select as jest.Mock).mockReturnValueOnce({
        from: mockFrom2,
        where: mockWhere2
      });
      
      // Mock db.update to avoid "Cannot read properties of undefined (reading 'set')" error
      (db.update as jest.Mock).mockReturnValue({
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest.fn()
      });
      
      // Call updateChallengeStatus method and expect it to throw
      await expect(
        challengeResolver.updateChallengeStatus(
          1,
          ChallengeStatus.COMPLETED,
          regularUserContext
        )
      ).rejects.toThrow('Only club admins can update challenge status');
      
      // Verify db.update was not called
      expect(db.update).not.toHaveBeenCalled();
    });
    
    it('should throw an error when user is not authenticated', async () => {
      // Call updateChallengeStatus method and expect it to throw
      await expect(
        challengeResolver.updateChallengeStatus(
          1,
          ChallengeStatus.COMPLETED,
          unauthenticatedContext
        )
      ).rejects.toThrow('You must be logged in to update a challenge');
      
      // Verify db.select was not called
      expect(db.select).not.toHaveBeenCalled();
    });
  });
});
