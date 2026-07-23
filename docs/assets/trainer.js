(function () {
  const content = document.getElementById('content');
  const pageTitle = document.getElementById('pageTitle');
  const profileModalOverlay = document.getElementById('profileModalOverlay');
  const closeProfileModal = document.getElementById('closeProfileModal');
  const profileForm = document.getElementById('profileForm');

  let currentTrainerName = null;
  let currentProfile = null;

  const AVATAR_COLORS = ['#2f6738', '#4e8b4d', '#214c2b', '#7a5c2e', '#3d6b6b', '#5c4a8a'];

  function isConfigured() {
    return APP_CONFIG.API_URL && APP_CONFIG.API_URL.indexOf('PASTE_YOUR') === -1;
  }

  function getName() {
    return new URLSearchParams(window.location.search).get('name');
  }

  function escapeHtml_(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function fmtAvg(v) {
    return (v === null || v === undefined || isNaN(v)) ? '—' : v + ' / 5';
  }

  function initials_(name) {
    const parts = String(name || '').trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return '؟';
    if (parts.length === 1) return parts[0].charAt(0);
    return parts[0].charAt(0) + parts[1].charAt(0);
  }

  function avatarColor_(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length;
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  }

  async function load() {
    if (!isConfigured()) {
      content.innerHTML = '<div class="error-state">⚠️ لم يتم ربط رابط الخادم (API_URL) بعد.</div>';
      return;
    }
    const name = getName();
    if (!name) {
      content.innerHTML = '<div class="error-state">لم يتم تحديد مدرب.</div>';
      return;
    }
    currentTrainerName = name;

    try {
      const res = await fetch(APP_CONFIG.API_URL + '?action=trainer&name=' + encodeURIComponent(name));
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'تعذّر تحميل بيانات المدرب');
      const detail = json.data;
      currentProfile = detail.profile;
      render(detail, detail.profile);
    } catch (err) {
      content.innerHTML = '<div class="error-state">خطأ: ' + err.message + '</div>';
    }
  }

  function trendBadge_(trend) {
    if (!trend || trend.direction === 'insufficient') return '';
    const map = {
      improving: { icon: '📈', label: 'في تحسن', color: 'var(--primary)' },
      declining: { icon: '📉', label: 'في تراجع', color: 'var(--danger)' },
      stable: { icon: '➖', label: 'مستقر', color: 'var(--muted)' },
    };
    const m = map[trend.direction];
    if (!m) return '';
    return '<span style="display:inline-flex;align-items:center;gap:4px;font-size:12.5px;font-weight:700;color:' + m.color + ';background:var(--chip-bg);padding:4px 10px;border-radius:999px;">' + m.icon + ' ' + m.label + '</span>';
  }

  function render(d, profile) {
    pageTitle.textContent = '👤 ' + d.trainer;
    const s = d.stats;
    const color = avatarColor_(d.trainer);

    // بطاقة الهوية: أفاتار + شارات + مؤشر الاتجاه
    let html = '<div class="card" style="display:flex;gap:18px;align-items:center;flex-wrap:wrap;">' +
      '<div style="width:64px;height:64px;border-radius:50%;background:' + color + ';color:#fff;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;flex-shrink:0;">' + escapeHtml_(initials_(d.trainer)) + '</div>' +
      '<div style="flex:1;min-width:200px;">' +
      '<div style="font-size:18px;font-weight:800;color:var(--primary-dark);">' + escapeHtml_(d.trainer) + (profile.title ? '<span style="font-weight:500;color:var(--muted);font-size:13.5px;"> — ' + escapeHtml_(profile.title) + '</span>' : '') + '</div>' +
      (profile.organization ? '<div style="font-size:13px;color:var(--muted);margin-top:2px;">🏢 ' + escapeHtml_(profile.organization) + '</div>' : '') +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">' +
      (d.badges || []).map(b => '<span class="type-chip">' + b.icon + ' ' + escapeHtml_(b.label) + '</span>').join('') +
      trendBadge_(d.trend) +
      '</div></div>' +
      '<button class="btn secondary" id="editProfileBtn" type="button">✏️ تعديل الملف الشخصي</button>' +
      '</div>';

    // بطاقة التواصل / النبذة (أو حالة فاضية)
    if (profile.hasProfile && (profile.email || profile.phone || profile.link || profile.bio)) {
      html += '<div class="card"><h3 style="margin-top:0;">نبذة وبيانات التواصل</h3>';
      if (profile.bio) html += '<p style="color:var(--muted);font-size:13.5px;">' + escapeHtml_(profile.bio) + '</p>';
      html += '<div style="display:flex;gap:16px;flex-wrap:wrap;font-size:13px;">' +
        (profile.email ? '<span>📧 ' + escapeHtml_(profile.email) + '</span>' : '') +
        (profile.phone ? '<span>📱 ' + escapeHtml_(profile.phone) + '</span>' : '') +
        (profile.link ? '<span>🔗 <a href="' + escapeHtml_(profile.link) + '" target="_blank" rel="noopener" style="color:var(--primary-dark);">رابط شخصي</a></span>' : '') +
        '</div></div>';
    } else {
      html += '<div class="card" style="text-align:center;">' +
        '<p style="color:var(--muted);font-size:13.5px;">ما تم إضافة ملف تعريفي لهذا المدرب بعد.</p>' +
        '<button class="btn" id="addProfileBtn" type="button">➕ إضافة ملف تعريفي</button>' +
        '</div>';
    }

    if (profile.internalNotes) {
      html += '<div class="card" style="background:#fdf6e3;border:1px solid #eede9c;">' +
        '<h3 style="margin-top:0;color:#8a6d1f;">🗒️ ملاحظات داخلية (خاصة بالإدارة)</h3>' +
        '<p style="color:#5c4a12;font-size:13.5px;margin-bottom:0;white-space:pre-wrap;">' + escapeHtml_(profile.internalNotes) + '</p>' +
        '</div>';
    }

    // مؤشرات عامة
    html += '<div class="kpi-grid">' +
      kpi(d.workshopCount, 'عدد الورش/البرامج') +
      kpi(d.totalParticipants, 'إجمالي المشاركين') +
      kpi(s.count, 'عدد الردود') +
      kpi(fmtAvg(s.avgOverall), 'المتوسط العام') +
      '</div>';

    // رسم بياني: متوسط كل ورشة على حدة
    html += '<div class="card"><h3 style="margin-top:0;">مقارنة التقييم بين الورش</h3>';
    if (!d.workshops || d.workshops.length === 0) {
      html += '<div class="empty-state">لا توجد ورش بعد.</div>';
    } else {
      d.workshops.forEach(w => {
        const pct = (w.avgOverall !== null && w.avgOverall !== undefined) ? Math.round((w.avgOverall / 5) * 100) : 0;
        html += '<div style="margin-bottom:14px;">' +
          '<div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:5px;">' +
          '<a href="workshop.html?id=' + encodeURIComponent(w.id) + '" style="color:var(--primary-dark);font-weight:700;text-decoration:none;">' + escapeHtml_(w.name) + '</a>' +
          '<span style="color:var(--muted);">' + fmtAvg(w.avgOverall) + '</span>' +
          '</div>' +
          '<div style="background:var(--chip-bg);border-radius:999px;height:9px;overflow:hidden;">' +
          '<div style="background:linear-gradient(90deg,var(--accent),var(--primary));height:100%;width:' + pct + '%;border-radius:999px;"></div>' +
          '</div></div>';
      });
    }
    html += '</div>';

    // تفصيل المحاور
    html += '<div class="card"><h3 style="margin-top:0;">محور تقييم محتوى ورشه</h3><table class="info-table">' +
      infoRow('وضوح أهداف الورشة', fmtAvg(s.avgGoalsClarity)) +
      infoRow('تنظيم وتسلسل المحتوى', fmtAvg(s.avgContentStructure)) +
      infoRow('ملاءمة الموضوع', fmtAvg(s.avgTopicRelevance)) +
      infoRow('جودة المادة العلمية', fmtAvg(s.avgMaterialQuality)) +
      infoRow('متوسط المحور', fmtAvg(s.avgContentCategory)) +
      '</table></div>';

    html += '<div class="card"><h3 style="margin-top:0;">محور تقييم المدرب نفسه</h3><table class="info-table">' +
      infoRow('وضوح الشرح', fmtAvg(s.avgTrainerClarity)) +
      infoRow('إيصال المعلومات', fmtAvg(s.avgTrainerCommunication)) +
      infoRow('التفاعل مع المشاركين', fmtAvg(s.avgTrainerInteraction)) +
      infoRow('إدارة الوقت', fmtAvg(s.avgTrainerTimeMgmt)) +
      infoRow('متوسط المحور', fmtAvg(s.avgTrainerCategory)) +
      '</table></div>';

    // قائمة الورش
    html += '<div class="card"><h3 style="margin-top:0;">كل الورش والبرامج (' + d.workshops.length + ')</h3>' +
      '<div class="table-wrap" style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:13px;">' +
      '<thead><tr style="text-align:right;color:var(--muted);">' +
      '<th style="padding:8px 6px;">الاسم</th><th style="padding:8px 6px;">النوع</th><th style="padding:8px 6px;">التاريخ</th>' +
      '<th style="padding:8px 6px;">المشاركين</th><th style="padding:8px 6px;">الردود</th><th style="padding:8px 6px;">المتوسط</th></tr></thead><tbody>';
    d.workshops.forEach(w => {
      html += '<tr style="border-top:1px solid var(--border);">' +
        '<td style="padding:8px 6px;"><a href="workshop.html?id=' + encodeURIComponent(w.id) + '" style="color:var(--primary-dark);font-weight:700;text-decoration:none;">' + escapeHtml_(w.name) + '</a></td>' +
        '<td style="padding:8px 6px;">' + escapeHtml_(w.type || '—') + '</td>' +
        '<td style="padding:8px 6px;">' + escapeHtml_(w.date || '—') + '</td>' +
        '<td style="padding:8px 6px;">' + (w.participants || 0) + '</td>' +
        '<td style="padding:8px 6px;">' + w.responseCount + '</td>' +
        '<td style="padding:8px 6px;">' + fmtAvg(w.avgOverall) + '</td>' +
        '</tr>';
    });
    html += '</tbody></table></div></div>';

    // كل التعليقات
    html += '<div class="card"><h3 style="margin-top:0;">كل الملاحظات والمقترحات (' + s.comments.length + ')</h3>';
    if (s.comments.length === 0) {
      html += '<div class="empty-state">لا توجد ملاحظات بعد.</div>';
    } else {
      s.comments.forEach(c => {
        html += '<div class="comment-item">' + escapeHtml_(c.text) + '</div>';
      });
    }
    html += '</div>';

    content.innerHTML = html;

    const editBtn = document.getElementById('editProfileBtn');
    const addBtn = document.getElementById('addProfileBtn');
    if (editBtn) editBtn.addEventListener('click', openProfileModal);
    if (addBtn) addBtn.addEventListener('click', openProfileModal);
  }

  function openProfileModal() {
    document.getElementById('p_title').value = currentProfile.title || '';
    document.getElementById('p_organization').value = currentProfile.organization || '';
    document.getElementById('p_email').value = currentProfile.email || '';
    document.getElementById('p_phone').value = currentProfile.phone || '';
    document.getElementById('p_link').value = currentProfile.link || '';
    document.getElementById('p_bio').value = currentProfile.bio || '';
    document.getElementById('p_internalNotes').value = currentProfile.internalNotes || '';
    document.getElementById('profileFormError').style.display = 'none';
    profileModalOverlay.classList.add('open');
  }

  function closeProfileModalFn() {
    profileModalOverlay.classList.remove('open');
  }

  closeProfileModal.addEventListener('click', closeProfileModalFn);
  profileModalOverlay.addEventListener('click', e => { if (e.target === profileModalOverlay) closeProfileModalFn(); });

  profileForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const errorEl = document.getElementById('profileFormError');
    errorEl.style.display = 'none';

    const payload = {
      action: 'updateTrainerProfile',
      trainer: currentTrainerName,
      title: document.getElementById('p_title').value.trim(),
      organization: document.getElementById('p_organization').value.trim(),
      email: document.getElementById('p_email').value.trim(),
      phone: document.getElementById('p_phone').value.trim(),
      link: document.getElementById('p_link').value.trim(),
      bio: document.getElementById('p_bio').value.trim(),
      internalNotes: document.getElementById('p_internalNotes').value.trim(),
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
      if (!json.ok) throw new Error(json.error || 'تعذّر حفظ الملف التعريفي');

      closeProfileModalFn();
      load();
    } catch (err) {
      errorEl.textContent = 'حدث خطأ: ' + err.message;
      errorEl.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'حفظ الملف التعريفي';
    }
  });

  function kpi(value, label) {
    return '<div class="kpi"><div class="value">' + value + '</div><div class="label">' + label + '</div></div>';
  }

  function infoRow(label, value) {
    return '<tr><td>' + label + '</td><td>' + value + '</td></tr>';
  }

  load();
})();
