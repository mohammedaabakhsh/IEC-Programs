/**
 * واجهة برمجية (API) يستخدمها التطبيق الأمامي (docs/) بعد نشر هذا المشروع
 * كـ Web App من Deploy ← New deployment ← Web app (Execute as: Me, Access: Anyone).
 *
 * نقاط النهاية:
 *   GET  ?action=workshops            → قائمة كل الورش مع ملخص إحصائي (JSON)
 *   GET  ?action=workshop&id=<المعرف> → تفاصيل وإحصاءات ورشة واحدة
 *   GET  ?action=reports                → تحليلات عامة: حسب المدرب، حسب نوع النشاط، وأحدث الملاحظات
 *   GET  ?action=trainer&name=<اسم المدرب> → صفحة تفاصيل مدرب واحد (كل ورشه وإحصاءاته)
 *   GET  ?action=dashboard             → مؤشرات لوحة التحكم الرئيسية (KPIs سريعة)
 *   GET  ?action=organizers            → تحليل حسب الجهة المنظمة
 *   GET  ?action=audiences             → تحليل حسب الفئة المستهدفة
 *   GET  ?action=timeAnalysis          → تحليل زمني (شهري/سنوي وأنشط/أقل شهر)
 *   GET  ?action=bestWorst             → أفضل/أسوأ 10 ورش وأعلى/أقل 10 مدربين
 *   GET  ?action=type&type=<النوع>     → تفاصيل نوع نشاط واحد
 *   GET  ?action=program&name=<الاسم>  → تفاصيل "برنامج" واحد (كل نسخه المتكررة)
 *   GET  ?action=recurringPrograms     → قائمة البرامج المتكررة (نُفّذت أكثر من مرة)
 *   GET  ?action=comparisonOptions     → القيم المتاحة لأداة المقارنة
 *   GET  ?action=compare&dimension=&value1=&value2= → مقارنة بين قيمتين (مدرب/نوع/سنة/جهة)
 *   GET  ?action=keywords              → تحليل الكلمات المفتاحية بعناوين البرامج
 *   GET  ?action=activeTrainers        → أكثر المدربين نشاطًا (تنفيذ/تقييم/مشاركين)
 *   GET  ?action=recommendations       → توصيات إدارية آلية مبنية على قواعد إحصائية
 *   GET  ?action=kpiExtended           → مؤشرات KPI إضافية (رضا/حضور/نمو سنوي)
 *   GET  ?action=goals                 → تقدّم الأهداف السنوية مقابل الفعلي
 *   GET  ?action=settings              → قراءة الإعدادات (الأهداف والقوائم القابلة للتعديل)
 *   GET  ?action=trainerProfile&name=<اسم المدرب> → الملف التعريفي الاختياري لمدرب (مُضمَّن أيضًا داخل ?action=trainer)
 *   GET  ?action=dashboardBundle        → كل بيانات لوحة التحكم بنداء واحد (أسرع من 3 نداءات منفصلة)
 *   GET  ?action=reportsBundle          → كل بيانات صفحة التقارير بنداء واحد (أسرع من 9 نداءات منفصلة)
 *   GET  ?action=searchIndex            → فهرس خفيف (ورش/مدربين/أنواع) للبحث السريع بالقائمة الجانبية
 *   POST { action:'createWorkshop', name, description, date, time, trainer,
 *          audience, participants, organizer } → إنشاء ورشة جديدة وإرجاع رابط/QR التقييم
 *   POST { action:'updateWorkshop', id, name, description, date, time, trainer,
 *          audience, participants, organizer } → تعديل بيانات ورشة موجودة
 *   POST { action:'deleteWorkshop', id } → حذف ورشة
 *   POST { action:'generateCertificate', name } → توليد شهادة تقدير PDF بالاسم (base64)
 *   POST { action:'updateSettings', targetPrograms, targetParticipants,
 *          audienceCategories, keywords } → تحديث إعدادات النظام
 *   POST { action:'updateTrainerProfile', trainer, title, organization, email,
 *          phone, bio, link, internalNotes } → حفظ/تحديث الملف التعريفي لمدرب
 *
 * ملاحظة: تعبئة نموذج التقييم نفسها تتم مباشرة داخل Google Form (وليس عبر هذا الـ API)،
 * والردود تُحفظ تلقائيًا في ورقة "استجابات التقييم" بواسطة Google Forms.
 */

function doGet(e) {
  try {
    const action = e && e.parameter && e.parameter.action;

    if (action === 'workshops') {
      return jsonOutput_({ ok: true, data: getWorkshopsSummary_() });
    }

    if (action === 'workshop') {
      const id = e.parameter.id;
      const detail = getWorkshopDetail_(id);
      if (!detail) return jsonOutput_({ ok: false, error: 'الورشة غير موجودة' });
      return jsonOutput_({ ok: true, data: detail });
    }

    if (action === 'reports') {
      return jsonOutput_({ ok: true, data: getReportsData_() });
    }

    if (action === 'trainer') {
      const trainerName = e.parameter.name;
      const detail = getTrainerDetail_(trainerName);
      if (!detail) return jsonOutput_({ ok: false, error: 'المدرب غير موجود' });
      return jsonOutput_({ ok: true, data: detail });
    }

    if (action === 'dashboard') {
      return jsonOutput_({ ok: true, data: getDashboardStats_() });
    }

    if (action === 'organizers') {
      return jsonOutput_({ ok: true, data: getOrganizerAnalysis_() });
    }

    if (action === 'audiences') {
      return jsonOutput_({ ok: true, data: getAudienceAnalysis_() });
    }

    if (action === 'timeAnalysis') {
      return jsonOutput_({ ok: true, data: getTimeAnalysis_() });
    }

    if (action === 'bestWorst') {
      return jsonOutput_({ ok: true, data: getBestWorstAnalysis_() });
    }

    if (action === 'type') {
      const type = e.parameter.type;
      const detail = getTypeDetail_(type);
      if (!detail) return jsonOutput_({ ok: false, error: 'نوع النشاط غير موجود' });
      return jsonOutput_({ ok: true, data: detail });
    }

    if (action === 'program') {
      const name = e.parameter.name;
      const detail = getProgramDetail_(name);
      if (!detail) return jsonOutput_({ ok: false, error: 'البرنامج غير موجود' });
      return jsonOutput_({ ok: true, data: detail });
    }

    if (action === 'recurringPrograms') {
      return jsonOutput_({ ok: true, data: getRecurringPrograms_() });
    }

    if (action === 'comparisonOptions') {
      return jsonOutput_({ ok: true, data: getComparisonOptions_() });
    }

    if (action === 'compare') {
      const dimension = e.parameter.dimension;
      const value1 = e.parameter.value1;
      const value2 = e.parameter.value2;
      return jsonOutput_({ ok: true, data: getComparisonData_(dimension, value1, value2) });
    }

    if (action === 'keywords') {
      return jsonOutput_({ ok: true, data: getKeywordAnalysis_() });
    }

    if (action === 'activeTrainers') {
      return jsonOutput_({ ok: true, data: getMostActiveTrainers_() });
    }

    if (action === 'recommendations') {
      return jsonOutput_({ ok: true, data: getRecommendations_() });
    }

    if (action === 'kpiExtended') {
      return jsonOutput_({ ok: true, data: getKPIExtended_() });
    }

    if (action === 'goals') {
      return jsonOutput_({ ok: true, data: getGoalsProgress_() });
    }

    if (action === 'settings') {
      return jsonOutput_({ ok: true, data: getSettings_() });
    }

    if (action === 'trainerProfile') {
      const trainerName = e.parameter.name;
      return jsonOutput_({ ok: true, data: getTrainerProfile_(trainerName) });
    }

    if (action === 'dashboardBundle') {
      return jsonOutput_({ ok: true, data: getDashboardBundle_() });
    }

    if (action === 'reportsBundle') {
      return jsonOutput_({ ok: true, data: getReportsBundle_() });
    }

    if (action === 'searchIndex') {
      return jsonOutput_({ ok: true, data: getSearchIndex_() });
    }

    return jsonOutput_({ ok: true, message: 'IEC-Programs API يعمل بنجاح.' });
  } catch (err) {
    return jsonOutput_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);

    if (body.action === 'createWorkshop') {
      return jsonOutput_(createWorkshop_(body));
    }

    if (body.action === 'updateWorkshop') {
      return jsonOutput_(updateWorkshop_(body));
    }

    if (body.action === 'deleteWorkshop') {
      return jsonOutput_(deleteWorkshop_(body.id));
    }

    if (body.action === 'generateCertificate') {
      return jsonOutput_(generateCertificate_(body.name));
    }

    if (body.action === 'updateSettings') {
      return jsonOutput_(updateSettings_(body));
    }

    if (body.action === 'updateTrainerProfile') {
      return jsonOutput_(updateTrainerProfile_(body));
    }

    return jsonOutput_({ ok: false, error: 'إجراء غير معروف' });
  } catch (err) {
    return jsonOutput_({ ok: false, error: String(err) });
  }
}

function jsonOutput_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
