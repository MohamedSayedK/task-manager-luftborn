import { Messages } from './en';

/**
 * Arabic texts. The compiler reports a missing or extra key compared to English. Arabic has six
 * plural forms (zero, one, two, few, many, other), which the plural messages below spell out.
 */
export const ar: Messages = {
  common: {
    retry: 'إعادة المحاولة',
    cancel: 'إلغاء',
    save: 'حفظ',
    edit: 'تعديل',
    delete: 'حذف',
    closeDialog: 'إغلاق النافذة',
    priority: { high: 'عالية', medium: 'متوسطة', low: 'منخفضة' },
    status: { todo: 'للتنفيذ', inProgress: 'قيد التنفيذ', done: 'مكتملة' },
  },
  primeng: {
    emptyMessage: 'لا توجد نتائج',
    listLabel: 'قائمة الخيارات',
    close: 'إغلاق',
  },
  header: {
    appName: 'مدير المهام',
    menu: 'القائمة',
    searchLabel: 'البحث في المهام',
    searchPlaceholder: 'ابحث في المهام...',
    darkMode: 'الوضع الداكن',
    notifications: 'الإشعارات',
    bellFirst: 'أتمنى أن تعجبك مهمتي! 🙂',
    bellSecond: 'لا توجد إشعارات جديدة. فقط مطوّر يأمل أن تسير المراجعة على ما يرام.',
    bellThird: 'لقد وجدت المفاجأة! 🥚 الآن من فضلك كن لطيفًا في المراجعة.',
    signedInAs: 'تم تسجيل الدخول باسم {name}',
  },
  screens: {
    dashboard: 'لوحة التحكم',
    tasks: 'المهام',
    analytics: 'التحليلات',
  },
  nav: {
    label: 'التنقل الرئيسي',
    calendar: 'التقويم',
    team: 'الفريق',
    settings: 'الإعدادات',
    soon: 'قريبًا',
    newTask: 'مهمة جديدة',
  },
  board: {
    all: 'الكل',
    filterByStatus: 'تصفية حسب الحالة',
    filterByPriority: 'تصفية حسب الأولوية',
    filterByAssignee: 'تصفية حسب المسؤول',
    allPriorities: 'كل الأولويات',
    allAssignees: 'كل المسؤولين',
    newTask: 'مهمة جديدة',
    loadError: 'تعذر تحميل المهام.',
    emptyColumn: 'لا توجد مهام هنا',
    emptyColumnHint: 'اسحب بطاقة إلى هنا',
    moveError: 'تعذر حفظ النقل. تم تحميل اللوحة مرة أخرى.',
    deleteHeader: 'حذف المهمة',
    deleteQuestion: 'هل تريد حذف "{title}"؟ لا يمكن التراجع عن هذا الإجراء.',
    taskWord:
      '{count, plural, zero {مهمة} one {مهمة} two {مهمتان} few {مهام} many {مهمة} other {مهمة}}',
  },
  card: {
    actions: 'إجراءات {title}',
    dueToday: 'مستحقة اليوم',
    dueIn:
      '{count, plural, zero {مستحقة خلال {count} يوم} one {مستحقة خلال يوم واحد} two {مستحقة خلال يومين} few {مستحقة خلال {count} أيام} many {مستحقة خلال {count} يومًا} other {مستحقة خلال {count} يوم}}',
    overdueBy:
      '{count, plural, zero {متأخرة {count} يوم} one {متأخرة بيوم واحد} two {متأخرة بيومين} few {متأخرة {count} أيام} many {متأخرة {count} يومًا} other {متأخرة {count} يوم}}',
    completedToday: 'اكتملت اليوم',
    completedYesterday: 'اكتملت أمس',
    completedAgo:
      '{count, plural, zero {اكتملت منذ {count} يوم} one {اكتملت منذ يوم واحد} two {اكتملت منذ يومين} few {اكتملت منذ {count} أيام} many {اكتملت منذ {count} يومًا} other {اكتملت منذ {count} يوم}}',
  },
  form: {
    title: 'العنوان',
    description: 'الوصف',
    priority: 'الأولوية',
    status: 'الحالة',
    dueDate: 'تاريخ الاستحقاق',
    assignee: 'المسؤول',
    tags: 'الوسوم',
    addTag: 'إضافة وسم',
    tagN: 'الوسم {n}',
    removeTagN: 'إزالة الوسم {n}',
    errors: {
      titleRequired: 'العنوان مطلوب',
      titleMin: 'يجب أن يتكون العنوان من 3 أحرف على الأقل',
      titleMax: 'يجب ألا يزيد العنوان عن 100 حرف',
      descriptionMax: 'يجب ألا يزيد الوصف عن 500 حرف',
      dueRequired: 'تاريخ الاستحقاق مطلوب',
      dueInPast: 'لا يمكن أن يكون تاريخ الاستحقاق في الماضي',
      assigneeRequired: 'المسؤول مطلوب',
    },
  },
  edit: {
    newTask: 'مهمة جديدة',
    editTask: 'تعديل المهمة',
    saveFailed: 'تعذر حفظ المهمة. حاول مرة أخرى.',
    loadFailed: 'تعذر تحميل المهمة.',
    loading: 'جارٍ تحميل المهمة...',
  },
  dashboard: {
    heading: 'الإحصائيات',
    loadError: 'تعذر تحميل الإحصائيات.',
    stats: {
      total: 'إجمالي المهام',
      completed: 'المكتملة',
      inProgress: 'قيد التنفيذ',
      overdue: 'المتأخرة',
    },
    changes: {
      thisWeek: 'هذا الأسبوع',
      today: 'اليوم',
      sameAsYesterday: 'كما كان بالأمس',
    },
  },
  analytics: {
    loadError: 'تعذر تحميل الرسوم البيانية.',
    byPriority: 'المهام حسب الأولوية',
    byStatus: 'المهام حسب الحالة',
    recentActivity: 'آخر النشاطات',
  },
  activity: {
    loadError: 'تعذر تحميل النشاط.',
    empty: 'لا يوجد نشاط بعد.',
    entry:
      '{type, select, created {تم إنشاء المهمة "{title}"} updated {تم تحديث المهمة "{title}"} deleted {تم حذف المهمة "{title}"} other {تم تغيير المهمة "{title}"}}',
    justNow: 'الآن',
    minutesAgo:
      '{count, plural, zero {منذ {count} دقيقة} one {منذ دقيقة} two {منذ دقيقتين} few {منذ {count} دقائق} many {منذ {count} دقيقة} other {منذ {count} دقيقة}}',
    hoursAgo:
      '{count, plural, zero {منذ {count} ساعة} one {منذ ساعة} two {منذ ساعتين} few {منذ {count} ساعات} many {منذ {count} ساعة} other {منذ {count} ساعة}}',
    yesterday: 'أمس',
    daysAgo:
      '{count, plural, zero {منذ {count} يوم} one {منذ يوم} two {منذ يومين} few {منذ {count} أيام} many {منذ {count} يومًا} other {منذ {count} يوم}}',
  },
};
