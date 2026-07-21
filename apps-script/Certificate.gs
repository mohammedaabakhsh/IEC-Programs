/**
 * توليد شهادات تقدير (PDF) بالاسم كمتغيّر، فوق خلفية ثابتة (عنوان ونص عام لا يتغيّر).
 * يعتمد على Google Slides كخادم "طباعة" — يضمن عرض النص العربي بشكل سليم دون مشاكل تشكيل.
 */

const CERT_CONFIG = {
  BACKGROUND_IMAGE_URL: 'https://mohammedaabakhsh.github.io/IEC-Programs/assets/certificate-bg.png',
  PAGE_WIDTH_PT: 858.898,
  PAGE_HEIGHT_PT: 612.283,
  NAME_Y_FROM_BOTTOM_PT: 275,
  NAME_BOX_WIDTH_PT: 500,
  NAME_BOX_HEIGHT_PT: 50,
  NAME_FONT_SIZE: 34,
  NAME_FONT_COLOR: '#4bbf82',
  PROP_CERT_TEMPLATE_ID: 'CERT_TEMPLATE_ID',
};

/** ينشئ قالب الشهادة في Google Slides مرة واحدة فقط (يُعاد استخدامه لاحقًا) */
function ensureCertificateTemplate_() {
  const props = PropertiesService.getScriptProperties();
  const existingId = props.getProperty(CERT_CONFIG.PROP_CERT_TEMPLATE_ID);

  if (existingId) {
    try {
      SlidesApp.openById(existingId);
      return existingId;
    } catch (e) {
      // القالب المخزّن لم يعد متاحًا، أنشئ من جديد
    }
  }

  const presentation = SlidesApp.create('قالب شهادة التقدير - لا تحذف هذا الملف');

  try {
    presentation.setPageWidth(CERT_CONFIG.PAGE_WIDTH_PT);
    presentation.setPageHeight(CERT_CONFIG.PAGE_HEIGHT_PT);
  } catch (err) {
    Logger.log('تعذّر ضبط أبعاد الصفحة: ' + err);
  }

  const slide = presentation.getSlides()[0];

  slide.getShapes().forEach(sh => { try { sh.remove(); } catch (e) {} });

  slide.insertImage(
    CERT_CONFIG.BACKGROUND_IMAGE_URL, 0, 0,
    CERT_CONFIG.PAGE_WIDTH_PT, CERT_CONFIG.PAGE_HEIGHT_PT
  );

  const top = CERT_CONFIG.PAGE_HEIGHT_PT - CERT_CONFIG.NAME_Y_FROM_BOTTOM_PT - (CERT_CONFIG.NAME_BOX_HEIGHT_PT / 2);
  const left = (CERT_CONFIG.PAGE_WIDTH_PT - CERT_CONFIG.NAME_BOX_WIDTH_PT) / 2;

  const nameBox = slide.insertTextBox('{{NAME}}', left, top, CERT_CONFIG.NAME_BOX_WIDTH_PT, CERT_CONFIG.NAME_BOX_HEIGHT_PT);
  const textRange = nameBox.getText();
  textRange.getTextStyle()
    .setFontFamily('Amiri')
    .setFontSize(CERT_CONFIG.NAME_FONT_SIZE)
    .setBold(true)
    .setForegroundColor(CERT_CONFIG.NAME_FONT_COLOR);
  textRange.getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

  props.setProperty(CERT_CONFIG.PROP_CERT_TEMPLATE_ID, presentation.getId());
  return presentation.getId();
}

/** يولّد شهادة PDF باسم معيّن، ويعيدها كـ base64 داخل استجابة الـ API */
function generateCertificate_(name) {
  if (!name || String(name).trim() === '') {
    return { ok: false, error: 'الاسم مطلوب' };
  }

  const templateId = ensureCertificateTemplate_();
  const copyFile = DriveApp.getFileById(templateId).makeCopy('temp-certificate-' + new Date().getTime());

  try {
    const presentation = SlidesApp.openById(copyFile.getId());
    presentation.getSlides()[0].replaceAllText('{{NAME}}', name);
    presentation.saveAndClose();

    const pdfBlob = DriveApp.getFileById(copyFile.getId()).getAs('application/pdf');
    const base64 = Utilities.base64Encode(pdfBlob.getBytes());

    return { ok: true, pdfBase64: base64, filename: 'شهادة تقدير - ' + name + '.pdf' };
  } catch (err) {
    return { ok: false, error: String(err) };
  } finally {
    try { copyFile.setTrashed(true); } catch (e) {}
  }
}
