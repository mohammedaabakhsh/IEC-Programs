(function () {
  const content = document.getElementById('content');
  const pageTitle = document.getElementById('pageTitle');

  function isConfigured() {
    return APP_CONFIG.API_URL && APP_CONFIG.API_URL.indexOf('PASTE_YOUR') === -1;
  }

  function getType() {
    return new URLSearchParams(window.location.search).get('type');
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
    const type = getType();
    if (!type) {
      content.innerHTML = '<div class="error-state">لم يتم تحديد نوع النشاط.</div>';
      return;
    }

    try {
      const res = await fetch(APP_CONFIG.API_URL + '?action=type&type=' + encodeURIComponent(type));
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'تعذّر تحميل بيانات نوع النشاط');
      render(json.data);
    } catch (err) {
      content.innerHTML = '<div class="error-state">خطأ: ' + err.message + '</div>';
    }
  }

  function render(d) {
    pageTitle.textContent = '🏷️ ' + d.type;
    const s = d.stats;

    let html = '<div class="kpi-grid">' +
      kpi(d.workshopCount, 'عدد الورش/البرامج') +
      kpi(d.totalParticipants, 'إجمالي المشاركين') +
      kpi(s.count, 'عدد الردود') +
      kpi(fmtAvg(s.avgOverall), 'متوسط التقييم العام') +
      '</div>';

    html += '<div class="card"><h3 style="margin-top:0;">أفضل المدربين في هذا النوع</h3>';
    if (!d.topTrainers || d.topTrainers.length === 0) {
      html += '<div class="empty-state">لا توجد بيانات كافية بعد.</div>';
    } else {
      html += '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
        d.topTrainers.map(t => '<a href="trainer.html?name=' + encodeURIComponent(t.trainer) + '" style="text-decoration:none;background:var(--chip-bg);border-radius:14px;padding:10px 16px;">' +
          '<div style="font-weight:700;color:var(--primary-dark);">' + escapeHtml_(t.trainer) + '</div>' +
          '<div style="font-size:12px;color:var(--muted);">' + t.workshopCount + ' نشاط · ' + fmtAvg(t.avgOverall) + '</div>' +
          '</a>').join('') +
        '</div>';
    }
    html += '</div>';

    html += '<div class="card"><h3 style="margin-top:0;">محور تقييم المحتوى</h3><table class="info-table">' +
      infoRow('وضوح أهداف الورشة', fmtAvg(s.avgGoalsClarity)) +
      infoRow('تنظيم وتسلسل المحتوى', fmtAvg(s.avgContentStructure)) +
      infoRow('ملاءمة الموضوع', fmtAvg(s.avgTopicRelevance)) +
      infoRow('جودة المادة العلمية', fmtAvg(s.avgMaterialQuality)) +
      infoRow('متوسط المحور', fmtAvg(s.avgContentCategory)) +
      '</table></div>';

    html += '<div class="card"><h3 style="margin-top:0;">محور تقييم المدرب</h3><table class="info-table">' +
      infoRow('وضوح الشرح', fmtAvg(s.avgTrainerClarity)) +
      infoRow('إيصال المعلومات', fmtAvg(s.avgTrainerCommunication)) +
      infoRow('التفاعل مع المشاركين', fmtAvg(s.avgTrainerInteraction)) +
      infoRow('إدارة الوقت', fmtAvg(s.avgTrainerTimeMgmt)) +
      infoRow('متوسط المحور', fmtAvg(s.avgTrainerCategory)) +
      '</table></div>';

    html += '<div class="card"><h3 style="margin-top:0;">كل الورش من هذا النوع (' + d.workshops.length + ')</h3>' +
      '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:13px;">' +
      '<thead><tr style="text-align:right;color:var(--muted);">' +
      '<th style="padding:8px 6px;">الاسم</th><th style="padding:8px 6px;">المدرب</th><th style="padding:8px 6px;">التاريخ</th>' +
      '<th style="padding:8px 6px;">المشاركين</th><th style="padding:8px 6px;">الردود</th><th style="padding:8px 6px;">المتوسط</th></tr></thead><tbody>';
    d.workshops.forEach(w => {
      html += '<tr style="border-top:1px solid var(--border);">' +
        '<td style="padding:8px 6px;"><a href="workshop.html?id=' + encodeURIComponent(w.id) + '" style="color:var(--primary-dark);font-weight:700;text-decoration:none;">' + escapeHtml_(w.name) + '</a></td>' +
        '<td style="padding:8px 6px;"><a href="trainer.html?name=' + encodeURIComponent(w.trainer) + '" style="color:inherit;text-decoration:none;">' + escapeHtml_(w.trainer || '—') + '</a></td>' +
        '<td style="padding:8px 6px;">' + escapeHtml_(w.date || '—') + '</td>' +
        '<td style="padding:8px 6px;">' + (w.participants || 0) + '</td>' +
        '<td style="padding:8px 6px;">' + w.responseCount + '</td>' +
        '<td style="padding:8px 6px;">' + fmtAvg(w.avgOverall) + '</td>' +
        '</tr>';
    });
    html += '</tbody></table></div></div>';

    content.innerHTML = html;
  }

  function kpi(value, label) {
    return '<div class="kpi"><div class="value">' + value + '</div><div class="label">' + label + '</div></div>';
  }

  function infoRow(label, value) {
    return '<tr><td>' + label + '</td><td>' + value + '</td></tr>';
  }

  load();
})();
