// 无障碍验证管理器
class AccessibilityValidator {
  constructor() {
    this.violations = [];
    this.warnings = [];
    this.validationRules = new Map();
    this.init();
  }

  init() {
    this.setupValidationRules();
    this.bindEvents();
  }

  setupValidationRules() {
    // WCAG 2.1 AA 级别验证规则
    this.validationRules.set('alt-text', {
      selector: 'img',
      validate: (element) => {
        if (element.hasAttribute('alt')) {
          const alt = element.getAttribute('alt');
          // 装饰性图片可以有空alt
          if (alt === '') return true;
          // 有意义的图片需要描述性alt文本
          return alt.length > 0 && alt.length <= 125;
        }
        return false;
      },
      level: 'error',
      message: '图片缺少alt属性或alt文本不当'
    });

    this.validationRules.set('heading-hierarchy', {
      selector: 'h1, h2, h3, h4, h5, h6',
      validate: () => {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        let lastLevel = 0;
        
        for (const heading of headings) {
          const currentLevel = parseInt(heading.tagName.charAt(1));
          if (currentLevel > lastLevel + 1) {
            return false;
          }
          lastLevel = currentLevel;
        }
        return true;
      },
      level: 'error',
      message: '标题层级不连续'
    });

    this.validationRules.set('form-labels', {
      selector: 'input, select, textarea',
      validate: (element) => {
        // 检查是否有关联的label
        if (element.labels && element.labels.length > 0) return true;
        
        // 检查aria-label
        if (element.getAttribute('aria-label')) return true;
        
        // 检查aria-labelledby
        if (element.getAttribute('aria-labelledby')) {
          const labelledBy = element.getAttribute('aria-labelledby');
          return document.getElementById(labelledBy) !== null;
        }
        
        // 某些input类型可能不需要label
        const exemptTypes = ['hidden', 'submit', 'button', 'reset'];
        return exemptTypes.includes(element.type);
      },
      level: 'error',
      message: '表单元素缺少标签'
    });

    this.validationRules.set('color-contrast', {
      selector: '*',
      validate: (element) => {
        const style = window.getComputedStyle(element);
        const color = this.parseColor(style.color);
        const backgroundColor = this.parseColor(style.backgroundColor);
        
        if (!color || !backgroundColor || backgroundColor.a === 0) {
          return true; // 无法验证，跳过
        }
        
        const contrast = this.calculateContrast(color, backgroundColor);
        const fontSize = parseFloat(style.fontSize);
        const fontWeight = style.fontWeight;
        
        // WCAG AA标准：正常文本4.5:1，大文本3:1
        const isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || fontWeight >= 700));
        const minContrast = isLargeText ? 3 : 4.5;
        
        return contrast >= minContrast;
      },
      level: 'warning',
      message: '颜色对比度不足'
    });

    this.validationRules.set('focus-indicator', {
      selector: 'a, button, input, select, textarea, [tabindex]',
      validate: (element) => {
        // 检查是否有focus样式
        element.focus();
        const focusStyle = window.getComputedStyle(element, ':focus');
        element.blur();
        
        // 检查outline或其他focus指示器
        return focusStyle.outline !== 'none' || 
               focusStyle.boxShadow !== 'none' ||
               focusStyle.backgroundColor !== window.getComputedStyle(element).backgroundColor;
      },
      level: 'warning',
      message: '缺少焦点指示器'
    });

    this.validationRules.set('link-context', {
      selector: 'a',
      validate: (element) => {
        const text = element.textContent.trim();
        const ambiguousTexts = ['click here', 'read more', 'more', 'here', '点击这里', '更多', '这里'];
        
        if (ambiguousTexts.includes(text.toLowerCase())) {
          // 检查是否有aria-label或title提供上下文
          return element.getAttribute('aria-label') || element.getAttribute('title');
        }
        
        return text.length > 0;
      },
      level: 'warning',
      message: '链接文本缺乏上下文或过于模糊'
    });

    this.validationRules.set('skip-links', {
      selector: 'body',
      validate: () => {
        // 检查是否有跳转到主内容的链接
        const skipLink = document.querySelector('a[href^="#main"], a[href^="#content"], .skip-link');
        return skipLink !== null;
      },
      level: 'warning',
      message: '缺少跳转到主内容的链接'
    });

    this.validationRules.set('aria-roles', {
      selector: '[role]',
      validate: (element) => {
        const role = element.getAttribute('role');
        const validRoles = [
          'alert', 'alertdialog', 'application', 'article', 'banner', 'button', 
          'cell', 'checkbox', 'columnheader', 'combobox', 'command', 'complementary',
          'contentinfo', 'definition', 'dialog', 'directory', 'document', 'feed',
          'figure', 'form', 'grid', 'gridcell', 'group', 'heading', 'img', 'link',
          'list', 'listbox', 'listitem', 'log', 'main', 'marquee', 'math', 'menu',
          'menubar', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'navigation',
          'none', 'note', 'option', 'presentation', 'progressbar', 'radio',
          'radiogroup', 'region', 'row', 'rowgroup', 'rowheader', 'scrollbar',
          'search', 'searchbox', 'separator', 'slider', 'spinbutton', 'status',
          'switch', 'tab', 'table', 'tablist', 'tabpanel', 'term', 'textbox',
          'timer', 'toolbar', 'tooltip', 'tree', 'treegrid', 'treeitem'
        ];
        
        return validRoles.includes(role);
      },
      level: 'error',
      message: '使用了无效的ARIA role'
    });

    this.validationRules.set('keyboard-navigation', {
      selector: 'button, a, input, select, textarea, [tabindex]',
      validate: (element) => {
        // 检查tabindex值
        const tabindex = element.getAttribute('tabindex');
        if (tabindex !== null) {
          const tabValue = parseInt(tabindex);
          return tabValue >= -1; // -1是有效的（移除自然tab顺序）
        }
        return true;
      },
      level: 'warning',
      message: 'tabindex值可能影响键盘导航'
    });
  }

  bindEvents() {
    // 实时验证（可选）
    document.addEventListener('DOMContentLoaded', () => {
      this.validatePage();
    });

    // 动态内容变化时验证
    const observer = new MutationObserver(() => {
      this.validatePage();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['alt', 'aria-label', 'aria-labelledby', 'role', 'tabindex']
    });
  }

  validatePage() {
    this.violations = [];
    this.warnings = [];

    for (const [ruleName, rule] of this.validationRules) {
      if (ruleName === 'heading-hierarchy' || ruleName === 'skip-links') {
        // 全局验证
        if (!rule.validate()) {
          this.addIssue(rule.level, rule.message, null, ruleName);
        }
      } else {
        // 元素级验证
        const elements = document.querySelectorAll(rule.selector);
        elements.forEach(element => {
          if (!rule.validate(element)) {
            this.addIssue(rule.level, rule.message, element, ruleName);
          }
        });
      }
    }

    this.generateReport();
  }

  addIssue(level, message, element, ruleName) {
    const issue = {
      level,
      message,
      element,
      ruleName,
      xpath: element ? this.getXPath(element) : null,
      selector: element ? this.getSelector(element) : null
    };

    if (level === 'error') {
      this.violations.push(issue);
    } else {
      this.warnings.push(issue);
    }
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      violations: this.violations.length,
      warnings: this.warnings.length,
      score: this.calculateAccessibilityScore(),
      details: {
        violations: this.violations,
        warnings: this.warnings
      }
    };

    // 在控制台输出报告
    this.logReport(report);

    // 触发自定义事件
    document.dispatchEvent(new CustomEvent('accessibilityValidated', {
      detail: report
    }));

    return report;
  }

  calculateAccessibilityScore() {
    const totalIssues = this.violations.length + this.warnings.length;
    if (totalIssues === 0) return 100;

    // 错误权重更高
    const errorWeight = 10;
    const warningWeight = 3;
    const penalty = (this.violations.length * errorWeight) + (this.warnings.length * warningWeight);
    
    return Math.max(0, 100 - penalty);
  }

  logReport(report) {
    console.group('🔍 无障碍验证报告');
    console.log(`🎯 评分: ${report.score}/100`);
    console.log(`❌ 违规: ${report.violations}`);
    console.log(`⚠️ 警告: ${report.warnings}`);

    if (this.violations.length > 0) {
      console.group('❌ 严重问题');
      this.violations.forEach(violation => {
        console.error(`${violation.message}`, violation.element);
      });
      console.groupEnd();
    }

    if (this.warnings.length > 0) {
      console.group('⚠️ 需要改进');
      this.warnings.forEach(warning => {
        console.warn(`${warning.message}`, warning.element);
      });
      console.groupEnd();
    }

    console.groupEnd();
  }

  // 工具方法
  parseColor(colorStr) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = colorStr;
    ctx.fillRect(0, 0, 1, 1);
    const imageData = ctx.getImageData(0, 0, 1, 1).data;
    
    return {
      r: imageData[0],
      g: imageData[1],
      b: imageData[2],
      a: imageData[3] / 255
    };
  }

  calculateContrast(color1, color2) {
    const l1 = this.getLuminance(color1);
    const l2 = this.getLuminance(color2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  getLuminance(color) {
    const { r, g, b } = color;
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  getXPath(element) {
    if (element.id) {
      return `//*[@id="${element.id}"]`;
    }
    
    const path = [];
    while (element && element.nodeType === Node.ELEMENT_NODE) {
      let index = 1;
      let sibling = element.previousElementSibling;
      while (sibling) {
        if (sibling.tagName === element.tagName) index++;
        sibling = sibling.previousElementSibling;
      }
      path.unshift(`${element.tagName.toLowerCase()}[${index}]`);
      element = element.parentElement;
    }
    return '/' + path.join('/');
  }

  getSelector(element) {
    if (element.id) {
      return `#${element.id}`;
    }
    
    const path = [];
    while (element && element !== document.body) {
      let selector = element.tagName.toLowerCase();
      if (element.className) {
        selector += '.' + element.className.trim().split(/\s+/).join('.');
      }
      path.unshift(selector);
      element = element.parentElement;
    }
    return path.join(' > ');
  }

  // 公共API
  validateElement(element) {
    const issues = [];
    
    for (const [ruleName, rule] of this.validationRules) {
      if (element.matches(rule.selector)) {
        if (!rule.validate(element)) {
          issues.push({
            level: rule.level,
            message: rule.message,
            ruleName
          });
        }
      }
    }
    
    return issues;
  }

  getReport() {
    return {
      violations: this.violations,
      warnings: this.warnings,
      score: this.calculateAccessibilityScore()
    };
  }

  // 键盘导航测试
  testKeyboardNavigation() {
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const results = [];
    focusableElements.forEach((element, index) => {
      element.focus();
      const isFocused = document.activeElement === element;
      const hasVisibleFocus = this.hasVisibleFocus(element);
      
      results.push({
        element,
        index,
        canFocus: isFocused,
        hasVisibleFocus,
        tabIndex: element.tabIndex
      });
    });
    
    return results;
  }

  hasVisibleFocus(element) {
    const style = window.getComputedStyle(element, ':focus');
    return style.outline !== 'none' || 
           style.boxShadow !== 'none' ||
           style.backgroundColor !== window.getComputedStyle(element).backgroundColor;
  }

  // 屏幕阅读器测试模拟
  simulateScreenReader() {
    const content = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // 跳过隐藏元素
          if (node.nodeType === Node.ELEMENT_NODE) {
            const style = window.getComputedStyle(node);
            if (style.display === 'none' || style.visibility === 'hidden') {
              return NodeFilter.FILTER_REJECT;
            }
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    while (walker.nextNode()) {
      const node = walker.currentNode;
      
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.trim();
        if (text) content.push(text);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node;
        
        // 获取可访问的名称
        const accessibleName = this.getAccessibleName(element);
        if (accessibleName) {
          content.push(`${element.tagName}: ${accessibleName}`);
        }
      }
    }

    return content;
  }

  getAccessibleName(element) {
    // aria-label
    if (element.getAttribute('aria-label')) {
      return element.getAttribute('aria-label');
    }
    
    // aria-labelledby
    const labelledBy = element.getAttribute('aria-labelledby');
    if (labelledBy) {
      const labelElement = document.getElementById(labelledBy);
      if (labelElement) {
        return labelElement.textContent.trim();
      }
    }
    
    // 关联的label
    if (element.labels && element.labels.length > 0) {
      return element.labels[0].textContent.trim();
    }
    
    // alt属性（图片）
    if (element.hasAttribute('alt')) {
      return element.getAttribute('alt');
    }
    
    // title属性
    if (element.hasAttribute('title')) {
      return element.getAttribute('title');
    }
    
    return null;
  }
}

// 初始化无障碍验证器
document.addEventListener('DOMContentLoaded', () => {
  window.accessibilityValidator = new AccessibilityValidator();
});

// 导出供测试使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AccessibilityValidator;
}