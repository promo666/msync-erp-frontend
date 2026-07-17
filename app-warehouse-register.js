document.getElementById('registerWarehouseForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const warehouse_name = document.getElementById('rwWarehouseName').value.trim();
  const owner_name = document.getElementById('rwOwnerName').value.trim();
  const email = document.getElementById('rwEmail').value.trim();
  const password = document.getElementById('rwPassword').value;
  const errBox = document.getElementById('registerWarehouseError');
  const btn = document.getElementById('registerWarehouseBtn');
  errBox.classList.add('hidden');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Creating...';

  try {
    const data = await app.api('/auth/register-warehouse', {
      method: 'POST',
      body: { warehouse_name, owner_name, email, password }
    });
    app.token = data.token;
    app.currentUser = data.user;
    sessionStorage.setItem('msync_token', app.token);
    sessionStorage.setItem('msync_user', JSON.stringify(app.currentUser));
    app.showToast(`Warehouse "${warehouse_name}" created!`, 'success');
    app.showMainApp();
  } catch (err) {
    errBox.textContent = err.message;
    errBox.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-check mr-2"></i> Create Warehouse';
  }
});
