/**
 * دوال مساعدة للتعامل مع ورقة "الورش".
 */

function programColIndex_(name) {
  return CONFIG.PROGRAM_COLUMNS.indexOf(name);
}

function getProgramsSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.PROGRAMS);
  if (!sheet) {
    throw new Error('ورقة "' + CONFIG.SHEETS.PROGRAMS + '" غير موجودة. شغّل "إعداد النظام" أولًا.');
  }
  return sheet;
}

function rowToProgramObject_(row) {
  const obj = {};
  CONFIG.PROGRAM_COLUMNS.forEach((name, i) => { obj[name] = row[i]; });
  return obj;
}

function getAllProgramRows_() {
  const sheet = getProgramsSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, CONFIG.PROGRAM_COLUMNS.length).getValues();
  return values.map((row, i) => ({ rowNumber: i + 2, data: rowToProgramObject_(row) }));
}

function findProgramById_(id) {
  const rows = getAllProgramRows_();
  const match = rows.filter(r => String(r.data['المعرف']) === String(id));
  return match.length > 0 ? match[0] : null;
}

/**
 * يولّد معرفًا جديدًا لا يتكرر أبدًا حتى لو انحذفت ورش سابقة — عن طريق عداد دائم
 * محفوظ بخصائص السكربت، بدل الاعتماد على أكبر رقم موجود حاليًا بالجدول (كان يسبب
 * تصادم بيانات لو انحذفت ورشة ثم أُنشئت ورشة جديدة أخذت نفس رقمها القديم).
 */
function nextProgramId_() {
  const props = PropertiesService.getScriptProperties();
  let next = parseInt(props.getProperty(CONFIG.PROP_NEXT_ID), 10);

  if (isNaN(next)) {
    // أول استخدام بعد هذا التحديث: ابدأ من أكبر رقم موجود حاليًا (توافق مع الورش القديمة)
    const sheet = getProgramsSheet_();
    const lastRow = sheet.getLastRow();
    let maxId = 0;
    if (lastRow >= 2) {
      const idCol = programColIndex_('المعرف') + 1;
      const ids = sheet.getRange(2, idCol, lastRow - 1, 1).getValues();
      ids.forEach(r => {
        const n = parseInt(r[0], 10);
        if (!isNaN(n) && n > maxId) maxId = n;
      });
    }
    next = maxId + 1;
  }

  props.setProperty(CONFIG.PROP_NEXT_ID, String(next + 1));
  return next;
}

/** يبني رابط نموذج تقييم معبّأ مسبقًا بمعرف واسم الورشة */
function buildPrefilledFormUrl_(programId, programName) {
  const props = PropertiesService.getScriptProperties();
  const formId = props.getProperty(CONFIG.PROP_FORM_ID);
  if (!formId) {
    throw new Error('لم يتم إنشاء نموذج التقييم بعد. شغّل "إعداد النظام" أولًا.');
  }
  const form = FormApp.openById(formId);
  const items = form.getItems();
  const idItem = items.filter(it => it.getTitle() === CONFIG.FORM_PROGRAM_ID_FIELD)[0];
  const nameItem = items.filter(it => it.getTitle() === CONFIG.FORM_PROGRAM_NAME_FIELD)[0];

  const response = form.createResponse();
  if (idItem) response.withItemResponse(idItem.asTextItem().createResponse(String(programId)));
  if (nameItem) response.withItemResponse(nameItem.asTextItem().createResponse(programName));

  return response.toPrefilledUrl();
}

function qrCodeUrl_(link) {
  return CONFIG.QR_API_BASE + encodeURIComponent(link);
}
