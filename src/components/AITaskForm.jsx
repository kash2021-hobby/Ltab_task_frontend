import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';

export default function AITaskForm({ onClose, token, users = [], departments = [], projects = [], businesses = [], user, onRefresh }) {
  const [creationMode, setCreationMode] = useState(null); // null (selector), 'ai', 'manual', 'conversational'
  const [convStep, setConvStep] = useState(1); // 1..6
  const [aiAutoFilled, setAiAutoFilled] = useState(false);

  const storedUser = user || JSON.parse(localStorage.getItem('user') || '{}');
  const userBizStr = storedUser?.business_entities || storedUser?.BusinessEntities || '';
  const userAssignedBizs = userBizStr ? userBizStr.split(',').map(s => s.trim()).filter(Boolean) : [];

  const fetchedBizNames = Array.isArray(businesses) ? businesses.map(b => (typeof b === 'string' ? b : b?.name)).filter(Boolean) : [];
  const combinedBizSet = new Set([...fetchedBizNames, ...userAssignedBizs]);
  const dynamicBizList = Array.from(combinedBizSet);

  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [mainHeading, setMainHeading] = useState('Operations');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [businessEntity, setBusinessEntity] = useState(dynamicBizList[0] || 'Company X (Shared)');
  const [department, setDepartment] = useState(departments[0]?.Name || 'Operations');
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
  const [priority, setPriority] = useState('Normal');
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [assignedBy, setAssignedBy] = useState('');

  const toggleAssignee = (userId) => {
    if (selectedAssignees.includes(userId)) {
      setSelectedAssignees(selectedAssignees.filter(id => id !== userId));
    } else {
      setSelectedAssignees([...selectedAssignees, userId]);
    }
  };

  const [documentLinks, setDocumentLinks] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles([...selectedFiles, ...Array.from(e.target.files)]);
    }
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [daysAllowed, setDaysAllowed] = useState(3);
  const [dueDate, setDueDate] = useState('');

  // Auto-calculate Days Allowed when Start Date and Due Date change
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

  const [estimatedBudget, setEstimatedBudget] = useState(0);
  const [storyPoints, setStoryPoints] = useState(1);
  const [remarks, setRemarks] = useState('');
  
  // Sub-tasks array state
  const [subtasks, setSubtasks] = useState([]);
  const [activeSubtaskDropdownId, setActiveSubtaskDropdownId] = useState(null);

  const toggleSubtaskAssignee = (subtaskId, userId) => {
    setSubtasks(prev => prev.map(st => {
      if (st.id !== subtaskId) return st;
      const currentList = Array.isArray(st.AssignedTo)
        ? st.AssignedTo
        : (st.AssignedTo ? String(st.AssignedTo).split(',').map(s => s.trim()).filter(Boolean) : []);
      
      const newList = currentList.includes(userId)
        ? currentList.filter(id => id !== userId)
        : [...currentList, userId];
      
      return { ...st, AssignedTo: newList };
    }));
  };

  const handleAddSubtaskRow = () => {
    setSubtasks(prev => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        Title: '',
        Department: department || 'Operations',
        AssignedTo: [],
        StoryPoints: 1
      }
    ]);
  };

  const handleRemoveSubtaskRow = (id) => {
    setSubtasks(prev => prev.filter(st => st.id !== id));
  };

  const handleUpdateSubtaskRow = (id, field, value) => {
    setSubtasks(prev => prev.map(st => st.id === id ? { ...st, [field]: value } : st));
  };

  const handleGenerateAI = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    try {
      const res = await axios.post('/api/ai/autofill', { prompt }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        const d = res.data.data;
        setMainHeading(d.MainHeading || 'Operations');
        setTitle(d.Title || prompt);
        setDescription(d.Description || prompt);
        setBusinessEntity(d.BusinessEntity || 'Company X (Shared)');
        setDepartment(d.Department || 'Operations');
        if (d.Department) setSelectedDepartments([d.Department]);
        setPriority(d.Priority || 'Medium');
        setDaysAllowed(d.DaysAllowed || 3);
        
        if (d.Subtasks && Array.isArray(d.Subtasks)) {
          setSubtasks(d.Subtasks.map((st, idx) => ({
            id: Date.now() + idx,
            Title: typeof st === 'string' ? st : st.Title,
            Department: st.Department || d.Department || 'Operations',
            AssignedTo: []
          })));
        }
        setAiAutoFilled(true);
      }
    } catch (err) {
      console.error('AI generation error:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateTask = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);

    try {
      const calculatedSP = subtasks.length > 0
        ? subtasks.reduce((sum, st) => sum + (parseFloat(st.StoryPoints) || 0), 0)
        : (parseFloat(storyPoints) || 0);

      const res = await axios.post('/api/tasks', {
        MainHeading: mainHeading,
        Title: title || 'Untitled Task',
        Description: description,
        BusinessEntity: businessEntity,
        Department: selectedDepartments.length > 0 ? selectedDepartments.join(', ') : (department || 'Operations'),
        ProjectID: projectId || null,
        Priority: priority,
        AssignedTo: selectedAssignees.join(', '),
        AssignedBy: assignedBy,
        DocumentLinks: documentLinks,
        StartDate: startDate,
        DaysAllowed: parseInt(daysAllowed, 10) || 0,
        DueDate: dueDate,
        EstimatedBudget: parseFloat(estimatedBudget) || 0,
        Remarks: remarks,
        StoryPoints: calculatedSP,
        Subtasks: subtasks.map(st => ({
          ...st,
          AssignedTo: Array.isArray(st.AssignedTo) ? st.AssignedTo.join(', ') : (st.AssignedTo || '')
        }))
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        const createdTaskId = res.data.data?.task_id || res.data.data?.TaskID;

        // Upload files if selected and associated project exists
        if (selectedFiles.length > 0 && projectId) {
          try {
            const formData = new FormData();
            selectedFiles.forEach(f => {
              formData.append('documents', f);
            });

            const uploadRes = await axios.post(`/api/projects/${projectId}/documents`, formData, {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
              }
            });

            if (uploadRes.data.success && uploadRes.data.data && uploadRes.data.data.length > 0 && createdTaskId) {
              const uploadedUrls = uploadRes.data.data.map(d => d.url).join(', ');
              const finalLinks = documentLinks ? `${documentLinks}, ${uploadedUrls}` : uploadedUrls;

              await axios.put(`/api/tasks/${createdTaskId}`, {
                updates: {
                  DocumentLinks: finalLinks
                }
              }, {
                headers: { Authorization: `Bearer ${token}` }
              });
            }
          } catch (uploadErr) {
            console.error('File upload to project folder error:', uploadErr);
          }
        }

        onRefresh();
        onClose();
      }
    } catch (err) {
      console.error('Create task error:', err);
    } finally {
      setSaving(false);
    }
  };

  // ─── shared style tokens ───────────────────────────────────────────────────
  const fieldSt = { marginBottom: '14px' };
  const labelSt = {
    display: 'block',
    fontSize: '9.5px',
    fontWeight: 700,
    letterSpacing: '.13em',
    textTransform: 'uppercase',
    color: 'var(--text-secondary, #8A8578)',
    marginBottom: '7px'
  };
  const optSt = {
    fontWeight: 500,
    letterSpacing: '.01em',
    textTransform: 'none',
    fontSize: '10.5px',
    marginLeft: '6px',
    color: 'var(--text-secondary, #8A8578)'
  };

  // ─── Reusable assignee multi-select dropdown ─────────────────────────────────
  const renderAssigneeDropdown = () => (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setAssigneeDropdownOpen(!assigneeDropdownOpen)}
        className="form-control"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
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
            : 'Select person…'}
        </span>
        <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: '6px', flexShrink: 0 }}>
          {assigneeDropdownOpen ? '▲' : '▼'}
        </span>
      </button>

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
                  background: isChecked ? '#f0fdf4' : 'transparent',
                  color: isChecked ? '#15803d' : '#334155',
                  fontWeight: isChecked ? 600 : 400,
                  transition: 'background 0.1s ease'
                }}
                onMouseEnter={e => { if (!isChecked) e.currentTarget.style.background = '#f8fafc'; }}
                onMouseLeave={e => { if (!isChecked) e.currentTarget.style.background = 'transparent'; }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  readOnly
                  style={{ accentColor: '#16a34a', cursor: 'pointer' }}
                />
                <span>{u.FullName} <span style={{ color: '#94a3b8', fontSize: '0.74rem' }}>({u.Department || u.Role})</span></span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ─── Reusable dept multi-select dropdown ─────────────────────────────────────
  const renderDeptDropdown = () => (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setDeptDropdownOpen(!deptDropdownOpen)}
        className="form-control"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
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
            : `${department || 'Select department…'}`}
        </span>
        <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: '6px', flexShrink: 0 }}>
          {deptDropdownOpen ? '▲' : '▼'}
        </span>
      </button>

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
                    background: isChecked ? '#f0fdf4' : 'transparent',
                    color: isChecked ? '#15803d' : '#334155',
                    fontWeight: isChecked ? 600 : 400
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    style={{ accentColor: '#16a34a' }}
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
  );

  // Helper to render Full Form
  const renderFullTaskForm = () => (
    <form onSubmit={handleCreateTask}>

      {/* ── 1. What needs doing ─────────────────────────────────────────────── */}
      <div style={fieldSt}>
        <label style={labelSt}>What needs doing</label>
        <input
          type="text"
          className="form-control"
          placeholder="e.g. Prepare quotation for MedPlus…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
        />
      </div>

      {/* ── 2. Who's doing it ───────────────────────────────────────────────── */}
      <div style={fieldSt}>
        <label style={labelSt}>Who's doing it</label>
        {renderAssigneeDropdown()}
      </div>

      {/* ── 3. Due · Priority · Brand (3-column) ────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
        <div>
          <label style={labelSt}>Due</label>
          <input
            type="date"
            className="form-control"
            value={dueDate}
            onChange={(e) => handleDueDateChange(e.target.value)}
          />
        </div>
        <div>
          <label style={labelSt}>Priority</label>
          <select className="form-control" value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="Normal">Normal</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>
        <div>
          <label style={labelSt}>Brand</label>
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
      </div>

      {/* ── 4. Department ───────────────────────────────────────────────────── */}
      <div style={fieldSt}>
        <label style={labelSt}>Department</label>
        {renderDeptDropdown()}
      </div>

      {/* ── 5. Detail (optional) ────────────────────────────────────────────── */}
      <div style={fieldSt}>
        <label style={labelSt}>
          Detail <span style={optSt}>optional</span>
        </label>
        <textarea
          className="form-control"
          style={{ minHeight: '60px', resize: 'vertical' }}
          placeholder="Anything worth writing down…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* ── 6. Story Points (kept per user request) ─────────────────────────── */}
      <div style={fieldSt}>
        <label style={{ ...labelSt, color: '#16a34a' }}>Story points</label>
        <input
          type="number"
          step="0.5"
          min="0.5"
          className="form-control"
          value={storyPoints}
          onChange={(e) => setStoryPoints(e.target.value)}
          placeholder="e.g. 3"
          style={{ fontWeight: 700, color: '#16a34a', maxWidth: '140px' }}
        />
      </div>

      {/* ── More options toggle ──────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setShowMoreOptions(!showMoreOptions)}
        style={{
          background: 'none',
          border: 0,
          color: 'var(--brand-600, #9A7B3F)',
          fontFamily: 'inherit',
          fontSize: '12.5px',
          fontWeight: 600,
          cursor: 'pointer',
          padding: '10px 0 0',
          letterSpacing: '.01em',
          display: 'block'
        }}
      >
        {showMoreOptions ? '− Fewer options' : '+ More options'}
      </button>

      {/* ── More options panel ───────────────────────────────────────────────── */}
      {showMoreOptions && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>

          {/* Associated Project */}
          <div style={fieldSt}>
            <label style={labelSt}>Project <span style={optSt}>optional</span></label>
            <select className="form-control" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">None</option>
              {projects.map(p => (
                <option key={p.ProjectID} value={p.ProjectID}>
                  {p.Title} ({p.BusinessEntity})
                </option>
              ))}
            </select>
          </div>

          {/* Budget */}
          <div style={fieldSt}>
            <label style={labelSt}>Budget (₹) <span style={optSt}>optional</span></label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              placeholder="—"
              value={estimatedBudget}
              onChange={(e) => setEstimatedBudget(e.target.value)}
              style={{ maxWidth: '200px' }}
            />
          </div>

          {/* Documents */}
          <div style={fieldSt}>
            <label style={labelSt}>Documents <span style={optSt}>optional</span></label>
            <input
              type="text"
              className="form-control"
              placeholder="Add a link, e.g. https://docs.google.com/…"
              value={documentLinks}
              onChange={(e) => setDocumentLinks(e.target.value)}
              style={{ marginBottom: '8px' }}
            />
            {!projectId ? (
              <div style={{ padding: '8px 12px', borderRadius: '6px', border: '1px dashed #cbd5e1', background: '#f8fafc', color: '#94a3b8', fontSize: '0.78rem' }}>
                Select a project above to enable file upload to Google Drive.
              </div>
            ) : (
              <div>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '6px', border: '1px solid var(--border)', background: '#f8fafc', color: '#475569', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
                  + Attach file
                  <input type="file" multiple onChange={handleFileSelect} style={{ display: 'none' }} />
                </label>
                {selectedFiles.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '8px' }}>
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}>
                        <span style={{ color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '340px' }}>
                          {file.name} <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>({(file.size / 1024).toFixed(1)} KB)</span>
                        </span>
                        <button type="button" onClick={() => handleRemoveFile(idx)} style={{ border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', padding: '0 4px' }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Remarks */}
          <div style={fieldSt}>
            <label style={labelSt}>Remarks <span style={optSt}>optional</span></label>
            <input type="text" className="form-control" placeholder="Notes…" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </div>

          {/* Subtasks */}
          <div style={fieldSt}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={labelSt}>Subtasks <span style={optSt}>optional</span></label>
              <button type="button" className="btn btn-outline" style={{ padding: '2px 10px', fontSize: '0.78rem' }} onClick={handleAddSubtaskRow}>
                + Add subtask
              </button>
            </div>

            {subtasks.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>No subtasks yet. Click "+ Add subtask" to split the work.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {subtasks.map((st) => (
                  <div key={st.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr 0.8fr auto', gap: '8px', alignItems: 'center', background: '#ffffff', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    <input
                      type="text"
                      placeholder="Subtask title…"
                      className="form-control"
                      value={st.Title}
                      onChange={(e) => handleUpdateSubtaskRow(st.id, 'Title', e.target.value)}
                    />
                    <select
                      className="form-control"
                      value={st.Department}
                      onChange={(e) => handleUpdateSubtaskRow(st.id, 'Department', e.target.value)}
                    >
                      {departments.length > 0 ? (
                        departments.map(d => {
                          const dName = d.Name || d.name || d;
                          return <option key={d.DepartmentID || dName} value={dName}>{dName}</option>;
                        })
                      ) : (
                        <option value="">No departments added</option>
                      )}
                    </select>

                    <div style={{ position: 'relative' }}>
                      <button
                        type="button"
                        onClick={() => setActiveSubtaskDropdownId(activeSubtaskDropdownId === st.id ? null : st.id)}
                        className="form-control"
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                          fontSize: '0.78rem',
                          background: '#ffffff',
                          color: (Array.isArray(st.AssignedTo) ? st.AssignedTo : []).length > 0 ? '#1e293b' : '#94a3b8'
                        }}
                      >
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {(Array.isArray(st.AssignedTo) ? st.AssignedTo : []).length > 0
                            ? users.filter(u => (st.AssignedTo || []).includes(u.UserID)).map(u => u.FullName).join(', ')
                            : 'Assignee(s)'}
                        </span>
                        <span style={{ fontSize: '0.65rem' }}>▼</span>
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
                          padding: '4px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 6px 6px', borderBottom: '1px solid #e2e8f0', marginBottom: '4px', position: 'sticky', top: 0, background: '#ffffff', zIndex: 10 }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b' }}>Assignee</span>
                            <button type="button" onClick={(e) => { e.stopPropagation(); setActiveSubtaskDropdownId(null); }} style={{ background: 'var(--brand-600, #4f46e5)', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}>✕ Close</button>
                          </div>
                          {users.map(u => {
                            const currentList = Array.isArray(st.AssignedTo)
                              ? st.AssignedTo
                              : (st.AssignedTo ? String(st.AssignedTo).split(',').map(s => s.trim()).filter(Boolean) : []);
                            const isChecked = currentList.includes(u.UserID);
                            return (
                              <div
                                key={u.UserID}
                                onClick={() => toggleSubtaskAssignee(st.id, u.UserID)}
                                style={{ padding: '5px 8px', borderRadius: '4px', fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', background: isChecked ? '#f0fdf4' : 'transparent', color: isChecked ? '#15803d' : '#334155' }}
                              >
                                <input type="checkbox" checked={isChecked} readOnly style={{ accentColor: '#16a34a' }} />
                                <span>{u.FullName}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <input
                      type="number"
                      placeholder="SP"
                      className="form-control"
                      value={st.StoryPoints}
                      onChange={(e) => handleUpdateSubtaskRow(st.id, 'StoryPoints', e.target.value)}
                      min="0.5"
                      step="0.5"
                    />

                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ color: 'var(--danger)', borderColor: 'var(--danger)', padding: '2px 8px' }}
                      onClick={() => handleRemoveSubtaskRow(st.id)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Buttons ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
        <button
          type="submit"
          disabled={saving}
          style={{
            background: 'var(--ink, #141B2D)',
            color: '#fff',
            border: '1px solid var(--ink, #141B2D)',
            borderRadius: '999px',
            padding: '10px 24px',
            fontSize: '13px',
            fontWeight: 600,
            fontFamily: 'inherit',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
            transition: 'opacity 0.15s'
          }}
        >
          {saving ? 'Creating task…' : 'Create task'}
        </button>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none',
            border: 0,
            color: 'var(--text-secondary, #8A8578)',
            fontFamily: 'inherit',
            fontSize: '13px',
            cursor: 'pointer',
            padding: '10px 8px'
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );

  return ReactDOM.createPortal(
    <div className="modal-overlay">
      <div className="modal-content" style={{ width: '100%', maxWidth: '840px', maxHeight: '90vh', overflowY: 'auto' }}>
        
        {/* MODE SELECTOR MODAL (creationMode === null) */}
        {creationMode === null && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>🚀 Create New Task</h3>
              <button className="btn btn-outline" onClick={onClose}>✕</button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
                Please select how you would like to create your new task:
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              {/* Card 1: AI Auto-Fill */}
              <div
                onClick={() => setCreationMode('ai')}
                style={{
                  background: 'linear-gradient(135deg, #fff7ed, #ffffff)',
                  border: '1.5px solid #fdba74',
                  borderRadius: '12px',
                  padding: '22px 16px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(249, 115, 22, 0.08)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#f97316'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#fdba74'}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>✨</div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', fontWeight: 700, color: '#ea580c' }}>
                  AI Auto-Fill
                </h4>
                <p style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.45, margin: '0 0 16px 0', minHeight: '50px' }}>
                  Write a prompt. AI will automatically extract details, department & subtasks into the form for final review.
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', fontSize: '0.82rem', borderRadius: '8px', background: 'linear-gradient(135deg, #ea580c, #f97316)' }}
                >
                  ✨ Use AI Auto-Fill
                </button>
              </div>

              {/* Card 2: Manual Task */}
              <div
                onClick={() => setCreationMode('manual')}
                style={{
                  background: '#ffffff',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '12px',
                  padding: '22px 16px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#64748b'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📝</div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', fontWeight: 700, color: '#1e293b' }}>
                  Manual Task
                </h4>
                <p style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.45, margin: '0 0 16px 0', minHeight: '50px' }}>
                  Directly fill out the standard complete task form with all fields (Title, Priority, Project, Department, Assignees).
                </p>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ width: '100%', justifyContent: 'center', fontSize: '0.82rem', borderRadius: '8px' }}
                >
                  📝 Open Task Form
                </button>
              </div>

              {/* Card 3: Conversational Task */}
              <div
                onClick={() => { setCreationMode('conversational'); setConvStep(1); }}
                style={{
                  background: 'linear-gradient(135deg, #f0fdf4, #ffffff)',
                  border: '1.5px solid #86efac',
                  borderRadius: '12px',
                  padding: '22px 16px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.08)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#22c55e'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#86efac'}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>💬</div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', fontWeight: 700, color: '#16a34a' }}>
                  Conversational Task
                </h4>
                <p style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.45, margin: '0 0 16px 0', minHeight: '50px' }}>
                  Answer guided 1-on-1 questions step-by-step to build your task effortlessly with an interactive assistant.
                </p>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ width: '100%', justifyContent: 'center', fontSize: '0.82rem', borderRadius: '8px', color: '#16a34a', borderColor: '#86efac' }}
                >
                  💬 Start Question Wizard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ACTIVE CREATION MODES HEADER */}
        {creationMode !== null && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setCreationMode(null)}
                style={{ padding: '4px 10px', fontSize: '0.78rem', borderRadius: '6px' }}
              >
                ← Change Mode
              </button>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                {creationMode === 'ai' && '✨ AI Auto-Fill Task'}
                {creationMode === 'manual' && '📝 Create New Task (Manual Form)'}
                {creationMode === 'conversational' && `💬 Conversational Task Question Wizard (Step ${convStep} of 6)`}
              </h3>
            </div>
            <button className="btn btn-outline" onClick={onClose} style={{ borderRadius: '6px' }}>✕</button>
          </div>
        )}

        {/* MODE 1: AI AUTO-FILL MODE */}
        {creationMode === 'ai' && (
          <div>
            <div style={{ background: 'linear-gradient(135deg, #fff7ed, #ffffff)', padding: '16px', borderRadius: '10px', marginBottom: '16px', border: '1px solid #fdba74' }}>
              <label style={{ fontWeight: 700, fontSize: '0.88rem', color: '#ea580c', display: 'block', marginBottom: '6px' }}>
                ⚡ Enter task instructions for AI Auto-Fill:
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Prepare Q3 ad campaign for Elixir Tea with priority High and 3 subtasks..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
                <button type="button" className="btn btn-primary" onClick={handleGenerateAI} disabled={generating} style={{ whiteSpace: 'nowrap', background: '#ea580c' }}>
                  {generating ? 'Auto-Filling...' : '✨ Generate & Auto-Fill'}
                </button>
              </div>
            </div>

            {aiAutoFilled && (
              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#15803d', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.84rem', fontWeight: 600 }}>
                ✨ AI has auto-filled the task form below! Please review all fields and click <strong>🚀 Create Task</strong>.
              </div>
            )}

            {renderFullTaskForm()}
          </div>
        )}

        {/* MODE 2: MANUAL TASK MODE */}
        {creationMode === 'manual' && renderFullTaskForm()}

        {/* MODE 3: CONVERSATIONAL TASK QUESTION POPUP WIZARD MODE */}
        {creationMode === 'conversational' && (
          <div>
            {/* Progress Bar */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: '#16a34a', marginBottom: '6px' }}>
                <span>Step {convStep} of 6</span>
                <span>{Math.round((convStep / 6) * 100)}% Complete</span>
              </div>
              <div style={{ width: '100%', height: '7px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${(convStep / 6) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #16a34a, #22c55e)', transition: 'width 0.3s ease' }}></div>
              </div>
            </div>

            {/* Active Question Card Popup */}
            <div style={{ background: '#ffffff', border: '1.5px solid #86efac', borderRadius: '12px', padding: '24px', boxShadow: '0 6px 20px rgba(22, 163, 74, 0.08)', marginBottom: '16px' }}>
              
              {/* QUESTION STEP 1: Title & Priority */}
              {convStep === 1 && (
                <div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '18px' }}>
                    <div style={{ fontSize: '2rem', background: '#dcfce7', padding: '10px', borderRadius: '12px' }}>🤖</div>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: '#16a34a', fontWeight: 800 }}>
                        Question 1: What is the Title & Priority level of your task?
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>
                        Enter a descriptive title for your task and select how urgent it is.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: '#f8fafc', padding: '18px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>Task Title *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Prepare Q3 Financial Report..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        autoFocus
                        required
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>Priority Level *</label>
                      <select className="form-control" value={priority} onChange={(e) => setPriority(e.target.value)}>
                        <option value="Normal">Normal</option>
                        <option value="High">High</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* QUESTION STEP 2: Description & Links */}
              {convStep === 2 && (
                <div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '18px' }}>
                    <div style={{ fontSize: '2rem', background: '#dcfce7', padding: '10px', borderRadius: '12px' }}>🤖</div>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: '#16a34a', fontWeight: 800 }}>
                        Question 2: Please describe the Task Scope & Resources
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>
                        Add task instructions or attach external document & Figma links.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: '#f8fafc', padding: '18px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>Task Description / Instructions</label>
                      <textarea
                        className="form-control"
                        style={{ minHeight: '80px' }}
                        placeholder="Task details, instructions, or scope..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      ></textarea>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>Document Links / Resource URLs</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="https://docs.google.com/... or Figma link"
                        value={documentLinks}
                        onChange={(e) => setDocumentLinks(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* QUESTION STEP 3: Associated Project & File Upload */}
              {convStep === 3 && (
                <div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '18px' }}>
                    <div style={{ fontSize: '2rem', background: '#dcfce7', padding: '10px', borderRadius: '12px' }}>🤖</div>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: '#16a34a', fontWeight: 800 }}>
                        Question 3: Associated Project & Project Drive File Upload
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>
                        Is this task linked to an existing project? Selecting a project enables file upload to Google Drive.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: '#f8fafc', padding: '18px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>Associated Project</label>
                      <select className="form-control" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                        <option value="">No Associated Project (General Task)</option>
                        {projects.map(p => (
                          <option key={p.ProjectID} value={p.ProjectID}>
                            📁 {p.Title} ({p.BusinessEntity})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>Upload Document File(s)</label>
                      {!projectId ? (
                        <div style={{ padding: '10px 14px', borderRadius: '6px', border: '1px dashed #cbd5e1', background: '#ffffff', color: '#64748b', fontSize: '0.8rem' }}>
                          🔒 <em>Select an Associated Project above to enable document file upload to Google Drive.</em>
                        </div>
                      ) : (
                        <div>
                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', border: '1px solid #fdba74', background: '#fff7ed', color: '#ea580c', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer' }}>
                            Add a new file
                            <input type="file" multiple onChange={handleFileSelect} style={{ display: 'none' }} />
                          </label>

                          {selectedFiles.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px', background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569' }}>Staged Files ({selectedFiles.length}):</div>
                              {selectedFiles.map((file, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', background: '#f8fafc', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                                  <span>📄 <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)</span>
                                  <button type="button" onClick={() => handleRemoveFile(idx)} style={{ border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* QUESTION STEP 4: Entity, Department & Assignees */}
              {convStep === 4 && (
                <div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '18px' }}>
                    <div style={{ fontSize: '2rem', background: '#dcfce7', padding: '10px', borderRadius: '12px' }}>🤖</div>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: '#16a34a', fontWeight: 800 }}>
                        Question 4: Brand, Department(s) & Assigned Employee(s)
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>
                        Classify the Brand, Department(s), and assign to team members.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: '#f8fafc', padding: '18px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>Brand</label>
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
                        <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>Department(s) *</label>
                        <button
                          type="button"
                          onClick={() => setDeptDropdownOpen(!deptDropdownOpen)}
                          className="form-control"
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', background: '#ffffff' }}
                        >
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {selectedDepartments.length > 0 ? selectedDepartments.join(', ') : `🏢 ${department || 'Select department(s)...'}`}
                          </span>
                          <span>{deptDropdownOpen ? '▲' : '▼'}</span>
                        </button>
                        {deptDropdownOpen && (
                          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', background: '#ffffff', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 6px 20px rgba(0,0,0,0.15)', zIndex: 999, maxHeight: '170px', overflowY: 'auto', padding: '6px' }}>
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
                                  <div key={deptName} onClick={() => toggleDepartment(deptName)} style={{ padding: '6px 8px', fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', background: isChecked ? '#fff7ed' : 'transparent', color: isChecked ? '#ea580c' : '#334155' }}>
                                    <input type="checkbox" checked={isChecked} readOnly style={{ accentColor: '#f97316' }} />
                                    <span>{deptName}</span>
                                  </div>
                                );
                              })
                            ) : (
                              <div style={{ padding: '8px 10px', fontSize: '0.8125rem', color: '#97a0af', textAlign: 'center' }}>
                                No departments added yet
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div style={{ position: 'relative' }}>
                        <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>Assigned Employee(s)</label>
                        <button
                          type="button"
                          onClick={() => setAssigneeDropdownOpen(!assigneeDropdownOpen)}
                          className="form-control"
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', background: '#ffffff' }}
                        >
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {selectedAssignees.length > 0 ? users.filter(u => selectedAssignees.includes(u.UserID)).map(u => u.FullName).join(', ') : '👤 Select employee(s)...'}
                          </span>
                          <span>{assigneeDropdownOpen ? '▲' : '▼'}</span>
                        </button>
                        {assigneeDropdownOpen && (
                          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', background: '#ffffff', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 6px 20px rgba(0,0,0,0.15)', zIndex: 999, maxHeight: '170px', overflowY: 'auto', padding: '6px' }}>
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
                                <div key={u.UserID} onClick={() => toggleAssignee(u.UserID)} style={{ padding: '6px 8px', fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', background: isChecked ? '#fff7ed' : 'transparent', color: isChecked ? '#ea580c' : '#334155' }}>
                                  <input type="checkbox" checked={isChecked} readOnly style={{ accentColor: '#f97316' }} />
                                  <span>{u.FullName}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div>
                        <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>Assigned By (Manager)</label>
                        <input type="text" className="form-control" placeholder="e.g. Founder / Admin" value={assignedBy} onChange={(e) => setAssignedBy(e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* QUESTION STEP 5: Main Heading, Timeline, Story Points & Budget */}
              {convStep === 5 && (
                <div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '18px' }}>
                    <div style={{ fontSize: '2rem', background: '#dcfce7', padding: '10px', borderRadius: '12px' }}>🤖</div>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: '#16a34a', fontWeight: 800 }}>
                        Question 5: Main Heading, Timeline, Story Points & Budget
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>
                        Set the main heading classification, timeline dates, Story Points & estimated budget.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: '#f8fafc', padding: '18px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>Main Heading *</label>
                      <select className="form-control" value={mainHeading} onChange={(e) => setMainHeading(e.target.value)}>
                        <option value="Documentation">Documentation</option>
                        <option value="Operations">Operations</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Revenue">Revenue</option>
                        <option value="Tech">Tech</option>
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>Start Date</label>
                        <input type="date" className="form-control" value={startDate} onChange={(e) => handleStartDateChange(e.target.value)} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>Days Allowed</label>
                        <input type="number" className="form-control" value={daysAllowed} onChange={(e) => handleDaysAllowedChange(e.target.value)} min="0" />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>Due Date</label>
                        <input type="date" className="form-control" value={dueDate} onChange={(e) => handleDueDateChange(e.target.value)} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>Estimated Budget ($)</label>
                        <input type="number" step="0.01" className="form-control" placeholder="0.00" value={estimatedBudget} onChange={(e) => setEstimatedBudget(e.target.value)} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 700 }}>Story Points (SP) *</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          className="form-control"
                          value={storyPoints}
                          onChange={(e) => setStoryPoints(e.target.value)}
                          placeholder="e.g. 3"
                          style={{ fontWeight: 700, color: '#16a34a' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>Task Remarks</label>
                      <input type="text" className="form-control" placeholder="Notes..." value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              {/* QUESTION STEP 6: Linked Sub-tasks & Final Review */}
              {convStep === 6 && (
                <div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '18px' }}>
                    <div style={{ fontSize: '2rem', background: '#dcfce7', padding: '10px', borderRadius: '12px' }}>🤖</div>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: '#16a34a', fontWeight: 800 }}>
                        Question 6: Linked Sub-Tasks & Final Task Review
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>
                        Optionally split work by adding Sub-tasks with multi-employee assignment before creating the task.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: '#f8fafc', padding: '18px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.84rem', color: '#334155', fontWeight: 700 }}>Linked Sub-tasks ({subtasks.length}):</span>
                      <button type="button" className="btn btn-outline" style={{ padding: '3px 10px', fontSize: '0.78rem' }} onClick={handleAddSubtaskRow}>
                        + Add Subtask
                      </button>
                    </div>

                    {subtasks.length === 0 ? (
                      <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>No subtasks added. Click "+ Add Subtask" to split work.</p>
                    ) : (
                      subtasks.map(st => (
                        <div key={st.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr 0.8fr auto', gap: '8px', alignItems: 'center', background: '#ffffff', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                          <input
                            type="text"
                            placeholder="Subtask title..."
                            className="form-control"
                            value={st.Title}
                            onChange={(e) => handleUpdateSubtaskRow(st.id, 'Title', e.target.value)}
                          />
                          <select
                            className="form-control"
                            value={st.Department}
                            onChange={(e) => handleUpdateSubtaskRow(st.id, 'Department', e.target.value)}
                          >
                            {departments.length > 0 ? (
                              departments.map(d => {
                                const dName = d.Name || d.name || d;
                                return <option key={d.DepartmentID || dName} value={dName}>{dName}</option>;
                              })
                            ) : (
                              <option value="">No departments added</option>
                            )}
                          </select>

                          {/* Custom Multi-Select Employee Dropdown for Subtasks */}
                          <div style={{ position: 'relative' }}>
                            <button
                              type="button"
                              onClick={() => setActiveSubtaskDropdownId(activeSubtaskDropdownId === st.id ? null : st.id)}
                              className="form-control"
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer',
                                fontSize: '0.78rem',
                                background: '#ffffff',
                                color: (Array.isArray(st.AssignedTo) ? st.AssignedTo : []).length > 0 ? '#1e293b' : '#94a3b8'
                              }}
                            >
                              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {(Array.isArray(st.AssignedTo) ? st.AssignedTo : []).length > 0
                                  ? users.filter(u => (st.AssignedTo || []).includes(u.UserID)).map(u => u.FullName).join(', ')
                                  : '👤 Assignee(s)'}
                              </span>
                              <span style={{ fontSize: '0.65rem' }}>▼</span>
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
                                padding: '4px'
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
                                  const currentList = Array.isArray(st.AssignedTo)
                                    ? st.AssignedTo
                                    : (st.AssignedTo ? String(st.AssignedTo).split(',').map(s => s.trim()).filter(Boolean) : []);
                                  const isChecked = currentList.includes(u.UserID);
                                  return (
                                    <div
                                      key={u.UserID}
                                      onClick={() => toggleSubtaskAssignee(st.id, u.UserID)}
                                      style={{
                                        padding: '5px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.78rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        background: isChecked ? '#fff7ed' : 'transparent',
                                        color: isChecked ? '#ea580c' : '#334155'
                                      }}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        readOnly
                                        style={{ accentColor: '#f97316' }}
                                      />
                                      <span>{u.FullName}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          <input
                            type="number"
                            placeholder="SP"
                            className="form-control"
                            value={st.StoryPoints}
                            onChange={(e) => handleUpdateSubtaskRow(st.id, 'StoryPoints', e.target.value)}
                            min="0.5"
                            step="0.5"
                          />

                          <button
                            type="button"
                            className="btn btn-outline"
                            style={{ color: 'var(--danger)', borderColor: 'var(--danger)', padding: '2px 8px' }}
                            onClick={() => handleRemoveSubtaskRow(st.id)}
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Final Summary Card */}
                  <div style={{ background: '#f0fdf4', padding: '14px', borderRadius: '10px', border: '1px solid #86efac', fontSize: '0.84rem', lineHeight: 1.5 }}>
                    <div style={{ fontWeight: 800, color: '#15803d', marginBottom: '6px', fontSize: '0.9rem' }}>📋 Final Task Summary:</div>
                    <div><strong>Title:</strong> {title || 'Untitled Task'} ({priority} Priority)</div>
                    <div><strong>Entity & Dept:</strong> {businessEntity} | {selectedDepartments.join(', ') || department}</div>
                    <div><strong>Project:</strong> {projectId ? projects.find(p=>p.ProjectID===projectId)?.Title : 'General Task'}</div>
                    <div><strong>Assignees:</strong> {selectedAssignees.length > 0 ? users.filter(u=>selectedAssignees.includes(u.UserID)).map(u=>u.FullName).join(', ') : 'Unassigned'}</div>
                    <div><strong>Story Points:</strong> ⚡ {subtasks.length > 0 ? subtasks.reduce((sum, st) => sum + (parseFloat(st.StoryPoints) || 0), 0) : storyPoints} SP</div>
                    <div><strong>Timeline & Budget:</strong> {startDate} ({daysAllowed} days) | ${estimatedBudget || 0}</div>
                  </div>
                </div>
              )}

              {/* Question Navigation Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                <div>
                  {convStep > 1 && (
                    <button type="button" className="btn btn-outline" onClick={() => setConvStep(convStep - 1)}>
                      ← Previous Question
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setCreationMode('manual')}>
                    📋 Switch to Full Form
                  </button>

                  {convStep < 6 ? (
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ background: '#16a34a', borderColor: '#16a34a' }}
                      onClick={() => {
                        if (convStep === 1 && !title.trim()) {
                          alert('Please enter a task title to proceed.');
                          return;
                        }
                        setConvStep(convStep + 1);
                      }}
                    >
                      Next Question →
                    </button>
                  ) : (
                    <button type="button" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)', borderColor: '#16a34a' }} onClick={handleCreateTask} disabled={saving}>
                      {saving ? 'Creating Task...' : '🚀 Create Task'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
}
