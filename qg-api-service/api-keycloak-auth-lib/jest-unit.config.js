/** @type import('jest').Config */
const config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  coverageReporters: ['cobertura', 'json-summary', 'text'],
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['src/index\\.ts'],
  reporters: [
    'default',
    [
      'jest-junit',
      { outputDirectory: 'results', outputName: 'test-results.xml' },
    ],
  ],
};

module.exports = config;
