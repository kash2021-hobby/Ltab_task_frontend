import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

export default function KanbanBoard({
  tasks,
  users = [],
  projects = [],
  user,
  userRole,
  token,
  onViewTask,
  onUpdateTaskStatus,
  onOpenEditModal,
  onOpenCommentModal,
  onAssignTask
}) {
  const canManageColumns = !userRole || ['SuperAdmin', 'Founder', 'Admin'].includes(userRole || user?.role);
  const isSuperAdmin = canManageColumns;

  // Mouse Drag-to-Scroll Horizontal Panning State
  const boardRef = useRef(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStartXRef = useRef(0);
  const panStartScrollLeftRef = useRef(0);

  const handleBoardMouseDown = (e) => {
    // Ignore interactive elements, cards, buttons, selects, or resize handles
    const target = e.target;
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('select') ||
      target.closest('.kanban-card') ||
      target.closest('[title*="resize"]') ||
      target.closest('[title*="drag"]')
    ) {
      return;
    }

    setIsPanning(true);
    panStartXRef.current = e.clientX;
    panStartScrollLeftRef.current = boardRef.current ? boardRef.current.scrollLeft : 0;
  };

  const handleBoardMouseMove = (e) => {
    if (!isPanning || !boardRef.current) return;
    const dx = e.clientX - panStartXRef.current;
    boardRef.current.scrollLeft = panStartScrollLeftRef.current - dx;
  };

  const handleBoardMouseUp = () => {
    setIsPanning(false);
  };

  const defaultColumns = [
    { id: 'col_not_started', status: 'Not Started', title: 'Not Started', color: '#64748b', dotColor: '#94a3b8', isDefault: true },
    { id: 'col_in_progress', status: 'In Progress', title: 'In Progress', color: '#2563eb', dotColor: '#3b82f6', isDefault: true },
    { id: 'col_in_review', status: 'In Review', title: 'In Review', color: '#7c3aed', dotColor: '#8b5cf6', isDefault: true },
    { id: 'col_done', status: 'Completed', title: 'Done', color: '#16a34a', dotColor: '#22c55e', isDefault: true }
  ];

  const sanitizeCols = (cols) => {
    if (!Array.isArray(cols)) return defaultColumns;
    const clean = cols.filter(c => c.id !== 'col_blocked' && c.status !== 'Stuck/Blocked');
    return clean.length > 0 ? clean : defaultColumns;
  };

  // Scope localStorage key by user ID to prevent cross-account leakage
  const colKey = `kanban_custom_columns:${user?.user_id || 'guest'}`;

  // Dynamic Column List State (stored in localStorage and synced with Server)
  const [columns, setColumns] = useState(() => {
    try {
      const saved = localStorage.getItem(colKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return sanitizeCols(parsed);
      }
      return defaultColumns;
    } catch (e) {
      return defaultColumns;
    }
  });

  // Sync Kanban Columns with Server API across devices
  useEffect(() => {
    if (token) {
      fetchServerKanbanColumns();
    }
  }, [token]);

  const fetchServerKanbanColumns = async () => {
    try {
      const res = await axios.get('/api/tasks/kanban-columns', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success && Array.isArray(res.data.columns) && res.data.columns.length > 0) {
        const cleanCols = sanitizeCols(res.data.columns);
        setColumns(cleanCols);
        localStorage.setItem(colKey, JSON.stringify(cleanCols));
      }
    } catch (err) {
      console.error('Error fetching server kanban columns:', err);
    }
  };

  const saveKanbanColumns = async (updatedCols) => {
    setColumns(updatedCols);
    try {
      localStorage.setItem(colKey, JSON.stringify(updatedCols));
      if (token) {
        await axios.post('/api/tasks/kanban-columns', { columns: updatedCols }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (err) {
      console.error('Error saving kanban columns to server:', err);
    }
  };

  // Resizable Column Widths State (scoped by user ID to prevent cross-account leakage)
  const widthKey = `kanban_col_widths:${user?.user_id || 'guest'}`;
  const [colWidths, setColWidths] = useState(() => {
    try {
      const saved = localStorage.getItem(widthKey);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [resizingCol, setResizingCol] = useState(null);
  const [draggedColIndex, setDraggedColIndex] = useState(null);

  // Rename Column State
  const [editingColId, setEditingColId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Add Column State
  const [showAddColModal, setShowAddColModal] = useState(false);
  const [newColTitle, setNewColTitle] = useState('');

  // Board Edit Mode State — all column edits are gated behind this
  const [isEditingBoard, setIsEditingBoard] = useState(false);
  const [draftColumns, setDraftColumns] = useState(columns);

  // When live columns change (e.g. from server fetch), update draft if not currently editing
  useEffect(() => {
    if (!isEditingBoard) setDraftColumns(columns);
  }, [columns, isEditingBoard]);

  const startEditBoard = () => {
    setDraftColumns([...columns]);
    setIsEditingBoard(true);
  };

  const cancelEditBoard = () => {
    setIsEditingBoard(false);
    setDraftColumns(columns);
    setEditingColId(null);
    setNewColTitle('');
    setShowAddColModal(false);
  };

  const saveEditBoard = () => {
    saveKanbanColumns(draftColumns);
    setIsEditingBoard(false);
    setEditingColId(null);
    setShowAddColModal(false);
  };

  // Mouse drag handler for column width resizing
  const handleResizeStart = (e, status) => {
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const startWidth = colWidths[status] || 285;

    const onMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(180, Math.min(900, startWidth + deltaX));
      
      setColWidths(prev => {
        const next = { ...prev, [status]: newWidth };
        try {
          localStorage.setItem(widthKey, JSON.stringify(next));
        } catch (err) {}
        return next;
      });
    };

    const onMouseUp = () => {
      setResizingCol(null);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    setResizingCol(status);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Drag and drop column re-ordering handlers (Admin/SuperAdmin) — only in edit mode
  const handleColHeaderDragStart = (e, index) => {
    if (!canManageColumns || !isEditingBoard) return;
    setDraggedColIndex(index);
    e.dataTransfer.setData('text/col-index', String(index));
  };

  const handleColHeaderDragOver = (e) => {
    if (!canManageColumns || !isEditingBoard) return;
    e.preventDefault();
  };

  const handleColHeaderDrop = (e, dropIndex) => {
    if (!canManageColumns || !isEditingBoard) return;
    e.preventDefault();

    let fromIndex = draggedColIndex;
    const rawData = e.dataTransfer.getData('text/col-index');
    if (rawData !== undefined && rawData !== '') {
      fromIndex = parseInt(rawData, 10);
    }

    if (fromIndex === null || fromIndex === undefined || isNaN(fromIndex) || fromIndex === dropIndex) return;

    const updatedCols = [...draftColumns];
    const [movedCol] = updatedCols.splice(fromIndex, 1);
    updatedCols.splice(dropIndex, 0, movedCol);

    setDraggedColIndex(null);
    setDraftColumns(updatedCols);
  };

  // Rename column title (works on draftColumns in edit mode)
  const handleStartRename = (col) => {
    if (!canManageColumns || !isEditingBoard) return;
    setEditingColId(col.id);
    setEditingTitle(col.title);
  };

  const handleSaveRename = (colId) => {
    if (!editingTitle.trim()) return;
    setDraftColumns(prev => prev.map(c => c.id === colId ? { ...c, title: editingTitle.trim() } : c));
    setEditingColId(null);
  };

  // Add custom column (into draftColumns only — saved on Save)
  const handleAddColumnSubmit = (e) => {
    if (e) e.preventDefault();
    if (!newColTitle.trim() || !canManageColumns || !isEditingBoard) return;
    const titleStr = newColTitle.trim();
    const newCol = {
      id: 'col_' + Date.now(),
      status: titleStr,
      title: titleStr,
      color: '#f97316',
      dotColor: '#ea580c',
      isDefault: false
    };
    setDraftColumns(prev => [...prev, newCol]);
    setNewColTitle('');
    setShowAddColModal(false);
  };

  // Delete custom column (from draftColumns only)
  const handleDeleteColumn = (colId) => {
    if (!canManageColumns || !isEditingBoard) return;
    if (window.confirm('Are you sure you want to remove this column?')) {
      setDraftColumns(prev => prev.filter(c => c.id !== colId));
    }
  };

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      onUpdateTaskStatus(taskId, newStatus);
    }
  };

  const priorityColor = (p) => {
    const map = { Urgent: '#B3462F', High: '#9A7B3F', Normal: '#8A8578', Medium: '#8A8578', Low: '#8A8578' };
    return map[p] || '#8A8578';
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Board Controls Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        {/* Left: hint text shown only in edit mode */}
        <div style={{ fontSize: '0.75rem', color: '#97a0af', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {canManageColumns && isEditingBoard && (
            <>
              <span>Drag column headers to reorder</span>
              <span>·</span>
              <span>Click ✏️ to rename</span>
            </>
          )}
        </div>

        {/* Right: Edit / Save+Cancel / Add Column buttons */}
        {canManageColumns && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isEditingBoard ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowAddColModal(true)}
                  style={{ padding: '4px 12px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #dfe1e6', background: '#ffffff', color: '#172b4d', cursor: 'pointer', fontWeight: 500 }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f4f5f7'}
                  onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                >
                  + Add Column
                </button>
                <button
                  type="button"
                  onClick={saveEditBoard}
                  style={{ padding: '4px 14px', fontSize: '0.75rem', borderRadius: '4px', border: 'none', background: '#16a34a', color: '#ffffff', cursor: 'pointer', fontWeight: 700 }}
                >
                  ✓ Save
                </button>
                <button
                  type="button"
                  onClick={cancelEditBoard}
                  style={{ padding: '4px 12px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #dfe1e6', background: '#ffffff', color: '#5e6c84', cursor: 'pointer', fontWeight: 500 }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={startEditBoard}
                style={{ padding: '4px 12px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #dfe1e6', background: '#ffffff', color: '#172b4d', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '5px' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f4f5f7'}
                onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
              >
                ✏️ Edit Board
              </button>
            )}
          </div>
        )}
      </div>

      <div
        ref={boardRef}
        className="kanban-board"
        onMouseDown={handleBoardMouseDown}
        onMouseMove={handleBoardMouseMove}
        onMouseUp={handleBoardMouseUp}
        onMouseLeave={handleBoardMouseUp}
        style={{
          cursor: isPanning ? 'grabbing' : 'grab',
          userSelect: isPanning ? 'none' : 'auto'
        }}
      >
        {/* Render draftColumns in edit mode, live columns in view mode */}
        {(isEditingBoard ? draftColumns : columns).map((col, index) => {
          const targetCol = (col.status || '').toLowerCase();
          const targetTitle = (col.title || '').toLowerCase();

          let colTasks = tasks.filter(t => {
            const rawStatus = (t.Status || 'Not Started').trim().toLowerCase();

            if (targetCol === 'not started' || targetTitle === 'not started') {
              return rawStatus === 'not started' || rawStatus === 'assigned' || rawStatus === 'pending' || rawStatus === '' || rawStatus === 'new';
            }
            if (targetCol === 'in progress' || targetTitle === 'in progress') {
              return rawStatus === 'in progress' || rawStatus === 'started' || rawStatus === 'active';
            }
            if (targetCol === 'in review' || targetTitle === 'in review') {
              return rawStatus === 'in review' || rawStatus === 'review';
            }
            if (targetCol === 'stuck/blocked' || targetTitle === 'blocked') {
              return rawStatus.includes('stuck') || rawStatus.includes('block') || rawStatus === 'delayed';
            }
            if (targetCol === 'completed' || targetTitle === 'done') {
              return rawStatus === 'completed' || rawStatus === 'done';
            }
            return rawStatus === targetCol || rawStatus === targetTitle;
          });


          return (
            <div
              key={col.id || col.status}
              className="kanban-column"
              style={{
                width: `${colWidths[col.status] || 285}px`,
                minWidth: `${colWidths[col.status] || 285}px`,
                flexShrink: 0,
                position: 'relative',
                opacity: draggedColIndex === index ? 0.4 : 1,
                transition: 'opacity 0.15s ease'
              }}
              onDragOver={handleColHeaderDragOver}
              onDrop={(e) => handleColHeaderDrop(e, index)}
            >
              {/* Resizable Column Edge */}
              <div
                onMouseDown={(e) => handleResizeStart(e, col.status)}
                title="Drag to resize column"
                style={{
                  position: 'absolute', top: 0, right: '-5px', bottom: 0, width: '10px',
                  cursor: 'col-resize', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <div style={{
                  width: '3px', height: '28px', borderRadius: '2px',
                  background: resizingCol === col.status ? '#2563eb' : '#e4e7eb',
                  transition: 'background 0.15s ease'
                }} />
              </div>

              {/* Column Header (Draggable only in edit mode) */}
              <div
                className="kanban-column-header"
                draggable={isEditingBoard && isSuperAdmin}
                onDragStart={(e) => handleColHeaderDragStart(e, index)}
                style={{
                  cursor: isEditingBoard && isSuperAdmin ? 'grab' : 'default',
                  userSelect: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                  {/* Drag handle — only in edit mode */}
                  {isEditingBoard && isSuperAdmin && (
                    <span style={{ cursor: 'grab', color: '#94a3b8', fontSize: '0.85rem' }} title="Drag header to reorder column">
                      ⋮⋮
                    </span>
                  )}

                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: col.dotColor || '#0284c7',
                    flexShrink: 0
                  }} />

                  {editingColId === col.id ? (
                    <input
                      type="text"
                      className="form-control"
                      style={{ padding: '2px 6px', fontSize: '0.8rem', height: '26px' }}
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveRename(col.id);
                        if (e.key === 'Escape') setEditingColId(null);
                      }}
                      onBlur={() => handleSaveRename(col.id)}
                      autoFocus
                    />
                  ) : (
                    <span
                      onDoubleClick={() => handleStartRename(col)}
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: '#1e293b',
                        letterSpacing: '-0.2px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        cursor: isSuperAdmin ? 'pointer' : 'default'
                      }}
                      title={isSuperAdmin ? 'Double-click to rename' : col.title}
                    >
                      {col.title}
                    </span>
                  )}

                  {/* Rename pencil — only in edit mode */}
                  {isEditingBoard && isSuperAdmin && editingColId !== col.id && (
                    <button
                      type="button"
                      onClick={() => handleStartRename(col)}
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', fontSize: '0.72rem', padding: '0 2px' }}
                      title="Rename column title"
                    >
                      ✏️
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#94a3b8',
                    minWidth: '18px',
                    textAlign: 'center'
                  }}>
                    {colTasks.length}
                  </span>

                  {/* Delete button — only in edit mode, only for custom columns */}
                  {isEditingBoard && isSuperAdmin && !col.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleDeleteColumn(col.id)}
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#dc2626', fontSize: '0.74rem', padding: '0 2px' }}
                      title="Remove custom column"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Column Body */}
              <div
                className="kanban-column-body"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.status)}
              >
                {colTasks.length > 0 ? (
                  colTasks.map(t => {
                    const isSubtask = !!t.ParentTaskID;
                    const isDelayed = t.PaceStatus === 'Delayed';
                    const pColor = priorityColor(t.Priority);
                    const rawAssigned = t.assigned_to || t.AssignedTo || t.AssigneeName || '';
                    const assignee = users.find(u =>
                      u.UserID === rawAssigned ||
                      String(u.UserID) === String(rawAssigned) ||
                      u.FullName === rawAssigned ||
                      u.FullName === t.AssigneeName ||
                      u.Email === rawAssigned
                    );
                    const hasAssignment = Boolean(rawAssigned && rawAssigned !== 'Unassigned');
                    const selectVal = assignee ? assignee.UserID : (hasAssignment ? rawAssigned : '');

                    return (
                      <div
                        key={t.task_id || t.TaskID}
                        className="kanban-card"
                        draggable
                        onDragStart={(e) => handleDragStart(e, t.task_id || t.TaskID)}
                        onClick={() => onViewTask(t.task_id || t.TaskID)}
                        style={{
                          borderLeft: `2px solid ${pColor}`,
                          position: 'relative',
                          borderRadius: 'var(--radius-md)',
                          boxShadow: 'var(--shadow-sm)'
                        }}
                      >
                        {/* Header Badges */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            color: isSubtask ? 'var(--brand-700)' : 'var(--brand-600)',
                            background: 'var(--brand-50)',
                            padding: '2px 6px',
                            borderRadius: 'var(--radius-xs)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}>
                            {isSubtask ? '📌 Subtask' : 'Task'} • {t.MainHeading || 'Gen'}
                          </span>

                          <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--ink-500)', fontFamily: 'var(--font-mono)' }}>
                            {t.StoryPoints || 0} sp <span style={{ color: pColor }}>●</span>
                          </span>
                        </div>

                        {/* Title */}
                        <div style={{
                          fontSize: '0.84rem',
                          fontWeight: 700,
                          color: '#0f172a',
                          marginBottom: '4px',
                          lineHeight: 1.3
                        }}>
                          {t.Title}
                        </div>

                        {/* Classification line */}
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '8px' }}>
                          {t.Department || 'Ops'} • {t.BusinessEntity || 'Company X'}
                          {t.ProjectTitle && (
                            <div style={{ color: '#ea580c', fontWeight: 600, marginTop: '2px' }}>
                              📁 {t.ProjectTitle}
                            </div>
                          )}
                        </div>

                        {/* Pace Alert Badge */}
                        {isDelayed && (
                          <div style={{
                            display: 'inline-block',
                            fontSize: '0.66rem',
                            fontWeight: 700,
                            color: '#dc2626',
                            background: '#fef2f2',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            marginBottom: '8px',
                            border: '1px solid #fecaca'
                          }}>
                            ⚠️ Behind Schedule
                          </div>
                        )}

                        {/* 1-Click Status Advance Button */}
                        {(() => {
                          const currentStatus = t.Status || t.status || 'Not Started';
                          const normStatus = currentStatus.trim().toLowerCase();

                          // Advance action determination
                          let advance = { next: 'In Progress', label: '▶ Start', bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' };
                          if (normStatus === 'not started' || normStatus === 'assigned' || normStatus === 'pending' || normStatus === 'new' || normStatus === '') {
                            advance = { next: 'In Progress', label: '▶ Start Working', bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' };
                          } else if (normStatus === 'in progress' || normStatus === 'active' || normStatus === 'started') {
                            advance = { next: 'In Review', label: '🔍 Send to Review', bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' };
                          } else if (normStatus === 'in review' || normStatus === 'review') {
                            advance = { next: 'Completed', label: '✓ Mark Done', bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' };
                          } else if (normStatus.includes('stuck') || normStatus.includes('block') || normStatus === 'delayed') {
                            advance = { next: 'In Progress', label: '⚡ Unblock', bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' };
                          } else if (normStatus === 'completed' || normStatus === 'done') {
                            advance = { next: 'In Progress', label: '↺ Reopen Task', bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' };
                          }

                          if (!advance) return null;

                          return (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              style={{ marginBottom: '8px' }}
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdateTaskStatus(t.task_id || t.TaskID, advance.next);
                                }}
                                title={`Click to move to "${advance.next}"`}
                                style={{
                                  width: '100%',
                                  padding: '5px 10px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  borderRadius: '6px',
                                  border: `1px solid ${advance.border}`,
                                  background: advance.bg,
                                  color: advance.color,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px',
                                  transition: 'all 0.12s ease',
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                                }}
                                onMouseEnter={e => {
                                  e.currentTarget.style.filter = 'brightness(0.94)';
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.filter = 'none';
                                  e.currentTarget.style.transform = 'translateY(0)';
                                }}
                              >
                                {advance.label}
                              </button>
                            </div>
                          );
                        })()}

                        {/* Footer: Assignee & Action Buttons */}
                        <div style={{
                          display: 'flex',
                          justify: 'space-between',
                          alignItems: 'center',
                          paddingTop: '6px',
                          borderTop: '1px solid #f1f5f9',
                          marginTop: '4px'
                        }}>
                          {/* Quick Assignee Dropdown */}
                          <div onClick={(e) => e.stopPropagation()}>
                            {(userRole || user?.role) === 'TeamMember' ? (
                              <span style={{
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                color: '#1e293b',
                                background: '#f1f5f9',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                display: 'inline-block',
                                border: '1px solid #e2e8f0'
                              }}>
                                👤 {assignee ? assignee.FullName : (t.AssigneeName || rawAssigned || 'Assigned to Me')}
                              </span>
                            ) : (
                              <select
                                value={selectVal}
                                onChange={(e) => onAssignTask(t.task_id || t.TaskID, e.target.value)}
                                style={{
                                  fontSize: '0.72rem',
                                  padding: '2px 4px',
                                  borderRadius: '4px',
                                  border: '1px solid #e2e8f0',
                                  background: hasAssignment ? '#ffffff' : '#fef2f2',
                                  color: hasAssignment ? '#1e293b' : '#dc2626',
                                  fontWeight: hasAssignment ? 500 : 700,
                                  maxWidth: '120px'
                                }}
                              >
                                <option value="">Unassigned</option>
                                {users.map(u => (
                                  <option key={u.UserID} value={u.UserID}>
                                    {u.FullName}
                                  </option>
                                ))}
                                {!assignee && hasAssignment && (
                                  <option value={rawAssigned}>
                                    {t.AssigneeName || rawAssigned}
                                  </option>
                                )}
                              </select>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              type="button"
                              title="Comments"
                              onClick={(e) => { e.stopPropagation(); onOpenCommentModal(t.task_id || t.TaskID, t.Title || t.title); }}
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px' }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                              </svg>
                            </button>

                            {onOpenEditModal && (
                              <button
                                type="button"
                                title="Edit Task"
                                onClick={(e) => { e.stopPropagation(); onOpenEditModal(t.task_id || t.TaskID); }}
                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px' }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{
                    padding: '32px 12px',
                    textAlign: 'center',
                    fontSize: '0.76rem',
                    color: '#cbd5e1',
                    border: '1px dashed #e2e8f0',
                    borderRadius: '8px',
                    margin: '4px'
                  }}>
                    Drop tasks here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Custom Column Modal (SuperAdmin Only) */}
      {showAddColModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '100%', maxWidth: '400px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h4 style={{ margin: 0, fontSize: '1rem', color: '#ea580c', fontWeight: 800 }}>➕ Add Custom Kanban Column</h4>
              <button type="button" className="btn btn-outline" style={{ padding: '2px 8px' }} onClick={() => setShowAddColModal(false)}>✕</button>
            </div>

            <form onSubmit={handleAddColumnSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Column Name / Status *
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Backlog, Testing, Client Review..."
                  value={newColTitle}
                  onChange={(e) => setNewColTitle(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddColModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#ea580c' }}>
                  Add Column
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
