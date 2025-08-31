// Tag aggregation and browsing functionality
class TagManager {
  constructor() {
    this.tagData = null;
    this.filteredResults = [];
    this.currentFilter = '';
    this.currentCategoryFilter = '';
    
    this.initializeElements();
    this.bindEvents();
  }

  async init() {
    await this.loadTagData();
    this.renderSummary();
    this.renderFeaturedCollections();
    this.renderPopularTags();
    this.setupFiltering();
  }

  initializeElements() {
    // Get DOM elements
    this.elements = {
      totalTags: document.getElementById('total-tags'),
      taggedNotes: document.getElementById('tagged-notes'),
      featuredCollections: document.getElementById('featured-collections'),
      tagCloud: document.getElementById('tag-cloud'),
      tagSearch: document.getElementById('tag-search'),
      categoryFilter: document.getElementById('tag-category-filter'),
      filteredResults: document.getElementById('filtered-tag-results')
    };
  }

  bindEvents() {
    // Tag search input
    if (this.elements.tagSearch) {
      this.elements.tagSearch.addEventListener('input', (e) => {
        this.currentFilter = e.target.value.trim().toLowerCase();
        this.filterTags();
      });
    }

    // Category filter
    if (this.elements.categoryFilter) {
      this.elements.categoryFilter.addEventListener('change', (e) => {
        this.currentCategoryFilter = e.target.value;
        this.filterTags();
      });
    }

    // Tag click handlers (will be added dynamically)
    document.addEventListener('click', (e) => {
      if (e.target.matches('.tag-item[data-tag]')) {
        e.preventDefault();
        const tag = e.target.dataset.tag;
        this.showNotesForTag(tag);
      }
    });
  }

  async loadTagData() {
    try {
      // Load simple tag data first for faster UI updates
      const response = await fetch('./data/tags-simple.json');
      this.tagData = await response.json();
    } catch (error) {
      console.error('Failed to load tag data:', error);
      this.tagData = {
        summary: { total_tags: 0, total_notes_with_tags: 0 },
        popular_tags: [],
        featured_collections: []
      };
    }
  }

  renderSummary() {
    if (this.elements.totalTags && this.tagData.summary) {
      this.elements.totalTags.textContent = this.tagData.summary.total_tags || 0;
    }
    if (this.elements.taggedNotes && this.tagData.summary) {
      this.elements.taggedNotes.textContent = this.tagData.summary.total_notes_with_tags || 0;
    }
  }

  renderFeaturedCollections() {
    if (!this.elements.featuredCollections || !this.tagData.featured_collections) return;

    const collections = this.tagData.featured_collections;
    this.elements.featuredCollections.innerHTML = '';

    collections.forEach(collection => {
      const collectionEl = this.createElement('div', {
        class: `featured-collection ${collection.type}-collection`,
        'data-collection': collection.id
      }, [
        this.createElement('h4', {}, [collection.title]),
        this.createElement('p', { class: 'collection-description' }, [collection.description]),
        this.createElement('div', { class: 'collection-tags' }, 
          collection.tags.map(tag => 
            this.createElement('button', {
              class: 'tag-item featured-tag',
              'data-tag': tag,
              'aria-label': `查看标签 ${tag} 的笔记`
            }, [tag])
          )
        )
      ]);

      this.elements.featuredCollections.appendChild(collectionEl);
    });
  }

  renderPopularTags() {
    if (!this.elements.tagCloud || !this.tagData.popular_tags) return;

    this.elements.tagCloud.innerHTML = '';

    // Create tag cloud with different sizes based on frequency
    const maxCount = Math.max(...this.tagData.popular_tags.map(t => t.count));
    
    this.tagData.popular_tags.forEach(tagInfo => {
      const { tag, count } = tagInfo;
      const weight = Math.ceil((count / maxCount) * 5); // 1-5 scale
      
      const tagEl = this.createElement('button', {
        class: `tag-item popular-tag tag-weight-${weight}`,
        'data-tag': tag,
        'data-count': count,
        'aria-label': `查看标签 ${tag} 的 ${count} 篇笔记`
      }, [
        this.createElement('span', { class: 'tag-name' }, [tag]),
        this.createElement('span', { class: 'tag-count' }, [`(${count})`])
      ]);

      this.elements.tagCloud.appendChild(tagEl);
    });
  }

  setupFiltering() {
    // Initial state - show all popular tags
    this.filterTags();
  }

  filterTags() {
    if (!this.tagData.popular_tags) return;

    let filtered = [...this.tagData.popular_tags];

    // Apply text filter
    if (this.currentFilter) {
      filtered = filtered.filter(tagInfo => 
        tagInfo.tag.toLowerCase().includes(this.currentFilter)
      );
    }

    // Apply category filter (this would require loading full tag data)
    if (this.currentCategoryFilter) {
      // For now, just show message that this requires loading more data
      if (!this.fullTagData) {
        this.loadFullTagData().then(() => this.filterTags());
        return;
      }
      // Filter logic would go here
    }

    this.renderFilteredResults(filtered);
  }

  renderFilteredResults(filteredTags) {
    if (!this.elements.filteredResults) return;

    if (filteredTags.length === 0) {
      this.elements.filteredResults.innerHTML = 
        '<p class="no-results">没有找到匹配的标签</p>';
      return;
    }

    this.elements.filteredResults.innerHTML = '';
    
    // Create a list of filtered tags
    const resultsList = this.createElement('div', { class: 'filtered-tags-list' });
    
    filteredTags.forEach(tagInfo => {
      const { tag, count } = tagInfo;
      const tagEl = this.createElement('button', {
        class: 'tag-item filtered-tag',
        'data-tag': tag,
        'aria-label': `查看标签 ${tag} 的 ${count} 篇笔记`
      }, [
        this.createElement('span', { class: 'tag-name' }, [tag]),
        this.createElement('span', { class: 'tag-count' }, [`${count} 篇`])
      ]);

      resultsList.appendChild(tagEl);
    });

    this.elements.filteredResults.appendChild(resultsList);
  }

  async loadFullTagData() {
    if (this.fullTagData) return;
    
    try {
      const response = await fetch('./data/tags.json');
      this.fullTagData = await response.json();
    } catch (error) {
      console.error('Failed to load full tag data:', error);
    }
  }

  async showNotesForTag(tag) {
    // Load full tag data if not already loaded
    if (!this.fullTagData) {
      await this.loadFullTagData();
    }

    if (!this.fullTagData || !this.fullTagData.tag_to_notes) {
      console.error('Full tag data not available');
      return;
    }

    const notes = this.fullTagData.tag_to_notes[tag];
    if (!notes || notes.length === 0) {
      alert(`没有找到标签 "${tag}" 的笔记`);
      return;
    }

    // Create a modal or dedicated section to show notes for this tag
    this.displayTagNotes(tag, notes);
  }

  displayTagNotes(tag, notes) {
    // Create modal overlay
    const modal = this.createElement('div', {
      class: 'tag-modal-overlay',
      'aria-labelledby': 'tag-modal-title',
      'role': 'dialog'
    });

    const modalContent = this.createElement('div', { class: 'tag-modal-content' }, [
      this.createElement('header', { class: 'tag-modal-header' }, [
        this.createElement('h3', { id: 'tag-modal-title' }, [`标签: ${tag}`]),
        this.createElement('button', {
          class: 'tag-modal-close',
          'aria-label': '关闭'
        }, ['×'])
      ]),
      this.createElement('div', { class: 'tag-modal-body' }, [
        this.createElement('p', {}, [`找到 ${notes.length} 篇包含标签 "${tag}" 的笔记：`]),
        this.createElement('ul', { class: 'tag-notes-list' },
          notes.map(note => 
            this.createElement('li', { class: 'tag-note-item' }, [
              this.createElement('span', { class: 'note-date' }, [note.date]),
              this.createElement('span', { class: 'note-category' }, [`[${note.category}]`]),
              this.createElement('a', {
                href: `../${note.path}`,
                target: '_blank',
                rel: 'noopener'
              }, [note.title]),
              note.rating ? this.createElement('span', { class: 'note-rating' }, [note.rating]) : null
            ].filter(Boolean))
          )
        )
      ])
    ]);

    modal.appendChild(modalContent);

    // Event handlers
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.matches('.tag-modal-close')) {
        document.body.removeChild(modal);
      }
    });

    // Keyboard handler
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        document.body.removeChild(modal);
        document.removeEventListener('keydown', handleKeyDown);
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    document.body.appendChild(modal);
  }

  // Utility function to create DOM elements
  createElement(tag, attrs = {}, children = []) {
    const element = document.createElement(tag);
    
    Object.entries(attrs).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        element.setAttribute(key, value);
      }
    });
    
    children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else if (child) {
        element.appendChild(child);
      }
    });
    
    return element;
  }
}

// Initialize tag manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('tags')) {
    console.log('Initializing TagManager on DOMContentLoaded...');
    window.tagManager = new TagManager();
    window.tagManager.init().catch(error => {
      console.error('TagManager initialization failed:', error);
    });
  }
});

// Fallback initialization for lazy loaded content
if (document.readyState === 'loading') {
  // DOM is still loading, wait for DOMContentLoaded
} else {
  // DOM is already loaded, initialize immediately if section exists
  if (document.getElementById('tags') && !window.tagManager) {
    console.log('Initializing TagManager immediately...');
    window.tagManager = new TagManager();
    window.tagManager.init().catch(error => {
      console.error('TagManager initialization failed:', error);
    });
  }
}