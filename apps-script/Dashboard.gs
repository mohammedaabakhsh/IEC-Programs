/**
 * حساب الإحصاءات والتقارير لكل ورشة من ورقة "استجابات التقييم".
 * ترتيب الأعمدة هنا مطابق لترتيب أسئلة نموذج التقييم (Config.gs > RESPONSE_COLUMNS).
 */

const RESPONSE_COL = {
  TIMESTAMP: 0,
  FULL_NAME: 1,
  EMAIL: 2,
  GOALS_CLARITY: 3,       // وضوح أهداف الورشة
  CONTENT_STRUCTURE: 4,   // تنظيم وتسلسل المحتوى
  TOPIC_RELEVANCE: 5,     // ملاءمة الموضوع
  MATERIAL_QUALITY: 6,    // جودة المادة العلمية
  TRAINER_CLARITY: 7,     // وضوح الشرح
  TRAINER_COMMUNICATION: 8, // إيصال المعلومات
  TRAINER_INTERACTION: 9,   // التفاعل مع المشاركين
  TRAINER_TIME_MGMT: 10,    // إدارة الوقت
  GENERAL_RATING: 11,       // تقييمكم العام للورشة
  NOTES: 12,                // ملاحظاتكم ومقترحاتكم
  PROGRAM_NAME: 13,         // اسم الورشة (قبل الأخير، حقل مخفي تلقائي)
  PROGRAM_ID: 14,           // معرف الورشة (آخر عمود، حقل مخفي تلقائي)
};

/** يعيد كل صفوف ورقة الاستجابات كمصفوفة كائنات */
function getAllResponses_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.RESPONSES);
  if (!sheet) return [];

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const lastCol = Math.max(sheet.getLastColumn(), CONFIG.RESPONSE_COLUMNS.length);
  const values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

  return values.map(row => ({
    timestamp: row[RESPONSE_COL.TIMESTAMP],
    programId: row[RESPONSE_COL.PROGRAM_ID],
    programName: row[RESPONSE_COL.PROGRAM_NAME],
    fullName: row[RESPONSE_COL.FULL_NAME],
    email: row[RESPONSE_COL.EMAIL],
    goalsClarity: Number(row[RESPONSE_COL.GOALS_CLARITY]),
    contentStructure: Number(row[RESPONSE_COL.CONTENT_STRUCTURE]),
    topicRelevance: Number(row[RESPONSE_COL.TOPIC_RELEVANCE]),
    materialQuality: Number(row[RESPONSE_COL.MATERIAL_QUALITY]),
    trainerClarity: Number(row[RESPONSE_COL.TRAINER_CLARITY]),
    trainerCommunication: Number(row[RESPONSE_COL.TRAINER_COMMUNICATION]),
    trainerInteraction: Number(row[RESPONSE_COL.TRAINER_INTERACTION]),
    trainerTimeMgmt: Number(row[RESPONSE_COL.TRAINER_TIME_MGMT]),
    generalRating: Number(row[RESPONSE_COL.GENERAL_RATING]),
    notes: row[RESPONSE_COL.NOTES],
  }));
}

function computeStats_(responses) {
  const dims = {
    goalsClarity: [], contentStructure: [], topicRelevance: [], materialQuality: [],
    trainerClarity: [], trainerCommunication: [], trainerInteraction: [], trainerTimeMgmt: [],
    generalRating: [], overall: [],
  };
  const comments = [];

  responses.forEach(r => {
    pushIfNumber_(dims.goalsClarity, r.goalsClarity);
    pushIfNumber_(dims.contentStructure, r.contentStructure);
    pushIfNumber_(dims.topicRelevance, r.topicRelevance);
    pushIfNumber_(dims.materialQuality, r.materialQuality);
    pushIfNumber_(dims.trainerClarity, r.trainerClarity);
    pushIfNumber_(dims.trainerCommunication, r.trainerCommunication);
    pushIfNumber_(dims.trainerInteraction, r.trainerInteraction);
    pushIfNumber_(dims.trainerTimeMgmt, r.trainerTimeMgmt);
    pushIfNumber_(dims.generalRating, r.generalRating);
    [
      r.goalsClarity, r.contentStructure, r.topicRelevance, r.materialQuality,
      r.trainerClarity, r.trainerCommunication, r.trainerInteraction, r.trainerTimeMgmt,
      r.generalRating,
    ].forEach(v => pushIfNumber_(dims.overall, v));

    if (r.notes && String(r.notes).trim() !== '') {
      comments.push({ text: r.notes, date: r.timestamp });
    }
  });

  const avgGoalsClarity = avg_(dims.goalsClarity);
  const avgContentStructure = avg_(dims.contentStructure);
  const avgTopicRelevance = avg_(dims.topicRelevance);
  const avgMaterialQuality = avg_(dims.materialQuality);
  const avgTrainerClarity = avg_(dims.trainerClarity);
  const avgTrainerCommunication = avg_(dims.trainerCommunication);
  const avgTrainerInteraction = avg_(dims.trainerInteraction);
  const avgTrainerTimeMgmt = avg_(dims.trainerTimeMgmt);
  const avgGeneral = avg_(dims.generalRating);

  return {
    count: responses.length,

    // محور تقييم محتوى الورشة
    avgGoalsClarity: avgGoalsClarity,
    avgContentStructure: avgContentStructure,
    avgTopicRelevance: avgTopicRelevance,
    avgMaterialQuality: avgMaterialQuality,
    avgContentCategory: avg_([avgGoalsClarity, avgContentStructure, avgTopicRelevance, avgMaterialQuality].filter(v => v !== null)),

    // محور تقييم المدرب
    avgTrainerClarity: avgTrainerClarity,
    avgTrainerCommunication: avgTrainerCommunication,
    avgTrainerInteraction: avgTrainerInteraction,
    avgTrainerTimeMgmt: avgTrainerTimeMgmt,
    avgTrainerCategory: avg_([avgTrainerClarity, avgTrainerCommunication, avgTrainerInteraction, avgTrainerTimeMgmt].filter(v => v !== null)),

    // التقييم العام
    avgGeneral: avgGeneral,

    // المتوسط العام الكلي (كل الأسئلة الرقمية التسعة مجتمعة)
    avgOverall: avg_(dims.overall),

    comments: comments,
  };
}

function pushIfNumber_(arr, v) {
  if (!isNaN(v) && v !== '' && v !== null && v !== undefined) arr.push(v);
}

function avg_(arr) {
  if (!arr || arr.length === 0) return null;
  const sum = arr.reduce((a, b) => a + b, 0);
  return Math.round((sum / arr.length) * 100) / 100;
}

/** ملخص لكل الورش (لصفحة القائمة الرئيسية) */
function getWorkshopsSummary_() {
  const programs = getAllProgramRows_();
  const responses = getAllResponses_();

  return programs.map(({ data }) => {
    const id = data['المعرف'];
    const workshopResponses = responses.filter(r => String(r.programId) === String(id));
    const stats = computeStats_(workshopResponses);

    return {
      id: id,
      name: data['اسم الورشة'],
      date: data['التاريخ'],
      time: data['الوقت'],
      trainer: data['المدرب'],
      audience: data['الفئة المستهدفة'],
      participants: data['عدد المشاركين'],
      organizer: data['الجهة المنظمة'],
      description: data['وصف البرنامج'],
      evalLink: data['رابط التقييم'],
      responseCount: stats.count,
      avgOverall: stats.avgOverall,
    };
  }).sort((a, b) => new Date(b.date) - new Date(a.date));
}

/** تفاصيل وإحصاءات ورشة واحدة (لصفحة الورشة) */
function getWorkshopDetail_(id) {
  const match = findProgramById_(id);
  if (!match) return null;

  const responses = getAllResponses_().filter(r => String(r.programId) === String(id));
  const stats = computeStats_(responses);
  const data = match.data;

  return {
    id: data['المعرف'],
    name: data['اسم الورشة'],
    description: data['وصف البرنامج'],
    date: data['التاريخ'],
    time: data['الوقت'],
    trainer: data['المدرب'],
    audience: data['الفئة المستهدفة'],
    participants: data['عدد المشاركين'],
    organizer: data['الجهة المنظمة'],
    evalLink: data['رابط التقييم'],
    qrUrl: data['رابط التقييم'] ? qrCodeUrl_(data['رابط التقييم']) : '',
    stats: stats,
  };
}

/** يحذف كل استجابات ورشة معيّنة من ورقة "استجابات التقييم" (يُستدعى عند حذف الورشة نفسها) */
function deleteResponsesForWorkshop_(id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.RESPONSES);
  if (!sheet) return;

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  const idCol = RESPONSE_COL.PROGRAM_ID + 1;
  const ids = sheet.getRange(2, idCol, lastRow - 1, 1).getValues();

  for (let i = ids.length - 1; i >= 0; i--) {
    if (String(ids[i][0]) === String(id)) {
      sheet.deleteRow(i + 2);
    }
  }
}
