MSyncApp.prototype.renderTargets = async function () {
  const targets = await this.api('/dashboard/targets');
  const content = document.getElementById('pageContent');
  content.innerHTML = `
  <div class="fade-in space-y-3">
    ${targets.length === 0 ? '<p class="text-gray-500">No active products with targets.</p>' : targets.map(t => {
      const cls = t.progress_pct >= 100 ? 'target-achieved' : t.progress_pct >= 50 ? 'target-partial' : 'target-low';
      return `
      <div class="glass-panel rounded-xl p-4 shadow-sm">
        <div class="flex justify-between mb-2">
          <div><p class="font-medium">${this.esc(t.name)}</p><p class="text-xs text-gray-500">${this.esc(t.sku)}</p></div>
          <p class="text-sm font-medium">${t.monthly_achieved} / ${t.monthly_target || 0}</p>
        </div>
        <div class="target-progress"><div class="target-progress-bar ${cls}" style="width:${t.progress_pct}%"></div></div>
      </div>`;
    }).join('')}
  </div>`;
};

// ---------- Shops ----------
MSyncApp.prototype.renderShops = async function (view) {
  const shops = await this.api('/shops');
  this._shops = shops;
  this._shopsView = view || this._shopsView || 'list';
  const canManage = this.currentUser.role === 'owner' || this.currentUser.role === 'admin';
  const content = document.getElementById('pageContent');

  content.innerHTML = `
  <div class="fade-in space-y-4">
    <div class="flex justify-between items-center flex-wrap gap-2">
      <div class="flex gap-1 bg-gray-100 rounded-lg p-1">
        <button onclick="app.setShopsView('list')" class="px-3 py-1.5 rounded-md text-sm ${this._shopsView === 'list' ? 'bg-white shadow-sm font-medium' : 'text-gray-500'}"><i class="fas fa-list mr-1"></i>List</button>
        <button onclick="app.setShopsView('map')" class="px-3 py-1.5 rounded-md text-sm ${this._shopsView === 'map' ? 'bg-white shadow-sm font-medium' : 'text-gray-500'}"><i class="fas fa-map-marked-alt mr-1"></i>Map</button>
      </div>
      <div class="flex gap-2 flex-wrap">
        <button onclick="app.exportShopsExcel()" class="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"><i class="fas fa-file-excel mr-2"></i>Export Excel</button>
        ${canManage ? `
        <button onclick="app.exportCreditExcel()" class="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700"><i class="fas fa-file-excel mr-2"></i>Credit Report (Excel)</button>
        <button onclick="app.exportCreditPdf()" class="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"><i class="fas fa-file-pdf mr-2"></i>Credit Report (PDF)</button>
        <button onclick="app.openShopModal()" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"><i class="fas fa-plus mr-2"></i>Add Shop</button>` : ''}
      </div>
    </div>
    <input id="shopSearchInput" oninput="app.filterShopsList()" placeholder="Search by name, location, or phone..." class="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
    <div id="shopsViewContainer"></div>
  </div>`;

  if (this._shopsView === 'map') this.renderShopsMap();
  else this.renderShopsList();
};

MSyncApp.prototype.filterShopsList = function () {
  if (this._shopsView === 'map') return;
  this.renderShopsList();
};

// Days since a shop's most recent unpaid credit sale — used to decide the
// yellow (recent) vs red (overdue, 6+ days) badge color.
MSyncApp.prototype.daysSinceCredit = function (lastCreditAt) {
  if (!lastCreditAt) return null;
  const ms = Date.now() - new Date(lastCreditAt).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
};

MSyncApp.prototype.setShopsView = function (view) {
  this._shopsView = view;
  this.renderShops(view);
};

MSyncApp.prototype.renderShopsList = function () {
  const canManage = this.currentUser.role === 'owner' || this.currentUser.role === 'admin';
  const q = (document.getElementById('shopSearchInput')?.value || '').toLowerCase().trim();
  const shops = this._shops.filter(s =>
    !q ||
    s.name.toLowerCase().includes(q) ||
    (s.location || '').toLowerCase().includes(q) ||
    (s.phone || '').toLowerCase().includes(q)
  );

  document.getElementById('shopsViewContainer').innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      ${shops.map(s => {
        const owes = s.credit_balance > 0;
        const days = this.daysSinceCredit(s.last_credit_at);
        const overdue = owes && days !== null && days > 6;
        const badgeClass = overdue ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700';
        const daysLabel = days === null ? '' : overdue ? ` · ${days - 6}d overdue` : ` · ${6 - days}d left`;
        return `
      <div class="glass-panel rounded-xl p-5 shadow-sm">
        <div class="flex justify-between items-start">
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <p class="font-bold">${this.esc(s.name)}</p>
              ${owes ? `<span class="px-2 py-0.5 rounded-full text-xs font-semibold ${badgeClass}">${this.fmt(s.credit_balance)} owed${daysLabel}</span>` : ''}
            </div>
            <p class="text-sm text-gray-500 mt-1"><i class="fas fa-user mr-1"></i>${this.esc(s.owner_name || '-')}</p>
            <p class="text-sm text-gray-500"><i class="fas fa-phone mr-1"></i>${this.esc(s.phone || '-')}</p>
            <p class="text-sm text-gray-500"><i class="fas fa-map-marker-alt mr-1"></i>${this.esc(s.location || '-')}</p>
            ${s.latitude && s.longitude ? `<a href="https://maps.google.com/?q=${s.latitude},${s.longitude}" target="_blank" class="text-xs text-blue-600 hover:underline"><i class="fas fa-external-link-alt mr-1"></i>View on Google Maps</a>` : ''}
          </div>
          <div class="text-right space-y-1">
            ${canManage ? `<button onclick="app.openShopModal('${s.id}')" class="text-blue-600 text-xs hover:underline block">Edit</button>` : ''}
            ${canManage && owes ? `<button onclick="app.openShopPaymentModal('${s.id}')" class="text-green-600 text-xs hover:underline block">Record Payment</button>` : ''}
          </div>
        </div>
      </div>`;
      }).join('') || '<p class="text-gray-500">No shops found.</p>'}
    </div>`;
};

MSyncApp.prototype.openShopPaymentModal = function (shopId) {
  const shop = this._shops.find(x => x.id === shopId);
  document.getElementById('modalContent').innerHTML = `
  <div class="p-6">
    <h3 class="text-lg font-bold mb-1">Record Payment</h3>
    <p class="text-sm text-gray-500 mb-4">${this.esc(shop.name)} — currently owes ${this.fmt(shop.credit_balance)}</p>
    <form id="shopPaymentForm" class="space-y-3">
      <div><label class="block text-sm font-medium mb-1">Amount</label><input type="number" step="0.01" min="0.01" name="amount" required class="w-full px-3 py-2 border rounded-lg"></div>
      <div><label class="block text-sm font-medium mb-1">Note (optional)</label><input name="note" class="w-full px-3 py-2 border rounded-lg" placeholder="e.g. Cash payment received"></div>
      <div class="flex gap-3 pt-2">
        <button type="submit" class="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">Record Payment</button>
        <button type="button" onclick="app.closeModal()" class="flex-1 bg-gray-100 py-2 rounded-lg hover:bg-gray-200">Cancel</button>
      </div>
    </form>
  </div>`;
  document.getElementById('modalContainer').classList.remove('hidden');
  document.getElementById('shopPaymentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    try {
      await this.api(`/shops/${shopId}/payments`, { method: 'POST', body: data });
      this.showToast('Payment recorded', 'success');
      this.closeModal();
      this.refreshCurrentPage();
    } catch (err) { this.showToast(err.message, 'error'); }
  });
};

MSyncApp.prototype.renderShopsMap = function () {
  const withCoords = this._shops.filter(s => s.latitude && s.longitude);
  const container = document.getElementById('shopsViewContainer');

  if (withCoords.length === 0) {
    container.innerHTML = `<div class="glass-panel rounded-xl p-8 text-center text-gray-400">
      <i class="fas fa-map-marked-alt text-3xl mb-3"></i>
      <p>No shops have a saved location yet.</p>
      <p class="text-sm mt-1">Edit a shop and paste coordinates (e.g. from Google Maps) to see it here.</p>
    </div>`;
    return;
  }

  container.innerHTML = `<div id="shopsMapEl" class="rounded-xl overflow-hidden shadow-sm" style="height:500px;"></div>`;

  if (this._shopsMapInstance) { this._shopsMapInstance.remove(); this._shopsMapInstance = null; }

  const map = L.map('shopsMapEl');
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  const markers = withCoords.map(s => {
    const marker = L.marker([s.latitude, s.longitude]).addTo(map);
    marker.bindPopup(`
      <strong>${this.esc(s.name)}</strong><br>
      ${s.owner_name ? this.esc(s.owner_name) + '<br>' : ''}
      ${s.phone ? this.esc(s.phone) + '<br>' : ''}
      ${this.esc(s.location || '')}
    `);
    return marker;
  });

  const group = L.featureGroup(markers);
  map.fitBounds(group.getBounds().pad(0.2));
  this._shopsMapInstance = map;
};

MSyncApp.prototype.getCreditReportRows = function () {
  return (this._shops || [])
    .filter(s => s.credit_balance > 0)
    .map(s => {
      const days = this.daysSinceCredit(s.last_credit_at);
      const overdue = days !== null && days > 6;
      return {
        shop: s.name,
        phone: s.phone || '',
        location: s.location || '',
        amount_owed: s.credit_balance,
        last_credit_date: s.last_credit_at ? new Date(s.last_credit_at).toLocaleDateString() : '',
        status: overdue ? 'Overdue' : 'Current',
        days_label: days === null ? '' : overdue ? `${days - 6} days overdue` : `${6 - days} days left`
      };
    })
    .sort((a, b) => b.amount_owed - a.amount_owed);
};

MSyncApp.prototype.exportCreditExcel = function () {
  const rows = this.getCreditReportRows().map(r => ({
    Shop: r.shop, Phone: r.phone, Location: r.location, 'Amount Owed': r.amount_owed,
    'Last Credit Date': r.last_credit_date, Status: r.status, 'Days': r.days_label
  }));
  this.exportToExcel(rows, 'Credit Report', 'Credit_Report.xlsx');
};

MSyncApp.prototype.exportCreditPdf = function () {
  const rows = this.getCreditReportRows();
  if (rows.length === 0) { this.showToast('No outstanding credit to report', 'warning'); return; }
  const totalOwed = rows.reduce((s, r) => s + r.amount_owed, 0);
  const win = window.open('', '_blank', 'width=900,height=1000');
  win.document.write(`
  <html><head><title>Credit Report</title>
  <style>
    body{font-family:sans-serif;padding:32px;color:#1f2937;}
    .header{display:flex;align-items:center;gap:16px;border-bottom:2px solid #e5e7eb;padding-bottom:16px;margin-bottom:16px;}
    .header img{height:56px;width:56px;object-fit:cover;border-radius:8px;}
    table{width:100%;border-collapse:collapse;margin-top:12px;font-size:0.9em;}
    th,td{border-bottom:1px solid #ddd;padding:8px;text-align:left;}
    th{background:#f5f5f5;}
    .overdue{color:#dc2626;font-weight:600;}
    .current{color:#b45309;}
    .total{font-weight:bold;font-size:1.1em;text-align:right;margin-top:12px;}
  </style>
  </head><body>
  <div class="header">
    <img src="${window.location.origin}/logo.png" alt="Logo">
    <div><h2 style="margin:0;">Credit Report</h2><p style="margin:0;">Generated ${new Date().toLocaleString()}</p></div>
  </div>
  <table>
    <thead><tr><th>Shop</th><th>Phone</th><th>Location</th><th style="text-align:right;">Amount Owed</th><th>Last Credit</th><th>Status</th></tr></thead>
    <tbody>
      ${rows.map(r => `<tr><td>${r.shop}</td><td>${r.phone}</td><td>${r.location}</td><td style="text-align:right;">${this.fmt(r.amount_owed)}</td><td>${r.last_credit_date}</td><td class="${r.status === 'Overdue' ? 'overdue' : 'current'}">${r.status} (${r.days_label})</td></tr>`).join('')}
    </tbody>
  </table>
  <p class="total">Total Outstanding: ${this.fmt(totalOwed)}</p>
  <script>window.print();</script>
  </body></html>`);
  win.document.close();
};

MSyncApp.prototype.exportShopsExcel = function () {
  const rows = (this._shops || []).map(s => ({
    Name: s.name, Owner: s.owner_name || '', Phone: s.phone || '', Location: s.location || '',
    Latitude: s.latitude || '', Longitude: s.longitude || '',
    'Credit Owed': s.credit_balance || 0, 'Last Credit Date': s.last_credit_at || '',
    Active: s.is_active ? 'Yes' : 'No'
  }));
  this.exportToExcel(rows, 'Shops', 'Shops.xlsx');
};

MSyncApp.prototype.openShopModal = function (shopId) {
  const s = shopId ? this._shops.find(x => x.id === shopId) : null;
  const hasCoords = s && s.latitude && s.longitude;
  const coordsValue = hasCoords ? `${s.latitude}, ${s.longitude}` : '';
  document.getElementById('modalContent').innerHTML = `
  <div class="p-6">
    <h3 class="text-lg font-bold mb-4">${s ? 'Edit Shop' : 'Add Shop'}</h3>
    <form id="shopForm" class="space-y-3">
      <div><label class="block text-sm font-medium mb-1">Name</label><input name="name" value="${s ? this.esc(s.name) : ''}" required class="w-full px-3 py-2 border rounded-lg"></div>
      <div><label class="block text-sm font-medium mb-1">Owner / Manager</label><input name="owner_name" value="${s ? this.esc(s.owner_name || '') : ''}" class="w-full px-3 py-2 border rounded-lg"></div>
      <div><label class="block text-sm font-medium mb-1">Phone</label><input name="phone" value="${s ? this.esc(s.phone || '') : ''}" class="w-full px-3 py-2 border rounded-lg"></div>
      <div><label class="block text-sm font-medium mb-1">Location (text address)</label><input name="location" value="${s ? this.esc(s.location || '') : ''}" class="w-full px-3 py-2 border rounded-lg"></div>
      <div>
        <label class="block text-sm font-medium mb-1">Map Location (optional)</label>
        <p class="text-xs text-gray-400 mb-2">Click the map to drop a pin, or paste coordinates directly (e.g. from Google Maps).</p>
        <div id="shopPickerMap" class="rounded-lg overflow-hidden border" style="height:250px;"></div>
        <div class="flex gap-2 mt-2">
          <button type="button" onclick="app.locateMeOnShopPicker()" class="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100 whitespace-nowrap"><i class="fas fa-location-crosshairs mr-1"></i>My Location</button>
          <input id="shopCoordsInput" name="coordinates" value="${coordsValue}" class="flex-1 px-3 py-2 border rounded-lg text-sm" placeholder="Latitude, Longitude">
          <button type="button" onclick="app.clearShopPickerLocation()" class="px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200">Clear</button>
        </div>
      </div>
      <div class="flex gap-3 pt-2">
        <button type="submit" class="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Save</button>
        <button type="button" onclick="app.closeModal()" class="flex-1 bg-gray-100 py-2 rounded-lg hover:bg-gray-200">Cancel</button>
      </div>
    </form>
  </div>`;
  document.getElementById('modalContainer').classList.remove('hidden');
  this.initShopPickerMap(hasCoords ? s.latitude : null, hasCoords ? s.longitude : null);

  document.getElementById('shopForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    if (!data.coordinates || !data.coordinates.trim()) delete data.coordinates;
    try {
      if (s) await this.api(`/shops/${s.id}`, { method: 'PUT', body: data });
      else await this.api('/shops', { method: 'POST', body: data });
      this.showToast('Shop saved', 'success');
      this.closeModal();
      if (this._shopPickerMap) { this._shopPickerMap.remove(); this._shopPickerMap = null; }
      this.refreshCurrentPage();
    } catch (err) { this.showToast(err.message, 'error'); }
  });
};

// Interactive "click to drop a pin" map inside the shop form. Falls back to
// centering near the browser's current location if allowed, otherwise a
// generic default view.
MSyncApp.prototype.initShopPickerMap = function (existingLat, existingLng) {
  if (this._shopPickerMap) { this._shopPickerMap.remove(); this._shopPickerMap = null; }

  const startLat = existingLat || 36.335;
  const startLng = existingLng || 43.118;
  const startZoom = existingLat ? 15 : 6;

  const map = L.map('shopPickerMap').setView([startLat, startLng], startZoom);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  let marker = null;
  if (existingLat && existingLng) {
    marker = L.marker([existingLat, existingLng]).addTo(map);
  }
  let userMarker = null;

  map.on('click', (e) => {
    const { lat, lng } = e.latlng;
    if (marker) marker.setLatLng([lat, lng]);
    else marker = L.marker([lat, lng]).addTo(map);
    document.getElementById('shopCoordsInput').value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  });

  this._shopPickerMap = map;
  this._shopPickerSetMarker = (lat, lng) => {
    if (marker) marker.setLatLng([lat, lng]);
    else marker = L.marker([lat, lng]).addTo(map);
  };
  this._shopPickerShowUserLocation = (lat, lng, center) => {
    if (userMarker) userMarker.setLatLng([lat, lng]);
    else {
      userMarker = L.circleMarker([lat, lng], {
        radius: 8, color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.9, weight: 3
      }).addTo(map).bindPopup('You are here');
    }
    if (center) map.setView([lat, lng], 15);
  };

  // If we don't have an existing shop location yet, quietly show the user's
  // current location on load too (as a convenience) — this never sets the
  // shop's own pin by itself, only "My Location" or a map click does that.
  if (!existingLat && navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((pos) => {
      this._shopPickerShowUserLocation(pos.coords.latitude, pos.coords.longitude, true);
    }, () => {});
  }

  // Fix Leaflet sizing glitches that happen when a map is created inside a
  // freshly-opened modal (container has no size yet at init time).
  setTimeout(() => map.invalidateSize(), 100);
};

MSyncApp.prototype.clearShopPickerLocation = function () {
  document.getElementById('shopCoordsInput').value = '';
  if (this._shopPickerMap) {
    this._shopPickerMap.eachLayer((layer) => {
      if (layer instanceof L.Marker) this._shopPickerMap.removeLayer(layer);
    });
  }
};

MSyncApp.prototype.locateMeOnShopPicker = function () {
  if (!navigator.geolocation) { this.showToast('Your browser does not support location', 'warning'); return; }
  this.showToast('Finding your location...', 'success');
  navigator.geolocation.getCurrentPosition((pos) => {
    const { latitude, longitude } = pos.coords;
    if (this._shopPickerShowUserLocation) this._shopPickerShowUserLocation(latitude, longitude, true);
  }, () => {
    this.showToast('Could not get your location. Check your browser/location permissions.', 'error');
  });
};
