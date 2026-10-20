/**
 * Chronicle WorkPulse - Analytics & Insights Engine
 */

class WorkAnalytics {
  constructor() {
    this.container = document.getElementById('analytics-view');
  }

  calculateMetrics(logs) {
    if (!logs || logs.length === 0) {
      return {
        totalHours: 0,
        completedCount: 0,
        avgFocus: 0,
        streakDays: 0,
        projectHours: {},
        dailyHours: {},
        categoryHours: {}
      };
    }

    let totalMinutes = 0;
    let completedCount = 0;
    let focusSum = 0;
    let focusCount = 0;
    const projectHours = {};
    const dailyHours = {};
    const categoryHours = {};
    const logDatesSet = new Set();

    logs.forEach(log => {
      const mins = Number(log.durationMinutes) || 0;
      totalMinutes += mins;

      if (log.status === 'completed') {
        completedCount++;
      }

      if (log.focusRating) {
        focusSum += Number(log.focusRating);
        focusCount++;
      }

      if (log.date) {
        logDatesSet.add(log.date);
        dailyHours[log.date] = (dailyHours[log.date] || 0) + mins;
      }

      const p = log.project || 'General';
      projectHours[p] = (projectHours[p] || 0) + mins;

      const c = log.category || 'Engineering';
      categoryHours[c] = (categoryHours[c] || 0) + mins;
    });

    // Calculate Streak
    let streakDays = 0;
    const sortedDates = Array.from(logDatesSet).sort().reverse();
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // If logged today or yesterday, streak is currently active
    if (logDatesSet.has(todayStr) || logDatesSet.has(yesterdayStr)) {
      let checkDate = new Date();
      if (!logDatesSet.has(todayStr)) {
        checkDate.setDate(checkDate.getDate() - 1);
      }
      while (true) {
        const dStr = checkDate.toISOString().split('T')[0];
        if (logDatesSet.has(dStr)) {
          streakDays++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    return {
      totalHours: (totalMinutes / 60).toFixed(1),
      completedCount,
      avgFocus: focusCount > 0 ? (focusSum / focusCount).toFixed(1) : '5.0',
      streakDays: Math.max(streakDays, 1),
      projectHours,
      dailyHours,
      categoryHours,
      totalMinutes
    };
  }

  renderOverviewCards(metrics) {
    const totalHoursEl = document.getElementById('stat-total-hours');
    const completedEl = document.getElementById('stat-tasks-completed');
    const focusEl = document.getElementById('stat-avg-focus');
    const streakEl = document.getElementById('stat-streak-days');

    if (totalHoursEl) totalHoursEl.innerHTML = `${metrics.totalHours} <span class="stat-unit">hrs</span>`;
    if (completedEl) completedEl.innerHTML = `${metrics.completedCount} <span class="stat-unit">tasks</span>`;
    if (focusEl) focusEl.innerHTML = `${metrics.avgFocus} <span class="stat-unit">/ 5.0</span>`;
    if (streakEl) streakEl.innerHTML = `${metrics.streakDays} <span class="stat-unit">days 🔥</span>`;
  }

  renderDailyHoursChart(dailyHours) {
    const chartContainer = document.getElementById('daily-bar-chart');
    if (!chartContainer) return;

    // Generate past 7 days sequence
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      const mins = dailyHours[iso] || 0;
      const hours = (mins / 60);
      days.push({
        date: iso,
        name: dayNames[d.getDay()],
        shortDate: `${d.getMonth() + 1}/${d.getDate()}`,
        hours: hours,
        isToday: i === 0
      });
    }

    const maxHours = Math.max(8, ...days.map(d => d.hours));

    let html = '<div class="bar-chart-wrap">';
    days.forEach(day => {
      const heightPercent = Math.min(100, Math.round((day.hours / (maxHours * 1.15)) * 100));
      const hoursFormatted = day.hours > 0 ? `${day.hours.toFixed(1)}h` : '0h';
      const activeColor = day.hours >= 6 ? 'linear-gradient(180deg, #10b981 0%, #059669 100%)' :
                          day.hours >= 3 ? 'linear-gradient(180deg, #06b6d4 0%, #6366f1 100%)' :
                          'linear-gradient(180deg, #6366f1 0%, #4f46e5 100%)';

      html += `
        <div class="bar-col" title="${day.date}: ${day.hours.toFixed(1)} hours logged">
          <span class="bar-value-label">${hoursFormatted}</span>
          <div class="bar-bar-track">
            <div class="bar-bar-fill" style="height: ${Math.max(4, heightPercent)}%; background: ${activeColor};"></div>
          </div>
          <span class="bar-day-label" style="${day.isToday ? 'color: var(--accent-primary); font-weight: 700;' : ''}">${day.name}</span>
        </div>
      `;
    });
    html += '</div>';

    chartContainer.innerHTML = html;
  }

  renderProjectDonut(projectHours, totalMinutes) {
    const donutContainer = document.getElementById('project-donut-chart');
    if (!donutContainer) return;

    if (!totalMinutes || totalMinutes === 0) {
      donutContainer.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 2rem;">No logged project data yet.</div>';
      return;
    }

    const colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6'];
    const entries = Object.entries(projectHours).sort((a, b) => b[1] - a[1]);

    // SVG Donut calculation
    let cumulativeAngle = 0;
    const slices = [];
    const radius = 64;
    const cx = 80;
    const cy = 80;

    entries.forEach(([name, mins], idx) => {
      const percent = (mins / totalMinutes);
      const angle = percent * 360;
      const color = colors[idx % colors.length];

      const startAngle = cumulativeAngle;
      const endAngle = cumulativeAngle + angle;
      cumulativeAngle += angle;

      // Arc coordinates
      const startRad = (startAngle - 90) * Math.PI / 180;
      const endRad = (endAngle - 90) * Math.PI / 180;

      const x1 = cx + radius * Math.cos(startRad);
      const y1 = cy + radius * Math.sin(startRad);
      const x2 = cx + radius * Math.cos(endRad);
      const y2 = cy + radius * Math.sin(endRad);

      const largeArc = angle > 180 ? 1 : 0;
      const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

      slices.push({
        name,
        mins,
        hours: (mins / 60).toFixed(1),
        percent: Math.round(percent * 100),
        color,
        pathData
      });
    });

    let svgHtml = `
      <svg width="160" height="160" viewBox="0 0 160 160" style="filter: drop-shadow(0 4px 12px rgba(0,0,0,0.3));">
        ${slices.map(s => `<path d="${s.pathData}" fill="${s.color}" opacity="0.9" style="transition: opacity 0.2s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.9'"><title>${s.name}: ${s.hours}h (${s.percent}%)</title></path>`).join('')}
        <circle cx="${cx}" cy="${cy}" r="38" fill="var(--bg-card)" />
        <text x="${cx}" y="${cy - 2}" text-anchor="middle" fill="var(--text-muted)" font-size="10" font-weight="600">PROJECTS</text>
        <text x="${cx}" y="${cy + 14}" text-anchor="middle" fill="var(--text-primary)" font-size="14" font-weight="700" font-family="var(--font-mono)">${entries.length}</text>
      </svg>
    `;

    let legendHtml = '<div class="legend-list">';
    slices.slice(0, 5).forEach(s => {
      legendHtml += `
        <div class="legend-item">
          <div class="legend-color-dot" style="background: ${s.color};"></div>
          <span style="flex: 1; color: var(--text-primary); font-weight: 600; font-size: 0.8rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 140px;">${s.name}</span>
          <span style="font-family: var(--font-mono); font-size: 0.78rem; color: var(--text-secondary);">${s.hours}h (${s.percent}%)</span>
        </div>
      `;
    });
    legendHtml += '</div>';

    donutContainer.innerHTML = `
      <div class="donut-legend-wrap">
        ${svgHtml}
        ${legendHtml}
      </div>
    `;
  }

  renderCategoryBars(categoryHours, totalMinutes) {
    const catContainer = document.getElementById('category-breakdown-container');
    if (!catContainer) return;

    if (!totalMinutes || totalMinutes === 0) {
      catContainer.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 2rem;">No logged category data.</div>';
      return;
    }

    const entries = Object.entries(categoryHours).sort((a, b) => b[1] - a[1]);
    let html = '<div style="display: flex; flex-direction: column; gap: 0.9rem;">';

    entries.forEach(([cat, mins]) => {
      const pct = Math.round((mins / totalMinutes) * 100);
      const hours = (mins / 60).toFixed(1);
      html += `
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 0.35rem;">
            <span style="font-weight: 600; color: var(--text-primary);">${cat}</span>
            <span style="font-family: var(--font-mono); color: var(--text-secondary);">${hours} hrs (${pct}%)</span>
          </div>
          <div style="height: 7px; background: rgba(255,255,255,0.06); border-radius: 999px; overflow: hidden;">
            <div style="width: ${pct}%; height: 100%; background: linear-gradient(90deg, var(--accent-primary), var(--accent-cyan)); border-radius: 999px;"></div>
          </div>
        </div>
      `;
    });
    html += '</div>';

    catContainer.innerHTML = html;
  }

  updateAll() {
    const logs = window.workStorage.getAllLogs();
    const metrics = this.calculateMetrics(logs);
    this.renderOverviewCards(metrics);
    this.renderDailyHoursChart(metrics.dailyHours);
    this.renderProjectDonut(metrics.projectHours, metrics.totalMinutes);
    this.renderCategoryBars(metrics.categoryHours, metrics.totalMinutes);
  }
}

window.WorkAnalytics = WorkAnalytics;
