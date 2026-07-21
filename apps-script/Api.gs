/**
 * واجهة برمجية (API) يستخدمها التطبيق الأمامي (docs/) بعد نشر هذا المشروع
 * كـ Web App من Deploy ← New deployment ← Web app (Execute as: Me, Access: Anyone).
 *
 * نقاط النهاية:
 *   GET  ?action=workshops            → قائمة كل الورش مع ملخص إحصائي (JSON)
 *   GET  ?action=workshop&id=<المعرف> → تفاصيل وإحصاءات ورشة واحدة
 *   POST { action:'createWorkshop', name, description, date, time, trainer,
 *          audience, participants, organizer } → إنشاء ورشة جديدة وإرجاع رابط/QR التقييم
 *   POST { action:'updateWorkshop', id, name, description, date, time, trainer,
 *          audience, participants, organizer } → تعديل بيانات ورشة موجودة
 *   POST { action:'deleteWorkshop', id } → حذف ورشة
 *
 * ملاحظة: تعبئة نموذج التقييم نفسها تتم مباشرة داخل Google Form (وليس عبر هذا الـ API)،
 * والردود تُحفظ تلقائيًا في ورقة "استجابات التقييم" بواسطة Google Forms.
 */

function doGet(e) {
  try {
    const action = e && e.parameter && e.parameter.action;

    if (action === 'workshops') {
      return jsonOutput_({ ok: true, data: getWorkshopsSummary_() });
    }

    if (action === 'workshop') {
      const id = e.parameter.id;
      const detail = getWorkshopDetail_(id);
      if (!detail) return jsonOutput_({ ok: false, error: 'الورشة غير موجودة' });
      return jsonOutput_({ ok: true, data: detail });
    }

    return jsonOutput_({ ok: true, message: 'IEC-Programs API يعمل بنجاح.' });
  } catch (err) {
    return jsonOutput_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);

    if (body.action === 'createWorkshop') {
      return jsonOutput_(createWorkshop_(body));
    }

    if (body.action === 'updateWorkshop') {
      return jsonOutput_(updateWorkshop_(body));
    }

    if (body.action === 'deleteWorkshop') {
      return jsonOutput_(deleteWorkshop_(body.id));
    }

    return jsonOutput_({ ok: false, error: 'إجراء غير معروف' });
  } catch (err) {
    return jsonOutput_({ ok: false, error: String(err) });
  }
}

function jsonOutput_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
