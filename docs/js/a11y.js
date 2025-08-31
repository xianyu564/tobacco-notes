// 无障碍支持增强
class A11yManager {
  constructor() {
    this.init();
  }

  init() {
    this.initSkipLink();
    this.initFocusRing();
    this.initAriaLabels();
    this.initKeyboardNav();
    this.initAnnouncer();
    this.initColorContrast();
  }

  initSkipLink() {
    // 添加跳转到主要内容的链接
    const skipLink = document.createElement('a');
    skipLink.href = '#main';
    skipLink.className = 'skip-link';
    skipLink.textContent = '跳转到主要内容';
    document.body.insertBefore(skipLink, document.body.firstChild);

    // 确保主要内容区域可以获得焦点
    const main = document.querySelector('main');
    if (main) {
      main.id = 'main';
      main.tabIndex = -1;
    }
  }

  initFocusRing() {
    // 只在使用键盘时显示焦点轮廓
    document.body.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('using-keyboard');
      }
    });

    document.body.addEventListener('mousedown', () => {
      document.body.classList.remove('using-keyboard');
    });
  }

  initAriaLabels() {
    // 为交互元素添加 ARIA 标签
    document.querySelectorAll('button:not([aria-label])').forEach(btn => {
      if (!btn.textContent.trim()) {
        const action = btn.className.split(' ')
          .find(cls => cls.includes('btn-'))
          ?.replace('btn-', '')
          || '操作';
        btn.setAttribute('aria-label', action);
      }
    });

    // 为图片添加替代文本
    document.querySelectorAll('img:not([alt])').forEach(img => {
      const alt = img.getAttribute('src').split('/').pop().split('.')[0]
        .replace(/[-_]/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .trim();
      img.setAttribute('alt', alt);
    });

    // 为表单元素添加标签
    document.querySelectorAll('input:not([aria-label])').forEach(input => {
      const placeholder = input.getAttribute('placeholder');
      if (placeholder) {
        input.setAttribute('aria-label', placeholder);
      }
    });
  }

  initKeyboardNav() {
    // 实现键盘导航
    const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    
    document.addEventListener('keydown', (e) => {
      // ESC 关闭弹出层
      if (e.key === 'Escape') {
        const modal = document.querySelector('.modal.active');
        if (modal) {
          modal.classList.remove('active');
          return;
        }
      }

      // 回车键激活按钮和链接
      if (e.key === 'Enter') {
        const focused = document.activeElement;
        if (focused && focused.classList.contains('btn')) {
          focused.click();
          return;
        }
      }

      // 方向键导航
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const focused = document.activeElement;
        if (!focused) return;

        const focusable = Array.from(document.querySelectorAll(focusableElements))
          .filter(el => window.getComputedStyle(el).display !== 'none');
        
        const currentIndex = focusable.indexOf(focused);
        if (currentIndex === -1) return;

        let nextIndex;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          nextIndex = (currentIndex + 1) % focusable.length;
        } else {
          nextIndex = (currentIndex - 1 + focusable.length) % focusable.length;
        }

        focusable[nextIndex].focus();
        e.preventDefault();
      }
    });
  }

  initAnnouncer() {
    // 创建屏幕阅读器通知区域
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.className = 'sr-only';
    document.body.appendChild(announcer);

    // 提供通知方法
    window.announce = (message) => {
      announcer.textContent = message;
      setTimeout(() => {
        announcer.textContent = '';
      }, 3000);
    };

    // 监听动态内容变化
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length) {
          const added = Array.from(mutation.addedNodes)
            .filter(node => node.nodeType === 1)
            .map(node => node.textContent)
            .join(' ');
          if (added) {
            window.announce('新内容已加载: ' + added);
          }
        }
      });
    });

    observer.observe(document.querySelector('#latest-list'), {
      childList: true,
      subtree: true
    });
  }

  initColorContrast() {
    // 检查颜色对比度
    const checkContrast = (bg, fg) => {
      const getBrightness = (color) => {
        const rgb = color.match(/\d+/g);
        return (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
      };

      const bgBrightness = getBrightness(bg);
      const fgBrightness = getBrightness(fg);
      const contrast = Math.abs(bgBrightness - fgBrightness);

      return contrast > 125;
    };

    // 获取计算后的样式
    const getComputedColor = (el, prop) => {
      return window.getComputedStyle(el).getPropertyValue(prop);
    };

    // 检查文本元素
    document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, a, button, input').forEach(el => {
      const bg = getComputedColor(el, 'background-color');
      const fg = getComputedColor(el, 'color');

      if (!checkContrast(bg, fg)) {
        console.warn('Low contrast found:', el, { bg, fg });
      }
    });
  }

  // 辅助功能
  static isReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  static isForcedColors() {
    return window.matchMedia('(forced-colors: active)').matches;
  }

  static isHighContrast() {
    return window.matchMedia('(prefers-contrast: more)').matches;
  }
}

// 初始化无障碍管理器
document.addEventListener('DOMContentLoaded', () => {
  window.a11yManager = new A11yManager();
});
