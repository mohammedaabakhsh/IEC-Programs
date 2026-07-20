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

function nextProgramId_() {
  const sheet = getProgramsSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 1;

  const idCol = programColIndex_('المعرف') + 1;
  const ids = sheet.getRange(2, idCol, lastRow - 1, 1).getValues();
  let maxId = 0;
  ids.forEach(r => {
    const n = parseInt(r[0], 10);
    if (!isNaN(n) && n > maxId) maxId = n;
  });
  return maxId + 1;
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
