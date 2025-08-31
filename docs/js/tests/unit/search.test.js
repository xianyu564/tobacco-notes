import { TestUtils } from '../test-utils';

describe('Search Manager', () => {
  let restoreFetch;

  beforeEach(() => {
    TestUtils.cleanup();
    restoreFetch = TestUtils.mockFetch([
      { title: 'Test Note 1', category: 'cigars', rating: '4/5', date: '2025-08-21' },
      { title: 'Test Note 2', category: 'pipe', rating: '90/100', date: '2025-08-20' }
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
    
    expect(dropdown.textContent).toContain('没有找到匹配的结果');
  });

  test('should navigate results with keyboard', async () => {
    const input = document.querySelector('#q');
    
    TestUtils.simulateInput(input, 'Test');
    await TestUtils.wait(300);
    
    TestUtils.simulateKeyPress(input, 'ArrowDown');
    const firstResult = document.querySelector('.search-result[aria-selected="true"]');
    expect(firstResult).toBeTruthy();
    
    TestUtils.simulateKeyPress(input, 'ArrowDown');
    const secondResult = document.querySelector('.search-result[aria-selected="true"]');
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

  test('should filter by category', async () => {
    const input = document.querySelector('#q');
    const categoryFilter = document.querySelector('#category-filter');
    const dropdown = document.querySelector('.search-dropdown');
    
    // 设置分类筛选器
    categoryFilter.value = 'cigars';
    TestUtils.simulateEvent(categoryFilter, 'change');
    
    TestUtils.simulateInput(input, 'Test');
    await TestUtils.wait(300);
    
    // 应该只显示符合分类的结果
    expect(dropdown.hidden).toBe(false);
    const results = dropdown.querySelectorAll('.search-result');
    expect(results.length).toBe(1);
    expect(results[0].textContent).toContain('cigars');
  });

  test('should filter by rating', async () => {
    const input = document.querySelector('#q');
    const ratingFilter = document.querySelector('#rating-filter');
    const dropdown = document.querySelector('.search-dropdown');
    
    // 设置评分筛选器为高分
    ratingFilter.value = 'high';
    TestUtils.simulateEvent(ratingFilter, 'change');
    
    TestUtils.simulateInput(input, 'Test');
    await TestUtils.wait(300);
    
    // 应该只显示高分结果
    expect(dropdown.hidden).toBe(false);
    const results = dropdown.querySelectorAll('.search-result');
    expect(results.length).toBeGreaterThan(0);
    // 验证结果包含评分信息
    expect(results[0].textContent).toMatch(/评分:/);
  });

  test('should clear all filters', async () => {
    const categoryFilter = document.querySelector('#category-filter');
    const ratingFilter = document.querySelector('#rating-filter');
    const clearButton = document.querySelector('#clear-filters');
    
    // 设置筛选器
    categoryFilter.value = 'cigars';
    ratingFilter.value = 'high';
    
    // 清除筛选器
    TestUtils.simulateEvent(clearButton, 'click');
    
    // 验证筛选器已重置
    expect(categoryFilter.value).toBe('');
    expect(ratingFilter.value).toBe('');
  });
});
