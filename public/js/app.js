// ===== API Helper =====
const API = {
  async get(url) {
    const res = await fetch(url);
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'İstek başarısız'); }
    return res.json();
  },
  async post(url, data) {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'İstek başarısız'); }
    return res.json();
  },
  async put(url, data) {
    const res = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'İstek başarısız'); }
    return res.json();
  },
  async del(url) {
    const res = await fetch(url, { method: 'DELETE' });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'İstek başarısız'); }
    return res.json();
  }
};

// ===== Toast Notifications =====
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ===== Page Navigation =====
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const pages = document.querySelectorAll('.page');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const target = item.dataset.page;

      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      pages.forEach(p => p.classList.remove('active'));
      document.getElementById(`${target}-page`).classList.add('active');

      // Trigger page load
      if (target === 'dashboard') loadDashboard();
      if (target === 'staff') loadStaffList();
      if (target === 'timeoff') loadTimeOffPage();
      if (target === 'calendar') loadCalendar();
      if (target === 'settings') loadSettings();
    });
  });
}

// ===== Dashboard =====
async function loadDashboard() {
  try {
    const staff = await API.get('/api/staff');
    const baristaCount = staff.filter(s => s.role === 'Barista').length;
    const garsonCount = staff.filter(s => s.role === 'Garson').length;

    document.querySelector('#stat-total-staff .stat-value').textContent = staff.length;
    document.querySelector('#stat-barista-count .stat-value').textContent = baristaCount;
    document.querySelector('#stat-garson-count .stat-value').textContent = garsonCount;

    // Today's shift
    const today = new Date().toISOString().slice(0, 10);
    const options = await API.get(`/api/shifts/options?date=${today}`);
    const selected = options.find(o => o.is_selected);

    const todayContainer = document.getElementById('today-shift-display');
    if (selected && selected.assignments.length > 0) {
      document.querySelector('#stat-today-shift .stat-value').textContent = selected.assignments.length;
      todayContainer.innerHTML = renderAssignmentList(selected.assignments);
    } else {
      document.querySelector('#stat-today-shift .stat-value').textContent = '—';
      todayContainer.innerHTML = '<p class="empty-state">Henüz bugün için vardiya oluşturulmamış.</p>';
    }

    // Week time-offs
    const now = new Date();
    const weekContainer = document.getElementById('week-timeoff-display');
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const timeOffs = await API.get(`/api/time-off?year=${year}&month=${month}`);
    const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay() + 1);
    const endOfWeek = new Date(startOfWeek); endOfWeek.setDate(startOfWeek.getDate() + 6);

    const weekTimeOffs = timeOffs.filter(t => {
      const d = new Date(t.date + 'T00:00:00');
      return d >= startOfWeek && d <= endOfWeek;
    });

    if (weekTimeOffs.length > 0) {
      weekContainer.innerHTML = weekTimeOffs.map(t =>
        `<div class="assignment-item assignment-${t.role.toLowerCase()}" style="margin-bottom:4px">
          <span class="assignment-name">${t.first_name} ${t.last_name}</span>
          <span class="badge badge-${t.role.toLowerCase()}">${t.role}</span>
          <span class="assignment-time">${formatDate(t.date)}</span>
        </div>`
      ).join('');
    } else {
      weekContainer.innerHTML = '<p class="empty-state">Bu hafta izinli personel yok.</p>';
    }
  } catch (err) {
    console.error('Dashboard yükleme hatası:', err);
  }
}

function renderAssignmentList(assignments) {
  const groups = { Sabah: [], Araci: [], Aksam: [] };
  assignments.forEach(a => {
    const type = a.shift_type || 'Sabah';
    if (groups[type]) groups[type].push(a);
  });

  let html = '';
  const labels = { Sabah: '🌅 Sabah Vardiyası', Araci: '☀️ Aracı Vardiya', Aksam: '🌙 Akşam Vardiyası' };

  for (const [type, items] of Object.entries(groups)) {
    if (items.length === 0) continue;
    html += `<div class="shift-section-title">${labels[type]}</div>`;
    items.forEach(a => {
      const name = a.staff_name || `${a.first_name} ${a.last_name}`;
      const role = a.role;
      const cls = role === 'Barista' ? 'barista' : 'garson';
      html += `<div class="assignment-item assignment-${cls}">
        <span class="assignment-name">${name} — ${role}</span>
        ${a.consecutive_day > 1 ? `<span class="consecutive-badge">${a.consecutive_day}. Gün</span>` : ''}
        <span class="assignment-time">${a.start_time} - ${a.end_time}</span>
      </div>`;
    });
  }
  return html;
}

// ===== Settings =====
async function loadSettings() {
  try {
    const config = await API.get('/api/shifts/config');
    const grid = document.getElementById('settings-grid');
    grid.innerHTML = '';

    for (const dayType of ['weekday', 'weekend']) {
      const label = dayType === 'weekday' ? 'Haftaiçi' : 'Haftasonu';
      let card = `<div class="settings-card"><h3>${label}</h3>`;
      for (const role of ['Barista', 'Garson']) {
        const cfg = config[dayType]?.[role] || { min: 1, target: 2 };
        card += `
          <div class="settings-row">
            <label>${role} — Min</label>
            <input type="number" min="1" max="20" value="${cfg.min}" data-daytype="${dayType}" data-role="${role}" data-field="min">
          </div>
          <div class="settings-row">
            <label>${role} — Hedef</label>
            <input type="number" min="1" max="20" value="${cfg.target}" data-daytype="${dayType}" data-role="${role}" data-field="target">
          </div>`;
      }
      card += `<button class="btn btn-primary btn-sm" style="margin-top:.8rem" onclick="saveSettings('${dayType}')">Kaydet</button></div>`;
      grid.innerHTML += card;
    }
  } catch (err) { showToast('Ayarlar yüklenemedi: ' + err.message, 'error'); }
}

async function saveSettings(dayType) {
  try {
    const inputs = document.querySelectorAll(`input[data-daytype="${dayType}"]`);
    const data = {};
    inputs.forEach(inp => {
      const role = inp.dataset.role;
      const field = inp.dataset.field;
      if (!data[role]) data[role] = {};
      data[role][field] = parseInt(inp.value);
    });
    for (const role of Object.keys(data)) {
      await API.put('/api/shifts/config', {
        day_type: dayType,
        role: role,
        min_count: data[role].min,
        target_count: data[role].target
      });
    }
    showToast('Ayarlar kaydedildi!', 'success');
  } catch (err) { showToast('Kaydetme hatası: ' + err.message, 'error'); }
}

// ===== Utility =====
function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  loadDashboard();
});
