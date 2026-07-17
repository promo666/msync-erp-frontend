MSyncApp.prototype.renderCustomers = async function () {
  const customers = await this.api('/customers');
  this._customersCache = customers;
  const content = document.getElementById('pageContent');
  content.innerHTML = `
  <div class="fade-in space-y-4">
    <div class="flex gap-2">
      <button onclick="app.exportCustomersExcel()" class="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"><i class="fas fa-file-excel mr-2"></i>Export Excel</button>
      <button onclick="app.openCustomerModal()" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"><i class="fas fa-plus mr-2"></i>Add Customer</button>
    </div>
    <div class="glass-panel rounded-xl shadow-sm overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50"><tr class="text-left text-gray-500">
          <th class="p-3">Name</th><th class="p-3">Phone</th><th class="p-3 text-right">Credit Limit</th><th class="p-3 text-right">Balance Owed</th><th class="p-3">Status</th><th class="p-3 text-right">Actions</th>
        </tr></thead>
        <tbody>
          ${customers.length === 0 ? '<tr><td colspan="6" class="p-6 text-center text-gray-400">No customers yet</td></tr>' : customers.map(c => `
          <tr class="transaction-row border-b border-gray-50">
            <td class="p-3 font-medium">${this.esc(c.name)}</td>
            <td class="p-3 text-gray-500">${this.esc(c.phone || '-')}</td>
            <td class="p-3 text-right">${c.credit_limit > 0 ? this.fmt(c.credit_limit) : '—'}</td>
            <td class="p-3 text-right ${c.credit_balance > 0 ? 'text-orange-600 font-semibold' : ''}">${this.fmt(c.credit_balance)}</td>
            <td class="p-3"><span class="px-2 py-0.5 rounded-full text-xs ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">${c.is_active ? 'Active' : 'Inactive'}</span></td>
            <td class="p-3 text-right space-x-2">
              <button onclick="app.viewCustomerDetail('${c.id}')" class="text-blue-600 hover:underline text-xs">View</button>
              <button onclick="app.openCustomerModal('${c.id}')" class="text-gray-600 hover:underline text-xs">Edit</button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
};

MSyncApp.prototype.exportCustomersExcel = function () {
  const rows = (this._customersCache || []).map(c => ({
    Name: c.name, Phone: c.phone || '', Email: c.email || '', Address: c.address || '',
    'Credit Limit': c.credit_limit, 'Balance Owed': c.credit_balance, Active: c.is_active ? 'Yes' : 'No'
  }));
  this.exportToExcel(rows, 'Customers', 'Customers.xlsx');
};

MSyncApp.prototype.openCustomerModal = function (customerId) {
  const c = customerId ? (this._customersCache || []).find(x => x.id === customerId) : null;
  document.getElementById('modalContent').innerHTML = `
  <div class="p-6">
    <h3 class="text-lg font-bold mb-4">${c ? 'Edit Customer' : 'Add Customer'}</h3>
    <form id="customerForm" class="space-y-3">
      <div><label class="block text-sm font-medium mb-1">Name</label><input name="name" value="${c ? this.esc(c.name) : ''}" required class="w-full px-3 py-2 border rounded-lg"></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="block text-sm font-medium mb-1">Phone</label><input name="phone" value="${c ? this.esc(c.phone || '') : ''}" class="w-full px-3 py-2 border rounded-lg"></div>
        <div><label class="block text-sm font-medium mb-1">Email</label><input type="email" name="email" value="${c ? this.esc(c.email || '') : ''}" class="w-full px-3 py-2 border rounded-lg"></div>
      </div>
      <div><label class="block text-sm font-medium mb-1">Address</label><textarea name="address" class="w-full px-3 py-2 border rounded-lg">${c ? this.esc(c.address || '') : ''}</textarea></div>
      <div><label class="block text-sm font-medium mb-1">Credit Limit <span class="text-gray-400 font-normal">(0 = no credit allowed)</span></label><input type="number" step="0.01" min="0" name="credit_limit" value="${c ? c.credit_limit : 0}" class="w-full px-3 py-2 border rounded-lg"></div>
      <div><label class="block text-sm font-medium mb-1">Notes</label><textarea name="notes" class="w-full px-3 py-2 border rounded-lg">${c ? this.esc(c.notes || '') : ''}</textarea></div>
      ${c ? `<div><label class="flex items-center gap-2 text-sm"><input type="checkbox" name="is_active" ${c.is_active ? 'checked' : ''}> Active</label></div>` : ''}
      <div class="flex gap-3 pt-2">
        <button type="submit" class="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Save</button>
        <button type="button" onclick="app.closeModal()" class="flex-1 bg-gray-100 py-2 rounded-lg hover:bg-gray-200">Cancel</button>
      </div>
    </form>
  </div>`;
  document.getElementById('modalContainer').classList.remove('hidden');
  document.getElementById('customerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    data.credit_limit = parseFloat(data.credit_limit) || 0;
    if (c) data.is_active = fd.has('is_active');
    try {
      if (c) await this.api(`/customers/${c.id}`, { method: 'PUT', body: data });
      else await this.api('/customers', { method: 'POST', body: data });
      this.showToast(c ? 'Customer updated' : 'Customer created', 'success');
      this.closeModal();
      this.refreshCurrentPage();
    } catch (err) { this.showToast(err.message, 'error'); }
  });
};

MSyncApp.prototype.viewCustomerDetail = async function (customerId) {
  const data = await this.api(`/customers/${customerId}/sales`);
  const { customer, sales, payments } = data;

  document.getElementById('modalContent').innerHTML = `
  <div class="p-6">
    <div class="flex justify-between items-start mb-4">
      <div>
        <h3 class="text-lg font-bold">${this.esc(customer.name)}</h3>
        <p class="text-sm text-gray-500">${this.esc(customer.phone || '')} ${customer.email ? '· ' + this.esc(customer.email) : ''}</p>
      </div>
      <div class="text-right">
        <p class="text-xs text-gray-500">Balance Owed</p>
        <p class="text-xl font-bold ${customer.credit_balance > 0 ? 'text-orange-600' : 'text-green-600'}">${this.fmt(customer.credit_balance)}</p>
        ${customer.credit_limit > 0 ? `<p class="text-xs text-gray-400">Limit: ${this.fmt(customer.credit_limit)}</p>` : ''}
      </div>
    </div>

    ${customer.credit_balance > 0 ? `
    <div class="border rounded-lg p-3 mb-4 bg-orange-50 flex items-center justify-between">
      <span class="text-sm">Record a payment to reduce this balance</span>
      <button onclick="app.openRecordPaymentModal('${customer.id}')" class="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-xs hover:bg-orange-700">Record Payment</button>
    </div>` : ''}

    <h4 class="font-semibold text-sm mb-2">Order History</h4>
    <table class="w-full text-sm mb-4">
      <thead class="bg-gray-50"><tr class="text-left text-gray-500"><th class="p-2">Invoice</th><th class="p-2">Date</th><th class="p-2">Payment</th><th class="p-2 text-right">Total</th></tr></thead>
      <tbody>${sales.length === 0 ? '<tr><td colspan="4" class="p-3 text-center text-gray-400">No orders yet</td></tr>' : sales.map(s => `
        <tr class="border-b border-gray-50"><td class="p-2 font-mono text-xs">${this.esc(s.invoice_number)}</td><td class="p-2 text-gray-500">${new Date(s.created_at).toLocaleDateString()}</td><td class="p-2">${s.payment_method === 'credit' ? 'Credit' : 'Cash'}</td><td class="p-2 text-right">${this.fmt(s.total_amount)}</td></tr>`).join('')}</tbody>
    </table>

    ${payments.length > 0 ? `
    <h4 class="font-semibold text-sm mb-2">Payment History</h4>
    <table class="w-full text-sm mb-4">
      <thead class="bg-gray-50"><tr class="text-left text-gray-500"><th class="p-2">Date</th><th class="p-2">Note</th><th class="p-2 text-right">Amount</th></tr></thead>
      <tbody>${payments.map(p => `<tr class="border-b border-gray-50"><td class="p-2 text-gray-500">${new Date(p.created_at).toLocaleDateString()}</td><td class="p-2">${this.esc(p.note || '-')}</td><td class="p-2 text-right text-green-600">${this.fmt(p.amount)}</td></tr>`).join('')}</tbody>
    </table>` : ''}

    <button type="button" onclick="app.closeModal()" class="w-full bg-gray-100 py-2 rounded-lg hover:bg-gray-200">Close</button>
  </div>`;
  document.getElementById('modalContainer').classList.remove('hidden');
};

MSyncApp.prototype.openRecordPaymentModal = function (customerId) {
  document.getElementById('modalContent').innerHTML = `
  <div class="p-6">
    <h3 class="text-lg font-bold mb-4">Record Payment</h3>
    <form id="paymentForm" class="space-y-3">
      <div><label class="block text-sm font-medium mb-1">Amount</label><input type="number" step="0.01" min="0.01" name="amount" required class="w-full px-3 py-2 border rounded-lg"></div>
      <div><label class="block text-sm font-medium mb-1">Note (optional)</label><input name="note" class="w-full px-3 py-2 border rounded-lg" placeholder="e.g. Cash payment received"></div>
      <div class="flex gap-3 pt-2">
        <button type="submit" class="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">Record Payment</button>
        <button type="button" onclick="app.viewCustomerDetail('${customerId}')" class="flex-1 bg-gray-100 py-2 rounded-lg hover:bg-gray-200">Back</button>
      </div>
    </form>
  </div>`;
  document.getElementById('modalContainer').classList.remove('hidden');
  document.getElementById('paymentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    try {
      await this.api(`/customers/${customerId}/payments`, { method: 'POST', body: data });
      this.showToast('Payment recorded', 'success');
      this.viewCustomerDetail(customerId);
      this.refreshCurrentPage();
    } catch (err) { this.showToast(err.message, 'error'); }
  });
};
