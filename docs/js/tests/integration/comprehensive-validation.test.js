import { TestUtils } from '../test-utils';

describe('Comprehensive Validation Integration', () => {
  let formValidationManager;
  let accessibilityValidator;
  let performanceManager;

  beforeEach(() => {
    TestUtils.cleanup();
    
    // 创建完整的应用页面结构
    document.body.innerHTML = `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>烟草品鉴笔记 - 综合验证测试</title>
      </head>
      <body>
        <a href="#main" class="skip-link">跳转到主内容</a>
        
        <header role="banner">
          <nav role="navigation" aria-label="主导航">
            <h1>烟草品鉴笔记</h1>
            <ul>
              <li><a href="#latest">最新笔记</a></li>
              <li><a href="#categories">分类</a></li>
              <li><a href="#contribute">投稿</a></li>
            </ul>
          </nav>
        </header>
        
        <main id="main" role="main">
          <section id="contribute">
            <h2>添加品鉴笔记</h2>
            
            <form id="note-form" data-validation aria-labelledby="form-title">
              <h3 id="form-title">笔记信息</h3>
              <div class="validation-errors" role="alert" aria-live="polite"></div>
              
              <fieldset>
                <legend>基本信息</legend>
                
                <div class="form-group">
                  <label for="note-title">笔记标题 *</label>
                  <input 
                    id="note-title" 
                    name="title" 
                    type="text"
                    data-validate="required,length:{min:1,max:100}"
                    aria-describedby="note-title-error note-title-help"
                    required
                  />
                  <div id="note-title-help" class="field-help">请输入简洁明了的标题</div>
                  <div id="note-title-error" class="field-error" role="alert"></div>
                </div>
                
                <div class="form-group">
                  <label for="note-category">烟草分类 *</label>
                  <select 
                    id="note-category" 
                    name="category"
                    data-validate="required,tobacco-category"
                    aria-describedby="note-category-error"
                    required
                  >
                    <option value="">请选择分类</option>
                    <option value="cigars">雪茄</option>
                    <option value="cigarettes">香烟</option>
                    <option value="pipe">烟斗</option>
                    <option value="ryo">手卷烟</option>
                    <option value="snus">唇烟</option>
                    <option value="ecig">电子烟</option>
                  </select>
                  <div id="note-category-error" class="field-error" role="alert"></div>
                </div>
                
                <div class="form-group">
                  <label for="note-date">品鉴日期 *</label>
                  <input 
                    id="note-date" 
                    name="date" 
                    type="date"
                    data-validate="required,date-format"
                    aria-describedby="note-date-error"
                    required
                  />
                  <div id="note-date-error" class="field-error" role="alert"></div>
                </div>
                
                <div class="form-group">
                  <label for="note-brand">品牌</label>
                  <input 
                    id="note-brand" 
                    name="brand" 
                    type="text"
                    data-validate="brand-name"
                    aria-describedby="note-brand-error"
                  />
                  <div id="note-brand-error" class="field-error" role="alert"></div>
                </div>
              </fieldset>
              
              <fieldset>
                <legend>评价信息</legend>
                
                <div class="form-group">
                  <label for="note-rating">综合评分 (0-10)</label>
                  <input 
                    id="note-rating" 
                    name="rating" 
                    type="number"
                    min="0" 
                    max="10" 
                    step="0.1"
                    data-validate="rating"
                    aria-describedby="note-rating-error note-rating-help"
                  />
                  <div id="note-rating-help" class="field-help">0分最低，10分最高</div>
                  <div id="note-rating-error" class="field-error" role="alert"></div>
                </div>
                
                <div class="form-group">
                  <label for="note-description">详细描述</label>
                  <textarea 
                    id="note-description" 
                    name="description"
                    rows="6"
                    data-validate="length:{min:50,max:5000}"
                    aria-describedby="note-description-error note-description-help"
                    placeholder="请描述外观、香气、口感、余味等..."
                  ></textarea>
                  <div id="note-description-help" class="field-help">详细的描述有助于其他人了解这款产品</div>
                  <div id="note-description-error" class="field-error" role="alert"></div>
                </div>
              </fieldset>
              
              <div class="form-actions">
                <button type="submit" class="btn-primary">
                  <span class="btn-text">提交笔记</span>
                  <span class="btn-loading" style="display: none;">提交中...</span>
                </button>
                <button type="reset" class="btn-secondary">重置表单</button>
              </div>
            </form>
          </section>
          
          <section id="latest">
            <h2>最新笔记</h2>
            <div class="notes-grid" role="region" aria-label="最新笔记列表">
              <article class="note-card">
                <img src="cigar1.jpg" alt="Partagas Serie D No.4 雪茄外观" loading="lazy" />
                <h3><a href="#cigars/2025-08-31-partagas-d4">Partagas Serie D No.4</a></h3>
                <p>经典的古巴雪茄，浓郁的口感和优雅的香气...</p>
                <div class="note-meta">
                  <span class="rating" aria-label="评分">★★★★☆ 8.5</span>
                  <time datetime="2025-08-31">2025年8月31日</time>
                </div>
              </article>
              
              <article class="note-card">
                <img src="cigarette1.jpg" alt="" /> <!-- 装饰性图片 -->
                <h3><a href="#cigarettes/2025-08-30-marlboro-red">万宝路红</a></h3>
                <p>经典的美式混合香烟，口感浓烈...</p>
                <div class="note-meta">
                  <span class="rating" aria-label="评分">★★★☆☆ 6.0</span>
                  <time datetime="2025-08-30">2025年8月30日</time>
                </div>
              </article>
            </div>
            
            <button class="load-more" type="button" aria-describedby="load-more-status">
              加载更多笔记
            </button>
            <div id="load-more-status" class="sr-only" aria-live="polite"></div>
          </section>
        </main>
        
        <footer role="contentinfo">
          <p>&copy; 2025 烟草品鉴笔记. <a href="#license">许可证信息</a></p>
        </footer>
      </body>
      </html>
    `;
    
    // 添加样式以支持测试
    const style = document.createElement('style');
    style.textContent = `
      .skip-link { position: absolute; top: -40px; left: 0; }
      .skip-link:focus { top: 0; }
      .field-error { color: #dc3545; display: none; }
      .field-error[style*="block"] { display: block; }
      .is-invalid { border-color: #dc3545; }
      .is-valid { border-color: #28a745; }
      .validation-errors { background: #f8d7da; padding: 1rem; margin-bottom: 1rem; display: none; }
      .btn-primary:focus, .btn-secondary:focus { outline: 2px solid #007bff; }
      .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; }
    `;
    document.head.appendChild(style);
    
    // 初始化所有验证管理器
    require('../../form-validation');
    require('../../accessibility-validator');
    require('../../performance');
    
    formValidationManager = window.formValidationManager;
    accessibilityValidator = window.accessibilityValidator;
    performanceManager = window.performanceManager;
  });

  test('should validate complete tobacco note submission workflow', async () => {
    const form = document.getElementById('note-form');
    const titleInput = document.getElementById('note-title');
    const categorySelect = document.getElementById('note-category');
    const dateInput = document.getElementById('note-date');
    const brandInput = document.getElementById('note-brand');
    const ratingInput = document.getElementById('note-rating');
    const descriptionTextarea = document.getElementById('note-description');
    
    // 1. 测试空表单提交（应该失败）
    const emptyFormValid = formValidationManager.validateForm(form);
    expect(emptyFormValid).toBe(false);
    
    // 验证错误信息显示
    const errorContainer = form.querySelector('.validation-errors');
    expect(errorContainer.style.display).toBe('block');
    
    // 2. 逐步填写表单
    titleInput.value = 'Cohiba Robusto 品鉴笔记';
    expect(formValidationManager.validateField(titleInput, true)).toBe(true);
    
    categorySelect.value = 'cigars';
    expect(formValidationManager.validateField(categorySelect, true)).toBe(true);
    
    dateInput.value = '2025-08-31';
    expect(formValidationManager.validateField(dateInput, true)).toBe(true);
    
    brandInput.value = 'Cohiba';
    expect(formValidationManager.validateField(brandInput, true)).toBe(true);
    
    ratingInput.value = '9.2';
    expect(formValidationManager.validateField(ratingInput, true)).toBe(true);
    
    descriptionTextarea.value = `
      这款Cohiba Robusto展现了古巴雪茄的经典风味。外观上，茄衣呈现深棕色，
      油润光泽，手感紧实。点燃后，初段呈现出淡雅的奶油和坚果香气，
      中段逐渐展现出皮革和雪松的复杂层次，尾段则带有淡淡的咖啡和巧克力余韵。
      燃烧均匀，灰白色烟灰牢固不散。整体口感平衡，层次丰富，
      是一款值得细细品味的优质雪茄。
    `.trim();
    expect(formValidationManager.validateField(descriptionTextarea, true)).toBe(true);
    
    // 3. 测试完整表单验证
    const completeFormValid = formValidationManager.validateForm(form);
    expect(completeFormValid).toBe(true);
    
    // 4. 测试烟草笔记专用验证
    const noteData = {
      title: titleInput.value,
      category: categorySelect.value,
      date: dateInput.value,
      brand: brandInput.value,
      rating: parseFloat(ratingInput.value),
      description: descriptionTextarea.value
    };
    
    const noteValidation = formValidationManager.validateTobaccoNote(noteData);
    expect(noteValidation.isValid).toBe(true);
    expect(noteValidation.errors).toHaveLength(0);
  });

  test('should validate complete page accessibility', () => {
    // 运行完整的无障碍验证
    accessibilityValidator.validatePage();
    const a11yReport = accessibilityValidator.getReport();
    
    // 基本页面结构应该通过验证
    expect(a11yReport.score).toBeGreaterThan(80); // 期望高质量的无障碍分数
    
    // 检查关键无障碍特性
    const headingViolations = a11yReport.violations.filter(v => v.ruleName === 'heading-hierarchy');
    expect(headingViolations).toHaveLength(0); // 标题层级应该正确
    
    const skipLinkWarnings = a11yReport.warnings.filter(w => w.ruleName === 'skip-links');
    expect(skipLinkWarnings).toHaveLength(0); // 应该有跳转链接
    
    // 表单标签验证
    const formLabelViolations = a11yReport.violations.filter(v => v.ruleName === 'form-labels');
    expect(formLabelViolations).toHaveLength(0); // 所有表单元素都应该有标签
    
    // 图片alt文本验证
    const altTextViolations = a11yReport.violations.filter(v => v.ruleName === 'alt-text');
    expect(altTextViolations).toHaveLength(0); // 所有图片都应该有适当的alt文本
  });

  test('should validate keyboard navigation workflow', () => {
    const focusableElements = accessibilityValidator.testKeyboardNavigation();
    
    // 验证关键元素可以通过键盘访问
    const submitButton = document.querySelector('button[type="submit"]');
    const resetButton = document.querySelector('button[type="reset"]');
    const skipLink = document.querySelector('.skip-link');
    
    expect(focusableElements.some(el => el.element === submitButton)).toBe(true);
    expect(focusableElements.some(el => el.element === resetButton)).toBe(true);
    expect(focusableElements.some(el => el.element === skipLink)).toBe(true);
    
    // 验证表单元素的tab顺序
    const formElements = focusableElements.filter(el => 
      el.element.closest('#note-form')
    );
    
    expect(formElements.length).toBeGreaterThan(5); // 应该有多个表单元素
  });

  test('should validate screen reader experience', () => {
    const screenReaderContent = accessibilityValidator.simulateScreenReader();
    
    // 验证重要内容对屏幕阅读器可访问
    expect(screenReaderContent.some(content => 
      content.includes('烟草品鉴笔记')
    )).toBe(true);
    
    expect(screenReaderContent.some(content => 
      content.includes('添加品鉴笔记')
    )).toBe(true);
    
    expect(screenReaderContent.some(content => 
      content.includes('笔记标题')
    )).toBe(true);
    
    // 验证ARIA标签被正确识别
    expect(screenReaderContent.some(content => 
      content.includes('FIELDSET') || content.includes('fieldset')
    )).toBe(true);
  });

  test('should validate performance metrics', async () => {
    // 模拟页面加载完成
    window.dispatchEvent(new Event('load'));
    
    // 等待性能监控初始化
    await TestUtils.wait(100);
    
    const metrics = performanceManager.getMetrics();
    
    // 验证基本性能指标存在
    expect(metrics).toHaveProperty('navigation');
    expect(metrics.navigation).toHaveProperty('dnsLookup');
    expect(metrics.navigation).toHaveProperty('serverResponse');
    
    // 验证资源加载信息
    expect(metrics).toHaveProperty('resources');
    expect(Array.isArray(metrics.resources)).toBe(true);
  });

  test('should integrate all validation systems for form submission', async () => {
    const form = document.getElementById('note-form');
    const submitButton = form.querySelector('button[type="submit"]');
    
    // 填写有效表单数据
    document.getElementById('note-title').value = 'Test Note';
    document.getElementById('note-category').value = 'cigars';
    document.getElementById('note-date').value = '2025-08-31';
    document.getElementById('note-description').value = 'A'.repeat(60); // 满足最小长度要求
    
    let validationEvents = [];
    
    // 监听验证事件
    document.addEventListener('validationComplete', (e) => {
      validationEvents.push({ type: 'form', result: e.detail });
    });
    
    document.addEventListener('accessibilityValidated', (e) => {
      validationEvents.push({ type: 'accessibility', result: e.detail });
    });
    
    document.addEventListener('performanceValidated', (e) => {
      validationEvents.push({ type: 'performance', result: e.detail });
    });
    
    // 模拟表单提交
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(submitEvent);
    
    // 验证表单验证事件被触发
    await TestUtils.wait(50);
    const formValidationEvent = validationEvents.find(e => e.type === 'form');
    expect(formValidationEvent).toBeTruthy();
    expect(formValidationEvent.result.isValid).toBe(true);
    
    // 运行无障碍验证
    accessibilityValidator.validatePage();
    
    // 验证所有验证系统协同工作
    const finalA11yReport = accessibilityValidator.getReport();
    expect(finalA11yReport.score).toBeGreaterThan(70);
  });

  test('should validate error handling and user feedback', () => {
    const titleInput = document.getElementById('note-title');
    const categorySelect = document.getElementById('note-category');
    
    // 测试实时验证反馈
    const inputEvent = new Event('input', { bubbles: true });
    titleInput.dispatchEvent(inputEvent);
    
    // 测试失焦验证
    const blurEvent = new Event('blur', { bubbles: true });
    titleInput.dispatchEvent(blurEvent);
    
    // 验证错误状态
    expect(titleInput.classList.contains('is-invalid')).toBe(true);
    expect(titleInput.getAttribute('aria-invalid')).toBe('true');
    
    // 测试修正后的验证
    titleInput.value = 'Valid Title';
    formValidationManager.validateField(titleInput, true);
    
    expect(titleInput.classList.contains('is-valid')).toBe(true);
    expect(titleInput.getAttribute('aria-invalid')).toBe('false');
  });

  test('should validate responsive and mobile accessibility', () => {
    // 模拟移动设备视口
    Object.defineProperty(window, 'innerWidth', { value: 375 });
    Object.defineProperty(window, 'innerHeight', { value: 667 });
    
    // 重新运行无障碍验证
    accessibilityValidator.validatePage();
    const mobileA11yReport = accessibilityValidator.getReport();
    
    // 移动设备上的无障碍性应该保持一致
    expect(mobileA11yReport.score).toBeGreaterThan(70);
    
    // 验证触摸目标大小（模拟）
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
      const style = window.getComputedStyle(button);
      // 在实际实现中，这里会检查按钮的最小触摸目标尺寸
      expect(button.offsetHeight).toBeGreaterThan(0);
    });
  });

  test('should validate data persistence and state management', () => {
    const titleInput = document.getElementById('note-title');
    const categorySelect = document.getElementById('note-category');
    
    // 填写表单数据
    titleInput.value = 'Persistent Note Title';
    categorySelect.value = 'cigars';
    
    // 模拟页面状态变化
    const beforeValidation = {
      title: titleInput.value,
      category: categorySelect.value
    };
    
    // 运行验证
    formValidationManager.validateForm(document.getElementById('note-form'));
    
    // 验证数据未被验证过程破坏
    expect(titleInput.value).toBe(beforeValidation.title);
    expect(categorySelect.value).toBe(beforeValidation.category);
  });

  test('should validate comprehensive error recovery', () => {
    const form = document.getElementById('note-form');
    
    // 创建多个验证错误
    const titleInput = document.getElementById('note-title');
    const categorySelect = document.getElementById('note-category');
    const ratingInput = document.getElementById('note-rating');
    
    titleInput.value = ''; // 必填字段为空
    categorySelect.value = 'invalid-category'; // 无效分类
    ratingInput.value = '15'; // 超出范围的评分
    
    // 运行验证
    const isValid = formValidationManager.validateForm(form);
    expect(isValid).toBe(false);
    
    // 验证错误列表显示
    const errorContainer = form.querySelector('.validation-errors');
    expect(errorContainer.style.display).toBe('block');
    const errorList = errorContainer.querySelector('ul');
    expect(errorList.children.length).toBeGreaterThan(0);
    
    // 逐步修正错误
    titleInput.value = 'Corrected Title';
    formValidationManager.validateField(titleInput, true);
    expect(titleInput.classList.contains('is-valid')).toBe(true);
    
    categorySelect.value = 'cigars';
    formValidationManager.validateField(categorySelect, true);
    expect(categorySelect.classList.contains('is-valid')).toBe(true);
    
    ratingInput.value = '8.5';
    formValidationManager.validateField(ratingInput, true);
    expect(ratingInput.classList.contains('is-valid')).toBe(true);
    
    // 添加必填的日期
    document.getElementById('note-date').value = '2025-08-31';
    
    // 最终验证应该通过
    const finalValid = formValidationManager.validateForm(form);
    expect(finalValid).toBe(true);
  });
});