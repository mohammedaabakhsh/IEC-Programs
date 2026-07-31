(function () {
  const content = document.getElementById('content');

  function isConfigured() {
    return APP_CONFIG.API_URL && APP_CONFIG.API_URL.indexOf('PASTE_YOUR') === -1;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char];
    });
  }

  function fmtAvg(value) {
    return value === null || value === undefined || isNaN(value) ? '—' : Number(value).toFixed(2) + ' / 5';
  }

  async function load() {
    if (!isConfigured()) {
      content.innerHTML = '<div class="error-state">لم يتم ربط الخادم بعد.</div>';
      return;
    }

    content.innerHTML = '<div class="loading-state">جاري تحميل المدربين...</div>';

    try {
      const response = await fetch(APP_CONFIG.API_URL + '?action=reportsBundle');
      const json = await response.json();
      if (!json.ok) throw new Error(json.error || 'تعذّر تحميل المدربين');
      const trainers = (json.data && json.data.reports && json.data.reports.byTrainer) || [];
      render(trainers);
    } catch (error) {
      content.innerHTML = '<div class="error-state">تعذّر تحميل البيانات: ' + escapeHtml(error.message) + '</div>';
    }
  }

  function render(trainers) {
    if (!trainers.length) {
      content.innerHTML = '<div class="card"><div class="empty-state">لا توجد بيانات مدربين حتى الآن.</div></div>';
      return;
    }

    const sorted = trainers.slice().sort(function (a, b) {
      return (Number(b.avgOverall) || 0) - (Number(a.avgOverall) || 0);
    });

    let html = '<div class="card" style="margin-bottom:16px;">' +
      '<label for="trainerSelect" style="display:block;font-size:13px;font-weight:700;margin-bottom:8px;color:var(--primary-dark);">اختر المدرب</label>' +
      '<select id="trainerSelect" style="width:100%;">' +
      '<option value="">اختر من قائمة المدربين</option>' +
      sorted.map(function (trainer) {
        return '<option value="' + escapeHtml(trainer.trainer) + '">' + escapeHtml(trainer.trainer) + '</option>';
      }).join('') +
      '</select></div>';

    html += '<div class="kpi-grid">' +
      kpi(sorted.length, 'إجمالي المدربين') +
      kpi(sorted.reduce(function (sum, trainer) { return sum + (Number(trainer.workshopCount) || 0); }, 0), 'إجمالي الورش') +
      kpi(sorted.reduce(function (sum, trainer) { return sum + (Number(trainer.totalParticipants) || 0); }, 0), 'إجمالي المشاركين') +
      kpi(fmtAvg(average(sorted.map(function (trainer) { return Number(trainer.avgOverall); }))), 'متوسط التقييم') +
      '</div>';

    html += '<div class="card"><h3 style="margin-top:0;">جميع المدربين</h3><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;">' +
      sorted.map(function (trainer, index) {
        return '<a href="trainer.html?name=' + encodeURIComponent(trainer.trainer) + '" style="display:block;text-decoration:none;color:inherit;background:var(--chip-bg);border-radius:16px;padding:15px;border:1px solid var(--border);">' +
          '<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;">' +
            '<strong style="color:var(--primary-dark);font-size:15px;">' + escapeHtml(trainer.trainer) + '</strong>' +
            '<span style="font-size:11px;color:var(--muted);">#' + (index + 1) + '</span>' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px;text-align:center;">' +
            stat(trainer.workshopCount || 0, 'ورش') +
            stat(trainer.totalParticipants || 0, 'مشارك') +
            stat(fmtAvg(trainer.avgOverall), 'التقييم') +
          '</div>' +
        '</a>';
      }).join('') +
      '</div></div>';

    content.innerHTML = html;

    const select = document.getElementById('trainerSelect');
    select.addEventListener('change', function () {
      if (select.value) window.location.href = 'trainer.html?name=' + encodeURIComponent(select.value);
    });
  }

  function average(values) {
    const valid = values.filter(function (value) { return !isNaN(value) && value > 0; });
    if (!valid.length) return null;
    return valid.reduce(function (sum, value) { return sum + value; }, 0) / valid.length;
  }

  function kpi(value, label) {
    return '<div class="kpi-card"><div class="kpi-value">' + value + '</div><div class="kpi-label">' + label + '</div></div>';
  }

  function stat(value, label) {
    return '<div><strong style="display:block;color:var(--primary-dark);font-size:13px;">' + value + '</strong><span style="font-size:10px;color:var(--muted);">' + label + '</span></div>';
  }

  load();
})();
