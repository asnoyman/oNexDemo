import { userResolvers } from '../graphql/resolvers/user.js';

// Test suite for the authStatus resolver
describe('Authentication Status Resolver', () => {
  // Test when user is authenticated
  test('should return authenticated when user is in context', () => {
    // Mock user
    const mockUser = {
      id: 'test-id',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User'
    };
    
    // Mock context with user
    const context = {
      user: mockUser
    };
    
    // Call resolver directly
    const result = userResolvers.Query.authStatus(null, {}, context);
    
    // Verify result
    expect(result.isAuthenticated).toBe(true);
    expect(result.user).toBe(mockUser);
  });
  
  // Test when user is not authenticated
  test('should return not authenticated when user is not in context', () => {
    // Mock context without user
    const context = {};
    
    // Call resolver directly
    const result = userResolvers.Query.authStatus(null, {}, context);
    
    // Verify result
    expect(result.isAuthenticated).toBe(false);
    expect(result.user).toBeNull();
  });
});
