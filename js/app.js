/**
 * Chronicle WorkPulse - Main Application Controller
 */

class WorkPulseApp {
  constructor() {
    this.currentTab = 'logs';
    this.editingLogId = null;
    this.searchQuery = '';
    this.filterProject = 'all';
    this.filterStatus = 'all';
    this.filterCategory = 'all';
    this.filterDateRange = 'all';
    this.specificDateFilter = null;
    this.selectedFocusRating = 5;

    this.timer = null;
    this.analytics = null;
    this.calendar = null;
    this.standup = null;

    this.init();
  }

  init() {
    // Initialize Subsystems
    this.timer = new WorkTimer();
    this.analytics = new WorkAnalytics();
    this.calendar = new WorkCalendar();
    this.standup = new StandupGenerator();

    this.applyTheme(window.workStorage.settings.theme || 'dark');
    this.bindDOMEvents();
    this.initAccomplishmentList();
    this.initFocusRatingPicker();

    this.calendar.init();
    this.standup.init();

    this.refreshAll();
  }

  bindDOMEvents() {
    // Navigation Tabs
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = btn.dataset.tab;
        this.switchTab(tab);
      });
    });

    // New Log Button
    const newLogBtn = document.getElementById('new-log-cta');
    if (newLogBtn) {
      newLogBtn.addEventListener('click', () => this.openLogModal());
    }

    // Modal Close Buttons
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => this.closeAllModals());
    });

    // Close on backdrop click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.closeAllModals();
      });
    });

    // Log Form Submit
    const logForm = document.getElementById('work-log-form');
    if (logForm) {
      logForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveLogFromForm();
      });
    }

    // Filters and Search
    const searchInput = document.getElementById('search-logs-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderLogsFeed();
      });
    }

    const projectSelect = document.getElementById('filter-project-select');
    if (projectSelect) {
      projectSelect.addEventListener('change', (e) => {
        this.filterProject = e.target.value;
        this.renderLogsFeed();
      });
    }

    const statusSelect = document.getElementById('filter-status-select');
    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        this.filterStatus = e.target.value;
        this.renderLogsFeed();
      });
    }

    const dateRangeSelect = document.getElementById('filter-date-select');
    if (dateRangeSelect) {
      dateRangeSelect.addEventListener('change', (e) => {
        this.filterDateRange = e.target.value;
        this.specificDateFilter = null;
        this.renderLogsFeed();
      });
    }

    // Auto Duration Calculation
    const startTimeInput = document.getElementById('log-start-time');
    const endTimeInput = document.getElementById('log-end-time');
    const durationInput = document.getElementById('log-duration');

    const updateDurationFromTimes = () => {
      const s = startTimeInput.value;
      const e = endTimeInput.value;
      if (s && e) {
        const [sh, sm] = s.split(':').map(Number);
        const [eh, em] = e.split(':').map(Number);
        let mins = (eh * 60 + em) - (sh * 60 + sm);
        if (mins < 0) mins += 24 * 60; // crossed midnight
        if (mins > 0) durationInput.value = mins;
      }
    };

    if (startTimeInput && endTimeInput) {
      startTimeInput.addEventListener('change', updateDurationFromTimes);
      endTimeInput.addEventListener('change', updateDurationFromTimes);
    }

    // Theme Switcher CTA
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const cur = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = cur === 'dark' ? 'light' : 'dark';
        this.applyTheme(next);
      });
    }

    // Settings Modal
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => this.openSettingsModal());
    }

    // Sound Toggle in Settings
    const soundToggle = document.getElementById('setting-sound-toggle');
    if (soundToggle) {
      soundToggle.checked = !!window.workStorage.settings.soundEnabled;
      soundToggle.addEventListener('change', (e) => {
        window.workStorage.saveSettings({ soundEnabled: e.target.checked });
        window.showToast(e.target.checked ? 'Audio effects enabled' : 'Audio effects muted', 'info');
      });
    }

    // Demo Data Reset & Data Exports
    const resetDemoBtn = document.getElementById('btn-reset-demo');
    if (resetDemoBtn) {
      resetDemoBtn.addEventListener('click', () => {
        if (confirm('Reset to rich realistic demo data? Any custom entries will be replaced.')) {
          window.workStorage.resetToDemo();
          this.closeAllModals();
          this.refreshAll();
          window.showToast('Reset to demo data successfully!', 'success');
        }
      });
    }

    const clearAllBtn = document.getElementById('btn-clear-all');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete all work logs? This cannot be undone.')) {
          window.workStorage.clearAll();
          this.closeAllModals();
          this.refreshAll();
          window.showToast('All logs cleared', 'info');
        }
      });
    }

    const exportCsvBtn = document.getElementById('btn-export-csv');
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', () => {
        window.workStorage.exportCSV();
        window.showToast('Exported work logs to CSV', 'success');
      });
    }

    const exportJsonBtn = document.getElementById('btn-export-json');
    if (exportJsonBtn) {
      exportJsonBtn.addEventListener('click', () => {
        window.workStorage.exportJSON();
        window.showToast('Exported backup to JSON', 'success');
      });
    }

    const importFileInput = document.getElementById('import-json-file');
    if (importFileInput) {
      importFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          const res = window.workStorage.importJSON(event.target.result);
          if (res.success) {
            this.closeAllModals();
            this.refreshAll();
            window.showToast(`Imported ${res.count} work logs!`, 'success');
          } else {
            alert('Import error: ' + res.error);
          }
        };
        reader.readAsText(file);
      });
    }

    // Global Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.target.matches('input, textarea, select')) return;
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        this.openLogModal();
      } else if (e.key === 'Escape') {
        this.closeAllModals();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        if (this.timer.isRunning) {
          this.timer.togglePause();
        } else {
          this.timer.start();
        }
      }
    });
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    window.workStorage.saveSettings({ theme });
    const iconSpan = document.getElementById('theme-icon');
    if (iconSpan) {
      iconSpan.innerHTML = theme === 'dark'
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
    }
  }

  switchTab(tabId) {
    this.currentTab = tabId;

    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    document.querySelectorAll('.view-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `${tabId}-view`);
    });

    if (tabId === 'analytics') {
      this.analytics.updateAll();
    } else if (tabId === 'calendar') {
      this.calendar.render();
    } else if (tabId === 'standup') {
      this.standup.generate();
    } else if (tabId === 'kanban') {
      this.renderKanban();
    } else if (tabId === 'logs') {
      this.renderLogsFeed();
    }
  }

  filterBySpecificDate(dateStr) {
    this.specificDateFilter = dateStr;
    const dateSelect = document.getElementById('filter-date-select');
    if (dateSelect) dateSelect.value = 'all';
    this.switchTab('logs');
    window.showToast(`Filtered to logs for ${dateStr}`, 'info');
  }

  refreshAll() {
    this.populateProjectFilter();
    this.renderLogsFeed();
    this.analytics.updateAll();
    this.calendar.render();
    this.standup.generate();
    this.renderKanban();
  }

  populateProjectFilter() {
    const select = document.getElementById('filter-project-select');
    if (!select) return;
    const projects = window.workStorage.getUniqueProjects();
    const currentVal = select.value;
    let html = '<option value="all">All Projects</option>';
    projects.forEach(p => {
      html += `<option value="${p}">${p}</option>`;
    });
    select.innerHTML = html;
    if (projects.includes(currentVal)) select.value = currentVal;
  }

  initAccomplishmentList() {
    const addBtn = document.getElementById('add-accomplishment-btn');
    const input = document.getElementById('new-accomplishment-input');
    const container = document.getElementById('accomplishment-chips-container');

    const addAccomplishment = () => {
      const text = input.value.trim();
      if (!text) return;
      this.addAccomplishmentChip(text);
      input.value = '';
      input.focus();
    };

    if (addBtn && input) {
      addBtn.addEventListener('click', (e) => {
        e.preventDefault();
        addAccomplishment();
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addAccomplishment();
        }
      });
    }
  }

  addAccomplishmentChip(text) {
    const container = document.getElementById('accomplishment-chips-container');
    if (!container) return;
    const item = document.createElement('div');
    item.className = 'accomplishment-form-chip';
    item.style.cssText = 'display: flex; align-items: center; justify-content: space-between; background: var(--bg-tertiary); padding: 0.35rem 0.65rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); font-size: 0.82rem; margin-bottom: 0.35rem;';
    item.innerHTML = `
      <span class="acc-text" style="color: var(--text-primary); flex: 1; margin-right: 0.5rem;">• ${text}</span>
      <button type="button" class="btn-ghost" style="padding: 0 0.25rem; font-size: 1rem; color: var(--text-muted); cursor: pointer;" title="Remove">&times;</button>
    `;
    item.querySelector('button').addEventListener('click', () => item.remove());
    container.appendChild(item);
  }

  initFocusRatingPicker() {
    const stars = document.querySelectorAll('.rating-star-btn');
    stars.forEach(star => {
      star.addEventListener('click', (e) => {
        e.preventDefault();
        const rating = Number(star.dataset.rating);
        this.setFocusRating(rating);
      });
    });
  }

  setFocusRating(rating) {
    this.selectedFocusRating = rating;
    document.querySelectorAll('.rating-star-btn').forEach(star => {
      const r = Number(star.dataset.rating);
      star.classList.toggle('active', r <= rating);
    });
  }

  openLogModal(prefill = null) {
    const modal = document.getElementById('work-log-modal');
    const modalTitle = document.getElementById('log-modal-title');
    const form = document.getElementById('work-log-form');
    const container = document.getElementById('accomplishment-chips-container');
    if (container) container.innerHTML = '';

    form.reset();
    this.setFocusRating(5);

    const todayStr = new Date().toISOString().split('T')[0];

    if (prefill && prefill.id) {
      // Editing Existing Log
      this.editingLogId = prefill.id;
      modalTitle.textContent = 'Edit Work Log Entry';

      document.getElementById('log-title').value = prefill.title || '';
      document.getElementById('log-project').value = prefill.project || '';
      document.getElementById('log-category').value = prefill.category || 'Engineering';
      document.getElementById('log-date').value = prefill.date || todayStr;
      document.getElementById('log-start-time').value = prefill.startTime || '';
      document.getElementById('log-end-time').value = prefill.endTime || '';
      document.getElementById('log-duration').value = prefill.durationMinutes || 60;
      document.getElementById('log-status').value = prefill.status || 'completed';
      document.getElementById('log-details').value = prefill.details || '';
      document.getElementById('log-blockers').value = prefill.blockers || '';
      document.getElementById('log-tags').value = Array.isArray(prefill.tags) ? prefill.tags.join(', ') : '';

      this.setFocusRating(prefill.focusRating || 5);

      if (Array.isArray(prefill.accomplishments)) {
        prefill.accomplishments.forEach(a => this.addAccomplishmentChip(a));
      }
    } else {
      // New Entry
      this.editingLogId = null;
      modalTitle.textContent = 'Log New Work Session';
      document.getElementById('log-date').value = prefill?.date || todayStr;
      document.getElementById('log-start-time').value = prefill?.startTime || '';
      document.getElementById('log-end-time').value = prefill?.endTime || '';
      document.getElementById('log-duration').value = prefill?.durationMinutes || 60;
      document.getElementById('log-title').value = prefill?.title || '';
      document.getElementById('log-status').value = 'completed';
      document.getElementById('log-category').value = 'Engineering';
    }

    modal.classList.add('open');
    setTimeout(() => document.getElementById('log-title').focus(), 100);
  }

  openSettingsModal() {
    const modal = document.getElementById('settings-modal');
    modal.classList.add('open');
  }

  closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
    this.editingLogId = null;
  }

  saveLogFromForm() {
    const title = document.getElementById('log-title').value.trim();
    if (!title) {
      window.showToast('Please enter a task or activity title', 'error');
      return;
    }

    const project = document.getElementById('log-project').value.trim() || 'General';
    const category = document.getElementById('log-category').value;
    const date = document.getElementById('log-date').value || new Date().toISOString().split('T')[0];
    const startTime = document.getElementById('log-start-time').value;
    const endTime = document.getElementById('log-end-time').value;
    const durationMinutes = Number(document.getElementById('log-duration').value) || 30;
    const status = document.getElementById('log-status').value;
    const details = document.getElementById('log-details').value.trim();
    const blockers = document.getElementById('log-blockers').value.trim();

    const rawTags = document.getElementById('log-tags').value;
    const tags = rawTags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);

    // Extract accomplishments
    const accomplishments = [];
    document.querySelectorAll('#accomplishment-chips-container .acc-text').forEach(el => {
      accomplishments.push(el.textContent.replace(/^•\s*/, '').trim());
    });

    const entryData = {
      title,
      project,
      category,
      date,
      startTime,
      endTime,
      durationMinutes,
      status,
      focusRating: this.selectedFocusRating,
      details,
      accomplishments,
      blockers,
      tags
    };

    if (this.editingLogId) {
      window.workStorage.updateLog(this.editingLogId, entryData);
      window.showToast('Work log updated successfully', 'success');
    } else {
      window.workStorage.addLog(entryData);
      window.showToast('Work session logged!', 'success');
    }

    this.closeAllModals();
    this.refreshAll();
  }

  getFilteredLogs() {
    let logs = window.workStorage.getAllLogs();

    // Specific Date Override from calendar
    if (this.specificDateFilter) {
      logs = logs.filter(l => l.date === this.specificDateFilter);
    } else if (this.filterDateRange !== 'all') {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      if (this.filterDateRange === 'today') {
        logs = logs.filter(l => l.date === today);
      } else if (this.filterDateRange === 'yesterday') {
        logs = logs.filter(l => l.date === yesterday);
      } else if (this.filterDateRange === 'week') {
        const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
        logs = logs.filter(l => l.date >= sevenDaysAgo);
      } else if (this.filterDateRange === 'month') {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
        logs = logs.filter(l => l.date >= thirtyDaysAgo);
      }
    }

    // Filter by Project
    if (this.filterProject !== 'all') {
      logs = logs.filter(l => l.project === this.filterProject);
    }

    // Filter by Status
    if (this.filterStatus !== 'all') {
      logs = logs.filter(l => l.status === this.filterStatus);
    }

    // Search query
    if (this.searchQuery) {
      const q = this.searchQuery;
      logs = logs.filter(l => {
        return (
          l.title.toLowerCase().includes(q) ||
          (l.project && l.project.toLowerCase().includes(q)) ||
          (l.details && l.details.toLowerCase().includes(q)) ||
          (l.blockers && l.blockers.toLowerCase().includes(q)) ||
          (Array.isArray(l.tags) && l.tags.some(t => t.includes(q))) ||
          (Array.isArray(l.accomplishments) && l.accomplishments.some(a => a.toLowerCase().includes(q)))
        );
      });
    }

    return logs;
  }

  renderLogsFeed() {
    const container = document.getElementById('work-logs-feed');
    if (!container) return;

    const logs = this.getFilteredLogs();

    if (logs.length === 0) {
      container.innerHTML = `
        <div class="empty-state-box">
          <div class="empty-icon-wrap">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          </div>
          <h3 style="font-size: 1.15rem; font-weight: 700;">No work logs match your filter</h3>
          <p style="color: var(--text-secondary); max-width: 400px; font-size: 0.88rem;">Try clearing your search query, or click below to log a new session.</p>
          <div style="display: flex; gap: 0.75rem; margin-top: 0.5rem;">
            <button class="btn btn-primary" onclick="window.workApp.openLogModal()">+ Log New Work</button>
            <button class="btn btn-secondary" onclick="window.workApp.clearFilters()">Clear Filters</button>
          </div>
        </div>
      `;
      return;
    }

    // Group logs by date
    const groups = {};
    logs.forEach(l => {
      const d = l.date || 'Undated';
      if (!groups[d]) groups[d] = [];
      groups[d].push(l);
    });

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    let html = '';

    // If specific date filter is active, show banner with clear option
    if (this.specificDateFilter) {
      html += `
        <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(99, 102, 241, 0.12); border: 1px solid var(--accent-primary-glow); padding: 0.65rem 1rem; border-radius: var(--radius-md); margin-bottom: 1.25rem;">
          <span style="font-size: 0.88rem; font-weight: 600; color: #818cf8;">Showing logs for specific date: <strong>${this.specificDateFilter}</strong></span>
          <button class="btn btn-ghost btn-sm" onclick="window.workApp.clearSpecificDateFilter()">Show All Dates &times;</button>
        </div>
      `;
    }

    Object.keys(groups).forEach(dateStr => {
      const dateLogs = groups[dateStr];
      let dayTitle = dateStr;
      if (dateStr === todayStr) {
        dayTitle = `Today — ${dateStr}`;
      } else if (dateStr === yesterdayStr) {
        dayTitle = `Yesterday — ${dateStr}`;
      } else {
        const dObj = new Date(dateStr + 'T00:00:00');
        if (!isNaN(dObj.getTime())) {
          dayTitle = dObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
        }
      }

      const totalMins = dateLogs.reduce((sum, item) => sum + (Number(item.durationMinutes) || 0), 0);
      const hoursStr = (totalMins / 60).toFixed(1);

      html += `
        <div class="timeline-date-group">
          <div class="date-group-header">
            <h3 class="date-group-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--accent-primary);"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              ${dayTitle}
            </h3>
            <div class="date-group-metrics">
              <span class="metric-pill">⏱️ ${hoursStr} hrs</span>
              <span class="metric-pill">📌 ${dateLogs.length} task${dateLogs.length > 1 ? 's' : ''}</span>
            </div>
          </div>
          <div class="work-card-list">
            ${dateLogs.map(log => this.renderWorkCardHtml(log)).join('')}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  renderWorkCardHtml(log) {
    const statusMap = {
      'completed': { label: 'Completed', class: 'status-completed' },
      'in-progress': { label: 'In Progress', class: 'status-inprogress' },
      'in-review': { label: 'In Review', class: 'status-review' },
      'blocked': { label: 'Blocked', class: 'status-blocked' }
    };

    const statusObj = statusMap[log.status] || statusMap['completed'];
    const durationHours = (log.durationMinutes ? (log.durationMinutes / 60).toFixed(1) : '0');
    const timeRange = (log.startTime && log.endTime) ? `${log.startTime} - ${log.endTime}` : '';
    const focusStars = '★'.repeat(log.focusRating || 4);

    let accomplishmentsHtml = '';
    if (Array.isArray(log.accomplishments) && log.accomplishments.length > 0) {
      accomplishmentsHtml = `
        <div class="accomplishments-list">
          ${log.accomplishments.map(a => `
            <div class="accomplishment-item">
              <span class="accomplishment-icon">✔</span>
              <span>${this.escapeHtml(a)}</span>
            </div>
          `).join('')}
        </div>
      `;
    }

    let blockerHtml = '';
    if (log.blockers && log.blockers.trim()) {
      blockerHtml = `
        <div class="blocker-alert-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0;"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          <div><strong>Blocker:</strong> ${this.escapeHtml(log.blockers)}</div>
        </div>
      `;
    }

    let tagsHtml = '';
    if (Array.isArray(log.tags) && log.tags.length > 0) {
      tagsHtml = `
        <div class="work-card-tags">
          ${log.tags.map(t => `<span class="tag-pill">#${this.escapeHtml(t)}</span>`).join('')}
        </div>
      `;
    }

    return `
      <div class="work-card" id="card-${log.id}">
        <div class="work-card-top">
          <div class="work-card-meta">
            <span class="project-tag">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"></circle></svg>
              ${this.escapeHtml(log.project || 'General')}
            </span>
            <span class="category-tag">${this.escapeHtml(log.category || 'Engineering')}</span>
            <span class="duration-tag">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              ${log.durationMinutes}m (${durationHours}h)
            </span>
            ${timeRange ? `<span class="time-range-text">${timeRange}</span>` : ''}
          </div>
          <span class="status-badge ${statusObj.class}">${statusObj.label}</span>
        </div>

        <h4 class="work-card-title">${this.escapeHtml(log.title)}</h4>

        ${log.details ? `<div class="work-card-description">${this.escapeHtml(log.details)}</div>` : ''}

        ${accomplishmentsHtml}
        ${blockerHtml}

        <div class="work-card-footer">
          <div style="display: flex; align-items: center; gap: 0.85rem;">
            <span title="Focus rating: ${log.focusRating || 4} / 5" style="color: var(--accent-amber); font-size: 0.85rem; letter-spacing: 0.1em;">${focusStars}</span>
            ${tagsHtml}
          </div>
          <div class="work-card-actions">
            <button class="btn btn-ghost btn-sm" onclick="window.workApp.editLog('${log.id}')" title="Edit Log">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
              Edit
            </button>
            <button class="btn btn-ghost btn-sm" onclick="window.workApp.duplicateLog('${log.id}')" title="Duplicate Log">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
            <button class="btn btn-ghost btn-sm" style="color: var(--accent-rose);" onclick="window.workApp.deleteLog('${log.id}')" title="Delete Log">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderKanban() {
    const board = document.getElementById('kanban-board-container');
    if (!board) return;

    const logs = window.workStorage.getAllLogs();
    const columns = [
      { id: 'in-progress', title: 'In Progress', color: 'var(--status-inprogress)' },
      { id: 'in-review', title: 'In Review', color: 'var(--status-review)' },
      { id: 'blocked', title: 'Blocked / Waiting', color: 'var(--status-blocked)' },
      { id: 'completed', title: 'Completed', color: 'var(--status-completed)' }
    ];

    let html = '';
    columns.forEach(col => {
      const colLogs = logs.filter(l => (l.status || 'completed') === col.id);
      html += `
        <div class="kanban-col">
          <div class="kanban-col-header">
            <span class="kanban-col-title">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: ${col.color};"></span>
              ${col.title}
            </span>
            <span class="metric-pill">${colLogs.length}</span>
          </div>
          <div class="kanban-cards-wrap">
            ${colLogs.length === 0 ? '<div style="color: var(--text-muted); font-size: 0.8rem; text-align: center; padding: 2rem 0;">Empty</div>' : ''}
            ${colLogs.map(l => `
              <div class="kanban-card">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span class="project-tag" style="font-size: 0.7rem;">${this.escapeHtml(l.project)}</span>
                  <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--accent-cyan); font-weight: 700;">${l.durationMinutes || 0}m</span>
                </div>
                <div style="font-weight: 700; font-size: 0.88rem; line-height: 1.35; color: var(--text-primary);">${this.escapeHtml(l.title)}</div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.35rem; font-size: 0.75rem;">
                  <span style="color: var(--text-muted); font-family: var(--font-mono);">${l.date}</span>
                  <select style="background: var(--bg-card); color: var(--text-secondary); border: 1px solid var(--border-subtle); border-radius: 4px; font-size: 0.72rem; padding: 0.15rem 0.35rem;" onchange="window.workApp.updateLogStatus('${l.id}', this.value)">
                    <option value="in-progress" ${l.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                    <option value="in-review" ${l.status === 'in-review' ? 'selected' : ''}>In Review</option>
                    <option value="blocked" ${l.status === 'blocked' ? 'selected' : ''}>Blocked</option>
                    <option value="completed" ${l.status === 'completed' ? 'selected' : ''}>Completed</option>
                  </select>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    });

    board.innerHTML = html;
  }

  updateLogStatus(id, newStatus) {
    window.workStorage.updateLog(id, { status: newStatus });
    this.refreshAll();
    window.showToast(`Updated status to ${newStatus}`, 'info');
  }

  editLog(id) {
    const log = window.workStorage.getLogById(id);
    if (log) {
      this.openLogModal(log);
    }
  }

  duplicateLog(id) {
    const clone = window.workStorage.duplicateLog(id);
    if (clone) {
      this.refreshAll();
      window.showToast('Work log duplicated', 'success');
    }
  }

  deleteLog(id) {
    if (confirm('Are you sure you want to delete this log entry?')) {
      window.workStorage.deleteLog(id);
      this.refreshAll();
      window.showToast('Log entry deleted', 'info');
    }
  }

  clearFilters() {
    this.searchQuery = '';
    this.filterProject = 'all';
    this.filterStatus = 'all';
    this.filterDateRange = 'all';
    this.specificDateFilter = null;

    const sInput = document.getElementById('search-logs-input');
    if (sInput) sInput.value = '';

    const pSelect = document.getElementById('filter-project-select');
    if (pSelect) pSelect.value = 'all';

    const stSelect = document.getElementById('filter-status-select');
    if (stSelect) stSelect.value = 'all';

    const dSelect = document.getElementById('filter-date-select');
    if (dSelect) dSelect.value = 'all';

    this.renderLogsFeed();
  }

  clearSpecificDateFilter() {
    this.specificDateFilter = null;
    this.renderLogsFeed();
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

// Global Toast System
window.showToast = function(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(15px)';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
};

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.workApp = new WorkPulseApp();
});
