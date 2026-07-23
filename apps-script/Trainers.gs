/**
 * ملف تعريفي اختياري لكل مدرب: منصب/جهة عمل/بريد/جوال/رابط شخصي/نبذة/ملاحظات
 * إدارية داخلية. يُخزَّن في تبويب منفصل تمامًا اسمه "المدربون" — لا يمس أي بيانات
 * موجودة في "الورش" أو "استجابات التقييم". لو المدرب ما له ملف مسجَّل، يرجع
 * كائن فاضي (hasProfile: false) بدل خطأ — عشان الملف يبقى اختياريًا فعليًا.
 */

const TRAINERS_SHEET_NAME = 'المدربون';
const TRAINER_PROFILE_COLUMNS = [
  'اسم المدرب', 'المنصب / اللقب', 'جهة العمل', 'البريد الإلكتروني',
  'رقم التواصل', 'نبذة تعريفية', 'رابط شخصي (لينكدإن/موقع)', 'ملاحظات داخلية (خاصة بالإدارة)',
];

/** ينشئ تبويب "المدربون" إذا ما كان موجود (آمن، لا يكرر الإنشاء) */
function ensureTrainersSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(TRAINERS_SHEET_NAME);
  if (sheet) return sheet;

  sheet = ss.insertSheet(TRAINERS_SHEET_NAME);
  sheet.appendRow(TRAINER_PROFILE_COLUMNS);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, TRAINER_PROFILE_COLUMNS.length)
    .setFontWeight('bold').setBackground('#1c4587').setFontColor('#ffffff');
  sheet.setColumnWidths(1, TRAINER_PROFILE_COLUMNS.length, 170);
  return sheet;
}

function findTrainerProfileRow_(name) {
  const sheet = ensureTrainersSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;

  const values = sheet.getRange(2, 1, lastRow - 1, TRAINER_PROFILE_COLUMNS.length).getValues();
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]) === String(name)) {
      return { rowNumber: i + 2, values: values[i] };
    }
  }
  return null;
}

/** يقرأ الملف التعريفي لمدرب — يرجع كائن فاضي (hasProfile:false) لو ما سجّله أحد بعد */
function getTrainerProfile_(name) {
  const match = findTrainerProfileRow_(name);
  if (!match) {
    return {
      trainer: name, title: '', organization: '', email: '', phone: '',
      bio: '', link: '', internalNotes: '', hasProfile: false,
    };
  }
  const v = match.values;
  return {
    trainer: name,
    title: v[1] || '',
    organization: v[2] || '',
    email: v[3] || '',
    phone: v[4] || '',
    bio: v[5] || '',
    link: v[6] || '',
    internalNotes: v[7] || '',
    hasProfile: true,
  };
}

/** يحفظ/يحدّث الملف التعريفي لمدرب (يُستدعى من زر "تعديل الملف الشخصي" بصفحة المدرب) */
function updateTrainerProfile_(body) {
  const name = body.trainer;
  if (!name) return { ok: false, error: 'اسم المدرب مطلوب' };

  const sheet = ensureTrainersSheet_();
  const match = findTrainerProfileRow_(name);
  const row = [
    name, body.title || '', body.organization || '', body.email || '',
    body.phone || '', body.bio || '', body.link || '', body.internalNotes || '',
  ];

  if (match) {
    sheet.getRange(match.rowNumber, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }

  return { ok: true, data: getTrainerProfile_(name) };
}
