import React, { useState, useMemo } from 'react';

// ── Priority spine colours (Rule 03) ────────────────────────────────────────
const SPINE = {
  Urgent: '#B3462F',
  High:   '#9A7B3F',
  Normal: 'transparent',
  Medium: 'transparent',
  Low:    'transparent',
};

// ── Status text mappings ────────────────────────────────────────────────────
const STATUS_STYLE = {
  'Not Started':     { color: '#8A8578', label: 'To do' },
  'In Progress':     { color: '#1d4ed8', label: 'In progress' },
  'In Review':       { color: '#6d28d9', label: 'In review' },
  'Completed':       { color: '#4A7C59', label: 'Done' },
  'Stuck/Blocked':   { color: '#B3462F', label: 'Blocked' },
  'Stuck / Blocked': { color: '#B3462F', label: 'Blocked' },
};

// ── Rule 04: Names never truncate ────────────────────────────────────────────
function resolveAssignee(task, users) {
  const raw = task.assigned_to || task.AssignedTo || task.AssigneeName || '';
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
    return task.AssigneeName || part;
  }).filter(Boolean);

  if (fullNames.length === 0) return { display: 'Not assigned', full: 'Not assigned' };

  const firstNames = fullNames.map(name => name.split(' ')[0]);
  const display = firstNames.length === 1 ? firstNames[0] : `${firstNames[0]} +${firstNames.length - 1}`;
  const full = fullNames.join(', ');

  return { display, full };
}

// ── Streamlined Task Row matching Phase 1 6-column design ───────────────────
function TaskRow({ task, users = [], onView }) {
  const taskId    = task.task_id || task.TaskID;
  const title     = task.Title || task.title || '(Untitled)';
  const status    = task.Status || task.status || 'Not Started';
  const priority  = task.Priority || task.priority || 'Normal';
  const due       = task.DueDate || task.due_date;
  const company   = task.BusinessEntity || task.business_entity || '—';
  const isSubtask = !!task.ParentTaskID;
  const isOverdue = due && new Date(due) < new Date() && status !== 'Completed';

  const spineColor   = SPINE[priority] || 'transparent';
  const statusCfg    = STATUS_STYLE[status] || { color: '#8A8578', label: status };
  const assigneeInfo = resolveAssignee(task, users);

  const fmtDue = due
    ? new Date(due).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : '—';

  return (
    <div
      onClick={() => onView && onView(taskId)}
      style={{
        display: 'grid',
        gridTemplateColumns: '4px minmax(200px, 1fr) 140px 140px 100px 110px',
        gap: '12px',
        alignItems: 'center',
        padding: '10px 14px 10px 0',
        borderBottom: '1px solid #F2F1EE',
        cursor: onView ? 'pointer' : 'default',
        transition: 'background 0.1s ease',
      }}
      onMouseEnter={e => e.currentTarget.style.background = '#FBFAF8'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Rule 03: Priority spine */}
      <div style={{
        width: 4,
        minHeight: 38,
        background: spineColor,
        borderRadius: '0 2px 2px 0'
      }} />

      {/* Rule 01: Task title — quiet "Sub" for subtasks, main tasks aren't marked */}
      <div style={{ paddingLeft: '8px' }}>
        <div style={{ fontSize: '0.84rem', fontWeight: 500, color: '#141B2D', lineHeight: 1.4 }}>
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
          {title}
        </div>
      </div>

      {/* Brand */}
      <div style={{ fontSize: '0.8125rem', color: '#414A5C' }}>
        {company}
      </div>

      {/* Rule 04: Names never truncate ("Jubin +2", full list on hover) */}
      <div style={{ fontSize: '0.8125rem' }}>
        {assigneeInfo.display !== 'Not assigned' ? (
          <span title={assigneeInfo.full} style={{ color: '#141B2D', fontWeight: 500 }}>
            {assigneeInfo.display}
          </span>
        ) : (
          <span style={{ color: '#8A8578' }}>Not assigned</span>
        )}
      </div>

      {/* Due Date */}
      <div style={{
        fontSize: '0.8125rem',
        color: isOverdue ? '#B3462F' : '#414A5C',
        fontWeight: isOverdue ? 700 : 500,
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap'
      }}>
        {fmtDue}
      </div>

      {/* Rule 05: Status dropdown is gone from the row. Pure static text */}
      <div>
        <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: statusCfg.color }}>
          {statusCfg.label}
        </span>
      </div>
    </div>
  );
}

// ── Section Card (Warm Neutral Palette, No Emoji, Hairline Border) ───────────
function SectionCard({ title, tasks, users = [], onView, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  if (!tasks || tasks.length === 0) return null;
  const pending = tasks.filter(t => (t.Status || t.status || '') !== 'Completed').length;

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '8px',
      border: '1px solid #E3E0DA',
      marginBottom: '14px',
      overflow: 'hidden'
    }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', background: '#FBFAF8', border: 'none', cursor: 'pointer',
          borderBottom: open ? '1px solid #E3E0DA' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#141B2D' }}>{title}</span>
          <span style={{
            fontSize: '0.72rem', fontWeight: 600, color: '#8A8578',
            letterSpacing: '.05em', textTransform: 'lowercase'
          }}>
            {tasks.length} task{tasks.length !== 1 ? 's' : ''}
          </span>
          {pending > 0 ? (
            <span style={{
              fontSize: '0.72rem', fontWeight: 600, color: '#B3462F',
              letterSpacing: '.05em'
            }}>
              · {pending} pending
            </span>
          ) : (
            <span style={{
              fontSize: '0.72rem', fontWeight: 600, color: '#4A7C59',
              letterSpacing: '.05em'
            }}>
              · all done
            </span>
          )}
        </div>
        <span style={{ color: '#8A8578', fontSize: '0.75rem', fontWeight: 700 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div>
          {/* Rule 06: Table Header (6 columns: Spine | Task | Brand | Assigned to | Due | Status) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '4px minmax(200px, 1fr) 140px 140px 100px 110px',
            gap: '12px',
            padding: '7px 14px 7px 0',
            fontSize: '9.5px',
            fontWeight: 700,
            color: '#8A8578',
            textTransform: 'uppercase',
            letterSpacing: '.13em',
            background: '#FBFAF8',
            borderBottom: '1px solid #E3E0DA'
          }}>
            <span />
            <span style={{ paddingLeft: '8px' }}>Task title</span>
            <span>Brand</span>
            <span>Assigned to</span>
            <span>Due date</span>
            <span>Status</span>
          </div>

          {/* Rows */}
          {tasks.map(t => (
            <TaskRow
              key={t.task_id || t.TaskID}
              task={t}
              users={users}
              onView={onView}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function MyTasks({
  tasks = [],
  user,
  users = [],
  projects = [],
  businesses = [],
  onViewTask,
  onUpdateTaskStatus,
  onRefresh
}) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilter, setShowFilter] = useState(false); // Rule 02: Search & filters sit behind magnifier
  const [searchQ, setSearchQ] = useState('');
  const [bifurcationTab, setBifurcationTab] = useState('all');

  // Extract all identifiers for the logged-in user
  const userIdentifiers = useMemo(() => {
    if (!user) return [];
    const ids = [];
    if (user.user_id) ids.push(String(user.user_id).toLowerCase());
    if (user.UserID) ids.push(String(user.UserID).toLowerCase());
    if (user.id) ids.push(String(user.id).toLowerCase());
    if (user.email) ids.push(String(user.email).toLowerCase());
    if (user.Email) ids.push(String(user.Email).toLowerCase());
    if (user.full_name) ids.push(String(user.full_name).toLowerCase());
    if (user.FullName) ids.push(String(user.FullName).toLowerCase());
    if (user.name) ids.push(String(user.name).toLowerCase());
    return [...new Set(ids)];
  }, [user]);

  // Dynamically filter all tasks and subtasks assigned to the user
  const myTasks = useMemo(() => {
    if (userIdentifiers.length === 0) return [];

    const matchesUser = (assigneeField) => {
      if (!assigneeField) return false;
      const str = String(assigneeField).toLowerCase().trim();
      if (!str) return false;
      if (userIdentifiers.some(id => str === id)) return true;
      const parts = str.split(',').map(s => s.trim()).filter(Boolean);
      return parts.some(part => userIdentifiers.some(id => part === id || part.includes(id)));
    };

    const taskList = [];
    const seenIds = new Set();

    tasks.forEach(t => {
      const taskId = t.task_id || t.TaskID;
      const isParentMatched = matchesUser(t.assigned_to) || matchesUser(t.AssignedTo) || matchesUser(t.AssigneeName);
      
      if (isParentMatched && !seenIds.has(taskId)) {
        taskList.push(t);
        seenIds.add(taskId);
      }

      if (Array.isArray(t.Subtasks)) {
        t.Subtasks.forEach(st => {
          const stId = st.task_id || st.TaskID;
          const isSubMatched = matchesUser(st.assigned_to) || matchesUser(st.AssignedTo) || matchesUser(st.AssigneeName);
          if (isSubMatched && !seenIds.has(stId)) {
            taskList.push({
              ...st,
              ParentTaskTitle: t.Title || t.title,
              BusinessEntity: st.business_entity || t.BusinessEntity || t.business_entity,
              Department: st.department || t.Department || t.department,
              ProjectID: st.project_id || t.ProjectID || t.project_id
            });
            seenIds.add(stId);
          }
        });
      }
    });

    return taskList;
  }, [tasks, userIdentifiers]);

  // Apply search query and status filtering
  const filtered = useMemo(() => {
    let list = myTasks;
    if (filterStatus !== 'all') {
      list = list.filter(t => (t.Status || t.status || 'Not Started') === filterStatus);
    }
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      list = list.filter(t => {
        const title = (t.Title || t.title || '').toLowerCase();
        const dept = (t.Department || t.department || '').toLowerCase();
        const company = (t.BusinessEntity || t.business_entity || '').toLowerCase();
        return title.includes(q) || dept.includes(q) || company.includes(q);
      });
    }
    return list;
  }, [myTasks, filterStatus, searchQ]);

  // Grouping
  const byCompany = useMemo(() => {
    const map = {};
    filtered.forEach(t => {
      const key = t.BusinessEntity || t.business_entity || 'Shared / General';
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [filtered]);

  const byProject = useMemo(() => {
    const map = {};
    filtered.forEach(t => {
      const projId = t.project_id || t.ProjectID;
      let projectTitle = 'General / No Project';
      if (projId) {
        const found = projects.find(p => p.project_id === projId || String(p.id) === String(projId));
        projectTitle = found ? (found.title || found.name) : (t.ProjectTitle || t.project_title || projId);
      } else if (t.ProjectTitle || t.project_title) {
        projectTitle = t.ProjectTitle || t.project_title;
      }
      if (!map[projectTitle]) map[projectTitle] = [];
      map[projectTitle].push(t);
    });
    return map;
  }, [filtered, projects]);

  const byActionPlan = useMemo(() => {
    const map = {};
    filtered.forEach(t => {
      let planTitle = null;
      if (t.action_plan_id || t.ActionPlanID) {
        planTitle = t.ActionPlanTitle || t.action_plan_title || t.ActionPlanID || t.action_plan_id;
      } else {
        const desc = t.Description || t.description || '';
        const match = desc.match(/Assigned from Action Plan:\s*([^(\n]+)/i);
        if (match) {
          planTitle = match[1].trim();
        } else if (desc.includes('[AP:')) {
          planTitle = 'Action Plan Assigned Tasks';
        }
      }
      if (planTitle) {
        if (!map[planTitle]) map[planTitle] = [];
        map[planTitle].push(t);
      }
    });
    return map;
  }, [filtered]);

  const total = myTasks.length;
  const inProgress = myTasks.filter(t => (t.Status || t.status) === 'In Progress').length;
  const overdue = myTasks.filter(t => {
    const due = t.DueDate || t.due_date;
    const status = t.Status || t.status;
    return due && new Date(due) < new Date() && status !== 'Completed';
  }).length;

  return (
    <div style={{ padding: '0 0 40px' }}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
        <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#141B2D' }}>My Tasks</h2>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            style={{
              padding: '5px 12px', fontSize: '0.75rem', fontWeight: 600, borderRadius: '6px',
              border: '1px solid #E3E0DA', background: '#ffffff', color: '#8A8578',
              cursor: 'pointer'
            }}
          >
            Refresh
          </button>
        )}
      </div>

      {/* ── Summary line ─────────────────────────────────────────────────── */}
      <p style={{ margin: '0 0 20px', fontSize: '0.875rem', color: '#8A8578', fontVariantNumeric: 'tabular-nums' }}>
        <strong style={{ color: '#141B2D', fontWeight: 700 }}>{total}</strong>{' '}{total === 1 ? 'task' : 'tasks'} on you
        <span style={{ margin: '0 8px', color: '#E3E0DA' }}>·</span>
        <strong style={{ color: overdue > 0 ? '#B3462F' : '#141B2D', fontWeight: 700 }}>{overdue}</strong>{' '}overdue
        <span style={{ margin: '0 8px', color: '#E3E0DA' }}>·</span>
        <strong style={{ color: '#141B2D', fontWeight: 700 }}>{inProgress}</strong>{' '}in progress
      </p>

      {/* ── Group-by tabs + Status filters + Rule 02 Magnifier button ───────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', background: '#F2F1EE', padding: '3px', borderRadius: '8px', gap: '2px' }}>
          {[
            { id: 'all',         label: 'All' },
            { id: 'company',     label: 'By brand' },
            { id: 'project',     label: 'By project' },
            { id: 'action_plan', label: 'By action plan' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setBifurcationTab(tab.id)}
              style={{
                padding: '5px 12px', fontSize: '0.74rem', fontWeight: 600, borderRadius: '6px',
                border: 'none', cursor: 'pointer', transition: 'all 0.12s ease',
                background: bifurcationTab === tab.id ? '#ffffff' : 'transparent',
                color: bifurcationTab === tab.id ? '#141B2D' : '#8A8578',
                boxShadow: bifurcationTab === tab.id ? '0 1px 3px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Status Filters */}
          <div style={{ display: 'flex', gap: '3px', background: '#F2F1EE', padding: '3px', borderRadius: '8px' }}>
            {[
              { id: 'all',          label: 'All' },
              { id: 'Not Started',  label: 'To do' },
              { id: 'In Progress',  label: 'In progress' },
              { id: 'In Review',    label: 'In review' },
              { id: 'Completed',    label: 'Done' }
            ].map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => setFilterStatus(s.id)}
                style={{
                  padding: '4px 10px', fontSize: '0.74rem', borderRadius: '6px', fontWeight: 600,
                  border: 'none',
                  background: filterStatus === s.id ? '#141B2D' : 'transparent',
                  color: filterStatus === s.id ? '#ffffff' : '#8A8578',
                  cursor: 'pointer',
                  transition: 'all 0.12s ease'
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Rule 02: Magnifier icon button to toggle search */}
          <button
            type="button"
            onClick={() => setShowFilter(o => !o)}
            title="Search and filter"
            aria-label="Search and filter"
            style={{
              width: '30px',
              height: '30px',
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
            <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="7" cy="7" r="4.4" />
              <path d="M10.3 10.3 14 14" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Rule 02: Expandable Search Input Bar (Behind Magnifier) */}
      {showFilter && (
        <div style={{ marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="Search tasks, people, brands…"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            style={{
              width: '100%', padding: '8px 14px', fontSize: '0.8125rem',
              borderRadius: '6px', border: '1px solid #E3E0DA', outline: 'none',
              background: '#ffffff', color: '#141B2D', boxSizing: 'border-box'
            }}
          />
        </div>
      )}

      {/* Content Rendering based on Group-by Mode */}
      {filtered.length === 0 ? (
        <div style={{
          padding: '60px 20px', textAlign: 'center', background: '#ffffff',
          borderRadius: '8px', border: '1px solid #E3E0DA'
        }}>
          <div style={{ fontSize: '1.8rem', marginBottom: '10px', color: '#E3E0DA' }}>—</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#141B2D', marginBottom: '4px' }}>
            {myTasks.length === 0 ? 'No tasks currently assigned to you.' : 'No tasks match your current filter.'}
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#8A8578', margin: 0 }}>
            {myTasks.length === 0
              ? 'When tasks are assigned to you from the Board, Table, or Action Plans, they will appear here.'
              : 'Try selecting a different status filter or clearing your search query.'}
          </p>
        </div>
      ) : (
        <>
          {/* SECTION 1: BY BRAND */}
          {(bifurcationTab === 'all' || bifurcationTab === 'company') && Object.keys(byCompany).length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                fontSize: '9.5px', fontWeight: 700, color: '#8A8578', textTransform: 'uppercase',
                letterSpacing: '.13em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px'
              }}>
                <span>Grouped by brand</span>
                <span style={{ fontSize: '9.5px', color: '#8A8578', fontWeight: 500 }}>
                  ({Object.keys(byCompany).length} {Object.keys(byCompany).length === 1 ? 'brand' : 'brands'})
                </span>
              </div>
              {Object.entries(byCompany).map(([company, cTasks]) => (
                <SectionCard
                  key={`comp_${company}`}
                  title={company}
                  tasks={cTasks}
                  users={users}
                  onView={onViewTask}
                  defaultOpen={true}
                />
              ))}
            </div>
          )}

          {/* SECTION 2: BY PROJECT */}
          {(bifurcationTab === 'all' || bifurcationTab === 'project') && Object.keys(byProject).length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                fontSize: '9.5px', fontWeight: 700, color: '#8A8578', textTransform: 'uppercase',
                letterSpacing: '.13em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px'
              }}>
                <span>Grouped by project</span>
                <span style={{ fontSize: '9.5px', color: '#8A8578', fontWeight: 500 }}>
                  ({Object.keys(byProject).length} {Object.keys(byProject).length === 1 ? 'project' : 'projects'})
                </span>
              </div>
              {Object.entries(byProject).map(([proj, pTasks]) => (
                <SectionCard
                  key={`proj_${proj}`}
                  title={proj}
                  tasks={pTasks}
                  users={users}
                  onView={onViewTask}
                  defaultOpen={bifurcationTab === 'project'}
                />
              ))}
            </div>
          )}

          {/* SECTION 3: BY ACTION PLAN */}
          {(bifurcationTab === 'all' || bifurcationTab === 'action_plan') && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                fontSize: '9.5px', fontWeight: 700, color: '#8A8578', textTransform: 'uppercase',
                letterSpacing: '.13em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px'
              }}>
                <span>Grouped by action plan</span>
                <span style={{ fontSize: '9.5px', color: '#8A8578', fontWeight: 500 }}>
                  ({Object.keys(byActionPlan).length} active {Object.keys(byActionPlan).length === 1 ? 'plan' : 'plans'})
                </span>
              </div>
              {Object.keys(byActionPlan).length === 0 ? (
                <div style={{
                  padding: '24px', textAlign: 'center', background: '#ffffff',
                  borderRadius: '8px', border: '1px dashed #E3E0DA', color: '#8A8578', fontSize: '0.8rem'
                }}>
                  No action plan tasks currently assigned to you.
                </div>
              ) : (
                Object.entries(byActionPlan).map(([plan, aTasks]) => (
                  <SectionCard
                    key={`plan_${plan}`}
                    title={plan}
                    tasks={aTasks}
                    users={users}
                    onView={onViewTask}
                    defaultOpen={true}
                  />
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
