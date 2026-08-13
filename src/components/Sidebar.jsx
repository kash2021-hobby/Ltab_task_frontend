import React from 'react';

const icons = {
  dashboard: (color) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  kanban: (color) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="5" height="18" rx="1" />
      <rect x="10" y="3" width="5" height="12" rx="1" />
      <rect x="17" y="3" width="5" height="15" rx="1" />
    </svg>
  ),
  table: (color) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  ),
  reports: (color) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  capacity: (color) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
  users: (color) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  departments: (color) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  telegram: (color) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  projects: (color) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  ),
  superadmin: (color) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
  actionPlans: (color) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  mytasks: (color) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      <polyline points="16 11 18 13 22 9" />
    </svg>
  )
};

export default function Sidebar({ currentView, setCurrentView, user, selectedBusiness, onOpenAIChat, actionPlansEnabled = true }) {
  const isSuperAdmin = ['SuperAdmin', 'Founder'].includes(user?.role);
  const isCompanyAdmin = user?.role === 'Admin';
  const isEmployee = user?.role === 'TeamMember';

  const userBizStr = user?.business_entities || user?.BusinessEntities || '';
  const firstUserBiz = userBizStr.split(',')[0]?.trim();
  const displayCompanyName = isSuperAdmin
    ? 'SuperAdmin'
    : (selectedBusiness || firstUserBiz || (user?.full_name ? `${user.full_name.split(' ')[0]}'s Org` : 'Workspace'));
  const logoChar = isSuperAdmin ? '★' : (displayCompanyName.charAt(0).toUpperCase() || 'C');

  const superAdminNav = [
    { id: 'superadmin', label: 'Master Overview', iconKey: 'superadmin' },
    { id: 'superadmin-approvals', label: 'Pending Approvals', iconKey: 'users' },
    { id: 'superadmin-directory', label: 'Admin & Companies', iconKey: 'departments' }
  ];

  const mainNav = [
    { id: 'my-tasks', label: 'My Tasks', iconKey: 'mytasks' },
    { id: 'dashboard', label: 'Dashboard', iconKey: 'dashboard' },
    { id: 'projects', label: 'Projects', iconKey: 'projects' },
    ...(actionPlansEnabled ? [{ id: 'action-plans', label: 'Action Plans', iconKey: 'actionPlans' }] : []),
    { id: 'kanban', label: 'Board', iconKey: 'kanban' },
    { id: 'table', label: 'List', iconKey: 'table' },
    ...(!isEmployee ? [{ id: 'reports', label: 'Reports', iconKey: 'reports' }] : [])
  ];

  const NavItem = ({ id, label, iconKey, onClick }) => {
    const isActive = currentView === id || (id === 'superadmin' && currentView.startsWith('superadmin'));
    const color = isActive ? 'var(--brand-600)' : 'var(--ink-500)';

    return (
      <button
        onClick={onClick || (() => setCurrentView(id))}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          width: '100%',
          padding: '8px 12px',
          borderRadius: 'var(--radius-sm)',
          background: isActive ? 'var(--brand-50)' : 'transparent',
          color: color,
          fontWeight: isActive ? 600 : 400,
          fontSize: '0.8125rem',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'all 0.12s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          letterSpacing: '0'
        }}
        onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'var(--brand-50)'; e.currentTarget.style.color = 'var(--brand-600)'; } }}
        onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ink-500)'; } }}
      >
        {isActive && (
          <div style={{
            position: 'absolute',
            left: 0,
            top: '5px',
            bottom: '5px',
            width: '3px',
            borderRadius: '0 2px 2px 0',
            background: 'var(--brand-600)'
          }} />
        )}
        <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0, marginLeft: isActive ? '3px' : '0' }}>
          {icons[iconKey](color)}
        </span>
        {label}
      </button>
    );
  };

  const SectionLabel = ({ children }) => (
    <div style={{
      fontSize: '0.6875rem',
      fontWeight: 700,
      color: 'var(--ink-400)',
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      padding: '16px 12px 5px',
      userSelect: 'none'
    }}>
      {children}
    </div>
  );

  const userInitials = (user?.full_name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <aside style={{
      width: '220px',
      height: '100vh',
      position: 'sticky',
      top: 0,
      background: '#ffffff',
      borderRight: '1px solid var(--ink-150)',
      padding: '12px 10px',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
      zIndex: 100,
      flexShrink: 0
    }}>

      {/* ── Workspace Header Card ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        borderRadius: '10px',
        padding: '14px 14px 12px',
        marginBottom: '14px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: '-12px', right: '-12px', width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-16px', right: '18px', width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />

        {/* Logo + Name (Solid --brand-600 fill, NO gradient) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative', zIndex: 1 }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'var(--brand-600)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '1rem',
            flexShrink: 0,
            letterSpacing: '-0.5px',
            boxShadow: '0 2px 6px rgba(79, 70, 229, 0.35)'
          }}>
            {logoChar}
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2 }}>
              {displayCompanyName}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
              <span style={{ fontSize: '0.6875rem', color: '#94a3b8', fontWeight: 500 }}>
                {isSuperAdmin ? 'Master Control' : 'Workspace'}
              </span>
            </div>
          </div>
        </div>

        {/* Plan badge */}
        {!isSuperAdmin && (
          <div style={{ marginTop: '10px', padding: '5px 10px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
            <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>Plan</span>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#818cf8' }}>
              {user?.role === 'Admin' ? 'Business' : 'Team'}
            </span>
          </div>
        )}
      </div>

      {isSuperAdmin ? (
        <>
          <SectionLabel>Management</SectionLabel>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {superAdminNav.map(item => <NavItem key={item.id} {...item} />)}
          </nav>
        </>
      ) : (
        <>
          <SectionLabel>Main</SectionLabel>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {mainNav.map(item => <NavItem key={item.id} {...item} />)}
          </nav>

          <SectionLabel>Analytics</SectionLabel>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <NavItem id="capacity" label="Workload" iconKey="capacity" />
          </nav>

          {isCompanyAdmin && (
            <>
              <SectionLabel>Settings</SectionLabel>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <NavItem id="companies" label="Companies" iconKey="departments" />
                <NavItem id="users" label="Members" iconKey="users" />
                <NavItem id="departments" label="Departments" iconKey="departments" />
                <NavItem id="telegram" label="Integrations" iconKey="telegram" />
              </nav>
            </>
          )}
        </>
      )}

      <div style={{ flex: 1 }} />

      {/* User Footer (Solid --brand-600 fill for avatar) */}
      <div style={{ borderTop: '1px solid var(--ink-150)', padding: '10px 8px 4px', display: 'flex', alignItems: 'center', gap: '9px' }}>
        <div style={{
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          background: 'var(--brand-600)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontSize: '0.6875rem',
          fontWeight: 700,
          flexShrink: 0,
          letterSpacing: '0.3px',
          boxShadow: '0 1px 4px rgba(79,70,229,0.3)'
        }}>
          {userInitials}
        </div>
        <div style={{ lineHeight: 1.3, overflow: 'hidden', flex: 1 }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ink-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user?.full_name || 'User'}
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--ink-400)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user?.role || 'Member'}
          </div>
        </div>
      </div>
    </aside>
  );
}
