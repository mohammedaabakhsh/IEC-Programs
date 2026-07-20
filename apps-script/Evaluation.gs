/**
 * إرسال رابط التقييم للمشاركين — تلقائيًا حسب تاريخ الانتهاء، أو يدويًا لصف محدد.
 */

function dailyCheckAndSendEvaluations() {
  ensureProgramIds_();
  const rows = getAllProgramRows_();
  const today = stripTime_(new Date());

  rows.forEach(({ rowNumber, data }) => {
    const name = data['اسم البرنامج'];
    const endDateRaw = data['تاريخ الانتهاء'];
    const status = data['حالة الإرسال'];

    if (!name || !endDateRaw) return;
    if (status === 'تم الإرسال') return;

    const endDate = stripTime_(new Date(endDateRaw));
    if (endDate <= today) {
      sendEvaluationForRow_(rowNumber, data);
    }
  });
}

function sendEvaluationForSelectedRow() {
  const sheet = getProgramsSheet_();
  const activeRow = sheet.getActiveRange().getRow();
  if (activeRow < 2) {
    SpreadsheetApp.getUi().alert('حدّد صف برنامج داخل ورقة "' + CONFIG.SHEETS.PROGRAMS + '" أولًا.');
    return;
  }
  ensureProgramIds_();
  const rowValues = sheet.getRange(activeRow, 1, 1, CONFIG.PROGRAM_COLUMNS.length).getValues()[0];
  const data = rowToProgramObject_(rowValues);

  if (!data['اسم البرنامج']) {
    SpreadsheetApp.getUi().alert('هذا الصف لا يحتوي على اسم برنامج.');
    return;
  }

  sendEvaluationForRow_(activeRow, data);
  SpreadsheetApp.getUi().alert('تم إرسال رابط التقييم لبرنامج: ' + data['اسم البرنامج']);
}

function sendEvaluationForRow_(rowNumber, data) {
  const sheet = getProgramsSheet_();
  const name = data['اسم البرنامج'];
  const id = data['المعرف'];
  const emailsRaw = data['بريد المشاركين (مفصول بفواصل)'];

  const link = buildEvalLink_(id, name);
  const linkCol = programColIndex_('رابط التقييم') + 1;
  sheet.getRange(rowNumber, linkCol).setValue(link);

  const emails = parseEmails_(emailsRaw);
  emails.forEach(email => {
    try {
      GmailApp.sendEmail(email, 'نموذج تقييم: ' + name,
        buildEmailPlainText_(name, link),
        { htmlBody: buildEmailHtml_(name, link) });
    } catch (err) {
      Logger.log('فشل إرسال البريد إلى ' + email + ': ' + err);
    }
  });

  const statusCol = programColIndex_('حالة الإرسال') + 1;
  const dateCol = programColIndex_('تاريخ إرسال التقييم') + 1;
  sheet.getRange(rowNumber, statusCol).setValue('تم الإرسال');
  sheet.getRange(rowNumber, dateCol).setValue(new Date());
}

function parseEmails_(raw) {
  if (!raw) return [];
  return String(raw).split(/[,;\n]/).map(e => e.trim())
    .filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
}

function buildEmailPlainText_(programName, link) {
  return 'السلام عليكم ورحمة الله وبركاته،\n\n' +
    'نشكر لكم مشاركتكم في "' + programName + '".\n' +
    'نرجو منكم تعبئة نموذج التقييم عبر الرابط التالي لمساعدتنا في تطوير برامجنا القادمة:\n\n' +
    link + '\n\nشاكرين لكم وقتكم.';
}

function buildEmailHtml_(programName, link) {
  return '<div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; font-size:14px; line-height:1.8;">' +
    '<p>السلام عليكم ورحمة الله وبركاته،</p>' +
    '<p>نشكر لكم مشاركتكم في <strong>' + programName + '</strong>.</p>' +
    '<p>نرجو منكم تعبئة نموذج التقييم عبر الزر التالي لمساعدتنا في تطوير برامجنا القادمة:</p>' +
    '<p><a href="' + link + '" style="background:#1c4587;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">تعبئة نموذج التقييم</a></p>' +
    '<p style="color:#666;font-size:12px;">إن لم يعمل الزر، انسخ الرابط التالي والصقه في المتصفح:<br>' + link + '</p>' +
    '<p>شاكرين لكم وقتكم.</p></div>';
}

function stripTime_(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
