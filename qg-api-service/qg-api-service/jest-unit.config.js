/** @type import('jest').Config */
const config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  coverageReporters: ['cobertura', 'json-summary', 'text-summary'],
  collectCoverageFrom: ['**/*.(t|j)s'],
  coveragePathIgnorePatterns: [
    '.dto.ts',
    '.enum.ts',
    '.entity.ts',
    '.error.ts',
    '.fixture.ts',
    '.module.ts',
  ],
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

module.exports = config
