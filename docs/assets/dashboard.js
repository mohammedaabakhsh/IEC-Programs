(function () {
  const content = document.getElementById('content');

  function isConfigured() {
    return APP_CONFIG.API_URL && APP_CONFIG.API_URL.indexOf('PASTE_YOUR') === -1;
  }

  function fmtPct(v) {
    return (v === null || v === undefined || isNaN(v)) ? '—' : v + '%';
  }

  async function load() {
    if (!isConfigured()) {
      content.innerHTML = '<div class="error-state">لم يتم ربط الخادم بعد.</div>';
      return;
    }

    content.innerHTML = '<div class="loading-state">جاري تحميل المؤشرات...</div>';

    try {
      const res = await fetch(APP_CONFIG.API_URL + '?action=dashboardBundle');
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'تعذّر تحميل البيانات');
      render(json.data.kpiExtended);
    } catch (err) {
      content.innerHTML = '<div class="error-state">تعذّر تحميل البيانات: ' + err.message + '</div>';
    }
  }

  function render(k) {
    if (!k.totalProgramsEver || k.totalProgramsEver === 0) {
      content.innerHTML = '<div class="dashboard-mobile-action"><a href="workshops.html" class="btn">إضافة أول ورشة</a></div>' +
        '<div class="card" style="text-align:center;padding:32px 20px;">' +
        '<h3 style="margin:0 0 8px;">ابدأ بإضافة أول ورشة</h3>' +
        '<p style="color:var(--muted);margin:0;">بعد الإضافة ستظهر لك أهم المؤشرات هنا بشكل مختصر وواضح.</p>' +
        '</div>';
      return;
    }

    content.innerHTML =
      '<div class="dashboard-mobile-action">' +
        '<a href="workshops.html" class="btn">إضافة ورشة أو برنامج جديد</a>' +
      '</div>' +
      '<div class="card dashboard-achievements">' +
        '<h3 style="margin-top:0;">نظرة سريعة</h3>' +
        '<div class="achievement-items">' +
          metric(k.totalProgramsEver, 'ورش وبرامج') +
          metric(k.totalParticipantsEver, 'مشارك') +
          metric(fmtPct(k.satisfactionRate), 'متوسط الرضا') +
          metric(k.totalDistinctTrainers, 'مدرب') +
        '</div>' +
      '</div>' +
      '<div class="card dashboard-mobile-links">' +
        '<a href="workshops.html">عرض الورش</a>' +
        '<a href="reports.html">فتح التقارير</a>' +
      '</div>';
  }

  function metric(value, label) {
    return '<div><div>' + value + '</div><div>' + label + '</div></div>';
  }

  load();
})();
