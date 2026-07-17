MSyncApp.prototype.renderInventory = async function () {
  const logs = await this.api('/logs/inventory');
  const content = document.getElementById('pageContent');
  content.innerHTML = `
  <div class="fade-in glass-panel rounded-xl shadow-sm overflow-hidden">
    <table class="w-full text-sm">
      <thead class="bg-gray-50"><tr class="text-left text-gray-500">
        <th class="p-3">Date</th><th class="p-3">Product</th><th class="p-3">Type</th>
        <th class="p-3 text-right">Change</th><th class="p-3 text-right">New Stock</th><th class="p-3">By</th><th class="p-3">Note</th>
      </tr></thead>
      <tbody>
        ${logs.length === 0 ? `<tr><td colspan="7" class="p-6 text-center text-gray-400">No inventory activity yet</td></tr>` : logs.map(l => `
        <tr class="transaction-row border-b border-gray-50">
          <td class="p-3 text-gray-500 text-xs">${new Date(l.created_at).toLocaleString()}</td>
          <td class="p-3">${this.esc(l.product_name || 'Unknown')}</td>
          <td class="p-3"><span class="px-2 py-0.5 bg-gray-100 rounded text-xs">${l.change_type}</span></td>
          <td class="p-3 text-right font-medium ${l.quantity_change < 0 ? 'text-red-600' : 'text-green-600'}">${l.quantity_change > 0 ? '+' : ''}${l.quantity_change}</td>
          <td class="p-3 text-right">${l.new_stock}</td>
          <td class="p-3 text-gray-500">${this.esc(l.user_name || '-')}</td>
          <td class="p-3 text-gray-500">${this.esc(l.note || '-')}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
};

MSyncApp.prototype.renderAudit = async function () {
  const logs = await this.api('/logs/audit');
  const content = document.getElementById('pageContent');
  content.innerHTML = `
  <div class="fade-in glass-panel rounded-xl shadow-sm overflow-hidden">
    <table class="w-full text-sm">
      <thead class="bg-gray-50"><tr class="text-left text-gray-500">
        <th class="p-3">Date</th><th class="p-3">Action</th><th class="p-3">Entity</th><th class="p-3">By</th><th class="p-3">Details</th>
      </tr></thead>
      <tbody>
        ${logs.length === 0 ? `<tr><td colspan="5" class="p-6 text-center text-gray-400">No audit activity yet</td></tr>` : logs.map(l => `
        <tr class="transaction-row border-b border-gray-50">
          <td class="p-3 text-gray-500 text-xs">${new Date(l.created_at).toLocaleString()}</td>
          <td class="p-3"><span class="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">${l.action}</span></td>
          <td class="p-3 text-gray-500 text-xs">${this.esc(l.entity_type || '-')}</td>
          <td class="p-3">${this.esc(l.user_name || 'System')}</td>
          <td class="p-3 text-gray-500 text-xs">${l.details ? this.esc(JSON.stringify(JSON.parse(l.details))) : '-'}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
};
