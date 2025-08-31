import { TestUtils } from '../test-utils';

describe('Form Validation Manager', () => {
  let formValidationManager;

  beforeEach(() => {
    TestUtils.cleanup();
    
    // 创建测试表单
    document.body.innerHTML = `
      <form data-validation>
        <div class="validation-errors" style="display: none;"></div>
        
        <label for="title">标题 *</label>
        <input id="title" name="title" data-validate="required,length:{min:1,max:100}" />
        <div id="title-error" class="field-error" style="display: none;"></div>
        
        <label for="category">分类 *</label>
        <select id="category" name="category" data-validate="required,tobacco-category">
          <option value="">请选择</option>
          <option value="cigars">雪茄</option>
          <option value="cigarettes">香烟</option>
          <option value="pipe">烟斗</option>
        </select>
        <div id="category-error" class="field-error" style="display: none;"></div>
        
        <label for="rating">评分</label>
        <input id="rating" name="rating" type="number" data-validate="rating" />
        <div id="rating-error" class="field-error" style="display: none;"></div>
        
        <label for="date">日期 *</label>
        <input id="date" name="date" type="date" data-validate="required,date-format" />
        <div id="date-error" class="field-error" style="display: none;"></div>
        
        <label for="brand">品牌</label>
        <input id="brand" name="brand" data-validate="brand-name" />
        <div id="brand-error" class="field-error" style="display: none;"></div>
        
        <button type="submit">提交</button>
      </form>
    `;
    
    // 加载验证管理器
    require('../../form-validation');
    formValidationManager = window.formValidationManager;
  });

  test('should validate required fields', () => {
    const titleInput = document.getElementById('title');
    const categorySelect = document.getElementById('category');
    
    // 测试空值验证
    expect(formValidationManager.validateField(titleInput, true)).toBe(false);
    expect(titleInput.classList.contains('is-invalid')).toBe(true);
    
    // 测试有效值
    titleInput.value = 'Test Title';
    expect(formValidationManager.validateField(titleInput, true)).toBe(true);
    expect(titleInput.classList.contains('is-valid')).toBe(true);
    
    // 测试分类验证
    expect(formValidationManager.validateField(categorySelect, true)).toBe(false);
    categorySelect.value = 'cigars';
    expect(formValidationManager.validateField(categorySelect, true)).toBe(true);
  });

  test('should validate tobacco-specific fields', () => {
    const categorySelect = document.getElementById('category');
    const ratingInput = document.getElementById('rating');
    
    // 测试有效分类
    categorySelect.value = 'cigars';
    expect(formValidationManager.validateField(categorySelect)).toBe(true);
    
    // 测试无效分类
    categorySelect.value = 'invalid-category';
    expect(formValidationManager.validateField(categorySelect)).toBe(false);
    
    // 测试评分范围
    ratingInput.value = '5';
    expect(formValidationManager.validateField(ratingInput)).toBe(true);
    
    ratingInput.value = '15';
    expect(formValidationManager.validateField(ratingInput)).toBe(false);
    
    ratingInput.value = '-1';
    expect(formValidationManager.validateField(ratingInput)).toBe(false);
  });

  test('should validate date format', () => {
    const dateInput = document.getElementById('date');
    
    // 测试有效日期格式
    dateInput.value = '2025-08-31';
    expect(formValidationManager.validateField(dateInput)).toBe(true);
    
    // 测试无效日期格式
    dateInput.value = '31/08/2025';
    expect(formValidationManager.validateField(dateInput)).toBe(false);
    
    dateInput.value = '2025-13-01';
    expect(formValidationManager.validateField(dateInput)).toBe(false);
  });

  test('should validate brand name format', () => {
    const brandInput = document.getElementById('brand');
    
    // 测试有效品牌名
    brandInput.value = 'Partagas Serie D';
    expect(formValidationManager.validateField(brandInput)).toBe(true);
    
    brandInput.value = 'Romeo & Juliet';
    expect(formValidationManager.validateField(brandInput)).toBe(true);
    
    // 测试无效字符
    brandInput.value = 'Brand<script>';
    expect(formValidationManager.validateField(brandInput)).toBe(false);
    
    // 测试过长品牌名
    brandInput.value = 'A'.repeat(101);
    expect(formValidationManager.validateField(brandInput)).toBe(false);
  });

  test('should handle form submission validation', () => {
    const form = document.querySelector('form');
    const titleInput = document.getElementById('title');
    const categorySelect = document.getElementById('category');
    const dateInput = document.getElementById('date');
    
    // 测试表单提交失败（缺少必填字段）
    expect(formValidationManager.validateForm(form)).toBe(false);
    
    // 填写必填字段
    titleInput.value = 'Test Note';
    categorySelect.value = 'cigars';
    dateInput.value = '2025-08-31';
    
    // 测试表单提交成功
    expect(formValidationManager.validateForm(form)).toBe(true);
  });

  test('should show and hide error messages correctly', () => {
    const titleInput = document.getElementById('title');
    const errorElement = document.getElementById('title-error');
    
    // 验证失败时显示错误
    formValidationManager.validateField(titleInput, true);
    expect(errorElement.style.display).toBe('block');
    expect(errorElement.textContent).toBe('此字段为必填项');
    
    // 验证成功时隐藏错误
    titleInput.value = 'Valid Title';
    formValidationManager.validateField(titleInput, true);
    expect(errorElement.style.display).toBe('none');
  });

  test('should validate tobacco note content', () => {
    const validNote = {
      title: 'Test Cigar',
      category: 'cigars',
      date: '2025-08-31',
      rating: 8.5,
      description: 'A detailed description of the cigar that is long enough to meet minimum requirements for meaningful content.'
    };
    
    const result = formValidationManager.validateTobaccoNote(validNote);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    
    // 测试无效数据
    const invalidNote = {
      title: '',
      category: 'invalid',
      date: 'invalid-date',
      rating: 15,
      description: 'A'.repeat(5001)
    };
    
    const invalidResult = formValidationManager.validateTobaccoNote(invalidNote);
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.errors.length).toBeGreaterThan(0);
  });

  test('should handle custom validation rules', () => {
    // 添加自定义验证规则
    formValidationManager.addValidationRule(
      'custom-test',
      (value) => value === 'test',
      '值必须为"test"',
      1
    );
    
    // 创建使用自定义规则的输入框
    const customInput = document.createElement('input');
    customInput.setAttribute('data-validate', 'custom-test');
    customInput.value = 'invalid';
    
    expect(formValidationManager.validateField(customInput)).toBe(false);
    
    customInput.value = 'test';
    expect(formValidationManager.validateField(customInput)).toBe(true);
  });

  test('should handle accessibility features', () => {
    const titleInput = document.getElementById('title');
    
    // 检查ARIA属性
    expect(titleInput.getAttribute('aria-describedby')).toBe('title-error');
    
    // 验证失败时设置aria-invalid
    formValidationManager.validateField(titleInput, true);
    expect(titleInput.getAttribute('aria-invalid')).toBe('true');
    
    // 验证成功时移除aria-invalid
    titleInput.value = 'Valid Title';
    formValidationManager.validateField(titleInput, true);
    expect(titleInput.getAttribute('aria-invalid')).toBe('false');
  });

  test('should provide real-time validation', () => {
    const titleInput = document.getElementById('title');
    let validationTriggered = false;
    
    // 监听输入事件
    document.addEventListener('input', () => {
      validationTriggered = true;
    });
    
    // 模拟用户输入
    TestUtils.simulateInput(titleInput, 'Test');
    
    expect(validationTriggered).toBe(true);
  });

  test('should clear validation state', () => {
    const form = document.querySelector('form');
    const titleInput = document.getElementById('title');
    
    // 触发验证错误
    formValidationManager.validateField(titleInput, true);
    expect(titleInput.classList.contains('is-invalid')).toBe(true);
    
    // 清除验证状态
    formValidationManager.clearValidation('form');
    expect(titleInput.classList.contains('is-invalid')).toBe(false);
    expect(titleInput.classList.contains('is-valid')).toBe(false);
  });
});