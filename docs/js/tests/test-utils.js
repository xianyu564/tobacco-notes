// 测试工具函数
export class TestUtils {
  // DOM 操作辅助
  static createElement(html) {
    const div = document.createElement('div');
    div.innerHTML = html.trim();
    return div.firstChild;
  }

  static createEvent(type, props = {}) {
    const event = new Event(type, { bubbles: true });
    Object.assign(event, props);
    return event;
  }

  static simulateClick(element) {
    const event = this.createEvent('click');
    element.dispatchEvent(event);
  }

  static simulateKeyPress(element, key, modifiers = {}) {
    const event = this.createEvent('keydown', {
      key,
      ...modifiers
    });
    element.dispatchEvent(event);
  }

  static simulateInput(element, value) {
    element.value = value;
    const event = this.createEvent('input');
    element.dispatchEvent(event);
  }

  static simulateScroll(element, scrollTop) {
    element.scrollTop = scrollTop;
    const event = this.createEvent('scroll');
    element.dispatchEvent(event);
  }

  // 异步辅助
  static wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static async waitForElement(selector) {
    let element = document.querySelector(selector);
    if (element) return element;

    return new Promise(resolve => {
      const observer = new MutationObserver(() => {
        element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    });
  }

  // 网络请求模拟
  static mockFetch(response) {
    const originalFetch = window.fetch;
    window.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(response)
    });
    return () => window.fetch = originalFetch;
  }

  // 本地存储模拟
  static mockStorage() {
    const storage = {};
    const originalStorage = window.localStorage;

    window.localStorage = {
      getItem: jest.fn(key => storage[key]),
      setItem: jest.fn((key, value) => storage[key] = value),
      removeItem: jest.fn(key => delete storage[key]),
      clear: jest.fn(() => Object.keys(storage).forEach(key => delete storage[key])),
      length: Object.keys(storage).length,
      key: jest.fn(index => Object.keys(storage)[index])
    };

    return () => window.localStorage = originalStorage;
  }

  // 性能测试辅助
  static async measurePerformance(callback) {
    const start = performance.now();
    await callback();
    return performance.now() - start;
  }

  static async measureMemory(callback) {
    if (!performance.memory) return null;

    const before = performance.memory.usedJSHeapSize;
    await callback();
    const after = performance.memory.usedJSHeapSize;
    return after - before;
  }

  // 可访问性测试辅助
  static getComputedStyle(element, property) {
    return window.getComputedStyle(element).getPropertyValue(property);
  }

  static getAriaLabel(element) {
    return element.getAttribute('aria-label') ||
           element.getAttribute('aria-labelledby')?.split(' ')
             .map(id => document.getElementById(id)?.textContent)
             .filter(Boolean)
             .join(' ') ||
           element.title;
  }

  static isVisible(element) {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' &&
           style.visibility !== 'hidden' &&
           style.opacity !== '0';
  }

  static isFocusable(element) {
    const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    return element.matches(focusableElements) && this.isVisible(element);
  }

  // 响应式测试辅助
  static setViewport(width, height) {
    Object.defineProperty(window, 'innerWidth', { value: width });
    Object.defineProperty(window, 'innerHeight', { value: height });
    window.dispatchEvent(new Event('resize'));
  }

  // 主题测试辅助
  static setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  // 清理辅助
  static cleanup() {
    document.body.innerHTML = '';
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  }
}
