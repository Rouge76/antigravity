/**
 * Chronicle WorkPulse - Standup & Work Digest Generator
 */

class StandupGenerator {
  constructor() {
    this.format = 'slack';
    this.datePreset = 'today';
    this.customDate = null;
  }

  init() {
    const formatSelect = document.getElementById('standup-format-select');
    const dateSelect = document.getElementById('standup-date-preset');
    const copyBtn = document.getElementById('standup-copy-btn');
    const refreshBtn = document.getElementById('standup-refresh-btn');

    if (formatSelect) {
      formatSelect.addEventListener('change', (e) => {
        this.format = e.target.value;
        this.generate();
      });
    }

    if (dateSelect) {
      dateSelect.addEventListener('change', (e) => {
        this.datePreset = e.target.value;
        this.generate();
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', () => this.copyToClipboard());
    }

    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.generate();
        window.showToast?.('Standup report regenerated', 'info');
      });
    }
  }

  getTargetDates() {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (this.datePreset === 'today') {
      return [today];
    } else if (this.datePreset === 'yesterday') {
      return [yesterday];
    } else if (this.datePreset === 'today_yesterday') {
      return [yesterday, today];
    } else if (this.datePreset === 'past_week') {
      const dates = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split('T')[0]);
      }
      return dates;
    }
    return [today];
  }

  generate() {
    const textarea = document.getElementById('standup-output-text');
    if (!textarea) return;

    const targetDates = this.getTargetDates();
    const allLogs = window.workStorage.getAllLogs();
    const targetLogs = allLogs.filter(l => targetDates.includes(l.date));

    let output = '';

    if (this.format === 'slack') {
      output = this.generateSlackMarkdown(targetLogs, targetDates);
    } else if (this.format === 'executive') {
      output = this.generateExecutiveReport(targetLogs, targetDates);
    } else if (this.format === 'notion') {
      output = this.generateNotionFormat(targetLogs, targetDates);
    } else {
      output = this.generatePlainText(targetLogs, targetDates);
    }

    textarea.value = output;
  }

  generateSlackMarkdown(logs, dates) {
    const todayStr = new Date().toISOString().split('T')[0];
    const isToday = dates.length === 1 && dates[0] === todayStr;
    const headerTitle = isToday ? `Daily Standup — ${todayStr}` : `Work Summary (${dates[dates.length - 1]} to ${dates[0]})`;

    let totalMins = 0;
    const completed = [];
    const inProgress = [];
    const blockers = [];

    logs.forEach(l => {
      totalMins += (Number(l.durationMinutes) || 0);
      if (l.status === 'completed') {
        completed.push(l);
      } else {
        inProgress.push(l);
      }
      if (l.blockers && l.blockers.trim()) {
        blockers.push({ title: l.title, blocker: l.blockers.trim() });
      }
    });

    const hoursTotal = (totalMins / 60).toFixed(1);

    let md = `*📋 ${headerTitle}*\n`;
    md += `_⏱️ Total Logged Time: ${hoursTotal} hours across ${logs.length} task(s)_\n\n`;

    md += `*✅ Done / Completed:*\n`;
    if (completed.length === 0) {
      md += `• _None recorded yet_\n`;
    } else {
      completed.forEach(c => {
        md += `• *[${c.project}]* ${c.title} (${c.durationMinutes || 0}m)\n`;
        if (Array.isArray(c.accomplishments) && c.accomplishments.length > 0) {
          c.accomplishments.forEach(acc => {
            md += `    └─ ${acc}\n`;
          });
        }
      });
    }

    md += `\n*🔄 In Progress / Ongoing:*\n`;
    if (inProgress.length === 0) {
      md += `• _All items currently completed_\n`;
    } else {
      inProgress.forEach(p => {
        md += `• *[${p.project}]* ${p.title} (${p.durationMinutes || 0}m)\n`;
      });
    }

    md += `\n*🚧 Blockers & Impediments:*\n`;
    if (blockers.length === 0) {
      md += `• None! Smooth sailing 🚀\n`;
    } else {
      blockers.forEach(b => {
        md += `• *${b.title}*: ${b.blocker}\n`;
      });
    }

    return md;
  }

  generateExecutiveReport(logs, dates) {
    let totalMins = 0;
    const projectSummary = {};

    logs.forEach(l => {
      const mins = Number(l.durationMinutes) || 0;
      totalMins += mins;
      const p = l.project || 'General';
      if (!projectSummary[p]) {
        projectSummary[p] = { minutes: 0, items: [] };
      }
      projectSummary[p].minutes += mins;
      projectSummary[p].items.push(l.title);
    });

    const totalHours = (totalMins / 60).toFixed(2);
    const dateRangeLabel = dates.length > 1 ? `${dates[dates.length - 1]} through ${dates[0]}` : dates[0];

    let txt = `=========================================================\n`;
    txt += `EXECUTIVE PRODUCTIVITY & ACTIVITY DIGEST\n`;
    txt += `Period: ${dateRangeLabel}\n`;
    txt += `Total Tracked Production Time: ${totalHours} Hours\n`;
    txt += `=========================================================\n\n`;

    txt += `PROJECT ALLOCATION BREAKDOWN:\n`;
    Object.entries(projectSummary).forEach(([pName, pData]) => {
      const pHours = (pData.minutes / 60).toFixed(1);
      const pPct = totalMins > 0 ? Math.round((pData.minutes / totalMins) * 100) : 0;
      txt += `\n[ ${pName.toUpperCase()} ] - ${pHours} hrs (${pPct}%)\n`;
      pData.items.forEach(item => {
        txt += `  • ${item}\n`;
      });
    });

    txt += `\nKEY MILESTONES DELIVERED:\n`;
    let deliveredCount = 0;
    logs.filter(l => l.status === 'completed').forEach(l => {
      if (Array.isArray(l.accomplishments)) {
        l.accomplishments.forEach(a => {
          txt += `  ✔ ${a}\n`;
          deliveredCount++;
        });
      }
    });

    if (deliveredCount === 0) {
      txt += `  (Work items in progress)\n`;
    }

    txt += `\nGenerated by Chronicle WorkPulse Suite`;
    return txt;
  }

  generateNotionFormat(logs, dates) {
    let md = `# Work Log Summary (${dates.join(', ')})\n\n`;
    md += `| Project | Task / Activity | Duration | Status | Focus |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- |\n`;

    logs.forEach(l => {
      const focusStars = '⭐'.repeat(l.focusRating || 4);
      md += `| **${l.project}** | ${l.title} | ${l.durationMinutes || 0}m | \`${l.status}\` | ${focusStars} |\n`;
    });

    md += `\n## Key Accomplishments\n`;
    logs.forEach(l => {
      if (Array.isArray(l.accomplishments) && l.accomplishments.length > 0) {
        l.accomplishments.forEach(a => {
          md += `- [x] ${a} *(from: ${l.title})*\n`;
        });
      }
    });

    return md;
  }

  generatePlainText(logs, dates) {
    let totalMins = 0;
    let txt = `WORK LOG - ${dates.join(', ')}\n\n`;

    logs.forEach((l, i) => {
      totalMins += (Number(l.durationMinutes) || 0);
      txt += `${i + 1}. [${l.project}] ${l.title} (${l.durationMinutes || 0} mins) - Status: ${l.status}\n`;
      if (l.details) txt += `   Details: ${l.details}\n`;
      if (l.blockers) txt += `   Blocker: ${l.blockers}\n`;
      txt += `\n`;
    });

    txt += `Total hours: ${(totalMins / 60).toFixed(1)} hrs\n`;
    return txt;
  }

  copyToClipboard() {
    const textarea = document.getElementById('standup-output-text');
    if (!textarea || !textarea.value) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textarea.value).then(() => {
        window.showToast?.('📋 Copied standup report to clipboard!', 'success');
      }).catch(() => {
        this.fallbackCopy(textarea);
      });
    } else {
      this.fallbackCopy(textarea);
    }
  }

  fallbackCopy(textarea) {
    textarea.select();
    document.execCommand('copy');
    window.showToast?.('📋 Copied to clipboard!', 'success');
  }
}

window.StandupGenerator = StandupGenerator;
