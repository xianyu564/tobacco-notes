import { TestUtils } from '../test-utils';

describe('User Journey', () => {
  beforeEach(async () => {
    TestUtils.cleanup();
    await page.goto('http://localhost:3000');
  });

  test('should complete basic user journey', async () => {
    // 1. 浏览最新笔记
    await expect(page).toHaveSelector('#latest-list');
    const noteCount = await page.$$eval('#latest-list > li', items => items.length);
    expect(noteCount).toBeGreaterThan(0);

    // 2. 搜索笔记
    await page.type('#q', 'cigar');
    await page.waitForTimeout(300); // 等待搜索防抖
    const results = await page.$$('.search-result');
    expect(results.length).toBeGreaterThan(0);

    // 3. 切换主题
    const initialTheme = await page.$eval('html', el => el.getAttribute('data-theme'));
    await page.click('.theme-toggle');
    const newTheme = await page.$eval('html', el => el.getAttribute('data-theme'));
    expect(newTheme).not.toBe(initialTheme);

    // 4. 浏览分类
    await page.click('[href="#categories"]');
    await expect(page).toHaveSelector('#categories');
    const categoryBlocks = await page.$$('.category-block');
    expect(categoryBlocks.length).toBeGreaterThan(0);

    // 5. 查看模板
    await page.click('[href="#templates"]');
    await expect(page).toHaveSelector('#templates');
    const templateCards = await page.$$('.template-card');
    expect(templateCards.length).toBe(6);

    // 6. 复制笔记链接
    const copyButton = await page.$('.copy');
    await copyButton.click();
    const buttonText = await copyButton.textContent();
    expect(buttonText).toBe('已复制');

    // 7. 分享功能
    await page.click('.share-button');
    await expect(page).toHaveSelector('.share-menu');

    // 8. 加载更多
    const initialNotes = await page.$$('#latest-list > li');
    await page.click('.load-more');
    await page.waitForTimeout(100);
    const newNotes = await page.$$('#latest-list > li');
    expect(newNotes.length).toBeGreaterThan(initialNotes.length);

    // 9. 键盘导航
    await page.keyboard.press('Tab');
    const focusedElement = await page.$eval(':focus', el => el.tagName);
    expect(focusedElement).toBeTruthy();

    // 10. 响应式布局
    await page.setViewport({ width: 375, height: 667 });
    const isMobileMenuVisible = await page.$eval('.nav-menu', el => 
      window.getComputedStyle(el).display !== 'none'
    );
    expect(isMobileMenuVisible).toBe(true);
  });

  test('should handle offline state', async () => {
    await page.setOfflineMode(true);
    await page.reload();
    
    const offlineMessage = await page.$eval('.offline-notice', el => el.textContent);
    expect(offlineMessage).toContain('离线');
    
    // 应该显示缓存的内容
    const noteList = await page.$('#latest-list');
    expect(noteList).toBeTruthy();
  });

  test('should maintain state across navigation', async () => {
    // 1. 设置主题
    await page.click('.theme-toggle');
    const theme = await page.$eval('html', el => el.getAttribute('data-theme'));

    // 2. 执行搜索
    await page.type('#q', 'test');
    await page.waitForTimeout(300);

    // 3. 导航到其他页面
    await page.click('[href="#categories"]');
    await page.waitForTimeout(100);

    // 4. 返回
    await page.click('[href="#latest"]');
    
    // 验证状态保持
    const currentTheme = await page.$eval('html', el => el.getAttribute('data-theme'));
    expect(currentTheme).toBe(theme);
    
    const searchValue = await page.$eval('#q', input => input.value);
    expect(searchValue).toBe('test');
  });

  test('should handle errors gracefully', async () => {
    // 1. 模拟网络错误
    await page.setRequestInterception(true);
    page.on('request', request => {
      if (request.url().includes('/data/')) {
        request.abort();
      } else {
        request.continue();
      }
    });

    await page.reload();
    
    // 2. 验证错误提示
    const errorMessage = await page.$eval('.error-message', el => el.textContent);
    expect(errorMessage).toContain('加载失败');
    
    // 3. 验证重试功能
    const retryButton = await page.$('.retry-button');
    expect(retryButton).toBeTruthy();
  });
});
