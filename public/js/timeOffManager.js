// ===== Time Off Manager Module =====

async function loadTimeOffPage() {
  await populateTimeOffStaffSelects();
  await loadTimeOffList();
}

async function populateTimeOffStaffSelects() {
  try {
    const staff = await API.get('/api/staff');
    const formSelect = document.getElementById('timeoff-staff');
    const filterSelect = document.getElementById('timeoff-filter-staff');

    const opts = staff.map(s => `<option value="${s.id}">${s.first_name} ${s.last_name} (${s.role})</option>`).join('');
    formSelect.innerHTML = '<option value="">Personel seçin...</option>' + opts;
    filterSelect.innerHTML = '<option value="">Tüm personel</option>' + opts;
  } catch (err) {
    showToast('Personel listesi yüklenemedi', 'error');
  }
}

async function loadTimeOffList() {
  try {
    const params = new URLSearchParams();
    const staffId = document.getElementById('timeoff-filter-staff').value;
    const monthInput = document.getElementById('timeoff-filter-month').value;

    if (staffId) params.set('staffId', staffId);
    if (monthInput) {
      const [y, m] = monthInput.split('-');
      params.set('year', y);
      params.set('month', m);
    }

    const timeOffs = await API.get(`/api/time-off?${params.toString()}`);
    const tbody = document.getElementById('timeoff-table-body');

    if (timeOffs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Kayıt bulunamadı.</td></tr>';
      return;
    }

    tbody.innerHTML = timeOffs.map(t => `
      <tr>
        <td><strong>${t.first_name} ${t.last_name}</strong></td>
        <td>${formatDate(t.date)}</td>
        <td><span class="badge badge-${t.role.toLowerCase()}">${t.role}</span></td>
        <td>${t.note || '—'}</td>
        <td><button class="btn btn-sm btn-danger" onclick="deleteTimeOff(${t.id})">Sil</button></td>
      </tr>
    `).join('');
  } catch (err) {
    showToast('İzin listesi yüklenemedi: ' + err.message, 'error');
  }
}

document.getElementById('timeoff-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = {
    staff_id: parseInt(document.getElementById('timeoff-staff').value),
    date: document.getElementById('timeoff-date').value,
    note: document.getElementById('timeoff-note').value.trim()
  };

  try {
    await API.post('/api/time-off', data);
    showToast('İzin eklendi!', 'success');
    document.getElementById('timeoff-form').reset();
    loadTimeOffList();
  } catch (err) {
    showToast('Hata: ' + err.message, 'error');
  }
});

async function deleteTimeOff(id) {
  if (!confirm('Bu izni silmek istediğinize emin misiniz?')) return;
  try {
    await API.del(`/api/time-off/${id}`);
    showToast('İzin silindi.', 'success');
    loadTimeOffList();
  } catch (err) {
    showToast('Silme hatası: ' + err.message, 'error');
  }
}

document.getElementById('timeoff-filter-staff').addEventListener('change', loadTimeOffList);
document.getElementById('timeoff-filter-month').addEventListener('change', loadTimeOffList);
