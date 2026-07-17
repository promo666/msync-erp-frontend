// Reusable camera barcode scanner. Call app.openBarcodeScanner(code => { ... })
// from any page — it opens a camera modal, and calls your callback with the
// scanned barcode text the moment a valid barcode is detected, then closes
// itself automatically.
MSyncApp.prototype.openBarcodeScanner = function (onDetected) {
  if (typeof Html5Qrcode === 'undefined') {
    this.showToast('Barcode scanner failed to load. Check your internet connection.', 'error');
    return;
  }

  document.getElementById('modalContent').innerHTML = `
  <div class="p-6">
    <h3 class="text-lg font-bold mb-3"><i class="fas fa-barcode mr-2"></i>Scan Barcode</h3>
    <p class="text-sm text-gray-500 mb-3">Point your camera at a barcode. It will be detected automatically.</p>
    <div id="barcodeReaderRegion" class="rounded-lg overflow-hidden bg-black" style="min-height:300px;"></div>
    <div id="barcodeScanError" class="hidden text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-3"></div>
    <button type="button" onclick="app.closeBarcodeScanner()" class="w-full mt-4 bg-gray-100 py-2 rounded-lg hover:bg-gray-200">Cancel</button>
  </div>`;
  document.getElementById('modalContainer').classList.remove('hidden');

  this._barcodeScanner = new Html5Qrcode('barcodeReaderRegion');
  this._barcodeScanCallback = onDetected;

  this._barcodeScanner.start(
    { facingMode: 'environment' },
    { fps: 10, qrbox: { width: 250, height: 150 } },
    (decodedText) => {
      // Fire once, then stop — prevents the same scan firing repeatedly per frame.
      const cb = this._barcodeScanCallback;
      this._barcodeScanCallback = null;
      this.closeBarcodeScanner();
      if (cb) cb(decodedText);
    },
    () => { /* per-frame "not found yet" errors — expected constantly, ignore */ }
  ).catch((err) => {
    const box = document.getElementById('barcodeScanError');
    if (box) {
      box.textContent = 'Could not access the camera. Make sure you allowed camera permission and are using HTTPS or localhost.';
      box.classList.remove('hidden');
    }
  });
};

MSyncApp.prototype.closeBarcodeScanner = function () {
  if (this._barcodeScanner) {
    this._barcodeScanner.stop().catch(() => {}).finally(() => {
      this._barcodeScanner = null;
      this.closeModal();
    });
  } else {
    this.closeModal();
  }
};
