class MSyncApp {
  constructor() {
    this.token = sessionStorage.getItem('msync_token') || null;
    this.currentUser = JSON.parse(sessionStorage.getItem('msync_user') || 'null');
    this.currentPage = 'dashboard';
    this.cart = [];
    this.products = [];
    this.init();
  }

  init() {
    document.getElementById('loginForm').addEventListener('submit', (e) => { e.preventDefault(); this.login(); });
    if (this.token && this.currentUser) {
      this.showMainApp();
    } else {
      this.renderLogin();
    }
  }

  // ---------- Screen switching (login / register warehouse / super admin) ----------
  hideAllScreens() {
    ['loginScreen', 'registerWarehouseScreen', 'superAdminLoginScreen', 'superAdminApp', 'mainApp'].forEach(id => {
      document.getElementById(id).classList.add('hidden');
    });
  }

  showLogin() {
    this.hideAllScreens();
    document.getElementById('loginScreen').classList.remove('hidden');
  }

  showRegisterWarehouse() {
    this.hideAllScreens();
    document.getElementById('registerWarehouseScreen').classList.remove('hidden');
  }

  showSuperAdminLogin() {
    this.hideAllScreens();
    document.getElementById('superAdminLoginScreen').classList.remove('hidden');
  }

  // ---------- API helper ----------
  async api(path, { method = 'GET', body = null } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = 'Bearer ' + this.token;

    let res;
    try {
      res = await fetch(API_BASE + path, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      });
    } catch (err) {
      document.getElementById('connStatus') && (document.getElementById('connStatus').textContent = 'Offline');
      throw new Error('Could not reach the server. Check your connection.');
    }

    let data = null;
    try { data = await res.json(); } catch (e) { /* no body */ }

    if (res.status === 401) {
      this.showToast('Your session expired, please log in again', 'error');
      this.logout(true);
      throw new Error('Not authenticated');
    }
    if (!res.ok) {
      throw new Error((data && data.error) || `Request failed (${res.status})`);
    }
    return data;
  }

  // ---------- Auth ----------
  async login() {
    const email = document.getElementById('emailInput').value.trim();
    const password = document.getElementById('passwordInput').value;
    const errBox = document.getElementById('loginError');
    const btn = document.getElementById('loginBtn');
    errBox.classList.add('hidden');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Signing in...';

    try {
      const data = await this.api('/auth/login', { method: 'POST', body: { email, password } });
      this.token = data.token;
      this.currentUser = data.user;
      sessionStorage.setItem('msync_token', this.token);
      sessionStorage.setItem('msync_user', JSON.stringify(this.currentUser));
      if (data.user.must_change_password) {
        this.showMainApp();
        this.openChangePassword(true);
      } else {
        this.showMainApp();
      }
    } catch (err) {
      errBox.textContent = err.message;
      errBox.classList.remove('hidden');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i> Sign In';
    }
  }

  async logout(skipApiCall) {
    if (!skipApiCall) { try { await this.api('/auth/logout', { method: 'POST' }); } catch (e) {} }
    this.token = null;
    this.currentUser = null;
    sessionStorage.removeItem('msync_token');
    sessionStorage.removeItem('msync_user');
    this.renderLogin();
  }

  renderLogin() {
    this.showLogin();
    document.getElementById('loginForm').reset();
  }

  showMainApp() {
    this.hideAllScreens();
    document.getElementById('mainApp').classList.remove('hidden');
    document.getElementById('userRoleDisplay').textContent =
      this.currentUser.role.charAt(0).toUpperCase() + this.currentUser.role.slice(1);
    document.getElementById('userName').textContent = this.currentUser.full_name;
    document.getElementById('userEmail').textContent = this.currentUser.email;
    document.getElementById('warehouseNameDisplay').textContent = this.currentUser.warehouse_name || '—';
    this.renderSidebar();
    this.navigate('dashboard');
  }

  togglePassword(inputId, icon) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') { input.type = 'text'; icon.classList.replace('fa-eye', 'fa-eye-slash'); }
    else { input.type = 'password'; icon.classList.replace('fa-eye-slash', 'fa-eye'); }
  }

  // ---------- Navigation ----------
  renderSidebar() {
    const nav = document.getElementById('sidebarNav');
    const role = this.currentUser.role;
    const items = [
      { id: 'dashboard', icon: 'fa-chart-line', label: 'Dashboard', roles: ['owner', 'admin', 'salesman'] },
      { id: 'products', icon: 'fa-boxes', label: 'Products', roles: ['owner', 'admin', 'salesman'] },
      { id: 'new-sale', icon: 'fa-cash-register', label: 'New Sale', roles: ['owner', 'admin', 'salesman'] },
      { id: 'sales', icon: 'fa-receipt', label: 'Sales History', roles: ['owner', 'admin', 'salesman'] },
      { id: 'targets', icon: 'fa-bullseye', label: 'Target vs Achieved', roles: ['owner', 'admin'] },
      { id: 'reports', icon: 'fa-chart-pie', label: 'Reports', roles: ['owner', 'admin'] },
      { id: 'customers', icon: 'fa-address-book', label: 'Customers', roles: ['owner', 'admin'] },
      { id: 'coupons', icon: 'fa-tags', label: 'Discounts & Coupons', roles: ['owner', 'admin'] },
      { id: 'credit', icon: 'fa-hand-holding-dollar', label: 'Credit', roles: ['owner', 'admin'] },
      { id: 'suppliers', icon: 'fa-truck', label: 'Suppliers', roles: ['owner', 'admin'] },
      { id: 'purchase-orders', icon: 'fa-dolly', label: 'Purchase Orders', roles: ['owner', 'admin'] },
      { id: 'shops', icon: 'fa-store', label: 'Shops', roles: ['owner', 'admin'] },
      { id: 'inventory', icon: 'fa-clipboard-list', label: 'Inventory Logs', roles: ['owner', 'admin'] },
      { id: 'users', icon: 'fa-users', label: 'Team Management', roles: ['owner'] },
      { id: 'audit', icon: 'fa-shield-alt', label: 'Audit Logs', roles: ['owner'] },
    ];
    nav.innerHTML = items.filter(i => i.roles.includes(role)).map(item => `
      <button onclick="app.navigate('${item.id}')" class="sidebar-item w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 ${this.currentPage === item.id ? 'active' : 'text-gray-600'}">
        <i class="fas ${item.icon} w-5"></i><span class="font-medium">${item.label}</span>
      </button>`).join('');
  }

  navigate(page) {
    // Stop any auto-refresh running for whatever page we're leaving
    if (this._autoRefreshTimer) { clearInterval(this._autoRefreshTimer); this._autoRefreshTimer = null; }

    this.currentPage = page;
    this.renderSidebar();
    const titles = {
      'dashboard': ['Dashboard', 'Overview of sales and stock'],
      'products': ['Products', 'Manage inventory and stock levels'],
      'new-sale': ['New Sale', 'Create invoice and process order'],
      'sales': ['Sales History', 'View and track all transactions'],
      'targets': ['Target vs Achieved', 'Monthly SKU sales performance'],
      'reports': ['Reports', 'Sales analytics, profit margins, and exports'],
      'customers': ['Customers', 'Manage customers, order history, and credit'],
      'coupons': ['Discounts & Coupons', 'Create and manage discount codes'],
      'credit': ['Credit', 'Shops that owe money and payment tracking'],
      'suppliers': ['Suppliers', 'Manage your suppliers'],
      'purchase-orders': ['Purchase Orders', 'Order and restock inventory from suppliers'],
      'shops': ['Shops', 'Manage shop locations and details'],
      'inventory': ['Inventory Logs', 'Track all stock movements'],
      'users': ['Team Management', 'Manage users and permissions'],
      'audit': ['Audit Logs', 'System activity and security trail']
    };
    document.getElementById('pageTitle').textContent = titles[page][0];
    document.getElementById('pageSubtitle').textContent = titles[page][1];
    const content = document.getElementById('pageContent');
    content.innerHTML = '<div class="flex items-center justify-center h-64"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>';

    const renderers = {
      'dashboard': () => this.renderDashboard(),
      'products': () => this.renderProducts(),
      'new-sale': () => this.renderNewSale(),
      'sales': () => this.renderSales(),
      'targets': () => this.renderTargets(),
      'reports': () => this.renderReports(),
      'customers': () => this.renderCustomers(),
      'coupons': () => this.renderCoupons(),
      'credit': () => this.renderCredit(),
      'suppliers': () => this.renderSuppliers(),
      'purchase-orders': () => this.renderPurchaseOrders(),
      'shops': () => this.renderShops(),
      'inventory': () => this.renderInventory(),
      'users': () => this.renderUsers(),
      'audit': () => this.renderAudit(),
    };
    (renderers[page] || (() => {}))().catch(err => {
      content.innerHTML = `<div class="text-center text-red-600 py-12"><i class="fas fa-exclamation-triangle text-3xl mb-3"></i><p>${err.message}</p></div>`;
    });

    // Auto-refresh: these pages show data that changes as salesmen make
    // sales elsewhere, so quietly reload them every 20 seconds while open.
    // Skipped while a modal is open, so it never interrupts someone mid-edit.
    const autoRefreshPages = ['dashboard', 'sales', 'products', 'targets', 'credit'];
    if (autoRefreshPages.includes(page)) {
      this._autoRefreshTimer = setInterval(() => {
        const modalOpen = !document.getElementById('modalContainer').classList.contains('hidden');
        if (this.currentPage === page && !modalOpen) {
          (renderers[page] || (() => {}))().catch(() => {});
        }
      }, 20000);
    }
  }

  refreshCurrentPage() { this.navigate(this.currentPage); }

  closeModal() { document.getElementById('modalContainer').classList.add('hidden'); }

  showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    const colors = { success: 'bg-green-500', error: 'bg-red-500', warning: 'bg-yellow-500' };
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle' };
    toast.className = `toast ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2`;
    toast.innerHTML = `<i class="fas ${icons[type]}"></i><span class="font-medium">${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }

  fmt(n) { return '$' + Number(n).toFixed(2); }
  esc(s) { const d = document.createElement('div'); d.textContent = s ?? ''; return d.innerHTML; }
}
