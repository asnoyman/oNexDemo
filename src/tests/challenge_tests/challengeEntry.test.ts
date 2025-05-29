import { db } from '../../db/db';
import { challenges, challengeEntries, clubMembers, users } from '../../db/schema';
import { Context } from '../../graphql/context';
import { Request, Response } from 'express';
import { UserPayload } from '../../middleware/auth';
import { ChallengeEntryResolver } from '../../graphql/resolvers/ChallengeEntryResolver';

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

describe('ChallengeEntryResolver', () => {
  let challengeEntryResolver: ChallengeEntryResolver;
  let authenticatedContext: Context;
  let unauthenticatedContext: Context;
  
  beforeEach(() => {
    challengeEntryResolver = new ChallengeEntryResolver();
    
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
  });
  
  describe('submitChallengeEntry', () => {
    it('should submit a challenge entry successfully when user is authenticated and is a club member', async () => {
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
      const mockFrom1 = jest.fn().mockReturnThis();
      const mockWhere1 = jest.fn().mockResolvedValueOnce([mockChallenge]);
      (db.select as jest.Mock).mockReturnValueOnce({
        from: mockFrom1,
        where: mockWhere1
      });
      
      // Mock db.select to check if user is a club member
      const mockFrom2 = jest.fn().mockReturnThis();
      const mockWhere2 = jest.fn().mockResolvedValueOnce([{ id: 1 }]); // User is a member
      (db.select as jest.Mock).mockReturnValueOnce({
        from: mockFrom2,
        where: mockWhere2
      });
      
      // Mock challenge entry data
      const mockChallengeEntry = {
        id: 1,
        challengeId: 1,
        userId: 1,
        score: '42',
        notes: 'Test notes',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Mock db.transaction to execute the callback with a transaction object
      const mockTx = {
        insert: jest.fn(),
        update: jest.fn(),
        select: jest.fn()
      };
      
      // Setup transaction mock to execute the callback and return the mockChallengeEntry
      (db.transaction as jest.Mock).mockImplementation(async (callback) => {
        // Setup the insert for challenge entries
        mockTx.insert.mockImplementationOnce(() => ({
          values: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockChallengeEntry])
          })
        }));
        
        // Setup the select for user data
        mockTx.select.mockImplementationOnce(() => ({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue([{
            firstName: 'Test',
            lastName: 'User'
          }])
        }));
        
        // Setup the update for challenges (updating topScores)
        mockTx.update.mockImplementationOnce(() => ({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              returning: jest.fn().mockResolvedValue([{
                ...mockChallenge,
                topScores: [{
                  userId: 1,
                  userName: 'Test User',
                  score: '42',
                  achievedAt: expect.any(Date)
                }]
              }])
            })
          })
        }));
        
        // Execute the callback with our mock transaction
        return await callback(mockTx);
      });
      
      // Call submitChallengeEntry method
      const result = await challengeEntryResolver.submitChallengeEntry(
        1, // challengeId
        '42', // score
        'Test notes',
        authenticatedContext
      );
      
      // Assertions
      expect(mockFrom1).toHaveBeenCalledWith(challenges);
      expect(mockFrom2).toHaveBeenCalledWith(clubMembers);
      expect(db.transaction).toHaveBeenCalled();
      expect(mockTx.insert).toHaveBeenCalledWith(challengeEntries);
      expect(mockTx.update).toHaveBeenCalledWith(challenges);
      
      // Verify the result matches our expected challenge entry
      expect(result).toEqual({
        id: 1,
        challengeId: 1,
        userId: 1,
        score: '42',
        notes: 'Test notes',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });
    });
    
    it('should throw an error when user is not a club member', async () => {
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
      const mockFrom1 = jest.fn().mockReturnThis();
      const mockWhere1 = jest.fn().mockResolvedValueOnce([mockChallenge]);
      (db.select as jest.Mock).mockReturnValueOnce({
        from: mockFrom1,
        where: mockWhere1
      });
      
      // Mock db.select to check if user is a club member - return empty array (not a member)
      const mockFrom2 = jest.fn().mockReturnThis();
      const mockWhere2 = jest.fn().mockResolvedValueOnce([]);
      (db.select as jest.Mock).mockReturnValueOnce({
        from: mockFrom2,
        where: mockWhere2
      });
      
      // Call submitChallengeEntry method and expect it to throw
      await expect(
        challengeEntryResolver.submitChallengeEntry(
          1, // challengeId
          '42', // score
          'Test notes',
          authenticatedContext
        )
      ).rejects.toThrow('You must be a member of the club to submit a challenge entry');
      
      // Verify db.transaction was not called
      expect(db.transaction).not.toHaveBeenCalled();
    });
    
    it('should throw an error when user is not authenticated', async () => {
      // Call submitChallengeEntry method and expect it to throw
      await expect(
        challengeEntryResolver.submitChallengeEntry(
          1, // challengeId
          '42', // score
          'Test notes',
          unauthenticatedContext
        )
      ).rejects.toThrow('You must be logged in to submit a challenge entry');
      
      // Verify db.select was not called
      expect(db.select).not.toHaveBeenCalled();
    });
    
    it('should update topScores when the new score is better than existing scores', async () => {
      // Mock challenge data with existing top scores
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
        topScores: [
          {
            userId: 2,
            userName: 'User 2',
            score: '40',
            achievedAt: new Date()
          },
          {
            userId: 3,
            userName: 'User 3',
            score: '38',
            achievedAt: new Date()
          },
          {
            userId: 4,
            userName: 'User 4',
            score: '35',
            achievedAt: new Date()
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Mock db.select to return the challenge
      const mockFrom1 = jest.fn().mockReturnThis();
      const mockWhere1 = jest.fn().mockResolvedValueOnce([mockChallenge]);
      (db.select as jest.Mock).mockReturnValueOnce({
        from: mockFrom1,
        where: mockWhere1
      });
      
      // Mock db.select to check if user is a club member
      const mockFrom2 = jest.fn().mockReturnThis();
      const mockWhere2 = jest.fn().mockResolvedValueOnce([{ id: 1 }]); // User is a member
      (db.select as jest.Mock).mockReturnValueOnce({
        from: mockFrom2,
        where: mockWhere2
      });
      
      // Mock user data
      const mockUserData = {
        firstName: 'Test',
        lastName: 'User'
      };
      
      // Mock challenge entry data
      const mockChallengeEntry = {
        id: 1,
        challengeId: 1,
        userId: 1,
        score: '45', // Better than all existing scores
        notes: 'Test notes',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Mock db.transaction to execute the callback with a transaction object
      const mockTx = {
        insert: jest.fn(),
        update: jest.fn(),
        select: jest.fn()
      };
      
      // Setup transaction mock to execute the callback and return the mockChallengeEntry
      (db.transaction as jest.Mock).mockImplementation(async (callback) => {
        // Setup the insert for challenge entries
        mockTx.insert.mockImplementationOnce(() => ({
          values: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockChallengeEntry])
          })
        }));
        
        // Setup the select for user data
        mockTx.select.mockImplementationOnce(() => ({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue([mockUserData])
        }));
        
        // Setup the update for challenges (updating topScores)
        mockTx.update.mockImplementationOnce(() => ({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              returning: jest.fn().mockResolvedValue([{
                ...mockChallenge,
                topScores: [
                  {
                    userId: 1,
                    userName: 'Test User',
                    score: '45',
                    achievedAt: expect.any(Date)
                  },
                  ...mockChallenge.topScores
                ]
              }])
            })
          })
        }));
        
        // Execute the callback with our mock transaction
        return await callback(mockTx);
      });
      
      // Call submitChallengeEntry method
      const result = await challengeEntryResolver.submitChallengeEntry(
        1, // challengeId
        '45', // score
        'Test notes',
        authenticatedContext
      );
      
      // Assertions
      expect(mockFrom1).toHaveBeenCalledWith(challenges);
      expect(mockFrom2).toHaveBeenCalledWith(clubMembers);
      expect(db.transaction).toHaveBeenCalled();
      expect(mockTx.insert).toHaveBeenCalledWith(challengeEntries);
      expect(mockTx.update).toHaveBeenCalledWith(challenges);
      
      // Verify the result matches our expected challenge entry
      expect(result).toEqual(mockChallengeEntry);
    });
    
    it('should not update topScores when the new score is not better than existing scores', async () => {
      // Mock challenge data with existing top scores
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
        topScores: [
          {
            userId: 2,
            userName: 'User 2',
            score: '50',
            achievedAt: new Date()
          },
          {
            userId: 3,
            userName: 'User 3',
            score: '48',
            achievedAt: new Date()
          },
          {
            userId: 4,
            userName: 'User 4',
            score: '47',
            achievedAt: new Date()
          },
          {
            userId: 5,
            userName: 'User 5',
            score: '46',
            achievedAt: new Date()
          },
          {
            userId: 6,
            userName: 'User 6',
            score: '45',
            achievedAt: new Date()
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Mock db.select to return the challenge
      const mockFrom1 = jest.fn().mockReturnThis();
      const mockWhere1 = jest.fn().mockResolvedValueOnce([mockChallenge]);
      (db.select as jest.Mock).mockReturnValueOnce({
        from: mockFrom1,
        where: mockWhere1
      });
      
      // Mock db.select to check if user is a club member
      const mockFrom2 = jest.fn().mockReturnThis();
      const mockWhere2 = jest.fn().mockResolvedValueOnce([{ id: 1 }]); // User is a member
      (db.select as jest.Mock).mockReturnValueOnce({
        from: mockFrom2,
        where: mockWhere2
      });
      
      // Mock challenge entry data
      const mockChallengeEntry = {
        id: 1,
        challengeId: 1,
        userId: 1,
        score: '40', // Not better than existing scores
        notes: 'Test notes',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Mock db.transaction to execute the callback with a transaction object
      const mockTx = {
        insert: jest.fn(),
        update: jest.fn(),
        select: jest.fn()
      };
      
      // Setup transaction mock to execute the callback and return the mockChallengeEntry
      (db.transaction as jest.Mock).mockImplementation(async (callback) => {
        // Setup the insert for challenge entries
        mockTx.insert.mockImplementationOnce(() => ({
          values: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockChallengeEntry])
          })
        }));
        
        // Setup the select for user data
        mockTx.select.mockImplementationOnce(() => ({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue([{
            firstName: 'Test',
            lastName: 'User'
          }])
        }));
        
        // No update for challenges since topScores doesn't change
        
        // Execute the callback with our mock transaction
        return await callback(mockTx);
      });
      
      // Call submitChallengeEntry method
      const result = await challengeEntryResolver.submitChallengeEntry(
        1, // challengeId
        '40', // score
        'Test notes',
        authenticatedContext
      );
      
      // Assertions
      expect(mockFrom1).toHaveBeenCalledWith(challenges);
      expect(mockFrom2).toHaveBeenCalledWith(clubMembers);
      expect(db.transaction).toHaveBeenCalled();
      expect(mockTx.insert).toHaveBeenCalledWith(challengeEntries);
      expect(mockTx.update).not.toHaveBeenCalled(); // No update to topScores
      
      // Verify the result matches our expected challenge entry
      expect(result).toEqual(mockChallengeEntry);
    });
  });

  describe('challengeEntries', () => {
    it('should return all entries for a challenge', async () => {
      // Mock challenge entries data
      const mockChallengeEntries = [
        {
          id: 1,
          challengeId: 1,
          userId: 1,
          score: '42',
          notes: 'Notes 1',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          challengeId: 1,
          userId: 2,
          score: '45',
          notes: 'Notes 2',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      // Mock db.select to return the challenge entries
      const mockFrom = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValueOnce(mockChallengeEntries);
      (db.select as jest.Mock).mockReturnValueOnce({
        from: mockFrom,
        where: mockWhere
      });
      
      // Call challengeEntries method
      const result = await challengeEntryResolver.challengeEntries(1, authenticatedContext);
      
      // Assertions
      expect(mockFrom).toHaveBeenCalledWith(challengeEntries);
      expect(result).toEqual(mockChallengeEntries.map(entry => ({
        ...entry,
        notes: entry.notes || undefined
      })));
      expect(result.length).toBe(2);
    });
  });

  describe('userChallengeEntries', () => {
    it('should return user entries for a challenge when authenticated', async () => {
      // Mock challenge entries data
      const mockChallengeEntries = [
        {
          id: 1,
          challengeId: 1,
          userId: 1,
          score: '42',
          notes: 'Notes 1',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 3,
          challengeId: 1,
          userId: 1,
          score: '44',
          notes: 'Notes 3',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      // Mock db.select to return the challenge entries
      const mockFrom = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValueOnce(mockChallengeEntries);
      (db.select as jest.Mock).mockReturnValueOnce({
        from: mockFrom,
        where: mockWhere
      });
      
      // Call userChallengeEntries method
      const result = await challengeEntryResolver.userChallengeEntries(1, authenticatedContext);
      
      // Assertions
      expect(mockFrom).toHaveBeenCalledWith(challengeEntries);
      expect(result).toEqual(mockChallengeEntries.map(entry => ({
        ...entry,
        notes: entry.notes || undefined
      })));
      expect(result.length).toBe(2);
    });
    
    it('should throw an error when user is not authenticated', async () => {
      // Call userChallengeEntries method and expect it to throw
      await expect(
        challengeEntryResolver.userChallengeEntries(1, unauthenticatedContext)
      ).rejects.toThrow('You must be logged in to view your challenge entries');
      
      // Verify db.select was not called
      expect(db.select).not.toHaveBeenCalled();
    });
  });
  
  describe('updateChallengeEntry', () => {
    it('should update a challenge entry successfully when user is authenticated and owns the entry', async () => {
      // Mock challenge entry data
      const mockChallengeEntry = {
        id: 1,
        challengeId: 1,
        userId: 1,
        score: '42',
        notes: 'Original notes',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Mock db.select to return the challenge entry
      const mockFrom = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValueOnce([mockChallengeEntry]);
      (db.select as jest.Mock).mockReturnValueOnce({
        from: mockFrom,
        where: mockWhere
      });
      
      // Mock updated challenge entry
      const updatedEntry = {
        ...mockChallengeEntry,
        score: '45',
        notes: 'Updated notes',
        updatedAt: new Date()
      };
      
      // Mock db.update
      (db.update as jest.Mock).mockImplementationOnce(() => ({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedEntry])
          })
        })
      }));
      
      // Call updateChallengeEntry method
      const result = await challengeEntryResolver.updateChallengeEntry(
        1, // id
        '45', // updated score
        'Updated notes', // updated notes
        authenticatedContext
      );
      
      // Assertions
      expect(mockFrom).toHaveBeenCalledWith(challengeEntries);
      expect(db.update).toHaveBeenCalledWith(challengeEntries);
      
      // Verify the result matches our expected updated entry
      expect(result).toEqual({
        ...updatedEntry,
        notes: updatedEntry.notes || undefined,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });
    });
    
    it('should throw an error when user does not own the entry', async () => {
      // Mock challenge entry data (owned by user 2)
      const mockChallengeEntry = {
        id: 1,
        challengeId: 1,
        userId: 2, // Different from authenticated user (1)
        score: '42',
        notes: 'Original notes',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Mock db.select to return the challenge entry
      const mockFrom = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValueOnce([mockChallengeEntry]);
      (db.select as jest.Mock).mockReturnValueOnce({
        from: mockFrom,
        where: mockWhere
      });
      
      // Call updateChallengeEntry method and expect it to throw
      await expect(
        challengeEntryResolver.updateChallengeEntry(
          1, // id
          '45', // updated score
          'Updated notes', // updated notes
          authenticatedContext
        )
      ).rejects.toThrow('You can only update your own challenge entries');
      
      // Verify db.update was not called
      expect(db.update).not.toHaveBeenCalled();
    });
    
    it('should throw an error when user is not authenticated', async () => {
      // Call updateChallengeEntry method and expect it to throw
      await expect(
        challengeEntryResolver.updateChallengeEntry(
          1, // id
          '45', // updated score
          'Updated notes', // updated notes
          unauthenticatedContext
        )
      ).rejects.toThrow('You must be logged in to update a challenge entry');
      
      // Verify db.select was not called
      expect(db.select).not.toHaveBeenCalled();
    });
  });
});
