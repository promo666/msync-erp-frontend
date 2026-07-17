MSyncApp.prototype.renderUsers = async function () {
  const users = await this.api('/users');
  const content = document.getElementById('pageContent');
  content.innerHTML = `
  <div class="fade-in space-y-4">
    <button onclick="app.openAddUserModal()" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"><i class="fas fa-plus mr-2"></i>${t('add_team_member')}</button>
    <div class="glass-panel rounded-xl shadow-sm overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50"><tr class="text-left text-gray-500">
          <th class="p-3">${t('name')}</th><th class="p-3">${t('email')}</th><th class="p-3">${t('role')}</th><th class="p-3">${t('status')}</th><th class="p-3 text-right">${t('actions')}</th>
        </tr></thead>
        <tbody>
          ${users.map(u => `
          <tr class="transaction-row border-b border-gray-50">
            <td class="p-3 font-medium">${this.esc(u.full_name)}</td>
            <td class="p-3 text-gray-500">${this.esc(u.email)}</td>
            <td class="p-3"><span class="px-2 py-0.5 bg-gray-100 rounded text-xs">${t(u.role + '_role')}</span></td>
            <td class="p-3"><span class="px-2 py-0.5 rounded-full text-xs ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">${u.is_active ? t('active') : t('inactive')}</span></td>
            <td class="p-3 text-right space-x-2">
              ${u.id !== this.currentUser.id ? `
              <button onclick="app.toggleUserStatus('${u.id}', ${!u.is_active})" class="text-xs ${u.is_active ? 'text-red-600' : 'text-green-600'} hover:underline">${u.is_active ? t('deactivate') : t('activate')}</button>
              <button onclick="app.openResetPasswordModal('${u.id}')" class="text-xs text-blue-600 hover:underline">${t('reset_password')}</button>` : `<span class="text-xs text-gray-400">${t('you_label')}</span>`}
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
};

MSyncApp.prototype.openAddUserModal = function () {
  document.getElementById('modalContent').innerHTML = `
  <div class="p-6">
    <h3 class="text-lg font-bold mb-4">${t('add_team_member')}</h3>
    <form id="addUserForm" class="space-y-3">
      <div><label class="block text-sm font-medium mb-1">${t('full_name')}</label><input name="full_name" required class="w-full px-3 py-2 border rounded-lg"></div>
      <div><label class="block text-sm font-medium mb-1">${t('email')}</label><input type="email" name="email" required class="w-full px-3 py-2 border rounded-lg"></div>
      <div><label class="block text-sm font-medium mb-1">${t('set_password')}</label><input type="password" name="password" minlength="8" required class="w-full px-3 py-2 border rounded-lg" placeholder="${t('new_password_min8')}"></div>
      <div><label class="block text-sm font-medium mb-1">${t('role')}</label>
        <select name="role" class="w-full px-3 py-2 border rounded-lg">
          <option value="salesman">${t('salesman_role')}</option>
          <option value="admin">${t('admin_role')}</option>
          <option value="owner">${t('owner_role')}</option>
        </select>
      </div>
      <div class="flex gap-3 pt-2">
        <button type="submit" class="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">${t('create')}</button>
        <button type="button" onclick="app.closeModal()" class="flex-1 bg-gray-100 py-2 rounded-lg hover:bg-gray-200">${t('cancel')}</button>
      </div>
    </form>
  </div>`;
  document.getElementById('modalContainer').classList.remove('hidden');
  document.getElementById('addUserForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    try {
      await this.api('/users', { method: 'POST', body: data });
      this.showToast(t('user_created'), 'success');
      this.closeModal();
      this.refreshCurrentPage();
    } catch (err) { this.showToast(err.message, 'error'); }
  });
};

MSyncApp.prototype.toggleUserStatus = async function (userId, activate) {
  try {
    await this.api(`/users/${userId}/status`, { method: 'PATCH', body: { is_active: activate } });
    this.showToast(activate ? t('user_activated') : t('user_deactivated'), 'success');
    this.refreshCurrentPage();
  } catch (err) { this.showToast(err.message, 'error'); }
};

MSyncApp.prototype.openResetPasswordModal = function (userId) {
  document.getElementById('modalContent').innerHTML = `
  <div class="p-6">
    <h3 class="text-lg font-bold mb-2">${t('reset_password_for')}</h3>
    <p class="text-sm text-gray-500 mb-4">${t('reset_password_hint')}</p>
    <form id="resetPwdForm" class="space-y-3">
      <div><label class="block text-sm font-medium mb-1">${t('new_password_min8')}</label><input type="password" name="password" minlength="8" required class="w-full px-3 py-2 border rounded-lg"></div>
      <div class="flex gap-3 pt-2">
        <button type="submit" class="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">${t('save')}</button>
        <button type="button" onclick="app.closeModal()" class="flex-1 bg-gray-100 py-2 rounded-lg hover:bg-gray-200">${t('cancel')}</button>
      </div>
    </form>
  </div>`;
  document.getElementById('modalContainer').classList.remove('hidden');
  document.getElementById('resetPwdForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    try {
      await this.api(`/users/${userId}/reset-password`, { method: 'POST', body: data });
      this.showToast(t('password_updated'), 'success');
      this.closeModal();
    } catch (err) { this.showToast(err.message, 'error'); }
  });
};

// ---------- Change Password (self-service) ----------
MSyncApp.prototype.openChangePassword = function (forced) {
  document.getElementById('modalContent').innerHTML = `
  <div class="p-6">
    <h3 class="text-lg font-bold mb-2">${forced ? t('set_new_password_title') : t('change_password_title')}</h3>
    ${forced ? `<p class="text-sm text-gray-500 mb-4">${t('temp_password_notice')}</p>` : ''}
    <form id="changePwdForm" class="space-y-3">
      ${!forced ? `<div><label class="block text-sm font-medium mb-1">${t('current_password')}</label><input type="password" name="current_password" required class="w-full px-3 py-2 border rounded-lg"></div>` : `<input type="hidden" name="current_password" value="">`}
      <div><label class="block text-sm font-medium mb-1">${t('new_password_min8')}</label><input type="password" name="new_password" minlength="8" required class="w-full px-3 py-2 border rounded-lg"></div>
      <div class="flex gap-3 pt-2">
        <button type="submit" class="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">${t('save')}</button>
        ${!forced ? `<button type="button" onclick="app.closeModal()" class="flex-1 bg-gray-100 py-2 rounded-lg hover:bg-gray-200">${t('cancel')}</button>` : ''}
      </div>
    </form>
  </div>`;
  document.getElementById('modalContainer').classList.remove('hidden');
  document.getElementById('changePwdForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    try {
      await this.api('/auth/change-password', { method: 'POST', body: data });
      this.showToast(t('password_updated'), 'success');
      this.closeModal();
    } catch (err) { this.showToast(err.message, 'error'); }
  });
};
