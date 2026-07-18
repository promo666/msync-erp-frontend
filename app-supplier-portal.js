// ---------- Supplier session handling (separate token, never mixed with warehouse or super-admin login) ----------
document.getElementById('supplierLoginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('supEmailInput').value.trim();
  const password = document.getElementById('supPasswordInput').value;
  const errBox = document.getElementById('supplierLoginError');
  const btn = document.getElementById('supplierLoginBtn');
  errBox.classList.add('hidden');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> ' + t('signing_in');

  try {
    const res = await fetch(API_BASE + '/supplier-portal/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || t('login_failed'));

    app.supplierToken = data.token;
    app.supplierInfo = data.supplier;
    sessionStorage.setItem('msync_supplier_token', app.supplierToken);
    sessionStorage.setItem('msync_supplier_info', JSON.stringify(app.supplierInfo));
    app.showSupplierApp();
  } catch (err) {
    errBox.textContent = err.message;
    errBox.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i> ' + t('sign_in');
  }
});

MSyncApp.prototype.checkSupplierSession = function () {
  const token = sessionStorage.getItem('msync_supplier_token');
  const info = JSON.parse(sessionStorage.getItem('msync_supplier_info') || 'null');
  if (token && info && !this.token) {
    this.supplierToken = token;
    this.supplierInfo = info;
    this.showSupplierApp();
  }
};

MSyncApp.prototype.supplierApi = async function (path, { method = 'GET', body = null } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (this.supplierToken) headers['Authorization'] = 'Bearer ' + this.supplierToken;
  let res;
  try {
    res = await fetch(API_BASE + '/supplier-portal' + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch (err) {
    throw new Error(t('could_not_reach_server'));
  }
  let data = null;
  try { data = await res.json(); } catch (e) {}
  if (res.status === 401) {
    this.supplierLogout(true);
    throw new Error(t('session_expired_relogin'));
  }
  if (!res.ok) throw new Error((data && data.error) || `Request failed (${res.status})`);
  return data;
};

MSyncApp.prototype.supplierLogout = function (skipMessage) {
  this.supplierToken = null;
  this.supplierInfo = null;
  sessionStorage.removeItem('msync_supplier_token');
  sessionStorage.removeItem('msync_supplier_info');
  this.showSupplierLogin();
  if (!skipMessage) this.showToast(t('logged_out'), 'success');
};

MSyncApp.prototype.showSupplierApp = function () {
  this.hideAllScreens();
  document.getElementById('supplierApp').classList.remove('hidden');
  document.getElementById('supplierPortalTitle').textContent = `${this.supplierInfo.name} — ${this.supplierInfo.warehouse_name}`;
  this.renderSupplierOrders();
};

// ---------- Purchase orders assigned to this supplier ----------
MSyncApp.prototype.renderSupplierOrders = async function () {
  const content = document.getElementById('supplierContent');
  content.innerHTML = '<div class="flex items-center justify-center h-64"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-700"></div></div>';

  try {
    const orders = await this.supplierApi('/purchase-orders');
    const statusColor = { pending: 'bg-yellow-100 text-yellow-700', received: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700' };
    const statusLabel = { pending: t('pending'), received: t('received'), cancelled: t('cancelled') };

    content.innerHTML = `
    <div class="fade-in space-y-4">
      <div class="glass-panel rounded-xl shadow-sm overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50"><tr class="text-left text-gray-500">
            <th class="p-3">${t('order_number')}</th><th class="p-3">${t('date')}</th><th class="p-3 text-right">${t('total')}</th><th class="p-3">${t('status')}</th><th class="p-3">${t('shipment')}</th><th class="p-3 text-right">${t('actions')}</th>
          </tr></thead>
          <tbody>
            ${orders.length === 0 ? `<tr><td colspan="6" class="p-6 text-center text-gray-400">${t('no_purchase_orders_yet')}</td></tr>` : orders.map(po => `
            <tr class="transaction-row border-b border-gray-50">
              <td class="p-3 font-mono text-xs">${this.esc(po.order_number)}</td>
              <td class="p-3 text-gray-500">${new Date(po.created_at).toLocaleString()}</td>
              <td class="p-3 text-right font-medium">${this.fmt(po.total_amount)}</td>
              <td class="p-3"><span class="px-2 py-1 rounded-full text-xs ${statusColor[po.status]}">${statusLabel[po.status]}</span></td>
              <td class="p-3">${po.shipment_status === 'loaded' ? `<span class="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">${t('loaded_status')}</span>` : `<span class="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">${t('awaiting_status')}</span>`}</td>
              <td class="p-3 text-right space-x-2">
                <button onclick="app.viewSupplierPODetail('${po.id}')" class="text-blue-600 hover:underline text-xs">${t('view')}</button>
                ${po.status === 'pending' && po.shipment_status !== 'loaded' ? `<button onclick="app.openMarkLoadedModal('${po.id}')" class="text-teal-700 hover:underline text-xs">${t('mark_as_loaded')}</button>` : ''}
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
    this._supplierOrdersCache = orders;
  } catch (err) {
    content.innerHTML = `<div class="text-center text-red-600 py-12"><i class="fas fa-exclamation-triangle text-3xl mb-3"></i><p>${err.message}</p></div>`;
  }
};

MSyncApp.prototype.viewSupplierPODetail = function (poId) {
  const po = (this._supplierOrdersCache || []).find(x => x.id === poId);
  if (!po) return;
  const statusColor = { pending: 'bg-yellow-100 text-yellow-700', received: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700' };
  const statusLabel = { pending: t('pending'), received: t('received'), cancelled: t('cancelled') };

  document.getElementById('modalContent').innerHTML = `
  <div class="p-6">
    <div class="flex justify-between items-start mb-4">
      <div>
        <h3 class="text-lg font-bold">${this.esc(po.order_number)}</h3>
        <p class="text-sm text-gray-500">${new Date(po.created_at).toLocaleString()}</p>
      </div>
      <span class="px-2 py-1 rounded-full text-xs ${statusColor[po.status]}">${statusLabel[po.status]}</span>
    </div>
    <table class="w-full text-sm mb-3">
      <thead class="bg-gray-50"><tr class="text-left text-gray-500"><th class="p-2">${t('product')}</th><th class="p-2 text-right">${t('qty')}</th><th class="p-2 text-right">${t('unit_cost')}</th><th class="p-2 text-right">${t('subtotal_col')}</th></tr></thead>
      <tbody>${po.items.map(i => `<tr class="border-b border-gray-50"><td class="p-2">${this.esc(i.product_name)}</td><td class="p-2 text-right">${i.quantity}</td><td class="p-2 text-right">${this.fmt(i.unit_cost)}</td><td class="p-2 text-right">${this.fmt(i.subtotal)}</td></tr>`).join('')}</tbody>
    </table>
    <p class="text-right font-bold mb-4">${t('total')}: ${this.fmt(po.total_amount)}</p>
    ${po.notes ? `<p class="text-sm text-gray-500 mb-4"><strong>${t('notes')}:</strong> ${this.esc(po.notes)}</p>` : ''}
    ${po.shipment_status === 'loaded' ? `
    <div class="border rounded-lg p-3 bg-blue-50 mb-4">
      <p class="text-sm font-semibold mb-1">${t('loaded_status')}</p>
      <p class="text-sm">${t('driver_name')}: ${this.esc(po.driver_name || '-')}</p>
      <p class="text-sm">${t('driver_phone')}: ${this.esc(po.driver_phone || '-')}</p>
      <p class="text-sm">${t('truck_number')}: ${this.esc(po.truck_number || '-')}</p>
      ${po.shipment_notes ? `<p class="text-sm">${t('notes')}: ${this.esc(po.shipment_notes)}</p>` : ''}
    </div>` : ''}
    <button type="button" onclick="app.closeModal()" class="w-full bg-gray-100 py-2 rounded-lg hover:bg-gray-200">${t('close')}</button>
  </div>`;
  document.getElementById('modalContainer').classList.remove('hidden');
};

MSyncApp.prototype.openMarkLoadedModal = function (poId) {
  document.getElementById('modalContent').innerHTML = `
  <div class="p-6">
    <h3 class="text-lg font-bold mb-4">${t('mark_as_loaded')}</h3>
    <form id="markLoadedForm" class="space-y-3">
      <div><label class="block text-sm font-medium mb-1">${t('driver_name')}</label><input name="driver_name" required class="w-full px-3 py-2 border rounded-lg"></div>
      <div><label class="block text-sm font-medium mb-1">${t('driver_phone')}</label><input name="driver_phone" required class="w-full px-3 py-2 border rounded-lg"></div>
      <div><label class="block text-sm font-medium mb-1">${t('truck_number')}</label><input name="truck_number" required class="w-full px-3 py-2 border rounded-lg"></div>
      <div><label class="block text-sm font-medium mb-1">${t('notes_optional')}</label><textarea name="shipment_notes" class="w-full px-3 py-2 border rounded-lg"></textarea></div>
      <div class="flex gap-3 pt-2">
        <button type="submit" class="flex-1 bg-teal-700 text-white py-2 rounded-lg hover:bg-teal-800">${t('confirm_loaded')}</button>
        <button type="button" onclick="app.closeModal()" class="flex-1 bg-gray-100 py-2 rounded-lg hover:bg-gray-200">${t('cancel')}</button>
      </div>
    </form>
  </div>`;
  document.getElementById('modalContainer').classList.remove('hidden');
  document.getElementById('markLoadedForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    try {
      await this.supplierApi(`/purchase-orders/${poId}/mark-loaded`, { method: 'POST', body: data });
      this.showToast(t('marked_loaded_success'), 'success');
      this.closeModal();
      this.renderSupplierOrders();
    } catch (err) { this.showToast(err.message, 'error'); }
  });
};
