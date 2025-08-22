// 性能优化管理器
class PerformanceManager {
  constructor() {
    this.metrics = {};
    this.observers = {};
    this.init();
  }

  init() {
    this.initMetrics();
    this.initPreload();
    this.initLazyLoad();
    this.initCache();
    this.initMonitoring();
  }

  initMetrics() {
    // 收集性能指标
    if ('performance' in window) {
      // 导航计时
      const navTiming = performance.getEntriesByType('navigation')[0];
      this.metrics.navigation = {
        dnsLookup: navTiming.domainLookupEnd - navTiming.domainLookupStart,
        tcpConnection: navTiming.connectEnd - navTiming.connectStart,
        serverResponse: navTiming.responseEnd - navTiming.requestStart,
        domComplete: navTiming.domComplete - navTiming.responseEnd,
        loadComplete: navTiming.loadEventEnd - navTiming.loadEventStart
      };

      // 资源计时
      const resources = performance.getEntriesByType('resource');
      this.metrics.resources = resources.map(resource => ({
        name: resource.name,
        type: resource.initiatorType,
        duration: resource.duration,
        size: resource.transferSize
      }));

      // Web Vitals
      if ('PerformanceObserver' in window) {
        // FID (First Input Delay)
        this.observers.fid = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          this.metrics.fid = entries[0].processingStart - entries[0].startTime;
        });
        this.observers.fid.observe({ entryTypes: ['first-input'] });

        // LCP (Largest Contentful Paint)
        this.observers.lcp = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          this.metrics.lcp = entries[entries.length - 1].startTime;
        });
        this.observers.lcp.observe({ entryTypes: ['largest-contentful-paint'] });

        // CLS (Cumulative Layout Shift)
        this.observers.cls = new PerformanceObserver((list) => {
          let clsValue = 0;
          list.getEntries().forEach(entry => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          this.metrics.cls = clsValue;
        });
        this.observers.cls.observe({ entryTypes: ['layout-shift'] });
      }
    }
  }

  initPreload() {
    // 预加载关键资源
    const preloadLinks = [
      { href: './styles.css', as: 'style' },
      { href: './js/theme.js', as: 'script' },
      { href: './js/search.js', as: 'script' },
      { href: './assets/favicon-32x32.png', as: 'image' }
    ];

    preloadLinks.forEach(link => {
      const preload = document.createElement('link');
      preload.rel = 'preload';
      preload.href = link.href;
      preload.as = link.as;
      document.head.appendChild(preload);
    });

    // DNS 预解析
    const preconnectLinks = [
      'https://api.github.com',
      'https://raw.githubusercontent.com'
    ];

    preconnectLinks.forEach(url => {
      const preconnect = document.createElement('link');
      preconnect.rel = 'preconnect';
      preconnect.href = url;
      document.head.appendChild(preconnect);
    });
  }

  initLazyLoad() {
    // 延迟加载非关键脚本
    const lazyScripts = [
      './js/animations.js',
      './js/mobile.js',
      './js/a11y.js'
    ];

    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };

    // 使用 Intersection Observer 延迟加载
    if ('IntersectionObserver' in window) {
      const lazyLoadObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const section = entry.target;
              const scripts = section.dataset.lazyScripts?.split(',') || [];
              
              scripts.forEach(async (src) => {
                try {
                  await loadScript(src);
                  console.log(`Lazy loaded: ${src}`);
                } catch (err) {
                  console.error(`Failed to load: ${src}`, err);
                }
              });

              observer.unobserve(section);
            }
          });
        },
        { threshold: 0.1 }
      );

      document.querySelectorAll('[data-lazy-scripts]').forEach(section => {
        lazyLoadObserver.observe(section);
      });
    } else {
      // 回退：在空闲时加载
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          lazyScripts.forEach(loadScript);
        });
      } else {
        // 最后的回退：延迟加载
        setTimeout(() => {
          lazyScripts.forEach(loadScript);
        }, 2000);
      }
    }
  }

  initCache() {
    // 缓存策略
    if ('caches' in window) {
      // 缓存静态资源
      const CACHE_NAME = 'tobacco-notes-v1';
      const CACHE_URLS = [
        './',
        './styles.css',
        './js/theme.js',
        './js/search.js',
        './assets/favicon-32x32.png'
      ];

      caches.open(CACHE_NAME).then(cache => {
        cache.addAll(CACHE_URLS);
      });

      // 清理旧缓存
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME)
            .map(name => caches.delete(name))
        );
      });
    }

    // 本地存储
    const storage = {
      set: (key, value, ttl = 3600) => {
        const item = {
          value,
          timestamp: Date.now(),
          ttl: ttl * 1000
        };
        localStorage.setItem(key, JSON.stringify(item));
      },

      get: (key) => {
        const item = localStorage.getItem(key);
        if (!item) return null;

        const { value, timestamp, ttl } = JSON.parse(item);
        if (Date.now() - timestamp > ttl) {
          localStorage.removeItem(key);
          return null;
        }

        return value;
      },

      clear: () => {
        localStorage.clear();
      }
    };

    // 导出存储接口
    window.storage = storage;
  }

  initMonitoring() {
    // 错误监控
    window.addEventListener('error', (event) => {
      console.error('Runtime error:', event.error);
      this.logMetric('error', {
        message: event.error.message,
        stack: event.error.stack,
        timestamp: Date.now()
      });
    });

    // 性能监控
    window.addEventListener('load', () => {
      // 记录关键指标
      setTimeout(() => {
        const metrics = {
          ...this.metrics,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          },
          connection: navigator.connection ? {
            type: navigator.connection.effectiveType,
            rtt: navigator.connection.rtt,
            downlink: navigator.connection.downlink
          } : null
        };

        this.logMetric('performance', metrics);
      }, 0);
    });
  }

  logMetric(type, data) {
    // 这里可以实现具体的日志记录逻辑
    // 例如发送到分析服务器或保存到本地存储
    console.log(`[${type}]`, data);
  }

  // 性能优化工具方法
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  static throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}

// 初始化性能管理器
document.addEventListener('DOMContentLoaded', () => {
  window.performanceManager = new PerformanceManager();
});
