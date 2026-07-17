// ---------- i18n (translation) system ----------
// Add more keys here as more pages get translated. Usage: t('key')
const I18N = {
  en: {
    // App
    app_name: 'Abu Jana App',
    app_tagline: 'Warehouse & Sales Management',
    // Login screen
    email: 'Email',
    password: 'Password',
    sign_in: 'Sign In',
    signing_in: 'Signing in...',
    register_new_warehouse: 'Register a new warehouse',
    super_admin: 'Super Admin',
    // Register warehouse screen
    register_warehouse_title: 'Register a New Warehouse',
    register_warehouse_subtitle: 'Create your own independent warehouse account',
    warehouse_name: 'Warehouse Name',
    your_full_name: 'Your Full Name',
    choose_password: 'Password (min 8 characters)',
    create_warehouse: 'Create Warehouse',
    back_to_sign_in: 'Back to sign in',
    // Super admin login
    super_admin_title: 'Super Admin',
    super_admin_subtitle: 'Cross-warehouse management',
    // Sidebar nav
    nav_dashboard: 'Dashboard',
    nav_products: 'Products',
    nav_new_sale: 'New Sale',
    nav_sales: 'Sales History',
    nav_targets: 'Target vs Achieved',
    nav_shops: 'Shops',
    nav_inventory: 'Inventory Logs',
    nav_reports: 'Reports',
    nav_suppliers: 'Suppliers',
    nav_purchase_orders: 'Purchase Orders',
    nav_customers: 'Customers',
    nav_coupons: 'Discounts & Coupons',
    nav_credit: 'Credit',
    nav_users: 'Team Management',
    nav_audit: 'Audit Logs',
    warehouse_label: 'Warehouse',
    change_password: 'Change Password',
    logout: 'Logout',
    // Roles
    role_owner: 'Owner',
    role_admin: 'Admin',
    role_salesman: 'Salesman',
    // Common buttons/words
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    add: 'Add',
    export_excel: 'Export Excel',
    export_pdf: 'Export PDF',
    search: 'Search',
    close: 'Close',
    apply: 'Apply',
    clear: 'Clear',
  },
  ar: {
    // App
    app_name: 'تطبيق أبو جنى',
    app_tagline: 'إدارة المستودعات والمبيعات',
    // Login screen
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    sign_in: 'تسجيل الدخول',
    signing_in: 'جارٍ تسجيل الدخول...',
    register_new_warehouse: 'تسجيل مستودع جديد',
    super_admin: 'المشرف العام',
    // Register warehouse screen
    register_warehouse_title: 'تسجيل مستودع جديد',
    register_warehouse_subtitle: 'أنشئ حساب مستودع مستقل خاص بك',
    warehouse_name: 'اسم المستودع',
    your_full_name: 'الاسم الكامل',
    choose_password: 'كلمة المرور (٨ أحرف على الأقل)',
    create_warehouse: 'إنشاء المستودع',
    back_to_sign_in: 'الرجوع لتسجيل الدخول',
    // Super admin login
    super_admin_title: 'المشرف العام',
    super_admin_subtitle: 'إدارة جميع المستودعات',
    // Sidebar nav
    nav_dashboard: 'لوحة التحكم',
    nav_products: 'المنتجات',
    nav_new_sale: 'عملية بيع جديدة',
    nav_sales: 'سجل المبيعات',
    nav_targets: 'الأهداف مقابل الإنجاز',
    nav_shops: 'المحلات',
    nav_inventory: 'سجلات المخزون',
    nav_reports: 'التقارير',
    nav_suppliers: 'الموردون',
    nav_purchase_orders: 'أوامر الشراء',
    nav_customers: 'العملاء',
    nav_coupons: 'الخصومات والعروض',
    nav_credit: 'الديون',
    nav_users: 'إدارة الفريق',
    nav_audit: 'سجلات التدقيق',
    warehouse_label: 'المستودع',
    change_password: 'تغيير كلمة المرور',
    logout: 'تسجيل الخروج',
    // Roles
    role_owner: 'مالك',
    role_admin: 'مشرف',
    role_salesman: 'مندوب مبيعات',
    // Common buttons/words
    save: 'حفظ',
    cancel: 'إلغاء',
    edit: 'تعديل',
    delete: 'حذف',
    add: 'إضافة',
    export_excel: 'تصدير إكسل',
    export_pdf: 'تصدير PDF',
    search: 'بحث',
    close: 'إغلاق',
    apply: 'تطبيق',
    clear: 'مسح',
  }
};

// Current language, persisted across visits
window.currentLang = localStorage.getItem('msync_lang') || 'ar';

// Translation lookup — falls back to the key itself if missing, so nothing
// ever shows up blank even before a page is fully translated yet.
function t(key) {
  return (I18N[window.currentLang] && I18N[window.currentLang][key]) || I18N.en[key] || key;
}

function applyDirection() {
  document.documentElement.lang = window.currentLang;
  document.documentElement.dir = window.currentLang === 'ar' ? 'rtl' : 'ltr';
}

// Applies translations to any element with a data-i18n attribute (sets its
// text), or data-i18n-placeholder (sets its placeholder). Call this after
// rendering any HTML that contains these attributes.
function applyTranslations(root) {
  const scope = root || document;
  scope.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  scope.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
  });
}

function setLanguage(lang) {
  window.currentLang = lang;
  localStorage.setItem('msync_lang', lang);
  applyDirection();
  applyTranslations();
  // Re-render whatever's currently on screen so JS-generated content
  // (sidebar, page content) picks up the new language too.
  if (window.app) {
    if (window.app.currentUser && document.getElementById('mainApp') && !document.getElementById('mainApp').classList.contains('hidden')) {
      window.app.renderSidebar();
      window.app.refreshCurrentPage();
    }
  }
}

applyDirection();
document.addEventListener('DOMContentLoaded', () => applyTranslations());
