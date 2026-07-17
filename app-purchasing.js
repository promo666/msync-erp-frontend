// ---------- Suppliers ----------
MSyncApp.prototype.renderSuppliers = async function () {
  const suppliers = await this.api('/suppliers');
  const content = document.getElementById('pageContent');
  content.innerHTML = `
  <div class="fade-in space-y-4">
    <div class="flex gap-2">
      <button onclick="app.exportSuppliersExcel()" class="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"><i class="fas fa-file-excel mr-2"></i>${t('export_excel')}</button>
      <button onclick="app.openSupplierModal()" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"><i class="fas fa-plus mr-2"></i>${t('add_supplier')}</button>
    </div>
    <div class="glass-panel rounded-xl shadow-sm overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50"><tr class="text-left text-gray-500">
          <th class="p-3">${t('name')}</th><th class="p-3">${t('contact')}</th><th class="p-3">${t('phone')}</th><th class="p-3">${t('email')}</th><th class="p-3">${t('status')}</th><th class="p-3 text-right">${t('actions')}</th>
        </tr></thead>
        <tbody>
          ${suppliers.length === 0 ? `<tr><td colspan="6" class="p-6 text-center text-gray-400">${t('no_suppliers_yet')}</td></tr>` : suppliers.map(s => `
          <tr class="transaction-row border-b border-gray-50">
            <td class="p-3 font-medium">${this.esc(s.name)}</td>
            <td class="p-3 text-gray-500">${this.esc(s.contact_name || '-')}</td>
            <td class="p-3 text-gray-500">${this.esc(s.phone || '-')}</td>
            <td class="p-3 text-gray-500">${this.esc(s.email || '-')}</td>
            <td class="p-3"><span class="px-2 py-0.5 rounded-full text-xs ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">${s.is_active ? t('active') : t('inactive')}</span></td>
            <td class="p-3 text-right"><button onclick="app.openSupplierModal('${s.id}')" class="text-blue-600 hover:underline text-xs">${t('edit')}</button></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
  this._suppliersCache = suppliers;
};

MSyncApp.prototype.exportSuppliersExcel = function () {
  const rows = (this._suppliersCache || []).map(s => ({
    Name: s.name, Contact: s.contact_name || '', Phone: s.phone || '', Email: s.email || '',
    Address: s.address || '', Active: s.is_active ? 'Yes' : 'No'
  }));
  this.exportToExcel(rows, 'Suppliers', 'Suppliers.xlsx');
};

MSyncApp.prototype.openSupplierModal = function (supplierId) {
  const s = supplierId ? (this._suppliersCache || []).find(x => x.id === supplierId) : null;
  document.getElementById('modalContent').innerHTML = `
  <div class="p-6">
    <h3 class="text-lg font-bold mb-4">${s ? t('edit_supplier') : t('add_supplier')}</h3>
    <form id="supplierForm" class="space-y-3">
      <div><label class="block text-sm font-medium mb-1">${t('supplier_name')}</label><input name="name" value="${s ? this.esc(s.name) : ''}" required class="w-full px-3 py-2 border rounded-lg"></div>
      <div><label class="block text-sm font-medium mb-1">${t('contact_person')}</label><input name="contact_name" value="${s ? this.esc(s.contact_name || '') : ''}" class="w-full px-3 py-2 border rounded-lg"></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="block text-sm font-medium mb-1">${t('phone')}</label><input name="phone" value="${s ? this.esc(s.phone || '') : ''}" class="w-full px-3 py-2 border rounded-lg"></div>
        <div><label class="block text-sm font-medium mb-1">${t('email')}</label><input type="email" name="email" value="${s ? this.esc(s.email || '') : ''}" class="w-full px-3 py-2 border rounded-lg"></div>
      </div>
      <div><label class="block text-sm font-medium mb-1">${t('address')}</label><textarea name="address" class="w-full px-3 py-2 border rounded-lg">${s ? this.esc(s.address || '') : ''}</textarea></div>
      ${s ? `<div><label class="flex items-center gap-2 text-sm"><input type="checkbox" name="is_active" ${s.is_active ? 'checked' : ''}> ${t('active')}</label></div>` : ''}
      <div class="flex gap-3 pt-2">
        <button type="submit" class="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">${t('save')}</button>
        <button type="button" onclick="app.closeModal()" class="flex-1 bg-gray-100 py-2 rounded-lg hover:bg-gray-200">${t('cancel')}</button>
      </div>
    </form>
  </div>`;
  document.getElementById('modalContainer').classList.remove('hidden');
  document.getElementById('supplierForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    if (s) data.is_active = fd.has('is_active');
    try {
      if (s) await this.api(`/suppliers/${s.id}`, { method: 'PUT', body: data });
      else await this.api('/suppliers', { method: 'POST', body: data });
      this.showToast(s ? t('supplier_updated') : t('supplier_created'), 'success');
      this.closeModal();
      this.refreshCurrentPage();
    } catch (err) { this.showToast(err.message, 'error'); }
  });
};

// ---------- Purchase Orders ----------
MSyncApp.prototype.renderPurchaseOrders = async function () {
  const orders = await this.api('/purchase-orders');
  const content = document.getElementById('pageContent');
  const statusColor = { pending: 'bg-yellow-100 text-yellow-700', received: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700' };
  const statusLabel = { pending: t('pending'), received: t('received'), cancelled: t('cancelled') };
  content.innerHTML = `
  <div class="fade-in space-y-4">
    <button onclick="app.openCreatePOModal()" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"><i class="fas fa-plus mr-2"></i>${t('new_purchase_order')}</button>
    <div class="glass-panel rounded-xl shadow-sm overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50"><tr class="text-left text-gray-500">
          <th class="p-3">${t('order_number')}</th><th class="p-3">${t('supplier')}</th><th class="p-3">${t('date')}</th><th class="p-3 text-right">${t('total')}</th><th class="p-3">${t('status')}</th><th class="p-3 text-right">${t('actions')}</th>
        </tr></thead>
        <tbody>
          ${orders.length === 0 ? `<tr><td colspan="6" class="p-6 text-center text-gray-400">${t('no_purchase_orders_yet')}</td></tr>` : orders.map(po => `
          <tr class="transaction-row border-b border-gray-50">
            <td class="p-3 font-mono text-xs">${this.esc(po.order_number)}</td>
            <td class="p-3">${this.esc(po.supplier_name)}</td>
            <td class="p-3 text-gray-500">${new Date(po.created_at).toLocaleString()}</td>
            <td class="p-3 text-right font-medium">${this.fmt(po.total_amount)}</td>
            <td class="p-3"><span class="px-2 py-1 rounded-full text-xs ${statusColor[po.status]}">${statusLabel[po.status]}</span></td>
            <td class="p-3 text-right space-x-2">
              <button onclick="app.viewPODetail('${po.id}')" class="text-blue-600 hover:underline text-xs">${t('view')}</button>
              ${po.status === 'pending' ? `<button onclick="app.receivePO('${po.id}')" class="text-green-600 hover:underline text-xs">${t('mark_received')}</button>
              <button onclick="app.cancelPO('${po.id}')" class="text-red-600 hover:underline text-xs">${t('cancel')}</button>` : ''}
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
};

MSyncApp.prototype.openCreatePOModal = async function () {
  const [suppliers, products] = await Promise.all([this.api('/suppliers'), this.api('/products')]);
  const activeSuppliers = suppliers.filter(s => s.is_active);
  this._poLineItems = [];

  document.getElementById('modalContent').innerHTML = `
  <div class="p-6">
    <h3 class="text-lg font-bold mb-4">${t('new_purchase_order')}</h3>
    ${activeSuppliers.length === 0 ? `<p class="text-sm text-red-600 mb-3">${t('need_active_supplier')} <button onclick="app.closeModal(); app.openSupplierModal();" class="underline">${t('add_one_now')}</button>.</p>` : ''}
    <form id="poForm" class="space-y-3">
      <div><label class="block text-sm font-medium mb-1">${t('supplier')}</label>
        <select name="supplier_id" required class="w-full px-3 py-2 border rounded-lg">
          <option value="">${t('select_supplier')}</option>
          ${activeSuppliers.map(s => `<option value="${s.id}">${this.esc(s.name)}</option>`).join('')}
        </select>
      </div>

      <div class="border rounded-lg p-3">
        <label class="block text-sm font-medium mb-2">${t('add_items')}</label>
        <div class="flex gap-2 mb-2">
          <select id="poProductSelect" class="flex-1 px-3 py-2 border rounded-lg text-sm">
            <option value="">${t('select_product_ellipsis')}</option>
            ${products.map(p => `<option value="${p.id}" data-cost="${p.cost_price || 0}">${this.esc(p.name)} (${this.esc(p.sku)})</option>`).join('')}
          </select>
          <input id="poQty" type="number" min="1" value="1" class="w-20 px-2 py-2 border rounded-lg text-sm" placeholder="${t('qty')}">
          <input id="poCost" type="number" min="0" step="0.01" class="w-24 px-2 py-2 border rounded-lg text-sm" placeholder="${t('unit_cost')}">
          <button type="button" onclick="app.addPOLineItem()" class="px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200">${t('add')}</button>
        </div>
        <div id="poLineItemsList" class="text-sm space-y-1"></div>
      </div>

      <div><label class="block text-sm font-medium mb-1">${t('notes_optional')}</label><textarea name="notes" class="w-full px-3 py-2 border rounded-lg"></textarea></div>
      <div class="flex gap-3 pt-2">
        <button type="submit" class="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">${t('create_purchase_order')}</button>
        <button type="button" onclick="app.closeModal()" class="flex-1 bg-gray-100 py-2 rounded-lg hover:bg-gray-200">${t('cancel')}</button>
      </div>
    </form>
  </div>`;
  document.getElementById('modalContainer').classList.remove('hidden');

  document.getElementById('poProductSelect').addEventListener('change', (e) => {
    const opt = e.target.selectedOptions[0];
    document.getElementById('poCost').value = opt ? opt.dataset.cost : '';
  });

  document.getElementById('poForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (this._poLineItems.length === 0) { this.showToast(t('add_at_least_one_item'), 'warning'); return; }
    const supplier_id = e.target.supplier_id.value;
    const notes = e.target.notes.value.trim();
    const items = this._poLineItems.map(i => ({ product_id: i.product_id, quantity: i.quantity, unit_cost: i.unit_cost }));
    try {
      const po = await this.api('/purchase-orders', { method: 'POST', body: { supplier_id, items, notes } });
      this.showToast(`${t('purchase_order_created')} — ${po.order_number}`, 'success');
      this.closeModal();
      this.refreshCurrentPage();
    } catch (err) { this.showToast(err.message, 'error'); }
  });
};

MSyncApp.prototype.addPOLineItem = function () {
  const select = document.getElementById('poProductSelect');
  const opt = select.selectedOptions[0];
  const qty = parseInt(document.getElementById('poQty').value, 10);
  const cost = parseFloat(document.getElementById('poCost').value);
  if (!opt || !opt.value) { this.showToast(t('select_a_product_warning'), 'warning'); return; }
  if (!qty || qty <= 0) { this.showToast(t('enter_valid_quantity'), 'warning'); return; }
  if (Number.isNaN(cost) || cost < 0) { this.showToast(t('enter_valid_unit_cost'), 'warning'); return; }

  this._poLineItems.push({ product_id: opt.value, name: opt.textContent, quantity: qty, unit_cost: cost });
  this.renderPOLineItems();
  select.value = '';
  document.getElementById('poQty').value = 1;
  document.getElementById('poCost').value = '';
};

MSyncApp.prototype.removePOLineItem = function (index) {
  this._poLineItems.splice(index, 1);
  this.renderPOLineItems();
};

MSyncApp.prototype.renderPOLineItems = function () {
  const box = document.getElementById('poLineItemsList');
  if (this._poLineItems.length === 0) {
    box.innerHTML = `<p class="text-gray-400 text-xs">${t('no_items_added_yet')}</p>`;
    return;
  }
  const total = this._poLineItems.reduce((s, i) => s + i.quantity * i.unit_cost, 0);
  box.innerHTML = this._poLineItems.map((i, idx) => `
    <div class="flex justify-between items-center bg-gray-50 rounded px-2 py-1">
      <span>${this.esc(i.name)} — ${i.quantity} × ${this.fmt(i.unit_cost)} = ${this.fmt(i.quantity * i.unit_cost)}</span>
      <button type="button" onclick="app.removePOLineItem(${idx})" class="text-red-500 text-xs"><i class="fas fa-times"></i></button>
    </div>`).join('') + `<div class="text-right font-semibold pt-1">${t('total')}: ${this.fmt(total)}</div>`;
};

MSyncApp.prototype.viewPODetail = async function (poId) {
  const po = await this.api(`/purchase-orders/${poId}`);
  const statusColor = { pending: 'bg-yellow-100 text-yellow-700', received: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700' };
  const statusLabel = { pending: t('pending'), received: t('received'), cancelled: t('cancelled') };
  document.getElementById('modalContent').innerHTML = `
  <div class="p-6">
    <div class="flex justify-between items-start mb-4">
      <div>
        <h3 class="text-lg font-bold">${this.esc(po.order_number)}</h3>
        <p class="text-sm text-gray-500">${this.esc(po.supplier_name)} · ${new Date(po.created_at).toLocaleString()}</p>
      </div>
      <span class="px-2 py-1 rounded-full text-xs ${statusColor[po.status]}">${statusLabel[po.status]}</span>
    </div>
    <table class="w-full text-sm mb-3">
      <thead class="bg-gray-50"><tr class="text-left text-gray-500"><th class="p-2">${t('product')}</th><th class="p-2 text-right">${t('qty')}</th><th class="p-2 text-right">${t('unit_cost')}</th><th class="p-2 text-right">${t('subtotal_col')}</th></tr></thead>
      <tbody>${po.items.map(i => `<tr class="border-b border-gray-50"><td class="p-2">${this.esc(i.product_name)}</td><td class="p-2 text-right">${i.quantity}</td><td class="p-2 text-right">${this.fmt(i.unit_cost)}</td><td class="p-2 text-right">${this.fmt(i.subtotal)}</td></tr>`).join('')}</tbody>
    </table>
    <p class="text-right font-bold mb-4">${t('total')}: ${this.fmt(po.total_amount)}</p>
    ${po.notes ? `<p class="text-sm text-gray-500 mb-4"><strong>${t('notes')}:</strong> ${this.esc(po.notes)}</p>` : ''}
    <button type="button" onclick="app.closeModal()" class="w-full bg-gray-100 py-2 rounded-lg hover:bg-gray-200">${t('close')}</button>
  </div>`;
  document.getElementById('modalContainer').classList.remove('hidden');
};

MSyncApp.prototype.receivePO = async function (poId) {
  if (!confirm(t('mark_received_confirm'))) return;
  try {
    await this.api(`/purchase-orders/${poId}/receive`, { method: 'POST' });
    this.showToast(t('purchase_order_received'), 'success');
    this.refreshCurrentPage();
  } catch (err) { this.showToast(err.message, 'error'); }
};

MSyncApp.prototype.cancelPO = async function (poId) {
  if (!confirm(t('cancel_po_confirm'))) return;
  try {
    await this.api(`/purchase-orders/${poId}/cancel`, { method: 'POST' });
    this.showToast(t('purchase_order_cancelled'), 'success');
    this.refreshCurrentPage();
  } catch (err) { this.showToast(err.message, 'error'); }
};
