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
      type: data['نوع النشاط'],
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
    type: data['نوع النشاط'],
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

/**
 * بيانات صفحة "التقارير والتحليلات": مؤشرات عامة + تحليل حسب المدرب (حتى لو تكرر
 * بعدة ورش يجمع كل نتائجه) + تحليل حسب نوع النشاط + أحدث الملاحظات من كل الورش.
 */
function getReportsData_() {
  const programs = getAllProgramRows_();
  const responses = getAllResponses_();

  let totalParticipants = 0;
  programs.forEach(p => {
    const n = Number(p.data['عدد المشاركين']);
    if (!isNaN(n)) totalParticipants += n;
  });

  const overallStats = computeStats_(responses);

  // تحليل حسب المدرب
  const trainerMap = {};
  programs.forEach(p => {
    const trainer = p.data['المدرب'] || 'غير محدد';
    const id = String(p.data['المعرف']);
    const participants = Number(p.data['عدد المشاركين']) || 0;
    if (!trainerMap[trainer]) trainerMap[trainer] = { ids: [], workshopCount: 0, totalParticipants: 0 };
    trainerMap[trainer].ids.push(id);
    trainerMap[trainer].workshopCount += 1;
    trainerMap[trainer].totalParticipants += participants;
  });

  const byTrainer = Object.keys(trainerMap).map(trainer => {
    const info = trainerMap[trainer];
    const trainerResponses = responses.filter(r => info.ids.indexOf(String(r.programId)) !== -1);
    const stats = computeStats_(trainerResponses);
    return {
      trainer: trainer,
      workshopCount: info.workshopCount,
      totalParticipants: info.totalParticipants,
      responseCount: stats.count,
      avgOverall: stats.avgOverall,
      avgContentCategory: stats.avgContentCategory,
      avgTrainerCategory: stats.avgTrainerCategory,
      comments: stats.comments,
    };
  }).sort((a, b) => (b.avgOverall || 0) - (a.avgOverall || 0));

  // تحليل حسب نوع النشاط
  const typeMap = {};
  programs.forEach(p => {
    const type = p.data['نوع النشاط'] || 'غير محدد';
    const id = String(p.data['المعرف']);
    const participants = Number(p.data['عدد المشاركين']) || 0;
    if (!typeMap[type]) typeMap[type] = { ids: [], workshopCount: 0, totalParticipants: 0 };
    typeMap[type].ids.push(id);
    typeMap[type].workshopCount += 1;
    typeMap[type].totalParticipants += participants;
  });

  const byType = Object.keys(typeMap).map(type => {
    const info = typeMap[type];
    const typeResponses = responses.filter(r => info.ids.indexOf(String(r.programId)) !== -1);
    const stats = computeStats_(typeResponses);
    return {
      type: type,
      workshopCount: info.workshopCount,
      totalParticipants: info.totalParticipants,
      avgOverall: stats.avgOverall,
    };
  }).sort((a, b) => (b.avgOverall || 0) - (a.avgOverall || 0));

  // أحدث الملاحظات من كل الورش (الأحدث أولًا)
  const recentComments = responses
    .filter(r => r.notes && String(r.notes).trim() !== '')
    .map(r => ({ text: r.notes, workshopName: r.programName, date: r.timestamp }))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 20);

  return {
    totalWorkshops: programs.length,
    totalParticipants: totalParticipants,
    totalResponses: responses.length,
    avgOverall: overallStats.avgOverall,
    byTrainer: byTrainer,
    byType: byType,
    recentComments: recentComments,
  };
}

/**
 * بيانات صفحة تفاصيل مدرب واحد: كل ورشه، إحصاءات كل ورشة على حدة، والإحصاءات
 * الإجمالية (متوسط عام + محاور + كل تعليقاته) مجمّعة من كل ورشه.
 */
function getTrainerDetail_(trainerName) {
  const programs = getAllProgramRows_();
  const responses = getAllResponses_();

  const trainerPrograms = programs.filter(p => (p.data['المدرب'] || 'غير محدد') === trainerName);
  if (trainerPrograms.length === 0) return null;

  const ids = trainerPrograms.map(p => String(p.data['المعرف']));
  const trainerResponses = responses.filter(r => ids.indexOf(String(r.programId)) !== -1);
  const stats = computeStats_(trainerResponses);

  let totalParticipants = 0;
  const workshops = trainerPrograms.map(p => {
    const wId = p.data['المعرف'];
    const wResponses = responses.filter(r => String(r.programId) === String(wId));
    const wStats = computeStats_(wResponses);
    const participants = Number(p.data['عدد المشاركين']) || 0;
    totalParticipants += participants;
    return {
      id: wId,
      name: p.data['اسم الورشة'],
      type: p.data['نوع النشاط'],
      date: p.data['التاريخ'],
      participants: participants,
      responseCount: wStats.count,
      avgOverall: wStats.avgOverall,
    };
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  return {
    trainer: trainerName,
    workshopCount: trainerPrograms.length,
    totalParticipants: totalParticipants,
    workshops: workshops,
    stats: stats,
  };
}

/**
 * بيانات "لوحة التحكم" الرئيسية: مؤشرات سريعة عن كل النظام (إجمالي ورش/برامج،
 * إجمالي مشاركين، متوسط تقييم عام، أعلى مدرب، أكثر نوع نشاط، عدد الورش هذا الشهر/السنة).
 */
function getDashboardStats_() {
  const programs = getAllProgramRows_();
  const responses = getAllResponses_();
  const overallStats = computeStats_(responses);

  const now = new Date();
  const tz = Session.getScriptTimeZone();
  const curYearMonth = Utilities.formatDate(now, tz, 'yyyy-MM');
  const curYear = Utilities.formatDate(now, tz, 'yyyy');

  let totalParticipants = 0;
  let thisMonthCount = 0;
  let thisYearCount = 0;
  const typeCounts = {};
  const trainerMap = {};

  programs.forEach(p => {
    const n = Number(p.data['عدد المشاركين']);
    if (!isNaN(n)) totalParticipants += n;

    const type = p.data['نوع النشاط'] || 'غير محدد';
    typeCounts[type] = (typeCounts[type] || 0) + 1;

    const dateStr = String(p.data['التاريخ'] || '');
    if (dateStr.indexOf(curYearMonth) === 0) thisMonthCount++;
    if (dateStr.indexOf(curYear) === 0) thisYearCount++;

    const trainer = p.data['المدرب'] || 'غير محدد';
    const id = String(p.data['المعرف']);
    if (!trainerMap[trainer]) trainerMap[trainer] = [];
    trainerMap[trainer].push(id);
  });

  // أعلى مدرب تقييمًا (بأعلى متوسط عام، من بين من لديهم ردود فعلية)
  let topTrainer = null;
  let topTrainerAvg = null;
  Object.keys(trainerMap).forEach(trainer => {
    const ids = trainerMap[trainer];
    const tResponses = responses.filter(r => ids.indexOf(String(r.programId)) !== -1);
    const avg = computeStats_(tResponses).avgOverall;
    if (avg !== null && (topTrainerAvg === null || avg > topTrainerAvg)) {
      topTrainerAvg = avg;
      topTrainer = trainer;
    }
  });

  // أكثر نوع نشاط تم تنفيذه
  let mostCommonType = null;
  let mostCommonTypeCount = 0;
  Object.keys(typeCounts).forEach(type => {
    if (typeCounts[type] > mostCommonTypeCount) {
      mostCommonTypeCount = typeCounts[type];
      mostCommonType = type;
    }
  });

  return {
    totalWorkshops: typeCounts['ورشة عمل'] || 0,
    totalPrograms: typeCounts['برنامج'] || 0,
    totalSessions: typeCounts['جلسة'] || 0,
    totalActivities: programs.length,
    totalParticipants: totalParticipants,
    avgOverall: overallStats.avgOverall,
    topTrainer: topTrainer,
    topTrainerAvg: topTrainerAvg,
    mostCommonType: mostCommonType,
    mostCommonTypeCount: mostCommonTypeCount,
    thisMonthCount: thisMonthCount,
    thisYearCount: thisYearCount,
  };
}

/** تحليل حسب الجهة المنظمة: عدد ورش لكل جهة، متوسط تقييمها، وإجمالي مشاركيها */
function getOrganizerAnalysis_() {
  const programs = getAllProgramRows_();
  const responses = getAllResponses_();

  const map = {};
  programs.forEach(p => {
    const organizer = p.data['الجهة المنظمة'] || 'غير محدد';
    const id = String(p.data['المعرف']);
    const participants = Number(p.data['عدد المشاركين']) || 0;
    if (!map[organizer]) map[organizer] = { ids: [], workshopCount: 0, totalParticipants: 0 };
    map[organizer].ids.push(id);
    map[organizer].workshopCount += 1;
    map[organizer].totalParticipants += participants;
  });

  return Object.keys(map).map(organizer => {
    const info = map[organizer];
    const orgResponses = responses.filter(r => info.ids.indexOf(String(r.programId)) !== -1);
    const stats = computeStats_(orgResponses);
    return {
      organizer: organizer,
      workshopCount: info.workshopCount,
      totalParticipants: info.totalParticipants,
      avgOverall: stats.avgOverall,
    };
  }).sort((a, b) => (b.avgOverall || 0) - (a.avgOverall || 0));
}

/** تحليل حسب الفئة المستهدفة: عدد برامج/متوسط تقييم لكل فئة + أكثر فئة تم استهدافها */
function getAudienceAnalysis_() {
  const programs = getAllProgramRows_();
  const responses = getAllResponses_();

  const map = {};
  programs.forEach(p => {
    const audience = p.data['الفئة المستهدفة'] || 'غير محدد';
    const id = String(p.data['المعرف']);
    const participants = Number(p.data['عدد المشاركين']) || 0;
    if (!map[audience]) map[audience] = { ids: [], workshopCount: 0, totalParticipants: 0 };
    map[audience].ids.push(id);
    map[audience].workshopCount += 1;
    map[audience].totalParticipants += participants;
  });

  const list = Object.keys(map).map(audience => {
    const info = map[audience];
    const aResponses = responses.filter(r => info.ids.indexOf(String(r.programId)) !== -1);
    const stats = computeStats_(aResponses);
    return {
      audience: audience,
      workshopCount: info.workshopCount,
      totalParticipants: info.totalParticipants,
      avgOverall: stats.avgOverall,
    };
  }).sort((a, b) => b.workshopCount - a.workshopCount);

  return {
    list: list,
    mostTargeted: list.length ? list[0].audience : null,
  };
}

const MONTH_NAMES_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

/** تحليل زمني: عدد الورش لكل شهر (مجمّع عبر كل السنوات) + لكل سنة + أنشط/أقل شهر نشاطًا */
function getTimeAnalysis_() {
  const programs = getAllProgramRows_();

  const byMonthName = {};
  MONTH_NAMES_AR.forEach(m => { byMonthName[m] = 0; });
  const byYear = {};
  const byYearMonth = {};

  programs.forEach(p => {
    const dateStr = String(p.data['التاريخ'] || '');
    const m = dateStr.match(/^(\d{4})-(\d{2})/);
    if (!m) return;
    const year = m[1];
    const monthIdx = parseInt(m[2], 10) - 1;
    const monthName = MONTH_NAMES_AR[monthIdx];
    if (monthName) byMonthName[monthName] += 1;

    byYear[year] = (byYear[year] || 0) + 1;

    const ym = year + '-' + m[2];
    byYearMonth[ym] = (byYearMonth[ym] || 0) + 1;
  });

  const monthEntries = MONTH_NAMES_AR.map(name => ({ month: name, count: byMonthName[name] }));
  const withData = monthEntries.filter(e => e.count > 0);

  let mostActiveMonth = null;
  let leastActiveMonth = null;
  if (withData.length) {
    mostActiveMonth = withData.reduce((a, b) => (b.count > a.count ? b : a));
    leastActiveMonth = withData.reduce((a, b) => (b.count < a.count ? b : a));
  }

  return {
    byMonthName: monthEntries,
    byYear: Object.keys(byYear).sort().map(y => ({ year: y, count: byYear[y] })),
    byYearMonth: Object.keys(byYearMonth).sort().map(ym => ({ yearMonth: ym, count: byYearMonth[ym] })),
    mostActiveMonth: mostActiveMonth,
    leastActiveMonth: leastActiveMonth,
  };
}

/** أفضل وأسوأ 10 ورش (حسب متوسط التقييم) + أعلى وأقل 10 مدربين */
function getBestWorstAnalysis_() {
  const summary = getWorkshopsSummary_();
  const rated = summary.filter(w => w.avgOverall !== null && w.avgOverall !== undefined);

  const bestWorkshops = rated.slice().sort((a, b) => b.avgOverall - a.avgOverall).slice(0, 10);
  const worstWorkshops = rated.slice().sort((a, b) => a.avgOverall - b.avgOverall).slice(0, 10);

  const reportsData = getReportsData_();
  const ratedTrainers = reportsData.byTrainer.filter(t => t.avgOverall !== null && t.avgOverall !== undefined);
  const bestTrainers = ratedTrainers.slice(0, 10);
  const worstTrainers = ratedTrainers.slice().reverse().slice(0, 10);

  return {
    bestWorkshops: bestWorkshops,
    worstWorkshops: worstWorkshops,
    bestTrainers: bestTrainers,
    worstTrainers: worstTrainers,
  };
}

/** بيانات صفحة تفاصيل نوع نشاط واحد: كل ورشه، إحصاءاته، وأفضل المدربين ضمن هذا النوع */
function getTypeDetail_(type) {
  const programs = getAllProgramRows_();
  const responses = getAllResponses_();

  const typePrograms = programs.filter(p => (p.data['نوع النشاط'] || 'غير محدد') === type);
  if (typePrograms.length === 0) return null;

  const ids = typePrograms.map(p => String(p.data['المعرف']));
  const typeResponses = responses.filter(r => ids.indexOf(String(r.programId)) !== -1);
  const stats = computeStats_(typeResponses);

  let totalParticipants = 0;
  const workshops = typePrograms.map(p => {
    const wId = p.data['المعرف'];
    const wResponses = responses.filter(r => String(r.programId) === String(wId));
    const wStats = computeStats_(wResponses);
    const participants = Number(p.data['عدد المشاركين']) || 0;
    totalParticipants += participants;
    return {
      id: wId,
      name: p.data['اسم الورشة'],
      trainer: p.data['المدرب'],
      date: p.data['التاريخ'],
      participants: participants,
      responseCount: wStats.count,
      avgOverall: wStats.avgOverall,
    };
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const trainerMap = {};
  typePrograms.forEach(p => {
    const trainer = p.data['المدرب'] || 'غير محدد';
    const id = String(p.data['المعرف']);
    if (!trainerMap[trainer]) trainerMap[trainer] = [];
    trainerMap[trainer].push(id);
  });
  const topTrainers = Object.keys(trainerMap).map(trainer => {
    const tIds = trainerMap[trainer];
    const tResponses = responses.filter(r => tIds.indexOf(String(r.programId)) !== -1);
    const tStats = computeStats_(tResponses);
    return { trainer: trainer, workshopCount: tIds.length, avgOverall: tStats.avgOverall };
  }).sort((a, b) => (b.avgOverall || 0) - (a.avgOverall || 0));

  return {
    type: type,
    workshopCount: typePrograms.length,
    totalParticipants: totalParticipants,
    workshops: workshops,
    stats: stats,
    topTrainers: topTrainers,
  };
}

/** بيانات صفحة تفاصيل "برنامج" واحد (كل نسخه اللي بنفس الاسم بالضبط) */
function getProgramDetail_(name) {
  const programs = getAllProgramRows_();
  const responses = getAllResponses_();

  const matches = programs.filter(p => (p.data['اسم الورشة'] || '') === name);
  if (matches.length === 0) return null;

  let totalParticipants = 0;
  const instances = matches.map(p => {
    const wId = p.data['المعرف'];
    const wResponses = responses.filter(r => String(r.programId) === String(wId));
    const wStats = computeStats_(wResponses);
    const participants = Number(p.data['عدد المشاركين']) || 0;
    totalParticipants += participants;
    return {
      id: wId,
      trainer: p.data['المدرب'],
      type: p.data['نوع النشاط'],
      date: p.data['التاريخ'],
      participants: participants,
      responseCount: wStats.count,
      avgOverall: wStats.avgOverall,
    };
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const ids = matches.map(p => String(p.data['المعرف']));
  const allResponses = responses.filter(r => ids.indexOf(String(r.programId)) !== -1);
  const stats = computeStats_(allResponses);

  let bestInstance = null;
  instances.forEach(inst => {
    if (inst.avgOverall !== null && inst.avgOverall !== undefined) {
      if (!bestInstance || inst.avgOverall > bestInstance.avgOverall) bestInstance = inst;
    }
  });

  return {
    name: name,
    executionCount: matches.length,
    totalParticipants: totalParticipants,
    instances: instances,
    stats: stats,
    bestTrainer: bestInstance ? { trainer: bestInstance.trainer, avgOverall: bestInstance.avgOverall } : null,
  };
}

/** قائمة كل "البرامج" اللي نُفّذت أكثر من مرة بنفس الاسم بالضبط (لصفحة التقارير) */
function getRecurringPrograms_() {
  const programs = getAllProgramRows_();
  const nameMap = {};
  programs.forEach(p => {
    const name = p.data['اسم الورشة'];
    nameMap[name] = (nameMap[name] || 0) + 1;
  });
  return Object.keys(nameMap)
    .filter(name => nameMap[name] > 1)
    .map(name => ({ name: name, executionCount: nameMap[name] }))
    .sort((a, b) => b.executionCount - a.executionCount);
}

/** القيم المتاحة لأداة المقارنة (لتعبئة قوائم الاختيار بالواجهة) */
function getComparisonOptions_() {
  const programs = getAllProgramRows_();
  const trainers = {};
  const types = {};
  const organizers = {};
  const years = {};

  programs.forEach(p => {
    trainers[p.data['المدرب'] || 'غير محدد'] = true;
    types[p.data['نوع النشاط'] || 'غير محدد'] = true;
    organizers[p.data['الجهة المنظمة'] || 'غير محدد'] = true;
    const y = String(p.data['التاريخ'] || '').substring(0, 4);
    if (y) years[y] = true;
  });

  return {
    trainers: Object.keys(trainers).sort(),
    types: Object.keys(types).sort(),
    organizers: Object.keys(organizers).sort(),
    years: Object.keys(years).sort(),
  };
}

function getComparisonSide_(dimension, value) {
  const programs = getAllProgramRows_();
  const responses = getAllResponses_();

  let matches;
  if (dimension === 'trainer') {
    matches = programs.filter(p => (p.data['المدرب'] || 'غير محدد') === value);
  } else if (dimension === 'type') {
    matches = programs.filter(p => (p.data['نوع النشاط'] || 'غير محدد') === value);
  } else if (dimension === 'organizer') {
    matches = programs.filter(p => (p.data['الجهة المنظمة'] || 'غير محدد') === value);
  } else if (dimension === 'year') {
    matches = programs.filter(p => String(p.data['التاريخ'] || '').indexOf(String(value)) === 0);
  } else {
    matches = [];
  }

  const ids = matches.map(p => String(p.data['المعرف']));
  const matchResponses = responses.filter(r => ids.indexOf(String(r.programId)) !== -1);
  const stats = computeStats_(matchResponses);

  let totalParticipants = 0;
  matches.forEach(p => { totalParticipants += Number(p.data['عدد المشاركين']) || 0; });

  const trainerMap = {};
  matches.forEach(p => {
    const trainer = p.data['المدرب'] || 'غير محدد';
    const id = String(p.data['المعرف']);
    if (!trainerMap[trainer]) trainerMap[trainer] = [];
    trainerMap[trainer].push(id);
  });
  let bestTrainer = null;
  let bestTrainerAvg = null;
  Object.keys(trainerMap).forEach(trainer => {
    const tIds = trainerMap[trainer];
    const tResponses = responses.filter(r => tIds.indexOf(String(r.programId)) !== -1);
    const avg = computeStats_(tResponses).avgOverall;
    if (avg !== null && (bestTrainerAvg === null || avg > bestTrainerAvg)) {
      bestTrainerAvg = avg;
      bestTrainer = trainer;
    }
  });

  return {
    label: value,
    workshopCount: matches.length,
    totalParticipants: totalParticipants,
    avgOverall: stats.avgOverall,
    bestTrainer: bestTrainer,
    bestTrainerAvg: bestTrainerAvg,
  };
}

/** مقارنة بين قيمتين ضمن نفس البُعد (مدرب/نوع/سنة/جهة منظمة) */
function getComparisonData_(dimension, value1, value2) {
  return {
    dimension: dimension,
    a: getComparisonSide_(dimension, value1),
    b: getComparisonSide_(dimension, value2),
  };
}

/** تحليل الكلمات المفتاحية: يحسب تكرار كل كلمة من قائمة الإعدادات ضمن عناوين البرامج */
function getKeywordAnalysis_() {
  const programs = getAllProgramRows_();
  const settings = getSettings_();

  return settings.keywords.map(keyword => {
    const count = programs.filter(p => String(p.data['اسم الورشة'] || '').indexOf(keyword) !== -1).length;
    return { keyword: keyword, count: count };
  }).sort((a, b) => b.count - a.count);
}

/** أكثر المدربين نشاطًا من 3 زوايا: عدد التنفيذ، متوسط التقييم، إجمالي المشاركين */
function getMostActiveTrainers_() {
  const byTrainer = getReportsData_().byTrainer;

  return {
    byWorkshopCount: byTrainer.slice().sort((a, b) => b.workshopCount - a.workshopCount).slice(0, 10),
    byAvgOverall: byTrainer.filter(t => t.avgOverall !== null).slice().sort((a, b) => b.avgOverall - a.avgOverall).slice(0, 10),
    byParticipants: byTrainer.slice().sort((a, b) => b.totalParticipants - a.totalParticipants).slice(0, 10),
  };
}

/**
 * توصيات إدارية آلية مبنية على قواعد إحصائية ثابتة (وليست ذكاءً اصطناعيًا):
 * إعادة استضافة مدرب متميز، مراجعة مدرب ضعيف، توسيع/مراجعة نوع نشاط، والتركيز على أفضل فئة مستهدفة.
 */
function getRecommendations_() {
  const reportsData = getReportsData_();
  const recs = [];

  reportsData.byTrainer.forEach(t => {
    if (t.avgOverall !== null) {
      if (t.avgOverall >= 4.5 && t.workshopCount >= 2) {
        recs.push({ type: 'trainer_rehost', text: 'يوصى بإعادة استضافة المدرب "' + t.trainer + '" — متوسط تقييمه ' + t.avgOverall + ' من 5 عبر ' + t.workshopCount + ' نشاط.' });
      } else if (t.avgOverall < 3 && t.workshopCount >= 1) {
        recs.push({ type: 'trainer_review', text: 'يوصى بمراجعة أداء المدرب "' + t.trainer + '" — متوسط تقييمه ' + t.avgOverall + ' من 5.' });
      }
    }
  });

  reportsData.byType.forEach(ty => {
    if (ty.avgOverall !== null) {
      if (ty.avgOverall >= 4.5 && ty.workshopCount >= 2) {
        recs.push({ type: 'type_expand', text: 'يوصى بزيادة عدد برامج "' + ty.type + '" — متوسط تقييمها ' + ty.avgOverall + ' من 5.' });
      } else if (ty.avgOverall < 3 && ty.workshopCount >= 2) {
        recs.push({ type: 'type_stop', text: 'يوصى بمراجعة أو إيقاف نوع النشاط "' + ty.type + '" — متوسط تقييمه ' + ty.avgOverall + ' من 5.' });
      }
    }
  });

  const audienceAnalysis = getAudienceAnalysis_();
  const ratedAudiences = audienceAnalysis.list.filter(a => a.avgOverall !== null);
  if (ratedAudiences.length) {
    const best = ratedAudiences.slice().sort((a, b) => b.avgOverall - a.avgOverall)[0];
    recs.push({ type: 'audience_focus', text: 'يوصى بالتركيز أكثر على استهداف فئة "' + best.audience + '" — أعلى نسبة رضا بمتوسط ' + best.avgOverall + ' من 5.' });
  }

  return recs;
}

/** مؤشرات أداء إضافية: نسبة الرضا، متوسط الحضور، معدل النمو السنوي، وسجل الإنجازات */
function getKPIExtended_() {
  const programs = getAllProgramRows_();
  const responses = getAllResponses_();

  const ratedResponses = responses.filter(r => !isNaN(r.generalRating) && r.generalRating !== null && r.generalRating !== '');
  const satisfiedCount = ratedResponses.filter(r => r.generalRating >= 4).length;
  const satisfactionRate = ratedResponses.length ? Math.round((satisfiedCount / ratedResponses.length) * 1000) / 10 : null;

  const avgAttendance = programs.length
    ? Math.round((programs.reduce((sum, p) => sum + (Number(p.data['عدد المشاركين']) || 0), 0) / programs.length) * 10) / 10
    : null;

  const now = new Date();
  const tz = Session.getScriptTimeZone();
  const curYear = Utilities.formatDate(now, tz, 'yyyy');
  const lastYear = String(Number(curYear) - 1);

  let curYearCount = 0;
  let lastYearCount = 0;
  programs.forEach(p => {
    const dateStr = String(p.data['التاريخ'] || '');
    if (dateStr.indexOf(curYear) === 0) curYearCount++;
    if (dateStr.indexOf(lastYear) === 0) lastYearCount++;
  });

  let growthRate = null;
  if (lastYearCount > 0) {
    growthRate = Math.round(((curYearCount - lastYearCount) / lastYearCount) * 1000) / 10;
  }

  const distinctTrainers = {};
  programs.forEach(p => { distinctTrainers[p.data['المدرب'] || 'غير محدد'] = true; });

  return {
    satisfactionRate: satisfactionRate,
    avgAttendance: avgAttendance,
    curYear: curYear,
    curYearCount: curYearCount,
    lastYear: lastYear,
    lastYearCount: lastYearCount,
    growthRate: growthRate,
    totalProgramsEver: programs.length,
    totalParticipantsEver: programs.reduce((sum, p) => sum + (Number(p.data['عدد المشاركين']) || 0), 0),
    totalDistinctTrainers: Object.keys(distinctTrainers).length,
  };
}

/** تقدّم الأهداف السنوية: يقارن أرقام السنة الحالية الفعلية بالأهداف المسجّلة في الإعدادات */
function getGoalsProgress_() {
  const settings = getSettings_();
  const programs = getAllProgramRows_();

  const now = new Date();
  const tz = Session.getScriptTimeZone();
  const curYear = Utilities.formatDate(now, tz, 'yyyy');

  let curYearPrograms = 0;
  let curYearParticipants = 0;
  programs.forEach(p => {
    const dateStr = String(p.data['التاريخ'] || '');
    if (dateStr.indexOf(curYear) === 0) {
      curYearPrograms++;
      curYearParticipants += Number(p.data['عدد المشاركين']) || 0;
    }
  });

  function pct(actual, target) {
    if (!target) return null;
    return Math.round((actual / target) * 1000) / 10;
  }

  return {
    year: curYear,
    targetPrograms: settings.targetPrograms,
    actualPrograms: curYearPrograms,
    programsPct: pct(curYearPrograms, settings.targetPrograms),
    targetParticipants: settings.targetParticipants,
    actualParticipants: curYearParticipants,
    participantsPct: pct(curYearParticipants, settings.targetParticipants),
  };
}
