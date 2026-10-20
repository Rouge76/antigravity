/**
 * Chronicle WorkPulse - Storage and Data Management
 */

const STORAGE_KEY = 'chronicle_work_logs_v1';
const SETTINGS_KEY = 'chronicle_settings_v1';

// Dynamic Relative Date Helper
function getRelativeDateStr(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return d.toISOString().split('T')[0];
}

// Default Realistic Seed Data
function getSeedLogs() {
  const today = getRelativeDateStr(0);
  const yesterday = getRelativeDateStr(1);
  const twoDaysAgo = getRelativeDateStr(2);
  const threeDaysAgo = getRelativeDateStr(3);
  const fourDaysAgo = getRelativeDateStr(4);
  const fiveDaysAgo = getRelativeDateStr(5);

  return [
    {
      id: 'log-1',
      title: 'Real-time WebSocket event sync and reconnection logic',
      project: 'Core Platform',
      category: 'Engineering',
      date: today,
      startTime: '09:00',
      endTime: '11:45',
      durationMinutes: 165,
      status: 'completed',
      focusRating: 5,
      details: 'Implemented exponential backoff reconnection for WebSocket subscribers and synchronized missed message state with Redis stream offsets.',
      accomplishments: [
        'Added reconnection jitter algorithm reducing thundering herd risk by 85%',
        'Unit tests for edge disconnection cases written & passing',
        'Merged PR #318 into development branch'
      ],
      blockers: '',
      tags: ['websocket', 'backend', 'resilience', 'redis'],
      createdAt: new Date().toISOString()
    },
    {
      id: 'log-2',
      title: 'Executive dashboard performance profiling & bundle optimization',
      project: 'Analytics Suite',
      category: 'Engineering',
      date: today,
      startTime: '13:00',
      endTime: '15:30',
      durationMinutes: 150,
      status: 'completed',
      focusRating: 4,
      details: 'Analyzed flame graphs for heavy chart re-renders. Switched Canvas rasterizer to off-screen buffer and chunked large datasets with Web Worker.',
      accomplishments: [
        'Cut LCP (Largest Contentful Paint) from 2.8s to 0.9s',
        'Tree-shook unused third party math routines saving 142KB gzip'
      ],
      blockers: '',
      tags: ['performance', 'frontend', 'webworker', 'profiling'],
      createdAt: new Date().toISOString()
    },
    {
      id: 'log-3',
      title: 'Sprint planning and cross-team dependency review',
      project: 'Core Platform',
      category: 'Meeting',
      date: today,
      startTime: '16:00',
      endTime: '17:00',
      durationMinutes: 60,
      status: 'completed',
      focusRating: 3,
      details: 'Aligned with infra team on Kubernetes cluster migration timeline and zero-downtime database schema rollout plan for next week.',
      accomplishments: [
        'Locked deliverables for Q4 Sprint 2',
        'Documented rollback protocol for DB migration'
      ],
      blockers: 'Awaiting security review approval from SecOps for VPC peering',
      tags: ['planning', 'agile', 'standup', 'k8s'],
      createdAt: new Date().toISOString()
    },
    {
      id: 'log-4',
      title: 'OAuth 2.1 Multi-tenant authentication & RBAC policy audit',
      project: 'Security & Auth',
      category: 'Engineering',
      date: yesterday,
      startTime: '09:30',
      endTime: '12:30',
      durationMinutes: 180,
      status: 'completed',
      focusRating: 5,
      details: 'Audited role-based permission inheritance and tightened session token rotation headers. Fixed edge case where revoked sessions retained read access on caching proxies.',
      accomplishments: [
        'Secured session invalidation webhook propagation across microservices',
        'Wrote end-to-end integration test suite for tenant isolation'
      ],
      blockers: '',
      tags: ['security', 'oauth', 'jwt', 'rbac'],
      createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'log-5',
      title: 'Design system typography scale & dark mode accessibility review',
      project: 'Design System',
      category: 'Design',
      date: yesterday,
      startTime: '13:30',
      endTime: '15:15',
      durationMinutes: 105,
      status: 'completed',
      focusRating: 4,
      details: 'Evaluated WCAG AAA contrast ratios for OLED dark theme. Standardized line heights and fluid typography variables across desktop and mobile viewports.',
      accomplishments: [
        'Updated 28 CSS custom properties with strict contrast compliance',
        'Created Figma to CSS token export validation script'
      ],
      blockers: '',
      tags: ['ui-ux', 'accessibility', 'wcag', 'design-tokens'],
      createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'log-6',
      title: 'Automated CI/CD deployment pipeline with Docker build cache',
      project: 'DevOps & Cloud',
      category: 'Engineering',
      date: twoDaysAgo,
      startTime: '10:00',
      endTime: '13:00',
      durationMinutes: 180,
      status: 'completed',
      focusRating: 4,
      details: 'Configured GitHub Actions multi-stage build cache with BuildKit registry backend. Sped up test suite execution by parallelizing test runners.',
      accomplishments: [
        'Reduced full pipeline run time from 16m 40s to 4m 12s',
        'Automated preview environment provisioning on PR open'
      ],
      blockers: '',
      tags: ['ci-cd', 'devops', 'docker', 'github-actions'],
      createdAt: new Date(Date.now() - 172800000).toISOString()
    },
    {
      id: 'log-7',
      title: 'Investigate flaky payment gateway webhook timeout issue',
      project: 'Billing Engine',
      category: 'Bug Fix',
      date: twoDaysAgo,
      startTime: '14:00',
      endTime: '17:00',
      durationMinutes: 180,
      status: 'in-progress',
      focusRating: 3,
      details: 'Debugging sporadic HTTP 504 gateway timeouts on Stripe payment webhook processor under concurrent transaction batches.',
      accomplishments: [
        'Isolated root cause to database connection pool exhaustion under load spike',
        'Implemented asynchronous job queue for webhook payload parsing'
      ],
      blockers: 'Need staging sandbox test credentials with higher webhook throttle limit',
      tags: ['billing', 'stripe', 'bugfix', 'postgres'],
      createdAt: new Date(Date.now() - 172800000).toISOString()
    },
    {
      id: 'log-8',
      title: 'API documentation overhaul & OpenAPI 3.1 Swagger interactive spec',
      project: 'Core Platform',
      category: 'Documentation',
      date: threeDaysAgo,
      startTime: '09:00',
      endTime: '12:00',
      durationMinutes: 180,
      status: 'completed',
      focusRating: 4,
      details: 'Re-documented all public endpoints, query parameters, error responses and rate limit headers with interactive try-it-out playground.',
      accomplishments: [
        'Documented 42 REST endpoints with TypeScript request/response contracts',
        'Added code snippet generator for Python, Node.js, and cURL'
      ],
      blockers: '',
      tags: ['openapi', 'docs', 'swagger', 'developer-experience'],
      createdAt: new Date(Date.now() - 259200000).toISOString()
    },
    {
      id: 'log-9',
      title: 'User onboarding flow overhaul and telemetry tracking',
      project: 'Product Growth',
      category: 'Engineering',
      date: fourDaysAgo,
      startTime: '11:00',
      endTime: '16:00',
      durationMinutes: 300,
      status: 'completed',
      focusRating: 5,
      details: 'Revamped the first-time setup checklist and added milestone events to tracking pipeline with user privacy masking.',
      accomplishments: [
        'Built interactive step-by-step product walkthrough wizard',
        'Tested across Firefox, Chrome, Safari, and Mobile'
      ],
      blockers: '',
      tags: ['growth', 'onboarding', 'analytics', 'telemetry'],
      createdAt: new Date(Date.now() - 345600000).toISOString()
    },
    {
      id: 'log-10',
      title: 'Database index optimization and slow query remediation',
      project: 'Core Platform',
      category: 'Engineering',
      date: fiveDaysAgo,
      startTime: '10:00',
      endTime: '14:30',
      durationMinutes: 270,
      status: 'completed',
      focusRating: 5,
      details: 'Analyzed pg_stat_statements slow query log. Added compound indices on tenant_id + created_at to avoid full sequential table scans.',
      accomplishments: [
        'Decreased p99 database query latency from 840ms to 24ms',
        'Reclaimed 14GB disk space through VACUUM FULL index rebuild'
      ],
      blockers: '',
      tags: ['database', 'postgresql', 'indexes', 'performance'],
      createdAt: new Date(Date.now() - 432000000).toISOString()
    }
  ];
}

class WorkLogStorage {
  constructor() {
    this.logs = this.loadLogs();
    this.settings = this.loadSettings();
  }

  loadLogs() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse logs from localStorage, fallback to seed data', e);
    }
    const seeds = getSeedLogs();
    this.saveAllLogs(seeds);
    return seeds;
  }

  saveAllLogs(logs) {
    this.logs = logs;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to save logs to localStorage', e);
    }
  }

  loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {
      theme: 'dark',
      soundEnabled: true,
      pomodoroDuration: 25,
      breakDuration: 5,
      standupFormat: 'slack'
    };
  }

  saveSettings(settings) {
    this.settings = { ...this.settings, ...settings };
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (e) {}
  }

  getAllLogs() {
    return [...this.logs].sort((a, b) => {
      // Sort by date desc, then by startTime desc
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return (b.startTime || '').localeCompare(a.startTime || '');
    });
  }

  getLogById(id) {
    return this.logs.find(l => l.id === id);
  }

  addLog(entry) {
    const newLog = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      createdAt: new Date().toISOString(),
      ...entry
    };
    this.logs.unshift(newLog);
    this.saveAllLogs(this.logs);
    return newLog;
  }

  updateLog(id, updatedFields) {
    const index = this.logs.findIndex(l => l.id === id);
    if (index !== -1) {
      this.logs[index] = {
        ...this.logs[index],
        ...updatedFields,
        updatedAt: new Date().toISOString()
      };
      this.saveAllLogs(this.logs);
      return this.logs[index];
    }
    return null;
  }

  deleteLog(id) {
    this.logs = this.logs.filter(l => l.id !== id);
    this.saveAllLogs(this.logs);
  }

  duplicateLog(id) {
    const orig = this.getLogById(id);
    if (!orig) return null;
    const today = new Date().toISOString().split('T')[0];
    const clone = {
      ...orig,
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      title: orig.title + ' (Copy)',
      date: today,
      createdAt: new Date().toISOString()
    };
    this.logs.unshift(clone);
    this.saveAllLogs(this.logs);
    return clone;
  }

  resetToDemo() {
    const seeds = getSeedLogs();
    this.saveAllLogs(seeds);
    return seeds;
  }

  clearAll() {
    this.saveAllLogs([]);
  }

  getUniqueProjects() {
    const set = new Set();
    this.logs.forEach(l => {
      if (l.project) set.add(l.project);
    });
    return Array.from(set).sort();
  }

  getUniqueCategories() {
    const set = new Set();
    this.logs.forEach(l => {
      if (l.category) set.add(l.category);
    });
    return Array.from(set).sort();
  }

  exportJSON() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `chronicle_work_logs_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  exportCSV() {
    const headers = ['Date', 'Start Time', 'End Time', 'Duration (min)', 'Project', 'Category', 'Status', 'Focus (1-5)', 'Title', 'Details', 'Accomplishments', 'Blockers', 'Tags'];
    const rows = this.logs.map(l => [
      `"${l.date || ''}"`,
      `"${l.startTime || ''}"`,
      `"${l.endTime || ''}"`,
      l.durationMinutes || 0,
      `"${(l.project || '').replace(/"/g, '""')}"`,
      `"${(l.category || '').replace(/"/g, '""')}"`,
      `"${l.status || ''}"`,
      l.focusRating || '',
      `"${(l.title || '').replace(/"/g, '""')}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
      `"${(Array.isArray(l.accomplishments) ? l.accomplishments.join('; ') : '').replace(/"/g, '""')}"`,
      `"${(l.blockers || '').replace(/"/g, '""')}"`,
      `"${(Array.isArray(l.tags) ? l.tags.join(', ') : '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `chronicle_work_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  importJSON(jsonText) {
    try {
      const data = JSON.parse(jsonText);
      if (Array.isArray(data)) {
        this.saveAllLogs(data);
        return { success: true, count: data.length };
      }
      return { success: false, error: 'JSON is not an array of work logs' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

window.workStorage = new WorkLogStorage();
