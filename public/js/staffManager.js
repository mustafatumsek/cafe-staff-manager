// ===== Staff Manager Module =====

async function loadStaffList() {
  try {
    const staff = await API.get('/api/staff');
    const tbody = document.getElementById('staff-table-body');
    if (staff.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Henüz personel eklenmemiş.</td></tr>';
      return;
    }
    tbody.innerHTML = staff.map(s => `
      <tr>
        <td><strong>${s.first_name} ${s.last_name}</strong></td>
        <td><span class="badge badge-${s.role.toLowerCase()}">${s.role}</span></td>
        <td><span class="badge badge-availability">${s.standard_availability === 'Araci' ? 'Aracı' : s.standard_availability === 'Aksam' ? 'Akşam' : s.standard_availability}</span></td>
        <td>${s.cash_register_auth ? '<span class="badge badge-cash">✓ Yetkili</span>' : '<span class="badge badge-no-cash">Yetki Yok</span>'}</td>
        <td>
          <button class="btn btn-sm btn-edit" onclick="editStaff(${s.id})">Düzenle</button>
          <button class="btn btn-sm btn-danger" onclick="deleteStaff(${s.id}, '${s.first_name} ${s.last_name}')">Sil</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    showToast('Personel listesi yüklenemedi: ' + err.message, 'error');
  }
}

// Form submit
document.getElementById('staff-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const editId = document.getElementById('staff-edit-id').value;
  const data = {
    first_name: document.getElementById('staff-first-name').value.trim(),
    last_name: document.getElementById('staff-last-name').value.trim(),
    role: document.getElementById('staff-role').value,
    standard_availability: document.getElementById('staff-availability').value,
    cash_register_auth: document.getElementById('staff-cash-auth').checked
  };

  try {
    if (editId) {
      await API.put(`/api/staff/${editId}`, data);
      showToast('Personel güncellendi!', 'success');
    } else {
      await API.post('/api/staff', data);
      showToast('Personel eklendi!', 'success');
    }
    resetStaffForm();
    loadStaffList();
  } catch (err) {
    showToast('Hata: ' + err.message, 'error');
  }
});

async function editStaff(id) {
  try {
    const s = await API.get(`/api/staff/${id}`);
    document.getElementById('staff-edit-id').value = s.id;
    document.getElementById('staff-first-name').value = s.first_name;
    document.getElementById('staff-last-name').value = s.last_name;
    document.getElementById('staff-role').value = s.role;
    document.getElementById('staff-availability').value = s.standard_availability;
    document.getElementById('staff-cash-auth').checked = !!s.cash_register_auth;
    document.getElementById('staff-submit-btn').innerHTML = '<span>Güncelle</span>';
    document.getElementById('staff-cancel-btn').style.display = 'inline-flex';
    document.getElementById('staff-form').scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    showToast('Personel bilgisi alınamadı', 'error');
  }
}

async function deleteStaff(id, name) {
  if (!confirm(`"${name}" personelini silmek istediğinize emin misiniz?`)) return;
  try {
    await API.del(`/api/staff/${id}`);
    showToast(`${name} silindi.`, 'success');
    loadStaffList();
  } catch (err) {
    showToast('Silme hatası: ' + err.message, 'error');
  }
}

function resetStaffForm() {
  document.getElementById('staff-form').reset();
  document.getElementById('staff-edit-id').value = '';
  document.getElementById('staff-submit-btn').innerHTML = '<span>Personel Ekle</span>';
  document.getElementById('staff-cancel-btn').style.display = 'none';
}

document.getElementById('staff-cancel-btn').addEventListener('click', resetStaffForm);
