module.exports = {
  preset: 'jest-expo',
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@react-native-async-storage/async-storage$': '<rootDir>/__mocks__/@react-native-async-storage/async-storage.ts',
  },
  testEnvironment: 'jsdom', // React Native + DOM エミュレート
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
