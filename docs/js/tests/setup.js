// Jest 测试环境设置

// 添加自定义匹配器
expect.extend({
  toBeVisible(received) {
    const style = window.getComputedStyle(received);
    const isVisible = style.display !== 'none' &&
                     style.visibility !== 'hidden' &&
                     style.opacity !== '0';
    
    return {
      message: () =>
        `expected ${received} ${this.isNot ? 'not ' : ''}to be visible`,
      pass: isVisible
    };
  },
  
  toHaveAccessibleName(received) {
    const name = received.getAttribute('aria-label') ||
                 received.getAttribute('aria-labelledby') ||
                 received.title ||
                 received.textContent;
    
    return {
      message: () =>
        `expected ${received} ${this.isNot ? 'not ' : ''}to have accessible name`,
      pass: Boolean(name)
    };
  }
});

// 模拟浏览器 API
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
});

// 模拟 IntersectionObserver
class IntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  
  observe(element) {
    this.callback([{
      isIntersecting: true,
      target: element
    }]);
  }
  
  unobserve() {}
  disconnect() {}
}

window.IntersectionObserver = IntersectionObserver;

// 模拟 ResizeObserver
class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserver;

// 模拟 Performance API
const originalPerformance = window.performance;
window.performance = {
  ...originalPerformance,
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn().mockReturnValue([]),
  getEntriesByName: jest.fn().mockReturnValue([])
};

// 模拟 Web Animations API
Element.prototype.animate = jest.fn().mockReturnValue({
  finished: Promise.resolve(),
  cancel: jest.fn()
});

// 清理函数
afterEach(() => {
  // 清理 DOM
  document.body.innerHTML = '';
  
  // 清理 jest mocks
  jest.clearAllMocks();
  
  // 清理存储
  localStorage.clear();
  sessionStorage.clear();
  
  // 清理定时器
  jest.useRealTimers();
});

// 全局错误处理
window.addEventListener('error', event => {
  console.error('Uncaught error:', event.error);
});
