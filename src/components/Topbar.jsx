import React, { useState, useRef, useEffect } from 'react';

export default function Topbar({
  user,
  businesses = [],
  selectedBusiness,
  setSelectedBusiness,
  selectedDepartment,
  setSelectedDepartment,
  departments = [],
  onOpenNewTaskModal,
  onLogout
}) {
  const isAdminOrFounder = ['SuperAdmin', 'Founder', 'Admin', 'DeptAdmin'].includes(user?.role);
  const isSuperAdmin = ['SuperAdmin', 'Founder'].includes(user?.role);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const userBizStr = user?.business_entities || user?.BusinessEntities || '';
  const userAssignedBizs = userBizStr ? userBizStr.split(',').map(s => s.trim()).filter(Boolean) : [];

  const fetchedBizList = businesses.map(b => (typeof b === 'string' ? { name: b } : { name: b.name || b.Name })).filter(b => Boolean(b.name));
  const combinedList = [...fetchedBizList];
  userAssignedBizs.forEach(bName => {
    if (!combinedList.some(b => b.name === bName)) combinedList.push({ name: bName });
  });

  const userDeptStr = user?.department || '';
  const userAssignedDepts = userDeptStr ? userDeptStr.split(',').map(s => s.trim()).filter(Boolean) : [];

  // Filter departments to ONLY show departments belonging to the currently selected company/business
  const filteredDepartments = departments.filter(d => {
    if (!selectedBusiness || selectedBusiness === 'ALL' || selectedBusiness === '') return true;
    const bizStr = d.business_entities || d.BusinessEntities || d.businessEntities || '';
    if (!bizStr) return true;
    const bizs = bizStr.split(',').map(s => s.trim().toLowerCase());
    return bizs.includes(selectedBusiness.toLowerCase());
  });

  const initials = (user?.full_name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const pillStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    height: '30px',
    padding: '0 10px',
    borderRadius: '4px',
    border: '1px solid #e4e7eb',
    background: '#ffffff',
    fontSize: '0.8125rem',
    fontWeight: 500,
    color: '#172b4d',
    cursor: 'pointer',
    transition: 'border-color 0.15s ease'
  };

  const selectStyle = {
    background: 'transparent',
    border: 'none',
    color: '#172b4d',
    fontSize: '0.8125rem',
    fontWeight: 500,
    cursor: 'pointer',
    outline: 'none'
  };

  return (
    <header style={{
      height: '48px',
      background: '#ffffff',
      borderBottom: '1px solid #e4e7eb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      position: 'sticky',
      top: 0,
      zIndex: 90,
      flexShrink: 0
    }}>
      {/* LEFT: Context selectors */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {isSuperAdmin ? (
          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#172b4d', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '2px 6px', borderRadius: '3px', background: '#fff3cd', color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Admin</span>
            Master Control Panel
          </div>
        ) : (
          <>
            {/* Business Selector */}
            <div style={pillStyle}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#97a0af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
              <select value={selectedBusiness || ''} onChange={(e) => setSelectedBusiness(e.target.value)} style={selectStyle}>
                <option value="">All Entities</option>
                {combinedList.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
              </select>
            </div>

            {/* Department Selector (Filtered by Selected Company) */}
            {isAdminOrFounder || userAssignedDepts.length > 1 ? (
              <div style={pillStyle}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#97a0af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
                <select value={selectedDepartment || 'ALL'} onChange={(e) => setSelectedDepartment(e.target.value)} style={selectStyle}>
                  <option value="ALL">All Departments</option>
                  {filteredDepartments.map(d => {
                    const dName = d.Name || d.name || d;
                    return <option key={d.DepartmentID || dName} value={dName}>{dName}</option>;
                  })}
                </select>
              </div>
            ) : (
              <div style={{ ...pillStyle, cursor: 'default', color: '#5e6c84', background: '#f4f5f7', border: '1px solid #e4e7eb' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#97a0af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
                {userAssignedDepts[0] || (filteredDepartments.length > 0 ? (filteredDepartments[0]?.Name || filteredDepartments[0]?.name || filteredDepartments[0]) : 'No Department')}
              </div>
            )}
          </>
        )}
      </div>

      {/* RIGHT: Actions + Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {!isSuperAdmin && (
          <>
            <button
              onClick={onOpenNewTaskModal}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                height: '30px',
                padding: '0 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--brand-600)',
                color: '#ffffff',
                border: 'none',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.12s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--brand-700)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--brand-600)'}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New Task
            </button>
            <div style={{ width: '1px', height: '20px', background: 'var(--ink-150)' }} />
          </>
        )}

        {/* User Menu Dropdown */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 6px',
              borderRadius: 'var(--radius-sm)',
              transition: 'background 0.12s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--brand-50)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'var(--brand-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '0.6875rem',
              fontWeight: 700,
              flexShrink: 0,
              letterSpacing: '0.3px'
            }}>
              {initials}
            </div>
            <div style={{ textAlign: 'left', lineHeight: 1.25 }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ink-900)', whiteSpace: 'nowrap' }}>
                {user?.full_name || user?.email}
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--ink-400)', textTransform: 'capitalize' }}>
                {user?.role}
              </div>
            </div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--ink-400)" strokeWidth="2.5" strokeLinecap="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {showUserMenu && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 0,
              background: '#ffffff',
              border: '1px solid var(--ink-150)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              width: '200px',
              padding: '6px',
              zIndex: 1000,
              animation: 'fadeIn 0.15s ease-out'
            }}>
              <div style={{ padding: '10px 10px 8px', borderBottom: '1px solid var(--ink-100)', marginBottom: '4px' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ink-900)' }}>{user?.full_name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--ink-400)', marginTop: '1px' }}>{user?.email}</div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--ink-500)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ padding: '2px 6px', borderRadius: 'var(--radius-xs)', background: 'var(--brand-50)', color: 'var(--brand-600)', fontWeight: 600 }}>{user?.role}</span>
                  <span>·</span>
                  <span>{userAssignedDepts[0] || 'Operations'}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  onLogout();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  width: '100%',
                  padding: '8px 10px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: '#de350b',
                  transition: 'background 0.12s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#ffebe6'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#de350b" strokeWidth="2" strokeLinecap="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
