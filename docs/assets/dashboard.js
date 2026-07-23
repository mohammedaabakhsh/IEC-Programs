(function () {
  const content = document.getElementById('content');

  function isConfigured() {
    return APP_CONFIG.API_URL && APP_CONFIG.API_URL.indexOf('PASTE_YOUR') === -1;
  }

  function escapeHtml_(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function fmtAvg(v) {
    return (v === null || v === undefined || isNaN(v)) ? '—' : v + ' / 5';
  }

  async function load() {
    if (!isConfigured()) {
      content.innerHTML = '<div class="error-state">⚠️ لم يتم ربط رابط الخادم (API_URL) بعد.<br>افتح ملف assets/config.js وضع رابط Apps Script Web App.</div>';
      return;
    }
    try {
      const res = await fetch(APP_CONFIG.API_URL + '?action=dashboard');
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'تعذّر تحميل البيانات');
      render(json.data);
    } catch (err) {
      content.innerHTML = '<div class="error-state">تعذّر تحميل البيانات: ' + err.message + '</div>';
    }
  }

  function render(d) {
    let html = '<div class="kpi-grid">' +
      kpi(d.totalWorkshops, 'إجمالي عدد الورش') +
      kpi(d.totalPrograms, 'إجمالي عدد البرامج') +
      kpi(d.totalParticipants, 'إجمالي المشاركين') +
      kpi(fmtAvg(d.avgOverall), 'متوسط التقييم العام') +
      kpi(
        d.topTrainer
          ? '<a href="trainer.html?name=' + encodeURIComponent(d.topTrainer) + '" style="color:var(--primary);text-decoration:none;">' + escapeHtml_(d.topTrainer) + '</a>'
          : '—',
        'أعلى مدرب تقييمًا' + (d.topTrainer ? ' (' + fmtAvg(d.topTrainerAvg) + ')' : '')
      ) +
      kpi(
        d.mostCommonType ? escapeHtml_(d.mostCommonType) : '—',
        'أكثر نوع نشاط تنفيذًا' + (d.mostCommonType ? ' (' + d.mostCommonTypeCount + ')' : '')
      ) +
      kpi(d.thisMonthCount, 'عدد الورش هذا الشهر') +
      kpi(d.thisYearCount, 'عدد الورش هذه السنة') +
      '</div>';

    html += '<div class="card" style="margin-top:18px;">' +
      '<h3 style="margin-top:0;">اختصارات سريعة</h3>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
      '<a href="workshops.html" class="btn" style="text-decoration:none;">📋 الورش والبرامج</a>' +
      '<a href="reports.html" class="btn secondary" style="text-decoration:none;">📊 التقارير والتحليلات</a>' +
      '<a href="certificate.html" class="btn secondary" style="text-decoration:none;">🏅 توليد شهادة</a>' +
      '</div></div>';

    content.innerHTML = html;
  }

  function kpi(value, label) {
    return '<div class="kpi"><div class="value">' + value + '</div><div class="label">' + label + '</div></div>';
  }

  load();
})();
