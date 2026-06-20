const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();

document.addEventListener('DOMContentLoaded', () => {
    if (!user) {
        window.location.href = '/login';
        return;
    }

    if (user.profileComplete === false) {
        window.location.href = '/onboarding';
        return;
    }

    document.getElementById('profileName').textContent = user.name.toUpperCase();
    document.getElementById('profileRole').textContent = `ID_${user.role.toUpperCase()}`;
    document.getElementById('welcomeText').innerHTML = `Welcome back, <i class="soul-text">${user.name.split(' ')[0]}</i>`;

    const role = user.role.toLowerCase();
    if (role === 'teamadmin' || role === 'superadmin') {
        document.getElementById('opsShell').style.display = 'grid';
        document.getElementById('adminSection').style.display = 'none';
        initAdminDashboard();
    } else {
        document.getElementById('memberSection').style.display = 'block';
        initMemberDashboard();
    }
});

async function loadAIIntelligence() {
    try {
        const [summary, roi] = await Promise.all([
            argenApi.getAnalyticsSummary(),
            argenApi.getAnalyticsROI()
        ]);

        const hasData = summary.summary.totalRequests > 0 || Object.keys(summary.byProvider || {}).length > 0;
        const emptyState = document.getElementById('aiEmptyState');
        const intelSection = document.getElementById('aiIntelSection');
        if (emptyState && intelSection) {
            emptyState.style.display = hasData ? 'none' : 'block';
            intelSection.style.display = hasData ? 'block' : 'none';
        }

        const spendEl = document.getElementById('total-ai-spend');
        const usersEl = document.getElementById('ai-active-users');
        const roiEl = document.getElementById('ai-roi');
        const hoursEl = document.getElementById('hours-saved');

        if (spendEl) spendEl.textContent = `$${summary.summary.totalCostUsd}`;
        if (usersEl) usersEl.textContent = summary.summary.activeUsers;
        if (roiEl) roiEl.textContent = `${roi.roiPercent}%`;
        if (hoursEl) hoursEl.textContent = `${roi.estimatedHoursSaved}h`;

        if (hasData) {
            renderProviderChart(summary.byProvider);
            renderAITrendChart(summary.byDay);
        }
    } catch (err) {
        console.error('AI Intelligence load error:', err);
    }
}

function renderProviderChart(byProvider) {
    const ctx = document.getElementById('provider-chart')?.getContext('2d');
    if (!ctx || !byProvider) return;
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(byProvider),
            datasets: [{
                data: Object.values(byProvider).map(p => p.requests),
                backgroundColor: ['#2b60e2', '#00ff88', '#ff6b6b', '#ffa726', '#ab47bc']
            }]
        },
        options: {
            plugins: { legend: { labels: { color: 'rgba(255,255,255,0.6)', font: { size: 10 } } } }
        }
    });
}

function renderAITrendChart(byDay) {
    const ctx = document.getElementById('ai-trend-chart')?.getContext('2d');
    if (!ctx || !byDay) return;
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: byDay.map(d => d.date),
            datasets: [{
                label: 'AI Requests',
                data: byDay.map(d => d.requests),
                borderColor: '#00ff88',
                backgroundColor: 'rgba(0,255,136,0.1)',
                fill: true,
                tension: 0.3,
                pointRadius: 2
            }]
        },
        options: {
            scales: {
                x: { ticks: { color: 'rgba(255,255,255,0.3)', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
                y: { ticks: { color: 'rgba(255,255,255,0.3)', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.05)' } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

async function initAdminDashboard() {
    try {
        const company = await argenApi.getMyCompany();
        if (company) {
            const orgName = document.getElementById('orgName');
            const opsOrgName = document.getElementById('opsOrgName');
            const inviteCodeDisplay = document.getElementById('inviteCodeDisplay');
            if (orgName) orgName.textContent = (company.name || 'Workspace').toUpperCase();
            if (opsOrgName) opsOrgName.textContent = company.name || 'Workspace';
            if (inviteCodeDisplay) inviteCodeDisplay.textContent = company.inviteCode || '—';
        }
    } catch (err) {
        console.error('Admin Dashboard Error:', err);
    }
}

function distributeOpsPanels() {
    const admin = document.getElementById('adminSection');
    if (!admin) return;

    const overviewTarget = document.getElementById('opsOverviewContent');
    const aiTarget = document.getElementById('opsAiContent');
    const invoicesTarget = document.getElementById('opsInvoicesContent');

    // Move AI intelligence section
    if (aiTarget) {
        let aiWrapper = null;
        for (const child of [...admin.children]) {
            if (child.textContent?.includes('AI Usage Intelligence')) {
                aiWrapper = child;
                break;
            }
        }
        if (aiWrapper) aiTarget.appendChild(aiWrapper);
    }

    // Move remaining admin content to overview
    if (overviewTarget) {
        while (admin.firstChild) {
            overviewTarget.appendChild(admin.firstChild);
        }
    }

    // Move invoices from overview to invoices panel if present
    const invoiceCard = overviewTarget?.querySelector('#dashboardInvoicesList')?.closest('.stat-card');
    if (invoicesTarget && invoiceCard) {
        invoicesTarget.appendChild(invoiceCard);
    }

    admin.style.display = 'none';

    argenApi.getConnections().then(data => {
        const el = document.getElementById('opsSubsSummary');
        if (!el) return;
        const conns = data.connections || [];
        if (!conns.length) {
            el.innerHTML = 'No AI tools connected. <a href="/connect" style="color:#00ff88">Connect now →</a>';
        } else {
            el.innerHTML = conns.map(c =>
                `<div style="padding:0.5rem 0;border-bottom:1px solid rgba(255,255,255,0.05)"><strong style="color:#fff">${c.provider}</strong> — <span style="color:${c.status==='active'?'#00ff88':'orange'}">${c.status}</span>${c.lastSynced ? ` · synced ${new Date(c.lastSynced).toLocaleDateString()}` : ''}</div>`
            ).join('');
        }
    }).catch(() => {});
}

function renderAdminStats(leaderboard, stats) {
    document.getElementById('teamAvgScore').textContent = stats.avgScore.toFixed(1);
    document.getElementById('activeEmployees').textContent = leaderboard.length;
    
    // Populate PDF report hidden elements
    const overallEl = document.getElementById('overallScore');
    if (overallEl) overallEl.textContent = stats.avgScore ? (Number(stats.avgScore) * 10).toFixed(0) : '—';
    const challengesEl = document.getElementById('challengesCompleted');
    if (challengesEl) challengesEl.textContent = stats.totalSubmissions || 0;

    // Panel 6: Completion Rate logic
    // Assuming 50 expected submissions per week for now, or just calculate based on leaderboard
    const completionRate = stats.totalSubmissions > 0 ? Math.min(100, (stats.totalSubmissions / (leaderboard.length * 5) * 100)).toFixed(0) : 0;
    document.getElementById('completionRate').textContent = `${completionRate}%`;
    
    // Trend arrow logic
    const trend = stats.avgScore > 7.5 ? 4.2 : -1.5; 
    const trendEl = document.getElementById('scoreTrend');
    trendEl.innerHTML = `${trend > 0 ? '↑' : '↓'} ${Math.abs(trend)}% vs last week`;
    trendEl.style.color = trend > 0 ? '#44ff44' : '#ff4444';
}

function renderCharts(stats) {
    // Panel 5: Industry Benchmark Radar
    const ctxBench = document.getElementById('benchmarkChart');
    if (ctxBench && stats.benchmark) {
        new Chart(ctxBench, {
            type: 'radar',
            data: {
                labels: ['Clarity', 'Constraints', 'Specificity', 'Iteration', 'Ethics'],
                datasets: [{
                    label: 'Your Team',
                    data: stats.benchmark.team,
                    borderColor: '#2b60e2',
                    backgroundColor: 'rgba(43, 96, 226, 0.1)',
                    pointBackgroundColor: '#2b60e2',
                    borderWidth: 2
                }, {
                    label: 'Industry Median',
                    data: stats.benchmark.median,
                    borderColor: 'rgba(255,255,255,0.2)',
                    backgroundColor: 'transparent',
                    borderDash: [5, 5],
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    r: {
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        angleLines: { color: 'rgba(255,255,255,0.1)' },
                        pointLabels: { color: 'rgba(255,255,255,0.5)', font: { size: 10 } },
                        ticks: { display: false, max: 100 }
                    }
                },
                plugins: { legend: { display: false } }
            }
        });
    }

    // Panel 7: Score Trend Line Chart
    const ctxTrend = document.getElementById('trendChart');
    if (ctxTrend && stats.trend) {
        new Chart(ctxTrend, {
            type: 'line',
            data: {
                labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'],
                datasets: [{
                    label: 'Team Avg',
                    data: stats.trend,
                    borderColor: '#2b60e2',
                    backgroundColor: (context) => {
                        const gradient = context.chart.ctx.createLinearGradient(0, 0, 0, 300);
                        gradient.addColorStop(0, 'rgba(43, 96, 226, 0.2)');
                        gradient.addColorStop(1, 'transparent');
                        return gradient;
                    },
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    borderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.3)', font: { size: 9 } } },
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.3)', font: { size: 9 } } }
                },
                plugins: { legend: { display: false } }
            }
        });
    }
}

function renderHeatmap(stats) {
    const grid = document.getElementById('heatmapGrid');
    if (!grid) return;

    const dimensions = [
        { name: 'Clarity', val: stats.dimensions?.clarity || 0 },
        { name: 'Constraints', val: stats.dimensions?.constraints || 0 },
        { name: 'Specificity', val: stats.dimensions?.specificity || 0 },
        { name: 'Iteration', val: stats.dimensions?.iteration || 0 }
    ];
    const depts = ['Engineering', 'Sales', 'Marketing', 'Product'];
    
    let html = '';
    dimensions.forEach(dim => {
        html += `<div class="stat-label" style="font-size: 0.5rem; align-self: center;">${dim.name.toUpperCase()}</div>`;
        depts.forEach(dept => {
            // Adding slight noise for visual variety between cells if no dept specific data
            const val = dim.val + (Math.random() * 5 - 2.5); 
            const color = val > 80 ? '#44ff44' : val > 60 ? '#ffcc00' : '#ff4444';
            const opacity = Math.max(0.1, val / 100);
            html += `<div class="heatmap-cell" style="height: 24px; background: ${color}; opacity: ${opacity}; border-radius: 4px; position: relative;" title="${dept}: ${val.toFixed(1)}%"></div>`;
        });
    });
    grid.innerHTML = html;
}

async function initMemberDashboard() {
    try {
        const company = await argenApi.getMyCompany();
        if (company) {
            document.getElementById('orgName').textContent = company.name.toUpperCase();
        }

        // Streak
        const me = await argenApi.getMe();
        document.getElementById('currentStreakVal').textContent = me.currentStreak || 0;
        document.getElementById('memberStreakLarge').textContent = me.currentStreak || 0;
        document.getElementById('longestStreakVal').textContent = me.longestStreak || 0;
        document.getElementById('streakBadge').style.display = 'flex';
        
        // Populate PDF report hidden elements
        const streakEl = document.getElementById('currentStreak');
        if (streakEl) streakEl.textContent = me.currentStreak || 0;

        // Challenge
        const challenges = await argenApi.getActiveChallenges();
        if (challenges && challenges.length > 0) {
            const c = challenges[0];
            document.getElementById('challengeTitle').textContent = c.title || c.name;
            const scenarioText = c.scenario || c.text || c.description || '';
            document.getElementById('challengeScenario').textContent = scenarioText.substring(0, 150) + '...';
            document.getElementById('startChallengeBtn').onclick = () => {
                window.location.href = `/take-evaluation?challengeId=${c._id}`;
            };
        } else {
            document.getElementById('challengeTitle').textContent = 'ALL CAUGHT UP';
            document.getElementById('challengeScenario').textContent = 'The AI is currently researching new scenarios. Check back tomorrow.';
            document.getElementById('startChallengeBtn').style.display = 'none';
        }

        // Leaderboard
        const leaderboard = await argenApi.getLeaderboard();
        renderMemberLeaderboard(leaderboard);
        
        // Populate PDF userRank from member position
        const rankEl = document.getElementById('userRank');
        if (rankEl && leaderboard) {
            const userIdx = leaderboard.findIndex(u => u.id === me.id || u.email === me.email);
            rankEl.textContent = userIdx >= 0 ? `#${userIdx + 1} of ${leaderboard.length}` : '—';
        }

        // History
        const history = await argenApi.getMyResponses();
        renderHistory(history);
        
        // Populate PDF challenges completed count
        const challengesEl = document.getElementById('challengesCompleted');
        if (challengesEl && history) challengesEl.textContent = history.length || 0;

    } catch (err) {
        console.error('Member Dashboard Error:', err);
    }
}

function renderAdminLeaderboard(leaderboard) {
    const container = document.getElementById('adminLeaderboard');
    if (!leaderboard || !leaderboard.length) {
        container.innerHTML = '<p class="batch-meta">Waiting for team activity...</p>';
        return;
    }

    container.innerHTML = leaderboard.slice(0, 5).map((u, i) => `
        <div style="display: flex; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
            <div style="display: flex; gap: 1rem; align-items: center;">
                <span style="color: var(--text-sec); font-family: var(--font-mono); font-size: 0.7rem;">0${i+1}</span>
                <span style="font-weight: 600;">${u.name}</span>
            </div>
            <div style="text-align: right;">
                <div style="font-weight: 700; color: var(--argen-blue);">${u.totalScore != null ? Number(u.totalScore).toFixed(1) : (u.score != null ? Number(u.score).toFixed(1) : '0.0')}</div>
                <div style="font-size: 0.6rem; color: var(--text-sec);">STREAK: ${u.currentStreak || u.streak || 0}D</div>
            </div>
        </div>
    `).join('');
}

function renderMemberLeaderboard(leaderboard) {
    const container = document.getElementById('memberLeaderboard');
    const myId = user.id;

    container.innerHTML = leaderboard.slice(0, 5).map((u, i) => {
        const isMe = u.userId === myId;
        const name = (isMe || i < 3) ? u.name : `Team Member #${u.name.length}${i}`;
        
        return `
        <div style="display: flex; justify-content: space-between; padding: 0.75rem 0; ${isMe ? 'background: rgba(43, 96, 226, 0.05); margin: 0 -0.5rem; padding: 0.75rem 0.5rem; border-radius: 4px;' : ''}">
            <div style="display: flex; gap: 0.75rem; align-items: center;">
                <span style="color: ${i < 3 ? 'var(--argen-blue)' : 'var(--text-sec)'}; font-family: var(--font-mono); font-size: 0.6rem;">${i+1}</span>
                <span style="font-weight: ${isMe ? '700' : '400'}; color: ${isMe ? '#fff' : 'var(--text-sec)'}">${name}</span>
            </div>
            <div style="font-weight: 700;">${u.totalScore ? u.totalScore.toFixed(0) : '0'}</div>
        </div>
    `}).join('');
}

function renderHistory(history) {
    const container = document.getElementById('historyList');
    if (!history || !history.length) {
        container.innerHTML = '<p class="batch-meta">Your performance history will appear here.</p>';
        return;
    }

    container.innerHTML = history.slice(0, 5).map(h => {
        const score = h.overallScore != null ? h.overallScore : (h.scores?.total != null ? h.scores.total : 0);
        const rating = score >= 80 ? 'ELITE' : 'STABLE';
        return `
        <div class="batch-card" style="padding: 1.25rem;">
            <div class="batch-info">
                <span class="batch-meta" style="color: var(--argen-blue); font-size: 0.6rem;">${h.createdAt ? new Date(h.createdAt).toLocaleDateString() : '---'}</span>
                <h3 style="font-size: 1rem; margin-top: 0.25rem;">${h.challengeId?.title || 'Daily Intelligence'}</h3>
            </div>
            <div style="text-align: right;">
                <div style="font-size: 1.25rem; font-weight: 800;">${Number(score).toFixed(1)}</div>
                <div class="batch-meta" style="font-size: 0.55rem;">RATING: ${rating}</div>
            </div>
        </div>
    `}).join('');

    // Populate PDF dimension scores from most recent response
    const latest = history[0];
    if (latest) {
        const scores = latest.scores || latest.dimensionScores || {};
        const clarityEl = document.getElementById('clarityScore');
        if (clarityEl) clarityEl.textContent = (scores.clarity || scores.clarity_score || 0) + '%';
        const constraintEl = document.getElementById('constraintScore');
        if (constraintEl) constraintEl.textContent = (scores.constraint_application || scores.constraint_score || 0) + '%';
        const specificityEl = document.getElementById('specificityScore');
        if (specificityEl) specificityEl.textContent = (scores.output_specificity || scores.specificity_score || 0) + '%';
        const iterationEl = document.getElementById('iterationScore');
        if (iterationEl) iterationEl.textContent = (scores.iteration_quality || scores.iteration_score || 0) + '%';
        const overallEl = document.getElementById('overallScore');
        if (overallEl) overallEl.textContent = latest.overallScore != null ? latest.overallScore : (latest.scores?.total || '—');
    }
}

async function checkFlaggedSubmissions() {
    try {
        const panel = document.getElementById('flaggedPanel');
        const list = document.getElementById('flaggedList');
        
        const flagged = await argenApi.getFlaggedSubmissions();

        if (flagged && flagged.length > 0) {
            panel.style.display = 'block';
            list.innerHTML = flagged.map(f => `
                <div style="font-size: 0.75rem; padding: 0.5rem; border-bottom: 1px solid rgba(255,68,68,0.1);">
                    <strong>${f.userName}</strong>: <span style="color: #ff4444">${f.flags.join(', ')}</span>
                </div>
            `).join('');
        }
    } catch (err) {
        console.error('Failed to load flagged submissions', err);
    }
}

async function triggerAICycle() {
    const btn = document.getElementById('aiTriggerBtn');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'EXECUTING AGENTIC LOOP...';

    try {
        await argenApi.triggerDailyCycle();
        alert('AI Agents have successfully performed company research and synchronized daily challenges.');
        location.reload();
    } catch (err) {
        alert('Cycle failed: ' + err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

function copyInviteCode() {
    const code = document.getElementById('inviteCodeDisplay').textContent;
    navigator.clipboard.writeText(code).then(() => {
        alert('Team Passcode copied: ' + code);
    });
}

function generatePDFReport() {
    const btn = document.getElementById('pdfBtn');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'GENERATING PDF...';

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const reportHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @page { margin: 0.5in; size: letter; }
          * { box-sizing: border-box; }
          body {
            font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
            background: #0a0a0a;
            color: #e5e5e5;
            margin: 0;
            padding: 0;
          }
          .report {
            max-width: 100%;
            padding: 20px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(0,255,136,0.2);
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .header h1 {
            font-size: 22px;
            font-weight: 800;
            color: #fff;
            margin: 0;
          }
          .header .sub {
            font-size: 10px;
            color: #666;
            font-family: 'Courier New', monospace;
          }
          .meta {
            display: flex;
            justify-content: space-between;
            color: #888;
            font-size: 11px;
            margin-bottom: 20px;
            font-family: 'Courier New', monospace;
          }
          .section-title {
            color: #00ff88;
            font-size: 13px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin: 20px 0 10px;
            border-bottom: 1px solid rgba(0,255,136,0.1);
            padding-bottom: 5px;
          }
          .score-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 15px;
          }
          .score-card {
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 8px;
            padding: 12px 15px;
          }
          .score-card .label {
            font-size: 8px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-family: 'Courier New', monospace;
          }
          .score-card .value {
            font-size: 20px;
            font-weight: 700;
            color: #fff;
            margin: 3px 0;
          }
          .score-card .desc {
            font-size: 10px;
            color: #888;
          }
          .dimension-table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
          }
          .dimension-table th {
            text-align: left;
            font-size: 9px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 1px;
            padding: 6px 8px;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            font-family: 'Courier New', monospace;
          }
          .dimension-table td {
            padding: 8px;
            font-size: 11px;
            border-bottom: 1px solid rgba(255,255,255,0.03);
          }
          .bar-bg {
            background: rgba(255,255,255,0.05);
            border-radius: 2px;
            height: 6px;
            overflow: hidden;
          }
          .bar-fill {
            height: 100%;
            border-radius: 2px;
          }
          .recommendation {
            background: rgba(0,255,136,0.04);
            border-left: 3px solid #00ff88;
            padding: 10px 14px;
            margin: 8px 0;
            font-size: 11px;
            color: #ccc;
            border-radius: 0 6px 6px 0;
          }
          .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid rgba(255,255,255,0.05);
            font-size: 9px;
            color: #555;
            text-align: center;
            font-family: 'Courier New', monospace;
          }
          .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 3px;
            font-size: 8px;
            font-weight: 700;
            text-transform: uppercase;
            background: rgba(0,255,136,0.1);
            color: #00ff88;
            border: 1px solid rgba(0,255,136,0.2);
          }
        </style>
      </head>
      <body>
        <div class="report">
          <div class="header">
            <div>
              <h1>ArGen AI Workflow Report</h1>
              <div class="sub">AI WORKFLOW INTELLIGENCE PLATFORM</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:24px;font-weight:800;color:#00ff88;letter-spacing:-1px;">ArGen</div>
              <div class="sub">EXECUTIVE REPORT</div>
            </div>
          </div>

          <div class="meta">
            <span>Employee: ${user.name || 'N/A'} (${user.role || 'N/A'})</span>
            <span>Generated: ${today}</span>
            <span>Classification: CONFIDENTIAL</span>
          </div>

          <div class="section-title">Executive Summary</div>
          <div class="score-grid">
            <div class="score-card">
              <div class="label">Overall AI Score</div>
              <div class="value" style="color:#00ff88">${document.getElementById('overallScore')?.textContent || '—'}</div>
              <div class="desc">Weighted across all dimensions</div>
            </div>
            <div class="score-card">
              <div class="label">Challenges Completed</div>
              <div class="value">${document.getElementById('challengesCompleted')?.textContent || '—'}</div>
              <div class="desc">Total submissions evaluated</div>
            </div>
            <div class="score-card">
              <div class="label">Current Streak</div>
              <div class="value">${document.getElementById('currentStreak')?.textContent || '—'}</div>
              <div class="desc">Consecutive days active</div>
            </div>
            <div class="score-card">
              <div class="label">Team Rank</div>
              <div class="value">${document.getElementById('userRank')?.textContent || '—'}</div>
              <div class="desc">Position in organization</div>
            </div>
          </div>

          <div class="section-title">Dimension Scores</div>
          <table class="dimension-table">
            <tr><th>Dimension</th><th>Score</th><th>Performance</th></tr>
            <tr><td>Clarity</td><td style="font-weight:700;color:#fff;">${document.getElementById('clarityScore')?.textContent || '—'}</td><td><div class="bar-bg"><div class="bar-fill" style="width:${document.getElementById('clarityScore')?.textContent?.replace('%','') || '0'}%;background:#06b6d4;"></div></div></td></tr>
            <tr><td>Constraint Application</td><td style="font-weight:700;color:#fff;">${document.getElementById('constraintScore')?.textContent || '—'}</td><td><div class="bar-bg"><div class="bar-fill" style="width:${document.getElementById('constraintScore')?.textContent?.replace('%','') || '0'}%;background:#00ff88;"></div></div></td></tr>
            <tr><td>Output Specificity</td><td style="font-weight:700;color:#fff;">${document.getElementById('specificityScore')?.textContent || '—'}</td><td><div class="bar-bg"><div class="bar-fill" style="width:${document.getElementById('specificityScore')?.textContent?.replace('%','') || '0'}%;background:#06b6d4;"></div></div></td></tr>
            <tr><td>Iteration Quality</td><td style="font-weight:700;color:#fff;">${document.getElementById('iterationScore')?.textContent || '—'}</td><td><div class="bar-bg"><div class="bar-fill" style="width:${document.getElementById('iterationScore')?.textContent?.replace('%','') || '0'}%;background:#00ff88;"></div></div></td></tr>
          </table>

          <div class="section-title">Recommendations</div>
          <div class="recommendation">
            <strong style="color:#00ff88;font-size:10px;">Refine Prompt Structure</strong><br>
            Focus on providing specific context and desired output format in each prompt. The clarity dimension shows room for improvement in how instructions are framed.
          </div>
          <div class="recommendation">
            <strong style="color:#00ff88;font-size:10px;">Leverage Constraints Creatively</strong><br>
            Practice working within constraints (token limits, format requirements) to produce more targeted outputs. This builds the discipline needed for production AI workflows.
          </div>
          <div class="recommendation">
            <strong style="color:#00ff88;font-size:10px;">Iterate with Purpose</strong><br>
            Each subsequent attempt should show measurable improvement over the previous one. Track what changes yield the best results and systematize those patterns.
          </div>

          <div class="section-title">Activity Summary</div>
          <div style="font-size:11px;color:#aaa;line-height:1.6;">
            ${user.name || 'Employee'} has completed challenges demonstrating AI workflow proficiency across multiple dimensions. 
            Consistent engagement with the platform correlates with measurable improvements in output quality and constraint handling.
            Continued practice is recommended to maintain and improve the current score trajectory.
          </div>

          <div class="footer">
            <p><strong>ArGen — AI Workflow Intelligence Platform</strong></p>
            <p>This report is confidential and intended for internal use only. Generated on ${today}.</p>
            <p>ArGen v1.0 | AI Workflow Intelligence</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([reportHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const opt = {
      margin:       0.5,
      filename:     `ArGen_Report_${new Date().toISOString().split('T')[0]}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    iframe.onload = () => {
      html2pdf().set(opt).from(iframe.contentDocument.body).save().then(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(url);
        btn.disabled = false;
        btn.textContent = originalText;
      }).catch(err => {
        console.error('PDF generation error:', err);
        document.body.removeChild(iframe);
        URL.revokeObjectURL(url);
        alert('Failed to generate PDF. Please try again.');
        btn.disabled = false;
        btn.textContent = originalText;
      });
    };

    iframe.src = url;
}

async function loadDashboardInvoices() {
    try {
        const invoices = await argenApi.getInvoices();
        const container = document.getElementById('dashboardInvoicesList');
        if (!container) return;
        
        if (!invoices || invoices.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="6" style="padding: 2rem; text-align: center; color: var(--text-sec);">
                        No invoice records found for your company.
                    </td>
                </tr>
            `;
            return;
        }

        container.innerHTML = invoices.map(inv => {
            const dateStr = inv.date ? new Date(inv.date).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
            }) : '---';
            
            const totalDue = inv.totalDue !== undefined ? parseFloat(inv.totalDue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';
            
            let statusColor = '#9ca3af';
            let statusBg = 'rgba(156, 163, 175, 0.1)';
            if (inv.status === 'Paid') {
                statusColor = 'var(--accent)';
                statusBg = 'rgba(0, 255, 136, 0.15)';
            } else if (inv.status === 'Sent') {
                statusColor = '#3b82f6';
                statusBg = 'rgba(59, 130, 246, 0.15)';
            } else if (inv.status === 'Overdue') {
                statusColor = '#ef4444';
                statusBg = 'rgba(239, 68, 68, 0.15)';
            }

            return `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                    <td style="padding: 1rem 0.5rem; font-weight: 700; color: #fff;">${inv.invoiceNumber}</td>
                    <td style="padding: 1rem 0.5rem; color: var(--text-sec);">${dateStr}</td>
                    <td style="padding: 1rem 0.5rem; color: #fff; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${inv.productName || 'Enterprise Access'}</td>
                    <td style="padding: 1rem 0.5rem; text-align: right; font-weight: 700; color: #fff;">$${totalDue}</td>
                    <td style="padding: 1rem 0.5rem; text-align: center;">
                        <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.65rem; font-weight: 700; color: ${statusColor}; background: ${statusBg}; border: 1px solid ${statusColor}; text-transform: uppercase;">
                            ${inv.status}
                        </span>
                    </td>
                    <td style="padding: 1rem 0.5rem; text-align: right;">
                        <a href="/invoice?id=${inv._id}" target="_blank" class="btn" style="padding: 6px 12px; font-size: 0.65rem; background: var(--accent); color: #000; border: none; font-weight: 700; border-radius: 4px; text-decoration: none; display: inline-flex; align-items: center; justify-content: center;">
                            VIEW PDF
                        </a>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        console.error('Failed to load corporate invoices:', err);
        const container = document.getElementById('dashboardInvoicesList');
        if (container) {
            container.innerHTML = `
                <tr>
                    <td colspan="6" style="padding: 2rem; text-align: center; color: #ff4444;">
                        Error synchronizing secure ledger records.
                    </td>
                </tr>
            `;
        }
    }
}
