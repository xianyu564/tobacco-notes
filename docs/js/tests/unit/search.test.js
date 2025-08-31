import { TestUtils } from '../test-utils';

describe('Search Manager', () => {
  let restoreFetch;

  beforeEach(() => {
    TestUtils.cleanup();
    restoreFetch = TestUtils.mockFetch([
      { title: 'Test Note 1', category: 'cigars' },
      { title: 'Test Note 2', category: 'pipe' }
    ]);
    require('../../search');
  });

  afterEach(() => {
    restoreFetch();
  });

  test('should filter notes by search term', async () => {
    const input = document.querySelector('#q');
    const dropdown = document.querySelector('.search-dropdown');
    
    TestUtils.simulateInput(input, 'Test');
    await TestUtils.wait(300); // 等待防抖
    
    expect(dropdown.hidden).toBe(false);
    expect(dropdown.children.length).toBe(2);
  });

  test('should show no results message when no matches found', async () => {
    const input = document.querySelector('#q');
    const dropdown = document.querySelector('.search-dropdown');
    
    TestUtils.simulateInput(input, 'NonExistent');
    await TestUtils.wait(300);
    
    expect(dropdown.textContent).toContain('无匹配结果');
  });

  test('should navigate results with keyboard', async () => {
    const input = document.querySelector('#q');
    
    TestUtils.simulateInput(input, 'Test');
    await TestUtils.wait(300);
    
    TestUtils.simulateKeyPress(input, 'ArrowDown');
    const firstResult = document.querySelector('.search-result.active');
    expect(firstResult).toBeTruthy();
    
    TestUtils.simulateKeyPress(input, 'ArrowDown');
    const secondResult = document.querySelector('.search-result.active');
    expect(secondResult).not.toBe(firstResult);
  });

  test('should clear results when input is empty', async () => {
    const input = document.querySelector('#q');
    const dropdown = document.querySelector('.search-dropdown');
    
    TestUtils.simulateInput(input, 'Test');
    await TestUtils.wait(300);
    expect(dropdown.hidden).toBe(false);
    
    TestUtils.simulateInput(input, '');
    await TestUtils.wait(300);
    expect(dropdown.hidden).toBe(true);
  });
});
