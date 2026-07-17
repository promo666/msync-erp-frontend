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
    // Products page
    search_products: 'Search products...',
    add_product: 'Add Product',
    sku: 'SKU',
    name: 'Name',
    category: 'Category',
    price: 'Price',
    cost: 'Cost',
    margin: 'Margin',
    stock: 'Stock',
    actions: 'Actions',
    no_products_found: 'No products found',
    adjust_stock: 'Adjust Stock',
    edit_product: 'Edit Product',
    barcode: 'Barcode',
    barcode_placeholder: 'Scan or type barcode',
    description: 'Description',
    unit_price: 'Unit Price (selling price)',
    cost_price: 'Cost Price (what it costs you)',
    low_stock_alert_below: 'Low Stock Alert Below',
    initial_stock: 'Initial Stock',
    monthly_target: 'Monthly Target',
    quarterly_target: 'Quarterly Target',
    current_stock: 'current stock',
    change_qty: 'Change (use negative to remove)',
    change_qty_placeholder: 'e.g. 50 or -10',
    reason: 'Reason',
    reason_placeholder: 'e.g. Restock from supplier',
    apply_change: 'Apply',
    product_updated: 'Product updated',
    product_created: 'Product created',
    stock_adjusted: 'Stock adjusted',
    // New Sale / Sales History page
    search_products_to_add: 'Search products to add...',
    scan: 'Scan',
    cart: 'Cart',
    cart_empty: 'Cart is empty',
    subtotal: 'Subtotal',
    discount: 'Discount',
    total: 'Total',
    coupon_code: 'Coupon code',
    shop_optional: 'Shop (optional)',
    search_shop_placeholder: 'Search by name, location, or phone...',
    no_shop_selected: '— Walk-in / not registered —',
    registered_customer_optional: 'Registered Customer (optional)',
    customer_name_optional: 'Customer name (optional)',
    customer_phone_optional: 'Customer phone (optional)',
    payment: 'Payment',
    cash: 'Cash',
    on_credit: 'On Credit',
    complete_sale: 'Complete Sale',
    in_stock: 'in stock',
    no_products_available: 'No products available',
    each: 'each',
    invoice: 'Invoice',
    date: 'Date',
    salesman: 'Salesman',
    shop: 'Shop',
    customer: 'Customer',
    status: 'Status',
    no_sales_yet: 'No sales yet',
    print: 'Print',
    void: 'Void',
    voided: 'Voided',
    completed: 'Completed',
    sale_completed: 'Sale completed',
    cart_is_empty_warning: 'Cart is empty',
    not_enough_stock: 'Not enough stock available',
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
    // Products page
    search_products: 'ابحث عن منتج...',
    add_product: 'إضافة منتج',
    sku: 'رمز المنتج',
    name: 'الاسم',
    category: 'الفئة',
    price: 'السعر',
    cost: 'التكلفة',
    margin: 'الهامش',
    stock: 'المخزون',
    actions: 'إجراءات',
    no_products_found: 'لا توجد منتجات',
    adjust_stock: 'تعديل المخزون',
    edit_product: 'تعديل المنتج',
    barcode: 'الباركود',
    barcode_placeholder: 'امسح أو اكتب الباركود',
    description: 'الوصف',
    unit_price: 'سعر البيع',
    cost_price: 'سعر التكلفة',
    low_stock_alert_below: 'تنبيه انخفاض المخزون تحت',
    initial_stock: 'المخزون الابتدائي',
    monthly_target: 'الهدف الشهري',
    quarterly_target: 'الهدف الربعي',
    current_stock: 'المخزون الحالي',
    change_qty: 'التغيير (رقم سالب للسحب)',
    change_qty_placeholder: 'مثال: 50 أو -10',
    reason: 'السبب',
    reason_placeholder: 'مثال: تجديد مخزون من المورد',
    apply_change: 'تطبيق',
    product_updated: 'تم تحديث المنتج',
    product_created: 'تم إنشاء المنتج',
    stock_adjusted: 'تم تعديل المخزون',
    // New Sale / Sales History page
    search_products_to_add: 'ابحث عن منتج لإضافته...',
    scan: 'مسح',
    cart: 'السلة',
    cart_empty: 'السلة فارغة',
    subtotal: 'المجموع الفرعي',
    discount: 'الخصم',
    total: 'الإجمالي',
    coupon_code: 'رمز الخصم',
    shop_optional: 'المحل (اختياري)',
    search_shop_placeholder: 'ابحث بالاسم أو الموقع أو رقم الهاتف...',
    no_shop_selected: '— بدون تسجيل —',
    registered_customer_optional: 'عميل مسجّل (اختياري)',
    customer_name_optional: 'اسم الزبون (اختياري)',
    customer_phone_optional: 'هاتف الزبون (اختياري)',
    payment: 'الدفع',
    cash: 'نقدًا',
    on_credit: 'آجل (على الحساب)',
    complete_sale: 'إتمام البيع',
    in_stock: 'متوفر',
    no_products_available: 'لا توجد منتجات متاحة',
    each: 'للواحد',
    invoice: 'الفاتورة',
    date: 'التاريخ',
    salesman: 'المندوب',
    shop: 'المحل',
    customer: 'الزبون',
    status: 'الحالة',
    no_sales_yet: 'لا توجد مبيعات بعد',
    print: 'طباعة',
    void: 'إلغاء',
    voided: 'ملغى',
    completed: 'مكتمل',
    sale_completed: 'تمت عملية البيع',
    cart_is_empty_warning: 'السلة فارغة',
    not_enough_stock: 'الكمية غير متوفرة بالمخزون',
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
