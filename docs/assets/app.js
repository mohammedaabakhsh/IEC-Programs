(function () {
  const listContainer = document.getElementById('listContainer');
  const statusMsg = document.getElementById('statusMsg');
  const addBtn = document.getElementById('addBtn');
  const modalOverlay = document.getElementById('modalOverlay');
  const closeModal = document.getElementById('closeModal');
  const modalBody = document.getElementById('modalBody');

  const filterSearch = document.getElementById('filterSearch');
  const filterType = document.getElementById('filterType');
  const filterYear = document.getElementById('filterYear');
  const filterMonth = document.getElementById('filterMonth');
  const clearFiltersBtn = document.getElementById('clearFiltersBtn');

  const MONTH_NAMES_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

  let allWorkshops = [];

  function isConfigured() {
    return APP_CONFIG.API_URL && APP_CONFIG.API_URL.indexOf('PASTE_YOUR') === -1;
  }

  async function loadWorkshops() {
    if (!isConfigured()) {
      listContainer.innerHTML = '<div class="error-state">⚠️ لم يتم ربط رابط الخادم (API_URL) بعد.<br>افتح ملف assets/config.js وضع رابط Apps Script Web App.</div>';
      return;
    }
    listContainer.innerHTML = '<div class="loading-state">جاري تحميل الورش...</div>';
    try {
      const res = await fetch(APP_CONFIG.API_URL + '?action=workshops');
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'خطأ غير معروف');
      allWorkshops = json.data || [];
      populateFilterOptions();
      applyFiltersAndRender();
      statusMsg.textContent = 'آخر تحديث: ' + new Date().toLocaleString('ar-SA');
    } catch (err) {
      listContainer.innerHTML = '<div class="error-state">تعذّر تحميل البيانات: ' + err.message + '</div>';
    }
  }

  function populateFilterOptions() {
    const types = {};
    const years = {};
    allWorkshops.forEach(w => {
      if (w.type) types[w.type] = true;
      const y = String(w.date || '').substring(0, 4);
      if (y) years[y] = true;
    });

    filterType.innerHTML = '<option value="">الكل</option>' +
      Object.keys(types).sort().map(t => '<option value="' + escapeHtml_(t) + '">' + escapeHtml_(t) + '</option>').join('');

    filterYear.innerHTML = '<option value="">الكل</option>' +
      Object.keys(years).sort().reverse().map(y => '<option value="' + y + '">' + y + '</option>').join('');

    filterMonth.innerHTML = '<option value="">الكل</option>' +
      MONTH_NAMES_AR.map((m, i) => '<option value="' + String(i + 1).padStart(2, '0') + '">' + m + '</option>').join('');
  }

  function applyFiltersAndRender() {
    const search = filterSearch.value.trim().toLowerCase();
    const type = filterType.value;
    const year = filterYear.value;
    const month = filterMonth.value;

    const filtered = allWorkshops.filter(w => {
      if (type && w.type !== type) return false;
      if (year && String(w.date || '').substring(0, 4) !== year) return false;
      if (month && String(w.date || '').substring(5, 7) !== month) return false;
      if (search) {
        const haystack = ((w.name || '') + ' ' + (w.trainer || '') + ' ' + (w.organizer || '')).toLowerCase();
        if (haystack.indexOf(search) === -1) return false;
      }
      return true;
    });

    renderList(filtered);
  }

  [filterSearch, filterType, filterYear, filterMonth].forEach(el => {
    el.addEventListener('input', applyFiltersAndRender);
    el.addEventListener('change', applyFiltersAndRender);
  });

  clearFiltersBtn.addEventListener('click', () => {
    filterSearch.value = '';
    filterType.value = '';
    filterYear.value = '';
    filterMonth.value = '';
    applyFiltersAndRender();
  });

  function renderList(workshops) {
    if (!allWorkshops || allWorkshops.length === 0) {
      listContainer.innerHTML = '<div class="empty-state">لا توجد ورش بعد. اضغط "إضافة ورشة جديدة" لبدء أول ورشة.</div>';
      return;
    }
    if (!workshops || workshops.length === 0) {
      listContainer.innerHTML = '<div class="empty-state">ما فيه نتائج مطابقة للفلاتر الحالية.</div>';
      return;
    }
    let html = '<div class="workshop-grid">';
    workshops.forEach(w => {
      html += '<a class="workshop-card" href="workshop.html?id=' + encodeURIComponent(w.id) + '">' +
        (w.type ? '<span class="type-chip">' + escapeHtml_(w.type) + '</span>' : '') +
        '<h4>' + escapeHtml_(w.name) + '</h4>' +
        '<div class="meta">🆔 ' + escapeHtml_(w.id) + '<br>📅 ' + escapeHtml_(w.date || '—') + (w.time ? ' — ' + escapeHtml_(w.time) : '') + '<br>👤 ' + escapeHtml_(w.trainer || '—') + '</div>' +
        '<div class="stats-row">' +
        '<span class="stat-pill">الردود: ' + w.responseCount + '</span>' +
        '<span class="stat-pill">المتوسط: ' + (w.avgOverall !== null && w.avgOverall !== undefined ? w.avgOverall : '—') + ' / 5</span>' +
        '</div></a>';
    });
    html += '</div>';
    listContainer.innerHTML = html;
  }

  function escapeHtml_(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  async function loadAudienceOptions() {
    const select = document.getElementById('f_audience');
    if (!select || !isConfigured()) return;
    try {
      const res = await fetch(APP_CONFIG.API_URL + '?action=settings');
      const json = await res.json();
      if (!json.ok) return;
      const categories = json.data.audienceCategories || [];
      select.innerHTML = '<option value="">اختر الفئة</option>' +
        categories.map(c => '<option>' + escapeHtml_(c) + '</option>').join('');
    } catch (err) {
      // تجاهل بهدوء — الحقل يبقى بخيار افتراضي فقط
    }
  }

  const originalFormHtml = modalBody.innerHTML;

  function openModal() { modalOverlay.classList.add('open'); loadAudienceOptions(); }
  function closeModalFn() { modalOverlay.classList.remove('open'); resetForm(); }

  function resetForm() {
    modalBody.innerHTML = originalFormHtml;
    document.getElementById('addForm').addEventListener('submit', onCreateWorkshop);
    loadAudienceOptions();
  }

  addBtn.addEventListener('click', openModal);
  closeModal.addEventListener('click', closeModalFn);
  modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModalFn(); });

  document.getElementById('addForm').addEventListener('submit', onCreateWorkshop);
  loadAudienceOptions();

  async function onCreateWorkshop(e) {
    e.preventDefault();
    const errorEl = document.getElementById('addFormError');
    errorEl.style.display = 'none';

    const payload = {
      action: 'createWorkshop',
      name: document.getElementById('f_name').value.trim(),
      type: document.getElementById('f_type').value,
      description: document.getElementById('f_description').value.trim(),
      date: document.getElementById('f_date').value,
      time: document.getElementById('f_time').value,
      trainer: document.getElementById('f_trainer').value.trim(),
      audience: document.getElementById('f_audience').value,
      participants: document.getElementById('f_participants').value,
      organizer: document.getElementById('f_organizer').value.trim(),
    };

    const submitBtn = e.target.querySelector('button[type=submit]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'جاري الحفظ...';

    try {
      const res = await fetch(APP_CONFIG.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'تعذّر إنشاء الورشة');

      showSuccess(json);
      loadWorkshops();
    } catch (err) {
      errorEl.textContent = 'حدث خطأ: ' + err.message;
      errorEl.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = 'حفظ وإنشاء رابط التقييم';
    }
  }

  function showSuccess(json) {
    modalBody.innerHTML =
      '<div class="success-box">' +
      '<div class="icon">✅</div>' +
      '<h3>تم إنشاء الورشة بنجاح</h3>' +
      '<p style="color:var(--muted);font-size:13px;">شارك هذا الرابط أو الـ QR مع المشاركين بعد انتهاء الورشة</p>' +
      '<div class="link-box"><span id="evalLinkText">' + json.evalLink + '</span>' +
      '<button class="btn secondary" id="copyLinkBtn" type="button">نسخ</button></div>' +
      '<img src="' + json.qrUrl + '" width="180" height="180" alt="QR Code">' +
      '<a href="workshop.html?id=' + encodeURIComponent(json.id) + '" class="btn" style="display:inline-block;margin-top:10px;text-decoration:none;">فتح صفحة الورشة</a>' +
      '</div>';

    document.getElementById('copyLinkBtn').addEventListener('click', () => {
      navigator.clipboard.writeText(json.evalLink).then(() => {
        const btn = document.getElementById('copyLinkBtn');
        btn.textContent = 'تم النسخ ✓';
        setTimeout(() => { btn.textContent = 'نسخ'; }, 1500);
      });
    });
  }

  loadWorkshops();
})();
