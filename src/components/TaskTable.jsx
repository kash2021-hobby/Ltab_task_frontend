import React, { useState, useMemo } from 'react';

// ── Style tokens matching Phase 1 Palette ───────────────────────────────────
const thS = {
  padding: '8px 14px',
  fontSize: '9.5px',
  fontWeight: 700,
  color: '#8A8578',
  textTransform: 'uppercase',
  letterSpacing: '.13em',
  borderBottom: '1px solid #E3E0DA',
  textAlign: 'left',
  whiteSpace: 'nowrap',
  background: '#FBFAF8'
};

const tdS = {
  padding: '12px 14px',
  fontSize: '0.8125rem',
  color: '#141B2D',
  borderBottom: '1px solid #F2F1EE',
  verticalAlign: 'middle'
};

// ── Priority spine colours ──────────────────────────────────────────────────
// Rule 03: Priority is a thin bar on the left edge. Only Urgent and High get a spine.
const SPINE = {
  Urgent: '#B3462F',
  High:   '#9A7B3F',
  Normal: 'transparent',
  Medium: 'transparent',
  Low:    'transparent',
};

// ── Status text styles ──────────────────────────────────────────────────────
const STATUS_STYLE = {
  'Not Started':     { color: '#8A8578', label: 'To do' },
  'In Progress':     { color: '#1d4ed8', label: 'In progress' },
  'In Review':       { color: '#6d28d9', label: 'In review' },
  'Completed':       { color: '#4A7C59', label: 'Done' },
  'Stuck/Blocked':   { color: '#B3462F', label: 'Blocked' },
  'Stuck / Blocked': { color: '#B3462F', label: 'Blocked' },
};

// ── Rule 04: Names never truncate. "Jubin +2", full list on hover. ───────────
function resolveAssignee(t, users) {
  const raw = t.assigned_to || t.AssignedTo || t.AssigneeName || '';
  if (!raw || String(raw).trim() === '' || raw === 'Unassigned') {
    return { display: 'Not assigned', full: 'Not assigned' };
  }

  const parts = String(raw).split(',').map(s => s.trim()).filter(Boolean);
  const fullNames = parts.map(part => {
    const found = users.find(u =>
      u.UserID === part ||
      String(u.UserID) === part ||
      u.Email === part
    );
    if (found) return found.FullName;
    return t.AssigneeName || part;
  }).filter(Boolean);

  if (fullNames.length === 0) return { display: 'Not assigned', full: 'Not assigned' };

  const firstNames = fullNames.map(name => name.split(' ')[0]);
  const display = firstNames.length === 1 ? firstNames[0] : `${firstNames[0]} +${firstNames.length - 1}`;
  const full = fullNames.join(', ');

  return { display, full };
}

// ── Component ────────────────────────────────────────────────────────────────
export default function TaskTable({
  tasks = [],
  users = [],
  projects = [],
  onViewTask,
  onUpdateTaskStatus,
  onOpenEditModal,
  onOpenCommentModal,
  onAssignTask,
  userRole
}) {
  // Rule 02: Search & filters sit behind magnifier
  const [showFilter, setShowFilter] = useState(false);
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState('ALL');
  const [taskTypeFilter, setTaskTypeFilter] = useState('ALL'); // 'ALL' | 'MAIN' | 'SUB'

  const canEdit = ['SuperAdmin', 'Founder', 'DeptAdmin', 'Admin'].includes(userRole);

  const uniqueBrands = useMemo(() => {
    const set = new Set();
    tasks.forEach(t => {
      if (t.BusinessEntity) set.add(t.BusinessEntity);
    });
    return Array.from(set);
  }, [tasks]);

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      const q = search.toLowerCase().trim();
      const matchSearch = !q || (
        (t.Title || '').toLowerCase().includes(q) ||
        (t.AssigneeName || '').toLowerCase().includes(q) ||
        (t.BusinessEntity || '').toLowerCase().includes(q) ||
        (t.Department || '').toLowerCase().includes(q)
      );

      const matchBrand = brandFilter === 'ALL' || t.BusinessEntity === brandFilter;

      const rawAssignee = t.assigned_to || t.AssignedTo || t.AssigneeName || '';
      const matchAssignee = assigneeFilter === 'ALL' || (
        assigneeFilter === 'UNASSIGNED'
          ? (!rawAssignee || rawAssignee === 'Unassigned')
          : String(rawAssignee).includes(assigneeFilter)
      );

      const isSub = !!t.ParentTaskID;
      const matchType = taskTypeFilter === 'ALL' || (taskTypeFilter === 'SUB' ? isSub : !isSub);

      return matchSearch && matchBrand && matchAssignee && matchType;
    });
  }, [tasks, search, brandFilter, assigneeFilter, taskTypeFilter]);

  const clearFilters = () => {
    setSearch('');
    setBrandFilter('ALL');
    setAssigneeFilter('ALL');
    setTaskTypeFilter('ALL');
  };

  const hasActiveFilters = search || brandFilter !== 'ALL' || assigneeFilter !== 'ALL' || taskTypeFilter !== 'ALL';

  return (
    <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #E3E0DA', overflow: 'hidden' }}>

      {/* ── Top Bar ────────────────────────────────────────────────────────── */}
      <div style={{
        padding: '14px 18px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#ffffff',
        borderBottom: showFilter ? '1px solid #F2F1EE' : '1px solid #E3E0DA'
      }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#141B2D', fontVariantNumeric: 'tabular-nums' }}>
          <strong style={{ fontWeight: 700 }}>{filtered.length}</strong> tasks
        </span>

        {/* Rule 02: Magnifier glass toggle button */}
        <button
          type="button"
          onClick={() => setShowFilter(o => !o)}
          title="Search and filter"
          aria-label="Search and filter"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '1px solid #E3E0DA',
            background: showFilter ? '#FAF6EE' : '#ffffff',
            color: showFilter ? '#9A7B3F' : '#8A8578',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease'
          }}
        >
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="7" cy="7" r="4.4" />
            <path d="M10.3 10.3 14 14" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* ── Rule 02: Expandable Search & Filter Bar (Behind Magnifier) ─────── */}
      {showFilter && (
        <div style={{
          padding: '12px 18px',
          background: '#FBFAF8',
          borderBottom: '1px solid #E3E0DA',
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          {/* Search input */}
          <input
            type="text"
            placeholder="Search tasks, people, brands…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              padding: '6px 12px',
              fontSize: '0.8rem',
              borderRadius: '6px',
              border: '1px solid #E3E0DA',
              background: '#ffffff',
              color: '#141B2D',
              outline: 'none',
              minWidth: '220px',
              flex: 1
            }}
          />

          {/* Brand select */}
          <select
            value={brandFilter}
            onChange={e => setBrandFilter(e.target.value)}
            style={{
              padding: '6px 10px',
              fontSize: '0.8rem',
              borderRadius: '6px',
              border: '1px solid #E3E0DA',
              background: '#ffffff',
              color: brandFilter !== 'ALL' ? '#141B2D' : '#8A8578',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">Any brand</option>
            {uniqueBrands.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          {/* Assignee select */}
          <select
            value={assigneeFilter}
            onChange={e => setAssigneeFilter(e.target.value)}
            style={{
              padding: '6px 10px',
              fontSize: '0.8rem',
              borderRadius: '6px',
              border: '1px solid #E3E0DA',
              background: '#ffffff',
              color: assigneeFilter !== 'ALL' ? '#141B2D' : '#8A8578',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">Anyone</option>
            <option value="UNASSIGNED">Not assigned</option>
            {users.map(u => (
              <option key={u.UserID} value={u.UserID}>{u.FullName}</option>
            ))}
          </select>

          {/* Task Type select */}
          <select
            value={taskTypeFilter}
            onChange={e => setTaskTypeFilter(e.target.value)}
            style={{
              padding: '6px 10px',
              fontSize: '0.8rem',
              borderRadius: '6px',
              border: '1px solid #E3E0DA',
              background: '#ffffff',
              color: taskTypeFilter !== 'ALL' ? '#141B2D' : '#8A8578',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">Main & subtasks</option>
            <option value="MAIN">Main tasks only</option>
            <option value="SUB">Subtasks only</option>
          </select>

          {/* Clear button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              style={{
                background: 'none',
                border: 'none',
                color: '#9A7B3F',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '4px 8px'
              }}
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* ── Table (Rule 06: 6 Columns: Spine | Task | Brand | Assigned to | Due | Status) ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {/* Rule 03: Spine column */}
            <th style={{ ...thS, width: '4px', padding: 0 }} />
            {/* Task */}
            <th style={{ ...thS, width: '42%' }}>Task</th>
            {/* Brand */}
            <th style={{ ...thS, width: '16%' }}>Brand</th>
            {/* Assigned to */}
            <th style={{ ...thS, width: '18%' }}>Assigned to</th>
            {/* Due */}
            <th style={{ ...thS, width: '12%' }}>Due</th>
            {/* Status */}
            <th style={{ ...thS, width: '12%' }}>Status</th>
            {/* Actions */}
            <th style={{ ...thS, textAlign: 'right', paddingRight: '16px', width: '50px' }} />
          </tr>
        </thead>
        <tbody>
          {filtered.length > 0 ? filtered.map(t => {
            const isSubtask   = !!t.ParentTaskID;
            const priority    = t.Priority || 'Normal';
            const spineColor  = SPINE[priority] || 'transparent';
            const status      = t.Status || 'Not Started';
            const statusCfg   = STATUS_STYLE[status] || { color: '#8A8578', label: status };
            const isOverdue   = t.DueDate && new Date(t.DueDate) < new Date() && status !== 'Completed';
            const assigneeInfo = resolveAssignee(t, users);

            const fmtDue = t.DueDate
              ? new Date(t.DueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
              : '—';

            return (
              <tr
                key={t.TaskID || t.task_id}
                style={{ cursor: 'pointer', transition: 'background 0.1s' }}
                onClick={() => onViewTask && onViewTask(t.TaskID || t.task_id)}
                onMouseEnter={e => e.currentTarget.style.background = '#FBFAF8'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Rule 03: Priority Spine */}
                <td style={{ padding: 0, width: '4px' }}>
                  <div style={{
                    width: 4,
                    minHeight: 44,
                    background: spineColor,
                    borderRadius: '0 2px 2px 0'
                  }} />
                </td>

                {/* Rule 01: Task Title — quiet "Sub" for subtasks, main tasks aren't marked */}
                <td style={{ ...tdS, paddingLeft: '14px' }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: 500, color: '#141B2D', lineHeight: 1.45 }}>
                    {isSubtask && (
                      <span style={{
                        fontSize: '0.625rem',
                        fontWeight: 700,
                        color: '#8A8578',
                        marginRight: '6px',
                        textTransform: 'uppercase',
                        letterSpacing: '.08em'
                      }}>
                        Sub
                      </span>
                    )}
                    {t.Title}
                  </div>
                </td>

                {/* Brand */}
                <td style={{ ...tdS, color: '#414A5C', fontSize: '0.8125rem' }}>
                  {t.BusinessEntity || '—'}
                </td>

                {/* Rule 04: Names never truncate ("Jubin +2", full list on hover) */}
                <td style={{ ...tdS, fontSize: '0.8125rem' }}>
                  {assigneeInfo.display !== 'Not assigned' ? (
                    <span
                      title={assigneeInfo.full}
                      style={{ color: '#141B2D', fontWeight: 500 }}
                    >
                      {assigneeInfo.display}
                    </span>
                  ) : (
                    <span style={{ color: '#8A8578' }}>Not assigned</span>
                  )}
                </td>

                {/* Due Date */}
                <td style={{
                  ...tdS,
                  color: isOverdue ? '#B3462F' : '#414A5C',
                  fontWeight: isOverdue ? 700 : 500,
                  fontSize: '0.8125rem',
                  fontVariantNumeric: 'tabular-nums',
                  whiteSpace: 'nowrap'
                }}>
                  {fmtDue}
                </td>

                {/* Rule 05: Status dropdown is gone from the row. Pure static text */}
                <td style={tdS}>
                  <span style={{
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    color: statusCfg.color,
                    whiteSpace: 'nowrap'
                  }}>
                    {statusCfg.label}
                  </span>
                </td>

                {/* Actions */}
                <td
                  style={{ ...tdS, textAlign: 'right', paddingRight: '14px' }}
                  onClick={e => e.stopPropagation()}
                >
                  <div style={{ display: 'flex', gap: '2px', justifyContent: 'flex-end' }}>
                    {canEdit && (
                      <button
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                        onClick={() => onOpenEditModal && onOpenEditModal(t.TaskID || t.task_id)}
                        title="Edit"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8A8578" strokeWidth="1.8" strokeLinecap="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    )}
                    <button
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                      onClick={() => onOpenCommentModal && onOpenCommentModal(t.TaskID || t.task_id, t.Title || t.title)}
                      title="Comments"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8A8578" strokeWidth="1.8" strokeLinecap="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            );
          }) : (
            <tr>
              <td colSpan="7" style={{ textAlign: 'center', padding: '48px 16px', color: '#8A8578', fontSize: '0.8125rem' }}>
                No tasks match your search or filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
