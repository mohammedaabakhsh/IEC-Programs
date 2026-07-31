(function () {
  const content = document.getElementById('content');
  const ui = window.IEC_UI;

  function pct(v) { return v == null || isNaN(v) ? '—' : v + '%'; }
  function safe(v) { return ui.escapeHtml(v == null ? '' : v); }
  function dateLabel(value) {
    const d = new Date(value);
    if (isNaN(d.getTime())) return value || 'بدون تاريخ';
    return d.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' });
  }
  function statusOf(w) {
    const today = new Date(); today.setHours(0,0,0,0);
    const date = new Date(w.date); date.setHours(0,0,0,0);
    if (!isNaN(date.getTime()) && date >= today) return { text:'قادمة', cls:'upcoming' };
    if ((w.responseCount || 0) === 0) return { text:'تحتاج تقييم', cls:'low' };
    return { text:'مكتملة', cls:'done' };
  }

  async function load(fresh) {
    if (!APP_CONFIG.API_URL) {
      content.innerHTML = '<div class="error-state">لم يتم ربط الخادم بعد.</div>';
      return;
    }
    content.innerHTML = '<div class="dashboard-shell">' + ui.skeletonCards(4) + ui.skeletonCards(3) + '</div>';
    try {
      const data = await Promise.all([
        ui.apiGet('dashboardBundle', {}, { fresh: !!fresh }),
        ui.apiGet('workshops', {}, { fresh: !!fresh, ttl: 2 * 60 * 1000 })
      ]);
      render(data[0], data[1] || []);
    } catch (error) {
      content.innerHTML = '<div class="error-state">تعذّر تحميل لوحة التحكم: ' + safe(error.message) + '<br><button class="btn secondary" id="retryDashboard">إعادة المحاولة</button></div>';
      const retry = document.getElementById('retryDashboard');
      if (retry) retry.addEventListener('click', function () { load(true); });
    }
  }

  function render(bundle, workshops) {
    const k = bundle.kpiExtended || {};
    const d = bundle.dashboard || {};
    const sorted = workshops.slice().sort((a,b) => String(b.date || '').localeCompare(String(a.date || '')));
    const upcoming = workshops.filter(w => {
      const x = new Date(w.date); const t = new Date(); t.setHours(0,0,0,0); return !isNaN(x.getTime()) && x >= t;
    }).sort((a,b) => new Date(a.date) - new Date(b.date));
    const noResponses = workshops.filter(w => (w.responseCount || 0) === 0).length;
    const lowRated = workshops.filter(w => w.avgOverall != null && Number(w.avgOverall) < 3.5).length;

    content.innerHTML = '<div class="dashboard-shell">' +
      '<section class="dashboard-hero"><div><span class="eyebrow">لوحة الإدارة</span><h2>إدارة الورش وتطوير الأداء</h2><p>ملخص تنفيذي سريع يساعدك تعرف ما حدث وما يحتاج تدخل.</p></div><div class="hero-actions"><a class="btn btn-light" href="workshops.html">إضافة ورشة</a><button class="btn secondary" id="refreshDashboard">تحديث البيانات</button></div></section>' +
      '<section class="metric-grid-pro">' +
        metric(k.totalProgramsEver || 0, 'الورش والبرامج', 'من بداية النظام', '#2f7d4a') +
        metric(k.totalParticipantsEver || 0, 'إجمالي المشاركين', 'الحضور المسجل', '#3267a8') +
        metric(pct(k.satisfactionRate), 'متوسط الرضا', 'من التقييمات', '#b7791f') +
        metric(upcoming.length, 'الورش القادمة', 'تحتاج متابعة', '#7557a8') +
      '</section>' +
      '<section class="dashboard-columns"><div class="section-card"><div class="section-head"><h3>آخر الورش</h3><a href="workshops.html">عرض الكل</a></div><div class="activity-list">' +
        (sorted.slice(0,5).map(activity).join('') || '<div class="empty-state">لا توجد ورش مسجلة.</div>') +
      '</div></div><div class="section-card"><div class="section-head"><h3>ما يحتاج انتباهك</h3></div><div class="alert-stack">' +
        alert(upcoming.length ? 'أقرب ورشة قادمة' : 'لا توجد ورش قادمة', upcoming.length ? safe(upcoming[0].name) + ' — ' + safe(dateLabel(upcoming[0].date)) : 'أضف مواعيد البرامج القادمة لتظهر هنا.', '!') +
        alert(noResponses + ' ورشة دون ردود تقييم', noResponses ? 'راجع روابط التقييم وأرسلها للمشاركين.' : 'جميع الورش لديها ردود تقييم.', '✓') +
        alert(lowRated + ' ورشة منخفضة التقييم', lowRated ? 'تحتاج مراجعة الملاحظات والمحاور الأقل تقييماً.' : 'لا توجد مؤشرات منخفضة حالياً.', '↗') +
      '</div></div></section>' +
      '</div>';

    document.getElementById('refreshDashboard').addEventListener('click', function () {
      ui.toast('جاري تحديث لوحة التحكم', 'info');
      load(true);
    });
  }

  function metric(value, label, hint, color) {
    return '<article class="metric-pro" style="--metric-color:' + color + '"><strong>' + safe(value) + '</strong><span>' + safe(label) + '</span><small>' + safe(hint) + '</small></article>';
  }
  function activity(w) {
    const status = statusOf(w);
    return '<a class="activity-item" href="workshop.html?id=' + encodeURIComponent(w.id) + '"><div class="activity-date"><strong>' + safe(dateLabel(w.date)) + '</strong><span>' + safe(w.time || '') + '</span></div><div class="activity-copy"><h4>' + safe(w.name || 'ورشة بدون اسم') + '</h4><p>' + safe(w.trainer || 'لم يحدد المدرب') + ' · ' + safe(w.type || 'نشاط') + '</p></div><span class="activity-status ' + status.cls + '">' + status.text + '</span></a>';
  }
  function alert(title, description, icon) {
    return '<div class="alert-card"><span class="alert-icon">' + icon + '</span><div><strong>' + title + '</strong><p>' + description + '</p></div></div>';
  }

  load(false);
})();
