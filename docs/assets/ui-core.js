(function () {
  const CACHE_PREFIX = 'iec-cache:';
  const DEFAULT_TTL = 5 * 60 * 1000;

  function now() { return Date.now(); }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
    });
  }

  function getCache(key) {
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.expiresAt < now()) {
        localStorage.removeItem(CACHE_PREFIX + key);
        return null;
      }
      return parsed.value;
    } catch (_) {
      return null;
    }
  }

  function setCache(key, value, ttl) {
    try {
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({
        value: value,
        expiresAt: now() + (ttl || DEFAULT_TTL)
      }));
    } catch (_) {}
  }

  async function apiGet(action, params, options) {
    const opts = options || {};
    const search = new URLSearchParams(Object.assign({ action: action }, params || {}));
    const cacheKey = action + ':' + search.toString();
    if (!opts.fresh) {
      const cached = getCache(cacheKey);
      if (cached !== null) return cached;
    }

    const controller = new AbortController();
    const timer = setTimeout(function () { controller.abort(); }, opts.timeout || 15000);
    try {
      const response = await fetch(APP_CONFIG.API_URL + '?' + search.toString(), { signal: controller.signal });
      const json = await response.json();
      if (!response.ok || !json.ok) throw new Error(json.error || 'تعذّر تحميل البيانات');
      setCache(cacheKey, json.data, opts.ttl);
      return json.data;
    } finally {
      clearTimeout(timer);
    }
  }

  function toast(message, type) {
    let host = document.getElementById('iecToastHost');
    if (!host) {
      host = document.createElement('div');
      host.id = 'iecToastHost';
      host.className = 'toast-host';
      document.body.appendChild(host);
    }
    const item = document.createElement('div');
    item.className = 'toast toast-' + (type || 'info');
    item.textContent = message;
    host.appendChild(item);
    requestAnimationFrame(function () { item.classList.add('show'); });
    setTimeout(function () {
      item.classList.remove('show');
      setTimeout(function () { item.remove(); }, 250);
    }, 2600);
  }

  function skeletonCards(count) {
    return '<div class="skeleton-grid">' + Array.from({ length: count || 4 }).map(function () {
      return '<div class="skeleton-card"><span></span><span></span><span></span></div>';
    }).join('') + '</div>';
  }

  function setBusy(button, busy, busyText) {
    if (!button) return;
    if (busy) {
      button.dataset.originalText = button.textContent;
      button.disabled = true;
      button.textContent = busyText || 'جاري التنفيذ...';
    } else {
      button.disabled = false;
      button.textContent = button.dataset.originalText || button.textContent;
    }
  }

  window.IEC_UI = { apiGet: apiGet, escapeHtml: escapeHtml, toast: toast, skeletonCards: skeletonCards, setBusy: setBusy };
})();
