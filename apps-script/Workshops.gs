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
