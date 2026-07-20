/**
 * الإعداد الأولي: إنشاء الأوراق داخل ملف Google Sheets وتفعيل المشغّلات الزمنية.
 * شغّل setupSystem() مرة واحدة فقط بعد ربط هذا السكربت بملف Google Sheets.
 */

function setupSystem() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  ensureProgramsSheet_(ss);
  ensureResponsesSheet_(ss);
  ensureDashboardSheet_(ss);
  ensureTriggers_();

  SpreadsheetApp.getUi().alert(
    'تم إعداد النظام بنجاح ✅\n\n' +
      'الخطوة التالية: من محرر Apps Script اضغط Deploy ← New deployment ← Web app،\n' +
      'واختر Execute as: Me و Who has access: Anyone، ثم انسخ الرابط (Web App URL) وضعه في ملف web/assets/config.js في الواجهة.\n\n' +
      'أضف بيانات برامجك في ورقة "' + CONFIG.SHEETS.PROGRAMS + '" وسيرسل النظام رابط التقييم تلقائيًا للمشاركين في تاريخ انتهاء كل برنامج.'
  );
}

function ensureProgramsSheet_(ss) {
  let sheet = ss.getSheetByName(CONFIG.SHEETS.PROGRAMS);
  if (!sheet) sheet = ss.insertSheet(CONFIG.SHEETS.PROGRAMS);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(CONFIG.PROGRAM_COLUMNS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, CONFIG.PROGRAM_COLUMNS.length)
      .setFontWeight('bold').setBackground('#1c4587').setFontColor('#ffffff');
    sheet.setColumnWidths(1, CONFIG.PROGRAM_COLUMNS.length, 160);
    sheet.getRange('K2:K').setDataValidation(
      SpreadsheetApp.newDataValidation()
        .requireValueInList(['لم يُرسل', 'تم الإرسال'], true)
        .setAllowInvalid(false)
        .build()
    );
  }
  return sheet;
}

function ensureResponsesSheet_(ss) {
  let sheet = ss.getSheetByName(CONFIG.SHEETS.RESPONSES);
  if (!sheet) sheet = ss.insertSheet(CONFIG.SHEETS.RESPONSES);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(CONFIG.RESPONSE_COLUMNS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, CONFIG.RESPONSE_COLUMNS.length)
      .setFontWeight('bold').setBackground('#a61c00').setFontColor('#ffffff');
    sheet.setColumnWidths(1, CONFIG.RESPONSE_COLUMNS.length, 160);
  }
  return sheet;
}

function ensureDashboardSheet_(ss) {
  let sheet = ss.getSheetByName(CONFIG.SHEETS.DASHBOARD);
  if (!sheet) sheet = ss.insertSheet(CONFIG.SHEETS.DASHBOARD);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(CONFIG.DASHBOARD_COLUMNS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, CONFIG.DASHBOARD_COLUMNS.length)
      .setFontWeight('bold').setBackground('#0b8043').setFontColor('#ffffff');
    sheet.setColumnWidths(1, CONFIG.DASHBOARD_COLUMNS.length, 170);
  }
  return sheet;
}

function ensureTriggers_() {
  const existing = ScriptApp.getProjectTriggers().map(t => t.getHandlerFunction());

  if (existing.indexOf('dailyCheckAndSendEvaluations') === -1) {
    ScriptApp.newTrigger('dailyCheckAndSendEvaluations')
      .timeBased().everyDays(1).atHour(8).create();
  }
  if (existing.indexOf('sendWeeklyReport') === -1) {
    ScriptApp.newTrigger('sendWeeklyReport')
      .timeBased().onWeekDay(ScriptApp.WeekDay.SUNDAY).atHour(7).create();
  }
}

/** قائمة مخصصة تظهر عند فتح ملف الشيت (لإدارة النظام بدون فتح محرر السكربت) */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('نظام التقييم')
    .addItem('⚙️ إعداد النظام (مرة واحدة)', 'setupSystem')
    .addSeparator()
    .addItem('📤 إرسال رابط التقييم للصف المحدد الآن', 'sendEvaluationForSelectedRow')
    .addItem('🔄 تحديث لوحة المتابعة الآن', 'refreshDashboard')
    .addItem('📧 إرسال التقرير الدوري الآن', 'sendWeeklyReport')
    .addToUi();
}
