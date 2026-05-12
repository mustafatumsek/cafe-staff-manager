// ===== Shift Generator Module =====

document.getElementById('generate-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const date = document.getElementById('generate-date').value;
  if (!date) return showToast('Lütfen bir tarih seçin.', 'error');

  const container = document.getElementById('shift-options-container');
  container.innerHTML = '<div class="glass-card" style="text-align:center;padding:2rem"><p>⏳ Vardiya alternatifleri üretiliyor...</p></div>';

  try {
    const options = await API.post('/api/shifts/generate', { date });
    renderShiftOptions(options, date);
  } catch (err) {
    container.innerHTML = '';
    showToast('Vardiya üretme hatası: ' + err.message, 'error');
  }
});

function renderShiftOptions(options, date) {
  const container = document.getElementById('shift-options-container');
  const dayOfWeek = new Date(date + 'T00:00:00').getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const dayLabel = isWeekend ? '🗓️ Haftasonu' : '🗓️ Haftaiçi';

  container.innerHTML = `<div style="grid-column:1/-1;margin-bottom:.5rem">
    <span class="badge" style="background:rgba(102,126,234,.15);color:var(--accent-blue);font-size:.9rem;padding:.4rem .8rem">${dayLabel} — ${formatDate(date)}</span>
  </div>` + options.map(opt => {
    const selectedClass = opt.is_selected ? 'selected' : '';
    const validIcon = opt.validation?.valid ? '✅' : '⚠️';

    const assignmentsHtml = renderOptionAssignments(opt.assignments);

    return `<div class="option-card ${selectedClass}" id="option-card-${opt.id}">
      <div class="option-header">
        <span class="option-number">Opsiyon ${opt.option_number} ${validIcon}</span>
        ${opt.is_selected
          ? '<span class="badge badge-cash">✓ Seçildi</span>'
          : `<button class="btn btn-sm btn-success" onclick="selectShiftOption(${opt.id}, '${date}')">Seç</button>`
        }
      </div>
      <div class="option-desc">${opt.description || ''}</div>
      <div class="option-assignments">${assignmentsHtml}</div>
      <div style="font-size:.75rem;color:var(--text-muted)">Toplam: ${opt.assignments.length} personel</div>
    </div>`;
  }).join('');
}

function renderOptionAssignments(assignments) {
  if (!assignments || assignments.length === 0) return '<p class="empty-state">Atama yapılamadı.</p>';

  const groups = { Sabah: [], Araci: [], Aksam: [] };
  assignments.forEach(a => {
    if (groups[a.shift_type]) groups[a.shift_type].push(a);
  });

  const labels = { Sabah: '🌅 Sabah', Araci: '☀️ Aracı', Aksam: '🌙 Akşam' };
  let html = '';

  for (const [type, items] of Object.entries(groups)) {
    if (items.length === 0) continue;
    html += `<div class="shift-section-title">${labels[type]} (${items[0].start_time} - ${items[0].end_time})</div>`;
    items.forEach(a => {
      const name = a.staff_name || `${a.first_name} ${a.last_name}`;
      const role = a.role;
      const cls = role === 'Barista' ? 'barista' : 'garson';
      const cashIcon = a.cash_register_auth ? ' 💰' : '';
      html += `<div class="assignment-item assignment-${cls}">
        <span class="badge badge-${cls}" style="font-size:.7rem">${role}</span>
        <span class="assignment-name">${name}${cashIcon}</span>
        ${a.consecutive_day > 1 ? `<span class="consecutive-badge">${a.consecutive_day}. Gün</span>` : ''}
      </div>`;
    });
  }
  return html;
}

async function selectShiftOption(optionId, date) {
  try {
    const options = await API.post(`/api/shifts/select/${optionId}`);
    showToast('Vardiya seçildi!', 'success');
    renderShiftOptions(options, date);
  } catch (err) {
    showToast('Seçim hatası: ' + err.message, 'error');
  }
}

// Also check if there are existing options when date changes
document.getElementById('generate-date').addEventListener('change', async (e) => {
  const date = e.target.value;
  if (!date) return;
  try {
    const options = await API.get(`/api/shifts/options?date=${date}`);
    if (options.length > 0) {
      renderShiftOptions(options, date);
    } else {
      document.getElementById('shift-options-container').innerHTML = '';
    }
  } catch (err) { /* ignore */ }
});
