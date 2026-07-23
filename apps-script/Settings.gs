/**
 * صفحة الإعدادات: أهداف سنوية (عدد برامج / عدد مشاركين مستهدف) + قائمة فئات
 * مستهدفة قابلة للتعديل + قائمة كلمات مفتاحية قابلة للتعديل.
 * تُخزَّن في تبويب منفصل تمامًا اسمه "الإعدادات" — لا يمس أي بيانات موجودة
 * في ورقتي "الورش" و"استجابات التقييم".
 */

const SETTINGS_SHEET_NAME = 'الإعدادات';

const SETTINGS_DEFAULTS = {
  targetPrograms: 120,
  targetParticipants: 3000,
  audienceCategories: ['طلاب', 'أعضاء هيئة تدريس', 'موظفون', 'رواد أعمال', 'أخرى'],
  keywords: ['الذكاء الاصطناعي', 'ريادة الأعمال', 'الأمن السيبراني', 'الابتكار', 'التسويق الرقمي', 'البرمجة', 'القيادة', 'إدارة المشاريع'],
};

/** ينشئ تبويب الإعدادات إذا ما كان موجود، بالقيم الافتراضية (آمن، لا يكرر الإنشاء إذا موجود) */
function ensureSettingsSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SETTINGS_SHEET_NAME);
  if (sheet) return sheet;

  sheet = ss.insertSheet(SETTINGS_SHEET_NAME);
  sheet.getRange(1, 1, 1, 2).setValues([['المفتاح', 'القيمة']]);
  sheet.getRange(2, 1, 4, 2).setValues([
    ['targetPrograms', SETTINGS_DEFAULTS.targetPrograms],
    ['targetParticipants', SETTINGS_DEFAULTS.targetParticipants],
    ['audienceCategories', JSON.stringify(SETTINGS_DEFAULTS.audienceCategories)],
    ['keywords', JSON.stringify(SETTINGS_DEFAULTS.keywords)],
  ]);
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(1, 180);
  sheet.setColumnWidth(2, 420);
  return sheet;
}

/** يقرأ الإعدادات الحالية كـ object جاهز للاستخدام (مع قيم افتراضية آمنة لو أي مفتاح ناقص/تالف) */
function getSettings_() {
  const sheet = ensureSettingsSheet_();
  const lastRow = sheet.getLastRow();
  const rows = lastRow >= 2 ? sheet.getRange(2, 1, lastRow - 1, 2).getValues() : [];

  const map = {};
  rows.forEach(r => { map[r[0]] = r[1]; });

  function num(key, fallback) {
    const v = Number(map[key]);
    return isNaN(v) ? fallback : v;
  }
  function list(key, fallback) {
    try {
      const parsed = JSON.parse(map[key]);
      return (Array.isArray(parsed) && parsed.length) ? parsed : fallback;
    } catch (e) {
      return fallback;
    }
  }

  return {
    targetPrograms: num('targetPrograms', SETTINGS_DEFAULTS.targetPrograms),
    targetParticipants: num('targetParticipants', SETTINGS_DEFAULTS.targetParticipants),
    audienceCategories: list('audienceCategories', SETTINGS_DEFAULTS.audienceCategories),
    keywords: list('keywords', SETTINGS_DEFAULTS.keywords),
  };
}

/** يحدّث الإعدادات (يُستدعى من صفحة ⚙️ الإعدادات بالتطبيق) */
function updateSettings_(body) {
  const sheet = ensureSettingsSheet_();
  const lastRow = sheet.getLastRow();
  const rows = lastRow >= 2 ? sheet.getRange(2, 1, lastRow - 1, 2).getValues() : [];

  const rowIndexByKey = {};
  rows.forEach((r, i) => { rowIndexByKey[r[0]] = i + 2; });

  function setValue(key, value) {
    const v = (typeof value === 'object') ? JSON.stringify(value) : value;
    if (rowIndexByKey[key]) {
      sheet.getRange(rowIndexByKey[key], 2).setValue(v);
    } else {
      sheet.appendRow([key, v]);
    }
  }

  if (body.targetPrograms !== undefined) setValue('targetPrograms', Number(body.targetPrograms));
  if (body.targetParticipants !== undefined) setValue('targetParticipants', Number(body.targetParticipants));
  if (body.audienceCategories !== undefined) setValue('audienceCategories', body.audienceCategories);
  if (body.keywords !== undefined) setValue('keywords', body.keywords);

  return { ok: true, data: getSettings_() };
}
