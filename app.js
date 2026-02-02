const debug = (...args) => {
  const el = document.getElementById("debug-output");
  if (!el) return;
  el.textContent +=
    args
      .map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)))
      .join(" ") + "\n\n";
};

const API_URL = "https://script.google.com/macros/s/AKfycbxVVrWT_gnEXGRoOoKBE0ip6SqLB5wRNaS05SCnFYZzYX0poa4KHnJYfksHice9C0Uuxg/exec";
const AUTH_STORAGE_KEY = "unitysphereUser";
const LANG_STORAGE_KEY = "unitysphereLang";
const LOGIN_PAGE = "login.html";
const ALLOWED_ROUTES = new Set(["login", "centers", "specialists", "children", "vr", "centervr"]);
const READ_ONLY_MESSAGE = "This view is read-only.";
const getById = (id) => (typeof document === "undefined" ? null : document.getElementById(id));
const normalizeKey = (value) => String(value || "").toLowerCase().replace(/[\s_-]+/g, "");
const DEFAULT_LANG = "ar";
let currentLanguage = DEFAULT_LANG;
const CLIENT_ID = "liyan";

const firebaseConfig = {
  apiKey: "AIzaSyBGqbHK3LcuL5u6KaUtBadAqM3cyQ2vkvM",
  authDomain: "math-learning-b4f99.firebaseapp.com",
  projectId: "math-learning-b4f99",
  storageBucket: "math-learning-b4f99.firebasestorage.app",
  messagingSenderId: "560904598184",
  appId: "1:560904598184:web:ad6a9ccf8b9e4facd4889d",
  measurementId: "G-ZJB11PB7S7"
};

let firestore = null;
const getFirestore = () => {
  if (typeof window === "undefined" || !window.firebase) {
    return null;
  }
  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  if (!firestore) firestore = firebase.firestore();
  return firestore;
};

const isApiUrlConfigured = () =>
  API_URL && API_URL !== "YOUR_APPS_SCRIPT_WEB_APP_URL" && API_URL !== "<LATEST_APPS_SCRIPT_WEB_APP_URL>";

const showDataError = (message) => {
  if (typeof document === "undefined") return;
  const existing = document.querySelector(".data-error-banner");
  const text = message || "Data unavailable. Check your Google Sheets connection.";
  if (existing) {
    existing.textContent = text;
    existing.style.display = "block";
    return;
  }
  const banner = document.createElement("div");
  banner.className = "data-error-banner";
  banner.textContent = text;
  banner.style.cssText = [
    "position: sticky",
    "top: 0",
    "z-index: 9999",
    "background: #1f2937",
    "color: #fff",
    "padding: 12px 16px",
    "font-size: 14px",
    "letter-spacing: 0.2px"
  ].join(";");
  document.body.prepend(banner);
};

const normalizeActiveFlag = (value) => {
  if (value === true) return true;
  if (value === false) return false;
  const raw = String(value || "").trim();
  if (!raw) return null;
  const lowered = raw.toLowerCase();
  if (lowered === "true" || lowered === "1") return true;
  if (lowered === "false") return false;
  return null;
};

const translations = {
  en: {
    "title.index": "UnitySphere Dashboard",
    "title.centers": "Centers - UnitySphere",
    "title.specialists": "Specialists - UnitySphere",
    "title.children": "Children - UnitySphere",
    "title.vr": "VR Experience - UnitySphere",
    "title.settings": "Settings - UnitySphere",
    "title.login": "Login - UnitySphere",
    "nav.overview": "Overview",
    "nav.centers": "Centers",
    "nav.specialists": "Specialists",
    "nav.children": "Children",
    "nav.vr": "VR Experience",
    "nav.settings": "Settings",
    "nav.group.overview": "Overview",
    "nav.group.management": "Management",
    "nav.group.content": "Content",
    "nav.group.system": "System",
    "sidebar.reminderTitle": "Reminder",
    "sidebar.reminderText": "Review VR session notes and update progress insights.",
    "sidebar.logout": "Logout",
    "index.title": "Admin Overview",
    "index.subtitle": "Real-time telemetry from UnitySphere centers and VR clinics.",
    "index.metric.sessionCompletionRate": "Session Completion Rate",
    "index.metric.avgSessionDuration": "Average Session Duration",
    "index.metric.learningVelocity": "Learning Velocity",
    "index.metric.globalAccuracy": "Global Average Accuracy",
    "index.metric.sessions": "Sessions",
    "index.metric.children": "Children",
    "index.metric.specialists": "Specialists",
    "index.metric.activeChildren": "Active children",
    "index.metric.activeSpecialists": "Active specialists",
    "index.metric.vr": "VR Experiences",
    "index.metric.vrAvailable": "Available experiences",
    "index.metric.allCenters": "All centers",
    "index.metric.acrossChildSessions": "Across child sessions",
    "index.metric.accuracyDelta": "Accuracy delta",
    "index.metric.allSessions": "All sessions",
    "index.metric.chip.computed": "Computed",
    "index.metric.chip.week": "Week-over-week",
    "index.metric.chip.live": "Live",
    "index.chart.weeklySessions": "Weekly Sessions",
    "index.chart.weeklySubtitle": "Curved trend from database telemetry",
    "index.chart.pastWeek": "Past week",
    "index.chart.peakWeek": "Peak week",
    "index.chart.progressByCenter": "Progress Rate by Center",
    "index.chart.progressSubtitle": "Adaptive therapy completion",
    "index.chart.export": "Export",
    "status.awaiting": "Awaiting Sessions",
    "empty.metric.completion": "Completion rate appears after your first sessions sync.",
    "empty.metric.duration": "Average duration appears once sessions are recorded.",
    "empty.metric.velocity": "Learning velocity appears after enough sessions.",
    "empty.metric.accuracy": "Accuracy updates when sessions begin streaming.",
    "empty.metric.sessions": "Sessions will appear after your first sync.",
    "empty.metric.children": "Children metrics appear once profiles sync.",
    "empty.metric.specialists": "Specialists populate after the next directory sync.",
    "empty.chart.weekly": "Weekly sessions will plot once data arrives from centers.",
    "empty.chart.progress": "Center progress rates will populate after sessions sync.",
    "empty.chart.caption.weekly": "Awaiting telemetry to draw the weekly trend.",
    "empty.chart.caption.progress": "Awaiting linked centers to report progress.",
    "centers.title": "Centers",
    "centers.subtitle": "Customer-based filtering with center performance snapshots.",
    "centers.addCenter": "Add Center",
    "centers.directory": "Center Directory",
    "centers.filterLabel": "Centers",
    "centers.allCenters": "All centers",
    "centers.export": "Export",
    "centers.startDateLabel": "Start date",
    "centers.endDateLabel": "End date",
    "action.edit": "Edit",
    "action.delete": "Delete",
    "specialists.title": "Specialists",
    "specialists.subtitle": "Meet the care team delivering XR sessions.",
    "specialists.addSpecialist": "Add Specialist",
    "specialists.directory": "Specialist Directory",
    "specialists.sortLabel": "Sort",
    "specialists.export": "Export",
    "specialists.sort.az": "A-Z",
    "specialists.sort.za": "Z-A",
    "children.title": "Children",
    "children.subtitle": "Profiles synced from Unity with specialist form answers.",
    "children.syncedPill": "Synced from Unity",
    "children.addChild": "Add Child",
    "children.activeList": "Active List",
    "children.tab.profile": "Profile",
    "children.tab.responses": "Form Answers",
    "children.tab.sessions": "Sessions",
    "children.summary.totalSessions": "Total sessions",
    "children.summary.overallAccuracy": "Overall accuracy",
    "children.summary.avgDuration": "Avg duration",
    "children.summary.mostPracticed": "Most practiced",
    "children.summary.strongest": "Strongest operation",
    "children.summary.weakest": "Weakest operation",
    "children.summary.accuracy": "Accuracy",
    "children.summary.sessions": "Sessions",
    "children.summary.avgDuration": "Avg Duration",
    "children.summary.trend": "Trend",
    "children.summary.template": "Completed {sessions} sessions with {accuracy} overall accuracy and {duration} average duration. Focus support level is {support}. Recommended focus: {focus}.",
    "children.performanceSnapshot": "Performance Snapshot",
    "children.avgAttempts": "Avg attempts per question",
    "children.sessionCompletionRate": "Session completion rate",
    "children.primaryOperation": "Primary operation",
    "children.breakdown.title": "Operation Breakdown",
    "children.breakdown.operation": "Operation",
    "children.breakdown.sessions": "Sessions",
    "children.breakdown.accuracy": "Accuracy",
    "children.breakdown.avgTime": "Avg time/q",
    "children.breakdown.easyUsage": "Easy mode",
    "children.breakdown.add": "Add",
    "children.breakdown.subtract": "Subtract",
    "children.breakdown.multiply": "Multiply",
    "children.breakdown.divide": "Divide",
    "children.trends.title": "Progress Trends",
    "children.trends.accuracy": "Accuracy trend",
    "children.trends.duration": "Duration trend",
    "children.support.title": "Support Dependency",
    "children.autoSummary.title": "Summary",
    "children.crossInsights.title": "Cross-session insights",
    "children.crossInsights.commonWrong": "Most common wrong questions",
    "children.crossInsights.reinforceOps": "Operations needing reinforcement",
    "children.crossInsights.nextFocus": "Next session focus",
    "session.summary.operation": "Operation",
    "session.summary.duration": "Duration",
    "session.summary.accuracy": "Accuracy",
    "session.summary.easyMode": "Easy mode",
    "session.summary.quality": "Session quality",
    "session.summary.insight": "Session insight",
    "session.attempts.default": "Default questions",
    "session.attempts.easy": "Easy questions",
    "session.label.excellent": "Excellent",
    "session.label.good": "Good",
    "session.label.needsReview": "Needs review",
    "session.insight.improved": "Improved during session",
    "session.insight.consistent": "Consistent performance",
    "session.insight.fatigue": "Fatigue detected",
    "session.flag.corrected": "Corrected",
    "session.flag.repeated": "Repeated mistake",
    "session.status.correct": "Correct",
    "session.status.wrong": "Wrong",
    "generic.yes": "Yes",
    "generic.no": "No",
    "trend.improving": "improving",
    "trend.stable": "stable",
    "trend.declining": "declining",
    "support.independent": "Independent",
    "support.occasional": "Occasionally Supported",
    "support.high": "High Support",
    "settings.title": "Settings",
    "settings.subtitle": "Manage contact details and communications.",
    "settings.save": "Save Changes",
    "settings.contactDetails": "Contact Details",
    "settings.contactHint": "Editable fields with focus glow states.",
    "settings.adminName": "Admin name",
    "settings.email": "Email",
    "settings.phone": "Phone",
    "vr.title": "VR Experiences",
    "vr.subtitle": "Manage immersive therapy modules and media previews.",
    "vr.addExperience": "Add Experience",
    "vr.library": "Experience Library",
    "vr.archiveView": "Archive View",
    "vr.empty.catalogTitle": "No VR experiences created",
    "vr.empty.catalogHint": "Create a VR experience in the catalog to enable it.",
    "vr.empty.centerTitle": "No VR enabled for this center",
    "vr.empty.centerHint": "Link a VR experience to enable it for this center.",
    "vr.disable": "Disable",
    "login.title": "Sign in",
    "login.subtitle": "Use your UnitySphere credentials to continue.",
    "login.username": "Username",
    "login.password": "Password",
    "login.signIn": "Sign In",
    "modal.addCenter.title": "Add Center",
    "modal.addCenter.subtitle": "Enter center details and admin credentials.",
    "modal.editCenter.title": "Edit Center",
    "modal.close": "Close",
    "modal.centerName": "Center name",
    "modal.location": "Location",
    "modal.specialists": "Specialists",
    "modal.subscription": "Subscription plan",
    "modal.contactEmail": "Contact email",
    "modal.contactPhone": "Contact phone",
    "modal.children": "Children",
    "modal.adminUsername": "Admin username",
    "modal.adminPassword": "Admin password",
    "modal.cancel": "Cancel",
    "modal.addCenterButton": "Add Center",
    "modal.editCenterButton": "Save Center",
    "modal.addSpecialist.title": "Add Specialist",
    "modal.addSpecialist.subtitle": "Enter specialist details.",
    "modal.editSpecialist.title": "Edit Specialist",
    "modal.fullName": "Full name",
    "modal.centerOptional": "Center (optional)",
    "modal.description": "Description",
    "modal.childrenOptional": "Children (optional)",
    "modal.username": "Username",
    "modal.password": "Password",
    "modal.addSpecialistButton": "Add Specialist",
    "modal.editSpecialistButton": "Save Specialist",
    "modal.addChild.title": "Add Child",
    "modal.addChild.subtitle": "Assign a child to a specialist.",
    "modal.childIdAuto": "Child ID is assigned automatically.",
    "modal.age": "Age",
    "modal.specialist": "Specialist",
    "modal.addChildButton": "Add Child",
    "modal.addExperience.title": "Add Experience",
    "modal.addExperience.subtitle": "Enter experience details and media link.",
    "modal.editExperience.title": "Edit Experience",
    "modal.experienceName": "Experience name",
    "modal.duration": "Duration",
    "modal.durationPlaceholder": "e.g. 12 min",
    "modal.difficulty": "Difficulty",
    "modal.previewLink": "Preview link (optional)",
    "modal.previewPlaceholder": "preview/experience-id",
    "modal.coverUrl": "Cover image URL (optional)",
    "modal.coverUrlPlaceholder": "https://...",
    "modal.coverUpload": "Cover image upload (optional)",
    "modal.assignedCenters": "Assigned centers (optional)",
    "modal.addExperienceButton": "Add Experience",
    "modal.editExperienceButton": "Save Experience",
    "generic.noData": "No data",
    "generic.noResponses": "No responses available.",
    "generic.noChildSelected": "No child selected",
    "generic.noProfileData": "No profile data available.",
    "generic.noSessionData": "No session data available.",
    "generic.noChildrenYet": "No children yet",
    "generic.noCentersYet": "No centers yet",
    "generic.noSpecialistsYet": "No specialists yet",
    "generic.noExperiencesYet": "No experiences yet",
    "generic.noCentersAvailable": "No centers available.",
    "generic.addCentersHint": "Add centers to populate this list.",
    "generic.addSpecialistsHint": "Add specialists to populate this list.",
    "generic.addExperiencesHint": "Add VR experiences to populate this list.",
    "generic.unspecified": "Unspecified",
    "overview.centerSpecialists": "Center Specialists",
    "overview.centerChildren": "Center Children",
    "overview.notAvailable": "Not available for specialists",
    "overview.linkedToCenter": "Linked to your center",
    "overview.derivedFromSpecialists": "Derived from specialists",
    "overview.activeCenters": "Active centers",
    "metric.today": "Today",
    "metric.week": "This week",
    "overview.performanceSnapshot": "Performance Snapshot",
    "overview.snapshot.accuracy": "Overall accuracy",
    "overview.snapshot.duration": "Avg session duration",
    "overview.snapshot.attempts": "Avg attempts per question",
    "overview.snapshot.easyUsage": "Easy mode usage",
    "overview.vrIntelligence": "VR Intelligence",
    "overview.vrUsage": "Usage highlights",
    "overview.vr.mostUsed": "Most used VR",
    "overview.vr.leastUsed": "Least used VR",
    "overview.vr.perCenter": "VR usage per center (top 3)",
    "overview.vr.ratio": "VR vs non-VR session ratio",
    "overview.adminAlerts": "Admin Alerts / Insights",
    "overview.alerts.inactiveCenters": "Inactive centers",
    "overview.alerts.decliningPerformance": "Declining performance flags",
    "overview.alerts.unusedVr": "Unused VR content",
    "overview.trends": "Trend visualizations",
    "overview.trend.sessions": "Sessions per day",
    "overview.trend.accuracy": "Accuracy trend",
    "overview.trend.vrUsage": "VR usage trend",
    "overview.noTrendData": "No data yet",
    "overview.summaryTitle": "Platform health summary",
    "overview.summary.empty": "No session telemetry yet. Connect sessions to see platform health.",
    "overview.summary.template": "Status {status}. {sessions} sessions · {accuracy} acc · {duration} avg · Easy {easy} · VR {vrRatio}. {alerts}",
    "overview.summary.alerts.none": "No critical alerts detected.",
    "overview.summary.alerts.count": "{count} alert(s) need attention: {items}.",
    "overview.status.stable": "stable",
    "overview.status.watch": "needs attention",
    "label.children": "Children",
    "label.specialists": "Specialists",
    "label.centers": "Centers",
    "label.center": "Center",
    "label.location": "Location",
    "label.plan": "Plan",
    "label.email": "Email",
    "label.phone": "Phone",
    "label.description": "Description",
    "label.duration": "Duration",
    "label.difficulty": "Difficulty",
    "label.preview": "Preview",
    "label.vr": "VR",
    "label.vrExperiences": "VR Experiences",
    "label.accuracy": "Accuracy",
    "label.attempts": "Attempts",
    "label.easy": "Easy",
    "label.vrUsage": "VR usage",
    "label.vrHighlights": "VR highlights",
    "label.sessions": "Sessions",
    "label.alerts": "Alerts",
    "label.today": "Today",
    "label.week": "Week",
    "label.kpiTrend": "Trend",
    "label.target": "Target",
    "label.actual": "Actual",
    "label.of": "of",
    "label.vrEmpty": "VR not used yet",
    "label.qSessions": "Q1 Sessions momentum",
    "label.qAccuracy": "Q2 Accuracy stability",
    "label.qVr": "Q3 VR adoption",
    "label.legendTrend": "Trend",
    "placeholder.unnamedCenter": "Unnamed center",
    "placeholder.unnamedSpecialist": "Unnamed specialist",
    "placeholder.unnamedExperience": "Unnamed experience",
    "placeholder.noLocation": "No location",
    "placeholder.noPlan": "No plan",
    "placeholder.noEmail": "No email",
    "placeholder.noPhone": "No phone",
    "placeholder.noCenter": "No center",
    "placeholder.noDescription": "No description",
    "placeholder.noDuration": "No duration",
    "placeholder.noDifficulty": "No difficulty",
    "select.noCenterAssigned": "No center assigned",
    "select.noActiveSpecialists": "No active specialists available",
    "select.assignedSpecialist": "Assigned specialist",
    "select.noActiveSpecialistAssigned": "No active specialist assigned",
    "sessions.loaded": "Sessions loaded",
    "sessions.loading": "Loading sessions...",
    "sessions.noneForChild": "No sessions found for this child",
    "sessions.status.loaded": "Sessions loaded",
    "sessions.status.selectChild": "Select a child to load sessions",
    "sessions.countLabel": "Sessions loaded: 0",
    "sessions.empty": "No sessions available.",
    "sessions.table.started": "Started",
    "sessions.table.operation": "Operation",
    "sessions.table.duration": "Duration (s)",
    "sessions.table.correct": "Correct",
    "sessions.table.wrong": "Wrong",
    "sessions.table.completed": "Completed",
    "children.sessions.title": "Sessions",
    "session.title": "Session",
    "session.table.question": "Question",
    "session.table.kind": "Kind",
    "session.table.status": "Status",
    "session.meta.operation": "Operation",
    "session.meta.duration": "Duration",
    "session.meta.completed": "Completed",
    "session.meta.notCompleted": "Not completed",
    "loading.text": "Loading..."
  },
  ar: {
    "title.index": "لوحة UnitySphere",
    "title.centers": "المراكز - UnitySphere",
    "title.specialists": "الأخصائيون - UnitySphere",
    "title.children": "الأطفال - UnitySphere",
    "title.vr": "تجارب الواقع الافتراضي - UnitySphere",
    "title.settings": "الإعدادات - UnitySphere",
    "title.login": "تسجيل الدخول - UnitySphere",
    "nav.overview": "نظرة عامة",
    "nav.centers": "المراكز",
    "nav.specialists": "الأخصائيون",
    "nav.children": "الأطفال",
    "nav.vr": "تجارب الواقع الافتراضي",
    "nav.settings": "الإعدادات",
    "nav.group.overview": "نظرة عامة",
    "nav.group.management": "الإدارة",
    "nav.group.content": "المحتوى",
    "nav.group.system": "النظام",
    "sidebar.reminderTitle": "تذكير",
    "sidebar.reminderText": "راجع ملاحظات جلسات الواقع الافتراضي وحدّث مؤشرات التقدم.",
    "sidebar.logout": "تسجيل الخروج",
    "index.title": "نظرة المشرف",
    "index.subtitle": "قياس فوري من مراكز UnitySphere وعيادات الواقع الافتراضي.",
    "index.metric.sessionCompletionRate": "معدل إكمال الجلسات",
    "index.metric.avgSessionDuration": "متوسط مدة الجلسة",
    "index.metric.learningVelocity": "سرعة التعلم",
    "index.metric.globalAccuracy": "متوسط الدقة العالمي",
    "index.metric.sessions": "الجلسات",
    "index.metric.children": "الأطفال",
    "index.metric.specialists": "الأخصائيون",
    "index.metric.activeChildren": "الأطفال النشطون",
    "index.metric.activeSpecialists": "الأخصائيون النشطون",
    "index.metric.vr": "تجارب الواقع الافتراضي",
    "index.metric.vrAvailable": "التجارب المتاحة",
    "index.metric.allCenters": "جميع المراكز",
    "index.metric.acrossChildSessions": "عبر جلسات الأطفال",
    "index.metric.accuracyDelta": "فرق الدقة",
    "index.metric.allSessions": "كل الجلسات",
    "index.metric.chip.computed": "محسوب",
    "index.metric.chip.week": "أسبوع لأسبوع",
    "index.metric.chip.live": "مباشر",
    "index.chart.weeklySessions": "الجلسات الأسبوعية",
    "index.chart.weeklySubtitle": "منحنى من بيانات قاعدة البيانات",
    "index.chart.pastWeek": "الأسبوع الماضي",
    "index.chart.peakWeek": "أعلى أسبوع",
    "index.chart.progressByCenter": "معدل التقدم حسب المركز",
    "index.chart.progressSubtitle": "اكتمال العلاج التكيفي",
    "index.chart.export": "تصدير",
    "status.awaiting": "بانتظار الجلسات",
    "empty.metric.completion": "يظهر معدل الإكمال بعد مزامنة أولى الجلسات.",
    "empty.metric.duration": "يظهر متوسط المدة بعد تسجيل الجلسات.",
    "empty.metric.velocity": "تظهر سرعة التعلم بعد توفر جلسات كافية.",
    "empty.metric.accuracy": "تتحدث الدقة عند بدء تدفق الجلسات.",
    "empty.metric.sessions": "ستظهر الجلسات بعد أول مزامنة.",
    "empty.metric.children": "ستظهر مؤشرات الأطفال بعد مزامنة الملفات.",
    "empty.metric.specialists": "سيتم عرض الأخصائيين بعد المزامنة القادمة.",
    "empty.chart.weekly": "ستظهر الجلسات الأسبوعية بعد وصول البيانات من المراكز.",
    "empty.chart.progress": "ستظهر معدلات تقدم المراكز بعد مزامنة الجلسات.",
    "empty.chart.caption.weekly": "بانتظار القياسات لرسم الاتجاه الأسبوعي.",
    "empty.chart.caption.progress": "بانتظار المراكز المرتبطة للإبلاغ عن التقدم.",
    "centers.title": "المراكز",
    "centers.subtitle": "تصفية حسب العملاء مع لقطات أداء المراكز.",
    "centers.addCenter": "إضافة مركز",
    "centers.directory": "دليل المراكز",
    "centers.filterLabel": "المراكز",
    "centers.allCenters": "كل المراكز",
    "centers.export": "تصدير",
    "centers.startDateLabel": "تاريخ البداية",
    "centers.endDateLabel": "تاريخ الانتهاء",
    "action.edit": "تعديل",
    "action.delete": "حذف",
    "specialists.title": "الأخصائيون",
    "specialists.subtitle": "فريق الرعاية الذي يقدم جلسات XR.",
    "specialists.addSpecialist": "إضافة أخصائي",
    "specialists.directory": "دليل الأخصائيين",
    "specialists.sortLabel": "الترتيب",
    "specialists.export": "تصدير",
    "specialists.sort.az": "أ-ي",
    "specialists.sort.za": "ي-أ",
    "children.title": "الأطفال",
    "children.subtitle": "ملفات شخصية متزامنة من Unity مع إجابات الأخصائي.",
    "children.syncedPill": "متزامن من Unity",
    "children.addChild": "إضافة طفل",
    "children.activeList": "القائمة النشطة",
    "children.tab.profile": "الملف",
    "children.tab.responses": "إجابات النموذج",
    "children.tab.sessions": "الجلسات",
    "children.summary.totalSessions": "إجمالي الجلسات",
    "children.summary.overallAccuracy": "الدقة الكلية",
    "children.summary.avgDuration": "متوسط المدة",
    "children.summary.mostPracticed": "الأكثر ممارسة",
    "children.summary.strongest": "أقوى عملية",
    "children.summary.weakest": "أضعف عملية",
    "children.summary.accuracy": "الدقة",
    "children.summary.sessions": "الجلسات",
    "children.summary.avgDuration": "متوسط المدة",
    "children.summary.trend": "الاتجاه",
    "children.performanceSnapshot": "لمحة الأداء",
    "children.avgAttempts": "متوسط المحاولات لكل سؤال",
    "children.sessionCompletionRate": "معدل إكمال الجلسة",
    "children.primaryOperation": "العملية الأساسية",
    "children.breakdown.title": "تفصيل العمليات",
    "children.breakdown.operation": "العملية",
    "children.breakdown.sessions": "الجلسات",
    "children.breakdown.accuracy": "الدقة",
    "children.breakdown.avgTime": "متوسط الوقت/س",
    "children.breakdown.easyUsage": "الوضع السهل",
    "children.breakdown.add": "جمع",
    "children.breakdown.subtract": "طرح",
    "children.breakdown.multiply": "ضرب",
    "children.breakdown.divide": "قسمة",
    "children.trends.title": "اتجاهات التقدم",
    "children.trends.accuracy": "اتجاه الدقة",
    "children.trends.duration": "اتجاه المدة",
    "children.support.title": "درجة الاعتماد",
    "children.autoSummary.title": "الملخص",
    "children.crossInsights.title": "رؤى عبر الجلسات",
    "children.crossInsights.commonWrong": "أكثر الأسئلة الخاطئة",
    "children.crossInsights.reinforceOps": "عمليات تحتاج تعزيز",
    "children.crossInsights.nextFocus": "تركيز الجلسة القادمة",
    "session.summary.operation": "العملية",
    "session.summary.duration": "المدة",
    "session.summary.accuracy": "الدقة",
    "session.summary.easyMode": "الوضع السهل",
    "session.summary.quality": "جودة الجلسة",
    "session.summary.insight": "مؤشر الجلسة",
    "session.attempts.default": "أسئلة الوضع الافتراضي",
    "session.attempts.easy": "أسئلة الوضع السهل",
    "session.label.excellent": "ممتاز",
    "session.label.good": "جيد",
    "session.label.needsReview": "يحتاج مراجعة",
    "session.insight.improved": "تحسن أثناء الجلسة",
    "session.insight.consistent": "أداء ثابت",
    "session.insight.fatigue": "مؤشرات إجهاد",
    "session.flag.corrected": "تم التصحيح",
    "session.flag.repeated": "خطأ متكرر",
    "session.status.correct": "صحيح",
    "session.status.wrong": "خطأ",
    "generic.yes": "نعم",
    "generic.no": "لا",
    "trend.improving": "تحسن",
    "trend.stable": "ثابت",
    "trend.declining": "تراجع",
    "support.independent": "مستقل",
    "support.occasional": "بدعم متقطع",
    "support.high": "بدعم عالٍ",
    "settings.title": "الإعدادات",
    "settings.subtitle": "إدارة تفاصيل التواصل والرسائل.",
    "settings.save": "حفظ التغييرات",
    "settings.contactDetails": "تفاصيل التواصل",
    "settings.contactHint": "حقول قابلة للتحرير مع إضاءة عند التركيز.",
    "settings.adminName": "اسم المسؤول",
    "settings.email": "البريد الإلكتروني",
    "settings.phone": "الهاتف",
    "vr.title": "تجارب الواقع الافتراضي",
    "vr.subtitle": "إدارة وحدات العلاج الغامرة ومعاينات الوسائط.",
    "vr.addExperience": "إضافة تجربة",
    "vr.library": "مكتبة التجارب",
    "vr.archiveView": "عرض الأرشيف",
    "vr.empty.catalogTitle": "لا توجد تجارب واقع افتراضي",
    "vr.empty.catalogHint": "أنشئ تجربة واقع افتراضي في الكتالوج لتفعيلها.",
    "vr.empty.centerTitle": "لا توجد تجارب مفعلة لهذا المركز",
    "vr.empty.centerHint": "اربط تجربة واقع افتراضي لتفعيلها لهذا المركز.",
    "vr.disable": "تعطيل",
    "login.title": "تسجيل الدخول",
    "login.subtitle": "استخدم بيانات UnitySphere للمتابعة.",
    "login.username": "اسم المستخدم",
    "login.password": "كلمة المرور",
    "login.signIn": "تسجيل الدخول",
    "modal.addCenter.title": "إضافة مركز",
    "modal.addCenter.subtitle": "أدخل تفاصيل المركز وبيانات المسؤول.",
    "modal.editCenter.title": "تعديل المركز",
    "modal.close": "إغلاق",
    "modal.centerName": "اسم المركز",
    "modal.location": "الموقع",
    "modal.specialists": "الأخصائيون",
    "modal.subscription": "خطة الاشتراك",
    "modal.contactEmail": "البريد الإلكتروني",
    "modal.contactPhone": "هاتف التواصل",
    "modal.children": "الأطفال",
    "modal.adminUsername": "اسم المستخدم للمسؤول",
    "modal.adminPassword": "كلمة مرور المسؤول",
    "modal.cancel": "إلغاء",
    "modal.addCenterButton": "إضافة مركز",
    "modal.editCenterButton": "حفظ المركز",
    "modal.addSpecialist.title": "إضافة أخصائي",
    "modal.addSpecialist.subtitle": "أدخل تفاصيل الأخصائي.",
    "modal.editSpecialist.title": "تعديل الأخصائي",
    "modal.fullName": "الاسم الكامل",
    "modal.centerOptional": "المركز (اختياري)",
    "modal.description": "الوصف",
    "modal.childrenOptional": "الأطفال (اختياري)",
    "modal.username": "اسم المستخدم",
    "modal.password": "كلمة المرور",
    "modal.addSpecialistButton": "إضافة أخصائي",
    "modal.editSpecialistButton": "حفظ الأخصائي",
    "modal.addChild.title": "إضافة طفل",
    "modal.addChild.subtitle": "اربط طفلاً بأخصائي.",
    "modal.childIdAuto": "يتم تعيين معرّف الطفل تلقائيًا.",
    "modal.age": "العمر",
    "modal.specialist": "الأخصائي",
    "modal.addChildButton": "إضافة طفل",
    "modal.addExperience.title": "إضافة تجربة",
    "modal.addExperience.subtitle": "أدخل تفاصيل التجربة ورابط الوسائط.",
    "modal.editExperience.title": "تعديل التجربة",
    "modal.experienceName": "اسم التجربة",
    "modal.duration": "المدة",
    "modal.durationPlaceholder": "مثال: 12 دقيقة",
    "modal.difficulty": "الصعوبة",
    "modal.previewLink": "رابط المعاينة (اختياري)",
    "modal.previewPlaceholder": "preview/experience-id",
    "modal.coverUrl": "رابط صورة الغلاف (اختياري)",
    "modal.coverUrlPlaceholder": "https://...",
    "modal.coverUpload": "رفع صورة الغلاف (اختياري)",
    "modal.assignedCenters": "المراكز المعينة (اختياري)",
    "modal.addExperienceButton": "إضافة تجربة",
    "modal.editExperienceButton": "حفظ التجربة",
    "generic.noData": "لا توجد بيانات",
    "generic.noResponses": "لا توجد إجابات متاحة.",
    "generic.noChildSelected": "لم يتم اختيار طفل",
    "generic.noProfileData": "لا توجد بيانات للملف الشخصي.",
    "generic.noSessionData": "لا توجد بيانات للجلسات.",
    "generic.noChildrenYet": "لا يوجد أطفال بعد",
    "generic.noCentersYet": "لا توجد مراكز بعد",
    "generic.noSpecialistsYet": "لا يوجد أخصائيون بعد",
    "generic.noExperiencesYet": "لا توجد تجارب بعد",
    "generic.noCentersAvailable": "لا توجد مراكز متاحة.",
    "generic.addCentersHint": "أضف مراكز لملء هذه القائمة.",
    "generic.addSpecialistsHint": "أضف أخصائيين لملء هذه القائمة.",
    "generic.addExperiencesHint": "أضف تجارب واقع افتراضي لملء هذه القائمة.",
    "generic.unspecified": "غير محدد",
    "overview.centerSpecialists": "أخصائيو المركز",
    "overview.centerChildren": "أطفال المركز",
    "overview.notAvailable": "غير متاح للأخصائيين",
    "overview.linkedToCenter": "مرتبط بمركزك",
    "overview.derivedFromSpecialists": "مستمد من الأخصائيين",
    "overview.activeCenters": "المراكز النشطة",
    "metric.today": "اليوم",
    "metric.week": "هذا الأسبوع",
    "overview.performanceSnapshot": "لمحة الأداء",
    "overview.snapshot.accuracy": "الدقة الإجمالية",
    "overview.snapshot.duration": "متوسط مدة الجلسة",
    "overview.snapshot.attempts": "متوسط المحاولات لكل سؤال",
    "overview.snapshot.easyUsage": "استخدام الوضع السهل",
    "overview.vrIntelligence": "ذكاء الواقع الافتراضي",
    "overview.vrUsage": "أبرز الاستخدام",
    "overview.vr.mostUsed": "أكثر تجربة استخدامًا",
    "overview.vr.leastUsed": "أقل تجربة استخدامًا",
    "overview.vr.perCenter": "استخدام الواقع الافتراضي لكل مركز (أفضل 3)",
    "overview.vr.ratio": "نسبة جلسات الواقع الافتراضي مقابل العادية",
    "overview.adminAlerts": "تنبيهات ورؤى الإدارة",
    "overview.alerts.inactiveCenters": "مراكز غير نشطة",
    "overview.alerts.decliningPerformance": "مؤشرات تراجع الأداء",
    "overview.alerts.unusedVr": "محتوى واقع افتراضي غير مستخدم",
    "overview.trends": "تصورات الاتجاهات",
    "overview.trend.sessions": "الجلسات يوميًا",
    "overview.trend.accuracy": "اتجاه الدقة",
    "overview.trend.vrUsage": "اتجاه استخدام الواقع الافتراضي",
    "overview.noTrendData": "لا توجد بيانات بعد",
    "overview.summaryTitle": "ملخص صحة المنصة",
    "overview.summary.empty": "لا توجد جلسات بعد. اربط الجلسات لعرض صحة المنصة.",
    "overview.summary.template": "الحالة {status}. {sessions} جلسة · دقة {accuracy} · مدة {duration} · سهل {easy} · واقع افتراضي {vrRatio}. {alerts}",
    "overview.summary.alerts.none": "لا توجد تنبيهات حرجة.",
    "overview.summary.alerts.count": "هناك {count} تنبيه(ات) تحتاج الانتباه: {items}.",
    "overview.status.stable": "مستقرة",
    "overview.status.watch": "بحاجة لمتابعة",
    "label.children": "الأطفال",
    "label.specialists": "الأخصائيون",
    "label.centers": "المراكز",
    "label.center": "??????",
    "label.location": "??????",
    "label.plan": "?????",
    "label.email": "?????? ??????????",
    "label.phone": "??????",
    "label.description": "?????",
    "label.duration": "?????",
    "label.difficulty": "???????",
    "label.preview": "??????",
    "label.vr": "واقع افتراضي",
    "label.vrExperiences": "تجارب الواقع الافتراضي",
    "label.accuracy": "الدقة",
    "label.duration": "المدة",
    "label.attempts": "المحاولات",
    "label.easy": "سهل",
    "label.vrUsage": "استخدام الواقع الافتراضي",
    "label.vrHighlights": "أبرز الواقع الافتراضي",
    "label.sessions": "الجلسات",
    "label.alerts": "تنبيهات",
    "label.today": "اليوم",
    "label.week": "الأسبوع",
    "label.kpiTrend": "الاتجاه",
    "label.target": "الهدف",
    "label.actual": "الفعلي",
    "label.of": "من",
    "label.vrEmpty": "لم يتم استخدام الواقع الافتراضي بعد",
    "label.qSessions": "س1 زخم الجلسات",
    "label.qAccuracy": "س2 ثبات الدقة",
    "label.qVr": "س3 تبني الواقع الافتراضي",
    "label.legendTrend": "الاتجاه",
    "placeholder.unnamedCenter": "???? ???? ???",
    "placeholder.unnamedSpecialist": "?????? ???? ???",
    "placeholder.unnamedExperience": "????? ???? ???",
    "placeholder.noLocation": "???? ????",
    "placeholder.noPlan": "???? ???",
    "placeholder.noEmail": "???? ????",
    "placeholder.noPhone": "???? ????",
    "placeholder.noCenter": "???? ????",
    "placeholder.noDescription": "???? ???",
    "placeholder.noDuration": "???? ???",
    "placeholder.noDifficulty": "???? ?????",
    "select.noCenterAssigned": "?? ???? ???? ?????",
    "select.noActiveSpecialists": "?? ???? ???????? ?????",
    "select.assignedSpecialist": "???????? ???????",
    "select.noActiveSpecialistAssigned": "?? ???? ?????? ??? ?????",
    "sessions.loaded": "?? ????? ???????",
    "sessions.loading": "???? ????? ???????...",
    "sessions.noneForChild": "?? ???? ????? ???? ?????",
    "sessions.status.loaded": "?? ????? ???????",
    "sessions.status.selectChild": "???? ????? ?????? ???????",
    "sessions.countLabel": "??? ??????? ????????: 0",
    "sessions.empty": "?? ???? ????? ?????.",
    "sessions.table.started": "???????",
    "sessions.table.operation": "???????",
    "sessions.table.duration": "????? (?)",
    "sessions.table.correct": "????",
    "sessions.table.wrong": "???",
    "sessions.table.completed": "??????",
    "children.sessions.title": "???????",
    "session.title": "????",
    "session.table.question": "??????",
    "session.table.kind": "?????",
    "session.table.status": "??????",
    "session.meta.operation": "???????",
    "session.meta.duration": "?????",
    "session.meta.completed": "??????",
    "session.meta.notCompleted": "??? ??????",
    "children.summary.template": "??? {sessions} ???? ???? ??????? {accuracy} ?????? ??? {duration}. ????? ????? ??????: {support}. ??????? ???????: {focus}.",
    "loading.text": "جار التحميل..."
  }
};

const getStoredLanguage = () => {
  if (typeof window === "undefined") return DEFAULT_LANG;
  const stored = localStorage.getItem(LANG_STORAGE_KEY);
  return translations[stored] ? stored : DEFAULT_LANG;
};

const setCurrentLanguage = (lang) => {
  currentLanguage = translations[lang] ? lang : DEFAULT_LANG;
};

const getTranslation = (key, fallback) => {
  const table = translations[currentLanguage] || {};
  return table[key] || fallback || key;
};
const getField = (obj, candidates = []) => {
  if (!obj) return "";
  const map = Object.keys(obj).reduce((acc, key) => {
    acc[normalizeKey(key)] = obj[key];
    return acc;
  }, {});
  for (const candidate of candidates) {
    const key = normalizeKey(candidate);
    if (Object.prototype.hasOwnProperty.call(map, key)) {
      const value = map[key];
      if (value === 0 || value === false) return String(value);
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        return String(value).trim();
      }
    }
  }
  return "";
};

const formatDateOnly = (value) => {
  if (value == null || value === "") return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().split("T")[0];
  }
  if (typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().split("T")[0];
  }
  const raw = String(value).trim();
  if (!raw) return "";
  if (raw.includes("T")) return raw.split("T")[0];
  if (raw.includes(" ")) return raw.split(" ")[0];
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? raw : parsed.toISOString().split("T")[0];
};

const loadingState = {
  count: 0,
  overlay: null,
  label: null
};

const ensureLoadingOverlay = () => {
  if (loadingState.overlay) return loadingState.overlay;
  const overlay = document.createElement("div");
  overlay.className = "loading-overlay";
  overlay.setAttribute("aria-hidden", "true");
  overlay.innerHTML = `
    <div class="loading-card" role="status" aria-live="polite">
      <div class="loading-spinner"></div>
      <div class="loading-text">${getTranslation("loading.text", "Loading...")}</div>
    </div>
  `;
  document.body.appendChild(overlay);
  loadingState.overlay = overlay;
  loadingState.label = overlay.querySelector(".loading-text");
  return overlay;
};

const startLoading = (message) => {
  if (typeof document === "undefined") return;
  ensureLoadingOverlay();
  loadingState.count += 1;
  if (loadingState.label && message) loadingState.label.textContent = message;
  if (loadingState.overlay) loadingState.overlay.classList.add("is-visible");
};

const stopLoading = () => {
  if (typeof document === "undefined") return;
  loadingState.count = Math.max(loadingState.count - 1, 0);
  if (loadingState.count === 0 && loadingState.overlay) {
    loadingState.overlay.classList.remove("is-visible");
  }
};

const getCurrentUser = () => {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

const setCurrentUser = (user) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
};


const isArabicPath = () => {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname || "";
  return path.includes("/arabic/");
};

const getLoginPagePath = () => {
  if (typeof window === "undefined") return LOGIN_PAGE;
  return isArabicPath() ? "/arabic/login.html" : "/login.html";
};

const isLoginPage = () => {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname || "";
  return path.endsWith(`/${LOGIN_PAGE}`) || path.endsWith(LOGIN_PAGE) || path.endsWith("/arabic/login.html");
};

const enforceAuth = () => {
  if (isLoginPage()) return;
  if (!getCurrentUser()) {
    window.location.href = getLoginPagePath();
  }
};

const apiPost = (payload = {}, message = getTranslation("loading.text", "Loading...")) => {
  const normalizedRoute = payload?.route ? String(payload.route).trim().toLowerCase() : "";
  if (normalizedRoute && !ALLOWED_ROUTES.has(normalizedRoute)) {
    return Promise.resolve({
      ok: false,
      json: async () => ({ error: "Route not allowed." })
    });
  }
  if (!isApiUrlConfigured()) {
    showDataError("API URL is not configured. Set API_URL to your Apps Script Web App.");
    return Promise.resolve({
      ok: false,
      json: async () => ({ error: "API URL not configured." })
    });
  }
  const params = new URLSearchParams();
  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (key === "route") {
      params.set(key, normalizedRoute);
      return;
    }
    params.set(key, String(value));
  });
  startLoading(message);
  return fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    mode: "cors",
    redirect: "follow",
    body: params.toString()
  })
    .catch((err) => {
      showDataError("Unable to reach Google Sheets. Check your network or Apps Script URL.");
      throw err;
    })
    .finally(stopLoading);
};

const getAuthPayload = () => {
  const user = getCurrentUser() || {};
  return {
    role: String(user.role || "").trim().toLowerCase(),
    centerId: String(user.centerId || "").trim(),
    specialistId: String(user.specialistId || "").trim()
  };
};

const fetchRoute = async (route, payload = {}) => {
  const normalizedRoute = String(route || "").trim().toLowerCase();
  const response = await apiPost({ route: normalizedRoute, ...getAuthPayload(), ...payload });
  const data = await response.json();
  if (!response.ok || data?.error || data?.success === false) {
    showDataError("Google Sheets is unavailable or returned an error.");
    throw new Error(`Failed to load ${normalizedRoute}`);
  }
  if (Array.isArray(data)) {
    return data;
  }
  if (data && data.success === true && Array.isArray(data.data)) {
    return data.data;
  }
  showDataError("Unexpected response from Google Sheets.");
  throw new Error(`Invalid data for ${normalizedRoute}`);
};

const postRoute = async (route, payload = {}) => {
  const normalizedRoute = String(route || "").trim().toLowerCase();
  const response = await apiPost({ route: normalizedRoute, ...getAuthPayload(), ...payload });
  const data = await response.json();
  if (!response.ok || data?.error || data?.success === false) {
    showDataError(data?.error || "Google Sheets is unavailable or returned an error.");
    throw new Error(`Failed to post ${normalizedRoute}`);
  }
  return data;
};

const dataCache = {
  centers: null,
  specialists: null,
  children: null,
  vr: null
};

const dataCachePromises = {};

const invalidateCache = (...keys) => {
  keys.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(dataCache, key)) {
      dataCache[key] = null;
    }
  });
};

const getCachedRoute = async (key, route) => {
  if (Array.isArray(dataCache[key])) return dataCache[key];
  if (dataCachePromises[key]) return dataCachePromises[key];
  dataCachePromises[key] = fetchRoute(route)
    .then((items) => {
      dataCache[key] = items;
      return items;
    })
    .finally(() => {
      delete dataCachePromises[key];
    });
  return dataCachePromises[key];
};

const getUserContext = () => {
  const user = getCurrentUser() || {};
  const role = String(user.role || "").trim().toLowerCase();
  const centerId = String(user.centerId || "").trim();
  const specialistId = String(user.specialistId || "").trim();
  const linkedId =
    String(user.linkedId || "").trim() ||
    (role === "center_admin" ? centerId : role === "specialist" ? specialistId : "");
  return {
    role,
    linkedId
  };
};

const getLinkedCenterId = () => {
  const user = getCurrentUser() || {};
  const role = String(user.role || "").trim().toLowerCase();
  if (role === "center_admin" || role === "admin") {
    return String(user.centerId || user.linkedId || "").trim();
  }
  if (role === "specialist") {
    return String(user.centerId || "").trim();
  }
  return "";
};

const isCenterAdminRole = (role) => role === "center_admin" || role === "admin";
const canManageChildren = (role) => isCenterAdminRole(role) || role === "specialist";

const getCenterIdFromName = (centers, centerName) => {
  if (!Array.isArray(centers)) return "";
  const name = String(centerName || "").trim();
  if (!name) return "";
  const match = centers.find(
    (center) => normalizeKey(getField(center, ["name"])) === normalizeKey(name)
  );
  return getField(match, ["id"]);
};

const getCenterNameFromId = (centers, centerId) => {
  if (!Array.isArray(centers)) return "";
  const id = String(centerId || "").trim();
  if (!id) return "";
  const match = centers.find(
    (center) => normalizeKey(getField(center, ["id"])) === normalizeKey(id)
  );
  return getField(match, ["name"]);
};



const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("File read failed"));
    reader.readAsDataURL(file);
  });

let refreshCenters = null;
let refreshSpecialists = null;
let refreshChildren = null;
let updateOverviewCounts = null;

let selectedChildId = null;
let sessionsCache = [];

const initLogin = () => {
  const form = getById("login-form");
  if (!form) return;

  if (getCurrentUser()) {
    window.location.href = "index.html";
    return;
  }

  const errorEl = getById("login-error");
  const setError = (message) => {
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.style.visibility = message ? "visible" : "hidden";
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const username = String(data.get("username") || "").trim();
    const password = String(data.get("password") || "").trim();

    if (!username || !password) {
      setError("Enter your username and password.");
      return;
    }

    setError("");
    try {
      const response = await apiPost({ route: "login", username, password }, "Signing in...");
      if (!response.ok) {
        setError("Login failed. Please try again.");
        return;
      }
      const payload = await response.json();
      if (payload?.error) {
        setError("Invalid login. Please try again.");
        return;
      }

      const resolvedUser = payload?.user || payload;
      if (!resolvedUser) {
        setError("Login failed. Please try again.");
        return;
      }

      const role = String(resolvedUser.role || "").trim().toLowerCase();
      const centerId = String(resolvedUser.centerId || "").trim();
      const specialistId = String(resolvedUser.specialistId || "").trim();
      const linkedId =
        role === "center_admin"
          ? centerId
          : role === "specialist"
            ? specialistId
            : "";
      setCurrentUser({
        ...resolvedUser,
        role,
        centerId,
        specialistId,
        linkedId
      });
      window.location.href = "index.html";
    } catch (err) {
      console.error("Login failed.", err);
      setError("Login failed. Please try again.");
    } finally {
      stopLoading();
    }
  });
};

const setText = (id, value) => {
  const el = getById(id);
  if (el) el.textContent = value;
};

const setMetricEmpty = (id) => {
  const el = getById(id);
  if (!el) return;
  el.textContent = "";
  el.classList.add("is-empty");
  el.dataset.prevValue = "0";
  const card = el.closest(".metric-card");
  if (card) card.classList.add("is-empty");
  if (id === "metric-accuracy") {
    const wrap = document.querySelector(".donut-wrap");
    if (wrap) wrap.classList.add("is-empty");
  }
};

const setMetricValue = (id, value) => {
  const el = getById(id);
  if (!el) return;
  const numeric = Number(value);
  const canAnimate = Number.isFinite(numeric) && numeric >= 0;
  if (canAnimate) {
    const prev = Number(el.dataset.prevValue || "0");
    const start = Number.isFinite(prev) ? prev : 0;
    const end = numeric;
    const duration = 700;
    const startTime = performance.now();
    const tick = (now) => {
      const elapsed = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - elapsed, 3);
      const current = Math.round(start + (end - start) * eased);
      el.textContent = String(current);
      if (elapsed < 1) {
        requestAnimationFrame(tick);
      } else {
        el.dataset.prevValue = String(end);
      }
    };
    requestAnimationFrame(tick);
  } else {
    el.textContent = value;
  }
  el.classList.remove("is-empty");
  const card = el.closest(".metric-card");
  if (card) card.classList.remove("is-empty");
  if (id === "metric-accuracy") {
    const wrap = document.querySelector(".donut-wrap");
    if (wrap) wrap.classList.remove("is-empty");
  }
};

const setPlaceholderMetrics = () => {
  setMetricEmpty("metric-children");
  setMetricEmpty("metric-specialists");
  setMetricEmpty("metric-centers");
  setMetricEmpty("metric-vr");
};

const renderEmptyListItem = (listEl, message) => {
  if (!listEl) return;
  listEl.innerHTML = "";
  const item = document.createElement("li");
  item.className = "child-item";
  item.innerHTML = `
    <div class="avatar">?</div>
    <div>
      <div class="child-name">${message}</div>
      <div class="muted">${getTranslation("generic.noData", "No data")}</div>
    </div>
  `;
  listEl.appendChild(item);
};

const renderEmptyGridCard = (gridEl, className, title, bodyLines) => {
  if (!gridEl) return;
  gridEl.innerHTML = "";
  const lines = Array.isArray(bodyLines) ? bodyLines : [];
  const card = document.createElement("div");
  card.className = `card ${className}`;
  card.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <rect x="3" y="5" width="18" height="14" rx="3"></rect>
          <path d="M7 9h10"></path>
          <path d="M7 13h6"></path>
        </svg>
      </div>
      <div class="empty-state-title">${title}</div>
      ${lines.map((line) => `<div class="empty-state-hint">${line}</div>`).join("")}
    </div>
  `;
  gridEl.appendChild(card);
};

const setChildEmptyState = (isEmpty) => {
  const targets = ["child-summary-row", "child-snapshot", "child-progress"];
  targets.forEach((id) => {
    const el = getById(id);
    if (el) el.classList.toggle("is-hidden", isEmpty);
  });
};

const renderEmptyChildProfile = () => {
  setChildEmptyState(true);
  setText("child-name", getTranslation("generic.noChildSelected", "No child selected"));
  setText("child-id", "");
  setText("child-status", "");
  const status = getById("child-status");
  if (status) status.dataset.status = "";
  setText("child-meta", getTranslation("generic.noProfileData", "No profile data available."));
  setText("child-accuracy", "");
  setText("child-trend", "");
  setText("child-attempts", "");
  setText("child-operation", "");
  setText("child-progress", "");
  setText("child-total-sessions", "0");
  setText("child-overall-accuracy", "-");
  setText("child-avg-duration", "-");
  setText("child-most-practiced", "-");
  setText("child-strongest", "-");
  setText("child-weakest", "-");
  ["add", "subtract", "multiply", "divide"].forEach((op) => {
    setText(`op-${op}-sessions`, "0");
    setText(`op-${op}-accuracy`, "-");
    setText(`op-${op}-avgtime`, "-");
    setText(`op-${op}-easy`, "-");
  });
  setText("child-accuracy-trend", "-");
  setText("child-duration-trend", "-");
  setText("child-support-level", "-");
  setText("child-auto-summary", "");
  setText("child-common-wrong", "-");
  setText("child-reinforce-ops", "-");
  setText("child-next-focus", "-");

  const responses = getById("child-responses");
  if (responses) {
    responses.innerHTML = `<div class="muted">${getTranslation(
      "generic.noResponses",
      "No responses available."
    )}</div>`;
  }
};

const initTabs = () => {
  const tabs = document.querySelectorAll(".tab");
  const panels = document.querySelectorAll(".tab-content");
  if (!tabs.length) return;
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((item) => item.classList.remove("active"));
      panels.forEach((panel) => panel.classList.remove("active"));
      tab.classList.add("active");
      const target = tab.dataset.tab;
      const panel = document.querySelector(`[data-tab-panel="${target}"]`);
      if (panel) panel.classList.add("active");
    });
  });
};

const initModal = ({ buttonText, triggerSelector, modalId, formId }) => {
  const trigger = triggerSelector
    ? document.querySelector(triggerSelector)
    : Array.from(document.querySelectorAll(".btn.primary")).find(
        (button) => button.textContent.trim() === buttonText
      );
  const modal = getById(modalId);
  const form = formId ? getById(formId) : null;
  if (!trigger || !modal) return;

  const open = () => {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    const firstField = modal.querySelector("input, select, textarea, button");
    if (firstField) firstField.focus();
  };

  const close = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    if (form) form.reset();
  };

  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    open();
  });

  modal.querySelectorAll("[data-modal-close]").forEach((el) => {
    el.addEventListener("click", close);
  });

  modal.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });

  // Do not auto-close on submit; handled manually after success
};

const closeModalById = (modalId, formId) => {
  const modal = getById(modalId);
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  if (formId) {
    const form = getById(formId);
    if (form) form.reset();
  }
};

const openModalById = (modalId) => {
  const modal = getById(modalId);
  if (!modal) return;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
};

const setFormMode = (form, options) => {
  if (!form) return;
  const { mode, titleId, addTitleKey, editTitleKey, submitKey, submitEditKey } = options;
  const isEdit = mode === "edit";
  form.dataset.mode = mode;
  const title = getById(titleId);
  if (title) {
    const titleKey = isEdit ? editTitleKey : addTitleKey;
    if (titleKey) title.textContent = getTranslation(titleKey, title.textContent);
  }
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) {
    const buttonKey = isEdit ? submitEditKey : submitKey;
    if (buttonKey) submitButton.textContent = getTranslation(buttonKey, submitButton.textContent);
  }
  const username = form.querySelector('input[name="username"]');
  const password = form.querySelector('input[name="password"]');
  if (username) username.required = !isEdit;
  if (password) password.required = !isEdit;
  if (!isEdit) {
    const idInput = form.querySelector('input[name="id"]');
    if (idInput) idInput.value = "";
  }
};

const setFormField = (form, name, value) => {
  if (!form) return;
  const input = form.querySelector(`[name="${name}"]`);
  if (!input) return;
  input.value = value == null ? "" : String(value);
};

const initAddCenterForm = () => {
  const form = getById("add-center-form");
  if (!form) return;
  const modal = getById("add-center-modal");

  const resetMode = () => {
    setFormMode(form, {
      mode: "add",
      titleId: "add-center-title",
      addTitleKey: "modal.addCenter.title",
      editTitleKey: "modal.editCenter.title",
      submitKey: "modal.addCenterButton",
      submitEditKey: "modal.editCenterButton"
    });
    form.dataset.accountId = "";
  };

  resetMode();

  if (modal) {
    modal.querySelectorAll("[data-modal-close]").forEach((button) => {
      button.addEventListener("click", resetMode);
    });
    modal.addEventListener("keydown", (event) => {
      if (event.key === "Escape") resetMode();
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    alert(READ_ONLY_MESSAGE);
  });
};

const initAddSpecialistForm = () => {
  const form = getById("add-specialist-form");
  if (!form) return;
  const { role, linkedId } = getUserContext();
  const modal = getById("add-specialist-modal");

  const resetMode = () => {
    setFormMode(form, {
      mode: "add",
      titleId: "add-specialist-title",
      addTitleKey: "modal.addSpecialist.title",
      editTitleKey: "modal.editSpecialist.title",
      submitKey: "modal.addSpecialistButton",
      submitEditKey: "modal.editSpecialistButton"
    });
    form.dataset.accountId = "";
  };

  resetMode();

  if (modal) {
    modal.querySelectorAll("[data-modal-close]").forEach((button) => {
      button.addEventListener("click", resetMode);
    });
    modal.addEventListener("keydown", (event) => {
      if (event.key === "Escape") resetMode();
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    alert(READ_ONLY_MESSAGE);
  });
};

const initSpecialistCenterDropdown = () => {
  const select = getById("specialist-center");
  if (!select) return;
  const { role, linkedId } = getUserContext();

  const renderOptions = (centers = [], forcedCenter = "") => {
    const options = [];
    const noCenterAssignedLabel = getTranslation("select.noCenterAssigned", "No center assigned");
    if (role === "center_admin" && forcedCenter) {
      options.push(`<option value="${forcedCenter}">${forcedCenter}</option>`);
    } else {
      options.push(`<option value="">${noCenterAssignedLabel}</option>`);
      centers.forEach((center) => {
        const name = getField(center, ["name"]);
        if (!name) return;
        options.push(`<option value="${name}">${name}</option>`);
      });
    }
    select.innerHTML = options.join("");
    if (forcedCenter) select.value = forcedCenter;
  };

  const loadCenters = async () => {
    try {
      const centers = await fetchRoute("centers");
      dataCache.centers = centers;
      let forcedCenter = "";
      if (role === "center_admin" && linkedId) {
        const match = centers.find(
          (center) => normalizeKey(getField(center, ["id"])) === normalizeKey(linkedId)
        );
        forcedCenter = getField(match, ["name"]);
      }
      renderOptions(centers, forcedCenter);
    } catch (err) {
      console.error("Load centers for specialists failed.", err);
      renderOptions([]);
    }
  };

  renderOptions([]);
  loadCenters();
};

const initChildSpecialistSelect = () => {
  const select = getById("child-specialist-select");
  if (!select) return;
  const { role, linkedId } = getUserContext();
  const isActiveForDropdown = (value) => normalizeActiveFlag(value) === true;
  const renderOptions = (specialists = [], forcedId = "") => {
    const noActiveSpecialistsLabel = getTranslation("select.noActiveSpecialists", "No active specialists available");
    const assignedSpecialistLabel = getTranslation("select.assignedSpecialist", "Assigned specialist");
    const noActiveSpecialistAssignedLabel = getTranslation("select.noActiveSpecialistAssigned", "No active specialist assigned");
    if (!Array.isArray(specialists) || specialists.length === 0) {
      select.innerHTML = `<option value="">${noActiveSpecialistsLabel}</option>`;
      select.disabled = true;
      return;
    }
    const options = [];
    if (role === "specialist" && forcedId) {
      const match = specialists.find(
        (item) => normalizeKey(getField(item, ["id"])) === normalizeKey(forcedId)
      );
      if (match) {
        const name = getField(match, ["name"]);
        const centerId = getField(match, ["centerId", "centerID"]);
        const centerName = getField(match, ["center"]);
        options.push(
          `<option value="${forcedId}" data-center-id="${centerId || ""}" data-center-name="${centerName || ""}">${name || assignedSpecialistLabel}</option>`
        );
        select.disabled = false;
        select.innerHTML = options.join("");
        select.value = forcedId;
        select.disabled = true;
        return;
      }
      options.push(`<option value="">${noActiveSpecialistAssignedLabel}</option>`);
      select.innerHTML = options.join("");
      select.value = "";
      select.disabled = true;
      return;
    }

    specialists.forEach((specialist) => {
      const id = getField(specialist, ["id"]);
      const name = getField(specialist, ["name"]);
      const centerId = getField(specialist, ["centerId", "centerID"]);
      const centerName = getField(specialist, ["center"]);
      if (!id || !name) return;
      options.push(
        `<option value="${id}" data-center-id="${centerId || ""}" data-center-name="${centerName || ""}">${name}</option>`
      );
    });
    select.disabled = false;
    select.innerHTML = options.join("");
    if (select.options.length > 0) {
      select.selectedIndex = 0;
    }
  };

  const loadSpecialists = async () => {
    try {
      let specialists = await fetchRoute("specialists");
      dataCache.specialists = specialists;
      let filtered = specialists.filter(
        (specialist) => normalizeActiveFlag(getField(specialist, ["active"])) === true
      );
      if (role === "center_admin" && linkedId) {
        const centers = await getCachedRoute("centers", "centers");
        filtered = filtered.filter((specialist) => {
          const specialistCenterId = getField(specialist, ["centerId", "centerID"]);
          if (specialistCenterId) {
            return String(specialistCenterId || "").trim() === String(linkedId || "").trim();
          }
          const resolvedId = getCenterIdFromName(centers, getField(specialist, ["center"]));
          return resolvedId && normalizeKey(resolvedId) === normalizeKey(linkedId);
        });
      }
      renderOptions(filtered, role === "specialist" ? linkedId : "");
    } catch (err) {
      console.error("Load specialists for children failed.", err);
      renderOptions([], role === "specialist" ? linkedId : "");
    }
  };

  renderOptions([]);
  loadSpecialists();
};

const initAddChildForm = () => {
  const form = getById("add-child-form");
  if (!form) return;
  const { role, linkedId } = getUserContext();
  const isNumericId = (value) => /^[0-9]+$/.test(String(value || "").trim());

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    alert(READ_ONLY_MESSAGE);
  });
};

let refreshVr = null;

const initAddExperienceForm = () => {
  const form = getById("add-experience-form");
  if (!form) return;
  const modal = getById("add-experience-modal");

  const resetMode = () =>
    setFormMode(form, {
      mode: "add",
      titleId: "add-experience-title",
      addTitleKey: "modal.addExperience.title",
      editTitleKey: "modal.editExperience.title",
      submitKey: "modal.addExperienceButton",
      submitEditKey: "modal.editExperienceButton"
    });

  resetMode();

  if (modal) {
    modal.querySelectorAll("[data-modal-close]").forEach((button) => {
      button.addEventListener("click", resetMode);
    });
    modal.addEventListener("keydown", (event) => {
      if (event.key === "Escape") resetMode();
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const duration = String(data.get("duration") || "").trim();
    const difficulty = String(data.get("difficulty") || "").trim();
    const description = String(data.get("description") || "").trim();
    const video = String(data.get("video") || "").trim();
    const image = String(data.get("image") || "").trim();
    if (!name || !duration || !difficulty) {
      showDataError("Name, duration, and difficulty are required.");
      return;
    }
    try {
      const result = await postRoute("vr", {
        action: "create",
        name,
        duration,
        difficulty,
        description,
        video,
        image
      });
      closeModalById("add-experience-modal", "add-experience-form");
      if (typeof refreshVr === "function") refreshVr();
      const created = result?.data || {};
      const newId = String(created.id || "").trim();
      const centerId = getLinkedCenterId();
      if (newId && centerId) {
        const shouldLink = window.confirm("Link this VR to the current center?");
        if (shouldLink) {
          await postRoute("centerVR", {
            action: "upsert",
            centerId,
            vrId: newId,
            active: true
          });
          if (typeof refreshVr === "function") refreshVr();
        }
      }
    } catch (err) {
      console.error("Create VR experience failed.", err);
      showDataError("Unable to create VR experience.");
    }
  });
};

let pendingExperienceCentersSelection = null;

const applyExperienceCentersSelection = (names = []) => {
  const list = getById("experience-centers-list");
  if (!list) return;
  const inputs = list.querySelectorAll('input[name="centers"]');
  if (!inputs.length) {
    pendingExperienceCentersSelection = names;
    return;
  }
  const selected = new Set(
    names.map((name) => String(name || "").trim()).filter(Boolean)
  );
  inputs.forEach((input) => {
    input.checked = selected.has(input.value);
  });
  pendingExperienceCentersSelection = null;
};

const initExperienceCentersChecklist = () => {
  const list = getById("experience-centers-list");
  if (!list) return;

  const renderCenters = (centers = []) => {
    list.innerHTML = "";
    if (!Array.isArray(centers) || centers.length === 0) {
      const empty = document.createElement("div");
      empty.className = "checkbox-empty";
      empty.textContent = getTranslation("generic.noCentersAvailable", "No centers available.");
      list.appendChild(empty);
      return;
    }

    centers.forEach((center, index) => {
      const name = String(center.name || "").trim();
      if (!name) return;
      const label = document.createElement("label");
      label.className = "checkbox-item";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.name = "centers";
      input.value = name;
      input.id = `experience-center-${index}`;
      const text = document.createElement("span");
      text.textContent = name;
      label.appendChild(input);
      label.appendChild(text);
      list.appendChild(label);
    });
    if (pendingExperienceCentersSelection) {
      applyExperienceCentersSelection(pendingExperienceCentersSelection);
    }
  };

  const loadCenters = async () => {
    try {
      const centers = await fetchRoute("centers");
      renderCenters(Array.isArray(centers) ? centers : []);
    } catch (err) {
      console.error("Load centers for experiences failed.", err);
      renderCenters([]);
    }
  };

  renderCenters([]);
  loadCenters();
};

const openCenterEditModal = (center) => {
  const form = getById("add-center-form");
  if (!form) return;
  form.reset();
  setFormMode(form, {
    mode: "edit",
    titleId: "add-center-title",
    addTitleKey: "modal.addCenter.title",
    editTitleKey: "modal.editCenter.title",
    submitKey: "modal.addCenterButton",
    submitEditKey: "modal.editCenterButton"
  });
  setFormField(form, "id", getField(center, ["id"]));
  setFormField(form, "name", getField(center, ["name"]));
  setFormField(form, "location", getField(center, ["location"]));
  setFormField(form, "specialists", getField(center, ["specialists"]));
  setFormField(form, "subscription", getField(center, ["subscription"]));
  setFormField(form, "contactEmail", getField(center, ["contactEmail", "email"]));
  setFormField(form, "contactPhone", getField(center, ["contactPhone", "phone"]));
  setFormField(form, "children", getField(center, ["children"]));
  form.dataset.accountId = String(getField(center, ["accountId", "accountID"]) || "").trim();
  setFormField(form, "username", getField(center, ["username", "accountUsername"]) || "");
  setFormField(form, "password", getField(center, ["password", "accountPassword"]) || "");
  openModalById("add-center-modal");
};

const applyCenterEditData = (center) => {
  const form = getById("add-center-form");
  if (!form || !center) return;
  setFormField(form, "id", getField(center, ["id"]));
  setFormField(form, "name", getField(center, ["name"]));
  setFormField(form, "location", getField(center, ["location"]));
  setFormField(form, "specialists", getField(center, ["specialists"]));
  setFormField(form, "subscription", getField(center, ["subscription"]));
  setFormField(form, "contactEmail", getField(center, ["contactEmail", "email"]));
  setFormField(form, "contactPhone", getField(center, ["contactPhone", "phone"]));
  setFormField(form, "children", getField(center, ["children"]));
  form.dataset.accountId = String(getField(center, ["accountId", "accountID"]) || "").trim();
  setFormField(form, "username", getField(center, ["username", "accountUsername"]) || "");
  setFormField(form, "password", getField(center, ["password", "accountPassword"]) || "");
};

const openSpecialistEditModal = (specialist) => {
  const form = getById("add-specialist-form");
  if (!form) return;
  form.reset();
  setFormMode(form, {
    mode: "edit",
    titleId: "add-specialist-title",
    addTitleKey: "modal.addSpecialist.title",
    editTitleKey: "modal.editSpecialist.title",
    submitKey: "modal.addSpecialistButton",
    submitEditKey: "modal.editSpecialistButton"
  });
  setFormField(form, "id", getField(specialist, ["id"]));
  setFormField(form, "name", getField(specialist, ["name"]));
  setFormField(form, "center", getField(specialist, ["center"]));
  setFormField(form, "description", getField(specialist, ["description"]));
  setFormField(form, "children", getField(specialist, ["children"]));
  const accountId = getField(specialist, ["accountId", "accountID"]) || "";
  const accountUsername =
    String(specialist.accountUsername || "").trim() ||
    getField(specialist, ["username"]) ||
    "";
  const accountPassword =
    String(specialist.accountPassword || "").trim() ||
    getField(specialist, ["password"]) ||
    "";
  form.dataset.accountId = accountId ? String(accountId).trim() : "";
  setFormField(form, "username", accountUsername);
  setFormField(form, "password", accountPassword);
  openModalById("add-specialist-modal");
};

const openExperienceEditModal = async (experience) => {
  const form = getById("add-experience-form");
  if (!form) return;
  form.reset();
  setFormMode(form, {
    mode: "edit",
    titleId: "add-experience-title",
    addTitleKey: "modal.addExperience.title",
    editTitleKey: "modal.editExperience.title",
    submitKey: "modal.addExperienceButton",
    submitEditKey: "modal.editExperienceButton"
  });
  setFormField(form, "id", getField(experience, ["id"]));
  setFormField(form, "name", getField(experience, ["name"]));
  setFormField(form, "description", getField(experience, ["description"]));
  setFormField(form, "duration", getField(experience, ["duration"]));
  setFormField(form, "difficulty", getField(experience, ["difficulty"]));
  setFormField(form, "video", getField(experience, ["video"]));
  setFormField(form, "image", getField(experience, ["image"]));
  const vrId = getField(experience, ["id"]);
  if (vrId) {
    const centersRaw = getField(experience, ["centers"]);
    const assigned = String(centersRaw || "")
      .split(",")
      .map((value) => String(value || "").trim())
      .filter(Boolean);
    applyExperienceCentersSelection(assigned);
  }
  openModalById("add-experience-modal");
};

const renderCenters = (centers = []) => {
  const grid = getById("centers-grid");
  if (!grid) return;
  const { role } = getUserContext();
  const isAdmin = isCenterAdminRole(role);
  const editLabel = getTranslation("action.edit", "Edit");
  const deleteLabel = getTranslation("action.delete", "Delete");
  const locationLabel = getTranslation("label.location", "Location");
  const planLabel = getTranslation("label.plan", "Plan");
  const emailLabel = getTranslation("label.email", "Email");
  const phoneLabel = getTranslation("label.phone", "Phone");
  const unnamedCenterLabel = getTranslation("placeholder.unnamedCenter", "Unnamed center");
  const noLocationLabel = getTranslation("placeholder.noLocation", "No location");
  const noPlanLabel = getTranslation("placeholder.noPlan", "No plan");
  const noEmailLabel = getTranslation("placeholder.noEmail", "No email");
  const noPhoneLabel = getTranslation("placeholder.noPhone", "No phone");
  if (!Array.isArray(centers) || centers.length === 0) {
    renderEmptyGridCard(grid, "center-card", getTranslation("generic.noCentersYet", "No centers yet"), [
      getTranslation("generic.addCentersHint", "Add centers to populate this list.")
    ]);
    return;
  }

  grid.innerHTML = "";
  const startLabel = getTranslation("centers.startDateLabel", "Start date");
  const endLabel = getTranslation("centers.endDateLabel", "End date");
  centers.forEach((center, index) => {
    const centerId = getField(center, ["id"]);
    const name = String(center.name || "").trim() || unnamedCenterLabel;
    const location = String(center.location || "").trim() || noLocationLabel;
    const plan = String(center.subscription || "").trim() || noPlanLabel;
    const email = String(center.contactEmail || "").trim() || noEmailLabel;
    const phone = String(center.contactPhone || "").trim() || noPhoneLabel;
    const startDate = formatDateOnly(getField(center, ["startDate", "start_date"]));
    const endDate = formatDateOnly(getField(center, ["endDate", "end_date"]));
    const actions =
      isAdmin
        ? `<div class="card-actions">
            <button class="btn secondary small" data-center-edit="${centerId}" data-center-id="${centerId}">${editLabel}</button>
            <button class="btn danger small" data-center-delete="${centerId}">${deleteLabel}</button>
          </div>`
        : "";

    const card = document.createElement("div");
    card.className = "card center-card";
    card.style.setProperty("--delay", `${index * 0.05}s`);
    card.innerHTML = `
      <div class="card-header">
        <div>
          <div class="glow-line"></div>
          <h3 class="card-title">${name}</h3>
        </div>
      </div>
      <div class="card-body">
          <div class="meta">
          <div class="meta-row">
            <span class="meta-label">${locationLabel}</span>
            <span class="meta-value">${location}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">${planLabel}</span>
            <span class="meta-value">${plan}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">${emailLabel}</span>
            <span class="meta-value">${email}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">${phoneLabel}</span>
            <span class="meta-value">${phone}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">${startLabel}</span>
            <span class="meta-value">${startDate || "-"}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">${endLabel}</span>
            <span class="meta-value">${endDate || "-"}</span>
          </div>
        </div>
      </div>
      ${actions ? `<div class="card-footer">${actions}</div>` : ""}
    `;
    if (isAdmin) {
      const editButton = card.querySelector("[data-center-edit]");
      const deleteButton = card.querySelector("[data-center-delete]");
      if (editButton) {
        editButton.addEventListener("click", async (event) => {
          event.preventDefault();
          if (!centerId) return;
          openCenterEditModal(center);
          applyCenterEditData(center);
        });
      }
      if (deleteButton) {
        deleteButton.addEventListener("click", async (event) => {
          event.preventDefault();
          if (!centerId) return;
          alert("Center changes are read-only in this build.");
        });
      }
    }
    grid.appendChild(card);
  });
};

const renderSpecialists = (specialists = []) => {
  const grid = getById("specialists-grid");
  if (!grid) return;
  const { role } = getUserContext();
  const isAdmin = isCenterAdminRole(role);
  const editLabel = getTranslation("action.edit", "Edit");
  const deleteLabel = getTranslation("action.delete", "Delete");
  const centerLabel = getTranslation("label.center", "Center");
  const childrenLabel = getTranslation("label.children", "Children");
  const descriptionLabel = getTranslation("label.description", "Description");
  const unnamedSpecialistLabel = getTranslation("placeholder.unnamedSpecialist", "Unnamed specialist");
  const noCenterLabel = getTranslation("placeholder.noCenter", "No center");
  const noDescriptionLabel = getTranslation("placeholder.noDescription", "No description");
  if (!Array.isArray(specialists) || specialists.length === 0) {
    renderEmptyGridCard(
      grid,
      "specialist-card",
      getTranslation("generic.noSpecialistsYet", "No specialists yet"),
      [getTranslation("generic.addSpecialistsHint", "Add specialists to populate this list.")]
    );
    return;
  }

  grid.innerHTML = "";
  specialists.forEach((specialist, index) => {
    const name = String(specialist.name || "").trim() || unnamedSpecialistLabel;
    const center = String(specialist.center || "").trim() || noCenterLabel;
    const description = String(specialist.description || "").trim() || noDescriptionLabel;
    const children = String(specialist.children || "").trim() || "0";
    const specialistId = getField(specialist, ["id"]);

    const card = document.createElement("div");
    card.className = "card specialist-card";
    card.style.setProperty("--delay", `${index * 0.05}s`);
    card.innerHTML = `
      <div class="card-header">
        <div>
          <div class="glow-line"></div>
          <h3 class="card-title">${name}</h3>
        </div>
      </div>
      <div class="card-body">
          <div class="meta">
          <div class="meta-row">
            <span class="meta-label">${centerLabel}</span>
            <span class="meta-value">${center}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">${childrenLabel}</span>
            <span class="meta-value">${children}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">${descriptionLabel}</span>
            <span class="meta-value">${description}</span>
          </div>
        </div>
      </div>
      ${isAdmin
        ? `<div class="card-footer">
            <div class="card-actions">
              <button class="btn secondary small" data-specialist-edit="${specialistId}">${editLabel}</button>
              <button class="btn danger small" data-specialist-id="${specialistId}">${deleteLabel}</button>
            </div>
          </div>`
        : ""}
    `;
    if (isAdmin) {
      const editButton = card.querySelector("[data-specialist-edit]");
      if (editButton) {
        editButton.dataset.username = specialist.accountUsername || "";
        editButton.dataset.password = specialist.accountPassword || "";
        if (specialist.accountId) {
          editButton.dataset.accountId = specialist.accountId;
        }
      }
    }
    grid.appendChild(card);
  });

  if (isAdmin) {
    grid.querySelectorAll("[data-specialist-edit]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        const specialistId = button.getAttribute("data-specialist-edit");
        if (!specialistId) return;
        const specialist = specialists.find(
          (item) => normalizeKey(getField(item, ["id"])) === normalizeKey(specialistId)
        );
        if (!specialist) return;
        const accountUsername = button.dataset.username || "";
        const accountPassword = button.dataset.password || "";
        const accountId = button.dataset.accountId || getField(specialist, ["accountId", "accountID"]) || "";
        openSpecialistEditModal(
          Object.assign({}, specialist, {
            accountId,
            accountUsername,
            accountPassword
          })
        );
      });
    });
    grid.querySelectorAll("[data-specialist-id]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        alert(READ_ONLY_MESSAGE);
      });
    });
  }
};

const renderVr = (experiences = [], options = {}) => {
  const grid = getById("vr-grid");
  if (!grid) return;
  const { role } = getUserContext();
  const isAdmin = isCenterAdminRole(role);
  const linkActions = options.linkActions === true;
  const centerId = String(options.centerId || "").trim();
  const editLabel = getTranslation("action.edit", "Edit");
  const deleteLabel = getTranslation("action.delete", "Delete");
  const durationLabel = getTranslation("label.duration", "Duration");
  const difficultyLabel = getTranslation("label.difficulty", "Difficulty");
  const previewLabel = getTranslation("label.preview", "Preview");
  const unnamedExperienceLabel = getTranslation("placeholder.unnamedExperience", "Unnamed experience");
  const noDescriptionLabel = getTranslation("placeholder.noDescription", "No description");
  const noDurationLabel = getTranslation("placeholder.noDuration", "No duration");
  const noDifficultyLabel = getTranslation("placeholder.noDifficulty", "No difficulty");
  if (!Array.isArray(experiences) || experiences.length === 0) {
    const emptyTitle = options.emptyTitle || getTranslation("generic.noExperiencesYet", "No experiences yet");
    const emptyHint = options.emptyHint || getTranslation("generic.addExperiencesHint", "Add VR experiences to populate this list.");
    renderEmptyGridCard(grid, "vr-card", emptyTitle, [emptyHint]);
    return;
  }

  grid.innerHTML = "";
  experiences.forEach((experience, index) => {
    const name = String(experience.name || "").trim() || unnamedExperienceLabel;
    const description = String(experience.description || "").trim() || noDescriptionLabel;
    const duration = String(experience.duration || "").trim() || noDurationLabel;
    const difficulty = String(experience.difficulty || "").trim() || noDifficultyLabel;
    const image = String(experience.image || "").trim();
    const video = String(experience.video || "").trim();
    const vrId = getField(experience, ["id"]);
    const actions = isAdmin
      ? `<div class="card-actions">
            <button class="btn secondary small" data-vr-edit="${vrId}">${editLabel}</button>
            <button class="btn danger small" data-vr-delete="${vrId}">${deleteLabel}</button>
          </div>`
      : "";
    const linkToggle = linkActions
      ? `<div class="card-actions">
            <button class="btn ghost small" data-vr-toggle="${vrId}" data-vr-active="true">${getTranslation("vr.disable", "Disable")}</button>
          </div>`
      : "";
    const preview = video
      ? `<a class="preview-link" href="${video}" target="_blank" rel="noreferrer">${previewLabel}</a>`
      : `<span class="preview-link">${previewLabel}</span>`;
    const footerClass = actions || linkToggle ? "card-footer spread" : "card-footer";

    const card = document.createElement("div");
    card.className = "card vr-card";
    card.style.setProperty("--delay", `${index * 0.05}s`);
    card.innerHTML = `
      <div class="card-header">
        <div>
          <div class="glow-line"></div>
          <h3 class="card-title">${name}</h3>
          <p class="muted">${description}</p>
        </div>
      </div>
      <div class="card-body">
        <div class="vr-media">
          ${image ? `<img src="${image}" alt="${name}">` : ""}
          <div class="overlay"></div>
        </div>
        <div class="meta">
          <div class="meta-row">
            <span class="meta-label">${durationLabel}</span>
            <span class="meta-value">${duration}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">${difficultyLabel}</span>
            <span class="meta-value">${difficulty}</span>
          </div>
        </div>
      </div>
      <div class="${footerClass}">
        <div class="vr-meta">${preview}</div>
        ${actions || linkToggle}
      </div>
    `;
    if (isAdmin) {
      const editButton = card.querySelector("[data-vr-edit]");
      const deleteButton = card.querySelector("[data-vr-delete]");
      if (editButton) {
        editButton.addEventListener("click", (event) => {
          event.preventDefault();
          const id = editButton.getAttribute("data-vr-edit");
          if (!id) return;
          const experienceData = experiences.find(
            (item) => normalizeKey(getField(item, ["id"])) === normalizeKey(id)
          );
          if (!experienceData) return;
          openExperienceEditModal(experienceData);
        });
      }
      if (deleteButton) {
        deleteButton.addEventListener("click", (event) => {
          event.preventDefault();
          alert(READ_ONLY_MESSAGE);
        });
      }
    }
    if (linkActions) {
      const toggleButton = card.querySelector("[data-vr-toggle]");
      if (toggleButton) {
        toggleButton.addEventListener("click", async (event) => {
          event.preventDefault();
          if (!centerId || !vrId) return;
          try {
            await postRoute("centerVR", {
              action: "upsert",
              centerId,
              vrId,
              active: false
            });
            if (typeof refreshVr === "function") refreshVr();
          } catch (err) {
            console.error("Disable VR failed.", err);
            showDataError("Unable to update VR status.");
          }
        });
      }
    }
    grid.appendChild(card);
  });
};

const renderCenterFilter = (centers = []) => {
  const select = getById("customer-filter");
  if (!select) return;
  select.innerHTML = `<option value="all">All centers</option>`;
  centers.forEach((center) => {
    const name = String(center.name || "").trim();
    if (!name) return;
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  });
};

const initCenters = () => {
  const grid = getById("centers-grid");
  if (!grid) return;
  const { role, linkedId } = getUserContext();

  const select = getById("customer-filter");
  let centersCache = [];

  const loadCenters = async () => {
    try {
      const needsSpecialist = role === "specialist" && linkedId;
      const [centers, specialists] = await Promise.all([
        getCachedRoute("centers", "centers"),
        needsSpecialist ? fetchRoute("specialists") : Promise.resolve([])
      ]);
      centersCache = centers;
      let filteredCenters = centersCache;

      if (role === "center_admin" && linkedId) {
        filteredCenters = centersCache.filter(
          (center) => normalizeKey(getField(center, ["id"])) === normalizeKey(linkedId)
        );
      } else if (role === "specialist" && linkedId) {
        const specialist = specialists.find(
          (item) => normalizeKey(getField(item, ["id"])) === normalizeKey(linkedId)
        );
        const specialistCenterId = getField(specialist, ["centerId", "centerID"]);
        if (specialistCenterId) {
          filteredCenters = centersCache.filter(
            (center) => normalizeKey(getField(center, ["id"])) === normalizeKey(specialistCenterId)
          );
        } else {
          const centerName = getField(specialist, ["center"]);
          filteredCenters = centerName
            ? centersCache.filter(
                (center) => normalizeKey(getField(center, ["name"])) === normalizeKey(centerName)
              )
            : [];
        }
      }

      centersCache = filteredCenters;
      renderCenters(centersCache);
      renderCenterFilter(centersCache);
    } catch (err) {
      console.error("Load centers failed.", err);
      renderCenters([]);
    }
  };

  refreshCenters = loadCenters;
  loadCenters();

  if (select) {
    select.addEventListener("change", () => {
      const value = select.value;
      if (value === "all") {
        renderCenters(centersCache);
        return;
      }
      const filtered = centersCache.filter(
        (center) => String(center.name || "").trim() === value
      );
      renderCenters(filtered);
    });
  }
};

const initSpecialists = () => {
  const grid = getById("specialists-grid");
  if (!grid) return;
  const { role, linkedId } = getUserContext();

  const select = getById("specialist-filter");
  let specialistsCache = [];

  const sortSpecialists = (items, order) => {
    const sorted = [...items].sort((a, b) => {
      const nameA = String(a.name || "").toLowerCase();
      const nameB = String(b.name || "").toLowerCase();
      return nameA.localeCompare(nameB);
    });
    return order === "za" ? sorted.reverse() : sorted;
  };

  const loadSpecialists = async () => {
    try {
      const needsCenters = role === "center_admin" && linkedId;
      const [centers, specialists] = await Promise.all([
        needsCenters ? getCachedRoute("centers", "centers") : Promise.resolve([]),
        fetchRoute("specialists")
      ]);
      specialistsCache = Array.isArray(specialists) ? specialists : [];
      let filteredSpecialists = specialistsCache;

      if (role === "center_admin" && linkedId) {
        filteredSpecialists = specialistsCache.filter((specialist) => {
          const specialistCenterId = getField(specialist, ["centerId", "centerID"]);
          if (specialistCenterId) {
            return normalizeKey(specialistCenterId) === normalizeKey(linkedId);
          }
          const specialistCenterName = getField(specialist, ["center"]);
          const resolvedId = getCenterIdFromName(centers, specialistCenterName);
          return resolvedId && normalizeKey(resolvedId) === normalizeKey(linkedId);
        });
      } else if (role === "specialist" && linkedId) {
        filteredSpecialists = specialistsCache.filter(
          (specialist) => normalizeKey(getField(specialist, ["id"])) === normalizeKey(linkedId)
        );
      }

      const order = select ? select.value : "az";
      specialistsCache = filteredSpecialists;
      renderSpecialists(sortSpecialists(specialistsCache, order));
    } catch (err) {
      console.error("Load specialists failed.", err);
      renderSpecialists([]);
    }
  };

  refreshSpecialists = loadSpecialists;
  loadSpecialists();

  if (select) {
    select.addEventListener("change", () => {
      const order = select.value;
      renderSpecialists(sortSpecialists(specialistsCache, order));
    });
  }
};

const initVr = () => {
  const grid = getById("vr-grid");
  if (!grid) return;
  const centerId = getLinkedCenterId();

  const loadVr = async () => {
    try {
      const allVr = await fetchRoute("vr");
      if (centerId) {
        const joined = await fetchRoute("vr", { centerId });
        if (Array.isArray(allVr) && allVr.length === 0) {
          renderVr([], {
            emptyTitle: getTranslation("vr.empty.catalogTitle", "No VR experiences created"),
            emptyHint: getTranslation("vr.empty.catalogHint", "Create a VR experience in the catalog to enable it.")
          });
          return;
        }
        if (!Array.isArray(joined) || joined.length === 0) {
          renderVr([], {
            emptyTitle: getTranslation("vr.empty.centerTitle", "No VR enabled for this center"),
            emptyHint: getTranslation("vr.empty.centerHint", "Link a VR experience to enable it for this center.")
          });
          return;
        }
        renderVr(joined, { linkActions: true, centerId });
        return;
      }
      if (Array.isArray(allVr) && allVr.length === 0) {
        renderVr([], {
          emptyTitle: getTranslation("vr.empty.catalogTitle", "No VR experiences created"),
          emptyHint: getTranslation("vr.empty.catalogHint", "Create a VR experience in the catalog to enable it.")
        });
        return;
      }
      renderVr(allVr);
    } catch (err) {
      console.error("Load VR experiences failed.", err);
      renderVr([]);
    }
  };

  refreshVr = loadVr;
  loadVr();
};

const initModals = () => {
  initModal({
    triggerSelector: '[data-modal-trigger="add-center-modal"]',
    modalId: "add-center-modal",
    formId: "add-center-form"
  });
  initModal({
    triggerSelector: '[data-modal-trigger="add-specialist-modal"]',
    modalId: "add-specialist-modal",
    formId: "add-specialist-form"
  });
  initModal({
    triggerSelector: '[data-modal-trigger="add-child-modal"]',
    modalId: "add-child-modal",
    formId: "add-child-form"
  });
  initModal({
    triggerSelector: '[data-modal-trigger="add-experience-modal"]',
    modalId: "add-experience-modal",
    formId: "add-experience-form"
  });
};

const initSessionModal = () => {
  const modal = getById("session-detail-modal");
  if (!modal) return;
  modal.querySelectorAll("[data-modal-close]").forEach((button) => {
    button.addEventListener("click", closeSessionModal);
  });
  modal.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeSessionModal();
  });
};

const renderChildResponses = (rawResponses) => {
  const responses = getById("child-responses");
  if (!responses) return;
  if (!rawResponses) {
    responses.innerHTML = `<div class="muted">${getTranslation(
      "generic.noResponses",
      "No responses available."
    )}</div>`;
    return;
  }

  let parsed = rawResponses;
  if (typeof rawResponses === "string") {
    try {
      parsed = JSON.parse(rawResponses);
    } catch {
      parsed = rawResponses;
    }
  }

  if (Array.isArray(parsed)) {
    responses.innerHTML = parsed
      .map((item) => `<div class="child-insights">${String(item)}</div>`)
      .join("");
    return;
  }

  if (parsed && typeof parsed === "object") {
    responses.innerHTML = Object.entries(parsed)
      .map(
        ([key, value]) =>
          `<div class="child-insights"><strong>${key}</strong>: ${String(value)}</div>`
      )
      .join("");
    return;
  }

  responses.innerHTML = `<div class="child-insights">${String(parsed)}</div>`;
};

const normalizeFirestoreTimestamp = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === "function") return value.toDate();
  if (typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

const formatSessionTimestamp = (value) => {
  const date = normalizeFirestoreTimestamp(value);
  return date ? date.toISOString() : "";
};

const normalizeSessionDoc = (doc) => {
  const data = doc && typeof doc.data === "function" ? doc.data() : {};
  const attempts = Array.isArray(data.attempts) ? data.attempts : [];
  const correctCount = attempts.filter((attempt) => attempt?.correct === true).length;
  const wrongCount = attempts.filter((attempt) => attempt?.correct === false).length;
  const easyModeCount = attempts.filter((attempt) => attempt?.kind === "Easy").length;
  const defaultModeCount = attempts.filter((attempt) => attempt?.kind === "Default").length;
  return {
    id: doc ? doc.id : "",
    childId: data.childId,
    centerId: data.centerId || data.centerID,
    centerName: data.center || data.centerName,
    specialistId: data.specialistId || data.specialistID,
    clientId: data.clientId,
    operation: data.operation,
    startedAt: data.startedAt,
    endedAt: data.endedAt,
    durationSeconds: data.durationSeconds,
    totalCorrect: data.totalCorrect,
    totalWrong: data.totalWrong,
    completed: data.completed,
    vrId: data.vrId || data.vrID || data.experienceId || data.experienceID,
    vrName: data.vrName || data.experienceName || data.vr || data.experience,
    mode: data.mode || data.sessionMode || data.kind,
    attempts,
    totalAttempts: attempts.length,
    correctCount,
    wrongCount,
    easyModeCount,
    defaultModeCount
  };
};

let sessionsCacheClientId = "";

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const formatPercent = (ratio) => {
  if (!Number.isFinite(ratio)) return "-";
  return `${Math.round(ratio * 100)}%`;
};

const formatSeconds = (value) => {
  if (!Number.isFinite(value)) return "-";
  return `${Math.round(value)}s`;
};

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const toDayKeyLocal = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getSessionDate = (session) => {
  const date =
    normalizeFirestoreTimestamp(session?.startedAt) ||
    normalizeFirestoreTimestamp(session?.endedAt) ||
    (Number.isFinite(session?.timestamp) ? new Date(session.timestamp) : null);
  return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
};

const isVrSession = (session) => {
  if (!session) return false;
  if (session.isVr === true || session.vr === true) return true;
  if (session.vrId || session.vrName) return true;
  const mode = String(session.mode || "").toLowerCase();
  return mode.includes("vr") || mode.includes("virtual");
};

const normalizeOperationKey = (value) => {
  const raw = String(value || "").toLowerCase();
  if (raw.includes("add") || raw.includes("addition") || raw.includes("جمع")) return "add";
  if (raw.includes("sub") || raw.includes("subtract") || raw.includes("طرح")) return "subtract";
  if (raw.includes("mul") || raw.includes("multiply") || raw.includes("ضرب")) return "multiply";
  if (raw.includes("div") || raw.includes("divide") || raw.includes("قسمة")) return "divide";
  return "other";
};

const computeSessionAccuracy = (session) => {
  const correct = Number.isFinite(session.correctCount) ? session.correctCount : toNumber(session.totalCorrect) || 0;
  const wrong = Number.isFinite(session.wrongCount) ? session.wrongCount : toNumber(session.totalWrong) || 0;
  const denom = correct + wrong;
  return denom > 0 ? correct / denom : null;
};

const computeSessionDurationPerQuestion = (session) => {
  const duration = toNumber(session.durationSeconds);
  const attempts = Number.isFinite(session.totalAttempts) ? session.totalAttempts : null;
  if (!Number.isFinite(duration) || !Number.isFinite(attempts) || attempts <= 0) return null;
  return duration / attempts;
};

const computeTrendLabel = (values, threshold) => {
  if (!Array.isArray(values) || values.length < 3) return "-";
  const n = values.length;
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((sum, v) => sum + v, 0) / n;
  let numerator = 0;
  let denominator = 0;
  values.forEach((value, idx) => {
    numerator += (idx - meanX) * (value - meanY);
    denominator += (idx - meanX) ** 2;
  });
  const slope = denominator ? numerator / denominator : 0;
  if (slope > threshold) return "improving";
  if (slope < -threshold) return "declining";
  return "stable";
};

const buildChildSummaryText = (summary) => {
  if (!summary || summary.totalSessions === 0) return getTranslation("generic.noData", "No data");
  const accuracyText = summary.overallAccuracy != null ? formatPercent(summary.overallAccuracy) : "-";
  const durationText = summary.avgDuration != null ? formatSeconds(summary.avgDuration) : "-";
  const focusOp = summary.weakestOpLabel || summary.mostPracticedLabel || "-";
  const support = summary.supportLabel || "-";
  const template = getTranslation(
    "children.summary.template",
    "Completed {sessions} sessions with {accuracy} overall accuracy and {duration} average duration. Focus support level is {support}. Recommended focus: {focus}."
  );
  return template
    .replace("{sessions}", String(summary.totalSessions))
    .replace("{accuracy}", accuracyText)
    .replace("{duration}", durationText)
    .replace("{support}", support)
    .replace("{focus}", focusOp);
};

const updateChildAnalytics = (sessions = []) => {
  const totalSessions = sessions.length;
  const setValue = (id, value) => {
    const el = getById(id);
    if (el) el.textContent = value;
  };

  if (!totalSessions) {
    setValue("child-total-sessions", "0");
    setValue("child-overall-accuracy", "-");
    setValue("child-avg-duration", "-");
    setValue("child-most-practiced", "-");
    setValue("child-strongest", "-");
    setValue("child-weakest", "-");
    ["add", "subtract", "multiply", "divide"].forEach((op) => {
      setValue(`op-${op}-sessions`, "0");
      setValue(`op-${op}-accuracy`, "-");
      setValue(`op-${op}-avgtime`, "-");
      setValue(`op-${op}-easy`, "-");
    });
    setValue("child-accuracy-trend", "-");
    setValue("child-duration-trend", "-");
    setValue("child-support-level", "-");
    setValue("child-auto-summary", "");
    setValue("child-common-wrong", "-");
    setValue("child-reinforce-ops", "-");
    setValue("child-next-focus", "-");
    return;
  }

  let totalCorrect = 0;
  let totalWrong = 0;
  let totalDuration = 0;
  let durationCount = 0;
  let totalAttempts = 0;
  const opStats = {
    add: { sessions: 0, correct: 0, wrong: 0, duration: 0, attempts: 0, easy: 0 },
    subtract: { sessions: 0, correct: 0, wrong: 0, duration: 0, attempts: 0, easy: 0 },
    multiply: { sessions: 0, correct: 0, wrong: 0, duration: 0, attempts: 0, easy: 0 },
    divide: { sessions: 0, correct: 0, wrong: 0, duration: 0, attempts: 0, easy: 0 }
  };

  const wrongQuestionCounts = new Map();
  const accuracySeries = [];
  const durationSeries = [];

  const sortedSessions = sessions.slice().sort((a, b) => {
    const aTime = toNumber(a.startedAt) ?? toNumber(a.endedAt) ?? 0;
    const bTime = toNumber(b.startedAt) ?? toNumber(b.endedAt) ?? 0;
    return aTime - bTime;
  });

  sortedSessions.forEach((session) => {
    const correct = Number.isFinite(session.correctCount) ? session.correctCount : toNumber(session.totalCorrect) || 0;
    const wrong = Number.isFinite(session.wrongCount) ? session.wrongCount : toNumber(session.totalWrong) || 0;
    const attempts = Number.isFinite(session.totalAttempts) ? session.totalAttempts : 0;
    totalCorrect += correct;
    totalWrong += wrong;
    totalAttempts += attempts;
    const duration = toNumber(session.durationSeconds);
    if (Number.isFinite(duration)) {
      totalDuration += duration;
      durationCount += 1;
    }
    const accuracy = computeSessionAccuracy(session);
    if (accuracy != null) accuracySeries.push(accuracy);
    const durationPerQ = computeSessionDurationPerQuestion(session);
    if (durationPerQ != null) durationSeries.push(durationPerQ);

    const opKey = normalizeOperationKey(session.operation);
    if (opKey !== "other" && opStats[opKey]) {
      opStats[opKey].sessions += 1;
      opStats[opKey].correct += correct;
      opStats[opKey].wrong += wrong;
      opStats[opKey].duration += Number.isFinite(duration) ? duration : 0;
      opStats[opKey].attempts += attempts;
      opStats[opKey].easy += Number.isFinite(session.easyModeCount) ? session.easyModeCount : 0;
    }

    if (Array.isArray(session.attempts)) {
      session.attempts.forEach((attempt) => {
        if (attempt?.correct === false) {
          const questionId = String(attempt?.questionId || "-");
          wrongQuestionCounts.set(questionId, (wrongQuestionCounts.get(questionId) || 0) + 1);
        }
      });
    }
  });

  const overallAccuracy = totalCorrect + totalWrong > 0 ? totalCorrect / (totalCorrect + totalWrong) : null;
  const avgDuration = durationCount ? totalDuration / durationCount : null;

  const opEntries = Object.entries(opStats).map(([key, value]) => {
    const opAccuracy = value.correct + value.wrong > 0 ? value.correct / (value.correct + value.wrong) : null;
    return {
      key,
      sessions: value.sessions,
      accuracy: opAccuracy,
      avgTime: value.attempts > 0 ? value.duration / value.attempts : null,
      easy: value.attempts > 0 ? value.easy / value.attempts : null
    };
  });

  const mostPracticed = opEntries.slice().sort((a, b) => b.sessions - a.sessions)[0];
  const strongest = opEntries
    .filter((entry) => entry.accuracy != null)
    .slice()
    .sort((a, b) => b.accuracy - a.accuracy)[0];
  const weakest = opEntries
    .filter((entry) => entry.accuracy != null)
    .slice()
    .sort((a, b) => a.accuracy - b.accuracy)[0];

  const opLabel = (key) =>
    getTranslation(
      `children.breakdown.${key}`,
      key.charAt(0).toUpperCase() + key.slice(1)
    );

  setValue("child-total-sessions", String(totalSessions));
  setValue("child-overall-accuracy", overallAccuracy != null ? formatPercent(overallAccuracy) : "-");
  setValue("child-avg-duration", avgDuration != null ? formatSeconds(avgDuration) : "-");
  setValue("child-most-practiced", mostPracticed?.sessions ? opLabel(mostPracticed.key) : "-");
  setValue("child-strongest", strongest?.accuracy != null ? opLabel(strongest.key) : "-");
  setValue("child-weakest", weakest?.accuracy != null ? opLabel(weakest.key) : "-");

  opEntries.forEach((entry) => {
    setValue(`op-${entry.key}-sessions`, String(entry.sessions));
    setValue(`op-${entry.key}-accuracy`, entry.accuracy != null ? formatPercent(entry.accuracy) : "-");
    setValue(`op-${entry.key}-avgtime`, entry.avgTime != null ? formatSeconds(entry.avgTime) : "-");
    setValue(`op-${entry.key}-easy`, entry.easy != null ? formatPercent(entry.easy) : "-");
  });

  const accuracyTrend = computeTrendLabel(accuracySeries, 0.02);
  const durationTrend = computeTrendLabel(durationSeries.map((value) => -value), 0.2);
  setValue(
    "child-accuracy-trend",
    accuracyTrend === "-" ? "-" : getTranslation(`trend.${accuracyTrend}`, accuracyTrend)
  );
  setValue(
    "child-duration-trend",
    durationTrend === "-" ? "-" : getTranslation(`trend.${durationTrend}`, durationTrend)
  );

  const easyUsage = totalAttempts
    ? sessions.reduce((sum, session) => sum + (session.easyModeCount || 0), 0) / totalAttempts
    : 0;

  let supportLabel = getTranslation("support.independent", "Independent");
  if (easyUsage > 0.4) supportLabel = getTranslation("support.high", "High Support");
  else if (easyUsage > 0.15) supportLabel = getTranslation("support.occasional", "Occasionally Supported");
  setValue("child-support-level", supportLabel);

  const mostCommonWrong = Array.from(wrongQuestionCounts.entries())
    .filter(([key]) => key && key !== "-")
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([key]) => key)
    .join(", ");
  setValue("child-common-wrong", mostCommonWrong || "-");

  const reinforceOps = opEntries
    .filter((entry) => entry.accuracy != null && entry.accuracy < 0.6 && entry.sessions > 0)
    .map((entry) => opLabel(entry.key))
    .join(", ");
  setValue("child-reinforce-ops", reinforceOps || "-");

  const nextFocus = weakest?.accuracy != null ? opLabel(weakest.key) : mostPracticed?.sessions ? opLabel(mostPracticed.key) : "-";
  setValue("child-next-focus", nextFocus);

  setValue(
    "child-auto-summary",
    buildChildSummaryText({
      totalSessions,
      overallAccuracy,
      avgDuration,
      mostPracticedLabel: mostPracticed?.sessions ? opLabel(mostPracticed.key) : null,
      weakestOpLabel: weakest?.accuracy != null ? opLabel(weakest.key) : null,
      supportLabel
    })
  );
};

const renderSessionsTable = (sessions = []) => {
  const tableBody = getById("sessions-table-body");
  const emptyState = getById("sessions-empty");
  const countLabel = getById("sessions-count-label");
  const statusMessage = getById("sessions-status-message");
  if (!tableBody) return;

  tableBody.innerHTML = "";
  if (countLabel) {
    const loadedLabel = getTranslation("sessions.loaded", "Sessions loaded");
    countLabel.textContent = `${loadedLabel}: ${sessions.length}`;
  }
  if (!Array.isArray(sessions) || sessions.length === 0) {
    if (emptyState) emptyState.style.display = "block";
    if (statusMessage) {
      statusMessage.textContent = getTranslation("sessions.noneForChild", "No sessions found for this child");
    }
    return;
  }
  if (emptyState) emptyState.style.display = "none";
  if (statusMessage) statusMessage.textContent = getTranslation("sessions.status.loaded", "Sessions loaded");

  sessions.forEach((session) => {
    const row = document.createElement("tr");
    row.setAttribute("data-session-id", session.id || "");
    row.innerHTML = `
      <td>${formatSessionTimestamp(session.startedAt) || "-"}</td>
      <td>${session.operation || "-"}</td>
      <td>${session.durationSeconds ?? "-"}</td>
      <td>${session.totalCorrect ?? "-"}</td>
      <td>${session.totalWrong ?? "-"}</td>
      <td>${session.completed === true
        ? getTranslation("generic.yes", "Yes")
        : session.completed === false
          ? getTranslation("generic.no", "No")
          : "-"}</td>
    `;
    row.addEventListener("click", () => openSessionModal(session));
    tableBody.appendChild(row);
  });
};

const computeSessionInsightLabel = (attempts = []) => {
  if (!Array.isArray(attempts) || attempts.length < 6) {
    return getTranslation("session.insight.consistent", "Consistent performance");
  }
  const ordered = attempts.slice().sort((a, b) => {
    const aIdx = Number.isFinite(a?.sequenceIndex) ? a.sequenceIndex : 0;
    const bIdx = Number.isFinite(b?.sequenceIndex) ? b.sequenceIndex : 0;
    return aIdx - bIdx;
  });
  const midpoint = Math.floor(ordered.length / 2);
  const firstHalf = ordered.slice(0, midpoint);
  const secondHalf = ordered.slice(midpoint);
  const rate = (list) => {
    const correct = list.filter((attempt) => attempt?.correct === true).length;
    const wrong = list.filter((attempt) => attempt?.correct === false).length;
    const total = correct + wrong;
    return total ? correct / total : null;
  };
  const firstRate = rate(firstHalf);
  const secondRate = rate(secondHalf);
  if (firstRate == null || secondRate == null) {
    return getTranslation("session.insight.consistent", "Consistent performance");
  }
  const delta = secondRate - firstRate;
  if (delta > 0.1) return getTranslation("session.insight.improved", "Improved during session");
  if (delta < -0.1) return getTranslation("session.insight.fatigue", "Fatigue detected");
  return getTranslation("session.insight.consistent", "Consistent performance");
};

const computeSessionQuality = (session) => {
  const accuracy = computeSessionAccuracy(session);
  let score = accuracy != null ? Math.round(accuracy * 100) : 0;
  if (session.completed === false) score -= 10;
  if ((session.easyModeCount || 0) > 0 && accuracy != null && accuracy < 0.7) score -= 5;
  if ((session.totalAttempts || 0) < 5) score -= 5;
  score = clamp(score, 0, 100);
  let labelKey = "session.label.needsReview";
  if (score >= 85) labelKey = "session.label.excellent";
  else if (score >= 70) labelKey = "session.label.good";
  return { score, label: getTranslation(labelKey, labelKey) };
};

const openSessionModal = (session) => {
  const modal = getById("session-detail-modal");
  if (!modal) return;
  const title = getById("session-detail-title");
  const meta = getById("session-detail-meta");
  const listDefault = getById("session-attempts-default");
  const listEasy = getById("session-attempts-easy");
  const sessionTitle = getTranslation("session.title", "Session");
  if (title) title.textContent = `${sessionTitle} ${session.id || ""}`.trim();
  if (meta) {
    const opLabel = getTranslation("session.meta.operation", "Operation");
    const durationLabel = getTranslation("session.meta.duration", "Duration");
    const completedLabel = getTranslation("session.meta.completed", "Completed");
    const notCompletedLabel = getTranslation("session.meta.notCompleted", "Not completed");
    meta.textContent = [
      session.operation ? `${opLabel}: ${session.operation}` : null,
      session.durationSeconds != null ? `${durationLabel}: ${session.durationSeconds}s` : null,
      session.completed === true ? completedLabel : session.completed === false ? notCompletedLabel : null
    ].filter(Boolean).join(" | ");
  }
  const attempts = Array.isArray(session.attempts) ? session.attempts.slice() : [];
  attempts.sort((a, b) => {
    const aIdx = Number.isFinite(a?.sequenceIndex) ? a.sequenceIndex : 0;
    const bIdx = Number.isFinite(b?.sequenceIndex) ? b.sequenceIndex : 0;
    return aIdx - bIdx;
  });

  const accuracy = computeSessionAccuracy(session);
  const accuracyText = accuracy != null ? formatPercent(accuracy) : "-";
  const easyUsed =
    (session.easyModeCount || 0) > 0
      ? getTranslation("generic.yes", "Yes")
      : getTranslation("generic.no", "No");
  setText("session-summary-operation", session.operation || "-");
  setText("session-summary-duration", formatSeconds(toNumber(session.durationSeconds)));
  setText("session-summary-accuracy", accuracyText);
  setText("session-summary-easy", easyUsed);

  const quality = computeSessionQuality(session);
  setText("session-quality-score", `${quality.score}`);
  setText("session-quality-label", quality.label);
  setText("session-insight-label", computeSessionInsightLabel(attempts));

  const wrongCounts = new Map();
  attempts.forEach((attempt) => {
    if (attempt?.correct === false) {
      const key = String(attempt?.questionId || "-");
      wrongCounts.set(key, (wrongCounts.get(key) || 0) + 1);
    }
  });
  const wrongSeen = new Set();
  const correctedAfterWrong = new Set();
  attempts.forEach((attempt) => {
    const key = String(attempt?.questionId || "-");
    if (attempt?.correct === false) wrongSeen.add(key);
    if (attempt?.correct === true && wrongSeen.has(key)) correctedAfterWrong.add(key);
  });

  const buildAttemptRow = (attempt) => {
    const status = attempt?.correct === true
      ? getTranslation("session.status.correct", "Correct")
      : attempt?.correct === false
        ? getTranslation("session.status.wrong", "Wrong")
        : "-";
    const kind = attempt?.kind || "-";
    const questionId = attempt?.questionId || "-";
    const flags = [];
    if (attempt?.correct === true && correctedAfterWrong.has(String(questionId))) {
      flags.push(`<span class="attempt-flag">${getTranslation("session.flag.corrected", "Corrected")}</span>`);
    }
    if (attempt?.correct === false && (wrongCounts.get(String(questionId)) || 0) >= 2) {
      flags.push(`<span class="attempt-flag">${getTranslation("session.flag.repeated", "Repeated mistake")}</span>`);
    }
    const rowClasses = [
      "attempt-row",
      attempt?.correct === true && correctedAfterWrong.has(String(questionId)) ? "corrected" : "",
      attempt?.correct === false && (wrongCounts.get(String(questionId)) || 0) >= 2 ? "repeat-mistake" : ""
    ].filter(Boolean).join(" ");
    return `
      <div class="${rowClasses}">
        <div class="attempt-question">${questionId}</div>
        <div class="attempt-kind">${kind}</div>
        <div class="attempt-status">${status}${flags.length ? ` ${flags.join("")}` : ""}</div>
      </div>
    `;
  };

  const defaultAttempts = attempts.filter((attempt) => String(attempt?.kind || "Default") !== "Easy");
  const easyAttempts = attempts.filter((attempt) => String(attempt?.kind || "") === "Easy");

  if (listDefault) {
    listDefault.innerHTML = defaultAttempts.length
      ? defaultAttempts.map(buildAttemptRow).join("")
      : `<div class="muted">${getTranslation("generic.noResponses", "No responses available.")}</div>`;
  }
  if (listEasy) {
    listEasy.innerHTML = easyAttempts.length
      ? easyAttempts.map(buildAttemptRow).join("")
      : `<div class="muted">${getTranslation("generic.noResponses", "No responses available.")}</div>`;
  }
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
};

const closeSessionModal = () => {
  const modal = getById("session-detail-modal");
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
};

const loadSessionsForChild = async (childIdValue) => {
  const countLabel = getById("sessions-count-label");
  const statusMessage = getById("sessions-status-message");
  const numericChildId = Number(childIdValue);
  if (!Number.isFinite(numericChildId)) {
    showDataError("Child ID must be numeric to link sessions.");
    renderSessionsTable([]);
    updateChildAnalytics([]);
    return;
  }
  selectedChildId = numericChildId;
  if (statusMessage) statusMessage.textContent = getTranslation("sessions.loading", "Loading sessions...");
  if (countLabel) {
    const loadedLabel = getTranslation("sessions.loaded", "Sessions loaded");
    countLabel.textContent = `${loadedLabel}: 0`;
  }

  const db = getFirestore();
  if (!db) return;

  try {
    console.log("Using clientId:", CLIENT_ID);
    if (sessionsCacheClientId !== CLIENT_ID || sessionsCache.length === 0) {
      const snapshot = await db
        .collection("clients")
        .doc(CLIENT_ID)
        .collection("sessions")
        .get();
      console.log("Sessions snapshot size:", snapshot.size);
      sessionsCache = snapshot.docs.map((doc) => normalizeSessionDoc(doc));
      sessionsCacheClientId = CLIENT_ID;
    }
    const filtered = sessionsCache.filter(
      (session) => Number(session.childId) === numericChildId
    );
    renderSessionsTable(filtered);
    updateChildAnalytics(filtered);
  } catch (err) {
    console.error("Load sessions failed.", err);
    showDataError("Unable to load sessions from Firestore.");
    renderSessionsTable([]);
    updateChildAnalytics([]);
  }
};

const renderChildDetail = (child) => {
  setChildEmptyState(false);
  const name = getField(child, ["name", "fullName", "childName"]) || "Unnamed child";
  const childIdRaw = child ? child.childId : "";
  const childIdText =
    childIdRaw !== undefined && childIdRaw !== null && String(childIdRaw).trim() !== ""
      ? String(childIdRaw)
      : "-";
  const age = getField(child, ["age"]);
  const specialist = getField(child, ["specialist", "specialistName"]);
  const statusValue = getField(child, ["status"]);
  const metaBits = [];
  if (age) metaBits.push(`Age ${age}`);
  if (specialist) metaBits.push(`Specialist ${specialist}`);
  const meta = metaBits.length
    ? metaBits.join(" | ")
    : getTranslation("generic.noProfileData", "No profile data available.");

  setText("child-name", name);
  setText("child-id", ` | Child ID: ${childIdText}`);
  setText("child-meta", meta);
  const status = getById("child-status");
  if (status) {
    status.textContent = statusValue;
    status.dataset.status = statusValue ? String(statusValue).toLowerCase() : "";
  }

  setText("child-accuracy", getField(child, ["accuracy"]) || "-");
  setText("child-trend", getField(child, ["trend"]) || "-");
  setText("child-attempts", getField(child, ["attempts", "avgAttempts"]) || "-");
  setText(
    "child-operation",
    getField(child, ["operation", "primaryOperation"]) ||
      getTranslation("generic.unspecified", "Unspecified")
  );
  setText("child-progress", getField(child, ["progress", "notes"]) || "-");

  renderChildResponses(getField(child, ["responses", "formAnswers", "answers"]));
};

const renderChildrenList = (children = []) => {
  const list = getById("children-list");
  if (!list) return;
  const { role } = getUserContext();
  const deleteLabel = getTranslation("action.delete", "Delete");
  list.innerHTML = "";

  if (!Array.isArray(children) || children.length === 0) {
    renderEmptyListItem(list, getTranslation("generic.noChildrenYet", "No children yet"));
    renderEmptyChildProfile();
    return;
  }

  children.forEach((child, index) => {
    const name = getField(child, ["name", "fullName", "childName"]) || "Unnamed child";
    const childIdRaw = child ? child.childId : "";
    const childIdText =
      childIdRaw !== undefined && childIdRaw !== null && String(childIdRaw).trim() !== ""
        ? String(childIdRaw)
        : "-";
    const meta = `Child ID: ${childIdText}`;
    const allowDelete = canManageChildren(role);
    const li = document.createElement("li");
    li.className = "child-item";
    if (index === 0) li.classList.add("active");
    li.innerHTML = `
      <div class="avatar">${name.charAt(0) || "?"}</div>
      <div>
        <div class="child-name">${name}</div>
        <div class="muted">${meta}</div>
      </div>
      ${allowDelete ? `<button class="btn danger small child-delete" data-child-id="${childIdText}">${deleteLabel}</button>` : ""}
    `;
    li.addEventListener("click", () => {
      list.querySelectorAll(".child-item").forEach((item) => item.classList.remove("active"));
      li.classList.add("active");
      renderChildDetail(child);
      loadSessionsForChild(childIdText);
    });
    list.appendChild(li);
    if (index === 0) {
      renderChildDetail(child);
      loadSessionsForChild(childIdText);
    }
  });

  list.querySelectorAll("[data-child-id]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      alert(READ_ONLY_MESSAGE);
    });
  });
};

const initChildren = () => {
  const list = getById("children-list");
  if (!list) return;
  const { role, linkedId } = getUserContext();

  const loadChildren = async () => {
    try {
      const children = await fetchRoute("children");
      let filtered = children;

      if (role === "specialist" && linkedId) {
        filtered = children.filter((child) => {
          const childSpecialistId = String(getField(child, ["specialistId", "specialistID"]) || "").trim();
          return childSpecialistId && normalizeKey(childSpecialistId) === normalizeKey(linkedId);
        });
      } else if (role === "center_admin" && linkedId) {
        filtered = children.filter((child) => {
          const childCenterId = String(getField(child, ["centerId", "centerID"]) || "").trim();
          return childCenterId && normalizeKey(childCenterId) === normalizeKey(linkedId);
        });
      }

      renderChildrenList(filtered);
    } catch (err) {
      console.error("Load children failed.", err);
      showDataError("Unable to load children from Google Sheets.");
      renderChildrenList([]);
    }
  };

  refreshChildren = loadChildren;
  loadChildren();
};

const enforceRoleAccess = () => {
  if (typeof window === "undefined") return;
  const { role } = getUserContext();
  const path = window.location.pathname || "";
  const page = path.split("/").pop();
  const restrictedForSpecialist = new Set(["centers.html"]);

  if (role === "specialist" && restrictedForSpecialist.has(page)) {
    window.location.href = "index.html";
    return;
  }

  if (role === "specialist") {
    document.querySelectorAll('.nav-item[href="centers.html"]').forEach((el) => {
      el.style.display = "none";
    });
  }

  document.querySelectorAll("[data-role]").forEach((el) => {
    const allowed = el.getAttribute("data-role");
    if (allowed === "center-only" && !isCenterAdminRole(role)) {
      el.style.display = "none";
    } else if (allowed === "specialist-only" && role !== "specialist") {
      el.style.display = "none";
    }
  });
};

const initSettings = () => {
  const adminName = getById("center-admin-name");
  const email = getById("center-email");
  const phone = getById("center-phone");
  if (!adminName || !email || !phone) return;
  const saveButton = getById("save-settings");

  const { role, linkedId } = getUserContext();
  if (!linkedId) return;

  const lockInputs = role !== "center_admin";
  [adminName, email, phone].forEach((input) => {
    input.readOnly = lockInputs;
  });

  const loadSettings = async () => {
    try {
      const centers = await fetchRoute("centers");
      let center = null;
      if (role === "center_admin") {
        center = centers.find(
          (item) => normalizeKey(getField(item, ["id"])) === normalizeKey(linkedId)
        );
      } else if (role === "specialist") {
        const specialists = await fetchRoute("specialists");
        const specialist = specialists.find(
          (item) => normalizeKey(getField(item, ["id"])) === normalizeKey(linkedId)
        );
        const specialistCenterId = getField(specialist, ["centerId", "centerID"]);
        if (specialistCenterId) {
          center = centers.find(
            (item) =>
              normalizeKey(getField(item, ["id"])) === normalizeKey(specialistCenterId)
          );
        } else {
          const centerName = getField(specialist, ["center"]);
          center = centers.find(
            (item) => normalizeKey(getField(item, ["name"])) === normalizeKey(centerName)
          );
        }
      }

      if (!center) return;
      adminName.value = getField(center, ["name"]);
      email.value = getField(center, ["contactEmail", "email"]);
      phone.value = getField(center, ["contactPhone", "phone"]);
    } catch (err) {
      console.error("Load settings failed.", err);
    }
  };

  loadSettings();

  if (saveButton && role === "center_admin") {
    saveButton.addEventListener("click", () => {
      alert(READ_ONLY_MESSAGE);
    });
  }
};

const initLogout = () => {
  document.querySelectorAll("[data-logout]").forEach((button) => {
    button.addEventListener("click", () => {
      if (typeof window === "undefined") return;
      localStorage.removeItem(AUTH_STORAGE_KEY);
      window.location.href = LOGIN_PAGE;
    });
  });
};

const initOverviewCounts = () => {
  const metricChildren = getById("metric-children");
  const metricSpecialists = getById("metric-specialists");
  const metricCenters = getById("metric-centers");
  const metricVr = getById("metric-vr");
  const titleChildren = getById("metric-title-children");
  const titleSpecialists = getById("metric-title-specialists");
  const titleVr = getById("metric-title-vr");
  const footChildren = getById("metric-foot-children");
  const footSpecialists = getById("metric-foot-specialists");
  const footCenters = getById("metric-foot-centers");
  const footVr = getById("metric-foot-vr");
  if (!metricChildren || !metricSpecialists) return;

  updateOverviewCounts = async () => {
    const { role, linkedId } = getUserContext();
    if (metricVr) {
      try {
        const vrList = await fetchRoute("vr");
        setMetricValue("metric-vr", String(Array.isArray(vrList) ? vrList.length : 0));
        if (titleVr) titleVr.textContent = getTranslation("index.metric.vr", "VR Experiences");
        if (footVr) footVr.textContent = getTranslation("index.metric.vrAvailable", "Available experiences");
      } catch (err) {
        console.error("Load VR overview count failed.", err);
        setMetricEmpty("metric-vr");
        if (footVr) footVr.textContent = getTranslation("generic.noData", "No data");
      }
    }
    if (role === "specialist") {
      setMetricEmpty("metric-children");
      setMetricEmpty("metric-specialists");
      if (metricCenters) setMetricEmpty("metric-centers");
      const notAvailable = getTranslation("overview.notAvailable", "Not available for specialists");
      if (titleChildren) titleChildren.textContent = getTranslation("index.metric.children", "Children");
      if (titleSpecialists) titleSpecialists.textContent = getTranslation("index.metric.specialists", "Specialists");
      if (footChildren) footChildren.textContent = notAvailable;
      if (footSpecialists) footSpecialists.textContent = notAvailable;
      if (footCenters) footCenters.textContent = notAvailable;
      return;
    }

    try {
      const [specialists, children, centers] = await Promise.all([
        fetchRoute("specialists"),
        fetchRoute("children"),
        fetchRoute("centers")
      ]);

      const filteredSpecialists = role === "admin"
        ? specialists
        : specialists.filter((specialist) => {
            const specialistCenterId = getField(specialist, ["centerId", "centerID"]);
            if (specialistCenterId) {
              return normalizeKey(specialistCenterId) === normalizeKey(linkedId);
            }
            const resolvedId = getCenterIdFromName(centers, getField(specialist, ["center"]));
            return resolvedId && normalizeKey(resolvedId) === normalizeKey(linkedId);
          });

      const specialistIds = new Set(
        filteredSpecialists
          .map((specialist) => String(getField(specialist, ["id"]) || "").trim())
          .filter(Boolean)
      );
      const filteredChildren = role === "admin"
        ? children
        : children.filter((child) => {
            const childSpecialistId = String(getField(child, ["specialistId", "specialistID"]) || "").trim();
            return childSpecialistId && specialistIds.has(childSpecialistId);
          });

      const filteredCenters = role === "admin"
        ? centers
        : centers.filter((center) => normalizeKey(getField(center, ["id"])) === normalizeKey(linkedId));

      setMetricValue("metric-children", String(filteredChildren.length));
      setMetricValue("metric-specialists", String(filteredSpecialists.length));
      if (metricCenters) setMetricValue("metric-centers", String(filteredCenters.length));
      if (titleChildren) titleChildren.textContent = getTranslation("index.metric.children", "Children");
      if (titleSpecialists) titleSpecialists.textContent = getTranslation("index.metric.specialists", "Specialists");
      if (footChildren) footChildren.textContent = getTranslation("index.metric.activeChildren", "Active children");
      if (footSpecialists) footSpecialists.textContent = getTranslation("index.metric.activeSpecialists", "Active specialists");
      if (footCenters) footCenters.textContent = getTranslation("overview.activeCenters", "Active centers");
    } catch (err) {
      console.error("Load overview counts failed.", err);
      setMetricEmpty("metric-children");
      setMetricEmpty("metric-specialists");
      if (metricCenters) setMetricEmpty("metric-centers");
      showDataError("Unable to load overview data from Google Sheets.");
    }
  };

  updateOverviewCounts();
};

const interpolateTemplate = (template, values) =>
  String(template || "").replace(/\{(\w+)\}/g, (_, key) => (key in values ? values[key] : ""));

const renderTrendChart = (svg, values) => {
  if (!svg) return;
  const list = Array.isArray(values) ? values : [];
  const hasData = list.some((value) => Number.isFinite(value));
  const width = 120;
  const height = 40;
  const padding = 4;
  const numericValues = list.map((value) => (Number.isFinite(value) ? value : 0));
  if (!numericValues.length) {
    svg.innerHTML = "";
    return;
  }
  const minValue = Math.min(...numericValues);
  const maxValue = Math.max(...numericValues);
  const min = maxValue === minValue ? 0 : minValue;
  const max = maxValue;
  const scale = max - min || 1;
  const points = numericValues.map((value, index) => {
    const x = padding + ((width - padding * 2) * index) / Math.max(numericValues.length - 1, 1);
    const y = height - padding - ((value - min) / scale) * (height - padding * 2);
    return `${x},${y}`;
  });
  const firstPoint = points[0].split(",").map(Number);
  const lastPoint = points[points.length - 1].split(",").map(Number);
  const areaPath = [
    `M ${firstPoint[0]} ${height - padding}`,
    `L ${points.join(" L ")}`,
    `L ${lastPoint[0]} ${height - padding}`,
    "Z"
  ].join(" ");
  const polyline = `<polyline class="trend-line" points="${points.join(" ")}"></polyline>`;
  const area = `<path class="trend-area" d="${areaPath}"></path>`;
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  if (!hasData) {
    svg.innerHTML = `<line class="trend-line" x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" opacity="0.35"></line>`;
    return;
  }
  svg.innerHTML = `${area}${polyline}`;
};

const renderSparkline = (container, values = []) => {
  if (!container) return;
  const list = Array.isArray(values) ? values : [];
  const width = 90;
  const height = 36;
  const padding = 3;
  if (!list.length) {
    container.innerHTML = "";
    return;
  }
  const numericValues = list.map((value) => (Number.isFinite(value) ? value : 0));
  const min = Math.min(...numericValues);
  const max = Math.max(...numericValues);
  const scale = max - min || 1;
  const points = numericValues.map((value, index) => {
    const x = padding + ((width - padding * 2) * index) / Math.max(numericValues.length - 1, 1);
    const y = height - padding - ((value - min) / scale) * (height - padding * 2);
    return `${x},${y}`;
  });
  const svg = `
    <svg viewBox="0 0 ${width} ${height}" aria-hidden="true">
      <polyline fill="none" stroke="rgba(192, 132, 252, 0.9)" stroke-width="2.5" points="${points.join(" ")}"></polyline>
    </svg>
  `;
  container.innerHTML = svg;
};

const getZoneColor = (ratio) => {
  if (!Number.isFinite(ratio)) return "rgba(192, 132, 252, 0.5)";
  if (ratio >= 0.8) return "#8b5cf6";
  if (ratio >= 0.6) return "#fbbf24";
  return "#ff6b6b";
};

const renderDonut = (svg, ratio, target = 0.75) => {
  if (!svg) return;
  const size = 120;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const value = Number.isFinite(ratio) ? clamp(ratio, 0, 1) : 0;
  const offset = circumference * (1 - value);
  const color = getZoneColor(ratio);
  const targetOffset = circumference * (1 - clamp(target, 0, 1));
  svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
  svg.innerHTML = `
    <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" stroke="rgba(139, 92, 246, 0.15)" stroke-width="${stroke}" fill="none"></circle>
    <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" stroke="${color}" stroke-width="${stroke}" fill="none" stroke-linecap="round"
      stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"></circle>
    <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" stroke="rgba(255, 255, 255, 0.35)" stroke-width="2" fill="none"
      stroke-dasharray="${circumference}" stroke-dashoffset="${targetOffset}"></circle>
  `;
};

const renderGauge = (svg, ratio, target = 0.7) => {
  if (!svg) return;
  const width = 120;
  const height = 70;
  const stroke = 10;
  const radius = 50;
  const centerX = width / 2;
  const centerY = height;
  const value = Number.isFinite(ratio) ? clamp(ratio, 0, 1) : 0;
  const color = getZoneColor(ratio);
  const startAngle = Math.PI;
  const endAngle = Math.PI * (1 + value);
  const targetAngle = Math.PI * (1 + clamp(target, 0, 1));
  const polar = (angle) => ({
    x: centerX + radius * Math.cos(angle),
    y: centerY + radius * Math.sin(angle)
  });
  const start = polar(startAngle);
  const end = polar(endAngle);
  const targetPoint = polar(targetAngle);
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.innerHTML = `
    <path d="M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}"
      stroke="rgba(139, 92, 246, 0.15)" stroke-width="${stroke}" fill="none" stroke-linecap="round"></path>
    <path d="M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}"
      stroke="${color}" stroke-width="${stroke}" fill="none" stroke-linecap="round"></path>
    <circle cx="${targetPoint.x}" cy="${targetPoint.y}" r="3.5" fill="rgba(255, 255, 255, 0.7)"></circle>
  `;
};

const setProgressBar = (barEl, ratio) => {
  if (!barEl) return;
  const value = Number.isFinite(ratio) ? clamp(ratio, 0, 1) : 0;
  barEl.style.width = `${Math.round(value * 100)}%`;
};

const renderVrBars = (container, items) => {
  if (!container) return;
  const list = Array.isArray(items) ? items : [];
  if (!list.length) {
    container.innerHTML = `
      <div class="vr-bar"><div class="vr-bar-track"><div class="vr-bar-fill" style="width: 35%"></div></div></div>
      <div class="vr-bar"><div class="vr-bar-track"><div class="vr-bar-fill" style="width: 55%"></div></div></div>
      <div class="vr-bar"><div class="vr-bar-track"><div class="vr-bar-fill" style="width: 25%"></div></div></div>
    `;
    return;
  }
  const max = Math.max(...list.map((item) => item.count)) || 1;
  container.innerHTML = list
    .map(
      (item) => `
        <div class="vr-bar" title="${item.label}">
          <div class="vr-bar-track">
            <div class="vr-bar-fill" style="width: ${Math.round((item.count / max) * 100)}%"></div>
          </div>
        </div>
      `
    )
    .join("");
};

const renderVrThumbs = (container, items) => {
  if (!container) return;
  const list = Array.isArray(items) ? items : [];
  if (!list.length) {
    container.innerHTML = `
      <div class="vr-thumb placeholder"></div>
      <div class="vr-thumb placeholder"></div>
      <div class="vr-thumb placeholder"></div>
    `;
    return;
  }
  container.innerHTML = list
    .map(
      (item) => `
        <div class="vr-thumb" title="${item.label}">
          ${item.image ? `<img src="${item.image}" alt="${item.label}">` : ""}
        </div>
      `
    )
    .join("");
};

const renderAlertChips = (container, alerts) => {
  if (!container) return;
  const chips = [];
  if (alerts.inactiveCenters.length) {
    chips.push({
      label: String(alerts.inactiveCenters.length),
      severity: "medium",
      icon: "!",
      title: `${getTranslation("overview.alerts.inactiveCenters", "Inactive centers")}: ${alerts.inactiveCenters.join(", ")}`
    });
  }
  if (alerts.decliningCenters.length) {
    chips.push({
      label: String(alerts.decliningCenters.length),
      severity: "high",
      icon: "!",
      title: `${getTranslation("overview.alerts.decliningPerformance", "Declining performance flags")}: ${alerts.decliningCenters.join(", ")}`
    });
  }
  if (alerts.unusedVr.length) {
    chips.push({
      label: String(alerts.unusedVr.length),
      severity: "low",
      icon: "•",
      title: `${getTranslation("overview.alerts.unusedVr", "Unused VR content")}: ${alerts.unusedVr.join(", ")}`
    });
  }
  if (!chips.length) {
    container.innerHTML = "";
    return;
  }
  container.innerHTML = chips
    .map(
      (chip) =>
        `<div class="alert-chip ${chip.severity}" title="${chip.title}"><span class="chip-icon">${chip.icon}</span>${chip.label}</div>`
    )
    .join("");
};

const getOverviewSessionSets = (sessions = [], children = [], specialists = [], centers = []) => {
  const childrenById = new Map();
  const centersById = new Map();
  const centersByName = new Map();
  const specialistsById = new Map();

  children.forEach((child) => {
    const id = String(getField(child, ["childId", "id"]) || "").trim();
    if (id) childrenById.set(normalizeKey(id), child);
  });
  centers.forEach((center) => {
    const id = String(getField(center, ["id"]) || "").trim();
    const name = String(getField(center, ["name"]) || "").trim();
    if (id) centersById.set(normalizeKey(id), name || id);
    if (name) centersByName.set(normalizeKey(name), name);
  });
  specialists.forEach((specialist) => {
    const id = String(getField(specialist, ["id"]) || "").trim();
    if (id) specialistsById.set(normalizeKey(id), specialist);
  });

  const resolveCenterLabel = (session) => {
    const directId = String(session.centerId || session.centerID || "").trim();
    const directName = String(session.centerName || session.center || "").trim();
    if (directId) return centersById.get(normalizeKey(directId)) || directName || directId;
    if (directName) return centersByName.get(normalizeKey(directName)) || directName;
    const childId = String(session.childId || "").trim();
    const child = childrenById.get(normalizeKey(childId));
    if (!child) return "";
    const childCenterId = String(getField(child, ["centerId", "centerID"]) || "").trim();
    const childCenterName = String(getField(child, ["center"]) || "").trim();
    if (childCenterId) return centersById.get(normalizeKey(childCenterId)) || childCenterName || childCenterId;
    if (childCenterName) return centersByName.get(normalizeKey(childCenterName)) || childCenterName;
    return "";
  };

  const resolveSpecialistId = (session) => {
    const directId = String(session.specialistId || session.specialistID || "").trim();
    if (directId) return directId;
    const childId = String(session.childId || "").trim();
    const child = childrenById.get(normalizeKey(childId));
    return child ? String(getField(child, ["specialistId", "specialistID"]) || "").trim() : "";
  };

  return { childrenById, specialistsById, centersById, centersByName, resolveCenterLabel, resolveSpecialistId };
};

const buildOverviewAnalytics = (sessions, centers, specialists, children, vrList) => {
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6));
  const prevWeekStart = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13));

  const totalSessions = sessions.length;
  let totalCorrect = 0;
  let totalWrong = 0;
  let totalDuration = 0;
  let durationCount = 0;
  let totalAttempts = 0;
  let totalEasy = 0;
  let avgAttemptsPerQuestionTotal = 0;
  let avgAttemptsPerQuestionCount = 0;
  let vrSessions = 0;
  let vrSessionsToday = 0;
  let vrSessionsWeek = 0;

  const todayChildren = new Set();
  const weekChildren = new Set();
  const todaySpecialists = new Set();
  const weekSpecialists = new Set();
  const todayCenters = new Set();
  const weekCenters = new Set();

  const dailyStats = new Map();
  const vrUsage = new Map();
  const vrUsageByCenter = new Map();
  const centerActivity = new Map();
  const centerAccuracyNow = new Map();
  const centerAccuracyPrev = new Map();

  const vrById = new Map();
  const vrByName = new Map();
  const vrImages = new Map();
  (vrList || []).forEach((vr) => {
    const id = String(getField(vr, ["id"]) || "").trim();
    const name = String(getField(vr, ["name"]) || "").trim();
    const image = String(getField(vr, ["image"]) || "").trim();
    if (id) vrById.set(normalizeKey(id), name || id);
    if (name) vrByName.set(normalizeKey(name), name);
    if (name && image) vrImages.set(normalizeKey(name), image);
    if (id && image) vrImages.set(normalizeKey(id), image);
  });

  const {
    resolveCenterLabel,
    resolveSpecialistId
  } = getOverviewSessionSets(sessions, children, specialists, centers);

  const resolveVrLabel = (session) => {
    const id = String(session.vrId || "").trim();
    const name = String(session.vrName || "").trim();
    if (id) return vrById.get(normalizeKey(id)) || name || id;
    if (name) return vrByName.get(normalizeKey(name)) || name;
    return "";
  };

  sessions.forEach((session) => {
    const correct = Number.isFinite(session.correctCount)
      ? session.correctCount
      : toNumber(session.totalCorrect) || 0;
    const wrong = Number.isFinite(session.wrongCount)
      ? session.wrongCount
      : toNumber(session.totalWrong) || 0;
    const attempts = Number.isFinite(session.totalAttempts)
      ? session.totalAttempts
      : Array.isArray(session.attempts)
        ? session.attempts.length
        : 0;
    totalCorrect += correct;
    totalWrong += wrong;
    totalAttempts += attempts;

    const duration = toNumber(session.durationSeconds);
    if (Number.isFinite(duration)) {
      totalDuration += duration;
      durationCount += 1;
    }

    const easyCount = Number.isFinite(session.easyModeCount)
      ? session.easyModeCount
      : Array.isArray(session.attempts)
        ? session.attempts.filter((attempt) => String(attempt?.kind || "") === "Easy").length
        : 0;
    totalEasy += easyCount;

    if (Array.isArray(session.attempts) && session.attempts.length > 0) {
      const uniqueQuestions = new Set();
      session.attempts.forEach((attempt) => {
        const questionId = String(attempt?.questionId || "").trim();
        if (questionId) uniqueQuestions.add(questionId);
      });
      if (uniqueQuestions.size > 0) {
        avgAttemptsPerQuestionTotal += session.attempts.length / uniqueQuestions.size;
        avgAttemptsPerQuestionCount += 1;
      }
    }

    const sessionDate = getSessionDate(session);
    const centerLabel = resolveCenterLabel(session);
    const specialistId = resolveSpecialistId(session);
    const childId = String(session.childId || "").trim();
    const vrLabel = resolveVrLabel(session);
    const vrActive = isVrSession(session);

    if (vrActive) {
      vrSessions += 1;
      if (vrLabel) {
        vrUsage.set(vrLabel, (vrUsage.get(vrLabel) || 0) + 1);
      }
      if (centerLabel) {
        vrUsageByCenter.set(centerLabel, (vrUsageByCenter.get(centerLabel) || 0) + 1);
      }
    }

    if (sessionDate) {
      const dayKey = toDayKeyLocal(sessionDate);
      if (!dailyStats.has(dayKey)) {
        dailyStats.set(dayKey, { count: 0, correct: 0, wrong: 0, vr: 0 });
      }
      const day = dailyStats.get(dayKey);
      day.count += 1;
      day.correct += correct;
      day.wrong += wrong;
      if (vrActive) day.vr += 1;

      if (sessionDate >= todayStart) {
        if (childId) todayChildren.add(childId);
        if (specialistId) todaySpecialists.add(specialistId);
        if (centerLabel) todayCenters.add(centerLabel);
        if (vrActive) vrSessionsToday += 1;
      }
      if (sessionDate >= weekStart) {
        if (childId) weekChildren.add(childId);
        if (specialistId) weekSpecialists.add(specialistId);
        if (centerLabel) weekCenters.add(centerLabel);
        if (vrActive) vrSessionsWeek += 1;
      }

      if (centerLabel) {
        const lastActive = centerActivity.get(centerLabel);
        if (!lastActive || sessionDate > lastActive) centerActivity.set(centerLabel, sessionDate);
      }

      if (centerLabel && sessionDate >= weekStart) {
        const entry = centerAccuracyNow.get(centerLabel) || { correct: 0, wrong: 0, sessions: 0 };
        entry.correct += correct;
        entry.wrong += wrong;
        entry.sessions += 1;
        centerAccuracyNow.set(centerLabel, entry);
      } else if (centerLabel && sessionDate >= prevWeekStart) {
        const entry = centerAccuracyPrev.get(centerLabel) || { correct: 0, wrong: 0, sessions: 0 };
        entry.correct += correct;
        entry.wrong += wrong;
        entry.sessions += 1;
        centerAccuracyPrev.set(centerLabel, entry);
      }
    }
  });

  const overallAccuracy = totalCorrect + totalWrong > 0 ? totalCorrect / (totalCorrect + totalWrong) : null;
  const avgDuration = durationCount > 0 ? totalDuration / durationCount : null;
  const avgAttemptsPerQuestion =
    avgAttemptsPerQuestionCount > 0 ? avgAttemptsPerQuestionTotal / avgAttemptsPerQuestionCount : null;
  const easyUsage = totalAttempts > 0 ? totalEasy / totalAttempts : null;

  const lastSevenDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(todayStart);
    date.setDate(todayStart.getDate() - (6 - index));
    return toDayKeyLocal(date);
  });

  const sessionsSeries = lastSevenDays.map((key) => dailyStats.get(key)?.count || 0);
  const accuracySeries = lastSevenDays.map((key) => {
    const entry = dailyStats.get(key);
    if (!entry || entry.correct + entry.wrong === 0) return 0;
    return entry.correct / (entry.correct + entry.wrong);
  });
  const vrSeries = lastSevenDays.map((key) => dailyStats.get(key)?.vr || 0);

  const vrUsageEntries = Array.from(vrUsage.entries()).sort((a, b) => b[1] - a[1]);
  const mostUsedVr = vrUsageEntries[0];
  const leastUsedVr = vrUsageEntries.length > 1 ? vrUsageEntries[vrUsageEntries.length - 1] : vrUsageEntries[0];

  const centerVrEntries = Array.from(vrUsageByCenter.entries()).sort((a, b) => b[1] - a[1]);
  const topCenterVr = centerVrEntries.slice(0, 3).map(([name, count]) => `${name} (${count})`);
  const vrUsageItems = vrUsageEntries.slice(0, 4).map(([label, count]) => ({
    label,
    count,
    image: vrImages.get(normalizeKey(label)) || ""
  }));

  const inactiveThreshold = new Date(todayStart);
  inactiveThreshold.setDate(inactiveThreshold.getDate() - 13);
  const inactiveCenters = centers
    .map((center) => String(getField(center, ["name"]) || getField(center, ["id"]) || "").trim())
    .filter(Boolean)
    .filter((name) => {
      const lastActive = centerActivity.get(name);
      return !lastActive || lastActive < inactiveThreshold;
    });

  const decliningCenters = [];
  centerAccuracyNow.forEach((current, name) => {
    const prev = centerAccuracyPrev.get(name);
    if (!prev || current.sessions < 5 || prev.sessions < 5) return;
    const currentRate = current.correct + current.wrong > 0 ? current.correct / (current.correct + current.wrong) : 0;
    const prevRate = prev.correct + prev.wrong > 0 ? prev.correct / (prev.correct + prev.wrong) : 0;
    if (prevRate - currentRate > 0.08) decliningCenters.push(name);
  });

  const unusedVr = (vrList || [])
    .map((vr) => String(getField(vr, ["name"]) || getField(vr, ["id"]) || "").trim())
    .filter(Boolean)
    .filter((name) => !vrUsage.has(name));

  return {
    totals: { totalSessions, overallAccuracy, avgDuration, avgAttemptsPerQuestion, easyUsage, vrSessions },
    indicators: {
      today: { children: todayChildren.size, specialists: todaySpecialists.size, centers: todayCenters.size, vr: vrSessionsToday },
      week: { children: weekChildren.size, specialists: weekSpecialists.size, centers: weekCenters.size, vr: vrSessionsWeek }
    },
    trends: { sessionsSeries, accuracySeries, vrSeries, rangeLabel: `${lastSevenDays[0]} → ${lastSevenDays[6]}` },
    vr: {
      mostUsed: mostUsedVr ? `${mostUsedVr[0]} (${mostUsedVr[1]})` : "",
      leastUsed: leastUsedVr ? `${leastUsedVr[0]} (${leastUsedVr[1]})` : "",
      perCenter: topCenterVr,
      ratio: totalSessions ? `${Math.round((vrSessions / totalSessions) * 100)}%` : "",
      usageItems: vrUsageItems
    },
    alerts: {
      inactiveCenters,
      decliningCenters,
      unusedVr
    }
  };
};

const initOverviewAnalytics = () => {
  const summaryEl = getById("overview-summary");

  const setIndicator = (id, value) => {
    const el = getById(id);
    if (el) el.textContent = value;
  };

  const applyEmpty = () => {
    setText("snapshot-accuracy", "-");
    setText("snapshot-duration", "-");
    setText("snapshot-attempts", "-");
    setText("snapshot-easy", "-");
    setText("snapshot-accuracy-caption", "");
    setText("snapshot-duration-caption", "");
    setText("snapshot-attempts-caption", "");
    setText("snapshot-easy-caption", "");
    setText("vr-most-used", "-");
    setText("vr-least-used", "-");
    setText("vr-per-center", "-");
    setText("vr-session-ratio", "-");
    const alertsContainer = getById("alerts-chips");
    if (alertsContainer) alertsContainer.innerHTML = "";
    renderVrBars(getById("vr-usage-bars"), []);
    renderVrThumbs(getById("vr-thumb-grid"), []);
    renderSparkline(getById("spark-children"), []);
    renderSparkline(getById("spark-specialists"), []);
    renderSparkline(getById("spark-centers"), []);
    renderSparkline(getById("spark-vr"), []);
    renderTrendChart(getById("trend-sessions"), []);
    renderTrendChart(getById("trend-accuracy"), []);
    renderTrendChart(getById("trend-vr"), []);
    renderDonut(getById("snapshot-accuracy-ring"), null, 0.8);
    renderDonut(getById("snapshot-easy-ring"), null, 0.2);
    renderDonut(getById("vr-ratio-ring"), null, 0.25);
    renderGauge(getById("snapshot-attempts-gauge"), null, 0.3);
    setProgressBar(getById("snapshot-duration-bar"), null);
    const vrContext = getById("vr-ratio-context");
    if (vrContext) vrContext.textContent = "";
    const vrEmpty = getById("vr-ratio-empty");
    if (vrEmpty) vrEmpty.style.display = "block";
    const baseline = getById("snapshot-duration-baseline");
    if (baseline) baseline.style.setProperty("--baseline", "50%");
    setIndicator("metric-children-today", "-");
    setIndicator("metric-children-week", "-");
    setIndicator("metric-specialists-today", "-");
    setIndicator("metric-specialists-week", "-");
    setIndicator("metric-centers-today", "-");
    setIndicator("metric-centers-week", "-");
    setIndicator("metric-vr-today", "-");
    setIndicator("metric-vr-week", "-");
    if (summaryEl) {
      summaryEl.textContent = getTranslation("overview.summary.empty", "No session telemetry yet. Connect sessions to see platform health.");
    }
  };

  const load = async () => {
    const db = getFirestore();
    if (!db) {
      applyEmpty();
      return;
    }
    try {
      const [centers, specialists, children, vrList] = await Promise.all([
        fetchRoute("centers"),
        fetchRoute("specialists"),
        fetchRoute("children"),
        fetchRoute("vr")
      ]);
      if (sessionsCacheClientId !== CLIENT_ID || sessionsCache.length === 0) {
        const snapshot = await db
          .collection("clients")
          .doc(CLIENT_ID)
          .collection("sessions")
          .get();
        sessionsCache = snapshot.docs.map((doc) => normalizeSessionDoc(doc));
        sessionsCacheClientId = CLIENT_ID;
      }

      const childIds = new Set(
        (children || [])
          .map((child) => String(getField(child, ["childId", "id"]) || "").trim())
          .filter(Boolean)
          .map((value) => normalizeKey(value))
      );
      const scopedSessions = childIds.size
        ? sessionsCache.filter((session) => childIds.has(normalizeKey(String(session.childId || "").trim())))
        : sessionsCache;

      if (!scopedSessions.length) {
        applyEmpty();
        return;
      }

      const analytics = buildOverviewAnalytics(scopedSessions, centers, specialists, children, vrList);
      const { totals, indicators, trends, vr, alerts } = analytics;
      const vrSessionCount = totals?.vrSessions || 0;

      const accuracyTarget = 0.8;
      const easyTarget = 0.2;
      const attemptsTarget = 1.5;
      const durationTarget = 60;
      setText("snapshot-accuracy", totals.overallAccuracy != null ? formatPercent(totals.overallAccuracy) : "-");
      setText("snapshot-duration", totals.avgDuration != null ? formatSeconds(totals.avgDuration) : "-");
      setText("snapshot-attempts", totals.avgAttemptsPerQuestion != null ? totals.avgAttemptsPerQuestion.toFixed(2) : "-");
      setText("snapshot-easy", totals.easyUsage != null ? formatPercent(totals.easyUsage) : "-");
      setText(
        "snapshot-accuracy-caption",
        totals.overallAccuracy != null
          ? `${getTranslation("label.target", "Target")} ${Math.round(accuracyTarget * 100)}%`
          : ""
      );
      setText(
        "snapshot-easy-caption",
        totals.easyUsage != null
          ? `${getTranslation("label.target", "Target")} ${Math.round(easyTarget * 100)}%`
          : ""
      );
      setText(
        "snapshot-attempts-caption",
        totals.avgAttemptsPerQuestion != null
          ? `${getTranslation("label.target", "Target")} ${attemptsTarget.toFixed(1)}`
          : ""
      );
      setText(
        "snapshot-duration-caption",
        totals.avgDuration != null
          ? `${getTranslation("label.target", "Target")} ${durationTarget}s · ${getTranslation("label.actual", "Actual")} ${formatSeconds(totals.avgDuration)}`
          : ""
      );
      renderDonut(getById("snapshot-accuracy-ring"), totals.overallAccuracy, accuracyTarget);
      renderDonut(getById("snapshot-easy-ring"), totals.easyUsage, easyTarget);
      renderGauge(
        getById("snapshot-attempts-gauge"),
        totals.avgAttemptsPerQuestion != null ? Math.min(totals.avgAttemptsPerQuestion / 5, 1) : 0,
        Math.min(attemptsTarget / 5, 1)
      );
      setProgressBar(getById("snapshot-duration-bar"), totals.avgDuration != null ? Math.min(totals.avgDuration / 120, 1) : 0);
      const baseline = getById("snapshot-duration-baseline");
      if (baseline) baseline.style.setProperty("--baseline", `${Math.min(durationTarget / 120, 1) * 100}%`);

      setText("vr-most-used", vr.mostUsed || "-");
      setText("vr-least-used", vr.leastUsed || "-");
      setText("vr-per-center", vr.perCenter.length ? vr.perCenter.join(", ") : "-");
      setText("vr-session-ratio", vr.ratio || "-");
      const vrRatioValue = totals.totalSessions ? (vrSessionCount / totals.totalSessions) : 0;
      renderDonut(getById("vr-ratio-ring"), vrRatioValue, 0.25);
      const vrContext = getById("vr-ratio-context");
      if (vrContext) vrContext.textContent = `${vrSessionCount} ${getTranslation("label.of", "of")} ${totals.totalSessions}`;
      const vrEmpty = getById("vr-ratio-empty");
      if (vrEmpty) vrEmpty.style.display = vrSessionCount === 0 ? "block" : "none";
      renderVrBars(getById("vr-usage-bars"), vr.usageItems);
      renderVrThumbs(getById("vr-thumb-grid"), vr.usageItems);
      renderAlertChips(getById("alerts-chips"), alerts);

      setIndicator("metric-children-today", String(indicators.today.children));
      setIndicator("metric-children-week", String(indicators.week.children));
      setIndicator("metric-specialists-today", String(indicators.today.specialists));
      setIndicator("metric-specialists-week", String(indicators.week.specialists));
      setIndicator("metric-centers-today", String(indicators.today.centers));
      setIndicator("metric-centers-week", String(indicators.week.centers));
      setIndicator("metric-vr-today", String(indicators.today.vr));
      setIndicator("metric-vr-week", String(indicators.week.vr));

      renderTrendChart(getById("trend-sessions"), trends.sessionsSeries);
      renderTrendChart(getById("trend-accuracy"), trends.accuracySeries);
      renderTrendChart(getById("trend-vr"), trends.vrSeries);

      renderSparkline(getById("spark-children"), trends.sessionsSeries);
      renderSparkline(getById("spark-specialists"), trends.accuracySeries);
      renderSparkline(getById("spark-centers"), trends.sessionsSeries);
      renderSparkline(getById("spark-vr"), trends.vrSeries);

      const status = alerts.inactiveCenters.length || alerts.decliningCenters.length
        ? getTranslation("overview.status.watch", "needs attention")
        : getTranslation("overview.status.stable", "stable");
      const inactiveLabel = getTranslation("overview.alerts.inactiveCenters", "Inactive centers");
      const decliningLabel = getTranslation("overview.alerts.decliningPerformance", "Declining performance flags");
      const unusedLabel = getTranslation("overview.alerts.unusedVr", "Unused VR content");
      const alertsSummary = alerts.inactiveCenters.length || alerts.decliningCenters.length || alerts.unusedVr.length
        ? interpolateTemplate(
            getTranslation("overview.summary.alerts.count", "{count} alert(s) need attention: {items}."),
            {
              count: alerts.inactiveCenters.length + alerts.decliningCenters.length + alerts.unusedVr.length,
              items: [
                alerts.inactiveCenters.length ? `${alerts.inactiveCenters.length} ${inactiveLabel}` : "",
                alerts.decliningCenters.length ? `${alerts.decliningCenters.length} ${decliningLabel}` : "",
                alerts.unusedVr.length ? `${alerts.unusedVr.length} ${unusedLabel}` : ""
              ].filter(Boolean).join(", ")
            }
          )
        : getTranslation("overview.summary.alerts.none", "No critical alerts detected.");
      const vrRatioText = vr.ratio || getTranslation("generic.noData", "No data");
      if (summaryEl) {
        summaryEl.textContent = interpolateTemplate(
          getTranslation(
            "overview.summary.template",
            "Platform health is {status} with {sessions} sessions, {accuracy} accuracy, {duration} avg duration, and {easy} easy-mode usage. {vrRatio}. {alerts}"
          ),
          {
            status,
            sessions: totals.totalSessions,
            accuracy: totals.overallAccuracy != null ? formatPercent(totals.overallAccuracy) : "-",
            duration: totals.avgDuration != null ? formatSeconds(totals.avgDuration) : "-",
            easy: totals.easyUsage != null ? formatPercent(totals.easyUsage) : "-",
            vrRatio: vrRatioText,
            alerts: alertsSummary
          }
        );
      }
    } catch (err) {
      console.error("Load overview analytics failed.", err);
      applyEmpty();
    }
  };

  load();
};


const initHoverEffects = () => {
  const selector = ".card, .btn, .tab, .child-item";
  const toggleHover = (event, isOn) => {
    const target = event.target.closest(selector);
    if (!target) return;
    const related = event.relatedTarget;
    if (related && target.contains(related)) return;
    target.classList.toggle("is-hovered", isOn);
  };
  document.addEventListener("pointerover", (event) => toggleHover(event, true));
  document.addEventListener("pointerout", (event) => toggleHover(event, false));
};

const animateProgressBars = () => {
  document.querySelectorAll(".progress-fill").forEach((fill) => {
    const value = fill.dataset.value;
    if (!value) return;
    fill.style.width = "0%";
    requestAnimationFrame(() => {
      fill.style.width = `${value}%`;
    });
  });
};

const initEmptyStates = () => {
  setPlaceholderMetrics();
  renderEmptyChildProfile();
  renderEmptyListItem(getById("children-list"), getTranslation("generic.noChildrenYet", "No children yet"));
  renderEmptyGridCard(getById("centers-grid"), "center-card", getTranslation("generic.noCentersYet", "No centers yet"), [
    getTranslation("generic.addCentersHint", "Add centers to populate this list.")
  ]);
  renderEmptyGridCard(
    getById("specialists-grid"),
    "specialist-card",
    getTranslation("generic.noSpecialistsYet", "No specialists yet"),
    [getTranslation("generic.addSpecialistsHint", "Add specialists to populate this list.")]
  );
  renderEmptyGridCard(getById("vr-grid"), "vr-card", getTranslation("generic.noExperiencesYet", "No experiences yet"), [
    getTranslation("generic.addExperiencesHint", "Add VR experiences to populate this list.")
  ]);
};

const applyLanguage = (lang) => {
  if (typeof document === "undefined") return;
  setCurrentLanguage(lang);
  const resolved = currentLanguage;
  document.documentElement.lang = resolved;
  document.documentElement.dir = resolved === "ar" ? "rtl" : "ltr";
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const value = translations[resolved]?.[key];
    if (value) el.textContent = value;
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    const value = translations[resolved]?.[key];
    if (value) el.setAttribute("placeholder", value);
  });
  document.querySelectorAll("[data-lang-toggle]").forEach((button) => {
    const label = resolved === "ar" ? "English" : "العربية";
    const aria = resolved === "ar" ? "Switch to English" : "التبديل إلى العربية";
    button.textContent = label;
    button.setAttribute("aria-label", aria);
  });
  if (loadingState.label) {
    loadingState.label.textContent = getTranslation("loading.text", "Loading...");
  }
  if (typeof window !== "undefined") {
    localStorage.setItem(LANG_STORAGE_KEY, resolved);
  }
};

const initLanguageToggle = () => {
  if (typeof document === "undefined") return;
  applyLanguage(getStoredLanguage());
  document.querySelectorAll("[data-lang-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const next = currentLanguage === "ar" ? "en" : "ar";
      applyLanguage(next);
    });
  });
};

const initPasswordToggles = () => {
  document.querySelectorAll(".toggle-password").forEach((button) => {
    button.addEventListener("click", () => {
      const field = button.closest(".password-field");
      if (!field) return;
      const input = field.querySelector('input[type="password"], input[type="text"]');
      if (!input) return;
      const nextType = input.type === "password" ? "text" : "password";
      input.type = nextType;
      button.setAttribute("aria-label", nextType === "password" ? "Show password" : "Hide password");
    });
  });
};

const initSidebarToggle = () => {
  if (typeof document === "undefined") return;
  const shell = document.querySelector(".app-shell");
  const toggle = document.querySelector(".page-topbar .icon-btn");
  if (!shell || !toggle) return;
  const applyState = (collapsed) => {
    shell.classList.toggle("sidebar-collapsed", collapsed);
    toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
  };
  applyState(false);
  toggle.addEventListener("click", () => {
    applyState(!shell.classList.contains("sidebar-collapsed"));
  });
};

document.addEventListener("DOMContentLoaded", () => {
  if (typeof window !== "undefined" && window.firebase) {
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    firebase.auth().signInAnonymously()
      .then(() => console.log("Dashboard signed in anonymously"))
      .catch((err) => console.error("Auth failed", err));
  }
  initLanguageToggle();
  enforceAuth();
  enforceRoleAccess();
  initLogin();
  initTabs();
  initModals();
  initSessionModal();
  initAddCenterForm();
  initAddSpecialistForm();
  initSpecialistCenterDropdown();
  initChildSpecialistSelect();
  initAddChildForm();
  initAddExperienceForm();
  initExperienceCentersChecklist();
  initChildren();
  initCenters();
  initSpecialists();
  initVr();
  initSettings();
  initHoverEffects();
  initEmptyStates();
  initOverviewCounts();
  initOverviewAnalytics();
  initLogout();
  initPasswordToggles();
  initSidebarToggle();
  animateProgressBars();
});

