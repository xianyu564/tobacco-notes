import { TestUtils } from '../test-utils';

describe('Notes Integration', () => {
  let restoreFetch;
  let restoreStorage;

  beforeEach(() => {
    TestUtils.cleanup();
    restoreFetch = TestUtils.mockFetch({
      latest: [
        { title: 'Latest Note 1', category: 'cigars', date: '2024-01-01' },
        { title: 'Latest Note 2', category: 'pipe', date: '2024-01-02' }
      ],
      index: [
        { title: 'Note 1', category: 'cigars', date: '2023-12-01' },
        { title: 'Note 2', category: 'pipe', date: '2023-12-02' },
        { title: 'Note 3', category: 'cigars', date: '2023-12-03' }
      ]
    });
    restoreStorage = TestUtils.mockStorage();
    require('../../notes');
  });

  afterEach(() => {
    restoreFetch();
    restoreStorage();
  });

  test('should load and render latest notes', async () => {
    const list = await TestUtils.waitForElement('#latest-list');
    expect(list.children.length).toBe(2);
  });

  test('should render notes by category', async () => {
    const categories = await TestUtils.waitForElement('#by-category');
    const cigarNotes = categories.querySelector('#cigars .note-list');
    const pipeNotes = categories.querySelector('#pipe .note-list');
    
    expect(cigarNotes.children.length).toBe(2);
    expect(pipeNotes.children.length).toBe(1);
  });

  test('should load more notes on button click', async () => {
    const loadMore = await TestUtils.waitForElement('.load-more');
    const list = document.querySelector('#latest-list');
    const initialCount = list.children.length;
    
    TestUtils.simulateClick(loadMore);
    await TestUtils.wait(100);
    
    expect(list.children.length).toBeGreaterThan(initialCount);
  });

  test('should copy note link', async () => {
    const list = await TestUtils.waitForElement('#latest-list');
    const copyButton = list.querySelector('.copy');
    const writeText = jest.fn();
    Object.assign(navigator, {
      clipboard: { writeText }
    });
    
    TestUtils.simulateClick(copyButton);
    
    expect(writeText).toHaveBeenCalled();
    expect(copyButton.textContent).toBe('已复制');
    
    await TestUtils.wait(1300);
    expect(copyButton.textContent).toBe('复制链接');
  });

  test('should handle network errors gracefully', async () => {
    restoreFetch();
    restoreFetch = TestUtils.mockFetch(Promise.reject('Network error'));
    
    const list = document.querySelector('#latest-list');
    expect(list.textContent).toContain('加载失败');
  });

  test('should cache loaded notes', async () => {
    await TestUtils.waitForElement('#latest-list');
    expect(localStorage.getItem('latest-notes')).toBeTruthy();
  });
});
