// 笔记渲染与交互增强
class NotesManager {
  constructor() {
    this.categories = ['cigars', 'cigarettes', 'pipe', 'ryo', 'snus', 'ecig'];
    this.categoryData = {};
    this.observers = new Map();
    
    this.initIntersectionObserver();
    this.bindEvents();
  }

  async init() {
    await this.loadData();
    this.renderCategories();
    this.initLazyLoading();
  }

  async loadData() {
    try {
      const data = await fetch('./data/index.json').then(r => r.json());
      // 按分类组织数据
      this.categories.forEach(cat => {
        this.categoryData[cat] = data.filter(n => n.category === cat);
      });
    } catch (e) {
      console.error('Failed to load notes data:', e);
    }
  }

  initIntersectionObserver() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const block = entry.target;
            const category = block.dataset.category;
            if (category && !block.dataset.loaded) {
              this.loadCategoryNotes(category);
              block.dataset.loaded = 'true';
            }
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    );
  }

  bindEvents() {
    // 分类标签点击
    document.querySelectorAll('.badge[data-category]').forEach(badge => {
      badge.addEventListener('click', (e) => {
        e.preventDefault();
        const category = e.target.dataset.category;
        this.scrollToCategory(category);
      });
    });

    // 加载更多按钮
    document.addEventListener('click', (e) => {
      if (e.target.matches('.load-more[data-category]')) {
        const category = e.target.dataset.category;
        this.loadMoreForCategory(category);
      }
    });
  }

  renderCategories() {
    const container = document.getElementById('by-category');
    if (!container) return;

    container.innerHTML = '';
    this.categories.forEach(category => {
      const block = this.createCategoryBlock(category);
      container.appendChild(block);
      // 观察分类块
      this.observer.observe(block);
    });
  }

  createCategoryBlock(category) {
    const block = document.createElement('div');
    block.className = 'category-block';
    block.id = category;
    block.dataset.category = category;

    const header = document.createElement('h3');
    header.textContent = category;
    
    const count = document.createElement('span');
    count.className = 'count';
    count.textContent = ` (${this.categoryData[category]?.length || 0})`;
    header.appendChild(count);

    const list = document.createElement('ul');
    list.className = 'note-list';

    block.append(header, list);

    // 如果有更多笔记，添加加载更多按钮
    if ((this.categoryData[category]?.length || 0) > 10) {
      const loadMore = document.createElement('button');
      loadMore.className = 'btn load-more';
      loadMore.dataset.category = category;
      loadMore.textContent = `加载更多 ${category} 笔记`;
      block.appendChild(loadMore);
    }

    return block;
  }

  loadCategoryNotes(category, start = 0, limit = 10) {
    const notes = this.categoryData[category]?.slice(start, start + limit);
    if (!notes?.length) return;

    const list = document.querySelector(`#${category} .note-list`);
    if (!list) return;

    const fragment = document.createDocumentFragment();
    notes.forEach(note => {
      const li = this.createNoteElement(note);
      fragment.appendChild(li);
    });

    list.appendChild(fragment);

    // 更新加载更多按钮状态
    const loadMore = document.querySelector(`#${category} .load-more`);
    if (loadMore) {
      const hasMore = (this.categoryData[category]?.length || 0) > start + limit;
      loadMore.hidden = !hasMore;
      if (hasMore) {
        loadMore.onclick = () => this.loadCategoryNotes(category, start + limit, limit);
      }
    }
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

  scrollToCategory(category) {
    const block = document.getElementById(category);
    if (block) {
      block.scrollIntoView({ behavior: 'smooth' });
    }
  }

  loadMoreForCategory(category) {
    const list = document.querySelector(`#${category} .note-list`);
    if (!list) return;

    const currentCount = list.children.length;
    this.loadCategoryNotes(category, currentCount);
  }

  initLazyLoading() {
    // 为图片添加懒加载
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            observer.unobserve(img);
          }
        });
      },
      {
        rootMargin: '50px'
      }
    );

    images.forEach(img => imageObserver.observe(img));
  }
}

// 初始化笔记管理器
document.addEventListener('DOMContentLoaded', () => {
  window.notesManager = new NotesManager();
  window.notesManager.init();
});
