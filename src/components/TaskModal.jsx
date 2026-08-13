import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import CommentModal from './CommentModal';

export default function TaskModal({ taskId, isEditMode, onClose, token, users, departments, projects = [], businesses = [], user, onRefresh }) {
  const [currentEditMode, setCurrentEditMode] = useState(isEditMode);
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeCommentTask, setActiveCommentTask] = useState(null);

  const storedUser = user || JSON.parse(localStorage.getItem('user') || '{}');
  const userBizStr = storedUser?.business_entities || storedUser?.BusinessEntities || '';
  const userAssignedBizs = userBizStr ? userBizStr.split(',').map(s => s.trim()).filter(Boolean) : [];

  const fetchedBizNames = Array.isArray(businesses) ? businesses.map(b => (typeof b === 'string' ? b : b?.name)).filter(Boolean) : [];
  const combinedBizSet = new Set([...fetchedBizNames, ...userAssignedBizs]);
  const dynamicBizList = Array.from(combinedBizSet);

  // Form Fields
  const [mainHeading, setMainHeading] = useState('Operations');
  const [priority, setPriority] = useState('Normal');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [businessEntity, setBusinessEntity] = useState(dynamicBizList[0] || 'Company X (Shared)');
  const [department, setDepartment] = useState('Operations');
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [deptDropdownOpen, setDeptDropdownOpen] = useState(false);

  const toggleDepartment = (deptName) => {
    if (selectedDepartments.includes(deptName)) {
      setSelectedDepartments(selectedDepartments.filter(d => d !== deptName));
    } else {
      setSelectedDepartments([...selectedDepartments, deptName]);
    }
  };
  const [projectId, setProjectId] = useState('');
  const [status, setStatus] = useState('Not Started');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [daysAllowed, setDaysAllowed] = useState(3);
  const [dueDate, setDueDate] = useState('');

  const handleStartDateChange = (newStartDate) => {
    setStartDate(newStartDate);
    if (newStartDate && dueDate) {
      const start = new Date(newStartDate);
      const due = new Date(dueDate);
      const diffDays = Math.round((due - start) / (1000 * 60 * 60 * 24));
      if (!isNaN(diffDays) && diffDays >= 0) setDaysAllowed(diffDays);
    } else if (newStartDate && daysAllowed) {
      const start = new Date(newStartDate);
      start.setDate(start.getDate() + (parseInt(daysAllowed, 10) || 0));
      setDueDate(start.toISOString().split('T')[0]);
    }
  };

  const handleDueDateChange = (newDueDate) => {
    setDueDate(newDueDate);
    if (startDate && newDueDate) {
      const start = new Date(startDate);
      const due = new Date(newDueDate);
      const diffDays = Math.round((due - start) / (1000 * 60 * 60 * 24));
      if (!isNaN(diffDays) && diffDays >= 0) setDaysAllowed(diffDays);
    }
  };

  const handleDaysAllowedChange = (newDays) => {
    setDaysAllowed(newDays);
    const numDays = parseInt(newDays, 10) || 0;
    if (startDate) {
      const start = new Date(startDate);
      start.setDate(start.getDate() + numDays);
      setDueDate(start.toISOString().split('T')[0]);
    }
  };
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false);
  const [storyPoints, setStoryPoints] = useState('0');
  const [extraSubtasks, setExtraSubtasks] = useState([]);
  const [activeSubtaskDropdownId, setActiveSubtaskDropdownId] = useState(null);

  const toggleExtraSubtaskAssignee = (subtaskId, userId) => {
    setExtraSubtasks(extraSubtasks.map(st => {
      if (st.id !== subtaskId) return st;
      const currentList = Array.isArray(st.assignedTo)
        ? st.assignedTo
        : (st.assignedTo ? String(st.assignedTo).split(',').map(s => s.trim()).filter(Boolean) : []);
      
      const newList = currentList.includes(userId)
        ? currentList.filter(id => id !== userId)
        : [...currentList, userId];
      
      return { ...st, assignedTo: newList };
    }));
  };

  // Embedded Comments State
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [selectedTaggedUsers, setSelectedTaggedUsers] = useState([]);
  const [commentFile, setCommentFile] = useState(null);
  const [commentMsg, setCommentMsg] = useState('');
  const [activeSubtaskCommentId, setActiveSubtaskCommentId] = useState(null);
  // Active Task ID State (supports navigating into Subtasks)
  const [currentTaskId, setCurrentTaskId] = useState(taskId);

  useEffect(() => {
    setCurrentTaskId(taskId);
  }, [taskId]);

  const fetchComments = async (targetId) => {
    const idToFetch = targetId || currentTaskId;
    setCommentsLoading(true);
    try {
      const res = await axios.get(`/api/comments/${idToFetch}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        const sorted = (res.data.data || []).sort((a, b) => new Date(b.CreatedAt || 0) - new Date(a.CreatedAt || 0));
        setComments(sorted);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSavingComment(true);
    setCommentMsg('');

    try {
      const targetId = activeSubtaskCommentId || currentTaskId;
      const formData = new FormData();
      formData.append('taskId', targetId);
      formData.append('commentText', commentText);
      formData.append('taggedUsers', JSON.stringify(selectedTaggedUsers));
      if (commentFile) {
        formData.append('document', commentFile);
      }

      const res = await axios.post('/api/comments', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data.success) {
        setCommentMsg('✅ Comment posted & Telegram alerts dispatched!');
        setCommentText('');
        setSelectedTaggedUsers([]);
        setCommentFile(null);
        fetchComments(targetId);
        setTimeout(() => setCommentMsg(''), 3000);
      }
    } catch (err) {
      setCommentMsg('❌ ' + (err.response?.data?.error || err.message));
    } finally {
      setSavingComment(false);
    }
  };

  useEffect(() => {
    if (currentTaskId) {
      fetchTaskDetails(currentTaskId);
      fetchComments(currentTaskId);
    }
  }, [currentTaskId]);

  const toggleAssignee = (userId) => {
    if (selectedAssignees.includes(userId)) {
      setSelectedAssignees(selectedAssignees.filter(id => id !== userId));
    } else {
      setSelectedAssignees([...selectedAssignees, userId]);
    }
  };

  const fetchTaskDetails = async (targetId) => {
    const idToFetch = targetId || currentTaskId;
    setLoading(true);
    try {
      const res = await axios.get(`/api/tasks/${idToFetch}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        const t = res.data.data;
        setTask(t);
        setMainHeading(t.MainHeading || 'Operations');
        setPriority(t.Priority || 'Normal');
        setTitle(t.Title || '');
        setDescription(t.Description || '');
        setBusinessEntity(t.BusinessEntity || 'Company X (Shared)');
        setDepartment(t.Department || 'Operations');
        
        const rawDept = t.Department || 'Operations';
        const parsedDepts = String(rawDept).split(',').map(s => s.trim()).filter(Boolean);
        setSelectedDepartments(parsedDepts);

        setProjectId(t.ProjectID || t.project_id || '');
        setStatus(t.Status || 'Not Started');
        
        const sDate = t.StartDate || t.start_date || new Date().toISOString().split('T')[0];
        const dDate = t.DueDate || t.due_date || '';
        setStartDate(sDate);
        setDueDate(dDate);

        if (sDate && dDate) {
          const start = new Date(sDate);
          const due = new Date(dDate);
          const diffDays = Math.round((due - start) / (1000 * 60 * 60 * 24));
          if (!isNaN(diffDays) && diffDays >= 0) setDaysAllowed(diffDays);
        } else if (t.DaysAllowed) {
          setDaysAllowed(t.DaysAllowed);
        }
        
        const rawAssigned = t.AssignedTo || t.assigned_to || '';
        const parsed = String(rawAssigned).split(',').map(s => s.trim()).filter(Boolean);
        setSelectedAssignees(parsed);

        setStoryPoints(t.StoryPoints !== undefined ? String(t.StoryPoints) : '0');
      }
    } catch (err) {
      console.error('Error fetching task details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExtraSubtask = () => {
    setExtraSubtasks([
      ...extraSubtasks,
      { id: Date.now(), title: '', department: department || 'Operations', storyPoints: 1, assignedTo: '' }
    ]);
  };

  const handleRemoveExtraSubtask = (id) => {
    setExtraSubtasks(extraSubtasks.filter(st => st.id !== id));
  };

  const handleUpdateExtraSubtask = (id, field, val) => {
    setExtraSubtasks(extraSubtasks.map(st => st.id === id ? { ...st, [field]: val } : st));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        updates: {
          MainHeading: mainHeading,
          Title: title,
          Description: description,
          BusinessEntity: businessEntity,
          Department: selectedDepartments.length > 0 ? selectedDepartments.join(', ') : (department || 'Operations'),
          ProjectID: projectId || null,
          Priority: priority,
          Status: status,
          DueDate: dueDate,
          AssignedTo: selectedAssignees.join(', '),
          StoryPoints: parseFloat(storyPoints) || 0
        },
        extraSubtasks: extraSubtasks.map(st => ({
          title: st.title,
          department: st.department,
          assignedTo: Array.isArray(st.assignedTo) ? st.assignedTo.join(', ') : (st.assignedTo || null),
          storyPoints: parseFloat(st.storyPoints) || 0
        }))
      };

      const res = await axios.put(`/api/tasks/${taskId}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        if (onRefresh) onRefresh();
        onClose();
      }
    } catch (err) {
      alert('Error updating task: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return ReactDOM.createPortal(
      <div className="modal-overlay">
        <div className="card" style={{ width: '380px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading task details...</div>
      </div>,
      document.body
    );
  }

  return ReactDOM.createPortal(
    <div className="modal-overlay">
      <div className="modal-content" style={{ width: '100%', maxWidth: '760px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--border)', paddingBottom: '14px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {currentEditMode ? (task?.ParentTaskID ? '✏️ Edit Sub-Task' : '✏️ Edit Main Task') : task?.Title}
            </h3>
            <span class={`badge ${task?.ParentTaskID ? 'badge-sub-task' : 'badge-main-task'}`} style={{ marginTop: '6px' }}>
              {task?.ParentTaskID ? '📌 SUB-TASK' : '👑 MAIN TASK'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {task?.ParentTaskID && (
              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: '6px 12px', fontSize: '0.82rem', borderRadius: '8px', color: '#ea580c', borderColor: '#fdba74', background: '#fff7ed', fontWeight: 600 }}
                onClick={() => {
                  setCurrentTaskId(task.ParentTaskID);
                  setCurrentEditMode(false);
                }}
              >
                ← Back to Parent Task
              </button>
            )}
            <button
              type="button"
              className="btn btn-outline"
              style={{ color: '#16a34a', borderColor: '#bbf7d0', padding: '6px 12px', fontSize: '0.82rem', borderRadius: '8px' }}
              onClick={() => setActiveCommentTask({ id: task?.TaskID, title: task?.Title })}
            >
              💬 Comment & Tag
            </button>
            {!currentEditMode && (
              <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.82rem', borderRadius: '8px' }} onClick={() => setCurrentEditMode(true)}>
                ✏️ Edit Task
              </button>
            )}
            <button className="btn btn-outline" onClick={onClose} style={{ borderRadius: '8px' }}>✕ Close</button>
          </div>
        </div>

        {currentEditMode ? (
          /* EDIT TASK FORM */
          <form onSubmit={handleSave}>
            {/* 1. Task Information */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '16px', border: '1px solid var(--border)' }}>
              <h4 style={{ color: 'var(--accent-primary)', fontSize: '0.92rem', fontWeight: 800, marginBottom: '12px' }}>1. Task Information</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Priority *</label>
                  <select className="form-control" value={priority} onChange={(e) => setPriority(e.target.value)}>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Task Title *</label>
                <input type="text" className="form-control" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Description</label>
                <textarea className="form-control" style={{ minHeight: '65px' }} value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Brand</label>
                  <select className="form-control" value={businessEntity} onChange={(e) => setBusinessEntity(e.target.value)}>
                    {dynamicBizList.length > 0 ? (
                      dynamicBizList.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))
                    ) : (
                      <option value="Company X (Shared)">Company X (Shared)</option>
                    )}
                  </select>
                </div>
                <div style={{ position: 'relative' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Department(s)
                  </label>
                  
                  {/* Custom Multi-Select Dropdown Button */}
                  <button
                    type="button"
                    onClick={() => setDeptDropdownOpen(!deptDropdownOpen)}
                    className="form-control"
                    style={{
                      display: 'flex',
                      justify: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      textAlign: 'left',
                      background: '#ffffff',
                      color: selectedDepartments.length > 0 ? '#1e293b' : '#94a3b8',
                      fontWeight: selectedDepartments.length > 0 ? 600 : 400
                    }}
                  >
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {selectedDepartments.length > 0 
                        ? selectedDepartments.join(', ')
                        : `🏢 ${department || 'Select department(s)...'}`}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: '6px' }}>
                      {deptDropdownOpen ? '▲' : '▼'}
                    </span>
                  </button>

                  {/* Dropdown Menu Overlay */}
                  {deptDropdownOpen && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '4px',
                      background: '#ffffff',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                      zIndex: 999,
                      maxHeight: '180px',
                      overflowY: 'auto',
                      padding: '6px'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '4px 8px 6px',
                        borderBottom: '1px solid #e2e8f0',
                        marginBottom: '4px',
                        position: 'sticky',
                        top: 0,
                        background: '#ffffff',
                        zIndex: 10
                      }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b' }}>
                          {selectedDepartments.length} selected
                        </span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setDeptDropdownOpen(false); }}
                          style={{
                            background: 'var(--brand-600, #4f46e5)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '2px 8px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          ✕ Close
                        </button>
                      </div>
                      {departments.length > 0 ? (
                        departments.map(d => d.Name || d.name || d).map(deptName => {
                          const isChecked = selectedDepartments.includes(deptName);
                          return (
                            <div
                              key={deptName}
                              onClick={() => toggleDepartment(deptName)}
                              style={{
                                padding: '7px 10px',
                                borderRadius: '6px',
                                fontSize: '0.82rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: isChecked ? '#fff7ed' : 'transparent',
                                color: isChecked ? '#ea580c' : '#334155',
                                fontWeight: isChecked ? 600 : 400,
                                transition: 'background 0.1s ease'
                              }}
                              onMouseEnter={e => { if (!isChecked) e.currentTarget.style.background = '#f8fafc'; }}
                              onMouseLeave={e => { if (!isChecked) e.currentTarget.style.background = isChecked ? '#fff7ed' : 'transparent'; }}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                readOnly
                                style={{ accentColor: '#f97316', cursor: 'pointer' }}
                              />
                              <span>{deptName}</span>
                            </div>
                          );
                        })
                      ) : (
                        <div style={{ padding: '10px', fontSize: '0.8125rem', color: '#97a0af', textAlign: 'center' }}>
                          No departments added yet
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Associated Project</label>
                <select className="form-control" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                  <option value="">No Associated Project (General Task)</option>
                  {projects.map(p => (
                    <option key={p.ProjectID} value={p.ProjectID}>
                      📁 {p.Title} ({p.BusinessEntity})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2. Status, Timeline & Story Points */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '16px', border: '1px solid var(--border)' }}>
              <h4 style={{ color: 'var(--accent-primary)', fontSize: '0.92rem', fontWeight: 800, marginBottom: '12px' }}>2. Timeline, Status & Story Points</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Status</label>
                  <select className="form-control" value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="In Review">In Review</option>
                    <option value="Stuck/Blocked">Stuck/Blocked</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Start Date</label>
                  <input type="date" className="form-control" value={startDate} onChange={(e) => handleStartDateChange(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Days Allowed</label>
                  <input type="number" className="form-control" value={daysAllowed} onChange={(e) => handleDaysAllowedChange(e.target.value)} min="0" />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Due Date</label>
                  <input type="date" className="form-control" value={dueDate} onChange={(e) => handleDueDateChange(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Story Points *</label>
                  {task?.Subtasks && task.Subtasks.length > 0 ? (
                    <div className="form-control" style={{ background: '#ffffff', color: '#16a34a', fontWeight: 700 }}>
                      {task.StoryPoints || 0} SP (Sub-Tasks Sum)
                    </div>
                  ) : (
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      className="form-control"
                      value={storyPoints}
                      onChange={(e) => setStoryPoints(e.target.value)}
                      required
                    />
                  )}
                </div>
              </div>
            </div>

            {/* 3. Section 3: Assignment */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '16px', border: '1px solid var(--border)' }}>
              <h4 style={{ color: 'var(--accent-primary)', fontSize: '0.92rem', fontWeight: 800, marginBottom: '12px' }}>3. Assignment</h4>
              <div style={{ position: 'relative' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Assigned Employee(s)
                </label>

                {storedUser?.role === 'TeamMember' ? (
                  <div style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    background: '#ffffff',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#1e293b'
                  }}>
                    👤 {selectedAssignees.length > 0 
                      ? users.filter(u => selectedAssignees.includes(u.UserID)).map(u => u.FullName).join(', ')
                      : (task?.AssigneeName || 'Assigned to Me')}
                  </div>
                ) : (
                  <>
                    {/* Custom Multi-Select Dropdown Button */}
                    <button
                      type="button"
                      onClick={() => setAssigneeDropdownOpen(!assigneeDropdownOpen)}
                      className="form-control"
                      style={{
                        display: 'flex',
                        justify: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        textAlign: 'left',
                        background: '#ffffff',
                        color: selectedAssignees.length > 0 ? '#1e293b' : '#94a3b8',
                        fontWeight: selectedAssignees.length > 0 ? 600 : 400
                      }}
                    >
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {selectedAssignees.length > 0 
                          ? users.filter(u => selectedAssignees.includes(u.UserID)).map(u => u.FullName).join(', ')
                          : '👤 Select employee(s)...'}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: '6px' }}>
                        {assigneeDropdownOpen ? '▲' : '▼'}
                      </span>
                    </button>

                    {/* Dropdown Menu Overlay */}
                    {assigneeDropdownOpen && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '4px',
                        background: '#ffffff',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                        zIndex: 999,
                        maxHeight: '180px',
                        overflowY: 'auto',
                        padding: '6px'
                      }}>
                        <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '4px 8px 6px',
                        borderBottom: '1px solid #e2e8f0',
                        marginBottom: '4px',
                        position: 'sticky',
                        top: 0,
                        background: '#ffffff',
                        zIndex: 10
                      }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b' }}>
                          {selectedAssignees.length} selected
                        </span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setAssigneeDropdownOpen(false); }}
                          style={{
                            background: 'var(--brand-600, #4f46e5)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '2px 8px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          ✕ Close
                        </button>
                      </div>
                      {users.map(u => {
                          const isChecked = selectedAssignees.includes(u.UserID);
                          return (
                            <div
                              key={u.UserID}
                              onClick={() => toggleAssignee(u.UserID)}
                              style={{
                                padding: '7px 10px',
                                borderRadius: '6px',
                                fontSize: '0.82rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: isChecked ? '#fff7ed' : 'transparent',
                                color: isChecked ? '#ea580c' : '#334155',
                                fontWeight: isChecked ? 600 : 400,
                                transition: 'background 0.1s ease'
                              }}
                              onMouseEnter={e => { if (!isChecked) e.currentTarget.style.background = '#f8fafc'; }}
                              onMouseLeave={e => { if (!isChecked) e.currentTarget.style.background = isChecked ? '#fff7ed' : 'transparent'; }}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                readOnly
                                style={{ accentColor: '#f97316', cursor: 'pointer' }}
                              />
                              <span>{u.FullName} <span style={{ color: '#94a3b8', fontSize: '0.74rem' }}>({u.Department || u.Role})</span></span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* 4. Section 4: Linked Sub-Tasks & Add Extra Sub-Task Button */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '16px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ color: 'var(--accent-primary)', fontSize: '0.92rem', fontWeight: 800, margin: 0 }}>
                  4. Linked Sub-Tasks ({task?.Subtasks ? task.Subtasks.length : 0})
                </h4>
                <button type="button" className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '0.8rem', borderRadius: '8px' }} onClick={handleAddExtraSubtask}>
                  + Add Extra Sub-Task
                </button>
              </div>

              {/* Existing Subtasks */}
              {task?.Subtasks && task.Subtasks.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                  {task.Subtasks.map(st => (
                    <div key={st.TaskID} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <div>
                        <span className="badge badge-sub-task" style={{ marginRight: '6px' }}>📌 SUB</span>
                        <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{st.Title}</strong>
                        <small style={{ color: 'var(--text-secondary)', marginLeft: '8px' }}>({st.Department})</small>
                        <div style={{ fontSize: '0.74rem', color: '#ea580c', fontWeight: 600, marginTop: '2px' }}>
                          👤 Assigned: {st.AssigneeName || 'Unassigned'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="badge" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', fontSize: '0.74rem', fontWeight: 700 }}>{st.StoryPoints || 0} SP</span>
                        <span className="badge badge-medium">{st.Status}</span>
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ padding: '2px 8px', fontSize: '0.74rem', color: '#16a34a', borderColor: '#bbf7d0', borderRadius: '6px' }}
                          onClick={() => setActiveCommentTask({ id: st.TaskID, title: st.Title })}
                        >
                          💬 Comment
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>No existing sub-tasks linked to this main task.</p>
              )}

              {/* Newly Added Extra Subtask Rows */}
              {extraSubtasks.map(st => (
                <div key={st.id} style={{ display: 'flex', gap: '8px', marginTop: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Extra sub-task title..."
                    style={{ flex: 2, minWidth: '150px' }}
                    value={st.title}
                    onChange={(e) => handleUpdateExtraSubtask(st.id, 'title', e.target.value)}
                    required
                  />
                  <select className="form-control" style={{ flex: 1, minWidth: '110px' }} value={st.department} onChange={(e) => handleUpdateExtraSubtask(st.id, 'department', e.target.value)}>
                    {departments.length > 0 ? (
                      departments.map(d => {
                        const dName = d.Name || d.name || d;
                        return <option key={d.DepartmentID || dName} value={dName}>{dName}</option>;
                      })
                    ) : (
                      <option value="">No departments added</option>
                    )}
                  </select>
                  {/* Custom Multi-Select Subtask Assignees Dropdown */}
                  <div style={{ position: 'relative', flex: 1.2, minWidth: '130px' }}>
                    <button
                      type="button"
                      onClick={() => setActiveSubtaskDropdownId(activeSubtaskDropdownId === st.id ? null : st.id)}
                      className="form-control"
                      style={{
                        display: 'flex',
                        justify: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        textAlign: 'left',
                        background: '#ffffff',
                        color: (Array.isArray(st.assignedTo) ? st.assignedTo.length > 0 : st.assignedTo) ? '#1e293b' : '#94a3b8',
                        fontSize: '0.8rem'
                      }}
                    >
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {(() => {
                          const list = Array.isArray(st.assignedTo)
                            ? st.assignedTo
                            : (st.assignedTo ? String(st.assignedTo).split(',').map(s => s.trim()).filter(Boolean) : []);
                          return list.length > 0
                            ? users.filter(u => list.includes(u.UserID)).map(u => u.FullName).join(', ')
                            : '👤 Assignee(s)...';
                        })()}
                      </span>
                      <span style={{ fontSize: '0.65rem', color: '#94a3b8', marginLeft: '4px' }}>
                        {activeSubtaskDropdownId === st.id ? '▲' : '▼'}
                      </span>
                    </button>

                    {activeSubtaskDropdownId === st.id && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '4px',
                        background: '#ffffff',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                        zIndex: 999,
                        maxHeight: '160px',
                        overflowY: 'auto',
                        padding: '6px'
                      }}>
                        <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '4px 6px 6px',
                        borderBottom: '1px solid #e2e8f0',
                        marginBottom: '4px',
                        position: 'sticky',
                        top: 0,
                        background: '#ffffff',
                        zIndex: 10
                      }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b' }}>
                          Assignee
                        </span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setActiveSubtaskDropdownId(null); }}
                          style={{
                            background: 'var(--brand-600, #4f46e5)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '2px 8px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          ✕ Close
                        </button>
                      </div>
                      {users.map(u => {
                          const list = Array.isArray(st.assignedTo)
                            ? st.assignedTo
                            : (st.assignedTo ? String(st.assignedTo).split(',').map(s => s.trim()).filter(Boolean) : []);
                          const isChecked = list.includes(u.UserID);
                          return (
                            <div
                              key={u.UserID}
                              onClick={() => toggleExtraSubtaskAssignee(st.id, u.UserID)}
                              style={{
                                padding: '6px 8px',
                                borderRadius: '4px',
                                fontSize: '0.78rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: isChecked ? '#fff7ed' : 'transparent',
                                color: isChecked ? '#ea580c' : '#334155',
                                fontWeight: isChecked ? 600 : 400
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                readOnly
                                style={{ accentColor: '#f97316', cursor: 'pointer' }}
                              />
                              <span>{u.FullName}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ffffff', padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 700 }}>SP:</span>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      className="form-control"
                      style={{ width: '55px', padding: '2px 4px', fontSize: '0.78rem' }}
                      value={st.storyPoints}
                      onChange={(e) => handleUpdateExtraSubtask(st.id, 'storyPoints', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <button type="button" className="btn btn-outline" style={{ color: '#dc2626', borderColor: '#fca5a5', padding: '4px 10px', borderRadius: '8px' }} onClick={() => handleRemoveExtraSubtask(st.id)}>
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" className="btn btn-outline" onClick={onClose} style={{ borderRadius: '10px' }}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ borderRadius: '10px' }}>
                {saving ? 'Saving...' : 'Save Changes & Sub-Tasks'}
              </button>
            </div>
          </form>
        ) : (
          /* READ-ONLY TASK VIEW */
          <div>
            <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', marginBottom: '18px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Task Description</div>
              <div style={{ fontSize: '0.94rem', marginTop: '4px', color: 'var(--text-primary)' }}>{task?.Description || 'No description provided.'}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px', fontSize: '0.88rem' }}>
              <div><span style={{ color: 'var(--text-secondary)' }}>Main Heading:</span> <strong>{task?.MainHeading}</strong></div>
              <div><span style={{ color: 'var(--text-secondary)' }}>Entity:</span> <strong>{task?.BusinessEntity}</strong></div>
              <div><span style={{ color: 'var(--text-secondary)' }}>Department:</span> <strong>{task?.Department}</strong></div>
              <div><span style={{ color: 'var(--text-secondary)' }}>Story Points:</span> <strong style={{ color: '#16a34a' }}>{task?.StoryPoints || 0} SP ({(task?.StoryPoints || 0) * (departments.find(d => (d.Name || '').toLowerCase() === (task?.Department || '').toLowerCase())?.MinutesPerStoryPoint || 60)} mins)</strong></div>
              <div><span style={{ color: 'var(--text-secondary)' }}>Priority:</span> <strong>{task?.Priority}</strong></div>
              <div><span style={{ color: 'var(--text-secondary)' }}>Status:</span> <strong>{task?.Status}</strong></div>
              <div><span style={{ color: 'var(--text-secondary)' }}>Pace:</span> <strong>{task?.PaceStatus}</strong></div>
              <div><span style={{ color: 'var(--text-secondary)' }}>Assigned To:</span> <strong>{task?.AssigneeName || 'Unassigned'}</strong></div>
              <div><span style={{ color: 'var(--text-secondary)' }}>Due Date:</span> <strong>{task?.DueDate || 'None'}</strong></div>
            </div>

            {/* Linked Subtasks */}
            {task?.Subtasks && task.Subtasks.length > 0 && (
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', marginBottom: '18px', border: '1px solid var(--border)' }}>
                <h4 style={{ color: 'var(--accent-primary)', fontSize: '0.92rem', fontWeight: 800, marginBottom: '10px' }}>
                  Linked Sub-Tasks ({task.Subtasks.length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {task.Subtasks.map(st => (
                    <div
                      key={st.TaskID}
                      onClick={() => {
                        setCurrentTaskId(st.TaskID);
                        setCurrentEditMode(false);
                      }}
                      title="Click to view Sub-Task details"
                      style={{
                        display: 'flex',
                        justify: 'space-between',
                        alignItems: 'center',
                        background: '#ffffff',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ea580c'; e.currentTarget.style.background = '#fff7ed'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = '#ffffff'; }}
                    >
                      <div>
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>📌 {st.Title}</span>
                        <small style={{ color: 'var(--text-secondary)', marginLeft: '8px' }}>({st.Department})</small>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="badge badge-medium">{st.Status}</span>
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ padding: '2px 8px', fontSize: '0.74rem', color: '#16a34a', borderColor: '#bbf7d0', borderRadius: '6px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveSubtaskCommentId(st.TaskID);
                            fetchComments(st.TaskID);
                            const el = document.getElementById('comments-section');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          💬 Comment
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* READ-ONLY COMMENTS FEED SECTION */}
            <div id="comments-section" style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px', marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    💬 Comments & Activity ({comments.length})
                  </h4>
                  {activeSubtaskCommentId && (
                    <span style={{ fontSize: '0.78rem', color: '#ea580c', fontWeight: 600 }}>
                      Viewing subtask: <strong>{task?.Subtasks?.find(st => st.TaskID === activeSubtaskCommentId)?.Title || activeSubtaskCommentId}</strong>
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {activeSubtaskCommentId && (
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ padding: '3px 10px', fontSize: '0.76rem', borderRadius: '6px' }}
                      onClick={() => { setActiveSubtaskCommentId(null); fetchComments(taskId); }}
                    >
                      ← Main Task Comments
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ padding: '5px 12px', fontSize: '0.78rem', background: '#ea580c', borderRadius: '6px' }}
                    onClick={() => setActiveCommentTask({ id: activeSubtaskCommentId || taskId, title: task?.Title })}
                  >
                    + Write Comment & Tag
                  </button>
                </div>
              </div>

              {/* Read-Only Comments List */}
              {commentsLoading ? (
                <div style={{ fontSize: '0.82rem', color: '#94a3b8', textAlign: 'center', padding: '16px' }}>Loading comments...</div>
              ) : comments.length === 0 ? (
                <div style={{ fontSize: '0.82rem', color: '#94a3b8', textAlign: 'center', padding: '20px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #e2e8f0' }}>
                  No comments posted yet. Click "+ Write Comment & Tag" above to post a comment!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
                  {comments.map(c => (
                    <div key={c.CommentID} style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.84rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          👤 {c.UserName || c.UserID}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                          {new Date(c.CreatedAt).toLocaleString()}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.86rem', color: '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.45, marginBottom: '6px' }}>
                        {c.CommentText}
                      </div>

                      {c.DocumentURL && (
                        <div style={{ fontSize: '0.78rem', marginTop: '6px' }}>
                          📄 <a href={c.DocumentURL} target="_blank" rel="noopener noreferrer" style={{ color: '#ea580c', fontWeight: 700, textDecoration: 'underline' }}>
                            View Attached File
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Comment Modal Popup (For Writing New Comments) */}
        {activeCommentTask && (
          <CommentModal
            taskId={activeCommentTask.id}
            taskTitle={activeCommentTask.title}
            onClose={() => {
              setActiveCommentTask(null);
              fetchComments(activeSubtaskCommentId || taskId);
            }}
            token={token}
            users={users}
          />
        )}
      </div>
    </div>,
    document.body
  );
}
