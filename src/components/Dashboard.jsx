import React, { useState, useEffect } from 'react';
import axios from 'axios';

/* ——— Shared input style ——— */
const inputStyle = {
  width: '100%',
  padding: '8px 10px',
  border: '1px solid #dfe1e6',
  borderRadius: '4px',
  fontSize: '0.875rem',
  fontFamily: 'Inter, sans-serif',
  color: '#172b4d',
  outline: 'none',
  background: '#ffffff',
  transition: 'border-color 0.15s ease'
};

const labelStyle = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: '#5e6c84',
  marginBottom: '4px',
  letterSpacing: '0.02em'
};

export default function Dashboard({ selectedDepartment, selectedBusiness, token, user, onViewTask }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const UNIVERSAL_GOOGLE_CALENDAR_URL = 'https://calendar.google.com/calendar/embed?src=taskmanagement907%40gmail.com&ctz=Asia%2FKolkata';

  // Meetings & Calendar State
  const [meetings, setMeetings] = useState([]);
  const storedUrl = user?.google_calendar_url || user?.googleCalendarUrl || localStorage.getItem('googleCalendarUrl') || UNIVERSAL_GOOGLE_CALENDAR_URL;
  const [googleCalendarUrl, setGoogleCalendarUrl] = useState(storedUrl);
  const [calendarTab, setCalendarTab] = useState('google');

  useEffect(() => {
    const activeUrl = user?.google_calendar_url || user?.googleCalendarUrl || localStorage.getItem('googleCalendarUrl') || UNIVERSAL_GOOGLE_CALENDAR_URL;
    setGoogleCalendarUrl(activeUrl);
    setCalendarTab('google');
  }, [user]);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingStartTime, setMeetingStartTime] = useState('10:00');
  const [meetingEndTime, setMeetingEndTime] = useState('11:00');
  const [meetingAttendees, setMeetingAttendees] = useState('');
  const [meetingLocationLink, setMeetingLocationLink] = useState('');
  const [meetingMeetLink, setMeetingMeetLink] = useState('');
  const [meetingRelatedTo, setMeetingRelatedTo] = useState('');
  const [meetingNotes, setMeetingNotes] = useState('');
  const [scheduling, setScheduling] = useState(false);

  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [showConfigCalendarModal, setShowConfigCalendarModal] = useState(false);
  const [tempGoogleUrlInput, setTempGoogleUrlInput] = useState(googleCalendarUrl);
  const [selectedDayMeetingsModal, setSelectedDayMeetingsModal] = useState(null);

  // Collapsible Calendar State (Collapsed by default, saved in localStorage)
  const [isCalendarCollapsed, setIsCalendarCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('dashboard_calendar_collapsed');
      return saved !== null ? saved === 'true' : true;
    } catch (e) {
      return true;
    }
  });

  const toggleCalendarCollapse = () => {
    setIsCalendarCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('dashboard_calendar_collapsed', String(next)); } catch (e) {}
      return next;
    });
  };

  const handlePrevMonth = () => setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 1));

  const openScheduleMeetingModal = (targetDate = null) => {
    let dObj = targetDate ? new Date(targetDate) : new Date();
    const yearStr = dObj.getFullYear();
    const monthStr = String(dObj.getMonth() + 1).padStart(2, '0');
    const dayStr = String(dObj.getDate()).padStart(2, '0');
    setMeetingTitle('');
    setMeetingDate(`${yearStr}-${monthStr}-${dayStr}`);
    setMeetingStartTime('10:00');
    setMeetingEndTime('11:00');
    setMeetingLocationLink('');
    setMeetingMeetLink('');
    setMeetingRelatedTo(selectedBusiness || '');
    setMeetingAttendees('');
    setMeetingNotes('');
    setShowMeetingModal(true);
  };

  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  const monthName = currentCalendarDate.toLocaleString('default', { month: 'long' });

  useEffect(() => {
    fetchDashboard();
    fetchMeetings();
  }, [selectedDepartment, selectedBusiness]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/departments/dashboard?departmentId=${selectedDepartment || 'ALL'}&businessEntity=${encodeURIComponent(selectedBusiness || '')}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) setDashboardData(res.data.data);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const userFirstBiz = user?.business_entities ? user.business_entities.split(',')[0].trim() : '';

  const fetchMeetings = async () => {
    try {
      const bizParam = selectedBusiness || userFirstBiz || '';
      const res = await axios.get(`/api/meetings?department=${selectedDepartment || 'ALL'}&businessEntity=${encodeURIComponent(bizParam || 'ALL')}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) setMeetings(res.data.data || []);
    } catch (err) {
      console.error('Error fetching meetings:', err);
    }
  };

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    setScheduling(true);
    try {
      const res = await axios.post('/api/meetings', {
        title: meetingTitle, date: meetingDate, startTime: meetingStartTime, endTime: meetingEndTime,
        attendees: meetingAttendees, locationLink: meetingLocationLink, meetLink: meetingMeetLink,
        relatedTo: meetingRelatedTo, notes: meetingNotes,
        department: selectedDepartment || 'Operations',
        businessEntity: selectedBusiness || userFirstBiz || ''
      }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        setShowMeetingModal(false);
        setCalendarTab('app');
        fetchMeetings();
      }
    } catch (err) {
      alert('Error scheduling meeting: ' + (err.response?.data?.error || err.message));
    } finally {
      setScheduling(false);
    }
  };

  const handleDeleteMeeting = async (id) => {
    if (!window.confirm('Delete this meeting?')) return;
    try {
      const res = await axios.delete(`/api/meetings/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) fetchMeetings();
    } catch (err) {
      alert('Error deleting meeting: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: '#97a0af', fontSize: '0.875rem', gap: '8px' }}>
        <div style={{ width: '16px', height: '16px', border: '2px solid #e4e7eb', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        Loading dashboard...
      </div>
    );
  }

  const stats = dashboardData?.stats || { totalTasks: 0, unassignedCount: 0, myTaskCount: 0, completedTasks: 0, overdue: 0, memberCount: 0 };
  const deptName = dashboardData?.department?.Name || selectedBusiness || 'All';
  const myTasks = dashboardData?.myTasks || [];
  const unassignedTasks = dashboardData?.unassignedTasks || [];

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const priorityColor = (p) => ({ Urgent: '#de350b', High: '#ff8b00', Medium: '#2563eb', Low: '#5e6c84' }[p] || '#5e6c84');
  const priorityBg = (p) => ({ Urgent: '#ffebe6', High: '#fff3cd', Medium: '#eff6ff', Low: '#f4f5f7' }[p] || '#f4f5f7');

  const statusStyle = (s) => {
    const map = {
      'Not Started': { bg: '#f4f5f7', text: '#5e6c84' },
      'In Progress': { bg: '#e3f2fd', text: '#1565c0' },
      'In Review': { bg: '#fff3cd', text: '#b45309' },
      'Completed': { bg: '#e3fcef', text: '#00875a' },
      'Stuck / Blocked': { bg: '#ffebe6', text: '#de350b' }
    };
    return map[s] || { bg: '#f4f5f7', text: '#5e6c84' };
  };

  const kpis = [
    { label: 'Total Tasks', value: stats.totalTasks, color: '#2563eb', bg: '#eff6ff' },
    { label: 'Unassigned', value: stats.unassignedCount, color: '#ff8b00', bg: '#fff3cd' },
    { label: 'My Tasks', value: stats.myTaskCount, color: '#5e6c84', bg: '#f4f5f7' },
    { label: 'Overdue', value: stats.overdue, color: '#de350b', bg: '#ffebe6' },
    { label: 'Completed', value: stats.completedTasks, color: '#00875a', bg: '#e3fcef' },
    { label: 'Members', value: stats.memberCount, color: '#6366f1', bg: '#ede9fe' }
  ];

  /* ——— shared panel header style ——— */
  const panelHeader = {
    padding: '12px 16px',
    borderBottom: '1px solid #f4f5f7',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#ffffff'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ——— Dark Navy Header Banner ——— */}
      <div style={{
        borderRadius: '8px',
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
            Owner Dashboard
          </div>
          <h2 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
            {selectedBusiness || deptName || 'Workspace'}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
            Updated {dateStr}
          </p>
        </div>
        <button
          onClick={fetchDashboard}
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '6px 12px', borderRadius: '4px',
            border: '1px solid #334155', background: 'transparent',
            color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.15s ease'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.color = '#ffffff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          Refresh
        </button>
      </div>

      {/* ——— KPI Metrics Strip ——— */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: '12px'
      }}>
        {kpis.map((k, i) => (
          <div key={i} className="card" style={{
            padding: '14px 16px',
            borderRadius: 'var(--radius-md)',
            background: '#ffffff',
            border: '1px solid var(--ink-150)',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {k.label}
              </div>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: i === 0 ? 'var(--gradient-brand)' : k.color
              }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink-900)', lineHeight: 1, fontFamily: 'var(--font-mono)' }}>{k.value}</span>
            </div>
            <div style={{ height: '3px', borderRadius: '3px', background: k.bg, marginTop: '10px', overflow: 'hidden' }}>
              <div style={{ height: '3px', borderRadius: '3px', background: i === 0 ? 'var(--gradient-brand)' : k.color, width: k.value > 0 ? '100%' : '0%', transition: 'width 0.5s ease' }} />
            </div>
          </div>
        ))}
      </div>

      {/* ——— Two Column: Tasks ——— */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>

        {/* Unassigned Queue */}
        <div style={{ background: '#ffffff', border: '1px solid #e4e7eb', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={panelHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ff8b00', flexShrink: 0 }} />
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#172b4d' }}>Unassigned Queue</span>
            </div>
            <span style={{
              fontSize: '0.6875rem', fontWeight: 700,
              padding: '2px 8px', borderRadius: '10px',
              background: unassignedTasks.length > 0 ? '#fff3cd' : '#e3fcef',
              color: unassignedTasks.length > 0 ? '#b45309' : '#00875a'
            }}>
              {unassignedTasks.length}
            </span>
          </div>
          <div style={{ padding: '6px', maxHeight: '320px', overflowY: 'auto' }}>
            {unassignedTasks.length > 0 ? unassignedTasks.map(t => (
              <div
                key={t.TaskID}
                style={{
                  padding: '8px 12px', borderRadius: '4px', border: '1px solid #f4f5f7',
                  marginBottom: '4px', display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', gap: '10px', background: '#ffffff',
                  cursor: 'pointer', transition: 'border-color 0.12s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#c1c7d0'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#f4f5f7'}
                onClick={() => onViewTask(t.TaskID)}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#172b4d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.Title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#97a0af', marginTop: '2px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span>{t.Department}</span>
                    <span>·</span>
                    <span style={{
                      fontSize: '0.6875rem', fontWeight: 600,
                      padding: '1px 5px', borderRadius: '2px',
                      background: priorityBg(t.Priority), color: priorityColor(t.Priority)
                    }}>{t.Priority}</span>
                  </div>
                </div>
                <button
                  style={{
                    fontSize: '0.75rem', fontWeight: 600, padding: '3px 10px', borderRadius: '3px',
                    border: '1px solid #e4e7eb', background: '#ffffff', color: '#2563eb',
                    cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.12s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#bfdbfe'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#e4e7eb'; }}
                  onClick={(e) => { e.stopPropagation(); onViewTask(t.TaskID); }}
                >
                  Assign →
                </button>
              </div>
            )) : (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#97a0af', fontSize: '0.8125rem' }}>
                <div style={{ marginBottom: '4px' }}>✓</div>
                All tasks are assigned
              </div>
            )}
          </div>
        </div>

        {/* My Tasks */}
        <div style={{ background: '#ffffff', border: '1px solid #e4e7eb', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={panelHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              </svg>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#172b4d' }}>My Tasks</span>
            </div>
            <span style={{
              fontSize: '0.6875rem', fontWeight: 700, padding: '2px 8px', borderRadius: '10px',
              background: myTasks.length > 0 ? '#eff6ff' : '#e3fcef',
              color: myTasks.length > 0 ? '#2563eb' : '#00875a'
            }}>
              {myTasks.length}
            </span>
          </div>
          <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
            {myTasks.length > 0 ? myTasks.map(t => {
              const ss = statusStyle(t.Status);
              return (
                <div
                  key={t.TaskID}
                  onClick={() => onViewTask(t.TaskID)}
                  style={{
                    padding: '9px 16px', cursor: 'pointer', display: 'flex',
                    justifyContent: 'space-between', alignItems: 'center', gap: '10px',
                    borderBottom: '1px solid #f4f5f7', transition: 'background 0.1s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8f9fa'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#172b4d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.Title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#97a0af', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontSize: '0.6875rem', fontWeight: 600, padding: '1px 5px', borderRadius: '2px',
                        background: ss.bg, color: ss.text
                      }}>
                        {t.Status}
                      </span>
                      {t.DueDate && <><span>·</span><span>Due {t.DueDate}</span></>}
                    </div>
                  </div>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#c1c7d0" strokeWidth="2" strokeLinecap="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              );
            }) : (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#97a0af', fontSize: '0.8125rem' }}>
                <div style={{ marginBottom: '4px' }}>✓</div>
                No tasks assigned to you
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ——— Calendar Section (Collapsible with Today/Upcoming Summary & Full Month Toggle) ——— */}
      {(() => {
        const userRole = user?.role || '';
        const userDeptLower = String(user?.department || '').trim().toLowerCase();
        const isAdmin = ['SuperAdmin', 'Founder', 'Admin'].includes(userRole);
        const isHR = userRole.toLowerCase().includes('hr') || userDeptLower.includes('hr') || userDeptLower.includes('human resource');
        const canSeeCalendar = isAdmin || isHR;

        if (!canSeeCalendar) return null;

        // Parse Today and Upcoming Meetings
        const todayObj = new Date();
        const todayDateStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;

        const isSameDay = (mDate, targetDateStr) => {
          if (!mDate) return false;
          const raw = String(mDate).split('T')[0].trim();
          if (raw === targetDateStr) return true;
          const parts = raw.split(/[-/]/);
          if (parts.length === 3) {
            const [y, m, d] = targetDateStr.split('-');
            return parseInt(parts[0], 10) === parseInt(y, 10) &&
                   parseInt(parts[1], 10) === parseInt(m, 10) &&
                   parseInt(parts[2], 10) === parseInt(d, 10);
          }
          return false;
        };

        const todayMeetings = meetings.filter(m => isSameDay(m.date || m.start_time, todayDateStr));
        const upcomingMeetings = meetings.filter(m => {
          const raw = m.date ? String(m.date).split('T')[0] : (m.start_time ? String(m.start_time).split('T')[0] : '');
          return raw >= todayDateStr;
        }).sort((a, b) => {
          const da = a.date || a.start_time || '';
          const db = b.date || b.start_time || '';
          return da.localeCompare(db);
        });

        return (
          <div style={{
            background: '#ffffff',
            border: '1px solid #e4e7eb',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            {/* Calendar Section Header */}
            <div style={{
              padding: '12px 16px',
              borderBottom: isCalendarCollapsed && upcomingMeetings.length === 0 ? 'none' : '1px solid #f4f5f7',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
              background: '#ffffff'
            }}>
              {/* Left Title & Status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#172b4d', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📅</span>
                  <span>Calendar</span>
                </span>
                <span style={{
                  fontSize: '0.6875rem', fontWeight: 600, padding: '2px 8px', borderRadius: '12px',
                  background: todayMeetings.length > 0 ? '#eff6ff' : '#f1f5f9',
                  color: todayMeetings.length > 0 ? '#1d4ed8' : '#64748b'
                }}>
                  {todayMeetings.length > 0 ? `${todayMeetings.length} today` : 'No meetings today'}
                </span>
                {upcomingMeetings.length > 0 && isCalendarCollapsed && (
                  <span style={{ fontSize: '0.6875rem', color: '#97a0af' }}>
                    • {upcomingMeetings.length} upcoming
                  </span>
                )}
              </div>

              {/* Center Month Navigator (Visible only when Expanded) */}
              {!isCalendarCollapsed && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button type="button" onClick={handlePrevMonth} style={{
                    width: '26px', height: '26px', borderRadius: '4px', border: '1px solid #e4e7eb',
                    background: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5e6c84', fontSize: '0.875rem'
                  }}>‹</button>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#172b4d', minWidth: '120px', textAlign: 'center' }}>
                    {monthName} {year}
                  </span>
                  <button type="button" onClick={handleNextMonth} style={{
                    width: '26px', height: '26px', borderRadius: '4px', border: '1px solid #e4e7eb',
                    background: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5e6c84', fontSize: '0.875rem'
                  }}>›</button>
                </div>
              )}

              {/* Right Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => openScheduleMeetingModal()}
                  style={{
                    padding: '5px 12px', borderRadius: '5px', background: '#ffffff', border: '1px solid #dfe1e6',
                    color: '#172b4d', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f4f5f7'}
                  onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                >
                  + Schedule Meeting
                </button>

                {/* Collapsible View Toggle Button */}
                <button
                  type="button"
                  onClick={toggleCalendarCollapse}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '5px',
                    background: isCalendarCollapsed ? '#eff6ff' : '#ffffff',
                    border: isCalendarCollapsed ? '1px solid #bfdbfe' : '1px solid #dfe1e6',
                    color: isCalendarCollapsed ? '#2563eb' : '#475569',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.12s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = isCalendarCollapsed ? '#dbeafe' : '#f4f5f7';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = isCalendarCollapsed ? '#eff6ff' : '#ffffff';
                  }}
                >
                  {isCalendarCollapsed ? '📅 Expand Full Calendar ▾' : '▲ Collapse to Summary'}
                </button>
              </div>
            </div>

            {/* ——— COLLAPSED VIEW: Today & Upcoming Meetings Summary ——— */}
            {isCalendarCollapsed ? (
              <div style={{ padding: '14px 16px', background: '#fafbfc' }}>
                {upcomingMeetings.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '16px 0', color: '#97a0af', fontSize: '0.8125rem' }}>
                    <span>✨ No meetings scheduled for today or upcoming days. </span>
                    <button
                      type="button"
                      onClick={() => openScheduleMeetingModal()}
                      style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                    >
                      Schedule a meeting
                    </button>
                    <span> or click </span>
                    <button
                      type="button"
                      onClick={toggleCalendarCollapse}
                      style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                    >
                      Expand Full Calendar
                    </button>
                    <span> to see the monthly view.</span>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
                      {upcomingMeetings.slice(0, 4).map(m => {
                        const mDateRaw = m.date ? String(m.date).split('T')[0] : (m.start_time ? String(m.start_time).split('T')[0] : '');
                        const isToday = isSameDay(mDateRaw, todayDateStr);
                        const displayTime = m.start_time && !m.start_time.includes('T') ? m.start_time : (m.start_time ? new Date(m.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '10:00');
                        const dateLabel = isToday ? 'Today' : new Date(mDateRaw).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                        return (
                          <div
                            key={m.meeting_id || m.id}
                            onClick={() => {
                              setSelectedDayMeetingsModal({
                                dateStr: mDateRaw,
                                displayDate: new Date(mDateRaw).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
                                meetings: [m]
                              });
                            }}
                            style={{
                              background: '#ffffff',
                              border: isToday ? '1px solid #bfdbfe' : '1px solid #e4e7eb',
                              borderLeft: isToday ? '3px solid #2563eb' : '3px solid #8b5cf6',
                              borderRadius: '6px',
                              padding: '10px 12px',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                              transition: 'transform 0.1s ease, box-shadow 0.1s ease'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = '0 3px 8px rgba(0,0,0,0.08)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.03)';
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{
                                fontSize: '0.6875rem', fontWeight: 700,
                                color: isToday ? '#1d4ed8' : '#6d28d9',
                                background: isToday ? '#eff6ff' : '#f5f3ff',
                                padding: '1px 6px', borderRadius: '4px'
                              }}>
                                {dateLabel} • {displayTime}
                              </span>
                              {m.meet_link && (
                                <a
                                  href={m.meet_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  style={{ fontSize: '0.6875rem', color: '#16a34a', fontWeight: 600, textDecoration: 'none' }}
                                >
                                  🎥 Join
                                </a>
                              )}
                            </div>
                            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#172b4d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {m.title}
                            </div>
                            {m.attendees && (
                              <div style={{ fontSize: '0.6875rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                👥 {m.attendees}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ——— EXPANDED VIEW: Full Monthly Calendar Grid ——— */
              <div style={{ padding: '16px' }}>
                <div>
                  {/* Day headers */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '4px' }}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} style={{ textAlign: 'center', fontSize: '0.6875rem', fontWeight: 600, color: '#97a0af', padding: '6px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Day cells */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', border: '1px solid #e4e7eb', borderRight: 'none', borderBottom: 'none' }}>
                    {(() => {
                      const firstDayIndex = new Date(year, month, 1).getDay();
                      const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
                      const prevMonthTotalDays = new Date(year, month, 0).getDate();
                      const cells = [];

                      for (let i = firstDayIndex - 1; i >= 0; i--) cells.push({ day: prevMonthTotalDays - i, isCurrent: false });
                      for (let d = 1; d <= totalDaysInMonth; d++) cells.push({ day: d, isCurrent: true });
                      const remaining = (7 - (cells.length % 7)) % 7;
                      for (let i = 1; i <= remaining; i++) cells.push({ day: i, isCurrent: false });

                      const todayObj = new Date();

                      return cells.map((cell, idx) => {
                        const isTodayCell = cell.isCurrent && cell.day === todayObj.getDate() && month === todayObj.getMonth() && year === todayObj.getFullYear();

                        const dayMeetings = cell.isCurrent ? meetings.filter(m => {
                          if (!m) return false;
                          const targetDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;

                          if (m.date) {
                            const rawDateStr = String(m.date).split('T')[0].trim();
                            if (rawDateStr === targetDateStr) return true;
                            const dateParts = rawDateStr.split(/[-/]/);
                            if (dateParts.length === 3) {
                              const pY = parseInt(dateParts[0], 10);
                              const pM = parseInt(dateParts[1], 10);
                              const pD = parseInt(dateParts[2], 10);
                              if (pY === year && pM === (month + 1) && pD === cell.day) return true;
                            }
                          }

                          if (m.start_time && m.start_time.length > 8) {
                            const rawStartStr = String(m.start_time).split('T')[0].trim();
                            if (rawStartStr === targetDateStr) return true;
                            const startParts = rawStartStr.split(/[-/]/);
                            if (startParts.length === 3) {
                              const sY = parseInt(startParts[0], 10);
                              const sM = parseInt(startParts[1], 10);
                              const sD = parseInt(startParts[2], 10);
                              if (sY === year && sM === (month + 1) && sD === cell.day) return true;
                            }
                          }

                          return false;
                        }) : [];

                        return (
                          <div
                            key={idx}
                            onClick={() => {
                              if (!cell.isCurrent) return;
                              if (dayMeetings.length > 0) {
                                setSelectedDayMeetingsModal({
                                  dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`,
                                  displayDate: new Date(year, month, cell.day).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
                                  meetings: dayMeetings
                                });
                              } else {
                                openScheduleMeetingModal(new Date(year, month, cell.day));
                              }
                            }}
                            style={{
                              minHeight: '80px',
                              padding: '6px 8px',
                              borderRight: '1px solid #e4e7eb',
                              borderBottom: '1px solid #e4e7eb',
                              background: isTodayCell ? '#f8f9ff' : cell.isCurrent ? '#ffffff' : '#fafbfc',
                              cursor: cell.isCurrent ? 'pointer' : 'default',
                              outline: isTodayCell ? '2px solid #172b4d' : 'none',
                              outlineOffset: '-2px',
                              transition: 'background 0.1s ease',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '3px'
                            }}
                            onMouseEnter={e => { if (cell.isCurrent && !isTodayCell) e.currentTarget.style.background = '#f8f9fa'; }}
                            onMouseLeave={e => { if (cell.isCurrent && !isTodayCell) e.currentTarget.style.background = '#ffffff'; }}
                          >
                            <span style={{
                              fontSize: '0.8125rem',
                              fontWeight: isTodayCell ? 700 : 400,
                              color: cell.isCurrent ? (isTodayCell ? '#172b4d' : '#172b4d') : '#c1c7d0',
                              lineHeight: 1
                            }}>
                              {cell.day}
                            </span>
                            {dayMeetings.map(m => {
                              const displayTime = m.start_time && !m.start_time.includes('T') ? m.start_time : (m.start_time ? new Date(m.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '10:00');
                              return (
                                <div
                                  key={m.meeting_id || m.id}
                                  title={`${displayTime} ${m.title}`}
                                  style={{
                                    background: '#eff6ff', color: '#1d4ed8',
                                    borderRadius: '2px', padding: '1px 4px',
                                    fontSize: '0.6875rem', fontWeight: 500,
                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                    cursor: 'pointer'
                                  }}
                                  onClick={e => {
                                    e.stopPropagation();
                                    setSelectedDayMeetingsModal({
                                      dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`,
                                      displayDate: new Date(year, month, cell.day).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
                                      meetings: [m]
                                    });
                                  }}
                                >
                                  {displayTime} {m.title}
                                </div>
                              );
                            })}
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {/* Legend */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px', fontSize: '0.75rem', color: '#5e6c84' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <div style={{ width: '10px', height: '6px', borderRadius: '2px', background: '#eff6ff', border: '1px solid #bfdbfe' }} />
                      <span>Meeting</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <div style={{ width: '10px', height: '10px', border: '2px solid #172b4d', borderRadius: '2px' }} />
                      <span>Today</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}



      {/* ——— MODAL: View Meeting Details ——— */}
      {selectedDayMeetingsModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(9,30,66,0.54)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '8px', width: '100%', maxWidth: '520px', padding: '0', boxShadow: '0 8px 24px rgba(9,30,66,0.14)', maxHeight: '90vh', overflowY: 'auto', animation: 'modalIn 0.18s ease' }}>

            {/* Modal Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f4f5f7', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ffffff', background: '#1e293b', padding: '3px 8px', borderRadius: '3px' }}>📅</span>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0, color: '#172b4d' }}>
                    Meetings on {selectedDayMeetingsModal.displayDate}
                  </h3>
                </div>
                <p style={{ margin: '3px 0 0 36px', fontSize: '0.75rem', color: '#97a0af' }}>
                  {selectedDayMeetingsModal.meetings.length} scheduled event(s)
                </p>
              </div>
              <button type="button" onClick={() => setSelectedDayMeetingsModal(null)} style={{ background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: '#97a0af', lineHeight: 1, marginTop: '2px' }}>✕</button>
            </div>

            {/* Meeting Cards */}
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {selectedDayMeetingsModal.meetings.map(m => {
                const rawLink = (m.meet_link || '').trim();
                const rawLoc = (m.location_link || '').trim();
                let videoUrl = '';
                if (rawLink) videoUrl = rawLink;
                else if (rawLoc.startsWith('http://') || rawLoc.startsWith('https://')) videoUrl = rawLoc;

                return (
                  <div key={m.meeting_id || m.id} style={{ border: '1px solid #e4e7eb', borderRadius: '6px', overflow: 'hidden' }}>
                    {/* Card Header */}
                    <div style={{ padding: '10px 14px', background: '#f8f9fa', borderBottom: '1px solid #e4e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '2px 6px', borderRadius: '3px' }}>
                          {m.meeting_id || 'MTG'}
                        </span>
                        <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#172b4d' }}>{m.title}</h4>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.75rem', color: '#5e6c84', fontWeight: 500 }}>
                          {m.start_time || '10:00'}{m.end_time ? ` – ${m.end_time}` : ''}
                        </span>
                        <button type="button" onClick={() => { handleDeleteMeeting(m.meeting_id || m.id); setSelectedDayMeetingsModal(null); }} style={{ background: 'none', border: 'none', color: '#de350b', cursor: 'pointer', fontSize: '0.875rem', padding: '2px' }} title="Delete">
                          🗑️
                        </button>
                      </div>
                    </div>

                    {/* Card Details */}
                    <div style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8125rem', marginBottom: m.notes ? '10px' : '0' }}>
                        {[
                          { label: 'Date', value: m.date || selectedDayMeetingsModal.displayDate },
                          { label: 'Related To', value: m.related_to || '—' },
                          { label: 'Attendees', value: m.attendees || '—' },
                          { label: 'Location', value: rawLoc || '—' }
                        ].map(({ label, value }) => (
                          <div key={label}>
                            <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#97a0af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>{label}</div>
                            <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#172b4d' }}>{value}</div>
                          </div>
                        ))}
                      </div>

                      {m.notes && (
                        <div style={{ padding: '8px 10px', background: '#f8f9fa', borderRadius: '4px', border: '1px solid #e4e7eb', fontSize: '0.8125rem', color: '#5e6c84', lineHeight: 1.5 }}>
                          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#97a0af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Notes</div>
                          {m.notes}
                        </div>
                      )}

                      {videoUrl && (
                        <button type="button" onClick={() => window.open(videoUrl.startsWith('http') ? videoUrl : `https://${videoUrl}`, '_blank')} style={{
                          marginTop: '10px', width: '100%', padding: '8px', borderRadius: '4px', background: '#00875a', color: '#ffffff',
                          fontSize: '0.8125rem', fontWeight: 600, border: 'none', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                        }}>
                          📹 Join Video Call / Meet
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid #f4f5f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button type="button" onClick={() => { const d = selectedDayMeetingsModal.dateStr; setSelectedDayMeetingsModal(null); openScheduleMeetingModal(new Date(d)); }} style={{
                padding: '7px 12px', borderRadius: '4px', border: '1px solid #e4e7eb', background: '#ffffff', color: '#2563eb', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer'
              }}>
                + Add Meeting
              </button>
              <button type="button" onClick={() => setSelectedDayMeetingsModal(null)} style={{
                padding: '7px 14px', borderRadius: '4px', border: 'none', background: '#172b4d', color: '#ffffff', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer'
              }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ——— MODAL: Schedule Meeting ——— */}
      {showMeetingModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(9,30,66,0.54)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '8px', width: '100%', maxWidth: '480px', boxShadow: '0 8px 24px rgba(9,30,66,0.14)', animation: 'modalIn 0.18s ease', overflow: 'hidden' }}>

            {/* Modal Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f4f5f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '4px', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem' }}>📅</div>
                <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: '#172b4d' }}>Schedule Admin Meeting</h3>
              </div>
              <button type="button" onClick={() => setShowMeetingModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: '#97a0af', lineHeight: 1 }}>✕</button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateMeeting} style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Meeting Title *</label>
                <input type="text" placeholder="e.g. Executive Strategy & Review Call" value={meetingTitle} onChange={e => setMeetingTitle(e.target.value)} required style={inputStyle} onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#dfe1e6'} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>Date *</label>
                  <input type="date" value={meetingDate} onChange={e => setMeetingDate(e.target.value)} required style={inputStyle} onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#dfe1e6'} />
                </div>
                <div>
                  <label style={labelStyle}>Start Time *</label>
                  <input type="time" value={meetingStartTime} onChange={e => setMeetingStartTime(e.target.value)} required style={inputStyle} onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#dfe1e6'} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>End Time (Optional)</label>
                <input type="time" value={meetingEndTime} onChange={e => setMeetingEndTime(e.target.value)} style={inputStyle} onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#dfe1e6'} />
              </div>

              <div>
                <label style={labelStyle}>Google Meet / Video Link (Optional)</label>
                <input type="text" placeholder="https://meet.google.com/new" value={meetingMeetLink} onChange={e => setMeetingMeetLink(e.target.value)} style={inputStyle} onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#dfe1e6'} />
              </div>

              <div>
                <label style={labelStyle}>Location (Optional)</label>
                <input type="text" placeholder="e.g. CCD, Beltola or Conference Room A" value={meetingLocationLink} onChange={e => setMeetingLocationLink(e.target.value)} style={inputStyle} onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#dfe1e6'} />
              </div>

              <div>
                <label style={labelStyle}>Attendees / Department (Optional)</label>
                <input type="text" placeholder="e.g. Rahul, Ankit, Tech Team" value={meetingAttendees} onChange={e => setMeetingAttendees(e.target.value)} style={inputStyle} onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#dfe1e6'} />
              </div>

              <div>
                <label style={labelStyle}>Agenda / Description (Optional)</label>
                <textarea rows="3" placeholder="Meeting agenda or notes..." value={meetingNotes} onChange={e => setMeetingNotes(e.target.value)} style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }} onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#dfe1e6'} />
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '4px' }}>
                <button type="button" onClick={() => setShowMeetingModal(false)} style={{ padding: '8px 14px', borderRadius: '4px', border: '1px solid #e4e7eb', background: '#ffffff', color: '#5e6c84', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={scheduling} style={{ padding: '8px 18px', borderRadius: '4px', border: 'none', background: '#2563eb', color: '#ffffff', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', opacity: scheduling ? 0.7 : 1 }}>
                  {scheduling ? 'Saving...' : '🚀 Save & Schedule Meeting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.97) translateY(6px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
