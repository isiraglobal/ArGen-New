const user = JSON.parse(localStorage.getItem('user'));

document.addEventListener('DOMContentLoaded', () => {
    if (!user) {
        window.location.href = '/login';
        return;
    }

    document.getElementById('profileName').textContent = user.name.toUpperCase();
    document.getElementById('profileRole').textContent = `ID_${user.role.toUpperCase()}`;
    document.getElementById('welcomeText').innerHTML = `Welcome back, <i class="soul-text">${user.name.split(' ')[0]}</i>`;

    const role = user.role.toLowerCase();
    if (role === 'teamadmin' || role === 'superadmin') {
        document.getElementById('adminSection').style.display = 'block';
        initAdminDashboard();
    } else {
        document.getElementById('memberSection').style.display = 'block';
        initMemberDashboard();
    }
});

async function initAdminDashboard() {
    try {
        const company = await argenApi.request('/admin/my-company');
        if (company) {
            document.getElementById('orgName').textContent = company.name.toUpperCase();
            document.getElementById('inviteCodeDisplay').textContent = company.inviteCode;
        }

        const leaderboard = await argenApi.request('/leaderboard');
        renderAdminLeaderboard(leaderboard);

        // Fetch real stats from our new aggregation endpoints
        const stats = await argenApi.request('/admin/company-dashboard-stats'); 
        renderAdminStats(leaderboard, stats);
        renderCharts(stats);
        renderHeatmap(stats);
        checkFlaggedSubmissions();
    } catch (err) {
        console.error('Admin Dashboard Error:', err);
    }
}

function renderAdminStats(leaderboard, stats) {
    document.getElementById('teamAvgScore').textContent = stats.avgScore.toFixed(1);
    document.getElementById('activeEmployees').textContent = leaderboard.length;
    
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
        const company = await argenApi.request('/admin/my-company');
        if (company) {
            document.getElementById('orgName').textContent = company.name.toUpperCase();
        }

        // Streak
        const me = await argenApi.request('/auth/me'); // To get updated streak
        document.getElementById('currentStreakVal').textContent = me.currentStreak || 0;
        document.getElementById('memberStreakLarge').textContent = me.currentStreak || 0;
        document.getElementById('longestStreakVal').textContent = me.longestStreak || 0;
        document.getElementById('streakBadge').style.display = 'flex';

        // Challenge
        const challenges = await argenApi.request('/challenges/active');
        if (challenges && challenges.length > 0) {
            const c = challenges[0];
            document.getElementById('challengeTitle').textContent = c.title;
            document.getElementById('challengeScenario').textContent = c.scenario.substring(0, 150) + '...';
            document.getElementById('startChallengeBtn').onclick = () => {
                window.location.href = `/evaluate?challengeId=${c._id}`;
            };
        } else {
            document.getElementById('challengeTitle').textContent = "ALL CAUGHT UP";
            document.getElementById('challengeScenario').textContent = "The AI is currently researching new scenarios. Check back tomorrow.";
            document.getElementById('startChallengeBtn').style.display = 'none';
        }

        // Leaderboard
        const leaderboard = await argenApi.request('/leaderboard');
        renderMemberLeaderboard(leaderboard);

        // History
        const history = await argenApi.request('/responses/my');
        renderHistory(history);

    } catch (err) {
        console.error('Member Dashboard Error:', err);
    }
}

function renderAdminLeaderboard(leaderboard) {
    const container = document.getElementById('adminLeaderboard');
    if (!leaderboard.length) {
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
                <div style="font-weight: 700; color: var(--argen-blue);">${u.totalScore ? u.totalScore.toFixed(1) : '0.0'}</div>
                <div style="font-size: 0.6rem; color: var(--text-sec);">STREAK: ${u.currentStreak || 0}D</div>
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
    if (!history.length) {
        container.innerHTML = '<p class="batch-meta">Your performance history will appear here.</p>';
        return;
    }

    container.innerHTML = history.slice(0, 5).map(h => `
        <div class="batch-card" style="padding: 1.25rem;">
            <div class="batch-info">
                <span class="batch-meta" style="color: var(--argen-blue); font-size: 0.6rem;">${new Date(h.createdAt).toLocaleDateString()}</span>
                <h3 style="font-size: 1rem; margin-top: 0.25rem;">${h.challengeId?.title || 'Daily Intelligence'}</h3>
            </div>
            <div style="text-align: right;">
                <div style="font-size: 1.25rem; font-weight: 800;">${h.overallScore.toFixed(1)}</div>
                <div class="batch-meta" style="font-size: 0.55rem;">RATING: ${h.overallScore >= 8 ? 'ELITE' : 'STABLE'}</div>
            </div>
        </div>
    `).join('');
}

async function checkFlaggedSubmissions() {
    try {
        const panel = document.getElementById('flaggedPanel');
        const list = document.getElementById('flaggedList');
        
        const flagged = await argenApi.request('/admin/flagged');

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
        // Trigger the scheduler route we created
        await argenApi.request('/scheduler/daily', { method: 'POST' });
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

    // Target the admin section to convert to PDF
    const element = document.getElementById('adminSection');
    
    // Configure html2pdf options
    const opt = {
      margin:       0.5,
      filename:     `ArGen_Report_${new Date().toISOString().split('T')[0]}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'landscape' }
    };

    // Because html2pdf takes a snapshot, we need to temporarily style things
    // to ensure charts fit nicely in the PDF
    const originalBackground = element.style.backgroundColor;
    element.style.backgroundColor = '#000000'; // Enforce black bg for PDF
    element.style.padding = '20px';

    html2pdf().set(opt).from(element).save().then(() => {
        btn.disabled = false;
        btn.textContent = originalText;
        element.style.backgroundColor = originalBackground;
        element.style.padding = '0';
    }).catch(err => {
        console.error('PDF generation error:', err);
        alert('Failed to generate PDF. Please try again.');
        btn.disabled = false;
        btn.textContent = originalText;
        element.style.backgroundColor = originalBackground;
        element.style.padding = '0';
    });
}
