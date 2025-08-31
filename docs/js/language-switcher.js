// 双语切换管理器 | Bilingual Language Switcher
class BilingualSwitcher {
  constructor() {
    this.currentLang = this.detectLanguage();
    this.translations = {
      'zh': {
        'site-title': 'Tobacco Notes｜烟草笔记',
        'site-description': '轻量、开放的烟草品鉴笔记；一键一句话投稿；浏览最新/全部笔记；支持赞助。',
        'nav-home': '首页',
        'nav-notes': '笔记',
        'nav-templates': '模板',
        'nav-contribute': '投稿',
        'nav-about': '关于',
        'switch-to-en': 'English',
        'switch-to-zh': '中文',
        'templates-title': '模板与指引',
        'latest-notes': '最新笔记',
        'all-categories': '所有分类',
        'quick-submit': '快速投稿',
        'standard-submit': '标准投稿',
        'health-warning': '⚠️ 健康提示：本仓库仅用于记录与交流，不鼓励使用。',
        'sponsor-title': '赞助支持',
        'sponsor-desc': '如果本项目对您有帮助，欢迎赞助支持',
        'loading': '加载中...',
        'search-placeholder': '搜索笔记...',
        'filter-by-category': '按分类筛选',
        'filter-by-tags': '按标签筛选'
      },
      'en': {
        'site-title': 'Tobacco Notes | Tasting Notebook',
        'site-description': 'Lightweight, open tasting notebook for cigars, cigarettes, pipe, roll-your-own, snus, e-cigarettes.',
        'nav-home': 'Home',
        'nav-notes': 'Notes',
        'nav-templates': 'Templates',
        'nav-contribute': 'Contribute',
        'nav-about': 'About',
        'switch-to-en': 'English',
        'switch-to-zh': '中文',
        'templates-title': 'Templates & Guidelines',
        'latest-notes': 'Latest Notes',
        'all-categories': 'All Categories',
        'quick-submit': 'Quick Submit',
        'standard-submit': 'Standard Submit',
        'health-warning': '⚠️ Health Note: All forms of tobacco use are harmful; there is no safe level of exposure.',
        'sponsor-title': 'Support This Project',
        'sponsor-desc': 'If this helps, consider sponsoring',
        'loading': 'Loading...',
        'search-placeholder': 'Search notes...',
        'filter-by-category': 'Filter by category',
        'filter-by-tags': 'Filter by tags'
      }
    };
    
    this.init();
  }

  init() {
    this.createLanguageSwitcher();
    this.applyLanguage(this.currentLang);
    this.bindEvents();
    this.updatePageLanguage();
  }

  detectLanguage() {
    // Check URL parameter first
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    if (langParam && ['zh', 'en'].includes(langParam)) {
      return langParam;
    }
    
    // Check localStorage
    const saved = localStorage.getItem('tobacco-notes-lang');
    if (saved && ['zh', 'en'].includes(saved)) {
      return saved;
    }
    
    // Detect from browser
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.includes('zh')) {
      return 'zh';
    }
    
    return 'zh'; // Default to Chinese as the main language
  }

  createLanguageSwitcher() {
    const switcher = document.createElement('div');
    switcher.className = 'language-switcher';
    switcher.innerHTML = `
      <button 
        class="lang-switch-btn ${this.currentLang === 'zh' ? 'active' : ''}" 
        data-lang="zh"
        aria-label="切换到中文"
      >
        中文
      </button>
      <span class="lang-divider">|</span>
      <button 
        class="lang-switch-btn ${this.currentLang === 'en' ? 'active' : ''}" 
        data-lang="en"
        aria-label="Switch to English"
      >
        English
      </button>
    `;

    // Insert into header
    const header = document.querySelector('header') || document.querySelector('nav') || document.body.firstElementChild;
    if (header) {
      header.appendChild(switcher);
    }
  }

  bindEvents() {
    document.addEventListener('click', (e) => {
      if (e.target.matches('.lang-switch-btn')) {
        const newLang = e.target.dataset.lang;
        if (newLang !== this.currentLang) {
          this.switchLanguage(newLang);
        }
      }
    });

    // Handle keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.key === 'l') {
        e.preventDefault();
        this.toggleLanguage();
      }
    });
  }

  switchLanguage(lang) {
    this.currentLang = lang;
    localStorage.setItem('tobacco-notes-lang', lang);
    
    // Update URL parameter for sharing
    const url = new URL(window.location);
    if (lang === 'en') {
      url.searchParams.set('lang', 'en');
    } else {
      url.searchParams.delete('lang');
    }
    window.history.replaceState({}, '', url);
    
    // Update active button
    document.querySelectorAll('.lang-switch-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    
    this.applyLanguage(lang);
    this.updatePageLanguage();
    
    // Trigger custom event for other components
    document.dispatchEvent(new CustomEvent('languageChanged', { 
      detail: { language: lang } 
    }));
  }

  toggleLanguage() {
    const newLang = this.currentLang === 'zh' ? 'en' : 'zh';
    this.switchLanguage(newLang);
  }

  applyLanguage(lang) {
    const translations = this.translations[lang];
    if (!translations) return;

    // Update elements with data-i18n attributes
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.dataset.i18n;
      if (translations[key]) {
        if (element.tagName === 'INPUT' && element.type === 'search') {
          element.placeholder = translations[key];
        } else {
          element.textContent = translations[key];
        }
      }
    });

    // Update title and meta description
    if (translations['site-title']) {
      document.title = translations['site-title'];
    }
    
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && translations['site-description']) {
      metaDesc.content = translations['site-description'];
    }

    // Update specific elements by content
    this.updateBilingualContent(lang);
  }

  updateBilingualContent(lang) {
    // Handle bilingual text that contains both languages
    document.querySelectorAll('.bilingual-text').forEach(element => {
      const text = element.dataset.bilingual || element.textContent;
      if (text.includes('｜') || text.includes(' | ')) {
        const parts = text.split(/｜| \| /);
        if (parts.length >= 2) {
          // Assume format: English | Chinese or Chinese｜English
          const hasChineseFirst = /[\u4e00-\u9fff]/.test(parts[0]);
          if (lang === 'zh') {
            element.textContent = hasChineseFirst ? parts[0] : parts[1];
          } else {
            element.textContent = hasChineseFirst ? parts[1] : parts[0];
          }
        }
      }
    });

    // Handle template cards
    document.querySelectorAll('.template-card h3').forEach(h3 => {
      const text = h3.textContent;
      if (text.includes('｜')) {
        const [zh, en] = text.split('｜');
        h3.textContent = lang === 'zh' ? zh.trim() : en.trim();
      }
    });
  }

  updatePageLanguage() {
    document.documentElement.lang = this.currentLang === 'zh' ? 'zh-CN' : 'en-US';
    
    // Update OpenGraph locale
    const ogLocale = document.querySelector('meta[property="og:locale"]');
    if (ogLocale) {
      ogLocale.content = this.currentLang === 'zh' ? 'zh_CN' : 'en_US';
    }
  }

  // Public API
  getCurrentLanguage() {
    return this.currentLang;
  }

  getTranslation(key) {
    return this.translations[this.currentLang]?.[key] || key;
  }

  // Add translation dynamically
  addTranslations(lang, translations) {
    if (!this.translations[lang]) {
      this.translations[lang] = {};
    }
    Object.assign(this.translations[lang], translations);
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.bilingualSwitcher = new BilingualSwitcher();
  });
} else {
  window.bilingualSwitcher = new BilingualSwitcher();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BilingualSwitcher;
}