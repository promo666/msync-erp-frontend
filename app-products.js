MSyncApp.prototype.renderProducts = async function () {
  this.products = await this.api('/products');
  const canManage = this.currentUser.role === 'owner' || this.currentUser.role === 'admin';
  const content = document.getElementById('pageContent');
  content.innerHTML = `
  <div class="fade-in space-y-4">
    <div class="flex justify-between items-center">
      <input id="productSearch" oninput="app.filterProducts()" placeholder="${t('search_products')}" class="px-4 py-2 border border-gray-300 rounded-lg w-64 outline-none focus:ring-2 focus:ring-blue-500">
      <div class="flex gap-2">
        <button onclick="app.exportProductsExcel()" class="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"><i class="fas fa-file-excel mr-2"></i>${t('export_excel')}</button>
        ${canManage ? `<button onclick="app.openProductModal()" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"><i class="fas fa-plus mr-2"></i>${t('add_product')}</button>` : ''}
      </div>
    </div>
    <div class="glass-panel rounded-xl shadow-sm overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50"><tr class="text-left text-gray-500">
          <th class="p-3">${t('sku')}</th><th class="p-3">${t('name')}</th><th class="p-3">${t('category')}</th>
          <th class="p-3 text-right">${t('price')}</th>
          ${canManage ? `<th class="p-3 text-right">${t('cost')}</th><th class="p-3 text-right">${t('margin')}</th>` : ''}
          <th class="p-3 text-right">${t('stock')}</th>
          ${canManage ? `<th class="p-3 text-right">${t('actions')}</th>` : ''}
        </tr></thead>
        <tbody id="productsTableBody"></tbody>
      </table>
    </div>
  </div>`;
  this.filterProducts();
};

MSyncApp.prototype.exportProductsExcel = function () {
  const rows = this.products.map(p => ({
    SKU: p.sku, Barcode: p.barcode || '', Name: p.name, Category: p.category || '',
    'Unit Price': p.unit_price, 'Cost Price': p.cost_price || 0, 'Current Stock': p.current_stock,
    'Low Stock Threshold': p.low_stock_threshold, Active: p.is_active ? 'Yes' : 'No'
  }));
  this.exportToExcel(rows, 'Products', 'Products.xlsx');
};

MSyncApp.prototype.filterProducts = function () {
  const q = (document.getElementById('productSearch')?.value || '').toLowerCase();
  const canManage = this.currentUser.role === 'owner' || this.currentUser.role === 'admin';
  const rows = this.products
    .filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
    .map(p => {
      const low = p.current_stock <= p.low_stock_threshold;
      const margin = p.unit_price > 0 ? ((p.unit_price - (p.cost_price || 0)) / p.unit_price) * 100 : 0;
      return `<tr class="transaction-row border-b border-gray-50">
        <td class="p-3 font-mono text-xs text-gray-500">${this.esc(p.sku)}</td>
        <td class="p-3 font-medium">${this.esc(p.name)}</td>
        <td class="p-3 text-gray-500">${this.esc(p.category || '-')}</td>
        <td class="p-3 text-right">${this.fmt(p.unit_price)}</td>
        ${canManage ? `<td class="p-3 text-right text-gray-500">${this.fmt(p.cost_price || 0)}</td>
        <td class="p-3 text-right ${margin < 15 ? 'text-red-600' : 'text-green-600'}">${margin.toFixed(1)}%</td>` : ''}
        <td class="p-3 text-right"><span class="px-2 py-1 rounded-full text-xs font-medium ${low ? 'stock-low' : 'stock-ok'}">${p.current_stock}</span></td>
        ${canManage ? `<td class="p-3 text-right space-x-2">
          <button onclick="app.openProductModal('${p.id}')" class="text-blue-600 hover:underline text-xs">${t('edit')}</button>
          <button onclick="app.openStockAdjustModal('${p.id}')" class="text-indigo-600 hover:underline text-xs">${t('adjust_stock')}</button>
        </td>` : ''}
      </tr>`;
    }).join('');
  document.getElementById('productsTableBody').innerHTML = rows || `<tr><td colspan="8" class="p-6 text-center text-gray-400">${t('no_products_found')}</td></tr>`;
};

MSyncApp.prototype.openProductModal = function (productId) {
  const p = productId ? this.products.find(x => x.id === productId) : null;
  document.getElementById('modalContent').innerHTML = `
  <div class="p-6">
    <h3 class="text-lg font-bold mb-4">${p ? t('edit_product') : t('add_product')}</h3>
    <form id="productForm" class="space-y-3">
      <div class="grid grid-cols-2 gap-3">
        <div><label class="block text-sm font-medium mb-1">${t('sku')}</label><input name="sku" value="${p ? this.esc(p.sku) : ''}" ${p ? 'readonly' : ''} required class="w-full px-3 py-2 border rounded-lg ${p ? 'bg-gray-100' : ''}"></div>
        <div><label class="block text-sm font-medium mb-1">${t('category')}</label><input name="category" value="${p ? this.esc(p.category || '') : ''}" class="w-full px-3 py-2 border rounded-lg"></div>
      </div>
      <div><label class="block text-sm font-medium mb-1">${t('barcode')}</label>
        <div class="flex gap-2">
          <input id="productBarcodeInput" name="barcode" value="${p ? this.esc(p.barcode || '') : ''}" class="flex-1 px-3 py-2 border rounded-lg" placeholder="${t('barcode_placeholder')}">
          <button type="button" onclick="app.openBarcodeScanner(code => document.getElementById('productBarcodeInput').value = code)" class="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"><i class="fas fa-barcode"></i></button>
        </div>
      </div>
      <div><label class="block text-sm font-medium mb-1">${t('name')}</label><input name="name" value="${p ? this.esc(p.name) : ''}" required class="w-full px-3 py-2 border rounded-lg"></div>
      <div><label class="block text-sm font-medium mb-1">${t('description')}</label><textarea name="description" class="w-full px-3 py-2 border rounded-lg">${p ? this.esc(p.description || '') : ''}</textarea></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="block text-sm font-medium mb-1">${t('unit_price')}</label><input type="number" step="0.01" name="unit_price" value="${p ? p.unit_price : ''}" required class="w-full px-3 py-2 border rounded-lg"></div>
        <div><label class="block text-sm font-medium mb-1">${t('cost_price')}</label><input type="number" step="0.01" name="cost_price" value="${p ? (p.cost_price || 0) : ''}" class="w-full px-3 py-2 border rounded-lg" placeholder="0.00"></div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="block text-sm font-medium mb-1">${t('low_stock_alert_below')}</label><input type="number" name="low_stock_threshold" value="${p ? p.low_stock_threshold : 5}" class="w-full px-3 py-2 border rounded-lg"></div>
        ${!p ? `<div><label class="block text-sm font-medium mb-1">${t('initial_stock')}</label><input type="number" name="current_stock" value="0" class="w-full px-3 py-2 border rounded-lg"></div>` : '<div></div>'}
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="block text-sm font-medium mb-1">${t('monthly_target')}</label><input type="number" name="monthly_target" value="${p ? p.monthly_target : 0}" class="w-full px-3 py-2 border rounded-lg"></div>
        <div><label class="block text-sm font-medium mb-1">${t('quarterly_target')}</label><input type="number" name="quarterly_target" value="${p ? p.quarterly_target : 0}" class="w-full px-3 py-2 border rounded-lg"></div>
      </div>
      <div class="flex gap-3 pt-2">
        <button type="submit" class="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">${t('save')}</button>
        <button type="button" onclick="app.closeModal()" class="flex-1 bg-gray-100 py-2 rounded-lg hover:bg-gray-200">${t('cancel')}</button>
      </div>
    </form>
  </div>`;
  document.getElementById('modalContainer').classList.remove('hidden');
  document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    data.unit_price = parseFloat(data.unit_price);
    data.cost_price = data.cost_price !== '' ? parseFloat(data.cost_price) : 0;
    if (data.low_stock_threshold !== undefined) data.low_stock_threshold = parseInt(data.low_stock_threshold, 10);
    if (data.current_stock !== undefined) data.current_stock = parseInt(data.current_stock, 10);
    if (data.monthly_target !== undefined) data.monthly_target = parseInt(data.monthly_target, 10);
    if (data.quarterly_target !== undefined) data.quarterly_target = parseInt(data.quarterly_target, 10);
    try {
      if (p) await this.api(`/products/${p.id}`, { method: 'PUT', body: data });
      else await this.api('/products', { method: 'POST', body: data });
      this.showToast(p ? t('product_updated') : t('product_created'), 'success');
      this.closeModal();
      this.refreshCurrentPage();
    } catch (err) { this.showToast(err.message, 'error'); }
  });
};

MSyncApp.prototype.openStockAdjustModal = function (productId) {
  const p = this.products.find(x => x.id === productId);
  document.getElementById('modalContent').innerHTML = `
  <div class="p-6">
    <h3 class="text-lg font-bold mb-1">${t('adjust_stock')}</h3>
    <p class="text-sm text-gray-500 mb-4">${this.esc(p.name)} — ${t('current_stock')}: ${p.current_stock}</p>
    <form id="stockForm" class="space-y-3">
      <div><label class="block text-sm font-medium mb-1">${t('change_qty')}</label><input type="number" name="quantity_change" required class="w-full px-3 py-2 border rounded-lg" placeholder="${t('change_qty_placeholder')}"></div>
      <div><label class="block text-sm font-medium mb-1">${t('reason')}</label><input name="note" required class="w-full px-3 py-2 border rounded-lg" placeholder="${t('reason_placeholder')}"></div>
      <div class="flex gap-3 pt-2">
        <button type="submit" class="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">${t('apply_change')}</button>
        <button type="button" onclick="app.closeModal()" class="flex-1 bg-gray-100 py-2 rounded-lg hover:bg-gray-200">${t('cancel')}</button>
      </div>
    </form>
  </div>`;
  document.getElementById('modalContainer').classList.remove('hidden');
  document.getElementById('stockForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    data.quantity_change = parseInt(data.quantity_change, 10);
    try {
      await this.api(`/products/${p.id}/adjust-stock`, { method: 'POST', body: data });
      this.showToast(t('stock_adjusted'), 'success');
      this.closeModal();
      this.refreshCurrentPage();
    } catch (err) { this.showToast(err.message, 'error'); }
  });
};
