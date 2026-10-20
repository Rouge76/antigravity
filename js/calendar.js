/**
 * Chronicle WorkPulse - Monthly Calendar & Activity Heatmap
 */

class WorkCalendar {
  constructor() {
    this.currentDate = new Date();
    this.container = document.getElementById('calendar-view');
  }

  init() {
    const prevBtn = document.getElementById('cal-prev-month');
    const nextBtn = document.getElementById('cal-next-month');
    const todayBtn = document.getElementById('cal-today-btn');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.render();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.render();
      });
    }

    if (todayBtn) {
      todayBtn.addEventListener('click', () => {
        this.currentDate = new Date();
        this.render();
      });
    }

    this.render();
  }

  render() {
    const gridEl = document.getElementById('calendar-days-grid');
    const titleEl = document.getElementById('calendar-month-title');
    if (!gridEl) return;

    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    if (titleEl) {
      titleEl.textContent = `${monthNames[month]} ${year}`;
    }

    // Days mapping
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const prevLastDay = new Date(year, month, 0).getDate();

    // Map logs to day
    const logs = window.workStorage.getAllLogs();
    const dayMap = {};
    logs.forEach(l => {
      if (!l.date) return;
      if (!dayMap[l.date]) {
        dayMap[l.date] = {
          totalMinutes: 0,
          tasks: []
        };
      }
      dayMap[l.date].totalMinutes += (Number(l.durationMinutes) || 0);
      dayMap[l.date].tasks.push(l);
    });

    const todayStr = new Date().toISOString().split('T')[0];

    let html = '';

    // Day of week headers
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    weekdays.forEach(w => {
      html += `<div class="calendar-day-header">${w}</div>`;
    });

    // Previous month padding days
    for (let i = firstDayIndex; i > 0; i--) {
      const dayNum = prevLastDay - i + 1;
      html += `
        <div class="calendar-day-cell other-month">
          <div class="cal-day-top">
            <span class="cal-day-num">${dayNum}</span>
          </div>
        </div>
      `;
    }

    // Current month days
    for (let day = 1; day <= lastDayOfMonth; day++) {
      const pad = (n) => String(n).padStart(2, '0');
      const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
      const isToday = dateStr === todayStr;
      const dayData = dayMap[dateStr];

      let hoursBadge = '';
      let tasksHtml = '';
      let cellClass = 'calendar-day-cell';
      if (isToday) cellClass += ' is-today';

      if (dayData && dayData.totalMinutes > 0) {
        const hrs = (dayData.totalMinutes / 60).toFixed(1);
        const isHigh = hrs >= 6;
        hoursBadge = `<span class="cal-day-hours ${isHigh ? 'high-hours' : ''}">${hrs}h</span>`;

        tasksHtml = '<div class="cal-day-pills">';
        dayData.tasks.slice(0, 2).forEach(t => {
          tasksHtml += `<div class="cal-task-pill" title="${t.title}">${t.title}</div>`;
        });
        if (dayData.tasks.length > 2) {
          tasksHtml += `<div class="cal-task-pill">+${dayData.tasks.length - 2} more</div>`;
        }
        tasksHtml += '</div>';
      }

      html += `
        <div class="${cellClass}" onclick="window.workApp.filterBySpecificDate('${dateStr}')" title="Click to view logs for ${dateStr}">
          <div class="cal-day-top">
            <span class="cal-day-num">${day}</span>
            ${hoursBadge}
          </div>
          ${tasksHtml}
        </div>
      `;
    }

    // Next month padding days to fill 7 columns
    const totalRendered = firstDayIndex + lastDayOfMonth;
    const remaining = (7 - (totalRendered % 7)) % 7;
    for (let j = 1; j <= remaining; j++) {
      html += `
        <div class="calendar-day-cell other-month">
          <div class="cal-day-top">
            <span class="cal-day-num">${j}</span>
          </div>
        </div>
      `;
    }

    gridEl.innerHTML = html;
  }
}

window.WorkCalendar = WorkCalendar;
