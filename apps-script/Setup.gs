/**
 * الإعداد الأولي: إنشاء الأوراق والنموذج المشترك. شغّل setupSystem() مرة واحدة فقط.
 */

function setupSystem() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  ensureProgramsSheet_(ss);
  ensureResponsesSheet_(ss);
  const form = ensureEvaluationForm_(ss);

  SpreadsheetApp.getUi().alert(
    'تم إعداد النظام بنجاح ✅\n\n' +
      'الخطوة التالية: من محرر Apps Script اضغط Deploy ← New deployment ← Web app،\n' +
      'اختر Execute as: Me و Who has access: Anyone، وانسخ رابط Web App وضعه في ملف docs/assets/config.js.\n\n' +
      'بعدها أضف الورش من داخل التطبيق نفسه (زر "إضافة ورشة جديدة").'
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
    sheet.setColumnWidths(1, CONFIG.PROGRAM_COLUMNS.length, 150);
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
    sheet.setColumnWidths(1, CONFIG.RESPONSE_COLUMNS.length, 150);
  }
  return sheet;
}

/** ينشئ نموذج التقييم المشترك مرة واحدة فقط (يُعاد استخدامه واسمه يتغيّر لكل ورشة) */
function ensureEvaluationForm_(ss) {
  const props = PropertiesService.getScriptProperties();
  const existingId = props.getProperty(CONFIG.PROP_FORM_ID);

  if (existingId) {
    try {
      return FormApp.openById(existingId);
    } catch (e) {
      // النموذج المخزّن لم يعد متاحًا، أنشئ نموذجًا جديدًا
    }
  }

  const form = FormApp.create('نموذج تقييم البرامج وورش العمل');
  form.setDescription('نشكر لكم مشاركتكم. نرجو تعبئة هذا النموذج لتقييم الورشة.');
  form.setCollectEmail(false);
  form.setAllowResponseEdits(false);

  form.addTextItem().setTitle(CONFIG.FORM_PROGRAM_ID_FIELD).setRequired(true);
  form.addTextItem().setTitle(CONFIG.FORM_PROGRAM_NAME_FIELD).setRequired(true);

  addScaleQuestion_(form, 'مدى رضاك عن محتوى الورشة');
  addScaleQuestion_(form, 'مدى رضاك عن التنظيم واللوجستيات');
  addScaleQuestion_(form, 'تقييمك للمدرب / مقدم الجلسة');
  addScaleQuestion_(form, 'مدى تحقق أهداف الورشة');
  addScaleQuestion_(form, 'مدى الاستفادة المتوقعة من تطبيق ما تم تعلمه');

  form.addParagraphTextItem().setTitle('أبرز الملاحظات والمقترحات التطويرية').setRequired(false);

  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  Utilities.sleep(1000);
  renameResponsesSheet_(ss);

  props.setProperty(CONFIG.PROP_FORM_ID, form.getId());
  return form;
}

function renameResponsesSheet_(ss) {
  const target = ss.getSheetByName(CONFIG.SHEETS.RESPONSES);
  const sheets = ss.getSheets();
  for (const sh of sheets) {
    const name = sh.getName();
    if (name !== CONFIG.SHEETS.RESPONSES &&
        (name.indexOf('Form Responses') === 0 || name.indexOf('استجابات النموذج') === 0)) {
      if (target) ss.deleteSheet(target); // تفادي تكرار ورقة الاستجابات
      sh.setName(CONFIG.SHEETS.RESPONSES);
      sh.getRange(1, 1, 1, sh.getLastColumn())
        .setFontWeight('bold').setBackground('#a61c00').setFontColor('#ffffff');
      return;
    }
  }
}

function addScaleQuestion_(form, title) {
  form.addScaleItem().setTitle(title).setBounds(1, 5)
    .setLabels('غير راضٍ إطلاقًا', 'راضٍ تمامًا').setRequired(true);
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('نظام إدارة الورش')
    .addItem('⚙️ إعداد النظام (مرة واحدة)', 'setupSystem')
    .addToUi();
}

/**
 * ترحيل: يضيف عمود "نوع النشاط" لورقة "الورش" الموجودة مسبقًا بدون فقدان أي بيانات قديمة.
 * شغّلها مرة واحدة فقط من محرر Apps Script (زر Run) بعد إضافة حقل نوع النشاط للنظام.
 * آمنة لو اشتغلت أكثر من مرة بالغلط — ما تكرر العمود لو مضاف مسبقًا.
 */
function migrateAddActivityTypeColumn_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.PROGRAMS);
  if (!sheet) {
    SpreadsheetApp.getUi().alert('ورقة "الورش" غير موجودة.');
    return;
  }

  const headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  const headers = headerRange.getValues()[0];

  if (headers.indexOf('نوع النشاط') !== -1) {
    SpreadsheetApp.getUi().alert('عمود "نوع النشاط" موجود بالفعل، ما فيه داعي نضيفه مرة ثانية.');
    return;
  }

  const nameColIndex = headers.indexOf('اسم الورشة'); // 0-based
  if (nameColIndex === -1) {
    SpreadsheetApp.getUi().alert('تعذّر إيجاد عمود "اسم الورشة" بالورقة.');
    return;
  }

  const insertBeforeCol = nameColIndex + 2; // العمود مباشرة بعد "اسم الورشة" (1-based)
  sheet.insertColumnBefore(insertBeforeCol);
  sheet.getRange(1, insertBeforeCol).setValue('نوع النشاط')
    .setFontWeight('bold').setBackground('#1c4587').setFontColor('#ffffff');

  SpreadsheetApp.getUi().alert('تمام ✅ تمت إضافة عمود "نوع النشاط" بنجاح، وكل الورش القديمة محفوظة زي ما هي.');
}
