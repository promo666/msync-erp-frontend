MSyncApp.prototype.renderUsers = async function () {
  const users = await this.api('/users');
  const content = document.getElementById('pageContent');
  content.innerHTML = `
  <div class="fade-in space-y-4">
    <button onclick="app.openAddUserModal()" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"><i class="fas fa-plus mr-2"></i>Add Team Member</button>
    <div class="glass-panel rounded-xl shadow-sm overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50"><tr class="text-left text-gray-500">
          <th class="p-3">Name</th><th class="p-3">Email</th><th class="p-3">Role</th><th class="p-3">Status</th><th class="p-3 text-right">Actions</th>
        </tr></thead>
        <tbody>
          ${users.map(u => `
          <tr class="transaction-row border-b border-gray-50">
            <td class="p-3 font-medium">${this.esc(u.full_name)}</td>
            <td class="p-3 text-gray-500">${this.esc(u.email)}</td>
            <td class="p-3"><span class="px-2 py-0.5 bg-gray-100 rounded text-xs capitalize">${u.role}</span></td>
            <td class="p-3"><span class="px-2 py-0.5 rounded-full text-xs ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">${u.is_active ? 'Active' : 'Inactive'}</span></td>
            <td class="p-3 text-right space-x-2">
              ${u.id !== this.currentUser.id ? `
              <button onclick="app.toggleUserStatus('${u.id}', ${!u.is_active})" class="text-xs ${u.is_active ? 'text-red-600' : 'text-green-600'} hover:underline">${u.is_active ? 'Deactivate' : 'Activate'}</button>
              <button onclick="app.resetUserPassword('${u.id}')" class="text-xs text-blue-600 hover:underline">Reset Password</button>` : '<span class="text-xs text-gray-400">You</span>'}
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
    <h3 class="text-lg font-bold mb-4">Add Team Member</h3>
    <form id="addUserForm" class="space-y-3">
      <div><label class="block text-sm font-medium mb-1">Full Name</label><input name="full_name" required class="w-full px-3 py-2 border rounded-lg"></div>
      <div><label class="block text-sm font-medium mb-1">Email</label><input type="email" name="email" required class="w-full px-3 py-2 border rounded-lg"></div>
      <div><label class="block text-sm font-medium mb-1">Role</label>
        <select name="role" class="w-full px-3 py-2 border rounded-lg">
          <option value="salesman">Salesman</option>
          <option value="admin">Admin</option>
          <option value="owner">Owner</option>
        </select>
      </div>
      <div class="flex gap-3 pt-2">
        <button type="submit" class="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Create</button>
        <button type="button" onclick="app.closeModal()" class="flex-1 bg-gray-100 py-2 rounded-lg hover:bg-gray-200">Cancel</button>
      </div>
    </form>
  </div>`;
  document.getElementById('modalContainer').classList.remove('hidden');
  document.getElementById('addUserForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    try {
      const created = await this.api('/users', { method: 'POST', body: data });
      this.showTempPasswordModal(created.email, created.temp_password);
      this.refreshCurrentPage();
    } catch (err) { this.showToast(err.message, 'error'); }
  });
};

MSyncApp.prototype.showTempPasswordModal = function (email, tempPassword) {
  document.getElementById('modalContent').innerHTML = `
  <div class="p-6 text-center">
    <i class="fas fa-check-circle text-green-500 text-4xl mb-3"></i>
    <h3 class="text-lg font-bold mb-2">Account Created</h3>
    <p class="text-sm text-gray-600 mb-4">Share this temporary password with <strong>${this.esc(email)}</strong> securely (e.g. in person or a private message).
    It will only be shown once — they'll be asked to change it on first login.</p>
    <div class="bg-gray-100 rounded-lg p-3 font-mono text-lg font-bold mb-4">${this.esc(tempPassword)}</div>
    <button onclick="app.closeModal()" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Done</button>
  </div>`;
  document.getElementById('modalContainer').classList.remove('hidden');
};

MSyncApp.prototype.toggleUserStatus = async function (userId, activate) {
  try {
    await this.api(`/users/${userId}/status`, { method: 'PATCH', body: { is_active: activate } });
    this.showToast(activate ? 'User activated' : 'User deactivated', 'success');
    this.refreshCurrentPage();
  } catch (err) { this.showToast(err.message, 'error'); }
};

MSyncApp.prototype.resetUserPassword = async function (userId) {
  if (!confirm('Reset this user\'s password? They will need the new temporary password.')) return;
  try {
    const res = await this.api(`/users/${userId}/reset-password`, { method: 'POST' });
    this.showTempPasswordModal('this user', res.temp_password);
  } catch (err) { this.showToast(err.message, 'error'); }
};

// ---------- Change Password (self-service) ----------
MSyncApp.prototype.openChangePassword = function (forced) {
  document.getElementById('modalContent').innerHTML = `
  <div class="p-6">
    <h3 class="text-lg font-bold mb-2">${forced ? 'Set a New Password' : 'Change Password'}</h3>
    ${forced ? '<p class="text-sm text-gray-500 mb-4">You\'re using a temporary password. Please set your own before continuing.</p>' : ''}
    <form id="changePwdForm" class="space-y-3">
      ${!forced ? `<div><label class="block text-sm font-medium mb-1">Current Password</label><input type="password" name="current_password" required class="w-full px-3 py-2 border rounded-lg"></div>` : `<input type="hidden" name="current_password" value="">`}
      <div><label class="block text-sm font-medium mb-1">New Password (min 8 characters)</label><input type="password" name="new_password" minlength="8" required class="w-full px-3 py-2 border rounded-lg"></div>
      <div class="flex gap-3 pt-2">
        <button type="submit" class="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Save</button>
        ${!forced ? `<button type="button" onclick="app.closeModal()" class="flex-1 bg-gray-100 py-2 rounded-lg hover:bg-gray-200">Cancel</button>` : ''}
      </div>
    </form>
  </div>`;
  document.getElementById('modalContainer').classList.remove('hidden');
  document.getElementById('changePwdForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    try {
      await this.api('/auth/change-password', { method: 'POST', body: data });
      this.showToast('Password updated', 'success');
      this.closeModal();
    } catch (err) { this.showToast(err.message, 'error'); }
  });
};
