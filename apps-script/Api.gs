/**
 * واجهة برمجية (API) يستخدمها التطبيق الويب الثابت (web/) بعد نشر هذا المشروع
 * كـ Web App من Deploy ← New deployment ← Web app (Execute as: Me, Access: Anyone).
 *
 * نقاط النهاية:
 *   GET  ?action=dashboard              → بيانات لوحة المتابعة (JSON)
 *   GET  ?action=program&id=<المعرف>    → بيانات برنامج واحد (للتحقق قبل عرض نموذج التقييم)
 *   POST { action:'submitEvaluation', programId, programName, content, organization,
 *          trainer, goals, benefit, notes }  → حفظ استجابة تقييم جديدة
 */

function doGet(e) {
  try {
    const action = e && e.parameter && e.parameter.action;

    if (action === 'dashboard') {
      const data = refreshDashboard();
      return jsonOutput_({ ok: true, data: data, columns: CONFIG.DASHBOARD_COLUMNS });
    }

    if (action === 'program') {
      const id = e.parameter.id;
      const program = findProgramById_(id);
      if (!program) return jsonOutput_({ ok: false, error: 'البرنامج غير موجود' });
      return jsonOutput_({
        ok: true,
        program: { id: program['المعرف'], name: program['اسم البرنامج'], type: program['نوع البرنامج'] },
      });
    }

    return jsonOutput_({ ok: true, message: 'IEC-Programs API يعمل بنجاح.' });
  } catch (err) {
    return jsonOutput_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);

    if (body.action === 'submitEvaluation') {
      return jsonOutput_(submitEvaluation_(body));
    }

    return jsonOutput_({ ok: false, error: 'إجراء غير معروف' });
  } catch (err) {
    return jsonOutput_({ ok: false, error: String(err) });
  }
}

function submitEvaluation_(body) {
  const required = ['programName', 'content', 'organization', 'trainer', 'goals', 'benefit'];
  for (const field of required) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      return { ok: false, error: 'حقل مفقود: ' + field };
    }
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ensureResponsesSheet_(ss);

  sheet.appendRow([
    new Date(),
    body.programId || '',
    body.programName,
    Number(body.content),
    Number(body.organization),
    Number(body.trainer),
    Number(body.goals),
    Number(body.benefit),
    body.notes || '',
  ]);

  refreshDashboard();

  return { ok: true };
}

function jsonOutput_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
