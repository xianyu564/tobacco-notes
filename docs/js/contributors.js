// 贡献者页面功能增强
class ContributorsManager {
  constructor() {
    this.contributorsData = null;
    this.currentView = 'all'; // 'all', 'maintainers', 'contributors'
    this.sortBy = 'contributions'; // 'contributions', 'name', 'date'
    this.sortOrder = 'desc'; // 'asc', 'desc'
    
    this.initEventListeners();
  }

  async init() {
    if (window.location.pathname.includes('contributors')) {
      await this.loadContributorsData();
      this.renderContributorsList();
      this.initFilters();
    } else {
      // For index.html contributor widget
      await this.loadContributorsData();
      this.renderContributorWidget();
    }
  }

  async loadContributorsData() {
    try {
      const response = await fetch('./data/contributors.json');
      this.contributorsData = await response.json();
      return this.contributorsData;
    } catch (error) {
      console.error('Failed to load contributors data:', error);
      // Fallback static data
      this.contributorsData = {
        last_updated: new Date().toISOString(),
        total_contributors: 1,
        contributors: [{
          username: 'xianyu564',
          display_name: 'xianyu564',
          avatar_url: 'https://github.com/xianyu564.png',
          profile_url: 'https://github.com/xianyu564',
          total_contributions: 1,
          notes_count: 0,
          is_maintainer: true,
          bio: 'Repository maintainer'
        }],
        stats: { total_notes: 0, active_contributors: 1 }
      };
      return this.contributorsData;
    }
  }

  initEventListeners() {
    // Sort and filter controls
    document.addEventListener('change', (e) => {
      if (e.target.matches('#contributor-sort')) {
        this.sortBy = e.target.value;
        this.renderContributorsList();
      }
      if (e.target.matches('#contributor-filter')) {
        this.currentView = e.target.value;
        this.renderContributorsList();
      }
    });

    // Toggle sort order
    document.addEventListener('click', (e) => {
      if (e.target.matches('.sort-toggle')) {
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        e.target.textContent = this.sortOrder === 'asc' ? '↑' : '↓';
        this.renderContributorsList();
      }
    });
  }

  initFilters() {
    const container = document.querySelector('#contributors-container');
    if (!container) return;

    const filtersHTML = `
      <div class="contributors-filters" role="toolbar" aria-label="贡献者筛选工具">
        <div class="filter-group">
          <label for="contributor-filter">显示：</label>
          <select id="contributor-filter" aria-label="筛选贡献者类型">
            <option value="all">所有贡献者</option>
            <option value="maintainers">维护者</option>
            <option value="contributors">贡献者</option>
            <option value="active">活跃贡献者</option>
          </select>
        </div>
        <div class="filter-group">
          <label for="contributor-sort">排序：</label>
          <select id="contributor-sort" aria-label="排序方式">
            <option value="contributions">按贡献数</option>
            <option value="name">按姓名</option>
            <option value="date">按加入时间</option>
            <option value="notes">按笔记数</option>
          </select>
          <button class="sort-toggle" aria-label="切换排序方向">↓</button>
        </div>
      </div>
    `;

    container.insertAdjacentHTML('afterbegin', filtersHTML);
  }

  filterContributors(contributors) {
    switch (this.currentView) {
      case 'maintainers':
        return contributors.filter(c => c.is_maintainer);
      case 'contributors':
        return contributors.filter(c => !c.is_maintainer);
      case 'active':
        return contributors.filter(c => c.total_contributions > 0);
      default:
        return contributors;
    }
  }

  sortContributors(contributors) {
    const sortedContributors = [...contributors];
    
    sortedContributors.sort((a, b) => {
      let aValue, bValue;
      
      switch (this.sortBy) {
        case 'name':
          aValue = a.display_name.toLowerCase();
          bValue = b.display_name.toLowerCase();
          break;
        case 'date':
          aValue = new Date(a.join_date);
          bValue = new Date(b.join_date);
          break;
        case 'notes':
          aValue = a.notes_count;
          bValue = b.notes_count;
          break;
        default: // contributions
          aValue = a.total_contributions;
          bValue = b.total_contributions;
      }

      if (this.sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    return sortedContributors;
  }

  renderContributorCard(contributor, isCompact = false) {
    const {
      username,
      display_name,
      avatar_url,
      profile_url,
      total_contributions,
      notes_count,
      is_maintainer,
      bio,
      location,
      last_active
    } = contributor;

    const compactClass = isCompact ? 'contributor-card-compact' : '';
    const maintainerBadge = is_maintainer ? '<span class="maintainer-badge">维护者</span>' : '';
    
    return `
      <div class="contributor-card ${compactClass}" role="article" aria-labelledby="contrib-${username}">
        <div class="contributor-avatar">
          <img 
            src="${avatar_url || 'https://github.com/identicons/' + username + '.png'}" 
            alt="${display_name} 的头像"
            loading="lazy"
            onerror="this.src='https://github.com/identicons/${username}.png'"
          />
          ${maintainerBadge}
        </div>
        <div class="contributor-info">
          <h3 id="contrib-${username}" class="contributor-name">
            <a href="${profile_url}" target="_blank" rel="noopener" aria-label="访问 ${display_name} 的 GitHub 主页">
              ${display_name}
            </a>
          </h3>
          ${bio ? `<p class="contributor-bio">${bio}</p>` : ''}
          ${location ? `<p class="contributor-location">📍 ${location}</p>` : ''}
          <div class="contributor-stats">
            <span class="stat">
              <span class="stat-number">${total_contributions}</span>
              <span class="stat-label">贡献</span>
            </span>
            ${notes_count > 0 ? `
              <span class="stat">
                <span class="stat-number">${notes_count}</span>
                <span class="stat-label">笔记</span>
              </span>
            ` : ''}
            <span class="stat">
              <span class="stat-label">最后活跃：${last_active}</span>
            </span>
          </div>
        </div>
      </div>
    `;
  }

  renderContributorsList() {
    const container = document.querySelector('#contributors-list');
    if (!container || !this.contributorsData) return;

    const filtered = this.filterContributors(this.contributorsData.contributors);
    const sorted = this.sortContributors(filtered);

    if (sorted.length === 0) {
      container.innerHTML = '<p class="empty-state">没有符合条件的贡献者</p>';
      return;
    }

    const contributorsHTML = sorted.map(contributor => 
      this.renderContributorCard(contributor)
    ).join('');

    container.innerHTML = contributorsHTML;
    
    // Update stats
    this.updateStatsDisplay(sorted.length);
  }

  renderContributorWidget() {
    // Small widget for index.html
    const widget = document.querySelector('#contributors-widget');
    if (!widget || !this.contributorsData) return;

    const topContributors = this.contributorsData.contributors
      .slice(0, 5)
      .map(c => this.renderContributorCard(c, true))
      .join('');

    const { total_contributors, stats } = this.contributorsData;

    widget.innerHTML = `
      <div class="contributors-widget">
        <h3>贡献者亮点</h3>
        <div class="contributors-stats">
          <span>${total_contributors} 位贡献者</span>
          <span>${stats.total_notes} 篇笔记</span>
        </div>
        <div class="top-contributors">
          ${topContributors}
        </div>
        <a href="./contributors.md" class="view-all-btn">查看所有贡献者 →</a>
      </div>
    `;
  }

  updateStatsDisplay(filteredCount) {
    const statsElement = document.querySelector('#contributors-stats');
    if (!statsElement || !this.contributorsData) return;

    const { total_contributors, stats } = this.contributorsData;
    
    statsElement.innerHTML = `
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-number">${filteredCount}</span>
          <span class="stat-label">显示中</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">${total_contributors}</span>
          <span class="stat-label">总贡献者</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">${stats.total_notes}</span>
          <span class="stat-label">总笔记</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">${stats.active_contributors}</span>
          <span class="stat-label">活跃贡献者</span>
        </div>
      </div>
    `;
  }

  // Search functionality
  searchContributors(query) {
    if (!this.contributorsData) return [];
    
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return this.contributorsData.contributors;

    return this.contributorsData.contributors.filter(contributor => {
      return (
        contributor.username.toLowerCase().includes(normalizedQuery) ||
        contributor.display_name.toLowerCase().includes(normalizedQuery) ||
        (contributor.bio && contributor.bio.toLowerCase().includes(normalizedQuery)) ||
        (contributor.location && contributor.location.toLowerCase().includes(normalizedQuery))
      );
    });
  }

  // Analytics tracking
  trackContributorInteraction(action, contributorUsername) {
    if (window.gtag) {
      window.gtag('event', 'contributor_interaction', {
        action: action,
        contributor: contributorUsername
      });
    }
    console.log(`[Contributors] ${action}:`, contributorUsername);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.contributorsManager = new ContributorsManager();
  window.contributorsManager.init();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ContributorsManager;
}