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

  async function fetchJson(action) {
    const res = await fetch(APP_CONFIG.API_URL + '?action=' + action);
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || ('تعذّر تحميل ' + action));
    return json.data;
  }

  async function load() {
    if (!isConfigured()) {
      content.innerHTML = '<div class="error-state">⚠️ لم يتم ربط رابط الخادم (API_URL) بعد.</div>';
      return;
    }
    try {
      const [reports, recommendations, activeTrainers, organizers, audiences, timeAnalysis, bestWorst, keywords, recurringPrograms] = await Promise.all([
        fetchJson('reports'),
        fetchJson('recommendations'),
        fetchJson('activeTrainers'),
        fetchJson('organizers'),
        fetchJson('audiences'),
        fetchJson('timeAnalysis'),
        fetchJson('bestWorst'),
        fetchJson('keywords'),
        fetchJson('recurringPrograms'),
      ]);
      render({ reports, recommendations, activeTrainers, organizers, audiences, timeAnalysis, bestWorst, keywords, recurringPrograms });
    } catch (err) {
      content.innerHTML = '<div class="error-state">خطأ: ' + err.message + '</div>';
    }
  }

  function render(data) {
    const d = data.reports;
    let html = '';

    // مؤشرات عامة
    html += '<div class="kpi-grid">' +
      kpi(d.totalWorkshops, 'إجمالي الورش والبرامج') +
      kpi(d.totalParticipants, 'إجمالي المشاركين') +
      kpi(d.totalResponses, 'إجمالي الردود') +
      kpi(fmtAvg(d.avgOverall), 'متوسط الرضا العام') +
      '</div>';

    // أداة المقارنة
    html += '<div class="card" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">' +
      '<div><h3 style="margin:0;">⚖️ أداة المقارنة</h3><p style="color:var(--muted);font-size:13px;margin:4px 0 0;">قارن بين مدربين، نوعين، سنتين، أو جهتين منظمتين جنبًا إلى جنب.</p></div>' +
      '<a href="compare.html" class="btn" style="text-decoration:none;">افتح أداة المقارنة</a>' +
      '</div>';

    // التوصيات الإدارية
    html += renderRecommendations(data.recommendations);

    // التوزيع حسب نوع النشاط
    if (d.byType && d.byType.length > 0) {
      html += '<div class="card"><h3 style="margin-top:0;">التوزيع حسب نوع النشاط</h3>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
        d.byType.map((t, i) => {
          const badge = (i === 0 && d.byType.length > 1) ? ' 🏆' : (i === d.byType.length - 1 && d.byType.length > 1 ? ' 🔻' : '');
          return '<a href="type.html?type=' + encodeURIComponent(t.type) + '" style="text-decoration:none;background:var(--chip-bg);border-radius:14px;padding:12px 18px;min-width:160px;display:block;">' +
            '<div style="font-weight:800;color:var(--primary-dark);">' + escapeHtml_(t.type) + badge + '</div>' +
            '<div style="font-size:12.5px;color:var(--muted);margin-top:4px;">' + t.workshopCount + ' نشاط · ' + t.totalParticipants + ' مشارك</div>' +
            '<div style="font-size:12.5px;color:var(--muted);margin-top:2px;">متوسط التقييم: ' + fmtAvg(t.avgOverall) + '</div>' +
            '</a>';
        }).join('') +
        '</div>' +
        (d.byType.length > 1 ? '<div style="font-size:11.5px;color:var(--muted);margin-top:10px;">🏆 الأعلى تقييمًا · 🔻 الأقل تقييمًا · اضغط أي نوع لتفاصيله</div>' : '') +
        '</div>';
    }

    // تحليل حسب المدرب
    if (d.byTrainer && d.byTrainer.length > 0) {
      html += '<div class="card"><h3 style="margin-top:0;">تحليل الأداء حسب المدرب</h3>';
      d.byTrainer.forEach(t => {
        const pct = (t.avgOverall !== null && t.avgOverall !== undefined) ? Math.round((t.avgOverall / 5) * 100) : 0;
        html += '<div style="margin-bottom:18px;padding-bottom:16px;border-bottom:1px solid var(--border);">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;flex-wrap:wrap;gap:6px;">' +
          '<a href="trainer.html?name=' + encodeURIComponent(t.trainer) + '" style="color:var(--primary-dark);font-weight:700;text-decoration:none;font-size:15px;">' + escapeHtml_(t.trainer) + '</a>' +
          '<span style="font-size:12.5px;color:var(--muted);">' + t.workshopCount + ' ورشة/برنامج · ' + t.totalParticipants + ' مشارك · ' + t.responseCount + ' رد</span>' +
          '</div>' +
          '<div style="background:var(--chip-bg);border-radius:999px;height:10px;overflow:hidden;">' +
          '<div style="background:linear-gradient(90deg,var(--accent),var(--primary));height:100%;width:' + pct + '%;border-radius:999px;"></div>' +
          '</div>' +
          '<div style="display:flex;gap:16px;flex-wrap:wrap;font-size:12px;color:var(--muted);margin-top:6px;">' +
          '<span>المتوسط العام: <strong style="color:var(--primary-dark);">' + fmtAvg(t.avgOverall) + '</strong></span>' +
          '<span>محور المحتوى: <strong style="color:var(--primary-dark);">' + fmtAvg(t.avgContentCategory) + '</strong></span>' +
          '<span>محور المدرب: <strong style="color:var(--primary-dark);">' + fmtAvg(t.avgTrainerCategory) + '</strong></span>' +
          '</div>' +
          (t.comments && t.comments.length > 0
            ? '<details style="margin-top:10px;"><summary style="cursor:pointer;font-size:12.5px;color:var(--accent);font-weight:700;">عرض ملاحظات المشاركين عنه (' + t.comments.length + ')</summary>' +
              '<div style="margin-top:8px;">' +
              t.comments.map(c => '<div class="comment-item">' + escapeHtml_(c.text) + '</div>').join('') +
              '</div></details>'
            : '') +
          '</div>';
      });
      html += '</div>';
    } else {
      html += '<div class="card"><div class="empty-state">لا توجد بيانات كافية بعد لتحليل المدربين.</div></div>';
    }

    // أكثر المدربين نشاطًا
    html += renderActiveTrainers(data.activeTrainers);

    // تحليل الجهات المنظمة
    html += renderOrganizers(data.organizers);

    // تحليل الفئات المستهدفة
    html += renderAudiences(data.audiences);

    // التحليل الزمني
    html += renderTimeAnalysis(data.timeAnalysis);

    // أفضل وأسوأ النتائج
    html += renderBestWorst(data.bestWorst);

    // الكلمات المفتاحية
    html += renderKeywords(data.keywords);

    // البرامج المتكررة
    html += renderRecurringPrograms(data.recurringPrograms);

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

  function renderRecommendations(recs) {
    let html = '<div class="card"><h3 style="margin-top:0;">💡 توصيات إدارية</h3>' +
      '<p style="font-size:11.5px;color:var(--muted);margin-top:-6px;">توصيات آلية مبنية على قواعد إحصائية ثابتة من بياناتك، وليست ذكاءً اصطناعيًا.</p>';
    if (!recs || recs.length === 0) {
      html += '<div class="empty-state">لا توجد توصيات كافية حاليًا — تحتاج مزيد من البيانات والتقييمات.</div>';
    } else {
      html += '<div style="display:flex;flex-direction:column;gap:8px;">' +
        recs.map(r => '<div class="comment-item" style="border-right:3px solid var(--accent);">' + escapeHtml_(r.text) + '</div>').join('') +
        '</div>';
    }
    html += '</div>';
    return html;
  }

  function renderActiveTrainers(at) {
    if (!at) return '';
    function miniList(title, items, valueFn) {
      if (!items || items.length === 0) return '';
      return '<div style="flex:1;min-width:220px;">' +
        '<h4 style="margin:0 0 8px;font-size:13.5px;color:var(--primary-dark);">' + title + '</h4>' +
        '<ol style="margin:0;padding-inline-start:20px;font-size:13px;">' +
        items.slice(0, 5).map(t => '<li style="margin-bottom:4px;"><a href="trainer.html?name=' + encodeURIComponent(t.trainer) + '" style="color:inherit;text-decoration:none;font-weight:700;">' + escapeHtml_(t.trainer) + '</a> — ' + valueFn(t) + '</li>').join('') +
        '</ol></div>';
    }
    return '<div class="card"><h3 style="margin-top:0;">🔥 أكثر المدربين نشاطًا</h3>' +
      '<div style="display:flex;gap:20px;flex-wrap:wrap;">' +
      miniList('الأكثر تنفيذًا', at.byWorkshopCount, t => t.workshopCount + ' نشاط') +
      miniList('الأعلى تقييمًا', at.byAvgOverall, t => fmtAvg(t.avgOverall)) +
      miniList('الأكثر مشاركين', at.byParticipants, t => t.totalParticipants + ' مشارك') +
      '</div></div>';
  }

  function renderOrganizers(list) {
    if (!list || list.length === 0) return '';
    return '<div class="card"><h3 style="margin-top:0;">🏢 تحليل الجهات المنظمة</h3>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
      list.map(o => '<div style="background:var(--chip-bg);border-radius:14px;padding:12px 18px;min-width:170px;">' +
        '<div style="font-weight:800;color:var(--primary-dark);">' + escapeHtml_(o.organizer) + '</div>' +
        '<div style="font-size:12.5px;color:var(--muted);margin-top:4px;">' + o.workshopCount + ' نشاط · ' + o.totalParticipants + ' مشارك</div>' +
        '<div style="font-size:12.5px;color:var(--muted);margin-top:2px;">متوسط التقييم: ' + fmtAvg(o.avgOverall) + '</div>' +
        '</div>').join('') +
      '</div></div>';
  }

  function renderAudiences(a) {
    if (!a || !a.list || a.list.length === 0) return '';
    return '<div class="card"><h3 style="margin-top:0;">👥 تحليل الفئات المستهدفة</h3>' +
      (a.mostTargeted ? '<p style="font-size:12.5px;color:var(--muted);margin-top:-6px;">أكثر فئة تم استهدافها: <strong style="color:var(--primary-dark);">' + escapeHtml_(a.mostTargeted) + '</strong></p>' : '') +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
      a.list.map(x => '<div style="background:var(--chip-bg);border-radius:14px;padding:12px 18px;min-width:150px;">' +
        '<div style="font-weight:800;color:var(--primary-dark);">' + escapeHtml_(x.audience) + '</div>' +
        '<div style="font-size:12.5px;color:var(--muted);margin-top:4px;">' + x.workshopCount + ' نشاط · ' + x.totalParticipants + ' مشارك</div>' +
        '<div style="font-size:12.5px;color:var(--muted);margin-top:2px;">متوسط التقييم: ' + fmtAvg(x.avgOverall) + '</div>' +
        '</div>').join('') +
      '</div></div>';
  }

  function renderTimeAnalysis(t) {
    if (!t || !t.byMonthName) return '';
    const maxCount = Math.max.apply(null, t.byMonthName.map(m => m.count).concat([1]));
    let html = '<div class="card"><h3 style="margin-top:0;">📅 التحليل الزمني</h3>';
    if (t.mostActiveMonth || t.leastActiveMonth) {
      html += '<div style="display:flex;gap:20px;flex-wrap:wrap;font-size:13px;margin-bottom:14px;">' +
        (t.mostActiveMonth ? '<span>📈 أنشط شهر: <strong style="color:var(--primary-dark);">' + t.mostActiveMonth.month + '</strong> (' + t.mostActiveMonth.count + ' نشاط)</span>' : '') +
        (t.leastActiveMonth ? '<span>📉 أقل شهر نشاطًا: <strong style="color:var(--primary-dark);">' + t.leastActiveMonth.month + '</strong> (' + t.leastActiveMonth.count + ' نشاط)</span>' : '') +
        '</div>';
    }
    html += '<div style="display:flex;align-items:flex-end;gap:6px;height:120px;margin-bottom:8px;">' +
      t.byMonthName.map(m => {
        const h = maxCount ? Math.max(4, Math.round((m.count / maxCount) * 100)) : 4;
        return '<div style="flex:1;text-align:center;">' +
          '<div style="background:linear-gradient(180deg,var(--accent),var(--primary));border-radius:4px 4px 0 0;height:' + h + 'px;" title="' + m.month + ': ' + m.count + '"></div>' +
          '</div>';
      }).join('') +
      '</div>' +
      '<div style="display:flex;gap:6px;font-size:10px;color:var(--muted);text-align:center;">' +
      t.byMonthName.map(m => '<div style="flex:1;">' + m.month.substring(0, 3) + '</div>').join('') +
      '</div>';

    if (t.byYear && t.byYear.length > 0) {
      html += '<div style="margin-top:18px;display:flex;gap:10px;flex-wrap:wrap;">' +
        t.byYear.map(y => '<div style="background:var(--chip-bg);border-radius:12px;padding:10px 16px;"><strong style="color:var(--primary-dark);">' + y.year + '</strong> — ' + y.count + ' نشاط</div>').join('') +
        '</div>';
    }
    html += '</div>';
    return html;
  }

  function renderBestWorst(bw) {
    if (!bw) return '';
    function workshopList(title, items) {
      if (!items || items.length === 0) return '<div style="flex:1;min-width:240px;"><h4 style="font-size:13.5px;color:var(--primary-dark);">' + title + '</h4><div class="empty-state" style="padding:10px;">لا توجد بيانات كافية.</div></div>';
      return '<div style="flex:1;min-width:240px;">' +
        '<h4 style="margin:0 0 8px;font-size:13.5px;color:var(--primary-dark);">' + title + '</h4>' +
        '<ol style="margin:0;padding-inline-start:20px;font-size:13px;">' +
        items.map(w => '<li style="margin-bottom:4px;"><a href="workshop.html?id=' + encodeURIComponent(w.id) + '" style="color:inherit;text-decoration:none;font-weight:700;">' + escapeHtml_(w.name) + '</a> — ' + fmtAvg(w.avgOverall) + '</li>').join('') +
        '</ol></div>';
    }
    function trainerList(title, items) {
      if (!items || items.length === 0) return '<div style="flex:1;min-width:240px;"><h4 style="font-size:13.5px;color:var(--primary-dark);">' + title + '</h4><div class="empty-state" style="padding:10px;">لا توجد بيانات كافية.</div></div>';
      return '<div style="flex:1;min-width:240px;">' +
        '<h4 style="margin:0 0 8px;font-size:13.5px;color:var(--primary-dark);">' + title + '</h4>' +
        '<ol style="margin:0;padding-inline-start:20px;font-size:13px;">' +
        items.map(t => '<li style="margin-bottom:4px;"><a href="trainer.html?name=' + encodeURIComponent(t.trainer) + '" style="color:inherit;text-decoration:none;font-weight:700;">' + escapeHtml_(t.trainer) + '</a> — ' + fmtAvg(t.avgOverall) + '</li>').join('') +
        '</ol></div>';
    }
    return '<div class="card"><h3 style="margin-top:0;">🏅 أفضل وأسوأ النتائج</h3>' +
      '<div style="display:flex;gap:20px;flex-wrap:wrap;margin-bottom:18px;">' +
      workshopList('أفضل 10 ورش/برامج', bw.bestWorkshops) +
      workshopList('أضعف 10 ورش/برامج', bw.worstWorkshops) +
      '</div>' +
      '<div style="display:flex;gap:20px;flex-wrap:wrap;">' +
      trainerList('أعلى 10 مدربين', bw.bestTrainers) +
      trainerList('أقل 10 مدربين', bw.worstTrainers) +
      '</div></div>';
  }

  function renderKeywords(kw) {
    if (!kw || kw.length === 0) return '';
    const maxCount = Math.max.apply(null, kw.map(k => k.count).concat([1]));
    return '<div class="card"><h3 style="margin-top:0;">🔑 الكلمات المفتاحية بعناوين البرامج</h3>' +
      '<p style="font-size:11.5px;color:var(--muted);margin-top:-6px;">القائمة قابلة للتعديل من صفحة <a href="settings.html" style="color:var(--primary-dark);font-weight:700;">⚙️ الإعدادات</a>.</p>' +
      kw.map(k => {
        const pct = maxCount ? Math.round((k.count / maxCount) * 100) : 0;
        return '<div style="margin-bottom:10px;">' +
          '<div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:4px;"><span>' + escapeHtml_(k.keyword) + '</span><span style="color:var(--muted);">' + k.count + '</span></div>' +
          '<div style="background:var(--chip-bg);border-radius:999px;height:8px;overflow:hidden;"><div style="background:linear-gradient(90deg,var(--accent),var(--primary));height:100%;width:' + pct + '%;border-radius:999px;"></div></div>' +
          '</div>';
      }).join('') +
      '</div>';
  }

  function renderRecurringPrograms(list) {
    if (!list || list.length === 0) return '';
    return '<div class="card"><h3 style="margin-top:0;">🔁 برامج نُفّذت أكثر من مرة</h3>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
      list.map(p => '<a href="program.html?name=' + encodeURIComponent(p.name) + '" style="text-decoration:none;background:var(--chip-bg);border-radius:14px;padding:10px 16px;">' +
        '<div style="font-weight:700;color:var(--primary-dark);">' + escapeHtml_(p.name) + '</div>' +
        '<div style="font-size:12px;color:var(--muted);">نُفّذ ' + p.executionCount + ' مرات</div>' +
        '</a>').join('') +
      '</div></div>';
  }

  function kpi(value, label) {
    return '<div class="kpi"><div class="value">' + value + '</div><div class="label">' + label + '</div></div>';
  }

  load();
})();
