MSyncApp.prototype.renderReports = async function () {
  const content = document.getElementById('pageContent');
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  this.reportFrom = this.reportFrom || firstOfMonth.toISOString().slice(0, 10);
  this.reportTo = this.reportTo || today.toISOString().slice(0, 10);

  content.innerHTML = `
  <div class="fade-in space-y-6">
    <div class="glass-panel rounded-xl p-4 flex flex-wrap items-end gap-3">
      <div>
        <label class="block text-xs font-medium text-gray-500 mb-1">${t('from_label')}</label>
        <input type="date" id="reportFrom" value="${this.reportFrom}" class="px-3 py-2 border rounded-lg text-sm">
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-500 mb-1">${t('to_label')}</label>
        <input type="date" id="reportTo" value="${this.reportTo}" class="px-3 py-2 border rounded-lg text-sm">
      </div>
      <button onclick="app.applyReportRange()" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">${t('apply')}</button>
      <div class="flex gap-1 ml-2">
        <button onclick="app.setReportPreset('today')" class="px-3 py-2 text-xs bg-gray-100 rounded-lg hover:bg-gray-200">${t('today')}</button>
        <button onclick="app.setReportPreset('week')" class="px-3 py-2 text-xs bg-gray-100 rounded-lg hover:bg-gray-200">${t('this_week')}</button>
        <button onclick="app.setReportPreset('month')" class="px-3 py-2 text-xs bg-gray-100 rounded-lg hover:bg-gray-200">${t('this_month')}</button>
        <button onclick="app.setReportPreset('lastmonth')" class="px-3 py-2 text-xs bg-gray-100 rounded-lg hover:bg-gray-200">${t('last_month')}</button>
        <button onclick="app.setReportPreset('year')" class="px-3 py-2 text-xs bg-gray-100 rounded-lg hover:bg-gray-200">${t('this_year')}</button>
        <button onclick="app.setReportPreset('all')" class="px-3 py-2 text-xs bg-gray-100 rounded-lg hover:bg-gray-200">${t('all_time')}</button>
      </div>
      <div class="ml-auto flex gap-2">
        <button onclick="app.exportReportsExcel()" class="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"><i class="fas fa-file-excel mr-2"></i>${t('export_excel')}</button>
        <button onclick="app.exportReportsPdf()" class="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"><i class="fas fa-file-pdf mr-2"></i>${t('export_pdf')}</button>
      </div>
    </div>
    <div id="reportsBody"><div class="flex items-center justify-center h-64"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div></div>
  </div>`;

  await this.loadReportsData();
};

MSyncApp.prototype.setReportPreset = function (preset) {
  const today = new Date();
  let from, to = today;
  if (preset === 'today') { from = today; }
  else if (preset === 'week') { from = new Date(today); from.setDate(today.getDate() - today.getDay()); }
  else if (preset === 'month') { from = new Date(today.getFullYear(), today.getMonth(), 1); }
  else if (preset === 'lastmonth') { from = new Date(today.getFullYear(), today.getMonth() - 1, 1); to = new Date(today.getFullYear(), today.getMonth(), 0); }
  else if (preset === 'year') { from = new Date(today.getFullYear(), 0, 1); }
  else if (preset === 'all') { from = new Date(2000, 0, 1); }

  this.reportFrom = from.toISOString().slice(0, 10);
  this.reportTo = to.toISOString().slice(0, 10);
  document.getElementById('reportFrom').value = this.reportFrom;
  document.getElementById('reportTo').value = this.reportTo;
  this.loadReportsData();
};

MSyncApp.prototype.applyReportRange = function () {
  this.reportFrom = document.getElementById('reportFrom').value;
  this.reportTo = document.getElementById('reportTo').value;
  this.loadReportsData();
};

MSyncApp.prototype.loadReportsData = async function () {
  const body = document.getElementById('reportsBody');
  body.innerHTML = '<div class="flex items-center justify-center h-64"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>';

  const qs = `?from=${this.reportFrom}&to=${this.reportTo}`;
  try {
    const [summary, timeseries, bestSellers, profitMargins, byShop, bySalesman, lowStock] = await Promise.all([
      this.api('/reports/summary' + qs),
      this.api('/reports/timeseries' + qs + '&groupBy=day'),
      this.api('/reports/best-sellers' + qs + '&limit=10'),
      this.api('/reports/profit-margins' + qs),
      this.api('/reports/by-shop' + qs),
      this.api('/reports/by-salesman' + qs),
      this.api('/reports/low-stock')
    ]);

    // Stash for export functions
    this.reportData = { summary, timeseries, bestSellers, profitMargins, byShop, bySalesman, lowStock };

    body.innerHTML = `
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="glass-panel rounded-xl p-5"><p class="text-sm text-gray-500">${t('revenue')}</p><p class="text-2xl font-bold mt-1">${this.fmt(summary.total_revenue)}</p></div>
      <div class="glass-panel rounded-xl p-5"><p class="text-sm text-gray-500">${t('sales_col')}</p><p class="text-2xl font-bold mt-1">${summary.total_sales}</p></div>
      <div class="glass-panel rounded-xl p-5"><p class="text-sm text-gray-500">${t('profit')}</p><p class="text-2xl font-bold mt-1 text-green-600">${this.fmt(summary.total_profit)}</p></div>
      <div class="glass-panel rounded-xl p-5"><p class="text-sm text-gray-500">${t('margin_col')}</p><p class="text-2xl font-bold mt-1">${summary.margin_pct.toFixed(1)}%</p></div>
    </div>

    <div class="glass-panel rounded-xl p-5">
      <h3 class="font-bold mb-3">${t('sales_over_time')}</h3>
      <canvas id="reportsChart" height="80"></canvas>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="glass-panel rounded-xl shadow-sm overflow-hidden">
        <div class="p-4 border-b border-gray-100 font-semibold">${t('best_selling_products')}</div>
        <table class="w-full text-sm"><thead class="bg-gray-50"><tr class="text-left text-gray-500"><th class="p-3">${t('product')}</th><th class="p-3 text-right">${t('units')}</th><th class="p-3 text-right">${t('revenue')}</th></tr></thead>
        <tbody>${bestSellers.length === 0 ? `<tr><td colspan="3" class="p-4 text-center text-gray-400">${t('no_sales_in_period')}</td></tr>` : bestSellers.map(p => `<tr class="border-b border-gray-50"><td class="p-3">${this.esc(p.name)}</td><td class="p-3 text-right">${p.units_sold}</td><td class="p-3 text-right">${this.fmt(p.revenue)}</td></tr>`).join('')}</tbody></table>
      </div>

      <div class="glass-panel rounded-xl shadow-sm overflow-hidden">
        <div class="p-4 border-b border-gray-100 font-semibold">${t('profit_margins_by_product')}</div>
        <table class="w-full text-sm"><thead class="bg-gray-50"><tr class="text-left text-gray-500"><th class="p-3">${t('product')}</th><th class="p-3 text-right">${t('profit')}</th><th class="p-3 text-right">${t('margin_col')}</th></tr></thead>
        <tbody>${profitMargins.length === 0 ? `<tr><td colspan="3" class="p-4 text-center text-gray-400">${t('no_sales_in_period')}</td></tr>` : profitMargins.map(p => `<tr class="border-b border-gray-50"><td class="p-3">${this.esc(p.name)}</td><td class="p-3 text-right">${this.fmt(p.profit)}</td><td class="p-3 text-right">${p.margin_pct.toFixed(1)}%</td></tr>`).join('')}</tbody></table>
      </div>

      <div class="glass-panel rounded-xl shadow-sm overflow-hidden">
        <div class="p-4 border-b border-gray-100 font-semibold">${t('sales_by_shop')}</div>
        <table class="w-full text-sm"><thead class="bg-gray-50"><tr class="text-left text-gray-500"><th class="p-3">${t('shop')}</th><th class="p-3 text-right">${t('sales_col')}</th><th class="p-3 text-right">${t('revenue')}</th></tr></thead>
        <tbody>${byShop.length === 0 ? `<tr><td colspan="3" class="p-4 text-center text-gray-400">${t('no_sales_in_period')}</td></tr>` : byShop.map(s => `<tr class="border-b border-gray-50"><td class="p-3">${this.esc(s.shop_name)}</td><td class="p-3 text-right">${s.sale_count}</td><td class="p-3 text-right">${this.fmt(s.revenue)}</td></tr>`).join('')}</tbody></table>
      </div>

      <div class="glass-panel rounded-xl shadow-sm overflow-hidden">
        <div class="p-4 border-b border-gray-100 font-semibold">${t('sales_by_salesman')}</div>
        <table class="w-full text-sm"><thead class="bg-gray-50"><tr class="text-left text-gray-500"><th class="p-3">${t('salesman')}</th><th class="p-3 text-right">${t('sales_col')}</th><th class="p-3 text-right">${t('revenue')}</th></tr></thead>
        <tbody>${bySalesman.length === 0 ? `<tr><td colspan="3" class="p-4 text-center text-gray-400">${t('no_sales_in_period')}</td></tr>` : bySalesman.map(s => `<tr class="border-b border-gray-50"><td class="p-3">${this.esc(s.salesman_name)}</td><td class="p-3 text-right">${s.sale_count}</td><td class="p-3 text-right">${this.fmt(s.revenue)}</td></tr>`).join('')}</tbody></table>
      </div>
    </div>

    <div class="glass-panel rounded-xl shadow-sm overflow-hidden">
      <div class="p-4 border-b border-gray-100 font-semibold">${t('low_stock_restock')} <span class="text-xs text-gray-400 font-normal">${t('current_snapshot_note')}</span></div>
      <table class="w-full text-sm"><thead class="bg-gray-50"><tr class="text-left text-gray-500"><th class="p-3">${t('sku')}</th><th class="p-3">${t('product')}</th><th class="p-3 text-right">${t('stock')}</th><th class="p-3 text-right">${t('threshold')}</th></tr></thead>
      <tbody>${lowStock.length === 0 ? `<tr><td colspan="4" class="p-4 text-center text-gray-400">${t('nothing_low_stock')}</td></tr>` : lowStock.map(p => `<tr class="border-b border-gray-50"><td class="p-3">${this.esc(p.sku)}</td><td class="p-3">${this.esc(p.name)}</td><td class="p-3 text-right stock-low px-2 rounded">${p.current_stock}</td><td class="p-3 text-right">${p.low_stock_threshold}</td></tr>`).join('')}</tbody></table>
    </div>`;

    this.renderReportsChart(timeseries);
  } catch (err) {
    body.innerHTML = `<div class="text-center text-red-600 py-12"><i class="fas fa-exclamation-triangle text-3xl mb-3"></i><p>${err.message}</p></div>`;
  }
};

MSyncApp.prototype.renderReportsChart = function (timeseries) {
  const canvas = document.getElementById('reportsChart');
  if (!canvas) return;
  if (this._reportsChartInstance) this._reportsChartInstance.destroy();
  this._reportsChartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: timeseries.map(t => t.period),
      datasets: [{ label: 'Revenue', data: timeseries.map(t => t.revenue), backgroundColor: '#3b82f6' }]
    },
    options: { responsive: true, plugins: { legend: { display: false } } }
  });
};

// ---------- Export to Excel (multi-sheet workbook) ----------
MSyncApp.prototype.exportReportsExcel = function () {
  if (!this.reportData) { this.showToast(t('load_report_first'), 'warning'); return; }
  const d = this.reportData;
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([d.summary]), 'Summary');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(d.timeseries), 'Sales Over Time');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(d.bestSellers), 'Best Sellers');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(d.profitMargins), 'Profit Margins');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(d.byShop), 'By Shop');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(d.bySalesman), 'By Salesman');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(d.lowStock), 'Low Stock');

  XLSX.writeFile(wb, `Sales_Report_${this.reportFrom}_to_${this.reportTo}.xlsx`);
};

// ---------- Export to PDF (print-based, same pattern as invoices) ----------
MSyncApp.prototype.exportReportsPdf = function () {
  if (!this.reportData) { this.showToast(t('load_report_first'), 'warning'); return; }
  const d = this.reportData;
  const win = window.open('', '_blank', 'width=900,height=1000');

  const table = (title, rows, cols) => `
    <h3>${title}</h3>
    ${rows.length === 0 ? '<p class="empty">No data in this period.</p>' : `
    <table><thead><tr>${cols.map(c => `<th>${c.label}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r => `<tr>${cols.map(c => `<td>${c.fmt ? c.fmt(r[c.key]) : (r[c.key] ?? '')}</td>`).join('')}</tr>`).join('')}</tbody></table>`}`;

  const money = v => '$' + Number(v).toFixed(2);
  const pct = v => Number(v).toFixed(1) + '%';

  win.document.write(`
  <html><head><title>Sales Report ${this.reportFrom} to ${this.reportTo}</title>
  <style>
    body{font-family:sans-serif;padding:32px;color:#1f2937;}
    .header{display:flex;align-items:center;gap:16px;border-bottom:2px solid #e5e7eb;padding-bottom:16px;margin-bottom:16px;}
    .header img{height:56px;width:56px;object-fit:cover;border-radius:8px;}
    h2{margin:0;} h3{margin-top:28px;margin-bottom:8px;}
    table{width:100%;border-collapse:collapse;margin-bottom:8px;font-size:0.9em;}
    th,td{border-bottom:1px solid #ddd;padding:6px 8px;text-align:left;}
    th{background:#f5f5f5;}
    .summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:16px 0;}
    .summary-box{border:1px solid #e5e7eb;border-radius:8px;padding:12px;}
    .summary-box .label{font-size:0.8em;color:#6b7280;}
    .summary-box .value{font-size:1.3em;font-weight:bold;}
    .empty{color:#9ca3af;font-size:0.9em;}
  </style>
  </head><body>
  <div class="header">
    <img src="${window.location.origin}/logo.png" alt="Logo">
    <div><h2>Sales Report</h2><p>${this.reportFrom} to ${this.reportTo}</p></div>
  </div>

  <div class="summary-grid">
    <div class="summary-box"><div class="label">Revenue</div><div class="value">${money(d.summary.total_revenue)}</div></div>
    <div class="summary-box"><div class="label">Sales</div><div class="value">${d.summary.total_sales}</div></div>
    <div class="summary-box"><div class="label">Profit</div><div class="value">${money(d.summary.total_profit)}</div></div>
    <div class="summary-box"><div class="label">Margin</div><div class="value">${pct(d.summary.margin_pct)}</div></div>
  </div>

  ${table('Best-Selling Products', d.bestSellers, [
    { key: 'name', label: 'Product' }, { key: 'units_sold', label: 'Units' }, { key: 'revenue', label: 'Revenue', fmt: money }
  ])}
  ${table('Profit Margins by Product', d.profitMargins, [
    { key: 'name', label: 'Product' }, { key: 'profit', label: 'Profit', fmt: money }, { key: 'margin_pct', label: 'Margin', fmt: pct }
  ])}
  ${table('Sales by Shop', d.byShop, [
    { key: 'shop_name', label: 'Shop' }, { key: 'sale_count', label: 'Sales' }, { key: 'revenue', label: 'Revenue', fmt: money }
  ])}
  ${table('Sales by Salesman', d.bySalesman, [
    { key: 'salesman_name', label: 'Salesman' }, { key: 'sale_count', label: 'Sales' }, { key: 'revenue', label: 'Revenue', fmt: money }
  ])}
  ${table('Low Stock / Restock Needed', d.lowStock, [
    { key: 'sku', label: 'SKU' }, { key: 'name', label: 'Product' }, { key: 'current_stock', label: 'Stock' }, { key: 'low_stock_threshold', label: 'Threshold' }
  ])}

  <script>window.print();</script>
  </body></html>`);
  win.document.close();
};
