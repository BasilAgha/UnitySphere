const API_URL =
  "https://script.google.com/macros/s/AKfycbyFqpP8v9OOBoi_ZXks_4rvDtcGyGBNWowIuHDhPTj0mTMXvkf6dYF3o5ceeaYnXb_1ZA/exec";
const AUTH_STORAGE_KEY = "unitysphereUser";
const LANG_STORAGE_KEY = "unitysphereLang";
const LOGIN_PAGE = "login.html";
const getById = (id) => (typeof document === "undefined" ? null : document.getElementById(id));
const normalizeKey = (value) => String(value || "").toLowerCase().replace(/[\s_-]+/g, "");
const DEFAULT_LANG = "ar";
let currentLanguage = DEFAULT_LANG;

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
    "children.summary.accuracy": "Accuracy",
    "children.summary.sessions": "Sessions",
    "children.summary.avgDuration": "Avg Duration",
    "children.summary.trend": "Trend",
    "children.performanceSnapshot": "Performance Snapshot",
    "children.avgAttempts": "Avg attempts per question",
    "children.sessionCompletionRate": "Session completion rate",
    "children.primaryOperation": "Primary operation",
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
    "modal.childId": "ChildId",
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
    "nav.group.overview": "?????? ??????",
    "nav.group.management": "???????",
    "nav.group.content": "???????",
    "nav.group.system": "??????",
    "sidebar.reminderTitle": "تذكير",
    "sidebar.reminderText": "راجع ملاحظات جلسات الواقع الافتراضي وحدّث مؤشرات التقدم.",
    "sidebar.logout": "تسجيل الخروج",
    "index.title": "نظرة المشرف",
    "index.subtitle": "قياس فوري من مراكز UnitySphere وعيادات الواقع الافتراضي.",
    "index.metric.sessionCompletionRate": "معدل إكمال الجلسات",
    "index.metric.avgSessionDuration": "متوسط مدة الجلسة",
    "index.metric.learningVelocity": "سرعة التعلم",
    "index.metric.globalAccuracy": "متوسط الدقة العالمي",
    "index.metric.sessions": "???????",
    "index.metric.children": "???????",
    "index.metric.specialists": "??????????",
    "index.metric.activeChildren": "??????? ???????",
    "index.metric.activeSpecialists": "?????????? ???????",
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
    "empty.metric.sessions": "????? ??????? ??? ??? ????? ??????.",
    "empty.metric.children": "???? ?????? ??????? ??? ?????? ???????.",
    "empty.metric.specialists": "??? ????? ?????????? ??? ?????? ?????? ???????.",
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
    "children.summary.accuracy": "الدقة",
    "children.summary.sessions": "الجلسات",
    "children.summary.avgDuration": "متوسط المدة",
    "children.summary.trend": "الاتجاه",
    "children.performanceSnapshot": "لمحة الأداء",
    "children.avgAttempts": "متوسط المحاولات لكل سؤال",
    "children.sessionCompletionRate": "معدل إكمال الجلسة",
    "children.primaryOperation": "العملية الأساسية",
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
    "modal.childId": "معرّف الطفل",
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

const isLoginPage = () => {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname || "";
  return path.endsWith(`/${LOGIN_PAGE}`) || path.endsWith(LOGIN_PAGE);
};

const enforceAuth = () => {
  if (isLoginPage()) return;
  if (!getCurrentUser()) {
    window.location.href = LOGIN_PAGE;
  }
};

const apiPost = (payload = {}, message = getTranslation("loading.text", "Loading...")) => {
  startLoading(message);
  return fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: new URLSearchParams(payload)
  }).finally(stopLoading);
};

const apiGet = (route) => fetch(`${API_URL}?route=${encodeURIComponent(route)}`);

const fetchRoute = async (route) => {
  const response = await apiGet(route);
  const payload = await response.json();
  if (!response.ok || payload?.error) {
    throw new Error(`Failed to load ${route}`);
  }
  return Array.isArray(payload) ? payload : [];
};

const fetchAccount = async ({ specialistId, linkedId, accountId } = {}) => {
  const resolvedSpecialistId = specialistId ? String(specialistId || "").trim() : "";
  const resolvedLinkedId = linkedId ? String(linkedId || "").trim() : "";
  const resolvedAccountId = accountId ? String(accountId || "").trim() : "";
  if (!resolvedSpecialistId && !resolvedLinkedId && !resolvedAccountId) return null;
  try {
    const payloadRequest = { route: "getAccount" };
    if (resolvedAccountId) {
      payloadRequest.accountId = resolvedAccountId;
    } else if (resolvedSpecialistId) {
      payloadRequest.specialistId = resolvedSpecialistId;
    } else {
      payloadRequest.linkedId = resolvedLinkedId;
    }
    const response = await apiPost(payloadRequest);
    const payload = await response.json();
    if (response.ok && !payload?.error) {
      return payload || null;
    }
  } catch (err) {
    console.error("Account lookup failed via POST.", err);
  }
  try {
    const query = resolvedAccountId
      ? `getAccount&accountId=${encodeURIComponent(resolvedAccountId)}`
      : resolvedSpecialistId
        ? `getAccount&specialistId=${encodeURIComponent(resolvedSpecialistId)}`
        : `getAccount&linkedId=${encodeURIComponent(resolvedLinkedId)}`;
    const response = await apiGet(query);
    const payload = await response.json();
    if (response.ok && !payload?.error) {
      return payload || null;
    }
  } catch (err) {
    console.error("Account lookup failed via GET.", err);
  }
  return null;
};

const dataCache = {
  centers: null,
  specialists: null,
  centerVr: null,
  accounts: null
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
  return {
    role: String(user.role || "").trim().toLowerCase(),
    linkedId: String(user.linkedId || "").trim()
  };
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

const buildAccountsLookup = (accounts = []) => {
  const byId = new Map();
  const bySpecialistId = new Map();
  if (!Array.isArray(accounts)) return { byId, bySpecialistId };
  accounts.forEach((account) => {
    const id = String(getField(account, ["id"]) || "").trim();
    if (id) byId.set(normalizeKey(id), account);
    const specialistId = String(getField(account, ["specialistId", "specialistID"]) || "").trim();
    if (specialistId) bySpecialistId.set(normalizeKey(specialistId), account);
  });
  return { byId, bySpecialistId };
};

const attachAccountData = (record, lookup) => {
  if (!record || !lookup) return record;
  const existingAccountId = String(getField(record, ["accountId", "accountID"]) || "").trim();
  const recordId = String(getField(record, ["id"]) || "").trim();
  let account = null;
  if (existingAccountId) {
    account = lookup.byId.get(normalizeKey(existingAccountId)) || null;
  }
  if (!account && recordId) {
    account = lookup.bySpecialistId.get(normalizeKey(recordId)) || null;
  }
  const resolvedAccountId = existingAccountId || (account ? String(getField(account, ["id"]) || "").trim() : "");
  const username = account ? getField(account, ["username"]) : "";
  const password = account ? getField(account, ["password"]) : "";
  return Object.assign({}, record, {
    accountId: resolvedAccountId || "",
    accountUsername: username || "",
    accountPassword: password || ""
  });
};

const fetchCenterForEdit = async (centerId) => {
  const resolvedId = String(centerId || "").trim();
  if (!resolvedId) return null;
  try {
    const response = await apiPost({
      route: "getCenter",
      centerId: resolvedId
    }, "Loading center...");
    const payload = await response.json();
    if (response.ok && !payload?.error) {
      return payload || null;
    }
  } catch (err) {
    console.error("Center lookup failed.", err);
  }
  return null;
};

const resolveCenterAdminAccount = (accounts = [], centerId) => {
  if (!Array.isArray(accounts)) return null;
  const resolvedId = String(centerId || "").trim();
  if (!resolvedId) return null;
  return accounts.find((account) => {
    const role = String(getField(account, ["role"]) || "").trim().toLowerCase();
    if (role !== "admin") return false;
    const accountCenterId = String(getField(account, ["centerId", "centerID"]) || "").trim();
    if (accountCenterId !== resolvedId) return false;
    const active = getField(account, ["active"]);
    if (active === true) return true;
    return String(active || "").trim().toLowerCase() === "true";
  }) || null;
};

const fetchCenterAdminAccount = async (centerId) => {
  const resolvedId = String(centerId || "").trim();
  if (!resolvedId) return null;
  try {
    const accounts = await getCachedRoute("accounts", "accounts");
    const account = resolveCenterAdminAccount(accounts, resolvedId);
    return account
      ? {
          id: getField(account, ["id"]),
          username: getField(account, ["username"]) || "",
          password: getField(account, ["password"]) || ""
        }
      : null;
  } catch (err) {
    console.error("Center admin lookup failed.", err);
  }
  return null;
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
let refreshVr = null;
let refreshChildren = null;
let updateOverviewCounts = null;

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

      setCurrentUser(resolvedUser);
      window.location.href = "index.html";
    } catch (err) {
      console.error("Login failed.", err);
      setError("Login failed. Please try again.");
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
  el.textContent = value;
  el.classList.remove("is-empty");
  const card = el.closest(".metric-card");
  if (card) card.classList.remove("is-empty");
  if (id === "metric-accuracy") {
    const wrap = document.querySelector(".donut-wrap");
    if (wrap) wrap.classList.remove("is-empty");
  }
};

const setPlaceholderMetrics = () => {
  setMetricEmpty("metric-sessions");
  setMetricEmpty("metric-children");
  setMetricEmpty("metric-specialists");
  setMetricEmpty("metric-accuracy");
  setMetricEmpty("metric-peak");

  const donutValue = document.querySelector(".donut-value");
  if (donutValue) {
    donutValue.style.strokeDasharray = "0 999";
  }

  const donut = document.querySelector(".donut");
  if (donut) donut.classList.add("is-animated");
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

const renderEmptyProgress = () => {
  const list = getById("progress-list");
  if (!list) return;
  list.innerHTML = `
    <div class="progress-item is-animated is-empty">
      <div class="meta">
        <span class="muted">${getTranslation("status.awaiting", "Awaiting Sessions")}</span>
        <strong>0%</strong>
      </div>
      <div class="progress-bar">
        <div class="progress-fill skeleton-bar" data-value="0"></div>
      </div>
      <div class="progress-helper">
        <span class="progress-helper-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M4 12h16"></path>
            <path d="M7 8l5-4 5 4"></path>
            <path d="M7 16l5 4 5-4"></path>
          </svg>
        </span>
        <span>${getTranslation("empty.chart.progress", "Center progress rates will populate after sessions sync.")}</span>
      </div>
    </div>
  `;
};

const renderEmptyChildProfile = () => {
  setText("child-name", getTranslation("generic.noChildSelected", "No child selected"));
  setText("child-id", "");
  setText("child-status", "");
  const status = getById("child-status");
  if (status) status.dataset.status = "";
  setText("child-meta", getTranslation("generic.noProfileData", "No profile data available."));
  setText("child-accuracy", "0%");
  setText("child-sessions", "0");
  setText("child-duration", "0 sec");
  setText("child-trend", getTranslation("generic.noData", "No data"));
  setText("child-attempts", "0.0");
  setText("child-completion", "0%");
  setText("child-operation", getTranslation("generic.unspecified", "Unspecified"));
  setText("child-progress", getTranslation("generic.noSessionData", "No session data available."));

  const responses = getById("child-responses");
  if (responses) {
    responses.innerHTML = `<div class="muted">${getTranslation(
      "generic.noSessionData",
      "No session data available."
    )}</div>`;
  }
};

const clearChartCanvas = () => {
  const canvas = getById("sessionChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const width = canvas.clientWidth || canvas.width;
  const height = canvas.height || 180;
  canvas.width = width;
  canvas.height = height;
  ctx.clearRect(0, 0, width, height);
  canvas.classList.add("is-animated");
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

  if (form && form.dataset.autoClose !== "false") {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      close();
    });
  }
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

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const mode = form.dataset.mode || "add";
    const centerId = String(data.get("id") || "").trim();
    const username = String(data.get("username") || "").trim();
    const password = String(data.get("password") || "").trim();
    const accountId = String(form.dataset.accountId || "").trim();
      const payload = {
        route: mode === "edit" ? "updateCenter" : "addCenter",
        centerId,
        name: String(data.get("name") || "").trim(),
        location: String(data.get("location") || "").trim(),
        specialists: String(data.get("specialists") || "").trim(),
        subscription: String(data.get("subscription") || "").trim(),
        contactEmail: String(data.get("contactEmail") || "").trim(),
        contactPhone: String(data.get("contactPhone") || "").trim(),
        children: String(data.get("children") || "").trim(),
        username,
        password,
        accountId
      };

    if (!payload.name || !payload.location || !payload.subscription) {
      alert("Please fill the required fields.");
      return;
    }
    if (mode === "add" && (!payload.username || !payload.password)) {
      alert("Please fill the required fields.");
      return;
    }

    try {
      if (mode === "edit") {
        if (!payload.centerId) {
          alert("Missing center ID.");
          return;
        }
        if (!payload.username) delete payload.username;
        if (!payload.password) delete payload.password;
      }
      const response = await apiPost(payload, "Saving center...");
      const result = await response.json();
      if (!response.ok || result?.error) {
        alert("Could not add center. Please try again.");
        return;
      }
      closeModalById("add-center-modal", "add-center-form");
      resetMode();
      invalidateCache("centers", "specialists", "centerVr", "accounts");
      if (typeof refreshCenters === "function") refreshCenters();
      if (typeof refreshSpecialists === "function") refreshSpecialists();
      if (typeof refreshChildren === "function") refreshChildren();
      if (typeof updateOverviewCounts === "function") updateOverviewCounts();
      if (typeof refreshVr === "function") refreshVr();
    } catch (err) {
      console.error("Add center failed.", err);
      alert("Could not add center. Please try again.");
    }
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

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!isCenterAdminRole(role)) {
      alert("Only center admins can add specialists.");
      return;
    }
    const data = new FormData(form);
    const mode = form.dataset.mode || "add";
    const specialistId = String(data.get("id") || "").trim();
    const username = String(data.get("username") || "").trim();
    const password = String(data.get("password") || "").trim();
    const accountId = String(form.dataset.accountId || "").trim();
    const selectedCenterName = String(data.get("center") || "").trim();
    let resolvedCenterId = linkedId;
    if (!resolvedCenterId && selectedCenterName) {
      try {
        const centers = await getCachedRoute("centers", "centers");
        resolvedCenterId = getCenterIdFromName(centers, selectedCenterName);
      } catch (err) {
        console.error("Center lookup failed for specialist.", err);
      }
    }
    const payload = {
      route: mode === "edit" ? "updateSpecialist" : "addSpecialist",
      specialistId,
      name: String(data.get("name") || "").trim(),
      center: selectedCenterName,
      centerId: resolvedCenterId,
      description: String(data.get("description") || "").trim(),
      children: String(data.get("children") || "").trim(),
      username,
      password,
      accountId
    };

    if (!payload.name || !payload.description) {
      alert("Please fill the required fields.");
      return;
    }
    if (mode === "add" && (!payload.username || !payload.password)) {
      alert("Please fill the required fields.");
      return;
    }

    try {
      if (mode === "edit") {
        if (!payload.specialistId) {
          alert("Missing specialist ID.");
          return;
        }
        if (!payload.username) delete payload.username;
        if (!payload.password) delete payload.password;
      }
      const response = await apiPost(payload, "Saving specialist...");
      const result = await response.json();
      if (!response.ok || result?.error) {
        alert("Could not add specialist. Please try again.");
        return;
      }
      closeModalById("add-specialist-modal", "add-specialist-form");
      resetMode();
      invalidateCache("specialists", "accounts");
      if (typeof refreshSpecialists === "function") refreshSpecialists();
      if (typeof updateOverviewCounts === "function") updateOverviewCounts();
    } catch (err) {
      console.error("Add specialist failed.", err);
      alert("Could not add specialist. Please try again.");
    }
  });
};

const initSpecialistCenterDropdown = () => {
  const select = getById("specialist-center");
  if (!select) return;
  const { role, linkedId } = getUserContext();

  const renderOptions = (centers = [], forcedCenter = "") => {
    const options = [];
    if (role === "center_admin" && forcedCenter) {
      options.push(`<option value="${forcedCenter}">${forcedCenter}</option>`);
    } else {
      options.push(`<option value="">No center assigned</option>`);
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

  const renderOptions = (specialists = [], forcedId = "") => {
    const options = [];
    if (role === "specialist" && forcedId) {
      const name = getField(
        specialists.find((item) => normalizeKey(getField(item, ["id"])) === normalizeKey(forcedId)),
        ["name"]
      );
      options.push(`<option value="${forcedId}">${name || "Assigned specialist"}</option>`);
      select.innerHTML = options.join("");
      select.value = forcedId;
      select.disabled = true;
      return;
    }

    options.push(`<option value="">Select specialist</option>`);
    specialists.forEach((specialist) => {
      const id = getField(specialist, ["id"]);
      const name = getField(specialist, ["name"]);
      if (!id || !name) return;
      options.push(`<option value="${id}">${name}</option>`);
    });
    select.innerHTML = options.join("");
    select.disabled = false;
  };

  const loadSpecialists = async () => {
    try {
      let specialists = await fetchRoute("specialists");
      dataCache.specialists = specialists;
      if (role === "center_admin" && linkedId) {
        const centers = await getCachedRoute("centers", "centers");
        specialists = specialists.filter((specialist) => {
          const specialistCenterId = getField(specialist, ["centerId", "centerID"]);
          if (specialistCenterId) {
            return normalizeKey(specialistCenterId) === normalizeKey(linkedId);
          }
          const resolvedId = getCenterIdFromName(centers, getField(specialist, ["center"]));
          return resolvedId && normalizeKey(resolvedId) === normalizeKey(linkedId);
        });
      }
      renderOptions(specialists, role === "specialist" ? linkedId : "");
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

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!canManageChildren(role)) {
      alert("Only specialists or admins can add children.");
      return;
    }
    try {
      const data = new FormData(form);
      const childId = String(data.get("childId") || "").trim();
      const name = String(data.get("name") || "").trim();
      const age = String(data.get("age") || "").trim();
      let specialistId = String(data.get("specialistId") || "").trim();
      let centerId = "";

      if (role === "specialist") {
        specialistId = linkedId;
      }

      if (role === "center_admin") {
        centerId = linkedId;
      } else {
        const specialists = await getCachedRoute("specialists", "specialists");
        const specialist = specialists.find(
          (item) => normalizeKey(getField(item, ["id"])) === normalizeKey(specialistId)
        );
        const specialistCenterId = getField(specialist, ["centerId", "centerID"]);
        if (specialistCenterId) {
          centerId = specialistCenterId;
        } else {
          const centers = await getCachedRoute("centers", "centers");
          centerId = getCenterIdFromName(centers, getField(specialist, ["center"]));
        }
      }

      if (!childId || !name || !specialistId || !centerId) {
        alert("Please fill the required fields.");
        return;
      }

      const response = await apiPost({
        route: "addChild",
        childId,
        name,
        age,
        centerId,
        specialistId
      }, "Saving child...");
      const result = await response.json();
      if (!response.ok || result?.error) {
        alert(result?.error || "Could not add child. Please try again.");
        return;
      }
      closeModalById("add-child-modal", "add-child-form");
      if (typeof refreshChildren === "function") refreshChildren();
      if (typeof refreshSpecialists === "function") refreshSpecialists();
      if (typeof updateOverviewCounts === "function") updateOverviewCounts();
    } catch (err) {
      console.error("Add child failed.", err);
      alert("Could not add child. Please try again.");
    }
  });
};

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
    const mode = form.dataset.mode || "add";
    const experienceId = String(data.get("id") || "").trim();
    const centersSelected = Array.from(
      form.querySelectorAll('input[name="centers"]:checked')
    ).map((input) => input.value);
    const imageUrl = String(data.get("image") || "").trim();
    const fileInput = form.querySelector('input[name="imageFile"]');
    let image = imageUrl;
    if (fileInput && fileInput.files && fileInput.files[0]) {
      try {
        image = await readFileAsDataUrl(fileInput.files[0]);
      } catch (err) {
        console.error("Image upload failed.", err);
        alert("Could not read the cover image. Please try a different file.");
        return;
      }
    }
    const payload = {
      route: mode === "edit" ? "updateVr" : "addVr",
      vrId: experienceId,
      name: String(data.get("name") || "").trim(),
      description: String(data.get("description") || "").trim(),
      duration: String(data.get("duration") || "").trim(),
      difficulty: String(data.get("difficulty") || "").trim(),
      video: String(data.get("video") || "").trim(),
      centers: centersSelected.join(", ")
    };
    if (imageUrl || (fileInput && fileInput.files && fileInput.files[0])) {
      payload.image = image;
    }

    if (!payload.name || !payload.description || !payload.duration || !payload.difficulty) {
      alert("Please fill the required fields.");
      return;
    }

    try {
      if (mode === "edit" && !payload.vrId) {
        alert("Missing experience ID.");
        return;
      }
      const response = await apiPost(payload, "Saving experience...");
      const result = await response.json();
      if (!response.ok || result?.error) {
        alert("Could not add experience. Please try again.");
        return;
      }
      closeModalById("add-experience-modal", "add-experience-form");
      resetMode();
      invalidateCache("centerVr");
      if (typeof refreshVr === "function") refreshVr();
    } catch (err) {
      console.error("Add experience failed.", err);
      alert("Could not add experience. Please try again.");
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
      const response = await apiGet("centers");
      const payload = await response.json();
      if (!response.ok || payload?.error) {
        throw new Error("Failed to load centers");
      }
      renderCenters(Array.isArray(payload) ? payload : []);
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
  form.dataset.accountId = "";
  setFormField(form, "username", "");
  setFormField(form, "password", "");
  openModalById("add-center-modal");
};

const applyCenterEditData = (center, account = {}) => {
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
  form.dataset.accountId = String(account.id || "").trim();
  setFormField(form, "username", account.username || "");
  setFormField(form, "password", account.password || "");
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
  const specialistId = getField(specialist, ["id"]);
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
  if ((!accountUsername || !accountPassword) && (accountId || specialistId)) {
    fetchAccount({ accountId, specialistId }).then((account) => {
      if (!account) return;
      form.dataset.accountId = String(account.id || accountId || "").trim();
      setFormField(form, "username", account.username || "");
      setFormField(form, "password", account.password || "");
    });
  }
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
    try {
      const centerVr = await getCachedRoute("centerVr", "centerVr");
      const assigned = centerVr
        .filter((item) => normalizeKey(getField(item, ["vrId", "id"])) === normalizeKey(vrId))
        .map((item) => getField(item, ["center"]))
        .filter(Boolean);
      applyExperienceCentersSelection(assigned);
    } catch (err) {
      console.error("Load experience centers failed.", err);
    }
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
    const name = String(center.name || "").trim() || "Unnamed center";
    const location = String(center.location || "").trim() || "No location";
    const plan = String(center.subscription || "").trim() || "No plan";
    const email = String(center.contactEmail || "").trim() || "No email";
    const phone = String(center.contactPhone || "").trim() || "No phone";
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
            <span class="meta-label">Location</span>
            <span class="meta-value">${location}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Plan</span>
            <span class="meta-value">${plan}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Email</span>
            <span class="meta-value">${email}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Phone</span>
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
          try {
            const [payload, account] = await Promise.all([
              fetchCenterForEdit(centerId),
              fetchCenterAdminAccount(centerId)
            ]);
            if (!payload || payload.error) {
              alert(payload?.error || "Could not load center.");
              return;
            }
            const centerData = payload.center || payload;
            applyCenterEditData(centerData, account || {});
          } catch (err) {
            console.error("Center edit fetch failed.", err);
            alert("Could not load center.");
          }
        });
      }
      if (deleteButton) {
        deleteButton.addEventListener("click", async (event) => {
          event.preventDefault();
          if (!centerId) return;
          if (!confirm("Delete this center?")) return;
          try {
            const response = await apiPost(
              { route: "deleteCenter", centerId },
              "Deleting center..."
            );
            const result = await response.json();
            if (!response.ok || result?.error) {
              alert(result?.error || "Could not delete center.");
              return;
            }
            invalidateCache("centers", "specialists", "centerVr", "accounts");
            if (typeof refreshCenters === "function") refreshCenters();
            if (typeof refreshSpecialists === "function") refreshSpecialists();
            if (typeof refreshChildren === "function") refreshChildren();
            if (typeof updateOverviewCounts === "function") updateOverviewCounts();
            if (typeof refreshVr === "function") refreshVr();
          } catch (err) {
            console.error("Delete center failed.", err);
            alert("Could not delete center.");
          }
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
    const name = String(specialist.name || "").trim() || "Unnamed specialist";
    const center = String(specialist.center || "").trim() || "No center";
    const description = String(specialist.description || "").trim() || "No description";
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
            <span class="meta-label">Center</span>
            <span class="meta-value">${center}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Children</span>
            <span class="meta-value">${children}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Description</span>
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
      button.addEventListener("click", async (event) => {
        event.preventDefault();
        const specialistId = button.getAttribute("data-specialist-id");
        if (!specialistId) return;
        if (!confirm("Delete this specialist?")) return;
        try {
          const response = await apiPost(
            { route: "deleteSpecialist", specialistId },
            "Deleting specialist..."
          );
          const result = await response.json();
          if (!response.ok || result?.error) {
            alert(result?.error || "Could not delete specialist.");
            return;
          }
          invalidateCache("specialists", "accounts");
          if (typeof refreshSpecialists === "function") refreshSpecialists();
          if (typeof refreshChildren === "function") refreshChildren();
          if (typeof updateOverviewCounts === "function") updateOverviewCounts();
        } catch (err) {
          console.error("Delete specialist failed.", err);
          alert("Could not delete specialist.");
        }
      });
    });
  }
};

const renderVr = (experiences = []) => {
  const grid = getById("vr-grid");
  if (!grid) return;
  const { role } = getUserContext();
  const isAdmin = isCenterAdminRole(role);
  const editLabel = getTranslation("action.edit", "Edit");
  const deleteLabel = getTranslation("action.delete", "Delete");
  if (!Array.isArray(experiences) || experiences.length === 0) {
    renderEmptyGridCard(grid, "vr-card", getTranslation("generic.noExperiencesYet", "No experiences yet"), [
      getTranslation("generic.addExperiencesHint", "Add VR experiences to populate this list.")
    ]);
    return;
  }

  grid.innerHTML = "";
  experiences.forEach((experience, index) => {
    const name = String(experience.name || "").trim() || "Unnamed experience";
    const description = String(experience.description || "").trim() || "No description";
    const duration = String(experience.duration || "").trim() || "No duration";
    const difficulty = String(experience.difficulty || "").trim() || "No difficulty";
    const image = String(experience.image || "").trim();
    const video = String(experience.video || "").trim();
    const vrId = getField(experience, ["id"]);
    const actions =
      isAdmin
        ? `<div class="card-actions">
            <button class="btn secondary small" data-vr-edit="${vrId}">${editLabel}</button>
            <button class="btn danger small" data-vr-delete="${vrId}">${deleteLabel}</button>
          </div>`
        : "";
    const preview = video
      ? `<a class="preview-link" href="${video}" target="_blank" rel="noreferrer">Preview</a>`
      : `<span class="preview-link">Preview</span>`;
    const footerClass = actions ? "card-footer spread" : "card-footer";

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
            <span class="meta-label">Duration</span>
            <span class="meta-value">${duration}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Difficulty</span>
            <span class="meta-value">${difficulty}</span>
          </div>
        </div>
      </div>
      <div class="${footerClass}">
        <div class="vr-meta">${preview}</div>
        ${actions}
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
        deleteButton.addEventListener("click", async (event) => {
          event.preventDefault();
          if (!vrId) return;
          if (!confirm("Delete this experience?")) return;
          try {
            const response = await apiPost(
              { route: "deleteVr", vrId },
              "Deleting experience..."
            );
            const result = await response.json();
            if (!response.ok || result?.error) {
              alert(result?.error || "Could not delete experience.");
              return;
            }
            invalidateCache("centerVr");
            if (typeof refreshVr === "function") refreshVr();
          } catch (err) {
            console.error("Delete experience failed.", err);
            alert("Could not delete experience.");
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
        needsSpecialist ? getCachedRoute("specialists", "specialists") : Promise.resolve([])
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
      const [specialists, centers, accounts] = await Promise.all([
        getCachedRoute("specialists", "specialists"),
        needsCenters ? getCachedRoute("centers", "centers") : Promise.resolve([]),
        getCachedRoute("accounts", "accounts")
      ]);
      const accountsLookup = buildAccountsLookup(accounts);
      specialistsCache = specialists.map((specialist) => attachAccountData(specialist, accountsLookup));
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
  const { role, linkedId } = getUserContext();

  const loadVr = async () => {
    try {
      const needsLinking = (role === "center_admin" || role === "specialist") && linkedId;
      const [experiences, centers, specialists, centerVr] = await Promise.all([
        fetchRoute("vr"),
        needsLinking ? getCachedRoute("centers", "centers") : Promise.resolve([]),
        needsLinking && role === "specialist"
          ? getCachedRoute("specialists", "specialists")
          : Promise.resolve([]),
        needsLinking ? getCachedRoute("centerVr", "centerVr") : Promise.resolve([])
      ]);

      if (needsLinking) {
        let centerName = "";
        if (role === "center_admin") {
          const center = centers.find(
            (item) => normalizeKey(getField(item, ["id"])) === normalizeKey(linkedId)
          );
          centerName = getField(center, ["name"]);
        } else {
          const specialist = specialists.find(
            (item) => normalizeKey(getField(item, ["id"])) === normalizeKey(linkedId)
          );
          const specialistCenterId = getField(specialist, ["centerId", "centerID"]);
          if (specialistCenterId) {
            const center = centers.find(
              (item) =>
                normalizeKey(getField(item, ["id"])) === normalizeKey(specialistCenterId)
            );
            centerName = getField(center, ["name"]);
          } else {
            centerName = getField(specialist, ["center"]);
          }
        }

        const matches = centerVr.filter(
          (item) => normalizeKey(getField(item, ["center"])) === normalizeKey(centerName)
        );
        const allowedIds = new Set(
          matches.map((item) => normalizeKey(getField(item, ["vrId", "id"]))).filter(Boolean)
        );
        const allowedNames = new Set(
          matches.map((item) => normalizeKey(getField(item, ["vrName", "name"]))).filter(Boolean)
        );

        experiences = experiences.filter((experience) => {
          const id = normalizeKey(getField(experience, ["id"]));
          const name = normalizeKey(getField(experience, ["name"]));
          return (id && allowedIds.has(id)) || (name && allowedNames.has(name));
        });
      }

      renderVr(experiences);
    } catch (err) {
      console.error("Load experiences failed.", err);
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

const renderChildDetail = (child) => {
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
  setText("child-id", ` | ChildId: ${childIdText}`);
  setText("child-meta", meta);
  const status = getById("child-status");
  if (status) {
    status.textContent = statusValue;
    status.dataset.status = statusValue ? String(statusValue).toLowerCase() : "";
  }

  setText("child-accuracy", getField(child, ["accuracy"]) || "0%");
  setText("child-sessions", getField(child, ["sessions", "sessionCount"]) || "0");
  setText("child-duration", getField(child, ["avgDuration", "duration"]) || "0 sec");
  setText("child-trend", getField(child, ["trend"]) || getTranslation("generic.noData", "No data"));
  setText("child-attempts", getField(child, ["attempts", "avgAttempts"]) || "0.0");
  setText("child-completion", getField(child, ["completion", "completionRate"]) || "0%");
  setText(
    "child-operation",
    getField(child, ["operation", "primaryOperation"]) ||
      getTranslation("generic.unspecified", "Unspecified")
  );
  setText("child-progress", getField(child, ["progress", "notes"]) || "No session data available.");

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
    const meta = `ChildId: ${childIdText}`;
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
    });
    list.appendChild(li);
    if (index === 0) renderChildDetail(child);
  });

  list.querySelectorAll("[data-child-id]").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      const childId = button.getAttribute("data-child-id");
      if (!childId || childId === "-") return;
      if (!confirm("Delete this child?")) return;
      try {
        const response = await apiPost({ route: "deleteChild", childId }, "Deleting child...");
        const result = await response.json();
        if (!response.ok || result?.error) {
          alert(result?.error || "Could not delete child.");
          return;
        }
        if (typeof refreshChildren === "function") refreshChildren();
        if (typeof updateOverviewCounts === "function") updateOverviewCounts();
      } catch (err) {
        console.error("Delete child failed.", err);
        alert("Could not delete child.");
      }
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
    saveButton.addEventListener("click", async () => {
      const payload = {
        route: "updateCenterContact",
        centerId: linkedId,
        name: String(adminName.value || "").trim(),
        contactEmail: String(email.value || "").trim(),
        contactPhone: String(phone.value || "").trim()
      };
      if (!payload.centerId) return;
      try {
        const response = await apiPost(payload, "Saving settings...");
        const result = await response.json();
        if (!response.ok || result?.error) {
          alert(result?.error || "Could not save settings.");
          return;
        }
        alert("Settings saved.");
      } catch (err) {
        console.error("Save settings failed.", err);
        alert("Could not save settings.");
      }
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
  const metricSessions = getById("metric-sessions");
  const metricChildren = getById("metric-children");
  const metricSpecialists = getById("metric-specialists");
  const titleSessions = getById("metric-title-sessions");
  const titleChildren = getById("metric-title-children");
  const titleSpecialists = getById("metric-title-specialists");
  const footSessions = getById("metric-foot-sessions");
  const footChildren = getById("metric-foot-children");
  const footSpecialists = getById("metric-foot-specialists");
  if (!metricSessions || !metricChildren || !metricSpecialists) return;

  updateOverviewCounts = async () => {
    const { role, linkedId } = getUserContext();
    if (role !== "center_admin") {
      setMetricEmpty("metric-sessions");
      setMetricEmpty("metric-children");
      setMetricEmpty("metric-specialists");
      const notAvailable = getTranslation("overview.notAvailable", "Not available for specialists");
      if (titleSessions) titleSessions.textContent = getTranslation("index.metric.sessions", "Sessions");
      if (titleChildren) titleChildren.textContent = getTranslation("index.metric.children", "Children");
      if (titleSpecialists) titleSpecialists.textContent = getTranslation("index.metric.specialists", "Specialists");
      if (footSessions) footSessions.textContent = notAvailable;
      if (footChildren) footChildren.textContent = notAvailable;
      if (footSpecialists) footSpecialists.textContent = notAvailable;
      return;
    }

    try {
      const [specialists, children, centers] = await Promise.all([
        fetchRoute("specialists"),
        fetchRoute("children"),
        fetchRoute("centers")
      ]);

      const filteredSpecialists = specialists.filter((specialist) => {
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
      const filteredChildren = children.filter((child) => {
        const childSpecialistId = String(getField(child, ["specialistId", "specialistID"]) || "").trim();
        return childSpecialistId && specialistIds.has(childSpecialistId);
      });

      const totalSessions = filteredChildren.reduce((sum, child) => {
        const raw = getField(child, ["sessions", "sessionCount"]);
        const value = Number.parseFloat(raw);
        return Number.isFinite(value) ? sum + value : sum;
      }, 0);

      setMetricValue("metric-sessions", String(totalSessions));
      setMetricValue("metric-children", String(filteredChildren.length));
      setMetricValue("metric-specialists", String(filteredSpecialists.length));
      if (titleSessions) titleSessions.textContent = getTranslation("index.metric.sessions", "Sessions");
      if (titleChildren) titleChildren.textContent = getTranslation("index.metric.children", "Children");
      if (titleSpecialists) titleSpecialists.textContent = getTranslation("index.metric.specialists", "Specialists");
      if (footSessions) footSessions.textContent = getTranslation("index.metric.allSessions", "All sessions");
      if (footChildren) footChildren.textContent = getTranslation("index.metric.activeChildren", "Active children");
      if (footSpecialists) footSpecialists.textContent = getTranslation("index.metric.activeSpecialists", "Active specialists");
    } catch (err) {
      console.error("Load overview counts failed.", err);
      setMetricEmpty("metric-sessions");
      setMetricEmpty("metric-children");
      setMetricEmpty("metric-specialists");
    }
  };

  updateOverviewCounts();
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
  clearChartCanvas();
  renderEmptyProgress();
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
  document.querySelectorAll(".chart-card").forEach((card) => card.classList.add("is-empty"));
  const donutWrap = document.querySelector(".donut-wrap");
  if (donutWrap) donutWrap.classList.add("is-empty");
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

document.addEventListener("DOMContentLoaded", () => {
  initLanguageToggle();
  enforceAuth();
  enforceRoleAccess();
  initLogin();
  initTabs();
  initModals();
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
  initLogout();
  initPasswordToggles();
  animateProgressBars();
});

