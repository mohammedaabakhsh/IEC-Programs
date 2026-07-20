(function () {
  const tableContainer = document.getElementById('tableContainer');
  const kpiGrid = document.getElementById('kpiGrid');
  const lastUpdatedEl = document.getElementById('lastUpdated');
  const refreshBtn = document.getElementById('refreshBtn');
  let chart = null;

  function isConfigured() {
    return APP_CONFIG.API_URL && APP_CONFIG.API_URL.indexOf('PASTE_YOUR') === -1;
  }

  async function loadDashboard() {
    if (!isConfigured()) {
      tableContainer.innerHTML = '<div class="error-state">⚠️ لم يتم ربط رابط الخادم (API_URL) بعد.<br>افتح ملف assets/config.js وضع رابط Apps Script Web App.</div>';
      return;
    }

    tableContainer.innerHTML = '<div class="loading-state">جاري تحميل البيانات...</div>';
    try {
      const res = await fetch(APP_CONFIG.API_URL + '?action=dashboard');
      const json = await res.json();

      if (!json.ok) throw new Error(json.error || 'خطأ غير معروف');

      renderKpis(json.data);
      renderTable(json.columns, json.data);
      renderChart(json.data);
      lastUpdatedEl.textContent = 'آخر تحديث: ' + new Date().toLocaleString('ar-SA');
    } catch (err) {
      tableContainer.innerHTML = '<div class="error-state">تعذّر تحميل البيانات: ' + err.message + '</div>';
    }
  }

  function renderKpis(rows) {
    if (!rows || rows.length === 0) {
      kpiGrid.innerHTML = '';
      return;
    }
    const totalPrograms = rows.length;
    const totalResponses = rows.reduce((s, r) => s + (Number(r[2]) || 0), 0);
    const overallAvgs = rows.map(r => Number(r[9])).filter(n => !isNaN(n) && n > 0);
    const overallAvg = overallAvgs.length ? (overallAvgs.reduce((a, b) => a + b, 0) / overallAvgs.length).toFixed(2) : '—';

    kpiGrid.innerHTML = [
      kpiCard(totalPrograms, 'عدد البرامج'),
      kpiCard(totalResponses, 'إجمالي الاستجابات'),
      kpiCard(overallAvg + ' / 5', 'متوسط الرضا العام'),
    ].join('');
  }

  function kpiCard(value, label) {
    return '<div class="kpi"><div class="value">' + value + '</div><div class="label">' + label + '</div></div>';
  }

  function renderTable(columns, rows) {
    if (!rows || rows.length === 0) {
      tableContainer.innerHTML = '<div class="empty-state">لا توجد بيانات برامج بعد. أضف برامج في ورقة "البرامج" داخل Google Sheets.</div>';
      return;
    }

    let html = '<div class="table-wrap"><table><thead><tr>';
    columns.forEach(c => { html += '<th>' + c + '</th>'; });
    html += '</tr></thead><tbody>';

    rows.forEach(row => {
      html += '<tr>' + row.map((v, i) => '<td>' + formatCell_(v, i) + '</td>').join('') + '</tr>';
    });

    html += '</tbody></table></div>';
    tableContainer.innerHTML = html;
  }

  function formatCell_(v, i) {
    if (i === columnsIndexOf_('آخر تحديث') && v) {
      return new Date(v).toLocaleString('ar-SA');
    }
    return v === '' || v === null || v === undefined ? '—' : v;
  }

  function columnsIndexOf_(name) {
    // ترتيب ثابت مطابق لـ CONFIG.DASHBOARD_COLUMNS في الخادم — "آخر تحديث" هو العمود الأخير (index 10)
    return 10;
  }

  function renderChart(rows) {
    const ctx = document.getElementById('chartCanvas');
    const labels = rows.map(r => r[0]);
    const data = rows.map(r => Number(r[9]) || 0);

    if (chart) chart.destroy();
    chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'المتوسط العام للرضا (من 5)',
          data: data,
          backgroundColor: '#1c4587',
          borderRadius: 6,
        }],
      },
      options: {
        indexAxis: 'y',
        scales: { x: { min: 0, max: 5 } },
        plugins: { legend: { display: false } },
      },
    });
  }

  refreshBtn.addEventListener('click', loadDashboard);
  loadDashboard();
})();
