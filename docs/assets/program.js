(function () {
  const content = document.getElementById('content');
  const pageTitle = document.getElementById('pageTitle');

  function isConfigured() {
    return APP_CONFIG.API_URL && APP_CONFIG.API_URL.indexOf('PASTE_YOUR') === -1;
  }

  function getName() {
    return new URLSearchParams(window.location.search).get('name');
  }

  function escapeHtml_(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function fmtAvg(v) {
    return (v === null || v === undefined || isNaN(v)) ? '—' : v + ' / 5';
  }

  async function load() {
    if (!isConfigured()) {
      content.innerHTML = '<div class="error-state">⚠️ لم يتم ربط رابط الخادم (API_URL) بعد.</div>';
      return;
    }
    const name = getName();
    if (!name) {
      content.innerHTML = '<div class="error-state">لم يتم تحديد برنامج.</div>';
      return;
    }

    try {
      const res = await fetch(APP_CONFIG.API_URL + '?action=program&name=' + encodeURIComponent(name));
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'تعذّر تحميل بيانات البرنامج');
      render(json.data);
    } catch (err) {
      content.innerHTML = '<div class="error-state">خطأ: ' + err.message + '</div>';
    }
  }

  function render(d) {
    pageTitle.textContent = '🔁 ' + d.name;
    const s = d.stats;

    let html = '<div class="kpi-grid">' +
      kpi(d.executionCount, 'عدد مرات التنفيذ') +
      kpi(d.totalParticipants, 'إجمالي المشاركين') +
      kpi(s.count, 'عدد الردود') +
      kpi(fmtAvg(s.avgOverall), 'متوسط التقييم العام') +
      '</div>';

    if (d.bestTrainer) {
      html += '<div class="card" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">' +
        '<div><h3 style="margin:0;">🏆 أفضل نتيجة تحققت لهذا البرنامج</h3>' +
        '<p style="color:var(--muted);font-size:13px;margin:4px 0 0;">المدرب <a href="trainer.html?name=' + encodeURIComponent(d.bestTrainer.trainer) + '" style="color:var(--primary-dark);font-weight:700;">' + escapeHtml_(d.bestTrainer.trainer) + '</a> حقق متوسط تقييم ' + fmtAvg(d.bestTrainer.avgOverall) + '</p></div>' +
        '</div>';
    }

    html += '<div class="card"><h3 style="margin-top:0;">كل النسخ السابقة (' + d.instances.length + ')</h3>' +
      '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:13px;">' +
      '<thead><tr style="text-align:right;color:var(--muted);">' +
      '<th style="padding:8px 6px;">المدرب</th><th style="padding:8px 6px;">النوع</th><th style="padding:8px 6px;">التاريخ</th>' +
      '<th style="padding:8px 6px;">المشاركين</th><th style="padding:8px 6px;">الردود</th><th style="padding:8px 6px;">المتوسط</th></tr></thead><tbody>';
    d.instances.forEach(inst => {
      html += '<tr style="border-top:1px solid var(--border);">' +
        '<td style="padding:8px 6px;"><a href="trainer.html?name=' + encodeURIComponent(inst.trainer) + '" style="color:var(--primary-dark);font-weight:700;text-decoration:none;">' + escapeHtml_(inst.trainer || '—') + '</a></td>' +
        '<td style="padding:8px 6px;">' + escapeHtml_(inst.type || '—') + '</td>' +
        '<td style="padding:8px 6px;">' + escapeHtml_(inst.date || '—') + '</td>' +
        '<td style="padding:8px 6px;">' + (inst.participants || 0) + '</td>' +
        '<td style="padding:8px 6px;">' + inst.responseCount + '</td>' +
        '<td style="padding:8px 6px;"><a href="workshop.html?id=' + encodeURIComponent(inst.id) + '" style="color:var(--primary-dark);text-decoration:none;">' + fmtAvg(inst.avgOverall) + '</a></td>' +
        '</tr>';
    });
    html += '</tbody></table></div></div>';

    content.innerHTML = html;
  }

  function kpi(value, label) {
    return '<div class="kpi"><div class="value">' + value + '</div><div class="label">' + label + '</div></div>';
  }

  load();
})();
