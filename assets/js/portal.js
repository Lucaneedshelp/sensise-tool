const grid = document.getElementById('app-grid');

const ICONS = {
  table: '<svg viewBox="0 0 24 24"><path d="M4 5h16v14H4z"/><path d="M4 10h16"/><path d="M9 5v14"/></svg>',
  code: '<svg viewBox="0 0 24 24"><path d="m8 9-4 3 4 3"/><path d="m16 9 4 3-4 3"/><path d="m14 5-4 14"/></svg>',
  calculator: '<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8"/><path d="M8 11h.01"/><path d="M12 11h.01"/><path d="M16 11h.01"/><path d="M8 15h.01"/><path d="M12 15h.01"/><path d="M16 15h.01"/></svg>',
  clipboard: '<svg viewBox="0 0 24 24"><path d="M9 4h6"/><path d="M9 4a2 2 0 0 0-2 2v1h10V6a2 2 0 0 0-2-2"/><path d="M7 6H5v15h14V6h-2"/><path d="M8 12h8"/><path d="M8 16h6"/></svg>',
  calendar: '<svg viewBox="0 0 24 24"><path d="M7 3v4"/><path d="M17 3v4"/><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 10h16"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/></svg>'
};

function renderApps() {
  if (!grid || !Array.isArray(APP_REGISTRY)) return;

  grid.innerHTML = APP_REGISTRY.map(app => `
    <a class="app-card" href="${app.url}" aria-label="${app.title} öffnen">
      <div>
        <div class="app-card__top">
          <div class="app-card__icon">${ICONS[app.icon] || app.icon}</div>
          <span class="app-card__badge">${app.badge}</span>
        </div>
        <h3>${app.title}</h3>
        <p>${app.description}</p>
      </div>
      <div class="app-card__meta">${app.category}</div>
    </a>
  `).join('');
}

renderApps();
