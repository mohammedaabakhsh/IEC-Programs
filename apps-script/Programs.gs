/**
 * دوال مساعدة للتعامل مع ورقة "البرامج".
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
  return values.map((row, i) => ({
    rowNumber: i + 2,
    data: rowToProgramObject_(row),
  }));
}

/** يبحث عن برنامج بمعرفه (يُستخدم من واجهة نموذج التقييم) */
function findProgramById_(id) {
  const rows = getAllProgramRows_();
  const match = rows.filter(r => String(r.data['المعرف']) === String(id));
  return match.length > 0 ? match[0].data : null;
}

function ensureProgramIds_() {
  const sheet = getProgramsSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  const idCol = programColIndex_('المعرف') + 1;
  const nameCol = programColIndex_('اسم البرنامج') + 1;
  const ids = sheet.getRange(2, idCol, lastRow - 1, 1).getValues();
  const names = sheet.getRange(2, nameCol, lastRow - 1, 1).getValues();

  let maxId = 0;
  ids.forEach(r => {
    const n = parseInt(r[0], 10);
    if (!isNaN(n) && n > maxId) maxId = n;
  });

  for (let i = 0; i < ids.length; i++) {
    const hasName = names[i][0] && String(names[i][0]).trim() !== '';
    const hasId = ids[i][0] && String(ids[i][0]).trim() !== '';
    if (hasName && !hasId) {
      maxId += 1;
      sheet.getRange(i + 2, idCol).setValue(maxId);
    }
  }
}

/** يبني رابط صفحة التقييم في الواجهة الثابتة (GitHub Pages) لبرنامج معيّن */
function buildEvalLink_(programId, programName) {
  const base = CONFIG.FRONTEND_BASE_URL.replace(/\/+$/, '');
  return base + '/evaluate.html?p=' + encodeURIComponent(programId) +
    '&n=' + encodeURIComponent(programName);
}
