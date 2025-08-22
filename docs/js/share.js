// 分享功能
class ShareManager {
  constructor() {
    this.title = document.title;
    this.url = window.location.href;
    this.description = document.querySelector('meta[name="description"]')?.content || '';
    
    this.bindEvents();
  }

  bindEvents() {
    document.addEventListener('click', e => {
      const shareBtn = e.target.closest('.share-button');
      if (shareBtn) {
        e.preventDefault();
        const platform = shareBtn.dataset.platform;
        this.share(platform);
      }
    });
  }

  async share(platform) {
    // 如果支持原生分享 API，优先使用
    if (platform === 'native' && navigator.share) {
      try {
        await navigator.share({
          title: this.title,
          text: this.description,
          url: this.url
        });
        return;
      } catch (err) {
        console.error('Native share failed:', err);
      }
    }

    // 根据平台构建分享链接
    let shareUrl;
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(this.title)}&url=${encodeURIComponent(this.url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(this.url)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(this.url)}`;
        break;
      case 'weibo':
        shareUrl = `http://service.weibo.com/share/share.php?url=${encodeURIComponent(this.url)}&title=${encodeURIComponent(this.title)}`;
        break;
      case 'copy':
        try {
          await navigator.clipboard.writeText(this.url);
          this.showToast('链接已复制');
          return;
        } catch (err) {
          console.error('Copy failed:', err);
          this.showToast('复制失败，请手动复制');
          return;
        }
    }

    // 打开分享窗口
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // 动画显示
    requestAnimationFrame(() => {
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
      }, 2000);
    });
  }
}

// 初始化分享管理器
document.addEventListener('DOMContentLoaded', () => {
  window.shareManager = new ShareManager();
});
