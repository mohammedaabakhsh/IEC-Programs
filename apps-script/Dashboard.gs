/**
 * حساب الإحصاءات والتقارير لكل ورشة من ورقة "استجابات التقييم".
 */

const RESPONSE_COL = {
  TIMESTAMP: 0,
  PROGRAM_ID: 1,
  PROGRAM_NAME: 2,
  CONTENT: 3,
  ORGANIZATION: 4,
  TRAINER: 5,
  GOALS: 6,
  BENEFIT: 7,
  NOTES: 8,
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
    content: Number(row[RESPONSE_COL.CONTENT]),
    organization: Number(row[RESPONSE_COL.ORGANIZATION]),
    trainer: Number(row[RESPONSE_COL.TRAINER]),
    goals: Number(row[RESPONSE_COL.GOALS]),
    benefit: Number(row[RESPONSE_COL.BENEFIT]),
    notes: row[RESPONSE_COL.NOTES],
  }));
}

function computeStats_(responses) {
  const stats = { count: responses.length, content: [], organization: [], trainer: [], goals: [], benefit: [], overall: [], comments: [] };

  responses.forEach(r => {
    pushIfNumber_(stats.content, r.content);
    pushIfNumber_(stats.organization, r.organization);
    pushIfNumber_(stats.trainer, r.trainer);
    pushIfNumber_(stats.goals, r.goals);
    pushIfNumber_(stats.benefit, r.benefit);
    [r.content, r.organization, r.trainer, r.goals, r.benefit].forEach(v => pushIfNumber_(stats.overall, v));
    if (r.notes && String(r.notes).trim() !== '') {
      stats.comments.push({ text: r.notes, date: r.timestamp });
    }
  });

  return {
    count: stats.count,
    avgContent: avg_(stats.content),
    avgOrganization: avg_(stats.organization),
    avgTrainer: avg_(stats.trainer),
    avgGoals: avg_(stats.goals),
    avgBenefit: avg_(stats.benefit),
    avgOverall: avg_(stats.overall),
    comments: stats.comments,
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
