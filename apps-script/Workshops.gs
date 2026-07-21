/**
 * إنشاء ورشة جديدة: تسجيلها في الشيت، تحديث اسم النموذج المشترك، وبناء رابط + QR للتقييم.
 */

function createWorkshop_(body) {
  const required = ['name', 'date', 'time', 'trainer', 'audience', 'participants', 'organizer'];
  for (const field of required) {
    if (body[field] === undefined || body[field] === null || String(body[field]).trim() === '') {
      return { ok: false, error: 'حقل مفقود: ' + field };
    }
  }

  const sheet = getProgramsSheet_();
  const id = nextProgramId_();

  sheet.appendRow([
    id,
    body.name,
    body.description || '',
    body.date,
    body.time,
    body.trainer,
    body.audience,
    Number(body.participants) || 0,
    body.organizer,
    '',
    new Date(),
  ]);

  // غيّر عنوان النموذج المشترك ليعكس الورشة الجديدة (آخر ورشة تُنشأ هي التي تظهر بعنوان النموذج)
  try {
    const props = PropertiesService.getScriptProperties();
    const formId = props.getProperty(CONFIG.PROP_FORM_ID);
    if (formId) {
      const form = FormApp.openById(formId);
      form.setTitle('تقييم: ' + body.name);
    }
  } catch (err) {
    Logger.log('تعذّر تحديث عنوان النموذج: ' + err);
  }

  const link = buildPrefilledFormUrl_(id, body.name);
  const linkCol = programColIndex_('رابط التقييم') + 1;
  const rowNumber = sheet.getLastRow();
  sheet.getRange(rowNumber, linkCol).setValue(link);

  return { ok: true, id: id, evalLink: link, qrUrl: qrCodeUrl_(link) };
}

/** تعديل بيانات ورشة موجودة */
function updateWorkshop_(body) {
  if (!body.id) return { ok: false, error: 'معرف الورشة مفقود' };

  const match = findProgramById_(body.id);
  if (!match) return { ok: false, error: 'الورشة غير موجودة' };

  const required = ['name', 'date', 'time', 'trainer', 'audience', 'participants', 'organizer'];
  for (const field of required) {
    if (body[field] === undefined || body[field] === null || String(body[field]).trim() === '') {
      return { ok: false, error: 'حقل مفقود: ' + field };
    }
  }

  const sheet = getProgramsSheet_();
  const rowNumber = match.rowNumber;

  sheet.getRange(rowNumber, programColIndex_('اسم الورشة') + 1).setValue(body.name);
  sheet.getRange(rowNumber, programColIndex_('وصف البرنامج') + 1).setValue(body.description || '');
  sheet.getRange(rowNumber, programColIndex_('التاريخ') + 1).setValue(body.date);
  sheet.getRange(rowNumber, programColIndex_('الوقت') + 1).setValue(body.time);
  sheet.getRange(rowNumber, programColIndex_('المدرب') + 1).setValue(body.trainer);
  sheet.getRange(rowNumber, programColIndex_('الفئة المستهدفة') + 1).setValue(body.audience);
  sheet.getRange(rowNumber, programColIndex_('عدد المشاركين') + 1).setValue(Number(body.participants) || 0);
  sheet.getRange(rowNumber, programColIndex_('الجهة المنظمة') + 1).setValue(body.organizer);

  // أعد بناء رابط التقييم عشان يعكس الاسم الجديد لو تغيّر، وحدّث عنوان النموذج المشترك
  const link = buildPrefilledFormUrl_(body.id, body.name);
  sheet.getRange(rowNumber, programColIndex_('رابط التقييم') + 1).setValue(link);

  try {
    const props = PropertiesService.getScriptProperties();
    const formId = props.getProperty(CONFIG.PROP_FORM_ID);
    if (formId) {
      FormApp.openById(formId).setTitle('تقييم: ' + body.name);
    }
  } catch (err) {
    Logger.log('تعذّر تحديث عنوان النموذج: ' + err);
  }

  return { ok: true, id: body.id, evalLink: link, qrUrl: qrCodeUrl_(link) };
}

/** حذف ورشة (الردود المرتبطة بها تبقى محفوظة بورقة الاستجابات لكن لن تظهر بالتطبيق) */
function deleteWorkshop_(id) {
  const match = findProgramById_(id);
  if (!match) return { ok: false, error: 'الورشة غير موجودة' };

  const sheet = getProgramsSheet_();
  sheet.deleteRow(match.rowNumber);

  deleteResponsesForWorkshop_(id);

  return { ok: true };
}
