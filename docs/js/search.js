// 搜索功能优化
class SearchManager {
  constructor() {
    this.searchIndex = null;
    this.searchData = null;
    this.searchInput = document.getElementById('q');
    this.searchResults = document.getElementById('search-results');
    this.debounceTimeout = null;
    this.selectedIndex = -1;
    
    // 筛选器元素
    this.categoryFilter = document.getElementById('category-filter');
    this.dateFilter = document.getElementById('date-filter');
    this.ratingFilter = document.getElementById('rating-filter');
    this.clearFiltersBtn = document.getElementById('clear-filters');
    
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
      
      // 使用简单搜索算法替代 Fuse.js
      this.searchIndex = {
        search: (query) => {
          if (!query) return [];
          
          const queryLower = query.toLowerCase();
          const results = this.searchData
            .map((item, index) => {
              let score = 0;
              
              // 标题匹配
              if (item.title && item.title.toLowerCase().includes(queryLower)) {
                score += 0.4;
              }
              
              // 分类匹配
              if (item.category && item.category.toLowerCase().includes(queryLower)) {
                score += 0.3;
              }
              
              // 作者匹配
              if (item.author && item.author.toLowerCase().includes(queryLower)) {
                score += 0.2;
              }
              
              // 标签匹配
              if (item.tags && item.tags.some(tag => 
                tag.toLowerCase().includes(queryLower))) {
                score += 0.1;
              }
              
              // 搜索文本匹配
              if (item.search_text && item.search_text.includes(queryLower)) {
                score += 0.1;
              }
              
              return score > 0 ? { item, score: 1 - score, refIndex: index } : null;
            })
            .filter(result => result !== null)
            .sort((a, b) => a.score - b.score);
            
          return results;
        }
      };
      
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
    
    // 筛选器事件
    if (this.categoryFilter) {
      this.categoryFilter.addEventListener('change', () => {
        this.handleFilterChange();
      });
    }
    
    if (this.dateFilter) {
      this.dateFilter.addEventListener('change', () => {
        this.handleFilterChange();
      });
    }
    
    if (this.ratingFilter) {
      this.ratingFilter.addEventListener('change', () => {
        this.handleFilterChange();
      });
    }
    
    if (this.clearFiltersBtn) {
      this.clearFiltersBtn.addEventListener('click', () => {
        this.clearFilters();
      });
    }
    
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
    
    // 空查询处理 - 但如果有活动筛选器，仍然需要搜索
    if (!query && !this.hasActiveFilters()) {
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
      let results;
      
      // 如果有查询词，执行搜索
      if (query) {
        results = this.searchIndex.search(query);
      } else {
        // 如果没有查询词但有活动筛选器，显示所有符合筛选条件的结果
        if (this.hasActiveFilters()) {
          results = this.searchData.map((item, index) => ({
            item: item,
            score: 0,
            refIndex: index
          }));
        } else {
          this.hideResults();
          return;
        }
      }
      
      // 应用筛选器
      const filteredResults = this.applyFilters(results);
      
      // 限制结果数量
      const limitedResults = filteredResults.slice(0, 10);
      
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
            ${item.rating ? `<span class="rating">评分: ${item.rating}</span>` : ''}
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
  
  // 筛选器相关方法
  handleFilterChange() {
    // 触发搜索以应用筛选器
    const query = this.searchInput.value.trim();
    if (query || this.hasActiveFilters()) {
      this.performSearch(query);
    } else {
      this.hideResults();
    }
  }
  
  hasActiveFilters() {
    return (this.categoryFilter && this.categoryFilter.value) ||
           (this.dateFilter && this.dateFilter.value) ||
           (this.ratingFilter && this.ratingFilter.value);
  }
  
  clearFilters() {
    if (this.categoryFilter) this.categoryFilter.value = '';
    if (this.dateFilter) this.dateFilter.value = '';
    if (this.ratingFilter) this.ratingFilter.value = '';
    
    // 重新执行搜索
    const query = this.searchInput.value.trim();
    if (query) {
      this.performSearch(query);
    } else {
      this.hideResults();
    }
  }
  
  applyFilters(results) {
    let filteredResults = results;
    
    // 分类筛选
    if (this.categoryFilter && this.categoryFilter.value) {
      const category = this.categoryFilter.value;
      filteredResults = filteredResults.filter(result => 
        result.item.category === category
      );
    }
    
    // 日期筛选
    if (this.dateFilter && this.dateFilter.value) {
      const dateFilter = this.dateFilter.value;
      const now = new Date();
      let cutoffDate;
      
      switch (dateFilter) {
        case 'week':
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '3months':
          cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoffDate = null;
      }
      
      if (cutoffDate) {
        filteredResults = filteredResults.filter(result => {
          const itemDate = new Date(result.item.date);
          return itemDate >= cutoffDate;
        });
      }
    }
    
    // 评分筛选
    if (this.ratingFilter && this.ratingFilter.value) {
      const ratingFilter = this.ratingFilter.value;
      filteredResults = filteredResults.filter(result => {
        const rating = result.item.rating;
        if (!rating) return false;
        
        const normalizedRating = this.normalizeRating(rating);
        if (normalizedRating === null) return false;
        
        switch (ratingFilter) {
          case 'high':
            return normalizedRating >= 0.8; // ≥4/5 或 ≥80/100
          case 'medium':
            return normalizedRating >= 0.6 && normalizedRating < 0.8; // 3-3.9/5 或 60-79/100
          case 'low':
            return normalizedRating < 0.6; // <3/5 或 <60/100
          default:
            return true;
        }
      });
    }
    
    return filteredResults;
  }
  
  normalizeRating(rating) {
    if (!rating) return null;
    
    const ratingStr = rating.toString();
    
    // 处理 X/5 格式
    if (ratingStr.includes('/5')) {
      const value = parseFloat(ratingStr.split('/')[0]);
      return value / 5; // 转换为 0-1 范围
    }
    
    // 处理 X/100 格式
    if (ratingStr.includes('/100')) {
      const value = parseFloat(ratingStr.split('/')[0]);
      return value / 100; // 转换为 0-1 范围
    }
    
    return null;
  }
}

// 初始化搜索管理器
document.addEventListener('DOMContentLoaded', () => {
  window.searchManager = new SearchManager();
});