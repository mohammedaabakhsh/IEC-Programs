(function () {
  const content = document.getElementById('content');
  const pageTitle = document.getElementById('pageTitle');
  const editModalOverlay = document.getElementById('editModalOverlay');
  const closeEditModal = document.getElementById('closeEditModal');
  const editForm = document.getElementById('editForm');

  let currentWorkshop = null;

  function isConfigured() {
    return APP_CONFIG.API_URL && APP_CONFIG.API_URL.indexOf('PASTE_YOUR') === -1;
  }

  function getId() {
    return new URLSearchParams(window.location.search).get('id');
  }

  function escapeHtml_(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  async function load() {
    if (!isConfigured()) {
      content.innerHTML = '<div class="error-state">⚠️ لم يتم ربط رابط الخادم (API_URL) بعد.</div>';
      return;
    }
    const id = getId();
    if (!id) {
      content.innerHTML = '<div class="error-state">لم يتم تحديد ورشة.</div>';
      return;
    }

    try {
      const res = await fetch(APP_CONFIG.API_URL + '?action=workshop&id=' + encodeURIComponent(id));
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'تعذّر تحميل بيانات الورشة');
      currentWorkshop = json.data;
      render(currentWorkshop);
    } catch (err) {
      content.innerHTML = '<div class="error-state">خطأ: ' + err.message + '</div>';
    }
  }

  function render(w) {
    pageTitle.textContent = w.name;
    if (w.type) {
      pageTitle.innerHTML = '<span class="type-chip" style="vertical-align:middle;margin-left:8px;">' + escapeHtml_(w.type) + '</span>' + escapeHtml_(w.name);
    }
    const s = w.stats;

    let html = '<div class="kpi-grid">' +
      kpi(s.count, 'عدد الردود') +
      kpi(fmtAvg(s.avgOverall), 'المتوسط العام') +
      kpi(fmtAvg(s.avgContentCategory), 'محور المحتوى') +
      kpi(fmtAvg(s.avgTrainerCategory), 'محور المدرب') +
      '</div>';

    html += '<div class="card">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;">' +
      '<h3 style="margin:0;">بيانات الورشة</h3>' +
      '<div style="display:flex;gap:8px;">' +
      '<button class="btn secondary" id="editBtn" type="button">✏️ تعديل</button>' +
      '<button class="btn" id="deleteBtn" type="button" style="background:var(--danger);">🗑 حذف</button>' +
      '</div></div>' +
      '<table class="info-table" style="margin-top:12px;">' +
      infoRow('المعرف', w.id) +
      infoRow('نوع النشاط', w.type) +
      infoRow('الوصف', w.description) +
      infoRow('التاريخ', w.date) +
      infoRow('الوقت', w.time) +
      infoRow('المدرب', w.trainer) +
      infoRow('الفئة المستهدفة', w.audience) +
      infoRow('عدد المشاركين', w.participants) +
      infoRow('الجهة المنظمة', w.organizer) +
      '</table></div>';

    if (w.evalLink) {
      html += '<div class="card"><h3 style="margin-top:0;">رابط ورمز QR للتقييم</h3>' +
        '<div class="link-box" style="margin-bottom:12px;"><span>' + escapeHtml_(w.evalLink) + '</span>' +
        '<button class="btn secondary" id="copyLinkBtn" type="button">نسخ</button></div>' +
        '<img src="' + w.qrUrl + '" width="160" height="160" alt="QR Code" style="border:1px solid var(--border);border-radius:8px;">' +
        '</div>';
    }

    html += '<div class="card"><h3 style="margin-top:0;">محور تقييم محتوى الورشة</h3><table class="info-table">' +
      infoRow('وضوح أهداف الورشة', fmtAvg(s.avgGoalsClarity)) +
      infoRow('تنظيم وتسلسل المحتوى', fmtAvg(s.avgContentStructure)) +
      infoRow('ملاءمة الموضوع', fmtAvg(s.avgTopicRelevance)) +
      infoRow('جودة المادة العلمية', fmtAvg(s.avgMaterialQuality)) +
      infoRow('متوسط المحور', fmtAvg(s.avgContentCategory)) +
      '</table></div>';

    html += '<div class="card"><h3 style="margin-top:0;">محور تقييم المدرب</h3><table class="info-table">' +
      infoRow('وضوح الشرح', fmtAvg(s.avgTrainerClarity)) +
      infoRow('إيصال المعلومات', fmtAvg(s.avgTrainerCommunication)) +
      infoRow('التفاعل مع المشاركين', fmtAvg(s.avgTrainerInteraction)) +
      infoRow('إدارة الوقت', fmtAvg(s.avgTrainerTimeMgmt)) +
      infoRow('متوسط المحور', fmtAvg(s.avgTrainerCategory)) +
      '</table></div>';

    html += '<div class="card"><h3 style="margin-top:0;">التقييم العام</h3><table class="info-table">' +
      infoRow('تقييمكم العام للورشة', fmtAvg(s.avgGeneral)) +
      '</table></div>';

    html += '<div class="card"><h3 style="margin-top:0;">الملاحظات والمقترحات (' + s.comments.length + ')</h3>';
    if (s.comments.length === 0) {
      html += '<div class="empty-state">لا توجد ملاحظات بعد.</div>';
    } else {
      s.comments.forEach(c => {
        html += '<div class="comment-item">' + escapeHtml_(c.text) + '</div>';
      });
    }
    html += '</div>';

    content.innerHTML = html;

    if (w.evalLink) {
      document.getElementById('copyLinkBtn').addEventListener('click', () => {
        navigator.clipboard.writeText(w.evalLink).then(() => {
          const btn = document.getElementById('copyLinkBtn');
          btn.textContent = 'تم النسخ ✓';
          setTimeout(() => { btn.textContent = 'نسخ'; }, 1500);
        });
      });
    }

    document.getElementById('editBtn').addEventListener('click', openEditModal);
    document.getElementById('deleteBtn').addEventListener('click', onDelete);
  }

  function kpi(value, label) {
    return '<div class="kpi"><div class="value">' + value + '</div><div class="label">' + label + '</div></div>';
  }

  function infoRow(label, value) {
    return '<tr><td>' + label + '</td><td>' + escapeHtml_(value || '—') + '</td></tr>';
  }

  function fmtAvg(v) {
    return (v === null || v === undefined || isNaN(v)) ? '—' : v + ' / 5';
  }

  async function loadAudienceOptions_(selectedValue) {
    const select = document.getElementById('e_audience');
    let categories = [];
    if (isConfigured()) {
      try {
        const res = await fetch(APP_CONFIG.API_URL + '?action=settings');
        const json = await res.json();
        if (json.ok) categories = json.data.audienceCategories || [];
      } catch (err) {
        // تجاهل بهدوء
      }
    }
    if (selectedValue && categories.indexOf(selectedValue) === -1) categories = categories.concat([selectedValue]);
    select.innerHTML = '<option value="">اختر الفئة</option>' +
      categories.map(c => '<option>' + escapeHtml_(c) + '</option>').join('');
    select.value = selectedValue || '';
  }

  async function openEditModal() {
    document.getElementById('e_name').value = currentWorkshop.name || '';
    document.getElementById('e_type').value = currentWorkshop.type || '';
    document.getElementById('e_description').value = currentWorkshop.description || '';
    document.getElementById('e_date').value = currentWorkshop.date || '';
    document.getElementById('e_time').value = currentWorkshop.time || '';
    document.getElementById('e_trainer').value = currentWorkshop.trainer || '';
    await loadAudienceOptions_(currentWorkshop.audience || '');
    document.getElementById('e_participants').value = currentWorkshop.participants || '';
    document.getElementById('e_organizer').value = currentWorkshop.organizer || '';
    document.getElementById('editFormError').style.display = 'none';
    editModalOverlay.classList.add('open');
  }

  function closeEditModalFn() {
    editModalOverlay.classList.remove('open');
  }

  closeEditModal.addEventListener('click', closeEditModalFn);
  editModalOverlay.addEventListener('click', e => { if (e.target === editModalOverlay) closeEditModalFn(); });

  editForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const errorEl = document.getElementById('editFormError');
    errorEl.style.display = 'none';

    const payload = {
      action: 'updateWorkshop',
      id: currentWorkshop.id,
      name: document.getElementById('e_name').value.trim(),
      type: document.getElementById('e_type').value,
      description: document.getElementById('e_description').value.trim(),
      date: document.getElementById('e_date').value,
      time: document.getElementById('e_time').value,
      trainer: document.getElementById('e_trainer').value.trim(),
      audience: document.getElementById('e_audience').value.trim(),
      participants: document.getElementById('e_participants').value,
      organizer: document.getElementById('e_organizer').value.trim(),
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
      if (!json.ok) throw new Error(json.error || 'تعذّر حفظ التعديلات');

      closeEditModalFn();
      load();
    } catch (err) {
      errorEl.textContent = 'حدث خطأ: ' + err.message;
      errorEl.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'حفظ التعديلات';
    }
  });

  async function onDelete() {
    if (!confirm('متأكد تبي تحذف ورشة "' + currentWorkshop.name + '"؟ الردود المرتبطة بها تبقى محفوظة بالشيت لكن لن تظهر بالتطبيق.')) return;

    try {
      const res = await fetch(APP_CONFIG.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'deleteWorkshop', id: currentWorkshop.id }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'تعذّر حذف الورشة');

      window.location.href = 'workshops.html';
    } catch (err) {
      alert('حدث خطأ أثناء الحذف: ' + err.message);
    }
  }

  load();
})();
