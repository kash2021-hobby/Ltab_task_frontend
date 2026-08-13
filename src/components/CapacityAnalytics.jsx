import React, { useState, useEffect } from 'react';
import axios from 'axios';

// SVG Capacity Pulse Ring component
function CapacityPulseRing({ pct, size = 64, onClick }) {
  const radius = 24;
  const strokeWidth = 5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, pct)) / 100) * circumference;
  
  // Color calculation per §7
  const isHighLoad = pct > 80;
  const gradientId = `capacityRingGrad-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div
      onClick={onClick}
      title={`Click to view breakdown (${pct}% capacity allocated)`}
      style={{
        position: 'relative',
        width: `${size}px`,
        height: `${size}px`,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}
    >
      <svg width={size} height={size} viewBox="0 0 64 64" style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor={isHighLoad ? '#ff8b00' : '#7c3aed'} />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="var(--ink-100)"
          strokeWidth={strokeWidth}
        />
        {/* Dynamic Arc */}
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      {/* Center Percentage */}
      <span style={{
        position: 'absolute',
        fontSize: '0.75rem',
        fontWeight: 700,
        color: isHighLoad ? 'var(--warning-600)' : 'var(--ink-900)',
        fontFamily: 'var(--font-mono)'
      }}>
        {pct}%
      </span>
    </div>
  );
}

export default function CapacityAnalytics({ token, userRole, userDept }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [expandedDeptId, setExpandedDeptId] = useState(null);

  const fetchCapacityData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/reports/capacity', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCapacityData();
  }, [token]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: 'var(--ink-400)', fontSize: '0.875rem' }}>
      Loading workload & capacity metrics...
    </div>
  );
  if (error) return (
    <div style={{ padding: '24px', background: 'var(--danger-50)', border: '1px solid var(--danger-600)', borderRadius: 'var(--radius-md)', color: 'var(--danger-600)', fontSize: '0.875rem' }}>
      Error: {error}
    </div>
  );

  const filteredDepts = data.filter(d => {
    if (userRole === 'TeamMember' && (!d.EmployeeBreakdown || d.EmployeeBreakdown.length === 0)) return false;
    if (selectedDeptFilter !== 'ALL' && d.DepartmentName !== selectedDeptFilter) return false;
    return true;
  });

  const totalCapacitySP = Math.round(filteredDepts.reduce((sum, d) => sum + d.TotalWeeklyCapacitySP, 0) * 10) / 10;
  const totalOccupiedSP = Math.round(filteredDepts.reduce((sum, d) => sum + d.OccupiedSP, 0) * 10) / 10;
  const totalFreeSP = Math.round((totalCapacitySP - totalOccupiedSP) * 10) / 10;
  const overallUtilizationPct = totalCapacitySP > 0 ? Math.min(100, Math.round((totalOccupiedSP / totalCapacitySP) * 100)) : 0;

  const metricCard = {
    padding: '18px 20px',
    borderRadius: 'var(--radius-md)',
    background: '#ffffff',
    border: '1px solid var(--ink-150)',
    boxShadow: 'var(--shadow-sm)',
    position: 'relative',
    overflow: 'hidden'
  };

  const sectionTitle = {
    fontSize: '0.9375rem',
    fontWeight: 700,
    color: 'var(--ink-900)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const thStyle = {
    padding: '10px 16px',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--ink-500)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    borderBottom: '1px solid var(--ink-150)',
    textAlign: 'left',
    background: 'var(--ink-100)'
  };

  const tdStyle = {
    padding: '12px 16px',
    fontSize: '0.8125rem',
    color: 'var(--ink-900)',
    borderBottom: '1px solid var(--ink-150)'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '30px' }}>

      {/* ——— Header ——— */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: 'var(--ink-900)', letterSpacing: '-0.01em' }}>
            Workload & Capacity Orchestration
          </h2>
          <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--ink-500)', fontWeight: 500 }}>
            {userRole === 'TeamMember' ? 'My Personal Workload & Capacity' : userRole === 'DeptAdmin' ? `Department view — ${userDept}` : 'Organization capacity overview'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {userRole === 'SuperAdmin' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              height: '32px',
              padding: '0 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--ink-200)',
              background: '#ffffff',
              fontSize: '0.8125rem'
            }}>
              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'var(--ink-900)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', outline: 'none' }}
              >
                <option value="ALL">All Departments</option>
                {data.map(d => (
                  <option key={d.DepartmentID} value={d.DepartmentName}>
                    {d.DepartmentName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={fetchCapacityData}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              height: '32px',
              padding: '0 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--ink-200)',
              background: '#ffffff',
              color: 'var(--ink-700)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.12s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--brand-600)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--ink-200)'}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--ink-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* ——— Top 4 Summary Metrics ——— */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        {/* Capacity */}
        <div style={metricCard}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
            Weekly Capacity
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--ink-900)', fontFamily: 'var(--font-mono)' }}>
            {totalCapacitySP}
            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--ink-500)', marginLeft: '4px' }}>SP</span>
          </div>
        </div>

        {/* Occupied */}
        <div style={metricCard}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
            Allocated Workload
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--danger-600)', fontFamily: 'var(--font-mono)' }}>
            {totalOccupiedSP}
            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--ink-500)', marginLeft: '4px' }}>SP</span>
          </div>
        </div>

        {/* Available */}
        <div style={metricCard}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
            Available Bandwidth
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--success-600)', fontFamily: 'var(--font-mono)' }}>
            {totalFreeSP}
            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--ink-500)', marginLeft: '4px' }}>SP</span>
          </div>
        </div>

        {/* Utilization with Capacity Pulse Ring */}
        <div style={{ ...metricCard, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
              Overall Load
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--ink-900)', fontFamily: 'var(--font-mono)' }}>
              {overallUtilizationPct}%
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--ink-500)', marginTop: '2px' }}>
              {overallUtilizationPct > 80 ? 'Heavy Load' : 'Normal Load'}
            </div>
          </div>
          <CapacityPulseRing pct={overallUtilizationPct} size={64} />
        </div>
      </div>

      {/* ——— Department Cards with Capacity Pulse Rings ——— */}
      <div>
        <div style={sectionTitle}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--ink-900)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Department Load & Capacity Pulse
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filteredDepts.map(d => {
          const pct = d.UtilizationPct || 0;
          const isExpanded = expandedDeptId === d.DepartmentID;

          return (
            <div key={d.DepartmentID} style={{
              borderRadius: 'var(--radius-md)',
              background: '#ffffff',
              border: isExpanded ? '1.5px solid var(--brand-600)' : '1px solid var(--ink-150)',
              boxShadow: isExpanded ? 'var(--shadow-md)' : 'var(--shadow-sm)',
              overflow: 'hidden',
              transition: 'all 0.15s ease'
            }}>
              {/* ── Card Header Row ── */}
              <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                {/* Left: Dept Name + Meta */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink-900)' }}>{d.DepartmentName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ink-500)', marginTop: '2px' }}>
                    {d.MemberCount} members · 1 SP = {d.MinutesPerStoryPoint}m
                  </div>
                </div>

                {/* Center: Stats Row */}
                <div style={{ display: 'flex', gap: '24px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.625rem', color: 'var(--ink-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Capacity</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink-900)', fontFamily: 'var(--font-mono)' }}>{d.TotalWeeklyCapacitySP}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.625rem', color: 'var(--ink-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Allocated</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--danger-600)', fontFamily: 'var(--font-mono)' }}>{d.OccupiedSP}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.625rem', color: 'var(--ink-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Available</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--success-600)', fontFamily: 'var(--font-mono)' }}>{d.FreeSP}</div>
                  </div>
                </div>

                {/* Right: Pulse Ring + Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <CapacityPulseRing pct={pct} size={52} onClick={() => setExpandedDeptId(isExpanded ? null : d.DepartmentID)} />
                  <button
                    type="button"
                    onClick={() => setExpandedDeptId(isExpanded ? null : d.DepartmentID)}
                    style={{
                      background: isExpanded ? 'var(--brand-50)' : '#ffffff',
                      border: '1px solid var(--ink-200)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '6px 12px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: isExpanded ? 'var(--brand-600)' : 'var(--ink-700)',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.12s ease'
                    }}
                    onMouseEnter={e => { if (!isExpanded) { e.currentTarget.style.background = 'var(--brand-50)'; e.currentTarget.style.color = 'var(--brand-600)'; e.currentTarget.style.borderColor = 'var(--brand-200)'; } }}
                    onMouseLeave={e => { if (!isExpanded) { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = 'var(--ink-700)'; e.currentTarget.style.borderColor = 'var(--ink-200)'; } }}
                  >
                    {isExpanded ? 'Collapse ▲' : 'View Team ▼'}
                  </button>
                </div>
              </div>

              {/* ── Inline Employee Breakdown (shown when expanded) ── */}
              {isExpanded && (
                <div style={{ borderTop: '1px solid var(--ink-150)', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                    <thead>
                      <tr>
                        <th style={{ ...thStyle, width: '28%' }}>Member</th>
                        <th style={{ ...thStyle, width: '12%' }}>Role</th>
                        <th style={{ ...thStyle, width: '12%', textAlign: 'center' }}>Tasks</th>
                        <th style={{ ...thStyle, width: '14%', textAlign: 'center' }}>Capacity</th>
                        <th style={{ ...thStyle, width: '12%', textAlign: 'center' }}>Allocated</th>
                        <th style={{ ...thStyle, width: '10%', textAlign: 'center' }}>Available</th>
                        <th style={{ ...thStyle, width: '12%', textAlign: 'right', paddingRight: '20px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.EmployeeBreakdown && d.EmployeeBreakdown.length > 0 ? (
                        d.EmployeeBreakdown.map(emp => {
                          const statusColors = {
                            Overloaded: { bg: 'var(--danger-50)', text: 'var(--danger-600)' },
                            'High Load': { bg: 'var(--warning-50)', text: 'var(--warning-600)' },
                            Underutilized: { bg: 'var(--ink-100)', text: 'var(--ink-500)' }
                          };
                          const sc = statusColors[emp.LoadStatus] || { bg: 'var(--success-50)', text: 'var(--success-600)' };

                          return (
                            <tr
                              key={emp.UserID}
                              onMouseEnter={e => e.currentTarget.style.background = 'var(--brand-50)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                              style={{ transition: 'background 0.1s ease' }}
                            >
                              <td style={{ ...tdStyle, fontWeight: 600 }}>
                                <div>{emp.FullName || emp.Email}</div>
                                <div style={{ fontSize: '0.6875rem', color: 'var(--ink-400)', fontWeight: 400, marginTop: '1px' }}>{emp.Email}</div>
                              </td>
                              <td style={tdStyle}>
                                <span style={{
                                  fontSize: '0.6875rem', fontWeight: 600,
                                  padding: '2px 6px', borderRadius: 'var(--radius-xs)',
                                  background: 'var(--ink-100)', color: 'var(--ink-700)'
                                }}>
                                  {emp.Role}
                                </span>
                              </td>
                              <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{emp.ActiveTaskCount}</td>
                              <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{emp.WeeklyCapacitySP} SP</td>
                              <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, color: emp.OccupiedSP > 0 ? 'var(--danger-600)' : 'var(--ink-400)', fontFamily: 'var(--font-mono)' }}>
                                {emp.OccupiedSP}
                              </td>
                              <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, color: emp.FreeSP > 0 ? 'var(--success-600)' : 'var(--danger-600)', fontFamily: 'var(--font-mono)' }}>
                                {emp.FreeSP}
                              </td>
                              <td style={{ ...tdStyle, textAlign: 'right', paddingRight: '20px' }}>
                                <span style={{
                                  fontSize: '0.6875rem', fontWeight: 600,
                                  padding: '3px 8px', borderRadius: 'var(--radius-xs)',
                                  background: sc.bg, color: sc.text
                                }}>
                                  {emp.LoadStatus}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--ink-400)', fontSize: '0.8125rem' }}>
                            No members assigned to this department.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
