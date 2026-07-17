MSyncApp.prototype.renderNewSale = async function () {
  const [products, shops, customers] = await Promise.all([
    this.api('/products'),
    this.api('/shops').catch(() => []),  // salesmen may not have shop-management access, but can still read shops for selection
    this.api('/customers').catch(() => [])
  ]);
  this.products = products;
  this.shops = shops.filter(s => s.is_active);
  this.customers = customers.filter(c => c.is_active);
  this.selectedShopId = null;
  this.cart = [];
  const content = document.getElementById('pageContent');
  content.innerHTML = `
  <div class="fade-in grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="lg:col-span-2 space-y-4">
      <div class="flex gap-2">
        <input id="saleProductSearch" oninput="app.renderSaleProductList()" placeholder="${t('search_products_to_add')}" class="flex-1 px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
        <button onclick="app.scanToAddProduct()" class="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900"><i class="fas fa-barcode mr-2"></i>${t('scan')}</button>
      </div>
      <div id="saleProductList" class="glass-panel rounded-xl shadow-sm divide-y max-h-[60vh] overflow-y-auto"></div>
    </div>
    <div class="glass-panel rounded-xl shadow-sm p-5 h-fit sticky top-24">
      <h3 class="font-bold mb-3">${t('cart')}</h3>
      <div id="cartItems" class="space-y-2 mb-4 max-h-64 overflow-y-auto"></div>
      <div class="flex gap-2 mb-2">
        <input id="couponCode" placeholder="${t('coupon_code')}" class="flex-1 px-3 py-2 border rounded-lg text-sm uppercase">
        <button type="button" onclick="app.applyCoupon()" class="px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200">${t('apply')}</button>
      </div>
      <div id="couponStatus" class="text-xs mb-2"></div>
      <div class="border-t pt-3 mb-1 flex justify-between text-sm text-gray-500"><span>${t('subtotal')}</span><span id="cartSubtotal">$0.00</span></div>
      <div id="discountRow" class="hidden mb-1 flex justify-between text-sm text-green-600"><span>${t('discount')}</span><span id="cartDiscount">-$0.00</span></div>
      <div class="pt-1 mb-4 flex justify-between font-bold"><span>${t('total')}</span><span id="cartTotal">$0.00</span></div>
      <label class="block text-xs font-medium text-gray-500 mb-1">${t('shop_optional')}</label>
      <div class="relative mb-3">
        <input id="shopSearchBox" placeholder="${t('search_shop_placeholder')}" autocomplete="off"
               oninput="app.filterShopPickerList()" onfocus="app.filterShopPickerList()" onblur="app.hideShopPickerListSoon()"
               class="w-full px-3 py-2 border rounded-lg">
        <button type="button" onclick="app.clearShopSelection()" id="clearShopBtn" class="hidden absolute right-2 top-2 text-gray-400 hover:text-gray-600"><i class="fas fa-times"></i></button>
        <div id="shopPickerList" class="hidden absolute z-10 bg-white border rounded-lg shadow-lg w-full max-h-48 overflow-y-auto mt-1"></div>
      </div>
      <label class="block text-xs font-medium text-gray-500 mb-1">${t('registered_customer_optional')}</label>
      <select id="saleCustomer" onchange="app.onSaleCustomerChange()" class="w-full px-3 py-2 border rounded-lg mb-3">
        <option value="">${t('no_shop_selected')}</option>
        ${this.customers.map(c => `<option value="${c.id}">${this.esc(c.name)}${c.credit_balance > 0 ? ` (${this.fmt(c.credit_balance)})` : ''}</option>`).join('')}
      </select>
      <input id="customerName" placeholder="${t('customer_name_optional')}" class="w-full px-3 py-2 border rounded-lg mb-2">
      <input id="customerPhone" placeholder="${t('customer_phone_optional')}" class="w-full px-3 py-2 border rounded-lg mb-3">
      <div id="paymentMethodBox" class="hidden mb-3">
        <label class="block text-xs font-medium text-gray-500 mb-1">${t('payment')}</label>
        <div class="flex gap-2">
          <label class="flex-1 flex items-center justify-center gap-2 px-3 py-2 border rounded-lg cursor-pointer text-sm"><input type="radio" name="paymentMethod" value="cash" checked> ${t('cash')}</label>
          <label class="flex-1 flex items-center justify-center gap-2 px-3 py-2 border rounded-lg cursor-pointer text-sm"><input type="radio" name="paymentMethod" value="credit"> ${t('on_credit')}</label>
        </div>
      </div>
      <button onclick="app.checkout()" class="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700">
        <i class="fas fa-check mr-2"></i>${t('complete_sale')}
      </button>
    </div>
  </div>`;
  this.renderSaleProductList();
  this.renderCart();
};

MSyncApp.prototype.renderSaleProductList = function () {
  const q = (document.getElementById('saleProductSearch')?.value || '').toLowerCase();
  const list = this.products
    .filter(p => p.is_active && p.current_stock > 0 && (p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)))
    .map(p => `
    <div class="p-3 flex justify-between items-center hover:bg-gray-50">
      <div>
        <p class="font-medium text-sm">${this.esc(p.name)}</p>
        <p class="text-xs text-gray-500">${this.esc(p.sku)} · ${this.fmt(p.unit_price)} · ${p.current_stock} ${t('in_stock')}</p>
      </div>
      <button onclick="app.addToCart('${p.id}')" class="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700">${t('add')}</button>
    </div>`).join('');
  document.getElementById('saleProductList').innerHTML = list || `<p class="p-6 text-center text-gray-400 text-sm">${t('no_products_available')}</p>`;
};

// ---------- Searchable shop picker (replaces the old plain dropdown) ----------
MSyncApp.prototype.filterShopPickerList = function () {
  const q = document.getElementById('shopSearchBox').value.toLowerCase().trim();
  const list = document.getElementById('shopPickerList');
  const matches = this.shops.filter(s =>
    !this.selectedShopId || s.id !== this.selectedShopId
  ).filter(s =>
    !q ||
    s.name.toLowerCase().includes(q) ||
    (s.location || '').toLowerCase().includes(q) ||
    (s.phone || '').toLowerCase().includes(q)
  ).slice(0, 20);

  if (matches.length === 0) {
    list.innerHTML = `<div class="p-3 text-sm text-gray-400">${t('no_products_found')}</div>`;
  } else {
    list.innerHTML = matches.map(s => `
      <button type="button" onmousedown="app.selectShopForSale('${s.id}')" class="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm border-b border-gray-50 last:border-0">
        <div class="font-medium">${this.esc(s.name)}</div>
        <div class="text-xs text-gray-500">${this.esc(s.location || '')}${s.phone ? ' · ' + this.esc(s.phone) : ''}</div>
      </button>`).join('');
  }
  list.classList.remove('hidden');
};

MSyncApp.prototype.hideShopPickerListSoon = function () {
  setTimeout(() => {
    const list = document.getElementById('shopPickerList');
    if (list) list.classList.add('hidden');
  }, 150);
};

MSyncApp.prototype.selectShopForSale = function (shopId) {
  const shop = this.shops.find(s => s.id === shopId);
  if (!shop) return;
  this.selectedShopId = shopId;
  document.getElementById('shopSearchBox').value = shop.name;
  document.getElementById('shopPickerList').classList.add('hidden');
  document.getElementById('clearShopBtn').classList.remove('hidden');
  document.getElementById('customerName').value = shop.owner_name || shop.name || '';
  document.getElementById('customerPhone').value = shop.phone || '';
  this.updatePaymentMethodVisibility();
};

MSyncApp.prototype.clearShopSelection = function () {
  this.selectedShopId = null;
  document.getElementById('shopSearchBox').value = '';
  document.getElementById('clearShopBtn').classList.add('hidden');
  document.getElementById('shopPickerList').classList.add('hidden');
  this.updatePaymentMethodVisibility();
};

MSyncApp.prototype.updatePaymentMethodVisibility = function () {
  const customerId = document.getElementById('saleCustomer').value;
  const paymentBox = document.getElementById('paymentMethodBox');
  if (this.selectedShopId || customerId) paymentBox.classList.remove('hidden');
  else paymentBox.classList.add('hidden');
};

MSyncApp.prototype.scanToAddProduct = function () {
  this.openBarcodeScanner((code) => {
    const product = this.products.find(p => p.barcode && p.barcode === code);
    if (!product) {
      this.showToast(`${t('no_products_found')}: ${code}`, 'warning');
      return;
    }
    this.addToCart(product.id);
    this.showToast(`${t('add')}: ${product.name}`, 'success');
  });
};

MSyncApp.prototype.onSaleCustomerChange = function () {
  const customerId = document.getElementById('saleCustomer').value;
  const customer = this.customers.find(c => c.id === customerId);
  if (customer) {
    document.getElementById('customerName').value = customer.name;
    document.getElementById('customerPhone').value = customer.phone || '';
  }
  this.updatePaymentMethodVisibility();
};

MSyncApp.prototype.addToCart = function (productId) {
  const p = this.products.find(x => x.id === productId);
  const existing = this.cart.find(c => c.product_id === productId);
  const inCart = existing ? existing.quantity : 0;
  if (inCart + 1 > p.current_stock) { this.showToast(t('not_enough_stock'), 'warning'); return; }
  if (existing) existing.quantity += 1;
  else this.cart.push({ product_id: productId, name: p.name, unit_price: p.unit_price, quantity: 1, max: p.current_stock });
  this.renderCart();
};

MSyncApp.prototype.updateCartQty = function (productId, qty) {
  const item = this.cart.find(c => c.product_id === productId);
  qty = parseInt(qty, 10);
  if (!qty || qty < 1) { this.cart = this.cart.filter(c => c.product_id !== productId); }
  else if (qty > item.max) { this.showToast(t('not_enough_stock'), 'warning'); item.quantity = item.max; }
  else { item.quantity = qty; }
  this.renderCart();
};

MSyncApp.prototype.renderCart = function () {
  const box = document.getElementById('cartItems');
  if (this.cart.length === 0) {
    box.innerHTML = `<p class="text-sm text-gray-400 text-center py-4">${t('cart_empty')}</p>`;
  } else {
    box.innerHTML = this.cart.map(c => `
      <div class="flex items-center justify-between text-sm">
        <div class="flex-1 min-w-0"><p class="truncate font-medium">${this.esc(c.name)}</p><p class="text-xs text-gray-500">${this.fmt(c.unit_price)} ${t('each')}</p></div>
        <input type="number" min="1" max="${c.max}" value="${c.quantity}" onchange="app.updateCartQty('${c.product_id}', this.value)" class="w-14 px-1 py-1 border rounded text-center mx-2">
        <button onclick="app.updateCartQty('${c.product_id}', 0)" class="text-red-500 text-xs"><i class="fas fa-times"></i></button>
      </div>`).join('');
  }
  this.updateCartTotals();
};

MSyncApp.prototype.updateCartTotals = function () {
  const subtotal = this.cart.reduce((s, c) => s + c.quantity * c.unit_price, 0);
  const discount = this.appliedCoupon ? this.appliedCoupon.discount_amount : 0;
  const total = Math.max(0, subtotal - discount);
  document.getElementById('cartSubtotal').textContent = this.fmt(subtotal);
  document.getElementById('cartTotal').textContent = this.fmt(total);
  const discountRow = document.getElementById('discountRow');
  if (discount > 0) {
    discountRow.classList.remove('hidden');
    document.getElementById('cartDiscount').textContent = '-' + this.fmt(discount);
  } else {
    discountRow.classList.add('hidden');
  }
};

MSyncApp.prototype.applyCoupon = async function () {
  const code = document.getElementById('couponCode').value.trim();
  const statusBox = document.getElementById('couponStatus');
  if (!code) { this.appliedCoupon = null; statusBox.textContent = ''; this.updateCartTotals(); return; }

  if (this.cart.length === 0) { this.showToast(t('cart_is_empty_warning'), 'warning'); return; }
  const items = this.cart.map(c => ({ product_id: c.product_id, quantity: c.quantity, unit_price: c.unit_price }));

  try {
    const result = await this.api('/coupons/validate', { method: 'POST', body: { code, items } });
    this.appliedCoupon = { code, discount_amount: result.discount_amount };
    const extra = result.free_units ? ` (${result.free_units})` : '';
    statusBox.innerHTML = `<span class="text-green-600"><i class="fas fa-check-circle mr-1"></i>${this.fmt(result.discount_amount)}${extra}</span>`;
    this.updateCartTotals();
  } catch (err) {
    this.appliedCoupon = null;
    statusBox.innerHTML = `<span class="text-red-600"><i class="fas fa-times-circle mr-1"></i>${this.esc(err.message)}</span>`;
    this.updateCartTotals();
  }
};

MSyncApp.prototype.checkout = async function () {
  if (this.cart.length === 0) { this.showToast(t('cart_is_empty_warning'), 'warning'); return; }
  const items = this.cart.map(c => ({ product_id: c.product_id, quantity: c.quantity }));
  const customer_name = document.getElementById('customerName').value.trim();
  const customer_phone = document.getElementById('customerPhone').value.trim();
  const shop_id = this.selectedShopId || null;
  const customer_id = document.getElementById('saleCustomer').value || null;
  const paymentRadio = document.querySelector('input[name="paymentMethod"]:checked');
  const payment_method = (customer_id || shop_id) && paymentRadio ? paymentRadio.value : 'cash';
  const coupon_code = this.appliedCoupon ? this.appliedCoupon.code : null;
  try {
    const sale = await this.api('/sales', { method: 'POST', body: { items, customer_name, customer_phone, shop_id, customer_id, payment_method, coupon_code } });
    this.appliedCoupon = null;
    this.showToast(`${t('sale_completed')} — ${sale.invoice_number}`, 'success');
    this.printInvoice(sale);
    this.navigate('new-sale');
  } catch (err) {
    this.showToast(err.message, 'error');
  }
};

// NOTE: the printed invoice itself is intentionally left as a fixed-language
// document for now (not tied to the UI language toggle) — printed paperwork
// usually needs its own separate decision about language. Ask if you'd like
// this translated too, or made bilingual.
MSyncApp.prototype.printInvoice = function (sale) {
  const win = window.open('', '_blank', 'width=800,height=900');
  const shopLine = sale.shop_name
    ? `<strong>Shop:</strong> ${this.esc(sale.shop_name)}${sale.shop_location ? ' — ' + this.esc(sale.shop_location) : ''}${(sale.shop_latitude && sale.shop_longitude) ? ` <a href="https://maps.google.com/?q=${sale.shop_latitude},${sale.shop_longitude}" target="_blank">(view on map)</a>` : ''}<br>`
    : '';
  const paymentLine = `<strong>Payment:</strong> ${sale.payment_method === 'credit' ? 'On Credit' : 'Cash'}<br>`;
  win.document.write(`
  <html><head><title>${sale.invoice_number}</title>
  <style>
    body{font-family:sans-serif;padding:40px;color:#1f2937;}
    .header{display:flex;align-items:center;gap:16px;border-bottom:2px solid #e5e7eb;padding-bottom:16px;margin-bottom:16px;}
    .header img{height:64px;width:64px;object-fit:cover;border-radius:8px;}
    .header h2{margin:0;font-size:1.4em;}
    table{width:100%;border-collapse:collapse;margin-top:20px;}
    th,td{border-bottom:1px solid #ddd;padding:8px;text-align:left;}
    th{background:#f5f5f5;}
    .total{font-weight:bold;font-size:1.2em;text-align:right;margin-top:16px;}
    a{color:#2563eb;}
  </style>
  </head><body>
  <div class="header">
    <img src="${window.location.origin}/logo.png" alt="Logo">
    <h2>Abu Jana App — Sales Invoice</h2>
  </div>
  <p><strong>Invoice:</strong> ${sale.invoice_number}<br><strong>Date:</strong> ${new Date(sale.created_at).toLocaleString()}<br>
  ${shopLine}
  ${paymentLine}
  ${sale.customer_name ? `<strong>Customer:</strong> ${this.esc(sale.customer_name)} ${this.esc(sale.customer_phone || '')}` : ''}</p>
  <table><thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr></thead><tbody>
  ${sale.items.map(i => `<tr><td>${i.product_name}</td><td>${i.quantity}</td><td>$${i.unit_price.toFixed(2)}</td><td>$${i.subtotal.toFixed(2)}</td></tr>`).join('')}
  </tbody></table>
  ${sale.discount_amount > 0 ? `
  <p style="text-align:right;margin:4px 0;">Subtotal: $${(Number(sale.total_amount) + Number(sale.discount_amount)).toFixed(2)}</p>
  <p style="text-align:right;margin:4px 0;color:#16a34a;">Discount${sale.coupon_code ? ' (' + sale.coupon_code + ')' : ''}: -$${Number(sale.discount_amount).toFixed(2)}</p>` : ''}
  <p class="total">Total: $${Number(sale.total_amount).toFixed(2)}</p>
  <script>window.print();</script>
  </body></html>`);
  win.document.close();
};

// ---------- Sales History ----------
MSyncApp.prototype.renderSales = async function () {
  const sales = await this.api('/sales');
  const canVoid = this.currentUser.role === 'owner' || this.currentUser.role === 'admin';
  const content = document.getElementById('pageContent');
  content.innerHTML = `
  <div class="fade-in glass-panel rounded-xl shadow-sm overflow-hidden">
    <table class="w-full text-sm">
      <thead class="bg-gray-50"><tr class="text-left text-gray-500">
        <th class="p-3">${t('invoice')}</th><th class="p-3">${t('date')}</th><th class="p-3">${t('salesman')}</th><th class="p-3">${t('shop')}</th>
        <th class="p-3">${t('customer')}</th><th class="p-3">${t('payment')}</th><th class="p-3 text-right">${t('total')}</th><th class="p-3">${t('status')}</th><th class="p-3"></th>
      </tr></thead>
      <tbody>
        ${sales.length === 0 ? `<tr><td colspan="9" class="p-6 text-center text-gray-400">${t('no_sales_yet')}</td></tr>` : sales.map(s => `
        <tr class="transaction-row border-b border-gray-50">
          <td class="p-3 font-mono text-xs">${s.invoice_number}</td>
          <td class="p-3 text-gray-500">${new Date(s.created_at).toLocaleString()}</td>
          <td class="p-3">${this.esc(s.salesman_name)}</td>
          <td class="p-3">${this.esc(s.shop_name || '-')}</td>
          <td class="p-3">${this.esc(s.customer_name || '-')}</td>
          <td class="p-3">${s.payment_method === 'credit' ? `<span class='text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700'>${t('on_credit')}</span>` : `<span class='text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600'>${t('cash')}</span>`}</td>
          <td class="p-3 text-right font-medium">${this.fmt(s.total_amount)}</td>
          <td class="p-3"><span class="px-2 py-1 rounded-full text-xs ${s.status === 'voided' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}">${s.status === 'voided' ? t('voided') : t('completed')}</span></td>
          <td class="p-3 text-right space-x-2">
            <button onclick='app.printInvoice(${JSON.stringify(s).replace(/'/g, "&apos;")})' class="text-blue-600 hover:underline text-xs">${t('print')}</button>
            ${canVoid && s.status !== 'voided' ? `<button onclick="app.voidSale('${s.id}')" class="text-red-600 hover:underline text-xs">${t('void')}</button>` : ''}
          </td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
};

MSyncApp.prototype.voidSale = async function (saleId) {
  if (!confirm('Void this sale? Stock will be restored.')) return;
  try {
    await this.api(`/sales/${saleId}/void`, { method: 'POST' });
    this.showToast('Sale voided', 'success');
    this.refreshCurrentPage();
  } catch (err) { this.showToast(err.message, 'error'); }
};
