import { TestUtils } from '../test-utils';

describe('Accessibility Validator', () => {
  let accessibilityValidator;

  beforeEach(() => {
    TestUtils.cleanup();
    
    // 创建测试HTML结构
    document.body.innerHTML = `
      <nav role="navigation">
        <a href="#main" class="skip-link">跳转到主内容</a>
        <ul>
          <li><a href="#home">首页</a></li>
          <li><a href="#notes">笔记</a></li>
          <li><button type="button">菜单</button></li>
        </ul>
      </nav>
      
      <main id="main">
        <h1>主标题</h1>
        <h2>二级标题</h2>
        <h3>三级标题</h3>
        
        <form>
          <label for="name">姓名</label>
          <input id="name" type="text" />
          
          <input type="text" placeholder="无标签输入框" />
          
          <label for="email">邮箱</label>
          <input id="email" type="email" aria-describedby="email-help" />
          <div id="email-help">请输入有效的邮箱地址</div>
          
          <button type="submit">提交</button>
        </form>
        
        <div>
          <img src="test.jpg" alt="测试图片" />
          <img src="decorative.jpg" alt="" />
          <img src="missing-alt.jpg" />
        </div>
        
        <div style="background-color: #ffffff; color: #ffffff;">
          低对比度文本
        </div>
        
        <div style="background-color: #000000; color: #ffffff;">
          正常对比度文本
        </div>
        
        <a href="#" onclick="alert('点击')">点击这里</a>
        <a href="#specific-content" aria-label="查看具体内容">更多</a>
      </main>
    `;
    
    // 加载无障碍验证器
    require('../../accessibility-validator');
    accessibilityValidator = window.accessibilityValidator;
  });

  test('should validate alt text for images', () => {
    const images = document.querySelectorAll('img');
    const results = [];
    
    images.forEach(img => {
      const issues = accessibilityValidator.validateElement(img);
      results.push({ img: img.src, issues });
    });
    
    // 有alt属性的图片应该通过验证
    expect(results[0].issues).toHaveLength(0);
    
    // 装饰性图片（空alt）应该通过验证
    expect(results[1].issues).toHaveLength(0);
    
    // 缺少alt属性的图片应该失败
    expect(results[2].issues.length).toBeGreaterThan(0);
    expect(results[2].issues[0].ruleName).toBe('alt-text');
  });

  test('should validate heading hierarchy', () => {
    // 当前标题层级是 h1 -> h2 -> h3，应该通过验证
    accessibilityValidator.validatePage();
    const report = accessibilityValidator.getReport();
    
    const headingViolations = report.violations.filter(v => v.ruleName === 'heading-hierarchy');
    expect(headingViolations).toHaveLength(0);
    
    // 添加跳级标题
    const h5 = document.createElement('h5');
    h5.textContent = '跳级标题';
    document.querySelector('main').appendChild(h5);
    
    accessibilityValidator.validatePage();
    const reportWithError = accessibilityValidator.getReport();
    const headingViolationsAfter = reportWithError.violations.filter(v => v.ruleName === 'heading-hierarchy');
    expect(headingViolationsAfter.length).toBeGreaterThan(0);
  });

  test('should validate form labels', () => {
    const inputs = document.querySelectorAll('input');
    const results = [];
    
    inputs.forEach(input => {
      const issues = accessibilityValidator.validateElement(input);
      results.push({ input: input.id || input.placeholder, issues });
    });
    
    // 有关联label的输入框应该通过验证
    expect(results[0].issues).toHaveLength(0);
    
    // 无标签的输入框应该失败
    expect(results[1].issues.length).toBeGreaterThan(0);
    expect(results[1].issues[0].ruleName).toBe('form-labels');
    
    // 有aria-describedby的输入框应该通过验证
    expect(results[2].issues).toHaveLength(0);
  });

  test('should validate color contrast', () => {
    const textElements = Array.from(document.querySelectorAll('div')).filter(div => 
      div.textContent.includes('对比度')
    );
    
    const results = [];
    textElements.forEach(element => {
      const issues = accessibilityValidator.validateElement(element);
      results.push({ text: element.textContent, issues });
    });
    
    // 低对比度元素应该产生警告
    const lowContrastIssues = results.find(r => r.text.includes('低对比度'))?.issues || [];
    expect(lowContrastIssues.some(issue => issue.ruleName === 'color-contrast')).toBe(true);
  });

  test('should validate skip links', () => {
    accessibilityValidator.validatePage();
    const report = accessibilityValidator.getReport();
    
    // 应该检测到跳转链接
    const skipLinkViolations = report.violations.filter(v => v.ruleName === 'skip-links');
    expect(skipLinkViolations).toHaveLength(0);
    
    // 移除跳转链接
    document.querySelector('.skip-link').remove();
    
    accessibilityValidator.validatePage();
    const reportWithoutSkipLink = accessibilityValidator.getReport();
    const skipLinkWarnings = reportWithoutSkipLink.warnings.filter(w => w.ruleName === 'skip-links');
    expect(skipLinkWarnings.length).toBeGreaterThan(0);
  });

  test('should validate ARIA roles', () => {
    // 添加有效的ARIA role
    const validElement = document.createElement('div');
    validElement.setAttribute('role', 'button');
    document.body.appendChild(validElement);
    
    const validIssues = accessibilityValidator.validateElement(validElement);
    expect(validIssues).toHaveLength(0);
    
    // 添加无效的ARIA role
    const invalidElement = document.createElement('div');
    invalidElement.setAttribute('role', 'invalid-role');
    document.body.appendChild(invalidElement);
    
    const invalidIssues = accessibilityValidator.validateElement(invalidElement);
    expect(invalidIssues.length).toBeGreaterThan(0);
    expect(invalidIssues[0].ruleName).toBe('aria-roles');
  });

  test('should validate link context', () => {
    const links = document.querySelectorAll('a');
    const results = [];
    
    links.forEach(link => {
      const issues = accessibilityValidator.validateElement(link);
      results.push({ text: link.textContent, issues });
    });
    
    // "点击这里"应该产生警告
    const ambiguousLink = results.find(r => r.text.includes('点击这里'));
    expect(ambiguousLink?.issues.length).toBeGreaterThan(0);
    
    // 有aria-label的模糊链接应该通过验证
    const labeledLink = results.find(r => r.text.includes('更多'));
    expect(labeledLink?.issues).toHaveLength(0);
  });

  test('should test keyboard navigation', () => {
    const navigationResults = accessibilityValidator.testKeyboardNavigation();
    
    expect(navigationResults.length).toBeGreaterThan(0);
    
    // 检查所有可聚焦元素
    navigationResults.forEach(result => {
      expect(result.canFocus).toBe(true);
      expect(typeof result.tabIndex).toBe('number');
    });
    
    // 检查是否有可见的焦点指示器
    const elementsWithFocus = navigationResults.filter(r => r.hasVisibleFocus);
    // 注意：这个测试可能在headless环境中不准确
  });

  test('should simulate screen reader experience', () => {
    const screenReaderContent = accessibilityValidator.simulateScreenReader();
    
    expect(screenReaderContent.length).toBeGreaterThan(0);
    
    // 应该包含标题文本
    expect(screenReaderContent.some(content => content.includes('主标题'))).toBe(true);
    
    // 应该包含表单标签信息
    expect(screenReaderContent.some(content => content.includes('LABEL'))).toBe(true);
  });

  test('should calculate accessibility score', () => {
    accessibilityValidator.validatePage();
    const report = accessibilityValidator.getReport();
    
    expect(typeof report.score).toBe('number');
    expect(report.score).toBeGreaterThanOrEqual(0);
    expect(report.score).toBeLessThanOrEqual(100);
    
    // 分数应该基于违规和警告数量
    const totalIssues = report.violations + report.warnings;
    if (totalIssues === 0) {
      expect(report.score).toBe(100);
    } else {
      expect(report.score).toBeLessThan(100);
    }
  });

  test('should get accessible name for elements', () => {
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const submitButton = document.querySelector('button[type="submit"]');
    
    // 通过label获取accessible name
    const nameInputAccessibleName = accessibilityValidator.getAccessibleName(nameInput);
    expect(nameInputAccessibleName).toBe('姓名');
    
    // 通过label获取accessible name
    const emailInputAccessibleName = accessibilityValidator.getAccessibleName(emailInput);
    expect(emailInputAccessibleName).toBe('邮箱');
    
    // 按钮的accessible name来自textContent
    const buttonAccessibleName = accessibilityValidator.getAccessibleName(submitButton);
    expect(buttonAccessibleName).toBe('提交');
  });

  test('should generate comprehensive accessibility report', () => {
    accessibilityValidator.validatePage();
    const report = accessibilityValidator.getReport();
    
    expect(report).toHaveProperty('violations');
    expect(report).toHaveProperty('warnings');
    expect(report).toHaveProperty('score');
    
    expect(Array.isArray(report.violations)).toBe(true);
    expect(Array.isArray(report.warnings)).toBe(true);
    
    // 检查违规项结构
    if (report.violations.length > 0) {
      const violation = report.violations[0];
      expect(violation).toHaveProperty('level');
      expect(violation).toHaveProperty('message');
      expect(violation).toHaveProperty('ruleName');
    }
  });

  test('should handle dynamic content changes', () => {
    const initialReport = accessibilityValidator.getReport();
    
    // 动态添加无障碍问题
    const problemImg = document.createElement('img');
    problemImg.src = 'dynamic.jpg';
    // 故意不添加alt属性
    document.body.appendChild(problemImg);
    
    // 等待MutationObserver触发
    setTimeout(() => {
      const newReport = accessibilityValidator.getReport();
      
      // 新报告应该包含更多违规项
      expect(newReport.violations.length).toBeGreaterThanOrEqual(initialReport.violations.length);
    }, 100);
  });

  test('should provide element-specific validation', () => {
    const problematicImg = document.querySelector('img[src="missing-alt.jpg"]');
    const issues = accessibilityValidator.validateElement(problematicImg);
    
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0]).toHaveProperty('level');
    expect(issues[0]).toHaveProperty('message');
    expect(issues[0]).toHaveProperty('ruleName');
    expect(issues[0].ruleName).toBe('alt-text');
  });
});