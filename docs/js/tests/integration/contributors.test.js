import { TestUtils } from '../test-utils';

describe('Contributors Integration', () => {
  let restoreFetch;
  let restoreStorage;

  beforeEach(() => {
    TestUtils.cleanup();
    restoreFetch = TestUtils.mockFetch({
      './data/contributors.json': {
        last_updated: '2025-08-31T07:49:23.183438',
        total_contributors: 2,
        contributors: [
          {
            username: 'xianyu564',
            display_name: 'xianyu564',
            avatar_url: 'https://github.com/xianyu564.png',
            profile_url: 'https://github.com/xianyu564',
            total_contributions: 10,
            notes_count: 5,
            is_maintainer: true,
            bio: 'Repository maintainer'
          },
          {
            username: 'contributor1',
            display_name: 'Contributor One',
            avatar_url: 'https://github.com/contributor1.png',
            profile_url: 'https://github.com/contributor1',
            total_contributions: 3,
            notes_count: 3,
            is_maintainer: false,
            bio: 'Active contributor'
          }
        ],
        stats: { total_notes: 8, active_contributors: 2 }
      }
    });
    restoreStorage = TestUtils.mockStorage();
    require('../../contributors');
  });

  afterEach(() => {
    restoreFetch();
    restoreStorage();
  });

  test('should load contributors data', async () => {
    const manager = window.contributorsManager;
    await manager.loadContributorsData();
    
    expect(manager.contributorsData).toBeTruthy();
    expect(manager.contributorsData.total_contributors).toBe(2);
    expect(manager.contributorsData.contributors).toHaveLength(2);
  });

  test('should render contributors widget', async () => {
    document.body.innerHTML = '<div id="contributors-widget"></div>';
    
    const manager = window.contributorsManager;
    await manager.loadContributorsData();
    manager.renderContributorWidget();
    
    const widget = document.querySelector('#contributors-widget');
    expect(widget.innerHTML).toContain('贡献者亮点');
    expect(widget.innerHTML).toContain('2 位贡献者');
    expect(widget.innerHTML).toContain('8 篇笔记');
  });

  test('should render contributors list', async () => {
    document.body.innerHTML = `
      <div id="contributors-container"></div>
      <div id="contributors-list"></div>
      <div id="contributors-stats"></div>
    `;
    
    const manager = window.contributorsManager;
    await manager.loadContributorsData();
    manager.initFilters();
    manager.renderContributorsList();
    
    const list = document.querySelector('#contributors-list');
    expect(list.children.length).toBe(2);
    
    const maintainerCard = Array.from(list.children).find(card => 
      card.innerHTML.includes('xianyu564')
    );
    expect(maintainerCard).toBeTruthy();
    expect(maintainerCard.innerHTML).toContain('维护者');
  });

  test('should filter contributors by type', async () => {
    document.body.innerHTML = `
      <div id="contributors-container"></div>
      <div id="contributors-list"></div>
      <div id="contributors-stats"></div>
    `;
    
    const manager = window.contributorsManager;
    await manager.loadContributorsData();
    manager.initFilters();
    
    // Filter maintainers only
    manager.currentView = 'maintainers';
    manager.renderContributorsList();
    
    const list = document.querySelector('#contributors-list');
    expect(list.children.length).toBe(1);
    expect(list.innerHTML).toContain('xianyu564');
    
    // Filter contributors only
    manager.currentView = 'contributors';
    manager.renderContributorsList();
    
    expect(list.children.length).toBe(1);
    expect(list.innerHTML).toContain('contributor1');
  });

  test('should sort contributors', async () => {
    const manager = window.contributorsManager;
    await manager.loadContributorsData();
    
    const contributors = manager.contributorsData.contributors;
    
    // Sort by name ascending
    manager.sortBy = 'name';
    manager.sortOrder = 'asc';
    const sortedByName = manager.sortContributors(contributors);
    
    expect(sortedByName[0].display_name).toBe('Contributor One');
    expect(sortedByName[1].display_name).toBe('xianyu564');
    
    // Sort by contributions descending
    manager.sortBy = 'contributions';
    manager.sortOrder = 'desc';
    const sortedByContrib = manager.sortContributors(contributors);
    
    expect(sortedByContrib[0].total_contributions).toBe(10);
    expect(sortedByContrib[1].total_contributions).toBe(3);
  });

  test('should search contributors', async () => {
    const manager = window.contributorsManager;
    await manager.loadContributorsData();
    
    const results = manager.searchContributors('xianyu');
    expect(results).toHaveLength(1);
    expect(results[0].username).toBe('xianyu564');
    
    const maintainerResults = manager.searchContributors('maintainer');
    expect(maintainerResults).toHaveLength(1);
    expect(maintainerResults[0].bio).toContain('maintainer');
    
    const emptyResults = manager.searchContributors('nonexistent');
    expect(emptyResults).toHaveLength(0);
  });

  test('should handle network errors gracefully', async () => {
    restoreFetch();
    restoreFetch = TestUtils.mockFetch(Promise.reject('Network error'));
    
    const manager = window.contributorsManager;
    await manager.loadContributorsData();
    
    // Should fallback to static data
    expect(manager.contributorsData).toBeTruthy();
    expect(manager.contributorsData.contributors).toHaveLength(1);
    expect(manager.contributorsData.contributors[0].username).toBe('xianyu564');
  });

  test('should update stats display', async () => {
    document.body.innerHTML = '<div id="contributors-stats"></div>';
    
    const manager = window.contributorsManager;
    await manager.loadContributorsData();
    manager.updateStatsDisplay(2);
    
    const stats = document.querySelector('#contributors-stats');
    expect(stats.innerHTML).toContain('2');
    expect(stats.innerHTML).toContain('显示中');
    expect(stats.innerHTML).toContain('总贡献者');
  });

  test('should track contributor interactions', async () => {
    const mockGtag = jest.fn();
    window.gtag = mockGtag;
    
    const manager = window.contributorsManager;
    manager.trackContributorInteraction('profile_click', 'xianyu564');
    
    expect(mockGtag).toHaveBeenCalledWith('event', 'contributor_interaction', {
      action: 'profile_click',
      contributor: 'xianyu564'
    });
  });
});