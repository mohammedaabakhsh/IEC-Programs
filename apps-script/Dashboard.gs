/**
 * لوحة المتابعة: تجميع نتائج الاستجابات لكل برنامج وحساب المتوسطات ونسب المشاركة.
 */

// ترتيب أعمدة ورقة "استجابات التقييم" كما في CONFIG.RESPONSE_COLUMNS
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

function refreshDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dashboard = ensureDashboardSheet_(ss);
  const responsesSheet = ss.getSheetByName(CONFIG.SHEETS.RESPONSES);

  const programs = getAllProgramRows_();
  const responsesByProgram = groupResponsesByProgram_(responsesSheet);

  const lastRow = dashboard.getLastRow();
  if (lastRow > 1) {
    dashboard.getRange(2, 1, lastRow - 1, CONFIG.DASHBOARD_COLUMNS.length).clearContent();
  }

  const output = [];
  programs.forEach(({ data }) => {
    const name = data['اسم البرنامج'];
    if (!name) return;

    const target = Number(data['عدد المشاركين المستهدف']) || 0;
    const stats = responsesByProgram[name] || emptyStats_();
    const count = stats.count;
    const participationRate = target > 0 ? Math.round((count / target) * 1000) / 10 : 0;

    output.push([
      name,
      target,
      count,
      count > 0 ? participationRate + '%' : '0%',
      avg_(stats.content),
      avg_(stats.organization),
      avg_(stats.trainer),
      avg_(stats.goals),
      avg_(stats.benefit),
      avg_(stats.overall),
      new Date(),
    ]);
  });

  if (output.length > 0) {
    dashboard.getRange(2, 1, output.length, CONFIG.DASHBOARD_COLUMNS.length).setValues(output);
  }

  return output;
}

function groupResponsesByProgram_(responsesSheet) {
  const groups = {};
  if (!responsesSheet) return groups;

  const lastRow = responsesSheet.getLastRow();
  if (lastRow < 2) return groups;

  const lastCol = Math.max(responsesSheet.getLastColumn(), CONFIG.RESPONSE_COLUMNS.length);
  const values = responsesSheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

  values.forEach(row => {
    const name = row[RESPONSE_COL.PROGRAM_NAME];
    if (!name) return;

    if (!groups[name]) groups[name] = emptyStats_();
    const g = groups[name];

    g.count += 1;
    pushIfNumber_(g.content, row[RESPONSE_COL.CONTENT]);
    pushIfNumber_(g.organization, row[RESPONSE_COL.ORGANIZATION]);
    pushIfNumber_(g.trainer, row[RESPONSE_COL.TRAINER]);
    pushIfNumber_(g.goals, row[RESPONSE_COL.GOALS]);
    pushIfNumber_(g.benefit, row[RESPONSE_COL.BENEFIT]);

    [row[RESPONSE_COL.CONTENT], row[RESPONSE_COL.ORGANIZATION], row[RESPONSE_COL.TRAINER],
     row[RESPONSE_COL.GOALS], row[RESPONSE_COL.BENEFIT]].forEach(v => pushIfNumber_(g.overall, v));
  });

  return groups;
}

function emptyStats_() {
  return { count: 0, content: [], organization: [], trainer: [], goals: [], benefit: [], overall: [] };
}

function pushIfNumber_(arr, v) {
  const n = Number(v);
  if (!isNaN(n) && v !== '' && v !== null) arr.push(n);
}

function avg_(arr) {
  if (!arr || arr.length === 0) return '';
  const sum = arr.reduce((a, b) => a + b, 0);
  return Math.round((sum / arr.length) * 100) / 100;
}

/** يعمل أسبوعيًا: يرسل تقريرًا موجزًا بمؤشرات لوحة المتابعة إلى البريد الإداري */
function sendWeeklyReport() {
  refreshDashboard();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dashboard = ss.getSheetByName(CONFIG.SHEETS.DASHBOARD);
  const lastRow = dashboard.getLastRow();
  if (lastRow < 2) return;

  const values = dashboard.getRange(2, 1, lastRow - 1, CONFIG.DASHBOARD_COLUMNS.length).getValues();

  let html = '<div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; font-size:13px;">';
  html += '<h3>التقرير الدوري لمؤشرات رضا المستفيدين</h3>';
  html += '<table border="1" cellpadding="6" style="border-collapse:collapse;text-align:center;">';
  html += '<tr style="background:#1c4587;color:#fff;">' +
    CONFIG.DASHBOARD_COLUMNS.map(c => '<th>' + c + '</th>').join('') + '</tr>';

  values.forEach(row => {
    if (!row[0]) return;
    html += '<tr>' + row.map(v =>
      '<td>' + (v instanceof Date ? Utilities.formatDate(v, 'Asia/Riyadh', 'yyyy-MM-dd') : v) + '</td>'
    ).join('') + '</tr>';
  });

  html += '</table></div>';

  MailApp.sendEmail({
    to: CONFIG.ADMIN_EMAIL,
    subject: 'التقرير الدوري — نظام تقييم البرامج (' + Utilities.formatDate(new Date(), 'Asia/Riyadh', 'yyyy-MM-dd') + ')',
    htmlBody: html,
  });
}
