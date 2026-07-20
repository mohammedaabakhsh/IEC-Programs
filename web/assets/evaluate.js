(function () {
  const formCard = document.getElementById('formCard');
  const pageTitle = document.getElementById('pageTitle');

  const QUESTIONS = [
    { key: 'content', label: 'مدى رضاك عن محتوى البرنامج' },
    { key: 'organization', label: 'مدى رضاك عن التنظيم واللوجستيات' },
    { key: 'trainer', label: 'تقييمك للمدرب / مقدم الجلسة' },
    { key: 'goals', label: 'مدى تحقق أهداف البرنامج' },
    { key: 'benefit', label: 'مدى الاستفادة المتوقعة من تطبيق ما تم تعلمه' },
  ];

  function getParams() {
    const usp = new URLSearchParams(window.location.search);
    return {
      programId: usp.get('p') || '',
      programName: usp.get('n') ? decodeURIComponent(usp.get('n')) : '',
    };
  }

  function isConfigured() {
    return APP_CONFIG.API_URL && APP_CONFIG.API_URL.indexOf('PASTE_YOUR') === -1;
  }

  function renderForm(programName) {
    pageTitle.textContent = programName ? 'تقييم برنامج: ' + programName : 'نموذج تقييم البرنامج';

    let html = '<form id="evalForm">';
    if (!programName) {
      html += '<div class="rating-group"><label class="question">اسم البرنامج</label>' +
        '<input type="text" id="manualProgramName" placeholder="اكتب اسم البرنامج" required></div>';
    }

    QUESTIONS.forEach(q => {
      html += '<div class="rating-group">' +
        '<label class="question">' + q.label + '</label>' +
        '<div class="scale">' +
        [1, 2, 3, 4, 5].map(n =>
          '<label><input type="radio" name="' + q.key + '" value="' + n + '" required><span>' + n + '</span></label>'
        ).join('') +
        '</div>' +
        '<div class="scale-legend"><span>غير راضٍ إطلاقًا</span><span>راضٍ تمامًا</span></div>' +
        '</div>';
    });

    html += '<div class="rating-group">' +
      '<label class="question">أبرز الملاحظات والمقترحات التطويرية (اختياري)</label>' +
      '<textarea id="notes" rows="4"></textarea></div>';

    html += '<button type="submit" class="btn">إرسال التقييم</button>' +
      '<div id="formError" class="error-state" style="display:none;padding:10px 0 0;"></div>' +
      '</form>';

    formCard.innerHTML = html;

    document.querySelectorAll('.scale input').forEach(input => {
      input.addEventListener('change', () => {
        const group = input.closest('.scale');
        group.querySelectorAll('label').forEach(l => l.classList.remove('selected'));
        input.closest('label').classList.add('selected');
      });
    });

    document.getElementById('evalForm').addEventListener('submit', onSubmit);
  }

  async function onSubmit(e) {
    e.preventDefault();
    const errorEl = document.getElementById('formError');
    errorEl.style.display = 'none';

    const params = getParams();
    const manualNameEl = document.getElementById('manualProgramName');
    const programName = params.programName || (manualNameEl ? manualNameEl.value.trim() : '');

    if (!programName) {
      errorEl.textContent = 'يرجى إدخال اسم البرنامج.';
      errorEl.style.display = 'block';
      return;
    }

    const payload = { action: 'submitEvaluation', programId: params.programId, programName: programName, notes: document.getElementById('notes').value.trim() };
    for (const q of QUESTIONS) {
      const checked = document.querySelector('input[name="' + q.key + '"]:checked');
      if (!checked) {
        errorEl.textContent = 'يرجى الإجابة على جميع الأسئلة.';
        errorEl.style.display = 'block';
        return;
      }
      payload[q.key] = checked.value;
    }

    const submitBtn = e.target.querySelector('button[type=submit]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'جاري الإرسال...';

    try {
      // نرسل كنص عادي (text/plain) لتفادي مشاكل CORS preflight مع Apps Script
      const res = await fetch(APP_CONFIG.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!json.ok) throw new Error(json.error || 'تعذّر إرسال التقييم');

      renderSuccess();
    } catch (err) {
      errorEl.textContent = 'حدث خطأ أثناء الإرسال: ' + err.message;
      errorEl.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = 'إرسال التقييم';
    }
  }

  function renderSuccess() {
    formCard.innerHTML = '<div class="success-box">' +
      '<div class="icon">✅</div>' +
      '<h3>شكرًا لك، تم إرسال تقييمك بنجاح</h3>' +
      '<p style="color:var(--muted);">نقدّر وقتك، ملاحظاتك تساعدنا في تطوير برامجنا القادمة.</p>' +
      '</div>';
  }

  function init() {
    if (!isConfigured()) {
      formCard.innerHTML = '<div class="error-state">⚠️ لم يتم ربط رابط الخادم (API_URL) بعد. تواصل مع إدارة النظام.</div>';
      return;
    }
    const params = getParams();
    renderForm(params.programName);
  }

  init();
})();
