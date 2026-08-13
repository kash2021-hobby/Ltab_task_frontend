import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function SuperAdminPortal({ token, onRefresh, currentView = 'superadmin' }) {
  const [stats, setStats] = useState({
    totalAdmins: 0,
    pendingAdmins: 0,
    totalCompanies: 0,
    totalDepartments: 0,
    totalUsers: 0,
    totalTasks: 0
  });

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending' | 'directory'

  useEffect(() => {
    if (currentView === 'superadmin-approvals') {
      setActiveTab('pending');
    } else if (currentView === 'superadmin-directory') {
      setActiveTab('directory');
    } else {
      setActiveTab('all');
    }
  }, [currentView]);

  // Form for creating Admin account directly
  const [newAdmin, setNewAdmin] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    businessEntities: ''
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchSuperAdminData();
    const interval = setInterval(() => {
      fetchSuperAdminData(true);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchSuperAdminData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const [statsRes, adminsRes] = await Promise.all([
        axios.get('/api/superadmin/stats', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/superadmin/admins', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
      if (adminsRes.data.success) {
        setAdmins(adminsRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching SuperAdmin data:', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const handleApproveAdmin = async (userId, name) => {
    try {
      const res = await axios.put(`/api/superadmin/admins/${userId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setActionMsg(`✅ Admin account for ${name} has been approved & activated!`);
        fetchSuperAdminData();
        if (onRefresh) onRefresh();
        setTimeout(() => setActionMsg(''), 4000);
      }
    } catch (err) {
      alert('Error approving admin: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleToggleStatus = async (userId, currentStatus, name) => {
    const nextStatus = currentStatus === 'Active' ? 'Disabled' : 'Active';
    try {
      const res = await axios.put(`/api/superadmin/admins/${userId}/status`, { status: nextStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setActionMsg(`✅ Admin status for ${name} updated to ${nextStatus}.`);
        fetchSuperAdminData();
        if (onRefresh) onRefresh();
        setTimeout(() => setActionMsg(''), 4000);
      }
    } catch (err) {
      alert('Error updating status: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteAdmin = async (userId, name) => {
    if (!window.confirm(`Are you sure you want to delete Admin account "${name}"? This action cannot be undone.`)) return;

    try {
      const res = await axios.delete(`/api/superadmin/admins/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setActionMsg(`🗑️ Admin account for ${name} has been deleted.`);
        fetchSuperAdminData();
        if (onRefresh) onRefresh();
        setTimeout(() => setActionMsg(''), 4000);
      }
    } catch (err) {
      alert('Error deleting admin: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleCreateAdminSubmit = async (e) => {
    e.preventDefault();
    if (!newAdmin.fullName || !newAdmin.email || !newAdmin.password) return;

    setCreating(true);
    try {
      const res = await axios.post('/api/superadmin/admins', newAdmin, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setActionMsg(`✨ Admin account for ${newAdmin.fullName} created successfully!`);
        setShowCreateModal(false);
        setNewAdmin({ fullName: '', email: '', password: '', phone: '', businessEntities: '' });
        fetchSuperAdminData();
        if (onRefresh) onRefresh();
        setTimeout(() => setActionMsg(''), 4000);
      }
    } catch (err) {
      alert('Error creating admin: ' + (err.response?.data?.error || err.message));
    } finally {
      setCreating(false);
    }
  };

  const filteredAdmins = admins.filter(admin => {
    if (activeTab === 'pending') return admin.status === 'Pending';
    if (activeTab === 'directory') return admin.status !== 'Pending';
    return true;
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            👑 SuperAdmin Master Control Portal
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
            Monitor organization Admins, approve registration requests, and oversee platform companies & departments.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          style={{ background: 'linear-gradient(135deg, #ea580c, #f97316)', borderRadius: '8px', fontSize: '0.86rem' }}
          onClick={() => setShowCreateModal(true)}
        >
          + Create Admin Account
        </button>
      </div>

      {/* Sub-Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
        <button
          type="button"
          className={`btn ${activeTab === 'all' ? 'btn-primary' : 'btn-outline'}`}
          style={{ padding: '6px 14px', fontSize: '0.82rem', borderRadius: '6px' }}
          onClick={() => setActiveTab('all')}
        >
          👑 Master Overview
        </button>
        <button
          type="button"
          className={`btn ${activeTab === 'pending' ? 'btn-primary' : 'btn-outline'}`}
          style={{ padding: '6px 14px', fontSize: '0.82rem', borderRadius: '6px', position: 'relative' }}
          onClick={() => setActiveTab('pending')}
        >
          ⏳ Pending Approvals {stats.pendingAdmins > 0 && (
            <span style={{ background: '#dc2626', color: '#fff', fontSize: '0.7rem', padding: '1px 6px', borderRadius: '10px', marginLeft: '6px' }}>
              {stats.pendingAdmins}
            </span>
          )}
        </button>
        <button
          type="button"
          className={`btn ${activeTab === 'directory' ? 'btn-primary' : 'btn-outline'}`}
          style={{ padding: '6px 14px', fontSize: '0.82rem', borderRadius: '6px' }}
          onClick={() => setActiveTab('directory')}
        >
          🏢 Admin Directory & Companies ({stats.totalAdmins})
        </button>
      </div>

      {actionMsg && (
        <div style={{ padding: '12px 16px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '8px', marginBottom: '20px', fontSize: '0.88rem', fontWeight: 600 }}>
          {actionMsg}
        </div>
      )}

      {/* Analytics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '14px', marginBottom: '28px' }}>
        <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ea580c' }}>{stats.totalAdmins}</div>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '2px' }}>Total Admins</div>
        </div>

        <div style={{ background: stats.pendingAdmins > 0 ? '#fff7ed' : '#ffffff', border: stats.pendingAdmins > 0 ? '1.5px solid #fdba74' : '1px solid var(--border)', borderRadius: '10px', padding: '16px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: stats.pendingAdmins > 0 ? '#d97706' : '#64748b' }}>{stats.pendingAdmins}</div>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: stats.pendingAdmins > 0 ? '#d97706' : 'var(--text-secondary)', marginTop: '2px' }}>Pending Approvals</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2563eb' }}>{stats.totalCompanies}</div>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '2px' }}>Total Companies</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#7c3aed' }}>{stats.totalDepartments}</div>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '2px' }}>Total Departments</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0284c7' }}>{stats.totalUsers}</div>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '2px' }}>Total Users</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#16a34a' }}>{stats.totalTasks}</div>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '2px' }}>Total Active Tasks</div>
        </div>
      </div>

      {/* Admin Accounts Management Table */}
      <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#1e293b' }}>
            🏢 Organization Admin Accounts & Approval Requests
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Showing {filteredAdmins.length} admins
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Loading Admin directory...
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {activeTab === 'pending' ? '🎉 No pending Admin registration requests!' : 'No Admin accounts found.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px' }}>Admin Name</th>
                  <th style={{ padding: '10px 12px' }}>Email Address</th>
                  <th style={{ padding: '10px 12px' }}>Role Scope</th>
                  <th style={{ padding: '10px 12px' }}>Account Status</th>
                  <th style={{ padding: '10px 12px' }}>Companies</th>
                  <th style={{ padding: '10px 12px' }}>Depts</th>
                  <th style={{ padding: '10px 12px' }}>Registered Date</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>SuperAdmin Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdmins.map(admin => {
                  const isPending = admin.status === 'Pending';
                  const isDisabled = admin.status === 'Disabled';
                  const isMaster = admin.role === 'SuperAdmin' || admin.role === 'Founder';

                  return (
                    <tr key={admin.user_id} style={{ borderBottom: '1px solid var(--border)', background: isPending ? '#fff7ed' : 'transparent' }}>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{admin.full_name}</div>
                        {admin.phone && <div style={{ fontSize: '0.74rem', color: '#64748b' }}>📱 {admin.phone}</div>}
                      </td>
                      <td style={{ padding: '12px', color: '#334155' }}>{admin.email}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: isMaster ? '#f3e8ff' : '#eff6ff',
                          color: isMaster ? '#7c3aed' : '#2563eb',
                          border: `1px solid ${isMaster ? '#d8b4fe' : '#bfdbfe'}`
                        }}>
                          {isMaster ? '👑 SuperAdmin (Master)' : '🏢 Admin (Company)'}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        {isPending ? (
                          <span style={{ fontSize: '0.74rem', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: '#fff7ed', color: '#d97706', border: '1px solid #fed7aa' }}>
                            ⏳ Pending Approval
                          </span>
                        ) : isDisabled ? (
                          <span style={{ fontSize: '0.74rem', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                            🚫 Disabled
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.74rem', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                            ✅ Active
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px', fontWeight: 700, color: '#2563eb' }}>{admin.companiesCount}</td>
                      <td style={{ padding: '12px', fontWeight: 700, color: '#7c3aed' }}>{admin.departmentsCount}</td>
                      <td style={{ padding: '12px', color: '#64748b', fontSize: '0.78rem' }}>
                        {admin.created_at ? new Date(admin.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        {!isMaster && (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                            {isPending && (
                              <button
                                type="button"
                                className="btn btn-primary"
                                style={{ padding: '4px 10px', fontSize: '0.76rem', background: '#16a34a', borderColor: '#16a34a', borderRadius: '6px' }}
                                onClick={() => handleApproveAdmin(admin.user_id, admin.full_name)}
                              >
                                ✓ Approve
                              </button>
                            )}

                            <button
                              type="button"
                              className="btn btn-outline"
                              style={{
                                padding: '4px 10px',
                                fontSize: '0.76rem',
                                color: isDisabled ? '#16a34a' : '#d97706',
                                borderColor: isDisabled ? '#bbf7d0' : '#fed7aa',
                                borderRadius: '6px'
                              }}
                              onClick={() => handleToggleStatus(admin.user_id, admin.status, admin.full_name)}
                            >
                              {isDisabled ? 'Enable' : 'Disable'}
                            </button>

                            <button
                              type="button"
                              className="btn btn-outline"
                              style={{ padding: '4px 10px', fontSize: '0.76rem', color: '#dc2626', borderColor: '#fecaca', borderRadius: '6px' }}
                              onClick={() => handleDeleteAdmin(admin.user_id, admin.full_name)}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '100%', maxWidth: '480px', padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#ea580c' }}>
                ➕ Create Company Admin Account
              </h4>
              <button type="button" className="btn btn-outline" style={{ padding: '2px 8px' }} onClick={() => setShowCreateModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateAdminSubmit}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Ankit Poudel"
                  value={newAdmin.fullName}
                  onChange={(e) => setNewAdmin({ ...newAdmin, fullName: e.target.value })}
                  required
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="admin@company.com"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  required
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Password *
                </label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Set initial password..."
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                  required
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Phone Number
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="+1 555-0192"
                  value={newAdmin.phone}
                  onChange={(e) => setNewAdmin({ ...newAdmin, phone: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Managed Business Entities (Companies)
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Elixir Tea, NPS, CPC"
                  value={newAdmin.businessEntities}
                  onChange={(e) => setNewAdmin({ ...newAdmin, businessEntities: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating} style={{ background: '#ea580c' }}>
                  {creating ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
