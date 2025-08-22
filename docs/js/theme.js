// 主题切换支持
(() => {
  const STORAGE_KEY = 'tobacco-notes-theme';
  const DARK_CLASS = 'theme-dark';
  const LIGHT_CLASS = 'theme-light';

  // 检查系统主题
  function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  // 从 localStorage 获取主题设置
  function getSavedTheme() {
    return localStorage.getItem(STORAGE_KEY);
  }

  // 保存主题设置
  function saveTheme(theme) {
    localStorage.setItem(STORAGE_KEY, theme);
  }

  // 应用主题
  function applyTheme(theme) {
    document.documentElement.classList.remove(DARK_CLASS, LIGHT_CLASS);
    document.documentElement.classList.add(`theme-${theme}`);
    
    // 更新切换按钮图标
    const btn = document.querySelector('.theme-toggle');
    if (btn) {
      btn.textContent = theme === 'dark' ? '🌞' : '🌓';
      btn.setAttribute('aria-label', `切换到${theme === 'dark' ? '亮色' : '暗色'}主题`);
    }
  }

  // 切换主题
  function toggleTheme() {
    const current = getSavedTheme() || getSystemTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    saveTheme(next);
    applyTheme(next);
  }

  // 初始化
  function init() {
    // 添加切换按钮事件监听
    const btn = document.querySelector('.theme-toggle');
    if (btn) {
      btn.addEventListener('click', toggleTheme);
    }

    // 应用初始主题
    const savedTheme = getSavedTheme();
    const initialTheme = savedTheme || getSystemTheme();
    applyTheme(initialTheme);

    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', e => {
      if (!getSavedTheme()) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
