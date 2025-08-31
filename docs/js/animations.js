// 页面动画增强
class AnimationManager {
  constructor() {
    this.intersectionObserver = null;
    this.scrollSpy = null;
    this.init();
  }

  init() {
    this.initIntersectionObserver();
    this.initScrollSpy();
    this.initPageTransitions();
    this.initHoverEffects();
  }

  initIntersectionObserver() {
    // 监视元素进入视口时添加动画
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            // 对已显示的元素停止观察
            this.intersectionObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    // 观察所有可动画元素
    document.querySelectorAll('.animate').forEach(el => {
      this.intersectionObserver.observe(el);
    });
  }

  initScrollSpy() {
    // 监视滚动位置以更新导航状态
    this.scrollSpy = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // 更新导航高亮
            const id = entry.target.id;
            document.querySelectorAll('.nav-links a').forEach(a => {
              a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
            });
          }
        });
      },
      {
        threshold: 0.5
      }
    );

    // 观察所有区块
    document.querySelectorAll('section[id]').forEach(section => {
      this.scrollSpy.observe(section);
    });
  }

  initPageTransitions() {
    // 页面切换动画
    document.addEventListener('click', e => {
      const link = e.target.closest('a');
      if (link && link.href && !link.target && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
        e.preventDefault();
        document.body.classList.add('page-exit');
        setTimeout(() => {
          window.location.href = link.href;
        }, 300);
      }
    });

    // 页面加载动画
    document.addEventListener('DOMContentLoaded', () => {
      document.body.classList.add('page-enter');
    });
  }

  initHoverEffects() {
    // 按钮悬停效果
    document.querySelectorAll('.btn').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        btn.style.setProperty('--mouse-x', `${x}px`);
        btn.style.setProperty('--mouse-y', `${y}px`);
      });
    });

    // 卡片悬停效果
    document.querySelectorAll('.category-block, .template-card').forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 20;
        const rotateY = (centerX - x) / 20;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  // 添加加载动画
  showLoading(container) {
    const loader = document.createElement('div');
    loader.className = 'loader';
    loader.innerHTML = `
      <div class="loader-spinner"></div>
      <div class="loader-text">加载中...</div>
    `;
    container.appendChild(loader);
  }

  hideLoading(container) {
    const loader = container.querySelector('.loader');
    if (loader) {
      loader.classList.add('fade-out');
      setTimeout(() => loader.remove(), 300);
    }
  }

  // 添加元素进入动画
  animateElement(element, animation = 'fade-in') {
    element.classList.add(animation);
    element.addEventListener('animationend', () => {
      element.classList.remove(animation);
    }, { once: true });
  }
}

// 初始化动画管理器
document.addEventListener('DOMContentLoaded', () => {
  window.animationManager = new AnimationManager();
});
