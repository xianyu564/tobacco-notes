// 键盘快捷键支持
document.addEventListener('keydown', e => {
  // ⌘K / Ctrl+K：聚焦搜索框
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    const search = document.getElementById('q');
    search.focus();
  }

  // ESC：清空搜索/失焦
  if (e.key === 'Escape') {
    const search = document.getElementById('q');
    if (document.activeElement === search) {
      search.value = '';
      search.blur();
      // 触发 input 事件以重置列表
      search.dispatchEvent(new Event('input'));
    }
  }

  // 数字键 1-6：快速跳转到分类
  if (e.key >= '1' && e.key <= '6' && !e.metaKey && !e.ctrlKey && !e.altKey) {
    const categories = ['cigars', 'cigarettes', 'pipe', 'ryo', 'snus', 'ecig'];
    const index = parseInt(e.key) - 1;
    if (categories[index]) {
      e.preventDefault();
      const el = document.getElementById(categories[index]);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }
});

// Tab 键导航提示
function handleFirstTab(e) {
  if (e.key === 'Tab') {
    document.body.classList.add('user-is-tabbing');
    window.removeEventListener('keydown', handleFirstTab);
  }
}
window.addEventListener('keydown', handleFirstTab);
