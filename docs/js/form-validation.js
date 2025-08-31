// 综合表单验证管理器
class FormValidationManager {
  constructor() {
    this.validators = new Map();
    this.validationRules = new Map();
    this.errorMessages = new Map();
    this.realTimeValidation = true;
    this.init();
  }

  init() {
    this.setupValidationRules();
    this.setupErrorMessages();
    this.bindFormEvents();
    this.initAccessibilityFeatures();
  }

  setupValidationRules() {
    // 通用验证规则
    this.validationRules.set('required', {
      validate: (value) => value && value.trim().length > 0,
      priority: 1
    });

    this.validationRules.set('email', {
      validate: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !value || emailRegex.test(value);
      },
      priority: 2
    });

    this.validationRules.set('url', {
      validate: (value) => {
        if (!value) return true;
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      },
      priority: 2
    });

    // 烟草笔记特定验证
    this.validationRules.set('tobacco-category', {
      validate: (value) => {
        const validCategories = ['cigars', 'cigarettes', 'pipe', 'ryo', 'snus', 'ecig'];
        return validCategories.includes(value);
      },
      priority: 1
    });

    this.validationRules.set('rating', {
      validate: (value) => {
        const num = parseFloat(value);
        return !isNaN(num) && num >= 0 && num <= 10;
      },
      priority: 2
    });

    this.validationRules.set('date-format', {
      validate: (value) => {
        if (!value) return true;
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(value)) return false;
        const date = new Date(value);
        return date instanceof Date && !isNaN(date);
      },
      priority: 2
    });

    this.validationRules.set('length', {
      validate: (value, params) => {
        if (!value) return true;
        const { min = 0, max = Infinity } = params || {};
        return value.length >= min && value.length <= max;
      },
      priority: 3
    });

    this.validationRules.set('brand-name', {
      validate: (value) => {
        if (!value) return true;
        // 允许字母、数字、空格、常见符号
        const brandRegex = /^[a-zA-Z0-9\s\-&'.()]+$/;
        return brandRegex.test(value) && value.length <= 100;
      },
      priority: 2
    });
  }

  setupErrorMessages() {
    this.errorMessages.set('required', '此字段为必填项');
    this.errorMessages.set('email', '请输入有效的电子邮件地址');
    this.errorMessages.set('url', '请输入有效的URL地址');
    this.errorMessages.set('tobacco-category', '请选择有效的烟草分类');
    this.errorMessages.set('rating', '评分必须在0-10之间');
    this.errorMessages.set('date-format', '请使用YYYY-MM-DD格式');
    this.errorMessages.set('length', '字符长度不符合要求');
    this.errorMessages.set('brand-name', '品牌名称包含无效字符或过长');
  }

  bindFormEvents() {
    // 绑定所有表单的验证事件
    document.addEventListener('DOMContentLoaded', () => {
      this.initializeForms();
    });

    // 实时验证
    document.addEventListener('input', (e) => {
      if (this.realTimeValidation && e.target.matches('[data-validate]')) {
        this.validateField(e.target);
      }
    });

    // 表单提交验证
    document.addEventListener('submit', (e) => {
      if (e.target.matches('form[data-validation]')) {
        if (!this.validateForm(e.target)) {
          e.preventDefault();
          this.focusFirstError(e.target);
        }
      }
    });

    // 失焦验证
    document.addEventListener('blur', (e) => {
      if (e.target.matches('[data-validate]')) {
        this.validateField(e.target, true);
      }
    }, true);
  }

  initializeForms() {
    const forms = document.querySelectorAll('form[data-validation]');
    forms.forEach(form => {
      this.setupFormValidation(form);
    });
  }

  setupFormValidation(form) {
    // 添加无障碍属性
    form.setAttribute('novalidate', 'true');
    
    // 创建错误容器
    if (!form.querySelector('.validation-errors')) {
      const errorContainer = document.createElement('div');
      errorContainer.className = 'validation-errors';
      errorContainer.setAttribute('aria-live', 'polite');
      errorContainer.setAttribute('role', 'alert');
      form.insertBefore(errorContainer, form.firstChild);
    }

    // 为每个验证字段添加错误显示区域
    const fields = form.querySelectorAll('[data-validate]');
    fields.forEach(field => {
      this.setupFieldValidation(field);
    });
  }

  setupFieldValidation(field) {
    // 添加 ARIA 属性
    if (!field.getAttribute('aria-describedby')) {
      const errorId = `${field.id || 'field'}-error`;
      field.setAttribute('aria-describedby', errorId);
      
      // 创建错误显示元素
      const errorElement = document.createElement('div');
      errorElement.id = errorId;
      errorElement.className = 'field-error';
      errorElement.setAttribute('role', 'alert');
      errorElement.style.display = 'none';
      
      field.parentNode.insertBefore(errorElement, field.nextSibling);
    }
  }

  validateField(field, showError = false) {
    const rules = field.getAttribute('data-validate').split(',');
    const value = field.value;
    const errors = [];

    // 按优先级排序规则
    const sortedRules = rules.map(rule => {
      const [ruleName, ...params] = rule.trim().split(':');
      return {
        name: ruleName,
        params: params.join(':'),
        priority: this.validationRules.get(ruleName)?.priority || 999
      };
    }).sort((a, b) => a.priority - b.priority);

    // 验证所有规则
    for (const rule of sortedRules) {
      const validator = this.validationRules.get(rule.name);
      if (validator) {
        let isValid;
        if (rule.params) {
          try {
            const params = JSON.parse(rule.params);
            isValid = validator.validate(value, params);
          } catch {
            isValid = validator.validate(value, rule.params);
          }
        } else {
          isValid = validator.validate(value);
        }

        if (!isValid) {
          errors.push(rule.name);
          break; // 只显示第一个错误
        }
      }
    }

    // 更新字段状态
    this.updateFieldStatus(field, errors, showError);
    return errors.length === 0;
  }

  updateFieldStatus(field, errors, showError) {
    const errorElement = document.getElementById(field.getAttribute('aria-describedby'));
    const hasErrors = errors.length > 0;

    // 更新字段样式
    field.classList.toggle('is-invalid', hasErrors);
    field.classList.toggle('is-valid', !hasErrors && field.value);
    field.setAttribute('aria-invalid', hasErrors ? 'true' : 'false');

    // 更新错误信息
    if (errorElement) {
      if (hasErrors && showError) {
        const errorMessage = this.errorMessages.get(errors[0]) || '输入无效';
        errorElement.textContent = errorMessage;
        errorElement.style.display = 'block';
        errorElement.setAttribute('aria-hidden', 'false');
      } else {
        errorElement.style.display = 'none';
        errorElement.setAttribute('aria-hidden', 'true');
      }
    }
  }

  validateForm(form) {
    const fields = form.querySelectorAll('[data-validate]');
    let isValid = true;
    const errors = [];

    fields.forEach(field => {
      const fieldValid = this.validateField(field, true);
      if (!fieldValid) {
        isValid = false;
        errors.push({
          field: field,
          name: field.name || field.id,
          label: this.getFieldLabel(field)
        });
      }
    });

    // 更新表单级别的错误显示
    this.updateFormErrors(form, errors);
    
    // 触发自定义事件
    form.dispatchEvent(new CustomEvent('validationComplete', {
      detail: { isValid, errors }
    }));

    return isValid;
  }

  updateFormErrors(form, errors) {
    const errorContainer = form.querySelector('.validation-errors');
    if (!errorContainer) return;

    if (errors.length > 0) {
      const errorList = document.createElement('ul');
      errorList.className = 'validation-error-list';
      
      errors.forEach(error => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="#${error.field.id}">${error.label || error.name}: 请检查输入</a>`;
        errorList.appendChild(li);
      });

      errorContainer.innerHTML = '<h3>请修正以下错误：</h3>';
      errorContainer.appendChild(errorList);
      errorContainer.style.display = 'block';
    } else {
      errorContainer.style.display = 'none';
    }
  }

  getFieldLabel(field) {
    // 尝试多种方式获取字段标签
    const label = field.labels?.[0]?.textContent ||
                 document.querySelector(`label[for="${field.id}"]`)?.textContent ||
                 field.getAttribute('aria-label') ||
                 field.getAttribute('placeholder') ||
                 field.name;
    
    return label?.replace('*', '').trim();
  }

  focusFirstError(form) {
    const firstErrorField = form.querySelector('.is-invalid');
    if (firstErrorField) {
      firstErrorField.focus();
      firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  initAccessibilityFeatures() {
    // 键盘导航增强
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.matches('[data-validate]')) {
        // Enter键验证当前字段
        this.validateField(e.target, true);
      }
    });

    // 为表单添加提交状态指示
    document.addEventListener('submit', (e) => {
      if (e.target.matches('form[data-validation]')) {
        const submitButton = e.target.querySelector('[type="submit"]');
        if (submitButton) {
          submitButton.setAttribute('aria-busy', 'true');
          submitButton.textContent = '验证中...';
          
          setTimeout(() => {
            submitButton.setAttribute('aria-busy', 'false');
            submitButton.textContent = submitButton.getAttribute('data-original-text') || '提交';
          }, 1000);
        }
      }
    });
  }

  // 公共API方法
  addValidationRule(name, validator, message, priority = 5) {
    this.validationRules.set(name, { validate: validator, priority });
    this.errorMessages.set(name, message);
  }

  setRealTimeValidation(enabled) {
    this.realTimeValidation = enabled;
  }

  validateSingleField(fieldSelector) {
    const field = document.querySelector(fieldSelector);
    if (field) {
      return this.validateField(field, true);
    }
    return false;
  }

  clearValidation(formSelector) {
    const form = document.querySelector(formSelector);
    if (form) {
      const fields = form.querySelectorAll('[data-validate]');
      fields.forEach(field => {
        field.classList.remove('is-invalid', 'is-valid');
        field.setAttribute('aria-invalid', 'false');
        
        const errorElement = document.getElementById(field.getAttribute('aria-describedby'));
        if (errorElement) {
          errorElement.style.display = 'none';
        }
      });
      
      const errorContainer = form.querySelector('.validation-errors');
      if (errorContainer) {
        errorContainer.style.display = 'none';
      }
    }
  }

  // 特殊验证器：烟草笔记内容验证
  validateTobaccoNote(noteData) {
    const errors = [];
    
    // 必要字段检查
    if (!noteData.title?.trim()) {
      errors.push('标题不能为空');
    }
    
    if (!noteData.category || !['cigars', 'cigarettes', 'pipe', 'ryo', 'snus', 'ecig'].includes(noteData.category)) {
      errors.push('必须选择有效的烟草分类');
    }
    
    if (!noteData.date || !/^\d{4}-\d{2}-\d{2}$/.test(noteData.date)) {
      errors.push('日期格式无效');
    }
    
    // 评分验证
    if (noteData.rating !== undefined) {
      const rating = parseFloat(noteData.rating);
      if (isNaN(rating) || rating < 0 || rating > 10) {
        errors.push('评分必须在0-10之间');
      }
    }
    
    // 内容长度检查
    if (noteData.description && noteData.description.length > 5000) {
      errors.push('描述内容过长（最多5000字符）');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// 初始化表单验证管理器
document.addEventListener('DOMContentLoaded', () => {
  window.formValidationManager = new FormValidationManager();
});

// 导出供测试使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FormValidationManager;
}