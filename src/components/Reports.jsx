import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Reports({ token }) {
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/reports', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setReportsData(res.data.data);
      }
    } catch (err) {
      console.error('Reports fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: '#94a3b8', fontSize: '0.88rem' }}>
        Loading reports...
      </div>
    );
  }

  const s = reportsData?.summary || {};
  const depts = reportsData?.departmentBreakdown || [];
  const statusDist = reportsData?.statusDistribution || [];
  const priorityBk = reportsData?.priorityBreakdown || {};
  const overdueTasks = reportsData?.overdueTasks || [];
  const topPerformers = reportsData?.topPerformers || [];

  const totalStatusCount = statusDist.reduce((sum, x) => sum + x.count, 0) || 1;

  /* ——— Shared styles ——— */
  const MetricDot = ({ color }) => (
    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }} />
  );

  const sectionTitle = (icon, label) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', letterSpacing: '-0.2px', marginBottom: '14px' }}>
      {icon}
      {label}
    </div>
  );

  const thStyle = {
    padding: '10px 14px',
    fontSize: '0.7rem',
    fontWeight: 600,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '1px solid #f1f5f9',
    textAlign: 'left'
  };

  const tdStyle = {
    padding: '10px 14px',
    fontSize: '0.82rem',
    color: '#334155',
    borderBottom: '1px solid #f8fafc'
  };

  const cardStyle = {
    padding: '18px 20px',
    borderRadius: '10px',
    background: '#ffffff',
    border: '1px solid #e2e8f0'
  };

  const priorityColor = (p) => ({
    Urgent: { bg: '#fef2f2', text: '#dc2626' },
    High: { bg: '#fffbeb', text: '#d97706' },
    Medium: { bg: '#eff6ff', text: '#2563eb' },
    Low: { bg: '#f8fafc', text: '#94a3b8' }
  }[p] || { bg: '#f8fafc', text: '#94a3b8' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '30px' }}>

      {/* ——— Header ——— */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#1e293b', letterSpacing: '-0.3px' }}>
            Reports
          </h2>
          <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
            Executive analytics & performance overview
          </p>
        </div>
        <button
          onClick={fetchReports}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px', height: '32px', padding: '0 14px', borderRadius: '8px',
            border: '1px solid #e2e8f0', background: '#ffffff', color: '#334155', fontSize: '0.82rem', fontWeight: 600,
            cursor: 'pointer', transition: 'border-color 0.15s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#7c3aed'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          Refresh
        </button>
      </div>

      {/* ——— Row 1: Top 6 KPI Metrics ——— */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px' }}>
        {[
          { label: 'Total Tasks', value: s.totalTasks || 0, color: '#7c3aed' },
          { label: 'Completion', value: `${s.completionRate || 0}%`, color: '#16a34a' },
          { label: 'In Progress', value: s.inProgressTasks || 0, color: '#2563eb' },
          { label: 'Delayed', value: s.delayedTasks || 0, color: '#dc2626' },
          { label: 'Story Points', value: s.totalStoryPoints || 0, color: '#d946ef' },
          { label: 'Unassigned', value: s.unassignedTasks || 0, color: '#d97706' }
        ].map((kpi, i) => (
          <div key={i} style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <MetricDot color={kpi.color} />
              <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                {kpi.label}
              </span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.5px' }}>
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* ——— Row 2: Status Distribution + Priority Breakdown ——— */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>

        {/* Status Distribution */}
        <div style={cardStyle}>
          {sectionTitle(
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
            </svg>,
            'Status Distribution'
          )}

          {/* Stacked horizontal bar */}
          <div style={{ height: '24px', borderRadius: '6px', overflow: 'hidden', display: 'flex', marginBottom: '16px' }}>
            {statusDist.map((st, i) => (
              st.count > 0 && (
                <div key={i} style={{
                  width: `${(st.count / totalStatusCount) * 100}%`,
                  height: '100%',
                  background: st.color,
                  transition: 'width 0.5s ease'
                }} title={`${st.status}: ${st.count}`} />
              )
            ))}
            {totalStatusCount <= 1 && (
              <div style={{ width: '100%', height: '100%', background: '#f1f5f9' }} />
            )}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
            {statusDist.map((st, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MetricDot color={st.color} />
                <span style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 500 }}>{st.status}</span>
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#1e293b' }}>{st.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Breakdown */}
        <div style={cardStyle}>
          {sectionTitle(
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>,
            'Priority Breakdown'
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Object.entries(priorityBk).map(([key, count]) => {
              const pc = priorityColor(key);
              const pct = (s.totalTasks || 0) > 0 ? Math.round((count / s.totalTasks) * 100) : 0;
              return (
                <div key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: '4px',
                        background: pc.bg, color: pc.text
                      }}>{key}</span>
                    </div>
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#1e293b' }}>{count} <span style={{ color: '#94a3b8', fontWeight: 500 }}>({pct}%)</span></span>
                  </div>
                  <div style={{ height: '6px', borderRadius: '3px', background: '#f1f5f9', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', borderRadius: '3px', background: pc.text, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ——— Row 3: Department Performance Table ——— */}
      {depts.length > 0 && (
        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9' }}>
            {sectionTitle(
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
              </svg>,
              'Department Performance'
            )}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Department</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Tasks</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Active</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Done</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Blocked</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Late</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>SP</th>
                  <th style={{ ...thStyle, width: '22%' }}>Progress</th>
                </tr>
              </thead>
              <tbody>
                {depts.map(d => {
                  const rate = d.CompletionRate || 0;
                  const barColor = rate >= 80 ? '#16a34a' : rate >= 50 ? '#d97706' : rate > 0 ? '#2563eb' : '#e2e8f0';
                  return (
                    <tr key={d.Department}
                      style={{ transition: 'background 0.1s ease' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafbff'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ ...tdStyle, fontWeight: 600, color: '#1e293b' }}>{d.Department}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700 }}>{d.TotalTasks}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600, color: '#2563eb' }}>{d.InProgress || 0}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600, color: '#16a34a' }}>{d.Completed}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600, color: d.Stuck > 0 ? '#d97706' : '#94a3b8' }}>{d.Stuck || 0}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600, color: d.Delayed > 0 ? '#dc2626' : '#94a3b8' }}>{d.Delayed}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600 }}>{d.StoryPoints || 0}</td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: '#f1f5f9', overflow: 'hidden' }}>
                            <div style={{ width: `${rate}%`, height: '100%', borderRadius: '3px', background: barColor, transition: 'width 0.5s ease' }} />
                          </div>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1e293b', minWidth: '30px', textAlign: 'right' }}>{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ——— Row 4: Overdue Tasks + Top Performers ——— */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>

        {/* Overdue Tasks */}
        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>Overdue Tasks</span>
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: '6px', background: overdueTasks.length > 0 ? '#fef2f2' : '#f0fdf4', color: overdueTasks.length > 0 ? '#dc2626' : '#16a34a' }}>
              {overdueTasks.length}
            </span>
          </div>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {overdueTasks.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, fontSize: '0.66rem' }}>Task</th>
                    <th style={{ ...thStyle, fontSize: '0.66rem' }}>Assignee</th>
                    <th style={{ ...thStyle, fontSize: '0.66rem', textAlign: 'center' }}>Days Late</th>
                  </tr>
                </thead>
                <tbody>
                  {overdueTasks.map(t => (
                    <tr key={t.TaskID}>
                      <td style={{ ...tdStyle, fontWeight: 600, color: '#1e293b', fontSize: '0.78rem', maxWidth: '180px' }}>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.Title}</div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 400 }}>{t.Department}</div>
                      </td>
                      <td style={{ ...tdStyle, fontSize: '0.78rem' }}>{t.AssigneeName}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: '#fef2f2', color: '#dc2626' }}>
                          {t.DaysOverdue}d
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '6px' }}>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <div>No overdue tasks</div>
              </div>
            )}
          </div>
        </div>

        {/* Top Performers */}
        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>Top Performers</span>
            </div>
          </div>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {topPerformers.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, fontSize: '0.66rem' }}>Member</th>
                    <th style={{ ...thStyle, fontSize: '0.66rem', textAlign: 'center' }}>Done</th>
                    <th style={{ ...thStyle, fontSize: '0.66rem', textAlign: 'center' }}>Total</th>
                    <th style={{ ...thStyle, fontSize: '0.66rem', width: '100px' }}>Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {topPerformers.map((p, i) => (
                    <tr key={p.UserID}
                      style={{ transition: 'background 0.1s ease' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafbff'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ ...tdStyle, fontWeight: 600, color: '#1e293b', fontSize: '0.78rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '24px', height: '24px', borderRadius: '50%',
                            background: i === 0 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : i === 1 ? 'linear-gradient(135deg, #94a3b8, #64748b)' : i === 2 ? 'linear-gradient(135deg, #d97706, #b45309)' : '#e2e8f0',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: i < 3 ? '#ffffff' : '#64748b', fontSize: '0.62rem', fontWeight: 800, flexShrink: 0
                          }}>
                            {i + 1}
                          </div>
                          <div>
                            <div>{p.FullName}</div>
                            <div style={{ fontSize: '0.66rem', color: '#94a3b8', fontWeight: 400 }}>{p.Department}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, color: '#16a34a', fontSize: '0.82rem' }}>{p.CompletedTasks}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600, fontSize: '0.82rem' }}>{p.TotalAssigned}</td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ flex: 1, height: '5px', borderRadius: '3px', background: '#f1f5f9', overflow: 'hidden' }}>
                            <div style={{ width: `${p.CompletionRate}%`, height: '100%', borderRadius: '3px', background: '#16a34a', transition: 'width 0.5s ease' }} />
                          </div>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1e293b', minWidth: '28px', textAlign: 'right' }}>{p.CompletionRate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '6px' }}>
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                </svg>
                <div>Complete tasks to see rankings</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ——— Row 5: Budget Summary ——— */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[
          { label: 'Est. Budget', value: `$${(s.totalEstimatedBudget || 0).toLocaleString()}`, color: '#7c3aed' },
          { label: 'Actual Expense', value: `$${(s.totalActualExpense || 0).toLocaleString()}`, color: '#d946ef' },
          { label: 'Avg SP/Task', value: s.avgStoryPoints || 0, color: '#2563eb' },
          { label: 'Blocked', value: s.stuckTasks || 0, color: '#d97706' }
        ].map((kpi, i) => (
          <div key={i} style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <MetricDot color={kpi.color} />
              <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                {kpi.label}
              </span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.5px' }}>
              {kpi.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
