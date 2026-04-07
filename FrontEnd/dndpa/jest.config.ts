export default {
    preset: 'ts-jest',
    testEnvironment: 'jest-environment-jsdom',
    setupFilesAfterFramework: ['<rootDir>/src/setupTests.ts'],
    moduleNameMapper: {
        '\\.(css|scss)$': 'identity-obj-proxy',
    },
}