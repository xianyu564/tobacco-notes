// Sponsor CTA interactions
class SponsorManager {
  constructor() {
    this.init();
  }

  init() {
    this.initQRToggle();
    this.initSponsorAnalytics();
    this.initAccessibility();
  }

  initQRToggle() {
    const toggleButton = document.querySelector('.toggle-qr');
    const qrSection = document.getElementById('sponsor-qr-codes');
    
    if (!toggleButton || !qrSection) return;

    toggleButton.addEventListener('click', () => {
      const isHidden = qrSection.classList.contains('hidden');
      
      if (isHidden) {
        qrSection.classList.remove('hidden');
        qrSection.setAttribute('aria-hidden', 'false');
        toggleButton.textContent = '🙈 隐藏二维码';
        toggleButton.setAttribute('aria-label', '隐藏二维码');
        
        // Smooth scroll to QR codes
        setTimeout(() => {
          qrSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest' 
          });
        }, 100);
        
        // Analytics tracking
        this.trackEvent('sponsor_qr_shown');
      } else {
        qrSection.classList.add('hidden');
        qrSection.setAttribute('aria-hidden', 'true');
        toggleButton.textContent = '📱 显示二维码';
        toggleButton.setAttribute('aria-label', '显示二维码');
        
        this.trackEvent('sponsor_qr_hidden');
      }
    });
  }

  initSponsorAnalytics() {
    // Track sponsor button clicks
    const sponsorButtons = document.querySelectorAll('.sponsor-btn');
    sponsorButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const buttonType = button.classList.contains('btn-primary') ? 'github' : 'qr_toggle';
        this.trackEvent('sponsor_button_clicked', { type: buttonType });
      });
    });

    // Track external sponsor links
    const externalLinks = document.querySelectorAll('a[href*="github.com/sponsors"]');
    externalLinks.forEach(link => {
      link.addEventListener('click', () => {
        this.trackEvent('sponsor_external_link_clicked');
      });
    });
  }

  initAccessibility() {
    // Add keyboard navigation support for QR toggle
    const toggleButton = document.querySelector('.toggle-qr');
    if (toggleButton) {
      toggleButton.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleButton.click();
        }
      });
    }

    // Add focus indicators for sponsor buttons
    const sponsorButtons = document.querySelectorAll('.sponsor-btn');
    sponsorButtons.forEach(button => {
      button.addEventListener('focus', () => {
        button.style.outline = '3px solid var(--primary)';
        button.style.outlineOffset = '2px';
      });
      
      button.addEventListener('blur', () => {
        button.style.outline = '';
        button.style.outlineOffset = '';
      });
    });
  }

  trackEvent(eventName, data = {}) {
    // Simple analytics tracking - can be extended with real analytics
    if (window.gtag) {
      window.gtag('event', eventName, data);
    }
    
    // Log for debugging
    console.log(`[Sponsor] Event: ${eventName}`, data);
  }

  // Method to add floating sponsor prompt
  addFloatingPrompt() {
    // Only show after user has been on page for 30 seconds
    setTimeout(() => {
      if (document.querySelector('.floating-sponsor-prompt')) return;
      
      const prompt = document.createElement('div');
      prompt.className = 'floating-sponsor-prompt';
      prompt.innerHTML = `
        <div class="prompt-content">
          <span class="prompt-emoji">💖</span>
          <span class="prompt-text">喜欢这个项目？</span>
          <button class="prompt-close" aria-label="关闭提示">×</button>
        </div>
      `;
      
      document.body.appendChild(prompt);
      
      // Auto-hide after 10 seconds
      setTimeout(() => {
        if (prompt.parentNode) {
          prompt.remove();
        }
      }, 10000);
      
      // Close button functionality
      prompt.querySelector('.prompt-close').addEventListener('click', () => {
        prompt.remove();
        this.trackEvent('sponsor_prompt_dismissed');
      });
      
      // Navigate to sponsor section on click
      prompt.addEventListener('click', (e) => {
        if (e.target.classList.contains('prompt-close')) return;
        
        document.getElementById('sponsor').scrollIntoView({ 
          behavior: 'smooth' 
        });
        prompt.remove();
        this.trackEvent('sponsor_prompt_clicked');
      });
      
      this.trackEvent('sponsor_prompt_shown');
    }, 30000);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.sponsorManager = new SponsorManager();
  
  // Optional: Add floating prompt (can be enabled/disabled)
  // window.sponsorManager.addFloatingPrompt();
});