module.exports = {
  testEnvironment: 'node',
  setupFiles: ['./tests/env-setup.js'],
  setupFilesAfterEnv: ['./tests/setup.js'],
  testMatch: ['**/tests/**/*.test.js'],
  clearMocks: true,
  maxWorkers: 1, // Equivalent to --runInBand for serial execution
  testTimeout: 30000,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'controllers/**/*.js',
    'middleware/**/*.js',
    'services/**/*.js'
  ]
};
