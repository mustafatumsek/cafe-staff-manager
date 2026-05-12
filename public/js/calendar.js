// ===== Calendar Module =====

let calendarYear, calendarMonth;

function initCalendarDate() {
  const now = new Date();
  calendarYear = now.getFullYear();
  calendarMonth = now.getMonth() + 1;
}

async function loadCalendar() {
  if (!calendarYear) initCalendarDate();

  const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  document.getElementById('cal-month-title').textContent = `${monthNames[calendarMonth - 1]} ${calendarYear}`;

  try {
    const calendarData = await API.get(`/api/shifts/calendar?year=${calendarYear}&month=${calendarMonth}`);
    renderCalendar(calendarData);
  } catch (err) {
    showToast('Takvim yüklenemedi: ' + err.message, 'error');
  }
}

function renderCalendar(data) {
  const grid = document.getElementById('calendar-grid');
  const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  const today = new Date().toISOString().slice(0, 10);

  let html = dayNames.map(d => `<div class="cal-header">${d}</div>`).join('');

  const firstDay = new Date(calendarYear, calendarMonth - 1, 1);
  let startDay = firstDay.getDay(); // 0=Sun
  startDay = startDay === 0 ? 6 : startDay - 1; // Convert to Mon=0

  const daysInMonth = new Date(calendarYear, calendarMonth, 0).getDate();

  // Empty cells before month start
  for (let i = 0; i < startDay; i++) {
    html += '<div class="cal-day empty"></div>';
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${calendarYear}-${String(calendarMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayOfWeek = new Date(calendarYear, calendarMonth - 1, day).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isToday = dateStr === today;

    let classes = 'cal-day';
    if (isWeekend) classes += ' weekend';
    if (isToday) classes += ' today';

    const shifts = data[dateStr] || [];

    let shiftsHtml = '';
    if (shifts.length > 0) {
      // Group by shift type
      const byType = { Sabah: [], Araci: [], Aksam: [] };
      shifts.forEach(s => { if (byType[s.shift_type]) byType[s.shift_type].push(s); });

      for (const [, items] of Object.entries(byType)) {
        items.forEach(s => {
          const cls = s.role === 'Barista' ? 'cal-shift-barista' : 'cal-shift-garson';
          const consec = s.consecutive_day > 1 ? ` (${s.consecutive_day}.Gün)` : '';
          shiftsHtml += `<div class="${cls}" title="${s.start_time}-${s.end_time}">${s.staff_name} - ${s.role}${consec}</div>`;
        });
      }
    }

    html += `<div class="${classes}">
      <div class="cal-day-number">${day}</div>
      ${shiftsHtml}
    </div>`;
  }

  grid.innerHTML = html;
}

document.getElementById('cal-prev').addEventListener('click', () => {
  calendarMonth--;
  if (calendarMonth < 1) { calendarMonth = 12; calendarYear--; }
  loadCalendar();
});

document.getElementById('cal-next').addEventListener('click', () => {
  calendarMonth++;
  if (calendarMonth > 12) { calendarMonth = 1; calendarYear++; }
  loadCalendar();
});
