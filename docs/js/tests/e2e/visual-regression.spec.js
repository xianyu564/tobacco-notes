import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // 设置视口大小
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // 等待字体加载
    await page.addStyleTag({
      content: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
        * { font-family: 'Inter', sans-serif; }
      `
    });
  });

  test('homepage visual snapshot', async ({ page }) => {
    await page.goto('/');
    
    // 等待页面完全加载
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // 隐藏动态内容
    await page.addStyleTag({
      content: `
        .timestamp, .live-update, .dynamic-content { visibility: hidden !important; }
        * { animation-duration: 0s !important; transition-duration: 0s !important; }
      `
    });
    
    // 截取首页全屏截图
    await expect(page).toHaveScreenshot('homepage-full.png', {
      fullPage: true,
      threshold: 0.2
    });
    
    // 截取可视区域截图
    await expect(page).toHaveScreenshot('homepage-viewport.png', {
      threshold: 0.2
    });
  });

  test('note form visual snapshot', async ({ page }) => {
    await page.goto('/');
    
    // 导航到投稿表单
    await page.click('[href="#contribute"]');
    await page.waitForTimeout(500);
    
    // 截取表单截图
    const form = page.locator('#note-form');
    await expect(form).toHaveScreenshot('note-form.png', {
      threshold: 0.2
    });
    
    // 填写表单并截取填写状态
    await page.fill('#note-title', 'Visual Test Note');
    await page.selectOption('#note-category', 'cigars');
    await page.fill('#note-date', '2025-08-31');
    await page.fill('#note-rating', '8.5');
    await page.fill('#note-description', 'This is a test description for visual regression testing. It contains enough text to show how the form looks when filled out with realistic content.');
    
    await expect(form).toHaveScreenshot('note-form-filled.png', {
      threshold: 0.2
    });
  });

  test('note listing visual snapshot', async ({ page }) => {
    await page.goto('/');
    
    // 导航到最新笔记
    await page.click('[href="#latest"]');
    await page.waitForTimeout(500);
    
    // 截取笔记列表
    const notesList = page.locator('#latest-list, .notes-grid');
    await expect(notesList).toHaveScreenshot('notes-listing.png', {
      threshold: 0.2
    });
  });

  test('mobile viewport visual snapshot', async ({ page }) => {
    // 设置移动设备视口
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 隐藏动态内容
    await page.addStyleTag({
      content: `
        .timestamp, .live-update, .dynamic-content { visibility: hidden !important; }
        * { animation-duration: 0s !important; transition-duration: 0s !important; }
      `
    });
    
    // 移动设备首页截图
    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      fullPage: true,
      threshold: 0.2
    });
    
    // 测试移动菜单
    const menuButton = page.locator('.mobile-menu-toggle, .menu-toggle');
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await page.waitForTimeout(300);
      
      await expect(page).toHaveScreenshot('mobile-menu-open.png', {
        threshold: 0.2
      });
    }
  });

  test('theme variations visual snapshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 隐藏动态内容
    await page.addStyleTag({
      content: `
        .timestamp, .live-update, .dynamic-content { visibility: hidden !important; }
        * { animation-duration: 0s !important; transition-duration: 0s !important; }
      `
    });
    
    // 默认主题截图
    await expect(page).toHaveScreenshot('theme-default.png', {
      threshold: 0.2
    });
    
    // 切换到深色主题（如果有）
    const themeToggle = page.locator('.theme-toggle, .dark-mode-toggle');
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(300);
      
      await expect(page).toHaveScreenshot('theme-dark.png', {
        threshold: 0.2
      });
    }
  });

  test('error states visual snapshot', async ({ page }) => {
    await page.goto('/');
    
    // 导航到表单
    await page.click('[href="#contribute"]');
    await page.waitForTimeout(500);
    
    // 触发验证错误
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    
    // 截取错误状态
    const form = page.locator('#note-form');
    await expect(form).toHaveScreenshot('form-with-errors.png', {
      threshold: 0.2
    });
    
    // 截取单个字段错误
    const titleField = page.locator('#note-title');
    await expect(titleField.locator('..').first()).toHaveScreenshot('field-error-state.png', {
      threshold: 0.2
    });
  });

  test('loading states visual snapshot', async ({ page }) => {
    // 拦截网络请求以模拟加载状态
    await page.route('**/data/**', route => {
      setTimeout(() => route.continue(), 2000);
    });
    
    await page.goto('/');
    
    // 截取加载状态
    await expect(page.locator('.loading, .spinner, [aria-busy="true"]').first()).toHaveScreenshot('loading-state.png', {
      threshold: 0.2
    });
  });

  test('component variations visual snapshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 截取各种组件状态
    const components = [
      { selector: '.note-card', name: 'note-card' },
      { selector: '.category-block', name: 'category-block' },
      { selector: '.search-form', name: 'search-form' },
      { selector: '.navigation', name: 'navigation' },
      { selector: 'footer', name: 'footer' }
    ];
    
    for (const component of components) {
      const element = page.locator(component.selector).first();
      if (await element.isVisible()) {
        await expect(element).toHaveScreenshot(`${component.name}.png`, {
          threshold: 0.2
        });
      }
    }
  });

  test('responsive breakpoints visual snapshot', async ({ page }) => {
    const breakpoints = [
      { width: 320, height: 568, name: 'mobile-small' },
      { width: 375, height: 667, name: 'mobile-medium' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1024, height: 768, name: 'desktop-small' },
      { width: 1440, height: 900, name: 'desktop-large' }
    ];
    
    await page.goto('/');
    
    for (const breakpoint of breakpoints) {
      await page.setViewportSize({ 
        width: breakpoint.width, 
        height: breakpoint.height 
      });
      
      await page.waitForTimeout(500);
      
      // 隐藏动态内容
      await page.addStyleTag({
        content: `
          .timestamp, .live-update, .dynamic-content { visibility: hidden !important; }
          * { animation-duration: 0s !important; transition-duration: 0s !important; }
        `
      });
      
      await expect(page).toHaveScreenshot(`responsive-${breakpoint.name}.png`, {
        threshold: 0.2
      });
    }
  });

  test('accessibility focus states visual snapshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 测试焦点样式
    const focusableElements = [
      'a[href]:first-of-type',
      'button:first-of-type',
      'input:first-of-type',
      'select:first-of-type'
    ];
    
    for (const selector of focusableElements) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        await element.focus();
        await page.waitForTimeout(100);
        
        await expect(element).toHaveScreenshot(`focus-${selector.replace(/[^\w]/g, '-')}.png`, {
          threshold: 0.2
        });
      }
    }
  });

  test('print styles visual snapshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 模拟打印媒体查询
    await page.emulateMedia({ media: 'print' });
    
    // 隐藏动态内容
    await page.addStyleTag({
      content: `
        .timestamp, .live-update, .dynamic-content { visibility: hidden !important; }
        * { animation-duration: 0s !important; transition-duration: 0s !important; }
      `
    });
    
    await expect(page).toHaveScreenshot('print-view.png', {
      fullPage: true,
      threshold: 0.2
    });
  });
});

test.describe('Visual Accessibility Tests', () => {
  test('color contrast visual verification', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 添加高对比度样式验证
    await page.addStyleTag({
      content: `
        /* 高对比度测试样式 */
        .contrast-test {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 9999;
          background: white;
          display: none;
        }
        
        .contrast-test.active {
          display: flex;
          flex-direction: column;
          padding: 20px;
          gap: 10px;
        }
        
        .contrast-sample {
          padding: 10px;
          border: 1px solid #ccc;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
      `
    });
    
    // 创建对比度测试面板
    await page.evaluate(() => {
      const testPanel = document.createElement('div');
      testPanel.className = 'contrast-test active';
      
      const contrastTests = [
        { bg: '#ffffff', fg: '#000000', label: 'Black on White (21:1)' },
        { bg: '#000000', fg: '#ffffff', label: 'White on Black (21:1)' },
        { bg: '#ffffff', fg: '#757575', label: 'Gray on White (4.5:1)' },
        { bg: '#0066cc', fg: '#ffffff', label: 'White on Blue (4.5:1)' },
        { bg: '#dc3545', fg: '#ffffff', label: 'White on Red (5.4:1)' }
      ];
      
      contrastTests.forEach(test => {
        const sample = document.createElement('div');
        sample.className = 'contrast-sample';
        sample.style.backgroundColor = test.bg;
        sample.style.color = test.fg;
        sample.textContent = test.label;
        testPanel.appendChild(sample);
      });
      
      document.body.appendChild(testPanel);
    });
    
    await expect(page).toHaveScreenshot('color-contrast-samples.png', {
      threshold: 0.1
    });
  });

  test('accessibility annotations visual', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 添加无障碍注释
    await page.evaluate(() => {
      // 为所有表单元素添加标签注释
      document.querySelectorAll('input, select, textarea').forEach((element, index) => {
        if (element.labels?.length > 0 || element.getAttribute('aria-label')) {
          const annotation = document.createElement('div');
          annotation.textContent = '✓ Labeled';
          annotation.style.cssText = `
            position: absolute;
            background: green;
            color: white;
            padding: 2px 5px;
            font-size: 10px;
            z-index: 1000;
            border-radius: 3px;
            pointer-events: none;
          `;
          
          const rect = element.getBoundingClientRect();
          annotation.style.left = rect.right + 5 + 'px';
          annotation.style.top = rect.top + 'px';
          
          document.body.appendChild(annotation);
        } else {
          const annotation = document.createElement('div');
          annotation.textContent = '✗ No Label';
          annotation.style.cssText = `
            position: absolute;
            background: red;
            color: white;
            padding: 2px 5px;
            font-size: 10px;
            z-index: 1000;
            border-radius: 3px;
            pointer-events: none;
          `;
          
          const rect = element.getBoundingClientRect();
          annotation.style.left = rect.right + 5 + 'px';
          annotation.style.top = rect.top + 'px';
          
          document.body.appendChild(annotation);
        }
      });
      
      // 为图片添加alt文本注释
      document.querySelectorAll('img').forEach(img => {
        const hasAlt = img.hasAttribute('alt');
        const annotation = document.createElement('div');
        annotation.textContent = hasAlt ? '✓ Alt Text' : '✗ No Alt';
        annotation.style.cssText = `
          position: absolute;
          background: ${hasAlt ? 'green' : 'red'};
          color: white;
          padding: 2px 5px;
          font-size: 10px;
          z-index: 1000;
          border-radius: 3px;
          pointer-events: none;
        `;
        
        const rect = img.getBoundingClientRect();
        annotation.style.left = rect.left + 'px';
        annotation.style.top = rect.bottom + 5 + 'px';
        
        document.body.appendChild(annotation);
      });
    });
    
    await expect(page).toHaveScreenshot('accessibility-annotations.png', {
      fullPage: true,
      threshold: 0.2
    });
  });
});

test.describe('Performance Visual Tests', () => {
  test('loading performance visualization', async ({ page }) => {
    // 网络限制模拟
    await page.route('**/*', route => {
      const delay = Math.random() * 100 + 50; // 50-150ms 延迟
      setTimeout(() => route.continue(), delay);
    });
    
    await page.goto('/');
    
    // 创建加载时间可视化
    await page.evaluate(() => {
      const performanceData = performance.getEntriesByType('navigation')[0];
      const resources = performance.getEntriesByType('resource');
      
      // 创建性能可视化面板
      const panel = document.createElement('div');
      panel.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: white;
        z-index: 9999;
        padding: 20px;
        overflow-y: auto;
        font-family: monospace;
      `;
      
      let html = '<h2>Loading Performance Visualization</h2>';
      html += `<div>Total Load Time: ${Math.round(performanceData.loadEventEnd)}ms</div>`;
      html += `<div>DOM Content Loaded: ${Math.round(performanceData.domContentLoadedEventEnd)}ms</div>`;
      html += '<h3>Resource Loading Times:</h3>';
      
      resources.slice(0, 10).forEach(resource => {
        const duration = Math.round(resource.duration);
        const barWidth = Math.min(duration / 10, 300); // Scale bar width
        
        html += `
          <div style="margin: 5px 0;">
            <div>${resource.name.split('/').pop()}: ${duration}ms</div>
            <div style="height: 10px; background: #007bff; width: ${barWidth}px; margin: 2px 0;"></div>
          </div>
        `;
      });
      
      panel.innerHTML = html;
      document.body.appendChild(panel);
    });
    
    await expect(page).toHaveScreenshot('performance-visualization.png', {
      threshold: 0.2
    });
  });
});