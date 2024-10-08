/** @type import('jest').Config */
const config = {
  moduleNameMapper: {
    '(.+)\\.js': '$1'
  },
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { "useESM": true }]
  },
  extensionsToTreatAsEsm: [".ts"],
  coverageReporters: ['cobertura', 'json-summary', 'text-summary'],
  coveragePathIgnorePatterns: ['index.ts'],
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  reporters: [
    'default',
    [
      'jest-junit',
      { outputDirectory: 'results', outputName: 'test-results.xml' },
    ],
  ],
}

export default config
