/**
 * jest.config.js  –  Root Jest configuration for Stratify API tests
 *
 * Stack: Node.js + Express + Mongoose
 * Framework: Jest + Supertest
 */

/** @type {import('jest').Config} */
module.exports = {
  // Only pick up API test files
  testMatch: ['**/tests/api/**/*.test.js'],

  testEnvironment: 'node',

  // One connection; tests run sequentially to avoid port / DB conflicts
  maxWorkers: 1,
  testTimeout: 30_000,

  // Global lifecycle hooks
  globalSetup:    './tests/api/setup/globalSetup.js',
  globalTeardown: './tests/api/setup/globalTeardown.js',
  setupFilesAfterEnv: ['./tests/api/setup/setupEnv.js'],

  // Clean per-file module registry so mocks don't bleed between suites
  clearMocks:   true,
  resetMocks:   false,
  restoreMocks: true,

  // Coverage settings
  collectCoverage: false,   // set true when you want a coverage report
  collectCoverageFrom: [
    'backend/controllers/**/*.js',
    'backend/routes/**/*.js',
    '!backend/node_modules/**',
  ],
  coverageDirectory:  'tests/coverage',
  coverageReporters:  ['text', 'lcov', 'html'],

  // Pretty reporter + JSON output (used by the report generator)
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath:  './tests/reports',
        filename:    'jest-report.html',
        pageTitle:   'Stratify API Test Report',
        expand:      true,
      },
    ],
  ],

  // Transform: none needed – pure CommonJS
  transform: {},

  // Ensure mocks apply to the backend's copy of axios
  moduleNameMapper: {
    '^axios$': '<rootDir>/backend/node_modules/axios/dist/node/axios.cjs'
  }
};
