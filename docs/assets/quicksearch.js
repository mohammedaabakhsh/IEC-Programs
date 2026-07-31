(function () {
  function ensureLink(href, marker) {
    if (document.querySelector('link[' + marker + ']')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute(marker, 'true');
    document.head.appendChild(link);
  }

  ensureLink('assets/mobile.css', 'data-mobile-ui');
  ensureLink('assets/professional.css', 'data-professional-ui');
  ensureLink('assets/professional-fixes.css', 'data-professional-fixes');
  ensureLink('assets/mobile-drawer.css', 'data-mobile-drawer');

  if (!document.querySelector('link[rel="manifest"]')) {
    const manifest = document.createElement('link');
    manifest.rel = 'manifest';
    manifest.href = 'manifest.webmanifest';
    document.head.appendChild(manifest);
  }

  let theme = document.querySelector('meta[name="theme-color"]');
  if (!theme) {
    theme = document.createElement('meta');
    theme.name = 'theme-color';
    document.head.appendChild(theme);
  }
  theme.content = '#214c2b';

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }

  function setupMobileDrawer() {
    const sidebar = document.querySelector('.sidebar');
    const header = document.querySelector('.app-header');
    if (!sidebar || !header || document.querySelector('.mobile-menu-toggle')) return;

    const overlay = document.createElement('button');
    overlay.type = 'button';
    overlay.className = 'mobile-drawer-overlay';
    overlay.setAttribute('aria-label', 'إغلاق القائمة');

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'mobile-menu-toggle';
    toggle.setAttribute('aria-label', 'فتح القائمة');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '<span></span><span></span><span></span>';

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'mobile-drawer-close';
    close.setAttribute('aria-label', 'إغلاق القائمة');
    close.textContent = '×';

    const mobileBrand = document.createElement('div');
    mobileBrand.className = 'mobile-drawer-brand';
    mobileBrand.innerHTML = '<div class="mobile-drawer-mark">IEC</div><div><strong>مركز الابتكار</strong><span>وريادة الأعمال</span></div>';

    const quickAction = document.createElement('a');
    quickAction.href = 'workshops.html';
    quickAction.className = 'mobile-drawer-action';
    quickAction.textContent = 'إضافة ورشة جديدة';

    const floatingAction = document.createElement('a');
    floatingAction.href = 'workshops.html';
    floatingAction.className = 'mobile-floating-add';
    floatingAction.setAttribute('aria-label', 'إضافة ورشة جديدة');
    floatingAction.textContent = '+';

    sidebar.prepend(close);
    sidebar.prepend(mobileBrand);
    sidebar.appendChild(quickAction);
    document.body.appendChild(overlay);
    document.body.appendChild(floatingAction);
    header.appendChild(toggle);

    function openDrawer() {
      document.body.classList.add('mobile-drawer-open');
      toggle.setAttribute('aria-expanded', 'true');
    }

    function closeDrawer() {
      document.body.classList.remove('mobile-drawer-open');
      toggle.setAttribute('aria-expanded', 'false');
    }

    toggle.addEventListener('click', openDrawer);
    close.addEventListener('click', closeDrawer);
    overlay.addEventListener('click', closeDrawer);
    sidebar.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeDrawer);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeDrawer();
    });
  }

  setupMobileDrawer();

  const input = document.getElementById('quickSearchInput');
  const resultsBox = document.getElementById('quickSearchResults');
  if (!input || !resultsBox) return;

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char];
    });
  }

  let index = null;
  let loading = null;
  function loadIndex() {
    if (index) return Promise.resolve(index);
    if (loading) return loading;
    loading = fetch(APP_CONFIG.API_URL + '?action=searchIndex').then(r => r.json()).then(json => {
      index = json.ok ? json.data : null;
      return index;
    }).catch(() => null);
    return loading;
  }

  function matches(value, query) { return String(value || '').toLowerCase().includes(query); }
  function build(query) {
    if (!index || !query) return [];
    const q = query.trim().toLowerCase();
    const results = [];
    (index.workshops || []).forEach(w => { if (matches(w.name, q)) results.push({ label:w.name, sub:'ورشة أو برنامج', url:'workshop.html?id=' + encodeURIComponent(w.id) }); });
    (index.trainers || []).forEach(name => { if (matches(name, q)) results.push({ label:name, sub:'مدرب', url:'trainer.html?name=' + encodeURIComponent(name) }); });
    (index.types || []).forEach(type => { if (matches(type, q)) results.push({ label:type, sub:'نوع نشاط', url:'type.html?type=' + encodeURIComponent(type) }); });
    return results.slice(0,8);
  }

  function render(items) {
    if (!items.length) {
      resultsBox.style.display = 'none';
      resultsBox.innerHTML = '';
      return;
    }
    resultsBox.innerHTML = items.map(item => '<a class="quick-result" href="' + item.url + '"><span>' + escapeHtml(item.label) + '</span><small>' + escapeHtml(item.sub) + '</small></a>').join('');
    resultsBox.style.display = 'block';
  }

  input.addEventListener('focus', loadIndex, { once:true });
  input.addEventListener('input', async function () { await loadIndex(); render(build(input.value)); });
  input.addEventListener('keydown', function (event) { if (event.key === 'Escape') { render([]); input.blur(); } });
  document.addEventListener('click', function (event) { if (event.target !== input && !resultsBox.contains(event.target)) render([]); });
})();
