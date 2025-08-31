// 移动端体验增强
class MobileManager {
  constructor() {
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.isScrolling = false;
    this.activeMenu = null;
    
    this.init();
  }

  init() {
    this.initTouchEvents();
    this.initMobileMenu();
    this.initLazyImages();
    this.initPullToRefresh();
  }

  initTouchEvents() {
    // 处理触摸事件
    document.addEventListener('touchstart', (e) => {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
      this.isScrolling = false;
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
      if (this.isScrolling) return;

      const touchX = e.touches[0].clientX;
      const touchY = e.touches[0].clientY;
      const deltaX = touchX - this.touchStartX;
      const deltaY = touchY - this.touchStartY;

      // 判断是否为水平滑动
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // 处理水平滑动手势
        if (Math.abs(deltaX) > 50) {
          this.handleSwipe(deltaX > 0 ? 'right' : 'left');
          this.isScrolling = true;
        }
      }
    }, { passive: true });
  }

  initMobileMenu() {
    // 移动端菜单
    const menuBtn = document.querySelector('.nav-menu-btn');
    if (menuBtn) {
      menuBtn.addEventListener('click', () => {
        document.body.classList.toggle('menu-open');
      });
    }

    // 点击外部关闭菜单
    document.addEventListener('click', (e) => {
      if (document.body.classList.contains('menu-open') &&
          !e.target.closest('.nav-menu') &&
          !e.target.closest('.nav-menu-btn')) {
        document.body.classList.remove('menu-open');
      }
    });
  }

  initLazyImages() {
    // 图片懒加载
    if ('loading' in HTMLImageElement.prototype) {
      document.querySelectorAll('img[loading="lazy"]').forEach(img => {
        if (img.dataset.src) {
          img.src = img.dataset.src;
        }
      });
    } else {
      // 回退到 Intersection Observer
      const imageObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target;
              if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
              }
              observer.unobserve(img);
            }
          });
        },
        {
          rootMargin: '50px 0px',
          threshold: 0.01
        }
      );

      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }

  initPullToRefresh() {
    let touchStartY = 0;
    let touchEndY = 0;
    const minPullLength = 100;
    const container = document.querySelector('.container');
    
    if (!container) return;

    container.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
      touchEndY = e.touches[0].clientY;
      const pullLength = touchEndY - touchStartY;
      
      // 只在页面顶部下拉时触发刷新
      if (window.scrollY === 0 && pullLength > 0) {
        const progress = Math.min(pullLength / minPullLength, 1);
        this.updatePullToRefreshUI(progress);
      }
    }, { passive: true });

    container.addEventListener('touchend', () => {
      const pullLength = touchEndY - touchStartY;
      if (window.scrollY === 0 && pullLength > minPullLength) {
        this.refresh();
      } else {
        this.resetPullToRefreshUI();
      }
    });
  }

  updatePullToRefreshUI(progress) {
    const indicator = document.querySelector('.pull-to-refresh');
    if (!indicator) return;

    indicator.style.transform = `translateY(${progress * 50}px)`;
    indicator.style.opacity = progress;
  }

  resetPullToRefreshUI() {
    const indicator = document.querySelector('.pull-to-refresh');
    if (!indicator) return;

    indicator.style.transform = '';
    indicator.style.opacity = '0';
  }

  async refresh() {
    // 显示刷新动画
    this.showRefreshingUI();

    try {
      // 重新加载数据
      await window.notesManager?.init();
      // 重置 UI
      this.resetPullToRefreshUI();
    } catch (err) {
      console.error('Refresh failed:', err);
    }
  }

  showRefreshingUI() {
    const indicator = document.querySelector('.pull-to-refresh');
    if (!indicator) return;

    indicator.classList.add('refreshing');
    setTimeout(() => {
      indicator.classList.remove('refreshing');
    }, 1000);
  }

  handleSwipe(direction) {
    // 处理滑动手势
    const sections = ['latest', 'categories', 'templates', 'sponsor'];
    const currentSection = sections.find(id => {
      const el = document.getElementById(id);
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      return rect.top <= 100 && rect.bottom >= 100;
    });

    if (!currentSection) return;

    const currentIndex = sections.indexOf(currentSection);
    let targetIndex;

    if (direction === 'left') {
      targetIndex = Math.min(currentIndex + 1, sections.length - 1);
    } else {
      targetIndex = Math.max(currentIndex - 1, 0);
    }

    const targetSection = document.getElementById(sections[targetIndex]);
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // 性能优化
  optimizeForMobile() {
    // 减少动画
    if (window.matchMedia('(max-width: 768px)').matches) {
      document.body.classList.add('reduce-motion');
    }

    // 延迟加载非关键资源
    const deferredImages = document.querySelectorAll('img[data-defer]');
    const loadDeferredImages = () => {
      deferredImages.forEach(img => {
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-defer');
          img.removeAttribute('data-src');
        }
      });
    };

    // 在空闲时加载
    if ('requestIdleCallback' in window) {
      requestIdleCallback(loadDeferredImages);
    } else {
      setTimeout(loadDeferredImages, 1000);
    }

    // 使用 passive 事件监听器
    const passiveSupported = () => {
      let passive = false;
      try {
        const options = Object.defineProperty({}, 'passive', {
          get: () => passive = true
        });
        window.addEventListener('test', null, options);
        window.removeEventListener('test', null, options);
      } catch (err) {}
      return passive;
    };

    if (passiveSupported()) {
      document.addEventListener('touchstart', () => {}, { passive: true });
      document.addEventListener('touchmove', () => {}, { passive: true });
    }
  }
}

// 初始化移动端管理器
document.addEventListener('DOMContentLoaded', () => {
  window.mobileManager = new MobileManager();
  window.mobileManager.optimizeForMobile();
});
