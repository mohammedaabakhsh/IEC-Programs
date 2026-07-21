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

  function fmtDate(v) {
    if (!v) return '';
    try { return new Date(v).toLocaleDateString('ar-SA'); } catch (e) { return ''; }
  }

  async function load() {
    if (!isConfigured()) {
      content.innerHTML = '<div class="error-state">⚠️ لم يتم ربط رابط الخادم (API_URL) بعد.</div>';
      return;
    }
    try {
      const res = await fetch(APP_CONFIG.API_URL + '?action=reports');
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'تعذّر تحميل التقارير');
      render(json.data);
    } catch (err) {
      content.innerHTML = '<div class="error-state">خطأ: ' + err.message + '</div>';
    }
  }

  function render(d) {
    let html = '';

    // مؤشرات عامة
    html += '<div class="kpi-grid">' +
      kpi(d.totalWorkshops, 'إجمالي الورش والبرامج') +
      kpi(d.totalParticipants, 'إجمالي المشاركين') +
      kpi(d.totalResponses, 'إجمالي الردود') +
      kpi(fmtAvg(d.avgOverall), 'متوسط الرضا العام') +
      '</div>';

    // تحليل حسب نوع النشاط
    if (d.byType && d.byType.length > 0) {
      html += '<div class="card"><h3 style="margin-top:0;">التوزيع حسب نوع النشاط</h3>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
        d.byType.map(t =>
          '<div style="background:var(--chip-bg);border-radius:14px;padding:12px 18px;min-width:140px;">' +
          '<div style="font-weight:800;color:var(--primary-dark);">' + escapeHtml_(t.type) + '</div>' +
          '<div style="font-size:12.5px;color:var(--muted);margin-top:4px;">' + t.workshopCount + ' نشاط — متوسط ' + fmtAvg(t.avgOverall) + '</div>' +
          '</div>'
        ).join('') +
        '</div></div>';
    }

    // تحليل حسب المدرب
    if (d.byTrainer && d.byTrainer.length > 0) {
      html += '<div class="card"><h3 style="margin-top:0;">تحليل الأداء حسب المدرب</h3>';
      d.byTrainer.forEach(t => {
        const pct = (t.avgOverall !== null && t.avgOverall !== undefined) ? Math.round((t.avgOverall / 5) * 100) : 0;
        html += '<div style="margin-bottom:16px;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
          '<strong>' + escapeHtml_(t.trainer) + '</strong>' +
          '<span style="font-size:12.5px;color:var(--muted);">' + t.workshopCount + ' ورشة/برنامج · ' + t.totalParticipants + ' مشارك · ' + t.responseCount + ' رد</span>' +
          '</div>' +
          '<div style="background:var(--chip-bg);border-radius:999px;height:10px;overflow:hidden;">' +
          '<div style="background:linear-gradient(90deg,var(--accent),var(--primary));height:100%;width:' + pct + '%;border-radius:999px;"></div>' +
          '</div>' +
          '<div style="font-size:12px;color:var(--muted);margin-top:4px;">متوسط التقييم: ' + fmtAvg(t.avgOverall) + '</div>' +
          '</div>';
      });
      html += '</div>';
    } else {
      html += '<div class="card"><div class="empty-state">لا توجد بيانات كافية بعد لتحليل المدربين.</div></div>';
    }

    // أحدث الملاحظات
    html += '<div class="card"><h3 style="margin-top:0;">أحدث الملاحظات والمقترحات (' + (d.recentComments ? d.recentComments.length : 0) + ')</h3>';
    if (!d.recentComments || d.recentComments.length === 0) {
      html += '<div class="empty-state">لا توجد ملاحظات بعد.</div>';
    } else {
      d.recentComments.forEach(c => {
        html += '<div class="comment-item"><div style="font-size:11.5px;color:var(--accent);font-weight:700;margin-bottom:4px;">' +
          escapeHtml_(c.workshopName || '') + (c.date ? ' — ' + fmtDate(c.date) : '') + '</div>' +
          escapeHtml_(c.text) + '</div>';
      });
    }
    html += '</div>';

    content.innerHTML = html;
  }

  function kpi(value, label) {
    return '<div class="kpi"><div class="value">' + value + '</div><div class="label">' + label + '</div></div>';
  }

  load();
})();
