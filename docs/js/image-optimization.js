// 图片优化管理器
class ImageOptimizer {
  constructor() {
    this.init();
  }

  init() {
    this.setupLazyLoading();
    this.setupResponsiveImages();
    this.setupImageErrorHandling();
    this.setupProgressiveLoading();
  }

  setupLazyLoading() {
    if ('loading' in HTMLImageElement.prototype) {
      // 使用原生懒加载
      document.querySelectorAll('img[data-src]').forEach(img => {
        img.loading = 'lazy';
        img.src = img.dataset.src;
      });
    } else if ('IntersectionObserver' in window) {
      // 回退到 Intersection Observer
      const imageObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target;
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
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

  setupResponsiveImages() {
    document.querySelectorAll('img[data-srcset]').forEach(img => {
      if ('srcset' in img) {
        img.srcset = img.dataset.srcset;
        if (img.dataset.sizes) {
          img.sizes = img.dataset.sizes;
        }
      }
    });
  }

  setupImageErrorHandling() {
    document.querySelectorAll('img').forEach(img => {
      img.onerror = () => {
        // 添加错误占位符类
        img.classList.add('img-error');
        // 记录错误
        console.error('Failed to load image:', img.src);
        // 尝试加载备用图片
        if (img.dataset.fallback) {
          img.src = img.dataset.fallback;
        }
      };
    });
  }

  setupProgressiveLoading() {
    document.querySelectorAll('img[data-progressive]').forEach(img => {
      // 创建低质量图片预览
      const lowQuality = new Image();
      lowQuality.src = img.dataset.progressive;
      lowQuality.classList.add('img-preview');
      img.parentNode.insertBefore(lowQuality, img);

      // 加载高质量图片
      img.onload = () => {
        img.classList.add('img-loaded');
        setTimeout(() => {
          lowQuality.remove();
        }, 1000);
      };
    });
  }

  // 工具方法：生成响应式图片源集
  static generateSrcset(baseUrl, sizes = [300, 600, 900, 1200]) {
    return sizes
      .map(size => `${baseUrl}?w=${size} ${size}w`)
      .join(', ');
  }

  // 工具方法：计算图片尺寸
  static calculateImageSize(img) {
    const rect = img.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      ratio: rect.width / rect.height
    };
  }
}

// 初始化图片优化器
document.addEventListener('DOMContentLoaded', () => {
  window.imageOptimizer = new ImageOptimizer();
});
