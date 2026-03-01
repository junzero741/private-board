module.exports = {
  displayName: 'frontend',
  preset: '../../jest.preset.js',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'html'],
  coverageDirectory: '../../coverage/apps/frontend',
  moduleNameMapper: {
    '^@private-board/shared$': '<rootDir>/../../packages/shared/src/index.ts',
  },
};
