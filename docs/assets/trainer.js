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
      content.innerHTML = '<div class="error-state">لم يتم تحديد مدرب.</div>';
      return;
    }

    try {
      const res = await fetch(APP_CONFIG.API_URL + '?action=trainer&name=' + encodeURIComponent(name));
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'تعذّر تحميل بيانات المدرب');
      render(json.data);
    } catch (err) {
      content.innerHTML = '<div class="error-state">خطأ: ' + err.message + '</div>';
    }
  }

  function render(d) {
    pageTitle.textContent = '👤 ' + d.trainer;
    const s = d.stats;

    let html = '<div class="kpi-grid">' +
      kpi(d.workshopCount, 'عدد الورش/البرامج') +
      kpi(d.totalParticipants, 'إجمالي المشاركين') +
      kpi(s.count, 'عدد الردود') +
      kpi(fmtAvg(s.avgOverall), 'المتوسط العام') +
      '</div>';

    // رسم بياني: متوسط كل ورشة على حدة
    html += '<div class="card"><h3 style="margin-top:0;">مقارنة التقييم بين الورش</h3>';
    if (!d.workshops || d.workshops.length === 0) {
      html += '<div class="empty-state">لا توجد ورش بعد.</div>';
    } else {
      d.workshops.forEach(w => {
        const pct = (w.avgOverall !== null && w.avgOverall !== undefined) ? Math.round((w.avgOverall / 5) * 100) : 0;
        html += '<div style="margin-bottom:14px;">' +
          '<div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:5px;">' +
          '<a href="workshop.html?id=' + encodeURIComponent(w.id) + '" style="color:var(--primary-dark);font-weight:700;text-decoration:none;">' + escapeHtml_(w.name) + '</a>' +
          '<span style="color:var(--muted);">' + fmtAvg(w.avgOverall) + '</span>' +
          '</div>' +
          '<div style="background:var(--chip-bg);border-radius:999px;height:9px;overflow:hidden;">' +
          '<div style="background:linear-gradient(90deg,var(--accent),var(--primary));height:100%;width:' + pct + '%;border-radius:999px;"></div>' +
          '</div></div>';
      });
    }
    html += '</div>';

    // تفصيل المحاور
    html += '<div class="card"><h3 style="margin-top:0;">محور تقييم محتوى ورشه</h3><table class="info-table">' +
      infoRow('وضوح أهداف الورشة', fmtAvg(s.avgGoalsClarity)) +
      infoRow('تنظيم وتسلسل المحتوى', fmtAvg(s.avgContentStructure)) +
      infoRow('ملاءمة الموضوع', fmtAvg(s.avgTopicRelevance)) +
      infoRow('جودة المادة العلمية', fmtAvg(s.avgMaterialQuality)) +
      infoRow('متوسط المحور', fmtAvg(s.avgContentCategory)) +
      '</table></div>';

    html += '<div class="card"><h3 style="margin-top:0;">محور تقييم المدرب نفسه</h3><table class="info-table">' +
      infoRow('وضوح الشرح', fmtAvg(s.avgTrainerClarity)) +
      infoRow('إيصال المعلومات', fmtAvg(s.avgTrainerCommunication)) +
      infoRow('التفاعل مع المشاركين', fmtAvg(s.avgTrainerInteraction)) +
      infoRow('إدارة الوقت', fmtAvg(s.avgTrainerTimeMgmt)) +
      infoRow('متوسط المحور', fmtAvg(s.avgTrainerCategory)) +
      '</table></div>';

    // قائمة الورش
    html += '<div class="card"><h3 style="margin-top:0;">كل الورش والبرامج (' + d.workshops.length + ')</h3>' +
      '<div class="table-wrap" style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:13px;">' +
      '<thead><tr style="text-align:right;color:var(--muted);">' +
      '<th style="padding:8px 6px;">الاسم</th><th style="padding:8px 6px;">النوع</th><th style="padding:8px 6px;">التاريخ</th>' +
      '<th style="padding:8px 6px;">المشاركين</th><th style="padding:8px 6px;">الردود</th><th style="padding:8px 6px;">المتوسط</th></tr></thead><tbody>';
    d.workshops.forEach(w => {
      html += '<tr style="border-top:1px solid var(--border);">' +
        '<td style="padding:8px 6px;"><a href="workshop.html?id=' + encodeURIComponent(w.id) + '" style="color:var(--primary-dark);font-weight:700;text-decoration:none;">' + escapeHtml_(w.name) + '</a></td>' +
        '<td style="padding:8px 6px;">' + escapeHtml_(w.type || '—') + '</td>' +
        '<td style="padding:8px 6px;">' + escapeHtml_(w.date || '—') + '</td>' +
        '<td style="padding:8px 6px;">' + (w.participants || 0) + '</td>' +
        '<td style="padding:8px 6px;">' + w.responseCount + '</td>' +
        '<td style="padding:8px 6px;">' + fmtAvg(w.avgOverall) + '</td>' +
        '</tr>';
    });
    html += '</tbody></table></div></div>';

    // كل التعليقات
    html += '<div class="card"><h3 style="margin-top:0;">كل الملاحظات والمقترحات (' + s.comments.length + ')</h3>';
    if (s.comments.length === 0) {
      html += '<div class="empty-state">لا توجد ملاحظات بعد.</div>';
    } else {
      s.comments.forEach(c => {
        html += '<div class="comment-item">' + escapeHtml_(c.text) + '</div>';
      });
    }
    html += '</div>';

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
