// 性能优化管理器
class PerformanceManager {
  constructor() {
    this.metrics = {};
    this.observers = {};
    this.cache = new Map();
    this.loadStartTime = performance.now();
    this.validationThresholds = {
      lcp: 2500,        // Largest Contentful Paint
      fid: 100,         // First Input Delay
      cls: 0.1,         // Cumulative Layout Shift
      fcp: 1800,        // First Contentful Paint
      ttfb: 800,        // Time to First Byte
      memoryUsage: 50,  // MB
      bundleSize: 500,  // KB
      imageSize: 200    // KB per image
    };
    this.validationResults = [];
    this.init();
  }

  init() {
    this.initMetrics();
    this.initPreload();
    this.initLazyLoad();
    this.initCache();
    this.initMonitoring();
    this.initPerformanceValidation();
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

  initPerformanceValidation() {
    // 初始化性能验证
    this.performanceValidation = {
      checkWebVitals: () => this.validateWebVitals(),
      checkResourceSizes: () => this.validateResourceSizes(),
      checkMemoryUsage: () => this.validateMemoryUsage(),
      checkNetworkEfficiency: () => this.validateNetworkEfficiency(),
      generateReport: () => this.generatePerformanceReport()
    };

    // 页面加载完成后进行验证
    window.addEventListener('load', () => {
      setTimeout(() => this.runPerformanceValidation(), 2000);
    });
  }

  runPerformanceValidation() {
    console.log('🚀 开始性能验证...');
    
    this.validationResults = [];
    
    // 运行所有验证
    this.validateWebVitals();
    this.validateResourceSizes();
    this.validateMemoryUsage();
    this.validateNetworkEfficiency();
    
    // 生成报告
    const report = this.generatePerformanceReport();
    
    // 触发性能验证完成事件
    document.dispatchEvent(new CustomEvent('performanceValidated', {
      detail: report
    }));
    
    return report;
  }

  validateWebVitals() {
    const results = [];
    
    // LCP 验证
    if (this.metrics.lcp !== undefined) {
      const isValid = this.metrics.lcp <= this.validationThresholds.lcp;
      results.push({
        metric: 'LCP',
        value: this.metrics.lcp,
        threshold: this.validationThresholds.lcp,
        status: isValid ? 'pass' : 'fail',
        message: isValid ? 
          `LCP 优秀 (${Math.round(this.metrics.lcp)}ms)` : 
          `LCP 需要优化 (${Math.round(this.metrics.lcp)}ms, 应 < ${this.validationThresholds.lcp}ms)`
      });
    }
    
    // FID 验证
    if (this.metrics.fid !== undefined) {
      const isValid = this.metrics.fid <= this.validationThresholds.fid;
      results.push({
        metric: 'FID',
        value: this.metrics.fid,
        threshold: this.validationThresholds.fid,
        status: isValid ? 'pass' : 'fail',
        message: isValid ? 
          `FID 优秀 (${Math.round(this.metrics.fid)}ms)` : 
          `FID 需要优化 (${Math.round(this.metrics.fid)}ms, 应 < ${this.validationThresholds.fid}ms)`
      });
    }
    
    // CLS 验证
    if (this.metrics.cls !== undefined) {
      const isValid = this.metrics.cls <= this.validationThresholds.cls;
      results.push({
        metric: 'CLS',
        value: this.metrics.cls,
        threshold: this.validationThresholds.cls,
        status: isValid ? 'pass' : 'fail',
        message: isValid ? 
          `CLS 优秀 (${this.metrics.cls.toFixed(3)})` : 
          `CLS 需要优化 (${this.metrics.cls.toFixed(3)}, 应 < ${this.validationThresholds.cls})`
      });
    }
    
    this.validationResults.push(...results);
    return results;
  }

  validateResourceSizes() {
    const results = [];
    const resources = performance.getEntriesByType('resource');
    
    // 验证单个资源大小
    resources.forEach(resource => {
      if (resource.transferSize) {
        const sizeKB = resource.transferSize / 1024;
        
        // 检查图片大小
        if (resource.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          const isValid = sizeKB <= this.validationThresholds.imageSize;
          if (!isValid) {
            results.push({
              metric: 'Image Size',
              resource: resource.name,
              value: sizeKB,
              threshold: this.validationThresholds.imageSize,
              status: 'warning',
              message: `图片文件较大: ${Math.round(sizeKB)}KB (建议 < ${this.validationThresholds.imageSize}KB)`
            });
          }
        }
        
        // 检查JavaScript文件大小
        if (resource.name.match(/\.js$/i) && sizeKB > 100) {
          results.push({
            metric: 'JS Bundle Size',
            resource: resource.name,
            value: sizeKB,
            threshold: 100,
            status: 'warning',
            message: `JavaScript文件较大: ${Math.round(sizeKB)}KB (建议拆分或压缩)`
          });
        }
        
        // 检查CSS文件大小
        if (resource.name.match(/\.css$/i) && sizeKB > 50) {
          results.push({
            metric: 'CSS Size',
            resource: resource.name,
            value: sizeKB,
            threshold: 50,
            status: 'warning',
            message: `CSS文件较大: ${Math.round(sizeKB)}KB (建议优化)`
          });
        }
      }
    });
    
    // 检查总传输大小
    const totalSize = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0) / 1024;
    const isValidTotal = totalSize <= this.validationThresholds.bundleSize;
    results.push({
      metric: 'Total Bundle Size',
      value: totalSize,
      threshold: this.validationThresholds.bundleSize,
      status: isValidTotal ? 'pass' : 'fail',
      message: isValidTotal ? 
        `总体积良好 (${Math.round(totalSize)}KB)` : 
        `总体积过大 (${Math.round(totalSize)}KB, 建议 < ${this.validationThresholds.bundleSize}KB)`
    });
    
    this.validationResults.push(...results);
    return results;
  }

  validateMemoryUsage() {
    const results = [];
    
    if ('memory' in performance) {
      const memoryMB = performance.memory.usedJSHeapSize / (1024 * 1024);
      const isValid = memoryMB <= this.validationThresholds.memoryUsage;
      
      results.push({
        metric: 'Memory Usage',
        value: memoryMB,
        threshold: this.validationThresholds.memoryUsage,
        status: isValid ? 'pass' : 'warning',
        message: isValid ? 
          `内存使用正常 (${Math.round(memoryMB)}MB)` : 
          `内存使用较高 (${Math.round(memoryMB)}MB, 建议 < ${this.validationThresholds.memoryUsage}MB)`
      });
    }
    
    this.validationResults.push(...results);
    return results;
  }

  validateNetworkEfficiency() {
    const results = [];
    const resources = performance.getEntriesByType('resource');
    
    // 检查未压缩的资源
    resources.forEach(resource => {
      if (resource.transferSize && resource.decodedBodySize) {
        const compressionRatio = resource.transferSize / resource.decodedBodySize;
        
        // 如果压缩比例太低，可能没有启用压缩
        if (resource.decodedBodySize > 1024 && compressionRatio > 0.9) {
          results.push({
            metric: 'Compression',
            resource: resource.name,
            value: compressionRatio,
            threshold: 0.9,
            status: 'warning',
            message: `资源可能未压缩: ${resource.name.split('/').pop()} (压缩比: ${(compressionRatio * 100).toFixed(1)}%)`
          });
        }
      }
    });
    
    // 检查DNS查找时间
    if (this.metrics.navigation?.dnsLookup > 200) {
      results.push({
        metric: 'DNS Lookup',
        value: this.metrics.navigation.dnsLookup,
        threshold: 200,
        status: 'warning',
        message: `DNS查找时间较长 (${Math.round(this.metrics.navigation.dnsLookup)}ms)`
      });
    }
    
    // 检查服务器响应时间
    if (this.metrics.navigation?.serverResponse > this.validationThresholds.ttfb) {
      results.push({
        metric: 'TTFB',
        value: this.metrics.navigation.serverResponse,
        threshold: this.validationThresholds.ttfb,
        status: 'warning',
        message: `服务器响应时间较长 (${Math.round(this.metrics.navigation.serverResponse)}ms)`
      });
    }
    
    this.validationResults.push(...results);
    return results;
  }

  generatePerformanceReport() {
    const passCount = this.validationResults.filter(r => r.status === 'pass').length;
    const failCount = this.validationResults.filter(r => r.status === 'fail').length;
    const warningCount = this.validationResults.filter(r => r.status === 'warning').length;
    const totalChecks = this.validationResults.length;
    
    const score = totalChecks > 0 ? Math.round((passCount / totalChecks) * 100) : 0;
    
    const report = {
      timestamp: new Date().toISOString(),
      score,
      summary: {
        total: totalChecks,
        passed: passCount,
        failed: failCount,
        warnings: warningCount
      },
      details: this.validationResults,
      recommendations: this.generateRecommendations()
    };
    
    this.logPerformanceReport(report);
    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    
    // 基于验证结果生成建议
    const failedChecks = this.validationResults.filter(r => r.status === 'fail');
    const warningChecks = this.validationResults.filter(r => r.status === 'warning');
    
    if (failedChecks.some(r => r.metric === 'LCP')) {
      recommendations.push({
        priority: 'high',
        category: 'LCP优化',
        suggestion: '优化LCP: 使用更快的CDN、压缩图片、优化关键渲染路径'
      });
    }
    
    if (failedChecks.some(r => r.metric === 'FID')) {
      recommendations.push({
        priority: 'high',
        category: 'FID优化',
        suggestion: '优化FID: 减少JavaScript执行时间、使用Web Workers、优化事件处理'
      });
    }
    
    if (failedChecks.some(r => r.metric === 'CLS')) {
      recommendations.push({
        priority: 'medium',
        category: 'CLS优化',
        suggestion: '优化CLS: 为图片和广告预留空间、避免动态内容插入'
      });
    }
    
    if (warningChecks.some(r => r.metric === 'Image Size')) {
      recommendations.push({
        priority: 'medium',
        category: '图片优化',
        suggestion: '压缩图片: 使用WebP格式、响应式图片、适当的图片尺寸'
      });
    }
    
    if (warningChecks.some(r => r.metric === 'Compression')) {
      recommendations.push({
        priority: 'low',
        category: '压缩优化',
        suggestion: '启用Gzip/Brotli压缩、使用CDN、优化资源传输'
      });
    }
    
    return recommendations;
  }

  logPerformanceReport(report) {
    console.group('🎯 性能验证报告');
    console.log(`📊 评分: ${report.score}/100`);
    console.log(`✅ 通过: ${report.summary.passed}`);
    console.log(`❌ 失败: ${report.summary.failed}`);
    console.log(`⚠️ 警告: ${report.summary.warnings}`);
    
    if (report.summary.failed > 0) {
      console.group('❌ 需要修复');
      report.details.filter(r => r.status === 'fail').forEach(result => {
        console.error(result.message);
      });
      console.groupEnd();
    }
    
    if (report.summary.warnings > 0) {
      console.group('⚠️ 建议优化');
      report.details.filter(r => r.status === 'warning').forEach(result => {
        console.warn(result.message);
      });
      console.groupEnd();
    }
    
    if (report.recommendations.length > 0) {
      console.group('💡 优化建议');
      report.recommendations.forEach(rec => {
        console.log(`${rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢'} ${rec.category}: ${rec.suggestion}`);
      });
      console.groupEnd();
    }
    
    console.groupEnd();
  }

  // 公共API方法
  getMetrics() {
    return this.metrics;
  }

  getValidationResults() {
    return this.validationResults;
  }

  validatePerformance() {
    return this.runPerformanceValidation();
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
