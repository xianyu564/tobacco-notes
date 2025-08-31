// 搜索功能优化
class SearchManager {
  constructor() {
    this.searchIndex = null;
    this.searchData = null;
    this.searchInput = document.getElementById('q');
    this.searchResults = document.getElementById('search-results');
    this.debounceTimeout = null;
    this.selectedIndex = -1;
    
    this.init();
  }
  
  async init() {
    // 初始化搜索
    await this.initSearchIndex();
    this.initEventListeners();
  }
  
  async initSearchIndex() {
    try {
      // 加载搜索数据
      const response = await fetch('./data/search-index.json');
      if (!response.ok) throw new Error('Failed to load search index');
      this.searchData = await response.json();
      
      // 构建搜索索引
      this.searchIndex = new Fuse(this.searchData, {
        keys: [
          { name: 'title', weight: 0.4 },
          { name: 'category', weight: 0.3 },
          { name: 'author', weight: 0.2 },
          { name: 'tags', weight: 0.1 }
        ],
        includeScore: true,
        threshold: 0.3,
        distance: 100,
        useExtendedSearch: true,
        ignoreLocation: true
      });
      
      console.log('Search index initialized');
      
    } catch (error) {
      console.error('Failed to initialize search:', error);
    }
  }
  
  initEventListeners() {
    // 输入事件
    this.searchInput.addEventListener('input', () => {
      this.handleSearchInput();
    });
    
    // 键盘导航
    this.searchInput.addEventListener('keydown', (e) => {
      this.handleKeyNavigation(e);
    });
    
    // 点击处理
    document.addEventListener('click', (e) => {
      if (!this.searchInput.contains(e.target) && !this.searchResults.contains(e.target)) {
        this.hideResults();
      }
    });
    
    // 移动设备优化
    if ('ontouchstart' in window) {
      this.initTouchHandlers();
    }
  }
  
  handleSearchInput() {
    const query = this.searchInput.value.trim();
    
    // 清除之前的延时
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    
    // 空查询处理
    if (!query) {
      this.hideResults();
      return;
    }
    
    // 延迟搜索以减少不必要的计算
    this.debounceTimeout = setTimeout(() => {
      this.performSearch(query);
    }, 150);
  }
  
  async performSearch(query) {
    if (!this.searchIndex) {
      console.warn('Search index not ready');
      return;
    }
    
    try {
      // 执行搜索
      const results = this.searchIndex.search(query);
      
      // 限制结果数量
      const limitedResults = results.slice(0, 10);
      
      // 渲染结果
      this.renderResults(limitedResults);
      
    } catch (error) {
      console.error('Search failed:', error);
    }
  }
  
  renderResults(results) {
    if (!results.length) {
      this.searchResults.innerHTML = '<div class="no-results">没有找到匹配的结果</div>';
      this.searchResults.hidden = false;
      return;
    }
    
    const html = results.map((result, index) => {
      const item = result.item;
      const score = Math.round((1 - result.score) * 100);
      
      return `
        <div class="search-result" 
             role="option"
             data-index="${index}"
             aria-selected="${index === this.selectedIndex}"
             tabindex="0">
          <div class="result-title">${this.highlightMatch(item.title)}</div>
          <div class="result-meta">
            <span class="category">${item.category}</span>
            <span class="author">${item.author}</span>
            ${item.tags ? `<span class="tags">${item.tags.join(', ')}</span>` : ''}
          </div>
          <div class="result-score" aria-hidden="true">${score}% 匹配</div>
        </div>
      `;
    }).join('');
    
    this.searchResults.innerHTML = html;
    this.searchResults.hidden = false;
    
    // 添加点击事件处理
    this.searchResults.querySelectorAll('.search-result').forEach(el => {
      el.addEventListener('click', () => {
        const index = parseInt(el.dataset.index);
        this.selectResult(index);
      });
    });
  }
  
  highlightMatch(text) {
    const query = this.searchInput.value.trim();
    if (!query) return text;
    
    // 转义特殊字符
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // 高亮匹配文本
    return text.replace(
      new RegExp(escapedQuery, 'gi'),
      match => `<mark>${match}</mark>`
    );
  }
  
  handleKeyNavigation(e) {
    const results = this.searchResults.querySelectorAll('.search-result');
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, results.length - 1);
        this.updateSelection();
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
        this.updateSelection();
        break;
        
      case 'Enter':
        e.preventDefault();
        if (this.selectedIndex >= 0) {
          this.selectResult(this.selectedIndex);
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        this.hideResults();
        break;
    }
  }
  
  updateSelection() {
    const results = this.searchResults.querySelectorAll('.search-result');
    
    results.forEach((el, index) => {
      el.setAttribute('aria-selected', index === this.selectedIndex);
      if (index === this.selectedIndex) {
        el.scrollIntoView({ block: 'nearest' });
      }
    });
  }
  
  selectResult(index) {
    const results = this.searchIndex.search(this.searchInput.value.trim());
    const selected = results[index];
    if (selected) {
      window.location.href = selected.item.url;
    }
  }
  
  hideResults() {
    this.searchResults.hidden = true;
    this.selectedIndex = -1;
  }
  
  initTouchHandlers() {
    let touchStartY = 0;
    let touchEndY = 0;
    
    this.searchResults.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
    });
    
    this.searchResults.addEventListener('touchmove', (e) => {
      touchEndY = e.touches[0].clientY;
      const deltaY = touchEndY - touchStartY;
      
      // 防止滚动穿透
      if (
        (this.searchResults.scrollTop === 0 && deltaY > 0) ||
        (this.searchResults.scrollHeight - this.searchResults.scrollTop === this.searchResults.clientHeight && deltaY < 0)
      ) {
        e.preventDefault();
      }
    });
  }
}

// 初始化搜索管理器
document.addEventListener('DOMContentLoaded', () => {
  window.searchManager = new SearchManager();
});