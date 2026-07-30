(function () {
  const content = document.getElementById('content');

  function isConfigured() {
    return APP_CONFIG.API_URL && APP_CONFIG.API_URL.indexOf('PASTE_YOUR') === -1;
  }

  function escapeHtml_(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function fmtPct(v) {
    return (v === null || v === undefined || isNaN(v)) ? '—' : v + '%';
  }

  function fmtDate_(value) {
    if (!value) return 'بدون تاريخ';
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString('ar-SA', { day: 'numeric', month: 'long' });
  }

  function getUpcoming_(workshops) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return (workshops || []).filter(w => {
      const d = new Date(w.date);
      return !isNaN(d.getTime()) && d >= now;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  async function load() {
    if (!isConfigured()) {
      content.innerHTML = '<div class="error-state">لم يتم ربط الخادم بعد.</div>';
      return;
    }

    content.innerHTML = '<div class="loading-state">جاري تحميل لوحة التحكم...</div>';

    try {
      const [bundleRes, workshopsRes] = await Promise.all([
        fetch(APP_CONFIG.API_URL + '?action=dashboardBundle'),
        fetch(APP_CONFIG.API_URL + '?action=workshops')
      ]);
      const [bundleJson, workshopsJson] = await Promise.all([bundleRes.json(), workshopsRes.json()]);
      if (!bundleJson.ok) throw new Error(bundleJson.error || 'تعذّر تحميل المؤشرات');
      if (!workshopsJson.ok) throw new Error(workshopsJson.error || 'تعذّر تحميل الورش');
      render(bundleJson.data.kpiExtended, workshopsJson.data || []);
    } catch (err) {
      content.innerHTML = '<div class="error-state">تعذّر تحميل البيانات: ' + escapeHtml_(err.message) + '</div>';
    }
  }

  function render(k, workshops) {
    const upcoming = getUpcoming_(workshops);
    const recent = workshops.slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))).slice(0, 3);

    if (!k.totalProgramsEver || k.totalProgramsEver === 0) {
      content.innerHTML =
        '<section class="mobile-hero-card">' +
          '<div class="mobile-hero-copy"><span class="mobile-eyebrow">ابدأ الآن</span><h2>أضف أول ورشة أو برنامج</h2><p>بعد الإضافة ستظهر هنا المؤشرات وآخر الورش والتنبيهات.</p></div>' +
          '<a href="workshops.html" class="mobile-primary-action">إضافة ورشة جديدة</a>' +
        '</section>';
      return;
    }

    let html = '';
    html += '<section class="mobile-hero-card">' +
      '<div class="mobile-hero-copy"><span class="mobile-eyebrow">لوحة الإدارة</span><h2>إدارة الورش وتطوير الأداء</h2><p>متابعة سريعة لأهم الأرقام والأنشطة القادمة.</p></div>' +
      '<a href="workshops.html" class="mobile-primary-action">إضافة ورشة جديدة</a>' +
      '</section>';

    html += '<section class="mobile-section"><div class="mobile-section-head"><h3>نظرة سريعة</h3></div>' +
      '<div class="mobile-metric-grid">' +
        metric(k.totalProgramsEver, 'ورشة وبرنامج', 'metric-green') +
        metric(k.totalParticipantsEver, 'مشارك', 'metric-blue') +
        metric(fmtPct(k.satisfactionRate), 'متوسط الرضا', 'metric-amber') +
        metric(upcoming.length, 'ورش قادمة', 'metric-violet') +
      '</div></section>';

    html += '<section class="mobile-section"><div class="mobile-section-head"><h3>آخر الورش</h3><a href="workshops.html">عرض الكل</a></div>';
    if (recent.length) {
      html += '<div class="mobile-workshop-list">' + recent.map(workshopCard).join('') + '</div>';
    } else {
      html += '<div class="mobile-empty-card">لا توجد ورش مسجلة حتى الآن.</div>';
    }
    html += '</section>';

    html += '<section class="mobile-section"><div class="mobile-section-head"><h3>التنبيهات</h3></div>';
    if (upcoming.length) {
      const next = upcoming[0];
      html += '<a class="mobile-alert-card" href="workshop.html?id=' + encodeURIComponent(next.id) + '">' +
        '<span class="mobile-alert-icon">!</span><span><strong>ورشة قادمة</strong><small>' + escapeHtml_(next.name) + ' — ' + escapeHtml_(fmtDate_(next.date)) + '</small></span><b>›</b></a>';
    } else {
      html += '<div class="mobile-empty-card">لا توجد ورش قادمة حالياً.</div>';
    }
    html += '</section>';

    content.innerHTML = html;
  }

  function metric(value, label, tone) {
    return '<div class="mobile-metric-card ' + tone + '"><div class="mobile-metric-icon"></div><strong>' + value + '</strong><span>' + label + '</span></div>';
  }

  function workshopCard(w) {
    return '<a class="mobile-workshop-card" href="workshop.html?id=' + encodeURIComponent(w.id) + '">' +
      '<div class="mobile-workshop-date"><strong>' + escapeHtml_(fmtDate_(w.date)) + '</strong><span>' + escapeHtml_(w.time || '') + '</span></div>' +
      '<div class="mobile-workshop-copy"><h4>' + escapeHtml_(w.name || 'ورشة بدون اسم') + '</h4><p>' + escapeHtml_(w.trainer || 'لم يحدد المدرب') + '</p></div>' +
      '<span class="mobile-workshop-arrow">›</span>' +
      '</a>';
  }

  load();
})();