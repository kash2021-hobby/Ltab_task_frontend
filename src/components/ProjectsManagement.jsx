import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';

export default function ProjectsManagement({ projects = [], users = [], departments = [], businesses = [], token, user, onRefresh, userRole }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [targetDocProject, setTargetDocProject] = useState(null);

  const storedUser = user || JSON.parse(localStorage.getItem('user') || '{}');
  const userBizStr = storedUser?.business_entities || storedUser?.BusinessEntities || '';
  const userAssignedBizs = userBizStr ? userBizStr.split(',').map(s => s.trim()).filter(Boolean) : [];

  const fetchedBizNames = Array.isArray(businesses) ? businesses.map(b => (typeof b === 'string' ? b : b?.name)).filter(Boolean) : [];
  const combinedBizSet = new Set([...fetchedBizNames, ...userAssignedBizs]);
  const dynamicBizList = Array.from(combinedBizSet);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Form State for Project Add/Edit
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [businessEntity, setBusinessEntity] = useState(dynamicBizList[0] || 'Company X (Shared)');
  const [department, setDepartment] = useState(departments[0]?.Name || departments[0]?.name || '');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('Active');
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [leadDropdownOpen, setLeadDropdownOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [driveFolderUrl, setDriveFolderUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // Upload Form State
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');

  const toggleLead = (userId) => {
    if (selectedLeads.includes(userId)) {
      setSelectedLeads(selectedLeads.filter(id => id !== userId));
    } else {
      setSelectedLeads([...selectedLeads, userId]);
    }
  };

  const handleFileSelect = (e) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const handleRemoveFile = (indexToRemove) => {
    setSelectedFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const canManage = !userRole || ['SuperAdmin', 'Founder', 'Admin', 'DeptAdmin'].includes(userRole);

  const handleOpenAddModal = () => {
    setEditingProject(null);
    setTitle('');
    setDescription('');
    setBusinessEntity('Company X (Shared)');
    setDepartment(departments[0]?.Name || 'Operations');
    setPriority('Medium');
    setStatus('Active');
    setSelectedLeads([]);
    setStartDate(new Date().toISOString().split('T')[0]);
    setDueDate('');
    setDriveFolderUrl('');
    setMsg('');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (p) => {
    setEditingProject(p);
    setTitle(p.Title || '');
    setDescription(p.Description || '');
    setBusinessEntity(p.BusinessEntity || 'Company X (Shared)');
    setDepartment(p.Department || 'Operations');
    setPriority(p.Priority || 'Medium');
    setStatus(p.Status || 'Active');
    
    const rawLeads = p.ProjectLeadID ? String(p.ProjectLeadID).split(',').map(s => s.trim()).filter(Boolean) : [];
    setSelectedLeads(rawLeads);

    setStartDate(p.StartDate || '');
    setDueDate(p.DueDate || '');
    setDriveFolderUrl(p.DriveFolderUrl || '');
    setMsg('');
    setShowAddModal(true);
  };

  const handleSaveProject = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');

    try {
      const projectLeadStr = selectedLeads.join(', ');
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('businessEntity', businessEntity);
      formData.append('department', department);
      formData.append('priority', priority);
      formData.append('status', status);
      formData.append('projectLead', projectLeadStr);
      formData.append('startDate', startDate);
      formData.append('dueDate', dueDate);
      if (selectedFiles && selectedFiles.length > 0) {
        Array.from(selectedFiles).forEach(f => formData.append('documents', f));
      }

      if (editingProject) {
        const res = await axios.put(`/api/projects/${editingProject.ProjectID}`, {
          title, description, businessEntity, department, priority, status, projectLead: projectLeadStr, startDate, dueDate
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setMsg('Project updated successfully.');
          onRefresh();
          setTimeout(() => { setShowAddModal(false); setMsg(''); setSelectedFiles([]); }, 800);
        }
      } else {
        const res = await axios.post('/api/projects', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        if (res.data.success) {
          setMsg('Project & dedicated folder created successfully!');
          onRefresh();
          setTimeout(() => { setShowAddModal(false); setMsg(''); setSelectedFiles([]); }, 800);
        }
      }
    } catch (err) {
      setMsg(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      const res = await axios.delete(`/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        onRefresh();
      }
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const handleOpenDocModal = (p) => {
    setTargetDocProject(p);
    setSelectedFiles([]);
    setUploadMsg('');
    setShowDocModal(true);
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!selectedFiles || selectedFiles.length === 0 || !targetDocProject) return;
    setUploading(true);
    setUploadMsg('');

    const formData = new FormData();
    Array.from(selectedFiles).forEach(f => formData.append('documents', f));

    try {
      const res = await axios.post(`/api/projects/${targetDocProject.ProjectID}/documents`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      if (res.data.success) {
        setUploadMsg(`${selectedFiles.length} file(s) uploaded successfully!`);
        onRefresh();
        setTimeout(() => { setShowDocModal(false); setUploadMsg(''); setSelectedFiles([]); }, 1000);
      }
    } catch (err) {
      setUploadMsg(err.response?.data?.error || err.message);
    } finally {
      setUploading(false);
    }
  };

  const filteredProjects = projects.filter(p => {
    const q = searchTerm.toLowerCase();
    const matchQuery = (p.Title || '').toLowerCase().includes(q) ||
                       (p.Description || '').toLowerCase().includes(q) ||
                       (p.Department || '').toLowerCase().includes(q) ||
                       (p.BusinessEntity || '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'ALL' || p.Status === statusFilter;
    return matchQuery && matchStatus;
  });

  const priorityColor = (p) => ({
    Urgent: { bg: '#fef2f2', text: '#dc2626' },
    High: { bg: '#fffbeb', text: '#d97706' },
    Medium: { bg: '#eff6ff', text: '#2563eb' },
    Low: { bg: '#f8fafc', text: '#94a3b8' }
  }[p] || { bg: '#f8fafc', text: '#94a3b8' });

  const statusStyle = (s) => ({
    Active: { bg: '#f0fdf4', text: '#16a34a' },
    Planning: { bg: '#eff6ff', text: '#2563eb' },
    'On Hold': { bg: '#fffbeb', text: '#d97706' },
    Completed: { bg: '#f0f9ff', text: '#0284c7' },
    Archived: { bg: '#f8fafc', text: '#64748b' }
  }[s] || { bg: '#f8fafc', text: '#64748b' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ margin: '0 0 2px', fontSize: '1rem', fontWeight: 700, color: '#172b4d' }}>Projects</h2>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: '#97a0af' }}>{projects.length} total projects</p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '32px', padding: '0 10px', borderRadius: '4px', border: '1px solid #dfe1e6', background: '#ffffff', width: '200px' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#97a0af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input type="text" placeholder="Search projects..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.8125rem', color: '#172b4d', width: '100%' }} />
          </div>

          {/* Status filter */}
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ height: '32px', padding: '0 10px', borderRadius: '4px', border: '1px solid #dfe1e6', background: '#ffffff', color: '#172b4d', fontSize: '0.8125rem', cursor: 'pointer', outline: 'none' }}>
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Planning">Planning</option>
            <option value="On Hold">On Hold</option>
            <option value="Completed">Completed</option>
          </select>

          {canManage && (
            <button onClick={handleOpenAddModal}
              style={{ padding: '6px 14px', borderRadius: '4px', border: 'none', background: '#1e293b', color: '#ffffff', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#0f172a'}
              onMouseLeave={e => e.currentTarget.style.background = '#1e293b'}>
              + Add Project
            </button>
          )}
        </div>
      </div>

      {/* Projects Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
        {filteredProjects.length > 0 ? (
          filteredProjects.map(p => {
            const pc = priorityColor(p.Priority);
            const ss = statusStyle(p.Status);
            const docs = p.Documents || [];
            return (
              <div key={p.ProjectID}
                style={{ background: '#ffffff', border: '1px solid #e4e7eb', borderRadius: '6px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', transition: 'border-color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#c1c7d0'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#e4e7eb'}
              >
                {/* Top badges */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#97a0af', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Project</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 600, padding: '1px 6px', borderRadius: '3px', background: pc.bg, color: pc.text }}>{p.Priority || 'Medium'}</span>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 600, padding: '1px 6px', borderRadius: '3px', background: ss.bg, color: ss.text }}>{p.Status}</span>
                  </div>
                </div>

                {/* Title */}
                <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: '#172b4d', lineHeight: 1.3 }}>{p.Title}</h3>

                {/* Description */}
                {p.Description && (
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: '#5e6c84', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.Description}</p>
                )}

                {/* Meta rows */}
                <div style={{ fontSize: '0.75rem', color: '#97a0af', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Lead:</span><strong style={{ color: '#172b4d' }}>{p.ProjectLeadName || '—'}</strong>
                  </div>
                  {p.DueDate && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Due:</span><span style={{ color: '#172b4d', fontWeight: 500 }}>{p.DueDate}</span>
                    </div>
                  )}
                </div>

                {/* Progress */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: '#97a0af', marginBottom: '4px' }}>
                    <span>{p.CompletedTasks}/{p.TotalTasks} tasks</span><span>{p.Progress}%</span>
                  </div>
                  <div style={{ height: '4px', borderRadius: '2px', background: '#f4f5f7', overflow: 'hidden' }}>
                    <div style={{ width: `${p.Progress}%`, height: '100%', borderRadius: '2px', background: p.Progress >= 100 ? '#00875a' : '#2563eb', transition: 'width 0.4s ease' }} />
                  </div>
                </div>

                {/* Documents */}
                {docs.length > 0 && (
                  <div style={{ borderTop: '1px solid #f4f5f7', paddingTop: '8px' }}>
                    <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#97a0af', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>Docs ({docs.length})</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {docs.slice(0, 3).map((doc, idx) => (
                        <a key={idx} href={doc.url} target="_blank" rel="noreferrer"
                          style={{ fontSize: '0.75rem', color: '#2563eb', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                          </svg>
                          {doc.originalName || doc.name || `Document ${idx + 1}`}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div style={{ borderTop: '1px solid #f4f5f7', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                  <a href={p.DriveFolderUrl || '#'} target="_blank" rel="noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '28px', padding: '0 8px', borderRadius: '4px', background: '#f8f9fa', border: '1px solid #e4e7eb', color: '#5e6c84', fontSize: '0.75rem', fontWeight: 500, textDecoration: 'none' }}
                    title="Open Google Drive">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                    Drive
                  </a>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={() => handleOpenDocModal(p)}
                      style={{ height: '28px', padding: '0 8px', borderRadius: '4px', border: '1px solid #dfe1e6', background: '#ffffff', color: '#5e6c84', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f4f5f7'}
                      onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}>
                      + Doc
                    </button>
                    {canManage && (
                      <>
                        <button onClick={() => handleOpenEditModal(p)}
                          style={{ height: '28px', padding: '0 8px', borderRadius: '4px', border: '1px solid #dfe1e6', background: '#ffffff', color: '#5e6c84', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f4f5f7'}
                          onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}>
                          Edit
                        </button>
                        <button onClick={() => handleDeleteProject(p.ProjectID)}
                          style={{ height: '28px', padding: '0 8px', borderRadius: '4px', border: '1px solid #ffbdad', background: '#ffffff', color: '#de350b', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#ffebe6'}
                          onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}>
                          ✕
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ gridColumn: '1 / -1', padding: '48px', textAlign: 'center', color: '#97a0af', fontSize: '0.875rem', background: '#ffffff', borderRadius: '6px', border: '1px solid #e4e7eb' }}>
            No projects found.
          </div>
        )}
      </div>

      {/* Add/Edit Project Modal */}
      {showAddModal && ReactDOM.createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(9,30,66,0.54)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '6px', width: '100%', maxWidth: '500px', boxShadow: '0 8px 24px rgba(9,30,66,0.14)', overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f4f5f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#ffffff', zIndex: 1 }}>
              <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: '#172b4d' }}>
                {editingProject ? 'Edit Project' : 'Add Project'}
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#97a0af', fontSize: '1rem' }}>✕</button>
            </div>

            {msg && (
              <div style={{ margin: '12px 20px 0', padding: '8px 12px', borderRadius: '4px', fontSize: '0.8125rem', background: msg.includes('successfully') ? '#e3fcef' : '#ffebe6', color: msg.includes('successfully') ? '#00875a' : '#de350b', border: `1px solid ${msg.includes('successfully') ? '#abe2cc' : '#ffbdad'}` }}>
                {msg}
              </div>
            )}

            <form onSubmit={handleSaveProject} style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: '#5e6c84', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Project Title *</label>
                <input type="text" placeholder="e.g. Website Redesign v2" value={title} onChange={e => setTitle(e.target.value)} required
                  style={{ width: '100%', padding: '7px 10px', fontSize: '0.8125rem', borderRadius: '4px', border: '1.5px solid #dfe1e6', outline: 'none', background: '#ffffff', color: '#172b4d' }}
                  onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#dfe1e6'} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: '#5e6c84', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Description</label>
                <textarea placeholder="Scope of work and goals..." value={description} onChange={e => setDescription(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', fontSize: '0.8125rem', borderRadius: '4px', border: '1.5px solid #dfe1e6', outline: 'none', background: '#ffffff', color: '#172b4d', minHeight: '54px', resize: 'vertical' }}
                  onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#dfe1e6'} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: '#5e6c84', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Priority</label>
                  <select value={priority} onChange={e => setPriority(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', fontSize: '0.8125rem', borderRadius: '4px', border: '1px solid #dfe1e6', outline: 'none', background: '#ffffff', color: '#172b4d' }}
                    onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#dfe1e6'}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: '#5e6c84', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Status</label>
                  <select value={status} onChange={e => setStatus(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', fontSize: '0.8125rem', borderRadius: '4px', border: '1px solid #dfe1e6', outline: 'none', background: '#ffffff', color: '#172b4d' }}
                    onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#dfe1e6'}>
                    <option value="Planning">Planning</option>
                    <option value="Active">Active</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div style={{ position: 'relative' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Project Head(s) / Lead(s)
                </label>
                
                {/* Custom Multi-Select Dropdown Button */}
                <button
                  type="button"
                  onClick={() => setLeadDropdownOpen(!leadDropdownOpen)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '0.84rem',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    color: selectedLeads.length > 0 ? '#1e293b' : '#94a3b8',
                    fontWeight: selectedLeads.length > 0 ? 600 : 400,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selectedLeads.length > 0
                      ? users.filter(u => selectedLeads.includes(u.UserID)).map(u => u.FullName).join(', ')
                      : '👤 Select Project Lead(s)...'}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: '6px' }}>
                    {leadDropdownOpen ? '▲' : '▼'}
                  </span>
                </button>

                {/* Dropdown Menu Overlay */}
                {leadDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '4px',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                    zIndex: 999,
                    maxHeight: '180px',
                    overflowY: 'auto',
                    padding: '6px'
                  }}>
                    {users.filter(u => {
                      const r = String(u.Role || u.role || '').trim().toLowerCase();
                      return r === 'deptadmin' || r === 'admin' || r === 'superadmin' || r === 'founder' || (r && r !== 'teammember');
                    }).map(u => {
                      const isChecked = selectedLeads.includes(u.UserID);
                      return (
                        <div
                          key={u.UserID}
                          onClick={() => toggleLead(u.UserID)}
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
                          <span>{u.FullName} <span style={{ color: '#94a3b8', fontSize: '0.74rem' }}>({u.Role === 'DeptAdmin' ? 'Dept Head' : u.Role})</span></span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: '#5e6c84', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Due Date</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', fontSize: '0.8125rem', borderRadius: '4px', border: '1.5px solid #dfe1e6', outline: 'none', background: '#ffffff', color: '#172b4d' }}
                  onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#dfe1e6'} />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Upload Project Documents (Optional, Multiple Allowed)
                </label>
                <label style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '6px',
                  border: '1px solid #fdba74',
                  background: '#fff7ed',
                  color: '#ea580c',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add a new file
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                </label>

                {/* Staged files list with remove buttons */}
                {selectedFiles.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', maxHeight: '140px', overflowY: 'auto' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569' }}>
                      Selected Files ({selectedFiles.length}):
                    </div>
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}>
                        <span style={{ color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '340px' }}>
                          📄 <strong>{file.name}</strong> <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>({(file.size / 1024).toFixed(1)} KB)</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(idx)}
                          style={{ border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', padding: '0 4px' }}
                          title="Remove file"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ fontSize: '0.72rem', color: '#ea580c', marginTop: '4px', fontWeight: 500 }}>
                  📁 Dedicated project folder will automatically be created and linked to Google Drive.
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '4px' }}>
                <button type="button" onClick={() => setShowAddModal(false)}
                  style={{ padding: '7px 14px', borderRadius: '4px', border: '1px solid #dfe1e6', background: '#ffffff', color: '#5e6c84', fontSize: '0.8125rem', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={saving}
                  style={{ padding: '7px 18px', borderRadius: '4px', border: 'none', background: '#1e293b', color: '#ffffff', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving...' : editingProject ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Upload Document Modal */}
      {showDocModal && ReactDOM.createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(9,30,66,0.54)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '6px', width: '100%', maxWidth: '440px', boxShadow: '0 8px 24px rgba(9,30,66,0.14)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f4f5f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: '#172b4d' }}>Upload Project Documents</h3>
              <button onClick={() => setShowDocModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#97a0af', fontSize: '1rem' }}>✕</button>
            </div>

            {uploadMsg && (
              <div style={{ margin: '12px 20px 0', padding: '8px 12px', borderRadius: '4px', fontSize: '0.8125rem', background: uploadMsg.includes('successfully') ? '#e3fcef' : '#ffebe6', color: uploadMsg.includes('successfully') ? '#00875a' : '#de350b', border: `1px solid ${uploadMsg.includes('successfully') ? '#abe2cc' : '#ffbdad'}` }}>
                {uploadMsg}
              </div>
            )}

            <form onSubmit={handleUploadDocument} style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Project: <strong style={{ color: '#1e293b' }}>{targetDocProject?.Title}</strong>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Select Document File(s) *
                </label>
                <label style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '6px',
                  border: '1px solid #fdba74',
                  background: '#fff7ed',
                  color: '#ea580c',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add a new file
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                </label>

                {/* Staged files list with remove buttons */}
                {selectedFiles.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', maxHeight: '140px', overflowY: 'auto' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569' }}>
                      Files Ready to Upload ({selectedFiles.length}):
                    </div>
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}>
                        <span style={{ color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>
                          📄 <strong>{file.name}</strong> <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>({(file.size / 1024).toFixed(1)} KB)</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(idx)}
                          style={{ border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', padding: '0 4px' }}
                          title="Remove file"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ background: '#fff7ed', padding: '10px 12px', borderRadius: '8px', border: '1px solid #ffedd5', fontSize: '0.76rem', color: '#c2410c' }}>
                📂 File will be uploaded and accessible to assigned team members and department heads via the Google Drive folder link.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '4px' }}>
                <button type="button" onClick={() => setShowDocModal(false)}
                  style={{ padding: '7px 14px', borderRadius: '4px', border: '1px solid #dfe1e6', background: '#ffffff', color: '#5e6c84', fontSize: '0.8125rem', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={uploading}
                  style={{ padding: '7px 18px', borderRadius: '4px', border: 'none', background: '#1e293b', color: '#ffffff', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', opacity: uploading ? 0.7 : 1 }}>
                  {uploading ? 'Uploading...' : 'Upload Document'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
