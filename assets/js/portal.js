const grid = document.getElementById('app-grid');

function renderApps() {
  if (!grid || !Array.isArray(APP_REGISTRY)) return;

  grid.innerHTML = APP_REGISTRY.map(app => `
    <a class="app-card" href="${app.url}">
      <div>
        <div class="app-card__top">
          <div class="app-card__icon">${app.icon}</div>
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
