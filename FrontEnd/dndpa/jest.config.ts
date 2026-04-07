export default {
    preset: 'ts-jest',
    testEnvironment: 'jest-environment-jsdom',
    setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
    moduleNameMapper: {
        '\\.(css|scss)$': 'identity-obj-proxy',
        '^./BASE_URL$': '<rootDir>/src/api/__mocks__/BASE_URL.ts',
        '^../api/BASE_URL$': '<rootDir>/src/api/__mocks__/BASE_URL.ts',
    },
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            tsconfig: {
                target: 'ES2022',
                lib: ['ES2022', 'DOM', 'DOM.Iterable'],
                module: 'CommonJS',
                skipLibCheck: true,
                esModuleInterop: true,
                moduleResolution: 'node',
                jsx: 'react-jsx',
                strict: true,
                verbatimModuleSyntax: false,
            },
        }],
    },
}