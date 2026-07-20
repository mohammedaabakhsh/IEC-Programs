(function () {
  const content = document.getElementById('content');
  const pageTitle = document.getElementById('pageTitle');

  function isConfigured() {
    return APP_CONFIG.API_URL && APP_CONFIG.API_URL.indexOf('PASTE_YOUR') === -1;
  }

  function getId() {
    return new URLSearchParams(window.location.search).get('id');
  }

  function escapeHtml_(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  async function load() {
    if (!isConfigured()) {
      content.innerHTML = '<div class="error-state">⚠️ لم يتم ربط رابط الخادم (API_URL) بعد.</div>';
      return;
    }
    const id = getId();
    if (!id) {
      content.innerHTML = '<div class="error-state">لم يتم تحديد ورشة.</div>';
      return;
    }

    try {
      const res = await fetch(APP_CONFIG.API_URL + '?action=workshop&id=' + encodeURIComponent(id));
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'تعذّر تحميل بيانات الورشة');
      render(json.data);
    } catch (err) {
      content.innerHTML = '<div class="error-state">خطأ: ' + err.message + '</div>';
    }
  }

  function render(w) {
    pageTitle.textContent = w.name;
    const s = w.stats;

    let html = '<div class="kpi-grid">' +
      kpi(s.count, 'عدد الردود') +
      kpi(fmtAvg(s.avgOverall), 'المتوسط العام') +
      kpi(fmtAvg(s.avgTrainer), 'تقييم المدرب') +
      kpi(fmtAvg(s.avgOrganization), 'تقييم التنظيم') +
      '</div>';

    html += '<div class="card"><h3 style="margin-top:0;">بيانات الورشة</h3><table class="info-table">' +
      infoRow('الوصف', w.description) +
      infoRow('التاريخ', w.date) +
      infoRow('الوقت', w.time) +
      infoRow('المدرب', w.trainer) +
      infoRow('الفئة المستهدفة', w.audience) +
      infoRow('عدد المشاركين', w.participants) +
      infoRow('الجهة المنظمة', w.organizer) +
      '</table></div>';

    if (w.evalLink) {
      html += '<div class="card"><h3 style="margin-top:0;">رابط ورمز QR للتقييم</h3>' +
        '<div class="link-box" style="margin-bottom:12px;"><span>' + escapeHtml_(w.evalLink) + '</span>' +
        '<button class="btn secondary" id="copyLinkBtn" type="button">نسخ</button></div>' +
        '<img src="' + w.qrUrl + '" width="160" height="160" alt="QR Code" style="border:1px solid var(--border);border-radius:8px;">' +
        '</div>';
    }

    html += '<div class="card"><h3 style="margin-top:0;">إحصاءات تفصيلية</h3><table class="info-table">' +
      infoRow('متوسط الرضا عن المحتوى', fmtAvg(s.avgContent)) +
      infoRow('متوسط الرضا عن التنظيم', fmtAvg(s.avgOrganization)) +
      infoRow('متوسط تقييم المدرب', fmtAvg(s.avgTrainer)) +
      infoRow('متوسط تحقق الأهداف', fmtAvg(s.avgGoals)) +
      infoRow('متوسط الاستفادة المتوقعة', fmtAvg(s.avgBenefit)) +
      '</table></div>';

    html += '<div class="card"><h3 style="margin-top:0;">الملاحظات والمقترحات (' + s.comments.length + ')</h3>';
    if (s.comments.length === 0) {
      html += '<div class="empty-state">لا توجد ملاحظات بعد.</div>';
    } else {
      s.comments.forEach(c => {
        html += '<div class="comment-item">' + escapeHtml_(c.text) + '</div>';
      });
    }
    html += '</div>';

    content.innerHTML = html;

    if (w.evalLink) {
      document.getElementById('copyLinkBtn').addEventListener('click', () => {
        navigator.clipboard.writeText(w.evalLink).then(() => {
          const btn = document.getElementById('copyLinkBtn');
          btn.textContent = 'تم النسخ ✓';
          setTimeout(() => { btn.textContent = 'نسخ'; }, 1500);
        });
      });
    }
  }

  function kpi(value, label) {
    return '<div class="kpi"><div class="value">' + value + '</div><div class="label">' + label + '</div></div>';
  }

  function infoRow(label, value) {
    return '<tr><td>' + label + '</td><td>' + escapeHtml_(value || '—') + '</td></tr>';
  }

  function fmtAvg(v) {
    return (v === null || v === undefined || isNaN(v)) ? '—' : v + ' / 5';
  }

  load();
})();
