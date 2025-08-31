import { TestUtils } from '../test-utils';

describe('Performance Metrics', () => {
  beforeEach(() => {
    TestUtils.cleanup();
    require('../../performance');
  });

  test('should measure initial load performance', async () => {
    const loadTime = await TestUtils.measurePerformance(async () => {
      document.body.innerHTML = await fetch('/index.html').then(res => res.text());
      await Promise.all([
        import('../../theme'),
        import('../../search'),
        import('../../notes')
      ]);
    });

    expect(loadTime).toBeLessThan(1000); // 1秒内完成初始加载
  });

  test('should measure search performance', async () => {
    const input = document.querySelector('#q');
    const searchTime = await TestUtils.measurePerformance(async () => {
      TestUtils.simulateInput(input, 'test');
      await TestUtils.wait(300);
    });

    expect(searchTime).toBeLessThan(100); // 搜索响应时间小于100ms
  });

  test('should measure rendering performance', async () => {
    const notes = Array.from({ length: 100 }, (_, i) => ({
      title: `Note ${i}`,
      category: 'cigars',
      date: '2024-01-01'
    }));

    const renderTime = await TestUtils.measurePerformance(() => {
      const list = document.querySelector('#latest-list');
      notes.forEach(note => {
        const li = document.createElement('li');
        li.textContent = note.title;
        list.appendChild(li);
      });
    });

    expect(renderTime).toBeLessThan(100); // 渲染100个项目小于100ms
  });

  test('should measure memory usage', async () => {
    const memoryUsage = await TestUtils.measureMemory(async () => {
      // 模拟大量数据加载
      const notes = Array.from({ length: 1000 }, (_, i) => ({
        title: `Note ${i}`,
        category: 'cigars',
        date: '2024-01-01',
        content: 'x'.repeat(1000)
      }));

      window.notesData = notes;
      await TestUtils.wait(100);
    });

    if (memoryUsage !== null) {
      expect(memoryUsage).toBeLessThan(5 * 1024 * 1024); // 内存增长小于5MB
    }
  });

  test('should measure animation performance', async () => {
    const fps = [];
    let lastTime = performance.now();

    const measureFrame = () => {
      const now = performance.now();
      const delta = now - lastTime;
      fps.push(1000 / delta);
      lastTime = now;
    };

    // 测量动画性能
    const animationTime = await TestUtils.measurePerformance(async () => {
      const element = document.querySelector('.animate');
      const rafCallback = () => {
        measureFrame();
        element.style.transform = `translateY(${Math.sin(Date.now() / 1000) * 10}px)`;
      };

      for (let i = 0; i < 60; i++) {
        rafCallback();
        await TestUtils.wait(16.67); // 约60fps
      }
    });

    const averageFps = fps.reduce((a, b) => a + b) / fps.length;
    expect(averageFps).toBeGreaterThan(30); // 平均帧率应大于30fps
  });

  test('should measure network performance', async () => {
    const resources = performance.getEntriesByType('resource');
    const cssFiles = resources.filter(r => r.name.endsWith('.css'));
    const jsFiles = resources.filter(r => r.name.endsWith('.js'));

    // CSS 文件大小检查
    cssFiles.forEach(file => {
      expect(file.encodedBodySize).toBeLessThan(50 * 1024); // CSS文件小于50KB
    });

    // JS 文件大小检查
    jsFiles.forEach(file => {
      expect(file.encodedBodySize).toBeLessThan(100 * 1024); // JS文件小于100KB
    });

    // 总传输大小检查
    const totalSize = resources.reduce((sum, r) => sum + r.encodedBodySize, 0);
    expect(totalSize).toBeLessThan(500 * 1024); // 总大小小于500KB
  });

  test('should measure cache effectiveness', async () => {
    // 首次加载
    const firstLoadTime = await TestUtils.measurePerformance(async () => {
      await fetch('/data/latest.json');
    });

    // 第二次加载（应该使用缓存）
    const secondLoadTime = await TestUtils.measurePerformance(async () => {
      await fetch('/data/latest.json');
    });

    expect(secondLoadTime).toBeLessThan(firstLoadTime * 0.5); // 缓存加载应该比首次加载快50%以上
  });

  test('should measure Web Vitals', async () => {
    const vitals = await new Promise(resolve => {
      let metrics = {};
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          if (entry.entryType === 'largest-contentful-paint') {
            metrics.lcp = entry.startTime;
          } else if (entry.entryType === 'first-input') {
            metrics.fid = entry.processingStart - entry.startTime;
          } else if (entry.entryType === 'layout-shift') {
            metrics.cls = (metrics.cls || 0) + entry.value;
          }
        });
        resolve(metrics);
      });

      observer.observe({
        entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift']
      });
    });

    // Web Vitals 阈值检查
    expect(vitals.lcp).toBeLessThan(2500); // LCP < 2.5s
    expect(vitals.fid).toBeLessThan(100); // FID < 100ms
    expect(vitals.cls).toBeLessThan(0.1); // CLS < 0.1
  });
});
