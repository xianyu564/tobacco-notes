// 搜索功能增强
class SearchManager {
  constructor() {
    this.searchInput = document.getElementById('q');
    this.dropdown = document.querySelector('.search-dropdown');
    this.latestList = document.getElementById('latest-list');
    this.searchResults = [];
    this.allNotes = [];
    this.currentPage = 1;
    this.perPage = 20;
    this.searchDebounceTimer = null;
    
    // 绑定事件处理器
    this.bindEvents();
  }

  async init() {
    // 加载所有笔记数据
    this.allNotes = await this.loadNotes();
    // 初始化显示
    this.renderNotes(this.allNotes.slice(0, this.perPage));
  }

  async loadNotes() {
    try {
      const [latest, all] = await Promise.all([
        fetch('./data/latest.json').then(r => r.json()),
        fetch('./data/index.json').then(r => r.json())
      ]);
      return all; // 使用完整数据集
    } catch (e) {
      console.error('Failed to load notes:', e);
      return [];
    }
  }

  bindEvents() {
    // 搜索输入
    this.searchInput.addEventListener('input', () => {
      clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = setTimeout(() => this.handleSearch(), 200);
    });

    // 键盘导航
    this.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        this.handleKeyboardNav(e.key === 'ArrowDown' ? 1 : -1);
      }
      if (e.key === 'Enter' && this.dropdown && !this.dropdown.hidden) {
        e.preventDefault();
        const selected = this.dropdown.querySelector('.selected');
        if (selected) selected.click();
      }
    });

    // 点击外部关闭下拉
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search, .search-dropdown')) {
        this.hideDropdown();
      }
    });

    // 加载更多
    const loadMoreBtn = document.querySelector('.load-more');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => this.loadMore());
    }
  }

  handleSearch() {
    const query = this.searchInput.value.trim().toLowerCase();
    if (!query) {
      this.resetSearch();
      return;
    }

    // 执行搜索
    this.searchResults = this.allNotes.filter(note => 
      note.title.toLowerCase().includes(query) ||
      note.category.toLowerCase().includes(query) ||
      (note.author && note.author.toLowerCase().includes(query))
    );

    // 更新显示
    this.currentPage = 1;
    this.renderSearchResults();
    this.updateDropdown();
  }

  renderSearchResults() {
    const start = (this.currentPage - 1) * this.perPage;
    const end = start + this.perPage;
    const toShow = this.searchResults.slice(start, end);
    
    this.renderNotes(toShow, this.currentPage === 1);
    this.updateLoadMoreButton();
  }

  renderNotes(notes, replace = true) {
    if (replace) {
      this.latestList.innerHTML = '';
    }

    const fragment = document.createDocumentFragment();
    notes.forEach(note => {
      const li = this.createNoteElement(note);
      fragment.appendChild(li);
    });

    this.latestList.appendChild(fragment);
  }

  createNoteElement(note) {
    const li = document.createElement('li');
    li.className = 'note-item';
    
    const date = document.createElement('span');
    date.className = 'date';
    date.textContent = note.date;
    
    const category = document.createElement('span');
    category.className = 'cat';
    category.textContent = `[${note.category}]`;
    
    const link = document.createElement('a');
    link.href = `../${note.path}`;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = note.title;
    
    const author = document.createElement('span');
    author.className = 'author';
    author.textContent = note.author ? ` @${note.author}` : '';
    
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy';
    copyBtn.textContent = '复制链接';
    copyBtn.onclick = async (e) => {
      e.preventDefault();
      const url = `${location.origin}/${note.path}`;
      try {
        await navigator.clipboard.writeText(url);
        copyBtn.textContent = '已复制';
        setTimeout(() => copyBtn.textContent = '复制链接', 1200);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    };

    li.append(date, category, link, author, copyBtn);
    return li;
  }

  updateDropdown() {
    if (!this.searchResults.length) {
      this.hideDropdown();
      return;
    }

    const fragment = document.createDocumentFragment();
    this.searchResults.slice(0, 5).forEach((note, idx) => {
      const div = document.createElement('div');
      div.className = 'dropdown-item' + (idx === 0 ? ' selected' : '');
      div.innerHTML = `
        <span class="cat">[${note.category}]</span>
        <span class="title">${note.title}</span>
        ${note.author ? `<span class="author">@${note.author}</span>` : ''}
      `;
      div.onclick = () => {
        window.location.href = `../${note.path}`;
      };
      fragment.appendChild(div);
    });

    this.dropdown.innerHTML = '';
    this.dropdown.appendChild(fragment);
    this.dropdown.hidden = false;
  }

  hideDropdown() {
    if (this.dropdown) {
      this.dropdown.hidden = true;
    }
  }

  handleKeyboardNav(direction) {
    if (this.dropdown.hidden) return;
    
    const items = Array.from(this.dropdown.children);
    const currentIdx = items.findIndex(item => item.classList.contains('selected'));
    let nextIdx = currentIdx + direction;
    
    if (nextIdx < 0) nextIdx = items.length - 1;
    if (nextIdx >= items.length) nextIdx = 0;
    
    items.forEach((item, idx) => {
      item.classList.toggle('selected', idx === nextIdx);
    });
  }

  resetSearch() {
    this.searchResults = this.allNotes;
    this.currentPage = 1;
    this.renderNotes(this.allNotes.slice(0, this.perPage));
    this.hideDropdown();
    this.updateLoadMoreButton();
  }

  loadMore() {
    const start = this.currentPage * this.perPage;
    const end = start + this.perPage;
    const toShow = this.searchResults.slice(start, end);
    
    if (toShow.length) {
      this.currentPage++;
      this.renderNotes(toShow, false);
      this.updateLoadMoreButton();
    }
  }

  updateLoadMoreButton() {
    const btn = document.querySelector('.load-more');
    if (!btn) return;

    const hasMore = this.searchResults.length > this.currentPage * this.perPage;
    btn.hidden = !hasMore;
  }
}

// 初始化搜索管理器
document.addEventListener('DOMContentLoaded', () => {
  window.searchManager = new SearchManager();
  window.searchManager.init();
});
