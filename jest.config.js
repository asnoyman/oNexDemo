export default {
  testEnvironment: 'node',
  transform: {},
  verbose: true,
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  testPathIgnorePatterns: ['/node_modules/'],
  moduleNameMapper: {
    '^(\.{1,2}/.*)\.js$': '$1',
  },
};
