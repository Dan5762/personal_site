// Shared Menu Component
class MenuComponent {
  constructor() {
    this.menuItems = [
      { href: 'index.html', label: 'About' },
      { href: 'projects.html', label: 'Projects' },
      { href: 'reading.html', label: 'Reading' },
      { href: 'gallery.html', label: 'Gallery' }
    ];
    this.init();
  }

  init() {
    this.createMenuHTML();
    this.attachEventListeners();
  }

  getRelativePath(targetHref) {
    const currentPath = window.location.pathname;
    const isInProjectsFolder = currentPath.includes('/projects/');
    
    if (isInProjectsFolder && !targetHref.startsWith('../')) {
      return '../' + targetHref;
    }
    return targetHref;
  }

  createMenuHTML() {
    const menuContainer = document.getElementById('menu-container');
    if (!menuContainer) return;

    const menuHTML = `
      <div class="burger-icon" onclick="window.menuComponent.toggleMenu()">Menu</div>

      <div class="menu-links">
        ${this.menuItems.map(item => `
          <a href="${this.getRelativePath(item.href)}" class="button">
            <h2>${item.label}</h2>
          </a>
        `).join('')}
      </div>
    `;

    menuContainer.innerHTML = menuHTML;
  }

  toggleMenu() {
    const menuLinks = document.querySelector('.menu-links');
    menuLinks.classList.toggle('active');
  }

  attachEventListeners() {
    // Re-attach breadcrumb functionality if it exists
    if (typeof window.breadcrumbInit === 'function') {
      window.breadcrumbInit();
    }
  }
}

// Initialize menu when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  window.menuComponent = new MenuComponent();
});