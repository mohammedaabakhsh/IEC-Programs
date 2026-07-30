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

  function fmtPct(v) {
    return (v === null || v === undefined || isNaN(v)) ? '—' : v + '%';
  }

  async function load() {
    if (!isConfigured()) {
      content.innerHTML = '<div class="error-state">⚠️ لم يتم ربط رابط الخادم (API_URL) بعد.<br>افتح ملف assets/config.js وضع رابط Apps Script Web App.</div>';
      return;
    }
    content.innerHTML = '<div class="loading-state">جاري تحميل المؤشرات...</div>';
    try {
      const res = await fetch(APP_CONFIG.API_URL + '?action=dashboardBundle');
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'تعذّر تحميل البيانات');
      render(json.data.dashboard, json.data.kpiExtended, json.data.goals);
    } catch (err) {
      content.innerHTML = '<div class="error-state">تعذّر تحميل البيانات: ' + err.message + '</div>';
    }
  }

  function refreshButton() {
    return '<div style="text-align:left;margin-bottom:10px;">' +
      '<button class="btn secondary" id="refreshDashboardBtn" type="button" style="font-size:12px;padding:7px 14px;">تحديث</button>' +
      '</div>';
  }

  function render(d, k, g) {
    let html = refreshButton();

    if (!k.totalProgramsEver || k.totalProgramsEver === 0) {
      html += '<div class="card" style="text-align:center;padding:40px 20px;">' +
        '<div style="font-size:40px;margin-bottom:10px;">🚀</div>' +
        '<h3 style="margin:0 0 8px;">أهلًا بك في نظام إدارة برامج وورش المركز</h3>' +
        '<p style="color:var(--muted);font-size:13.5px;max-width:420px;margin:0 auto 18px;">ابدأ بإضافة أول ورشة، وبعدها ستظهر لك أهم مؤشرات الأداء والتقييم والحضور هنا.</p>' +
        '<a href="workshops.html" class="btn" style="text-decoration:none;">إضافة أول ورشة</a>' +
        '</div>';
      content.innerHTML = html;
      wireRefresh();
      return;
    }

    html += '<div class="dashboard-mobile-action">' +
      '<a href="workshops.html" class="btn">إضافة ورشة أو برنامج</a>' +
      '</div>';

    html += '<div class="card dashboard-achievements" style="background:linear-gradient(135deg,var(--primary),var(--primary-dark));color:#fff;">' +
      '<h3 style="margin-top:0;color:#fff;">ملخص الأداء</h3>' +
      '<div class="achievement-items" style="display:flex;flex-wrap:wrap;gap:24px;font-size:14px;">' +
      '<div><div style="font-size:26px;font-weight:800;">' + k.totalProgramsEver + '</div><div style="opacity:.85;">برنامج وورشة</div></div>' +
      '<div><div style="font-size:26px;font-weight:800;">' + k.totalParticipantsEver + '</div><div style="opacity:.85;">مشارك</div></div>' +
      '<div><div style="font-size:26px;font-weight:800;">' + fmtPct(k.satisfactionRate) + '</div><div style="opacity:.85;">رضا المشاركين</div></div>' +
      '<div><div style="font-size:26px;font-weight:800;">' + k.totalDistinctTrainers + '</div><div style="opacity:.85;">مدرب</div></div>' +
      '</div></div>';

    html += '<div class="kpi-grid dashboard-kpis" style="margin-top:18px;">' +
      kpi(d.totalWorkshops, 'إجمالي الورش') +
      kpi(d.totalPrograms, 'إجمالي البرامج') +
      kpi(d.totalParticipants, 'المشاركون') +
      kpi(fmtAvg(d.avgOverall), 'متوسط التقييم') +
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
      kpi(d.thisMonthCount, 'ورش هذا الشهر') +
      kpi(d.thisYearCount, 'ورش هذه السنة') +
      kpi(fmtPct(k.satisfactionRate), 'نسبة الرضا') +
      kpi(k.avgAttendance !== null ? k.avgAttendance : '—', 'متوسط الحضور') +
      kpi(
        k.growthRate === null ? '—' : (k.growthRate >= 0 ? '+' : '') + k.growthRate + '%',
        'نمو البرامج (' + k.curYear + ' مقابل ' + k.lastYear + ')'
      ) +
      '</div>';

    html += '<div class="card dashboard-goals" style="margin-top:18px;">' +
      '<h3 style="margin-top:0;">تقدّم أهداف سنة ' + g.year + '</h3>' +
      goalBar('عدد البرامج المنفذة', g.actualPrograms, g.targetPrograms, g.programsPct) +
      goalBar('عدد المشاركين', g.actualParticipants, g.targetParticipants, g.participantsPct) +
      '<p style="font-size:12px;color:var(--muted);margin-bottom:0;">يمكن تعديل الأهداف من صفحة <a href="settings.html" style="color:var(--primary-dark);font-weight:700;">الإعدادات</a>.</p>' +
      '</div>';

    html += '<div class="card dashboard-shortcuts" style="margin-top:18px;">' +
      '<h3 style="margin-top:0;">اختصارات سريعة</h3>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
      '<a href="workshops.html" class="btn">الورش والبرامج</a>' +
      '<a href="reports.html" class="btn secondary">التقارير</a>' +
      '<a href="certificate.html" class="btn secondary">الشهادات</a>' +
      '<a href="settings.html" class="btn secondary">الإعدادات</a>' +
      '</div></div>';

    content.innerHTML = html;
    wireRefresh();
  }

  function wireRefresh() {
    const btn = document.getElementById('refreshDashboardBtn');
    if (btn) btn.addEventListener('click', load);
  }

  function goalBar(label, actual, target, pct) {
    const width = pct === null ? 0 : Math.min(pct, 100);
    return '<div style="margin-bottom:16px;">' +
      '<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;">' +
      '<span>' + label + '</span>' +
      '<span style="color:var(--muted);">' + actual + ' / ' + target + (pct !== null ? ' (' + pct + '%)' : '') + '</span>' +
      '</div>' +
      '<div style="background:var(--chip-bg);border-radius:999px;height:10px;overflow:hidden;">' +
      '<div style="background:linear-gradient(90deg,var(--accent),var(--primary));height:100%;width:' + width + '%;border-radius:999px;"></div>' +
      '</div></div>';
  }

  function kpi(value, label) {
    return '<div class="kpi"><div class="value">' + value + '</div><div class="label">' + label + '</div></div>';
  }

  load();
})();
