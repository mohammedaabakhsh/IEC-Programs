(function () {
  const content = document.getElementById('content');
  let state = null;

  function isConfigured() {
    return APP_CONFIG.API_URL && APP_CONFIG.API_URL.indexOf('PASTE_YOUR') === -1;
  }

  function escapeHtml_(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  async function load() {
    if (!isConfigured()) {
      content.innerHTML = '<div class="error-state">⚠️ لم يتم ربط رابط الخادم (API_URL) بعد.</div>';
      return;
    }
    try {
      const res = await fetch(APP_CONFIG.API_URL + '?action=settings');
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'تعذّر تحميل الإعدادات');
      state = json.data;
      render();
    } catch (err) {
      content.innerHTML = '<div class="error-state">تعذّر تحميل الإعدادات: ' + err.message + '</div>';
    }
  }

  function chipList(items, listKey) {
    if (!items || items.length === 0) return '<div class="empty-state" style="padding:14px;">لا توجد عناصر بعد.</div>';
    return '<div style="display:flex;flex-wrap:wrap;gap:8px;">' +
      items.map((item, i) =>
        '<span class="type-chip" style="display:inline-flex;align-items:center;gap:8px;position:static;">' +
        escapeHtml_(item) +
        '<button type="button" class="remove-chip" data-list="' + listKey + '" data-index="' + i + '" style="background:none;border:none;cursor:pointer;color:var(--danger);font-weight:800;font-size:14px;line-height:1;">✕</button>' +
        '</span>'
      ).join('') +
      '</div>';
  }

  function render() {
    let html = '';

    html += '<div class="card">' +
      '<h3 style="margin-top:0;">🎯 الأهداف السنوية</h3>' +
      '<p style="color:var(--muted);font-size:13px;">تُقارن تلقائيًا بالأرقام الفعلية للسنة الحالية بلوحة التحكم.</p>' +
      '<div class="form-row two-col">' +
      '<div><label>عدد البرامج المستهدف بالسنة</label><input type="number" id="s_targetPrograms" min="0" value="' + state.targetPrograms + '"></div>' +
      '<div><label>عدد المشاركين المستهدف بالسنة</label><input type="number" id="s_targetParticipants" min="0" value="' + state.targetParticipants + '"></div>' +
      '</div>' +
      '<button class="btn" id="saveGoalsBtn" type="button">حفظ الأهداف</button>' +
      '<span id="goalsSavedMsg" style="display:none;color:var(--primary);font-size:13px;margin-right:10px;">✓ تم الحفظ</span>' +
      '</div>';

    html += '<div class="card">' +
      '<h3 style="margin-top:0;">👥 الفئات المستهدفة</h3>' +
      '<p style="color:var(--muted);font-size:13px;">تظهر هذي القائمة كخيارات عند إضافة/تعديل أي ورشة أو برنامج.</p>' +
      '<div id="audienceChips">' + chipList(state.audienceCategories, 'audienceCategories') + '</div>' +
      '<div style="display:flex;gap:8px;margin-top:12px;">' +
      '<input type="text" id="newAudienceInput" placeholder="أضف فئة جديدة..." style="flex:1;">' +
      '<button class="btn secondary" id="addAudienceBtn" type="button">إضافة</button>' +
      '</div>' +
      '</div>';

    html += '<div class="card">' +
      '<h3 style="margin-top:0;">🔑 الكلمات المفتاحية</h3>' +
      '<p style="color:var(--muted);font-size:13px;">تُستخدم لتحليل أكثر المواضيع تنفيذًا من عناوين البرامج بصفحة التقارير.</p>' +
      '<div id="keywordChips">' + chipList(state.keywords, 'keywords') + '</div>' +
      '<div style="display:flex;gap:8px;margin-top:12px;">' +
      '<input type="text" id="newKeywordInput" placeholder="أضف كلمة مفتاحية جديدة..." style="flex:1;">' +
      '<button class="btn secondary" id="addKeywordBtn" type="button">إضافة</button>' +
      '</div>' +
      '</div>';

    content.innerHTML = html;
    wireEvents();
  }

  function wireEvents() {
    document.getElementById('saveGoalsBtn').addEventListener('click', async () => {
      state.targetPrograms = Number(document.getElementById('s_targetPrograms').value) || 0;
      state.targetParticipants = Number(document.getElementById('s_targetParticipants').value) || 0;
      await save({ targetPrograms: state.targetPrograms, targetParticipants: state.targetParticipants });
      const msg = document.getElementById('goalsSavedMsg');
      msg.style.display = 'inline';
      setTimeout(() => { msg.style.display = 'none'; }, 1800);
    });

    document.getElementById('addAudienceBtn').addEventListener('click', () => addItem('audienceCategories', 'newAudienceInput'));
    document.getElementById('newAudienceInput').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addItem('audienceCategories', 'newAudienceInput'); } });

    document.getElementById('addKeywordBtn').addEventListener('click', () => addItem('keywords', 'newKeywordInput'));
    document.getElementById('newKeywordInput').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addItem('keywords', 'newKeywordInput'); } });

    document.querySelectorAll('.remove-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const list = btn.getAttribute('data-list');
        const index = Number(btn.getAttribute('data-index'));
        state[list].splice(index, 1);
        render();
        save({ [list]: state[list] });
      });
    });
  }

  function addItem(listKey, inputId) {
    const input = document.getElementById(inputId);
    const value = input.value.trim();
    if (!value) return;
    if (state[listKey].indexOf(value) !== -1) { input.value = ''; return; }
    state[listKey].push(value);
    render();
    save({ [listKey]: state[listKey] });
  }

  async function save(payload) {
    try {
      await fetch(APP_CONFIG.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(Object.assign({ action: 'updateSettings' }, payload)),
      });
    } catch (err) {
      alert('تعذّر حفظ الإعدادات: ' + err.message);
    }
  }

  load();
})();
