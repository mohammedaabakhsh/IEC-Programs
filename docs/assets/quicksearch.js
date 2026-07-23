(function () {
  const input = document.getElementById('quickSearchInput');
  const resultsBox = document.getElementById('quickSearchResults');
  if (!input || !resultsBox) return;

  function isConfigured() {
    return typeof APP_CONFIG !== 'undefined' && APP_CONFIG.API_URL && APP_CONFIG.API_URL.indexOf('PASTE_YOUR') === -1;
  }

  function escapeHtml_(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  let index = null;
  let indexLoading = null;

  function loadIndex() {
    if (index) return Promise.resolve(index);
    if (indexLoading) return indexLoading;
    indexLoading = fetch(APP_CONFIG.API_URL + '?action=searchIndex')
      .then(res => res.json())
      .then(json => {
        if (json.ok) index = json.data;
        return index;
      })
      .catch(() => null);
    return indexLoading;
  }

  if (isConfigured()) {
    input.addEventListener('focus', loadIndex, { once: true });
  }

  function buildResults(query) {
    if (!index) return [];
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const results = [];

    index.trainers.forEach(name => {
      if (name.toLowerCase().indexOf(q) !== -1) {
        results.push({ icon: '👤', label: name, sub: 'مدرب', url: 'trainer.html?name=' + encodeURIComponent(name) });
      }
    });

    index.types.forEach(type => {
      if (type.toLowerCase().indexOf(q) !== -1) {
        results.push({ icon: '🏷️', label: type, sub: 'نوع نشاط', url: 'type.html?type=' + encodeURIComponent(type) });
      }
    });

    index.workshops.forEach(w => {
      if (w.name && w.name.toLowerCase().indexOf(q) !== -1) {
        results.push({ icon: '📋', label: w.name, sub: 'ورشة/برنامج', url: 'workshop.html?id=' + encodeURIComponent(w.id) });
      }
    });

    return results.slice(0, 8);
  }

  function render(results) {
    if (results.length === 0) {
      resultsBox.style.display = 'none';
      resultsBox.innerHTML = '';
      return;
    }
    resultsBox.innerHTML = results.map(r =>
      '<a href="' + r.url + '" style="display:flex;align-items:center;gap:10px;padding:9px 12px;text-decoration:none;color:var(--primary-dark);font-size:13px;border-bottom:1px solid var(--border);">' +
      '<span>' + r.icon + '</span>' +
      '<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escapeHtml_(r.label) + '</span>' +
      '<span style="font-size:10.5px;color:var(--muted);">' + r.sub + '</span>' +
      '</a>'
    ).join('');
    resultsBox.style.display = 'block';
  }

  input.addEventListener('input', async () => {
    await loadIndex();
    render(buildResults(input.value));
  });

  document.addEventListener('click', e => {
    if (e.target !== input && !resultsBox.contains(e.target)) {
      resultsBox.style.display = 'none';
    }
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') { resultsBox.style.display = 'none'; input.blur(); }
  });
})();
