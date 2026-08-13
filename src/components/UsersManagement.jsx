import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';

/* ——— Shared micro styles ——— */
const inp = {
  width: '100%', padding: '7px 10px', fontSize: '0.8125rem',
  borderRadius: '4px', border: '1.5px solid #dfe1e6', outline: 'none',
  background: '#ffffff', color: '#172b4d', fontFamily: 'Inter, sans-serif',
  transition: 'border-color 0.15s ease'
};
const lbl = { display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: '#5e6c84', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' };

const thS = { padding: '8px 14px', fontSize: '0.6875rem', fontWeight: 600, color: '#5e6c84', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #e4e7eb', textAlign: 'left', background: '#f8f9fa', whiteSpace: 'nowrap' };
const tdS = { padding: '9px 14px', fontSize: '0.8125rem', color: '#172b4d', borderBottom: '1px solid #f4f5f7', verticalAlign: 'middle' };

const roleMap = {
  SuperAdmin: { bg: '#f3e8ff', text: '#6d28d9' },
  Founder:    { bg: '#f3e8ff', text: '#6d28d9' },
  Admin:      { bg: '#fff3cd', text: '#b45309' },
  DeptAdmin:  { bg: '#e3f2fd', text: '#1565c0' },
  TeamMember: { bg: '#f4f5f7', text: '#5e6c84' }
};

export default function UsersManagement({ users, departments, businesses = [], token, user, onRefresh, userRole }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const storedUser = user || JSON.parse(localStorage.getItem('user') || '{}');
  const userBizStr = storedUser?.business_entities || storedUser?.BusinessEntities || '';
  const userAssignedBizs = userBizStr ? userBizStr.split(',').map(s => s.trim()).filter(Boolean) : [];
  const fetchedBizNames = Array.isArray(businesses) ? businesses.map(b => (typeof b === 'string' ? b : b?.name)).filter(Boolean) : [];
  const dynamicBizList = Array.from(new Set([...fetchedBizNames, ...userAssignedBizs]));

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('TeamMember');
  const [selectedDepts, setSelectedDepts] = useState(['Operations']);
  const [selectedBizs, setSelectedBizs] = useState(dynamicBizList[0] ? [dynamicBizList[0]] : []);
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const canAddSuper = userRole === 'SuperAdmin';
  const canDelete = ['SuperAdmin', 'Founder', 'Admin'].includes(userRole);

  const openModal = (u = null, defaultRole = 'TeamMember') => {
    setEditingUser(u);
    setFullName(u?.FullName || '');
    setEmail(u?.Email || '');
    setRole(u?.Role || defaultRole);
    setSelectedDepts(u?.Department ? u.Department.split(',').map(s => s.trim()) : [departments[0]?.Name || 'Operations']);
    setSelectedBizs(u?.BusinessEntities ? u.BusinessEntities.split(',').map(s => s.trim()) : dynamicBizList[0] ? [dynamicBizList[0]] : []);
    setPhone(u?.Phone || '');
    setMsg('');
    setShowAddModal(true);
  };

  const toggleDept = d => {
    if (selectedDepts.includes(d)) { if (selectedDepts.length > 1) setSelectedDepts(selectedDepts.filter(x => x !== d)); }
    else setSelectedDepts([...selectedDepts, d]);
  };
  const toggleBiz = b => {
    if (selectedBizs.includes(b)) { if (selectedBizs.length > 1) setSelectedBizs(selectedBizs.filter(x => x !== b)); }
    else setSelectedBizs([...selectedBizs, b]);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      const payload = { fullName, email, role, department: selectedDepts.join(', '), businessEntities: selectedBizs.join(', '), phone };
      if (editingUser) {
        const id = editingUser.UserID || editingUser.user_id || editingUser.Email;
        const res = await axios.put(`/api/users/${encodeURIComponent(id)}`, payload, { headers: { Authorization: `Bearer ${token}` } });
        if (res.data.success) { setMsg('Member updated.'); onRefresh(); setTimeout(() => { setShowAddModal(false); setMsg(''); }, 700); }
      } else {
        const res = await axios.post('/api/users', payload, { headers: { Authorization: `Bearer ${token}` } });
        if (res.data.success) { setMsg('Member added.'); onRefresh(); setTimeout(() => { setShowAddModal(false); setMsg(''); }, 700); }
      }
    } catch (err) { setMsg(err.response?.data?.error || err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Delete member "${u.FullName}"?`)) return;
    try {
      const id = u.UserID || u.user_id || u.Email;
      await axios.delete(`/api/users/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${token}` } });
      onRefresh();
    } catch (err) { alert(err.response?.data?.error || err.message); }
  };

  return (
    <div style={{ background: '#ffffff', border: '1px solid #e4e7eb', borderRadius: '6px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid #e4e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#172b4d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#172b4d' }}>Team Members</span>
          <span style={{ fontSize: '0.75rem', color: '#97a0af' }}>{users.length} members</span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => openModal(null, 'Admin')} style={{ padding: '5px 12px', borderRadius: '4px', border: '1px solid #1e293b', background: '#1e293b', color: '#ffffff', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>
            + Admin
          </button>
          <button onClick={() => openModal(null, 'TeamMember')} style={{ padding: '5px 12px', borderRadius: '4px', border: '1px solid #dfe1e6', background: '#ffffff', color: '#172b4d', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f4f5f7'}
            onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}>
            + Employee
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
          <thead>
            <tr>
              <th style={{ ...thS, width: '50px' }}>ID</th>
              <th style={thS}>Name</th>
              <th style={thS}>Email</th>
              <th style={thS}>Role</th>
              <th style={thS}>Departments</th>
              <th style={thS}>Companies</th>
              <th style={thS}>Phone</th>
              <th style={{ ...thS, textAlign: 'right', paddingRight: '14px', width: '80px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const rs = roleMap[u.Role] || roleMap.TeamMember;
              return (
                <tr key={u.UserID} onMouseEnter={e => e.currentTarget.style.background = '#f8f9fa'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} style={{ transition: 'background 0.1s' }}>
                  <td style={{ ...tdS, color: '#97a0af', fontSize: '0.75rem' }}>{u.UserID}</td>
                  <td style={{ ...tdS, fontWeight: 500 }}>{u.FullName}</td>
                  <td style={{ ...tdS, color: '#5e6c84', fontSize: '0.75rem' }}>{u.Email}</td>
                  <td style={tdS}>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 600, padding: '2px 7px', borderRadius: '3px', background: rs.bg, color: rs.text }}>
                      {u.Role === 'TeamMember' ? 'Employee' : u.Role === 'DeptAdmin' ? 'Dept Head' : u.Role}
                    </span>
                  </td>
                  <td style={{ ...tdS, fontSize: '0.75rem', color: '#5e6c84' }}>{u.Department || 'Operations'}</td>
                  <td style={{ ...tdS, fontSize: '0.75rem', color: '#5e6c84' }}>{u.BusinessEntities || '—'}</td>
                  <td style={{ ...tdS, color: '#97a0af', fontSize: '0.75rem' }}>{u.Phone || '—'}</td>
                  <td style={{ ...tdS, textAlign: 'right', paddingRight: '14px' }}>
                    <div style={{ display: 'flex', gap: '2px', justifyContent: 'flex-end' }}>
                      <button onClick={() => openModal(u)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '3px', transition: 'background 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f4f5f7'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'} title="Edit">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5e6c84" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      {canDelete && (
                        <button onClick={() => handleDelete(u)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '3px', transition: 'background 0.1s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#ffebe6'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'} title="Delete">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#de350b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showAddModal && ReactDOM.createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(9,30,66,0.54)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '6px', width: '100%', maxWidth: '460px', boxShadow: '0 8px 24px rgba(9,30,66,0.14)', overflow: 'hidden' }}>
            {/* Modal header */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f4f5f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: '#172b4d' }}>
                {editingUser ? 'Edit Member' : 'Add Team Member'}
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#97a0af', fontSize: '1rem', lineHeight: 1 }}>✕</button>
            </div>

            {msg && (
              <div style={{ margin: '12px 20px 0', padding: '8px 12px', borderRadius: '4px', fontSize: '0.8125rem', background: msg.includes('added') || msg.includes('updated') ? '#e3fcef' : '#ffebe6', color: msg.includes('added') || msg.includes('updated') ? '#00875a' : '#de350b', border: `1px solid ${msg.includes('added') || msg.includes('updated') ? '#abe2cc' : '#ffbdad'}` }}>
                {msg}
              </div>
            )}

            <form onSubmit={handleSave} style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div><label style={lbl}>Full Name *</label><input type="text" style={inp} placeholder="e.g. Rahul Sharma" value={fullName} onChange={e => setFullName(e.target.value)} onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#dfe1e6'} required /></div>
              <div><label style={lbl}>Work Email *</label><input type="email" style={inp} placeholder="rahul@company.com" value={email} onChange={e => setEmail(e.target.value)} onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#dfe1e6'} required /></div>
              <div>
                <label style={lbl}>Role</label>
                <select style={inp} value={role} onChange={e => setRole(e.target.value)} onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#dfe1e6'}>
                  <option value="TeamMember">Employee</option>
                  <option value="DeptAdmin">Department Head</option>
                  <option value="Admin">Admin (Company Admin)</option>
                  {canAddSuper && <option value="SuperAdmin">Super Admin</option>}
                </select>
              </div>

              {/* Departments */}
              <div style={{ background: '#f8f9fa', padding: '10px 12px', borderRadius: '4px', border: '1px solid #e4e7eb' }}>
                <label style={{ ...lbl, marginBottom: '8px' }}>Assigned Departments</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {departments.map(d => (
                    <label key={d.DepartmentID} style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#172b4d' }}>
                      <input type="checkbox" checked={selectedDepts.includes(d.Name)} onChange={() => toggleDept(d.Name)} />
                      <span>{d.Name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Business Entities */}
              <div style={{ background: '#f8f9fa', padding: '10px 12px', borderRadius: '4px', border: '1px solid #e4e7eb' }}>
                <label style={{ ...lbl, marginBottom: '8px' }}>Assigned Companies</label>
                {dynamicBizList.length === 0 ? (
                  <div style={{ fontSize: '0.75rem', color: '#b45309', background: '#fff3cd', padding: '8px 10px', borderRadius: '3px' }}>No companies added yet. Go to Settings → Companies first.</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    {dynamicBizList.map(biz => (
                      <label key={biz} style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#172b4d' }}>
                        <input type="checkbox" checked={selectedBizs.includes(biz)} onChange={() => toggleBiz(biz)} />
                        <span>{biz}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div><label style={lbl}>Phone (Optional)</label><input type="text" style={inp} placeholder="+91 9876543210" value={phone} onChange={e => setPhone(e.target.value)} onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#dfe1e6'} /></div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '4px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '7px 14px', borderRadius: '4px', border: '1px solid #dfe1e6', background: '#ffffff', color: '#5e6c84', fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding: '7px 16px', borderRadius: '4px', border: 'none', background: '#1e293b', color: '#ffffff', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving...' : editingUser ? 'Save Changes' : 'Add Member'}
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
