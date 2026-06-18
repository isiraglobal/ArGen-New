/**
 * Operational HR Dashboard — managed panels, openable records, and workspace settings.
 */
const OpsDashboard = {
  currentPanel: 'overview',
  state: {
    company: null,
    summary: null,
    stats: null,
    employees: [],
    departments: [],
    connections: [],
    invoices: [],
    leaderboard: [],
    analytics: null,
    roi: null
  },

  init() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = (user.role || '').toLowerCase();
    if (role !== 'teamadmin' && role !== 'superadmin') return;

    this.bindNav();
    this.handleHash();
    window.addEventListener('hashchange', () => this.handleHash());

    this.refreshAll();
  },

  bindNav() {
    document.querySelectorAll('[data-ops-panel]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const panel = el.dataset.opsPanel;
        this.showPanel(panel);
        window.location.hash = panel;
      });
    });

    document.getElementById('opsDrawerClose')?.addEventListener('click', () => this.closeDrawer());
    document.getElementById('opsDrawerOverlay')?.addEventListener('click', () => this.closeDrawer());
  },

  handleHash() {
    const hash = window.location.hash.replace('#', '') || 'overview';
    this.showPanel(hash);
  },

  async refreshAll() {
    await this.loadCoreData();
    this.renderShell();
    this.renderOverview();
    this.renderEmployees();
    this.renderDepartments();
    this.renderSubscriptions();
    this.renderDataRooms();
    this.renderInvoices();
    this.renderSettings();
  },

  async loadCoreData() {
    const safe = async (promise, fallback) => {
      try { return await promise; } catch (err) {
        console.warn('Ops data unavailable:', err.message);
        return fallback;
      }
    };

    const [company, summary, stats, leaderboard, connections, invoices, analytics, roi] = await Promise.all([
      safe(argenApi.getMyCompany(), null),
      safe(argenApi.getOperationsSummary(), null),
      safe(argenApi.getDashboardStats(), null),
      safe(argenApi.getLeaderboard(), []),
      safe(argenApi.getConnections(), { connections: [] }),
      safe(argenApi.getInvoices(), []),
      safe(argenApi.getAnalyticsSummary(), null),
      safe(argenApi.getAnalyticsROI(), null)
    ]);

    this.state.company = summary?.company || company;
    this.state.summary = summary;
    this.state.stats = stats;
    this.state.employees = summary?.employees || [];
    this.state.departments = summary?.departments || [];
    this.state.connections = connections?.connections || [];
    this.state.invoices = invoices || [];
    this.state.leaderboard = leaderboard || [];
    this.state.analytics = analytics;
    this.state.roi = roi;
  },

  renderShell() {
    const companyName = this.state.company?.name || 'Workspace';
    const orgEl = document.getElementById('opsOrgName');
    if (orgEl) orgEl.textContent = companyName;
    const globalOrg = document.getElementById('orgName');
    if (globalOrg) globalOrg.textContent = companyName.toUpperCase();

    const stats = {
      'ops-stat-employees': this.state.employees.length,
      'ops-stat-pending': this.state.employees.filter(emp => emp.profileStatus !== 'approved').length,
      'ops-stat-approved': this.state.employees.filter(emp => emp.profileStatus === 'approved').length,
      'ops-stat-departments': this.state.departments.length
    };
    for (const [id, val] of Object.entries(stats)) {
      const el = document.getElementById(id);
      if (el) el.textContent = val ?? 0;
    }
  },

  showPanel(panelId) {
    this.currentPanel = panelId;
    document.querySelectorAll('.ops-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('[data-ops-panel]').forEach(n => n.classList.remove('active'));

    const panel = document.getElementById(`ops-panel-${panelId}`);
    if (panel) panel.classList.add('active');
    document.querySelectorAll(`[data-ops-panel="${panelId}"]`).forEach(n => n.classList.add('active'));

    const lazyRenderers = {
      overview: () => this.renderOverview(),
      employees: () => this.renderEmployees(),
      departments: () => this.renderDepartments(),
      ai: () => this.renderAiIntelligence(),
      subscriptions: () => this.renderSubscriptions(),
      data: () => this.renderDataRooms(),
      invoices: () => this.renderInvoices(),
      settings: () => this.renderSettings()
    };
    lazyRenderers[panelId]?.();
  },

  renderOverview() {
    const target = document.getElementById('opsOverviewContent');
    const approvalTarget = document.getElementById('opsApprovalQueue');
    if (!target) return;

    const avgScore = this.state.stats?.avgScore ? Number(this.state.stats.avgScore).toFixed(1) : '0.0';
    const requests = this.state.analytics?.summary?.totalRequests ?? 0;
    const spend = this.state.analytics?.summary?.totalCostUsd ?? '0.00';
    const roi = this.state.roi?.roiPercent ?? '0';
    const pending = this.state.employees.filter(emp => emp.profileStatus !== 'approved');

    if (approvalTarget) {
      approvalTarget.innerHTML = pending.length ? `
        <div class="ops-mini-panel" style="border-color: rgba(255,165,0,0.25); margin-bottom: 1rem;">
          <div class="ops-panel-kicker">Approval Queue</div>
          <h3>${pending.length} profile${pending.length === 1 ? '' : 's'} waiting for HR</h3>
          <p>Open each employee record to verify department ID, role, phone, and manager before approval.</p>
          <div class="ops-action-row">
            <button class="btn btn-accent" data-ops-panel="employees">Review Employees</button>
          </div>
        </div>
      ` : '';
      approvalTarget.querySelector('[data-ops-panel="employees"]')?.addEventListener('click', () => {
        this.showPanel('employees');
        window.location.hash = 'employees';
      });
    }

    target.innerHTML = `
      <div class="ops-workspace-grid">
        <div class="ops-stack">
          <div class="ops-card-grid-tight">
            ${this.metricCard('Team Avg Score', avgScore, 'Quality baseline')}
            ${this.metricCard('AI Requests', requests, 'Last 30 days')}
            ${this.metricCard('AI Spend', `$${spend}`, 'Connected providers')}
            ${this.metricCard('Estimated ROI', `${roi}%`, 'Usage value model')}
          </div>
          <div class="ops-mini-panel">
            <div class="ops-panel-kicker">Operational Unit</div>
            <h3>${this.escape(this.state.company?.name || 'Workspace')} Command Surface</h3>
            <p>This dashboard is organized around people, departments, subscriptions, billing, and controls. Each part opens into its own panel or drawer so HR can inspect the underlying record instead of scanning one crowded page.</p>
            <div class="ops-action-row">
              ${this.panelButton('employees', 'Open Employees')}
              ${this.panelButton('departments', 'Open Departments')}
              ${this.panelButton('subscriptions', 'Open Subscriptions')}
              ${this.panelButton('settings', 'Workspace Settings')}
            </div>
          </div>
        </div>
        <div class="ops-stack">
          <div class="ops-mini-panel">
            <div class="ops-panel-kicker">Team Code</div>
            <h3 style="font-family: var(--font-mono); letter-spacing: 3px;">${this.escape(this.state.company?.inviteCode || 'NOT SET')}</h3>
            <p>Employees authenticate first, then use this code while completing their profile.</p>
            <div class="ops-action-row">
              <button class="btn btn-dark" onclick="copyInviteCode()">Copy Code</button>
              <button class="btn btn-accent" onclick="OpsDashboard.rotateTeamCode()">Generate New</button>
            </div>
          </div>
          <div class="ops-mini-panel">
            <div class="ops-panel-kicker">Top Performers</div>
            <div>${this.renderLeaderboardMini()}</div>
          </div>
        </div>
      </div>
    `;

    target.querySelectorAll('[data-ops-panel]').forEach(button => {
      button.addEventListener('click', () => {
        this.showPanel(button.dataset.opsPanel);
        window.location.hash = button.dataset.opsPanel;
      });
    });
  },

  renderAiIntelligence() {
    const target = document.getElementById('opsAiContent');
    if (!target) return;

    const byProvider = this.state.analytics?.byProvider || {};
    const rows = Object.entries(byProvider).map(([provider, data]) => `
      <div class="ops-provider-card">
        <span class="ops-provider-status"><span class="ops-provider-dot active"></span>${this.escape(provider)}</span>
        <h3>${Number(data.requests || 0).toLocaleString()} requests</h3>
        <p>$${Number(data.cost || 0).toFixed(2)} tracked spend in the current analytics window.</p>
      </div>
    `).join('');

    target.innerHTML = `
      <div class="ops-card-grid-tight" style="margin-bottom: 1rem;">
        ${this.metricCard('Total AI Spend', `$${this.state.analytics?.summary?.totalCostUsd || '0.00'}`, '30 day provider usage')}
        ${this.metricCard('Active AI Users', this.state.analytics?.summary?.activeUsers || 0, 'Users found in events')}
        ${this.metricCard('Hours Saved', `${this.state.roi?.estimatedHoursSaved || '0'}h`, 'Estimated productivity gain')}
        ${this.metricCard('ROI', `${this.state.roi?.roiPercent || '0'}%`, 'Value vs provider cost')}
      </div>
      <div class="ops-provider-grid">
        ${rows || this.emptyPanel('No provider usage yet', 'Connect AI subscriptions to begin tracking spend, requests, and ROI.')}
      </div>
    `;
  },

  renderEmployees() {
    const tbody = document.getElementById('opsEmployeesTable');
    if (!tbody) return;
    const employees = this.state.employees;

    if (!employees.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--text-sec)">No employees yet. Share your team code to invite members.</td></tr>';
      return;
    }

    tbody.innerHTML = employees.map(emp => `
      <tr style="cursor:pointer" data-employee-id="${this.escape(emp.id)}">
        <td><strong>${this.escape(emp.name || '-')}</strong><br><span style="font-size:0.7rem;color:var(--text-sec)">${this.escape(emp.email || '-')}</span></td>
        <td>${this.escape(emp.employeeId || '-')}</td>
        <td>${this.escape(emp.jobRole || emp.role || '-')}</td>
        <td>${this.escape(emp.department || '-')}<br><span style="font-size:0.68rem;color:var(--text-sec)">${this.escape(emp.departmentId || '-')}</span></td>
        <td>${this.escape(emp.phone || '-')}</td>
        <td><span class="ops-badge ops-badge-${this.statusClass(emp.profileStatus)}">${this.escape(emp.profileStatus || 'pending')}</span></td>
        <td>${this.escape(emp.role || 'member')}</td>
      </tr>
    `).join('');

    tbody.querySelectorAll('[data-employee-id]').forEach(row => {
      row.addEventListener('click', () => this.openEmployee(row.dataset.employeeId));
    });
  },

  renderDepartments() {
    const target = document.getElementById('opsDepartmentsContent');
    if (!target) return;

    if (!this.state.departments.length) {
      target.innerHTML = this.emptyPanel('No departments yet', 'Employee department IDs will appear here after profiles are submitted.');
      return;
    }

    target.innerHTML = `
      <div class="ops-provider-grid">
        ${this.state.departments.map(dept => `
          <button class="ops-data-card" data-department-id="${this.escape(dept.id)}" style="width:100%; text-align:left;">
            <div>
              <div class="ops-panel-kicker">${this.escape(dept.id)}</div>
              <h3>${this.escape(dept.name)}</h3>
              <p>${dept.headcount} people • ${dept.approvedProfiles} approved • ${dept.pendingProfiles} pending • ${dept.admins} admins</p>
            </div>
            <span style="color:#00ff88">Open</span>
          </button>
        `).join('')}
      </div>
    `;

    target.querySelectorAll('[data-department-id]').forEach(card => {
      card.addEventListener('click', () => this.openDepartment(card.dataset.departmentId));
    });
  },

  renderSubscriptions() {
    const target = document.getElementById('opsSubscriptionGrid');
    const summary = document.getElementById('opsSubsSummary');
    if (!target) return;

    const known = ['openai', 'anthropic', 'microsoft', 'google', 'github'];
    const cards = known.map(provider => {
      const connection = this.state.connections.find(conn => (conn.provider || '').toLowerCase() === provider);
      const status = connection?.status || 'not connected';
      return `
        <div class="ops-provider-card">
          <span class="ops-provider-status"><span class="ops-provider-dot ${this.statusClass(status)}"></span>${provider}</span>
          <h3>${connection ? 'Connected' : 'Ready to connect'}</h3>
          <p>${connection?.lastSynced ? `Last synced ${new Date(connection.lastSynced).toLocaleDateString()}` : 'Open the connection manager to add OAuth or API key access.'}</p>
        </div>
      `;
    }).join('');

    target.innerHTML = `<div class="ops-provider-grid">${cards}</div>`;
    if (summary) {
      const active = this.state.connections.filter(conn => conn.status === 'active').length;
      summary.textContent = `${active} active provider${active === 1 ? '' : 's'} connected. Subscription records feed AI spend, usage, and ROI panels.`;
    }
  },

  renderDataRooms() {
    const target = document.getElementById('opsDataRooms');
    if (!target) return;

    const rooms = [
      ['employees', 'People Directory', 'Open employee profiles, approvals, identity fields, and HR status.'],
      ['departments', 'Department Intelligence', 'Inspect department IDs, headcount, admin coverage, and pending records.'],
      ['ai', 'AI Usage Intelligence', 'Review spend, requests, ROI, hours saved, and provider usage.'],
      ['subscriptions', 'Subscription Center', 'Manage OpenAI, Anthropic, Microsoft, Google, and GitHub connections.'],
      ['invoices', 'Billing Ledger', 'Open subscription invoices and payment records.'],
      ['settings', 'Workspace Settings', 'Rotate team codes, copy invite links, and review access rules.']
    ];

    target.innerHTML = `
      <div class="ops-provider-grid">
        ${rooms.map(([panel, title, body]) => `
          <button class="ops-data-card" data-ops-panel="${panel}" style="width:100%; text-align:left;">
            <div>
              <h3>${title}</h3>
              <p>${body}</p>
            </div>
            <span style="color:#00ff88">Open</span>
          </button>
        `).join('')}
        <a class="ops-data-card" href="/connect">
          <div>
            <h3>Connection Manager Page</h3>
            <p>Open the dedicated AI subscription setup page.</p>
          </div>
          <span style="color:#00ff88">Open</span>
        </a>
      </div>
    `;

    target.querySelectorAll('[data-ops-panel]').forEach(card => {
      card.addEventListener('click', () => {
        this.showPanel(card.dataset.opsPanel);
        window.location.hash = card.dataset.opsPanel;
      });
    });
  },

  renderInvoices() {
    const target = document.getElementById('opsInvoicesContent');
    if (!target) return;

    if (!this.state.invoices.length) {
      target.innerHTML = this.emptyPanel('No invoices yet', 'Invoices generated by approval, Whop, or manual billing will appear here.');
      return;
    }

    target.innerHTML = `
      <div class="ops-table-wrap">
        <table class="ops-table">
          <thead><tr><th>Invoice</th><th>Date</th><th>Scope</th><th>Total</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            ${this.state.invoices.map(inv => `
              <tr>
                <td><strong>${this.escape(inv.invoiceNumber || inv._id)}</strong><br><span style="font-size:0.68rem;color:var(--text-sec)">${this.escape(inv.clientName || 'Workspace')}</span></td>
                <td>${inv.date ? new Date(inv.date).toLocaleDateString() : '-'}</td>
                <td>${this.escape(inv.productName || 'Enterprise Access')}</td>
                <td>$${Number(inv.totalDue || inv.subtotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td><span class="ops-badge ops-badge-${this.statusClass(inv.status)}">${this.escape(inv.status || 'Draft')}</span></td>
                <td><a class="btn btn-dark" style="padding:6px 12px;font-size:0.65rem" href="/invoice?id=${encodeURIComponent(inv._id)}" target="_blank">Open</a></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  renderSettings() {
    const company = this.state.company;
    const code = company?.inviteCode || '-';
    const codeEl = document.getElementById('opsTeamCode');
    const linkEl = document.getElementById('opsInviteLink');
    const rulesEl = document.getElementById('opsApprovalRules');
    const healthEl = document.getElementById('opsWorkspaceHealth');

    if (codeEl) codeEl.textContent = code;
    if (linkEl) linkEl.value = `${window.location.origin}/login?code=${code}`;
    const customCodeEl = document.getElementById('opsCustomTeamCode');
    if (customCodeEl) customCodeEl.value = '';

    if (rulesEl) {
      rulesEl.innerHTML = `
        <div class="ops-detail-list">
          ${this.detailItem('Employee Profiles', 'HR approval required')}
          ${this.detailItem('Admin Accounts', 'Established from admin portal')}
          ${this.detailItem('Team Code', 'Rotatable by HR/admin')}
          ${this.detailItem('Supabase Login', 'Required before profile setup')}
        </div>
      `;
    }

    if (healthEl) {
      const activeConnections = this.state.connections.filter(conn => conn.status === 'active').length;
      healthEl.innerHTML = `
        <div class="ops-detail-list">
          ${this.detailItem('Workspace Status', company?.status || 'unknown')}
          ${this.detailItem('Employees', this.state.employees.length)}
          ${this.detailItem('Departments', this.state.departments.length)}
          ${this.detailItem('Active Providers', activeConnections)}
        </div>
      `;
    }
  },

  async openEmployee(id) {
    const emp = this.state.employees.find(employee => employee.id === id) || await argenApi.getEmployee(id);
    document.getElementById('opsDrawerTitle').textContent = emp.name || 'Employee';
    document.getElementById('opsDrawerBody').innerHTML = `
      <div class="ops-detail-list">
        ${this.detailItem('Email', emp.email)}
        ${this.detailItem('Phone', emp.phone || '-')}
        ${this.detailItem('Employee ID', emp.employeeId || '-')}
        ${this.detailItem('Department', `${emp.department || '-'} (${emp.departmentId || '-'})`)}
        ${this.detailItem('Job Role', emp.jobRole || '-')}
        ${this.detailItem('System Role', emp.role || 'member')}
        ${this.detailItem('Manager', emp.manager || '-')}
        ${this.detailItem('Location', emp.workLocation || '-')}
        ${this.detailItem('Employment Type', emp.employmentType || '-')}
        ${this.detailItem('Start Date', emp.startDate || '-')}
        ${this.detailItem('Status', emp.profileStatus || 'pending')}
        ${this.detailItem('Approved', emp.isApproved ? 'Yes' : 'No')}
      </div>
      <div class="ops-action-row">
        ${emp.profileStatus !== 'approved' ? `<button class="btn btn-accent" onclick="OpsDashboard.approveEmployee('${this.escape(emp.id)}')">Approve Employee</button>` : ''}
        ${emp.role !== 'teamadmin' ? `<button class="btn btn-dark" onclick="OpsDashboard.promoteEmployee('${this.escape(emp.id)}')">Make Team Admin</button>` : ''}
      </div>
    `;
    document.getElementById('opsDrawer').classList.add('open');
    document.getElementById('opsDrawerOverlay').classList.add('open');
  },

  openDepartment(id) {
    const dept = this.state.departments.find(item => item.id === id);
    const employees = this.state.employees.filter(emp => (emp.departmentId || emp.department || 'UNASSIGNED') === id);
    document.getElementById('opsDrawerTitle').textContent = dept?.name || 'Department';
    document.getElementById('opsDrawerBody').innerHTML = `
      <div class="ops-detail-list" style="margin-bottom: 1rem;">
        ${this.detailItem('Department ID', dept?.id || id)}
        ${this.detailItem('Headcount', dept?.headcount || employees.length)}
        ${this.detailItem('Approved', dept?.approvedProfiles || 0)}
        ${this.detailItem('Pending', dept?.pendingProfiles || 0)}
      </div>
      <div class="ops-stack">
        ${employees.map(emp => `
          <button class="ops-data-card" data-employee-id="${this.escape(emp.id)}" style="width:100%;text-align:left;">
            <div>
              <h3>${this.escape(emp.name || '-')}</h3>
              <p>${this.escape(emp.jobRole || emp.role || '-')} • ${this.escape(emp.email || '-')}</p>
            </div>
            <span style="color:#00ff88">Open</span>
          </button>
        `).join('') || '<p style="color:var(--text-sec)">No employees in this department yet.</p>'}
      </div>
    `;
    document.getElementById('opsDrawerBody').querySelectorAll('[data-employee-id]').forEach(row => {
      row.addEventListener('click', () => this.openEmployee(row.dataset.employeeId));
    });
    document.getElementById('opsDrawer').classList.add('open');
    document.getElementById('opsDrawerOverlay').classList.add('open');
  },

  closeDrawer() {
    document.getElementById('opsDrawer')?.classList.remove('open');
    document.getElementById('opsDrawerOverlay')?.classList.remove('open');
  },

  async approveEmployee(id) {
    try {
      await argenApi.updateEmployee(id, { approve: true });
      showToast('Employee approved', 'success');
      this.closeDrawer();
      await this.refreshAll();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async promoteEmployee(id) {
    const employee = this.state.employees.find(emp => emp.id === id);
    if (!employee) return;
    try {
      await argenApi.updateEmployee(id, { role: 'teamadmin', approve: true });
      showToast('Employee promoted to team admin', 'success');
      this.closeDrawer();
      await this.refreshAll();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async rotateTeamCode(useCustom = false) {
    try {
      const company = this.state.company || await argenApi.getMyCompany();
      const customInput = document.getElementById('opsCustomTeamCode');
      const customCode = useCustom && customInput
        ? customInput.value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
        : '';
      if (useCustom && (customCode.length < 4 || customCode.length > 24)) {
        showToast('Custom code must be 4 to 24 letters or numbers', 'error');
        return;
      }
      const data = await argenApi.generateTeamCode(company._id || company.id, customCode);
      if (!this.state.company) this.state.company = company;
      this.state.company.inviteCode = data.inviteCode;
      this.renderOverview();
      this.renderSettings();
      showToast(data.codeType === 'custom' ? 'Custom team code saved' : 'New team code generated', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  copyInviteLink() {
    const el = document.getElementById('opsInviteLink');
    if (!el) return;
    navigator.clipboard.writeText(el.value).then(() => showToast('Invite link copied', 'success'));
  },

  metricCard(label, value, hint) {
    return `
      <div class="ops-card">
        <div class="ops-card-label">${this.escape(label)}</div>
        <div class="ops-card-value">${this.escape(String(value))}</div>
        <p style="color: var(--text-sec); font-size: 0.75rem; margin-top: 0.35rem;">${this.escape(hint)}</p>
      </div>
    `;
  },

  panelButton(panel, label) {
    return `<button class="btn btn-dark" data-ops-panel="${panel}">${label}</button>`;
  },

  detailItem(label, value) {
    return `<div class="ops-detail-item"><span>${this.escape(label)}</span><strong>${this.escape(String(value ?? '-'))}</strong></div>`;
  },

  emptyPanel(title, body) {
    return `<div class="ops-mini-panel"><h3>${this.escape(title)}</h3><p>${this.escape(body)}</p></div>`;
  },

  renderLeaderboardMini() {
    if (!this.state.leaderboard.length) {
      return '<p style="color:var(--text-sec);font-size:0.82rem">Waiting for team activity.</p>';
    }
    return this.state.leaderboard.slice(0, 4).map((user, index) => `
      <div style="display:flex;justify-content:space-between;gap:1rem;padding:0.55rem 0;border-bottom:1px solid rgba(255,255,255,0.05);">
        <span style="color:#fff">${index + 1}. ${this.escape(user.name || 'Team Member')}</span>
        <strong style="color:#00ff88">${Number(user.totalScore || user.score || 0).toFixed(0)}</strong>
      </div>
    `).join('');
  },

  statusClass(status) {
    const normalized = String(status || '').toLowerCase().replace(/\s+/g, '_');
    if (normalized === 'active' || normalized === 'approved' || normalized === 'paid') return 'approved active';
    if (normalized === 'error' || normalized === 'overdue' || normalized === 'failed') return 'error';
    if (normalized === 'pending_admin') return 'pending_admin';
    return normalized || 'pending';
  },

  escape(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};

window.OpsDashboard = OpsDashboard;

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => OpsDashboard.init(), 250);
});
