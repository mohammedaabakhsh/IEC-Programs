(function () {
  const content = document.getElementById('content');
  const dimensionSelect = document.getElementById('dimensionSelect');
  const value1Select = document.getElementById('value1Select');
  const value2Select = document.getElementById('value2Select');
  const compareBtn = document.getElementById('compareBtn');

  let options = null;

  function isConfigured() {
    return APP_CONFIG.API_URL && APP_CONFIG.API_URL.indexOf('PASTE_YOUR') === -1;
  }

  function escapeHtml_(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function fmtAvg(v) {
    return (v === null || v === undefined || isNaN(v)) ? '—' : v + ' / 5';
  }

  const DIMENSION_KEY = { trainer: 'trainers', type: 'types', year: 'years', organizer: 'organizers' };

  function populateValueSelects() {
    const key = DIMENSION_KEY[dimensionSelect.value];
    const values = (options && options[key]) || [];
    const optionsHtml = values.map(v => '<option>' + escapeHtml_(v) + '</option>').join('');
    value1Select.innerHTML = optionsHtml;
    value2Select.innerHTML = optionsHtml;
    if (values.length > 1) value2Select.selectedIndex = 1;
  }

  async function init() {
    if (!isConfigured()) {
      content.innerHTML = '<div class="error-state">⚠️ لم يتم ربط رابط الخادم (API_URL) بعد.</div>';
      return;
    }
    try {
      const res = await fetch(APP_CONFIG.API_URL + '?action=comparisonOptions');
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'تعذّر تحميل الخيارات');
      options = json.data;
      populateValueSelects();
    } catch (err) {
      content.innerHTML = '<div class="error-state">خطأ: ' + err.message + '</div>';
    }
  }

  dimensionSelect.addEventListener('change', populateValueSelects);

  compareBtn.addEventListener('click', async () => {
    const dimension = dimensionSelect.value;
    const value1 = value1Select.value;
    const value2 = value2Select.value;
    if (!value1 || !value2) return;

    content.innerHTML = '<div class="loading-state">جاري المقارنة...</div>';
    try {
      const res = await fetch(APP_CONFIG.API_URL + '?action=compare&dimension=' + encodeURIComponent(dimension) +
        '&value1=' + encodeURIComponent(value1) + '&value2=' + encodeURIComponent(value2));
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'تعذّر إتمام المقارنة');
      render(json.data);
    } catch (err) {
      content.innerHTML = '<div class="error-state">خطأ: ' + err.message + '</div>';
    }
  });

  function render(d) {
    const rows = [
      ['عدد الورش/البرامج', d.a.workshopCount, d.b.workshopCount],
      ['إجمالي المشاركين', d.a.totalParticipants, d.b.totalParticipants],
      ['متوسط التقييم العام', fmtAvg(d.a.avgOverall), fmtAvg(d.b.avgOverall)],
      ['أفضل مدرب ضمنها', d.a.bestTrainer ? (escapeHtml_(d.a.bestTrainer) + ' (' + fmtAvg(d.a.bestTrainerAvg) + ')') : '—',
                          d.b.bestTrainer ? (escapeHtml_(d.b.bestTrainer) + ' (' + fmtAvg(d.b.bestTrainerAvg) + ')') : '—'],
    ];

    let html = '<div class="card" style="margin-top:16px;"><h3 style="margin-top:0;">مقارنة: ' + escapeHtml_(d.a.label) + ' ⚖️ ' + escapeHtml_(d.b.label) + '</h3>' +
      '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:14px;">' +
      '<thead><tr style="text-align:right;color:var(--muted);border-bottom:2px solid var(--border);">' +
      '<th style="padding:10px 8px;"></th>' +
      '<th style="padding:10px 8px;color:var(--primary-dark);">' + escapeHtml_(d.a.label) + '</th>' +
      '<th style="padding:10px 8px;color:var(--primary-dark);">' + escapeHtml_(d.b.label) + '</th>' +
      '</tr></thead><tbody>';
    rows.forEach(r => {
      html += '<tr style="border-top:1px solid var(--border);">' +
        '<td style="padding:10px 8px;color:var(--muted);">' + r[0] + '</td>' +
        '<td style="padding:10px 8px;font-weight:700;">' + r[1] + '</td>' +
        '<td style="padding:10px 8px;font-weight:700;">' + r[2] + '</td>' +
        '</tr>';
    });
    html += '</tbody></table></div></div>';

    content.innerHTML = html;
  }

  init();
})();
