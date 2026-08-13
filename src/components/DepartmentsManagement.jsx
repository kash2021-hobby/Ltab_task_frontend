import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';

export default function DepartmentsManagement({ departments, businesses = [], token, user, onRefresh, userRole }) {
  const isSuperAdminOrFounder = !userRole || ['SuperAdmin', 'Founder', 'Admin'].includes(userRole);
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);

  const storedUser = user || JSON.parse(localStorage.getItem('user') || '{}');
  const userBizStr = storedUser?.business_entities || storedUser?.BusinessEntities || '';
  const userAssignedBizs = userBizStr ? userBizStr.split(',').map(s => s.trim()).filter(Boolean) : [];

  const fetchedBizNames = Array.isArray(businesses) ? businesses.map(b => (typeof b === 'string' ? b : b?.name)).filter(Boolean) : [];
  const combinedBizSet = new Set([...fetchedBizNames, ...userAssignedBizs]);
  const dynamicCompanyList = Array.from(combinedBizSet);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCompanies, setSelectedCompanies] = useState(dynamicCompanyList[0] ? [dynamicCompanyList[0]] : []);
  const [headName, setHeadName] = useState('');
  const [headEmail, setHeadEmail] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [minutesPerStoryPoint, setMinutesPerStoryPoint] = useState(60);
  const [dailyWorkingHours, setDailyWorkingHours] = useState(8);
  const [icon, setIcon] = useState('🏢');
  const [color, setColor] = useState('#7c3aed');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const companyList = dynamicCompanyList;

  const toggleCompany = (compName) => {
    if (selectedCompanies.includes(compName)) {
      setSelectedCompanies(selectedCompanies.filter(c => c !== compName));
    } else {
      setSelectedCompanies([...selectedCompanies, compName]);
    }
  };

  const handleOpenAddModal = () => {
    setEditingDept(null);
    setName('');
    setDescription('');
    setSelectedCompanies([dynamicCompanyList[0]]);
    setHeadName('');
    setHeadEmail('');
    setTelegramChatId('');
    setMinutesPerStoryPoint(60);
    setDailyWorkingHours(8);
    setIcon('🏢');
    setColor('#7c3aed');
    setMsg('');
    setShowModal(true);
  };

  const handleOpenEditModal = (d) => {
    setEditingDept(d);
    setName(d.Name || d.name || '');
    setDescription(d.Description || d.description || '');
    
    const rawEntities = d.BusinessEntities || d.business_entities || 'Company X (Shared)';
    const parsed = String(rawEntities).split(',').map(s => s.trim()).filter(Boolean);
    setSelectedCompanies(parsed.length > 0 ? parsed : ['Company X (Shared)']);

    setHeadName(d.AdminName || d.admin_name || '');
    setHeadEmail(d.AdminEmail || d.admin_email || '');
    setTelegramChatId(d.TelegramChatId || d.telegram_chat_id || '');
    setMinutesPerStoryPoint(d.MinutesPerStoryPoint || d.minutes_per_story_point || 60);
    setDailyWorkingHours(d.DailyWorkingHours || d.daily_working_hours || 8);
    setIcon(d.Icon || d.icon || '🏢');
    setColor(d.Color || d.color || '#7c3aed');
    setMsg('');
    setShowModal(true);
  };

  const handleSaveDept = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');

    try {
      if (editingDept) {
        const targetId = editingDept.DepartmentID || editingDept.department_id || editingDept.Name || editingDept.name;
        const res = await axios.put(`/api/departments/${encodeURIComponent(targetId)}`, {
          name,
          description,
          businessEntities: selectedCompanies.join(', '),
          headName,
          headEmail,
          telegramChatId,
          minutesPerStoryPoint,
          dailyWorkingHours,
          icon,
          color
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setMsg('Department updated successfully.');
          onRefresh();
          setTimeout(() => { setShowModal(false); setMsg(''); }, 800);
        }
      } else {
        const res = await axios.post('/api/departments', {
          name,
          description,
          businessEntities: selectedCompanies.join(', '),
          headName,
          headEmail,
          telegramChatId,
          minutesPerStoryPoint,
          dailyWorkingHours,
          icon,
          color
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setMsg('Department created successfully.');
          onRefresh();
          setTimeout(() => { setShowModal(false); setMsg(''); }, 800);
        }
      }
    } catch (err) {
      setMsg(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDepartment = async (d) => {
    if (!window.confirm(`Are you sure you want to delete department "${d.Name}"?`)) return;
    try {
      const targetId = d.DepartmentID || d.department_id || d.Name || d.name;
      const res = await axios.delete(`/api/departments/${encodeURIComponent(targetId)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        onRefresh();
      }
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: '0 0 2px', fontSize: '1rem', fontWeight: 700, color: '#172b4d' }}>Departments</h2>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: '#97a0af' }}>{departments.length} active departments</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          style={{ padding: '7px 14px', borderRadius: '4px', border: 'none', background: '#1e293b', color: '#ffffff', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.background = '#0f172a'}
          onMouseLeave={e => e.currentTarget.style.background = '#1e293b'}
        >
          + Add Department
        </button>
      </div>

      {/* Department Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '12px' }}>
        {departments.map(d => {
          const weeklyCapacity = d.WeeklyStoryPointsCapacity !== undefined
            ? d.WeeklyStoryPointsCapacity
            : Math.round((d.DailyStoryPointsCapacity || 0) * 5 * 10) / 10;

          return (
            <div
              key={d.DepartmentID}
              style={{
                background: '#ffffff', border: '1px solid #e4e7eb', borderRadius: '6px',
                padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px',
                transition: 'border-color 0.15s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#c1c7d0'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#e4e7eb'}
            >
              {/* Card Top Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: '0 0 2px', fontSize: '0.9375rem', fontWeight: 700, color: '#172b4d' }}>{d.Name}</h3>
                  <div style={{ fontSize: '0.6875rem', color: '#97a0af' }}>{d.DepartmentID}</div>
                </div>
                <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: '#f4f5f7', border: '1px solid #e4e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem', fontWeight: 700, color: '#5e6c84' }}>
                  {d.Name?.slice(0, 2).toUpperCase()}
                </div>
              </div>

              {/* Info Rows */}
              <div style={{ fontSize: '0.8125rem', borderTop: '1px solid #f4f5f7', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[['Head', d.AdminName || 'Unassigned'], ['Email', d.AdminEmail || '—'], ['Telegram', d.TelegramChatId || 'Not set'], ['SP Rate', `1 SP = ${d.MinutesPerStoryPoint || 60}m`], ['Members', `${d.EmployeeCount || 0} members`], ['Hours', `${d.DailyWorkingHours || 8} hrs/day`]].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#97a0af', fontSize: '0.75rem' }}>{label}</span>
                    <span style={{ fontWeight: 500, color: '#172b4d', fontSize: '0.75rem' }}>{val}</span>
                  </div>
                ))}
              </div>

              {/* Company Badges */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {(d.BusinessEntities || d.business_entities || '').split(',').map(c => c.trim()).filter(Boolean).map(c => (
                  <span key={c} style={{ fontSize: '0.6875rem', fontWeight: 600, padding: '1px 6px', borderRadius: '10px', background: '#e3f2fd', color: '#1565c0' }}>{c}</span>
                ))}
              </div>

              {/* Capacity Block */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {[['Daily', `${d.DailyStoryPointsCapacity || 0} SP`, '#00875a'], ['Weekly', `${weeklyCapacity} SP`, '#1565c0']].map(([label, val, color]) => (
                  <div key={label} style={{ flex: 1, padding: '6px 10px', background: '#f8f9fa', borderRadius: '4px', border: '1px solid #e4e7eb', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6875rem', color: '#97a0af', marginBottom: '2px' }}>{label}</div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, color }}>{val}</div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ borderTop: '1px solid #f4f5f7', paddingTop: '10px', display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => handleOpenEditModal(d)}
                  style={{ flex: 1, padding: '5px', borderRadius: '4px', border: '1px solid #dfe1e6', background: '#ffffff', color: '#5e6c84', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#172b4d'; e.currentTarget.style.color = '#172b4d'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#dfe1e6'; e.currentTarget.style.color = '#5e6c84'; }}
                >
                  Edit
                </button>
                {isSuperAdminOrFounder && (
                  <button
                    onClick={() => handleDeleteDepartment(d)}
                    style={{ padding: '5px 10px', borderRadius: '4px', border: '1px solid #ffbdad', background: '#ffffff', color: '#de350b', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', transition: 'background 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#ffebe6'}
                    onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      {showModal && ReactDOM.createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(9,30,66,0.54)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '6px', width: '100%', maxWidth: '480px', boxShadow: '0 8px 24px rgba(9,30,66,0.14)', overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f4f5f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#ffffff', zIndex: 1 }}>
              <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: '#172b4d' }}>
                {editingDept ? 'Edit Department' : 'Add Department'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#97a0af', fontSize: '1rem' }}>✕</button>
            </div>

            {msg && (
              <div style={{ margin: '12px 20px 0', padding: '8px 12px', borderRadius: '4px', fontSize: '0.8125rem', background: msg.includes('successfully') ? '#e3fcef' : '#ffebe6', color: msg.includes('successfully') ? '#00875a' : '#de350b', border: `1px solid ${msg.includes('successfully') ? '#abe2cc' : '#ffbdad'}` }}>
                {msg}
              </div>
            )}

            <form onSubmit={handleSaveDept} style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: '#5e6c84', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Department Name *</label>
                <input type="text" placeholder="e.g. Marketing" value={name} onChange={e => setName(e.target.value)} required
                  style={{ width: '100%', padding: '7px 10px', fontSize: '0.8125rem', borderRadius: '4px', border: '1.5px solid #dfe1e6', outline: 'none', background: '#ffffff', color: '#172b4d', transition: 'border-color 0.15s' }}
                  onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#dfe1e6'} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: '#5e6c84', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Description</label>
                <textarea placeholder="Brief description..." value={description} onChange={e => setDescription(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', fontSize: '0.8125rem', borderRadius: '4px', border: '1.5px solid #dfe1e6', outline: 'none', background: '#ffffff', color: '#172b4d', minHeight: '54px', resize: 'vertical', transition: 'border-color 0.15s' }}
                  onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#dfe1e6'} />
              </div>

              {/* Companies */}
              <div style={{ background: '#f8f9fa', padding: '10px 12px', borderRadius: '4px', border: '1px solid #e4e7eb' }}>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: '#5e6c84', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Belongs to Companies *</label>
                {companyList.length === 0 ? (
                  <div style={{ fontSize: '0.75rem', color: '#b45309', background: '#fff3cd', padding: '8px', borderRadius: '3px' }}>No companies added yet. Go to Settings → Companies first.</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                    {companyList.map(comp => (
                      <label key={comp} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: '#172b4d', cursor: 'pointer' }}>
                        <input type="checkbox" checked={selectedCompanies.includes(comp)} onChange={() => toggleCompany(comp)} />{comp}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Capacity */}
              <div style={{ background: '#f8f9fa', padding: '10px 12px', borderRadius: '4px', border: '1px solid #e4e7eb' }}>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: '#5e6c84', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Capacity Settings</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.6875rem', color: '#97a0af', marginBottom: '4px' }}>1 SP = Minutes *</label>
                    <input type="number" min="1" placeholder="60" value={minutesPerStoryPoint} onChange={e => setMinutesPerStoryPoint(e.target.value)} required
                      style={{ width: '100%', padding: '6px 10px', fontSize: '0.8125rem', borderRadius: '4px', border: '1px solid #dfe1e6', outline: 'none', background: '#ffffff', color: '#172b4d' }}
                      onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#dfe1e6'} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.6875rem', color: '#97a0af', marginBottom: '4px' }}>Daily Hours/Emp *</label>
                    <input type="number" step="0.5" min="1" max="24" placeholder="8" value={dailyWorkingHours} onChange={e => setDailyWorkingHours(e.target.value)} required
                      style={{ width: '100%', padding: '6px 10px', fontSize: '0.8125rem', borderRadius: '4px', border: '1px solid #dfe1e6', outline: 'none', background: '#ffffff', color: '#172b4d' }}
                      onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#dfe1e6'} />
                  </div>
                </div>
              </div>

              {/* Head Details */}
              <div style={{ background: '#f8f9fa', padding: '10px 12px', borderRadius: '4px', border: '1px solid #e4e7eb' }}>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: '#5e6c84', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Department Head</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input type="text" placeholder="Head full name" value={headName} onChange={e => setHeadName(e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', fontSize: '0.8125rem', borderRadius: '4px', border: '1px solid #dfe1e6', outline: 'none', background: '#ffffff', color: '#172b4d' }}
                    onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#dfe1e6'} />
                  <input type="email" placeholder="head.email@company.com" value={headEmail} onChange={e => setHeadEmail(e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', fontSize: '0.8125rem', borderRadius: '4px', border: '1px solid #dfe1e6', outline: 'none', background: '#ffffff', color: '#172b4d' }}
                    onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#dfe1e6'} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: '#5e6c84', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Telegram Chat ID</label>
                <input type="text" placeholder="-1001234567890" value={telegramChatId} onChange={e => setTelegramChatId(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', fontSize: '0.8125rem', borderRadius: '4px', border: '1.5px solid #dfe1e6', outline: 'none', background: '#ffffff', color: '#172b4d', transition: 'border-color 0.15s' }}
                  onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#dfe1e6'} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '4px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '7px 14px', borderRadius: '4px', border: '1px solid #dfe1e6', background: '#ffffff', color: '#5e6c84', fontSize: '0.8125rem', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding: '7px 18px', borderRadius: '4px', border: 'none', background: '#1e293b', color: '#ffffff', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving...' : editingDept ? 'Save Changes' : 'Create Department'}
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

