import { TestUtils } from '../test-utils';

describe('Theme Manager', () => {
  beforeEach(() => {
    TestUtils.cleanup();
    require('../../theme');
  });

  test('should initialize with system preference', () => {
    const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = document.documentElement.getAttribute('data-theme');
    expect(theme).toBe(darkMode ? 'dark' : 'light');
  });

  test('should toggle theme on button click', () => {
    const button = document.querySelector('.theme-toggle');
    const initialTheme = document.documentElement.getAttribute('data-theme');
    
    TestUtils.simulateClick(button);
    
    const newTheme = document.documentElement.getAttribute('data-theme');
    expect(newTheme).not.toBe(initialTheme);
  });

  test('should persist theme preference', () => {
    const button = document.querySelector('.theme-toggle');
    TestUtils.simulateClick(button);
    
    const theme = document.documentElement.getAttribute('data-theme');
    expect(localStorage.getItem('theme')).toBe(theme);
  });

  test('should respect system preference changes', () => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const event = new Event('change');
    Object.defineProperty(event, 'matches', { value: true });
    
    mediaQuery.dispatchEvent(event);
    
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
