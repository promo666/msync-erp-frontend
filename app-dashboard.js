MSyncApp.prototype.renderDashboard = async function () {
  const [summary, shops] = await Promise.all([
    this.api('/dashboard/summary'),
    this.api('/shops').catch(() => [])
  ]);

  const owingShops = shops.filter(s => s.credit_balance > 0);
  const totalCreditOwed = owingShops.reduce((sum, s) => sum + s.credit_balance, 0);
  const overdueCount = owingShops.filter(s => {
    if (!s.last_credit_at) return false;
    const days = Math.floor((Date.now() - new Date(s.last_credit_at).getTime()) / 86400000);
    return days > 6;
  }).length;

  const content = document.getElementById('pageContent');
  content.innerHTML = `
  <div class="fade-in space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
      <div class="glass-panel rounded-xl p-5 shadow-sm">
        <p class="text-sm text-gray-500">Total Sales</p>
        <p class="text-2xl font-bold text-gray-900 mt-1">${this.fmt(summary.total_sales_amount)}</p>
        <p class="text-xs text-gray-400 mt-1">${summary.total_sales_count} transactions</p>
      </div>
      <div class="glass-panel rounded-xl p-5 shadow-sm">
        <p class="text-sm text-gray-500">Today's Sales</p>
        <p class="text-2xl font-bold text-gray-900 mt-1">${this.fmt(summary.today_sales_amount)}</p>
        <p class="text-xs text-gray-400 mt-1">${summary.today_sales_count} transactions</p>
      </div>
      <div class="glass-panel rounded-xl p-5 shadow-sm">
        <p class="text-sm text-gray-500">Active Products</p>
        <p class="text-2xl font-bold text-gray-900 mt-1">${summary.total_active_products}</p>
      </div>
      <div class="glass-panel rounded-xl p-5 shadow-sm ${summary.low_stock_count > 0 ? 'stock-low' : ''}">
        <p class="text-sm ${summary.low_stock_count > 0 ? '' : 'text-gray-500'}">Low Stock Alerts</p>
        <p class="text-2xl font-bold mt-1">${summary.low_stock_count}</p>
      </div>
      <div onclick="app.navigate('credit')" class="glass-panel rounded-xl p-5 shadow-sm cursor-pointer hover:shadow-md transition ${overdueCount > 0 ? 'stock-low' : ''}">
        <p class="text-sm ${overdueCount > 0 ? '' : 'text-gray-500'}">Credit Outstanding</p>
        <p class="text-2xl font-bold mt-1 ${overdueCount > 0 ? '' : 'text-orange-600'}">${this.fmt(totalCreditOwed)}</p>
        <p class="text-xs mt-1 ${overdueCount > 0 ? '' : 'text-gray-400'}">${owingShops.length} shop${owingShops.length === 1 ? '' : 's'}${overdueCount > 0 ? ` · ${overdueCount} overdue` : ''}</p>
      </div>
    </div>
    <div class="glass-panel rounded-xl p-6 shadow-sm">
      <h3 class="font-bold text-gray-900 mb-4">Top Products</h3>
      ${summary.top_products.length === 0 ? '<p class="text-gray-500 text-sm">No sales recorded yet.</p>' : `
      <table class="w-full text-sm">
        <thead><tr class="text-left text-gray-500 border-b"><th class="pb-2">Product</th><th class="pb-2">SKU</th><th class="pb-2 text-right">Qty Sold</th><th class="pb-2 text-right">Revenue</th></tr></thead>
        <tbody>
          ${summary.top_products.map(p => `
          <tr class="border-b border-gray-50">
            <td class="py-2">${this.esc(p.name)}</td>
            <td class="py-2 text-gray-500">${this.esc(p.sku)}</td>
            <td class="py-2 text-right">${p.total_qty}</td>
            <td class="py-2 text-right font-medium">${this.fmt(p.total_revenue)}</td>
          </tr>`).join('')}
        </tbody>
      </table>`}
    </div>
  </div>`;
};
