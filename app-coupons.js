MSyncApp.prototype.renderCoupons = async function () {
  const coupons = await this.api('/coupons');
  const content = document.getElementById('pageContent');
  content.innerHTML = `
  <div class="fade-in space-y-4">
    <button onclick="app.openCouponModal()" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"><i class="fas fa-plus mr-2"></i>Create Offer</button>
    <div class="glass-panel rounded-xl shadow-sm overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50"><tr class="text-left text-gray-500">
          <th class="p-3">Code</th><th class="p-3">Offer</th><th class="p-3">Uses</th><th class="p-3">Expires</th><th class="p-3">Status</th><th class="p-3 text-right">Actions</th>
        </tr></thead>
        <tbody>
          ${coupons.length === 0 ? '<tr><td colspan="6" class="p-6 text-center text-gray-400">No offers yet</td></tr>' : coupons.map(c => {
            const expired = c.expires_at && new Date(c.expires_at) < new Date();
            const usedUp = c.max_uses != null && c.uses_count >= c.max_uses;
            const offerLabel = c.type === 'percent' ? `${c.value}% off`
              : c.type === 'fixed' ? this.fmt(c.value) + ' off'
              : `Buy ${c.buy_qty} Get ${c.free_qty} Free — ${this.esc(c.product_name || 'product')}`;
            return `
          <tr class="transaction-row border-b border-gray-50">
            <td class="p-3 font-mono font-medium">${this.esc(c.code)}</td>
            <td class="p-3">${offerLabel}</td>
            <td class="p-3">${c.uses_count}${c.max_uses != null ? ' / ' + c.max_uses : ''}</td>
            <td class="p-3 text-gray-500">${c.expires_at ? new Date(c.expires_at).toLocaleDateString() : '—'}</td>
            <td class="p-3"><span class="px-2 py-0.5 rounded-full text-xs ${!c.is_active ? 'bg-red-100 text-red-700' : expired ? 'bg-gray-100 text-gray-600' : usedUp ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}">${!c.is_active ? 'Disabled' : expired ? 'Expired' : usedUp ? 'Used Up' : 'Active'}</span></td>
            <td class="p-3 text-right space-x-2">
              <button onclick="app.openCouponModal('${c.id}')" class="text-blue-600 hover:underline text-xs">Edit</button>
              <button onclick="app.deleteCoupon('${c.id}')" class="text-red-600 hover:underline text-xs">Delete</button>
            </td>
          </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
  this._couponsCache = coupons;
};

MSyncApp.prototype.deleteCoupon = async function (couponId) {
  if (!confirm('Delete this offer? This cannot be undone (past sales that used it keep their history either way).')) return;
  try {
    await this.api(`/coupons/${couponId}`, { method: 'DELETE' });
    this.showToast('Offer deleted', 'success');
    this.refreshCurrentPage();
  } catch (err) { this.showToast(err.message, 'error'); }
};

MSyncApp.prototype.openCouponModal = async function (couponId) {
  const c = couponId ? (this._couponsCache || []).find(x => x.id === couponId) : null;
  const products = await this.api('/products');

  document.getElementById('modalContent').innerHTML = `
  <div class="p-6">
    <h3 class="text-lg font-bold mb-4">${c ? 'Edit Offer' : 'Create Offer'}</h3>
    <form id="couponForm" class="space-y-3">
      <div><label class="block text-sm font-medium mb-1">Code</label><input name="code" value="${c ? this.esc(c.code) : ''}" ${c ? 'readonly' : ''} required class="w-full px-3 py-2 border rounded-lg uppercase ${c ? 'bg-gray-100' : ''}" placeholder="e.g. SAVE10"></div>

      <div><label class="block text-sm font-medium mb-1">Offer Type</label>
        <select id="couponTypeSelect" name="type" ${c ? 'disabled' : ''} onchange="app.onCouponTypeChange()" class="w-full px-3 py-2 border rounded-lg ${c ? 'bg-gray-100' : ''}">
          <option value="percent" ${c && c.type === 'percent' ? 'selected' : ''}>Percentage Off (whole cart)</option>
          <option value="fixed" ${c && c.type === 'fixed' ? 'selected' : ''}>Fixed Amount Off (whole cart)</option>
          <option value="bogo" ${c && c.type === 'bogo' ? 'selected' : ''}>Buy X, Get Y Free (specific product)</option>
        </select>
      </div>

      <div id="percentFixedFields" class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div><label class="block text-sm font-medium mb-1">Value</label><input type="number" step="0.01" min="0.01" name="value" value="${c && c.type !== 'bogo' ? c.value : ''}" class="w-full px-3 py-2 border rounded-lg" placeholder="e.g. 10"></div>
          <div><label class="block text-sm font-medium mb-1">Min Purchase (optional)</label><input type="number" step="0.01" min="0" name="min_purchase" value="${c ? c.min_purchase : 0}" class="w-full px-3 py-2 border rounded-lg"></div>
        </div>
      </div>

      <div id="bogoFields" class="space-y-3 hidden">
        <div><label class="block text-sm font-medium mb-1">Product</label>
          <select name="applies_to_product_id" ${c ? 'disabled' : ''} class="w-full px-3 py-2 border rounded-lg ${c ? 'bg-gray-100' : ''}">
            <option value="">Select a product...</option>
            ${products.map(p => `<option value="${p.id}" ${c && c.applies_to_product_id === p.id ? 'selected' : ''}>${this.esc(p.name)} (${this.esc(p.sku)})</option>`).join('')}
          </select>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="block text-sm font-medium mb-1">Buy Quantity</label><input type="number" min="1" name="buy_qty" value="${c && c.buy_qty ? c.buy_qty : 5}" class="w-full px-3 py-2 border rounded-lg" placeholder="e.g. 5"></div>
          <div><label class="block text-sm font-medium mb-1">Free Quantity</label><input type="number" min="1" name="free_qty" value="${c && c.free_qty ? c.free_qty : 1}" class="w-full px-3 py-2 border rounded-lg" placeholder="e.g. 1"></div>
        </div>
        <p class="text-xs text-gray-400">Example: Buy 5, Get 1 Free means every 6 units in the cart, 1 is free.</p>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div><label class="block text-sm font-medium mb-1">Max Uses (optional)</label><input type="number" min="1" name="max_uses" value="${c && c.max_uses != null ? c.max_uses : ''}" class="w-full px-3 py-2 border rounded-lg" placeholder="Unlimited"></div>
        <div><label class="block text-sm font-medium mb-1">Expiry Date (optional)</label><input type="date" name="expires_at" value="${c && c.expires_at ? c.expires_at.slice(0, 10) : ''}" class="w-full px-3 py-2 border rounded-lg"></div>
      </div>
      ${c ? `<div><label class="flex items-center gap-2 text-sm"><input type="checkbox" name="is_active" ${c.is_active ? 'checked' : ''}> Active</label></div>` : ''}
      <div class="flex gap-3 pt-2">
        <button type="submit" class="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Save</button>
        <button type="button" onclick="app.closeModal()" class="flex-1 bg-gray-100 py-2 rounded-lg hover:bg-gray-200">Cancel</button>
      </div>
    </form>
  </div>`;
  document.getElementById('modalContainer').classList.remove('hidden');
  this.onCouponTypeChange(c ? c.type : 'percent');

  document.getElementById('couponForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    if (data.value !== undefined) data.value = data.value ? parseFloat(data.value) : 0;
    data.min_purchase = data.min_purchase ? parseFloat(data.min_purchase) : 0;
    data.max_uses = data.max_uses ? parseInt(data.max_uses, 10) : null;
    data.expires_at = data.expires_at || null;
    if (data.buy_qty !== undefined) data.buy_qty = data.buy_qty ? parseInt(data.buy_qty, 10) : null;
    if (data.free_qty !== undefined) data.free_qty = data.free_qty ? parseInt(data.free_qty, 10) : null;
    if (c) data.is_active = fd.has('is_active');
    try {
      if (c) await this.api(`/coupons/${c.id}`, { method: 'PUT', body: data });
      else await this.api('/coupons', { method: 'POST', body: data });
      this.showToast(c ? 'Offer updated' : 'Offer created', 'success');
      this.closeModal();
      this.refreshCurrentPage();
    } catch (err) { this.showToast(err.message, 'error'); }
  });
};

MSyncApp.prototype.onCouponTypeChange = function (forcedType) {
  const type = forcedType || document.getElementById('couponTypeSelect').value;
  const isBogo = type === 'bogo';
  document.getElementById('percentFixedFields').classList.toggle('hidden', isBogo);
  document.getElementById('bogoFields').classList.toggle('hidden', !isBogo);
};
