module.exports = {
  // 测试环境
  testEnvironment: 'jsdom',
  
  // 测试文件匹配
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  
  // 覆盖率收集
  collectCoverage: true,
  collectCoverageFrom: [
    'js/**/*.js',
    '!js/tests/**'
  ],
  coverageReporters: ['text', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // 模块转换
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // 模块解析
  moduleNameMapper: {
    '\\.(css|less|scss)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/tests/__mocks__/fileMock.js'
  },
  
  // 测试设置
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js'
  ],
  
  // 性能测试配置
  testTimeout: 10000,
  maxWorkers: '50%',
  
  // 报告配置
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'reports/junit',
      outputName: 'js-test-results.xml'
    }]
  ],
  
  // 快照配置
  snapshotSerializers: [
    'jest-serializer-html'
  ],
  
  // 全局变量
  globals: {
    __DEV__: true
  }
};
