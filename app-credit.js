MSyncApp.prototype.renderCredit = async function () {
  // Make sure we have fresh shop data (getCreditReportRows reads from this._shops)
  const shops = await this.api('/shops');
  this._shops = shops;

  const rows = this.getCreditReportRows();
  const totalOwed = rows.reduce((s, r) => s + r.amount_owed, 0);
  const overdueRows = rows.filter(r => r.status_key === 'overdue');
  const overdueAmount = overdueRows.reduce((s, r) => s + r.amount_owed, 0);

  const content = document.getElementById('pageContent');
  content.innerHTML = `
  <div class="fade-in space-y-6">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="glass-panel rounded-xl p-5"><p class="text-sm text-gray-500">${t('total_owed')}</p><p class="text-2xl font-bold text-orange-600 mt-1">${this.fmt(totalOwed)}</p></div>
      <div class="glass-panel rounded-xl p-5"><p class="text-sm text-gray-500">${t('shops_owing')}</p><p class="text-2xl font-bold mt-1">${rows.length}</p></div>
      <div class="glass-panel rounded-xl p-5"><p class="text-sm text-gray-500">${t('overdue_6days')}</p><p class="text-2xl font-bold text-red-600 mt-1">${overdueRows.length}</p></div>
      <div class="glass-panel rounded-xl p-5"><p class="text-sm text-gray-500">${t('overdue_amount')}</p><p class="text-2xl font-bold text-red-600 mt-1">${this.fmt(overdueAmount)}</p></div>
    </div>

    <div class="flex gap-2 flex-wrap">
      <button onclick="app.exportCreditExcel()" class="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"><i class="fas fa-file-excel mr-2"></i>${t('export_excel')}</button>
      <button onclick="app.exportCreditPdf()" class="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"><i class="fas fa-file-pdf mr-2"></i>${t('export_pdf')}</button>
    </div>

    <div class="glass-panel rounded-xl shadow-sm overflow-hidden">
      <div class="p-4 border-b border-gray-100 font-semibold text-gray-800">${t('shops_owing_money')}</div>
      ${rows.length === 0 ? `<p class="p-6 text-center text-gray-400">${t('no_outstanding_credit_right_now')}</p>` : `
      <table class="w-full text-sm">
        <thead class="bg-gray-50"><tr class="text-left text-gray-500">
          <th class="p-3">${t('shop')}</th><th class="p-3">${t('phone')}</th><th class="p-3">${t('location_text_address')}</th><th class="p-3 text-right">${t('total_owed')}</th><th class="p-3">${t('date')}</th><th class="p-3">${t('status')}</th><th class="p-3 text-right">${t('actions')}</th>
        </tr></thead>
        <tbody>
          ${rows.map(r => {
            const shop = this._shops.find(s => s.name === r.shop && s.credit_balance === r.amount_owed);
            const badgeClass = r.status_key === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700';
            return `
          <tr class="transaction-row border-b border-gray-50">
            <td class="p-3 font-medium">${this.esc(r.shop)}</td>
            <td class="p-3 text-gray-500">${this.esc(r.phone)}</td>
            <td class="p-3 text-gray-500">${this.esc(r.location)}</td>
            <td class="p-3 text-right font-semibold text-orange-600">${this.fmt(r.amount_owed)}</td>
            <td class="p-3 text-gray-500">${r.last_credit_date}</td>
            <td class="p-3"><span class="px-2 py-0.5 rounded-full text-xs ${badgeClass}">${r.status} (${r.days_label})</span></td>
            <td class="p-3 text-right">${shop ? `<button onclick="app.openShopPaymentModal('${shop.id}')" class="text-green-600 hover:underline text-xs">${t('record_payment')}</button>` : ''}</td>
          </tr>`;
          }).join('')}
        </tbody>
      </table>`}
    </div>
  </div>`;
};
