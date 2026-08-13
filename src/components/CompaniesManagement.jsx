import React, { useState, useEffect } from 'react';
import axios from 'axios';

const inp = {
  width: '100%', padding: '7px 10px', fontSize: '0.8125rem',
  borderRadius: '4px', border: '1.5px solid #dfe1e6', outline: 'none',
  background: '#ffffff', color: '#172b4d', fontFamily: 'Inter, sans-serif',
  transition: 'border-color 0.15s ease'
};
const lbl = { display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: '#5e6c84', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' };
const fRow = { marginBottom: '0' };

export default function CompaniesManagement({ token, user, onRefresh, onNavigateToCompany }) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCompany, setNewCompany] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { fetchCompanies(); }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/businesses', { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) setCompanies(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newCompany.name.trim()) return;
    setSubmitting(true);
    try {
      const res = await axios.post('/api/businesses', newCompany, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        setMsg(`Company "${newCompany.name}" added successfully.`);
        setShowAddModal(false);
        setNewCompany({ name: '', description: '' });
        fetchCompanies();
        if (onRefresh) onRefresh();
        setTimeout(() => setMsg(''), 4000);
      }
    } catch (err) { alert('Error: ' + (err.response?.data?.error || err.message)); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete company "${name}"?`)) return;
    try {
      await axios.delete(`/api/businesses/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setMsg(`Company "${name}" deleted.`);
      fetchCompanies();
      if (onRefresh) onRefresh();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) { alert('Error: ' + (err.response?.data?.error || err.message)); }
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <h2 style={{ margin: '0 0 3px', fontSize: '1rem', fontWeight: 700, color: '#172b4d' }}>Business Entities</h2>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: '#97a0af' }}>Manage organizations and companies. Departments and team members are assigned across entities.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{ padding: '7px 14px', borderRadius: '4px', border: 'none', background: '#1e293b', color: '#ffffff', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          + Add Company
        </button>
      </div>

      {msg && (
        <div style={{ padding: '8px 12px', background: '#e3fcef', border: '1px solid #abe2cc', borderRadius: '4px', marginBottom: '14px', fontSize: '0.8125rem', color: '#00875a' }}>
          {msg}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#97a0af', fontSize: '0.875rem' }}>Loading...</div>
      ) : companies.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', background: '#ffffff', borderRadius: '6px', border: '1px solid #e4e7eb' }}>
          <div style={{ fontSize: '1.75rem', marginBottom: '8px' }}>🏢</div>
          <div style={{ fontWeight: 600, color: '#172b4d', marginBottom: '4px' }}>No Companies Added Yet</div>
          <p style={{ fontSize: '0.8125rem', color: '#97a0af', marginBottom: '14px' }}>Create your first company to get started.</p>
          <button onClick={() => setShowAddModal(true)} style={{ padding: '7px 16px', borderRadius: '4px', border: 'none', background: '#1e293b', color: '#ffffff', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>
            + Add Company
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
          {companies.map(c => (
            <div key={c.id || c.business_id} style={{ background: '#ffffff', border: '1px solid #e4e7eb', borderRadius: '6px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: '#f4f5f7', border: '1px solid #e4e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                  🏢
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#172b4d' }}>{c.name}</div>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 600, padding: '1px 6px', borderRadius: '10px', background: '#e3fcef', color: '#00875a' }}>
                    {c.status || 'Active'}
                  </span>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: '#5e6c84', lineHeight: 1.5 }}>
                {c.description || 'No description provided.'}
              </p>
              <div style={{ borderTop: '1px solid #f4f5f7', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#97a0af' }}>ID: {c.business_id}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {onNavigateToCompany && (
                    <button
                      type="button"
                      onClick={() => onNavigateToCompany(c)}
                      style={{
                        border: '1px solid #2563eb',
                        background: '#eff6ff',
                        color: '#2563eb',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '4px',
                        transition: 'background 0.15s, color 0.15s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.color = '#ffffff'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = '#2563eb'; }}
                    >
                      Open →
                    </button>
                  )}
                  <button type="button" onClick={() => handleDelete(c.id, c.name)} style={{ border: 'none', background: 'transparent', color: '#de350b', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, padding: '2px 6px', borderRadius: '3px' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#ffebe6'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Company Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(9,30,66,0.54)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '6px', maxWidth: '420px', width: '100%', boxShadow: '0 8px 24px rgba(9,30,66,0.14)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f4f5f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: '#172b4d' }}>Add Business Entity</h3>
              <button type="button" onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#97a0af', fontSize: '1rem' }}>✕</button>
            </div>
            <form onSubmit={handleCreate} style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={lbl}>Company Name *</label>
                <input type="text" style={inp} placeholder="e.g. Apex Global Solutions" value={newCompany.name} onChange={e => setNewCompany({ ...newCompany, name: e.target.value })} onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#dfe1e6'} required />
              </div>
              <div>
                <label style={lbl}>Description (Optional)</label>
                <textarea style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }} rows={3} placeholder="Brief summary of company focus or division..." value={newCompany.description} onChange={e => setNewCompany({ ...newCompany, description: e.target.value })} onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#dfe1e6'} />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '4px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '7px 14px', borderRadius: '4px', border: '1px solid #dfe1e6', background: '#ffffff', color: '#5e6c84', fontSize: '0.8125rem', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ padding: '7px 16px', borderRadius: '4px', border: 'none', background: '#1e293b', color: '#ffffff', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? 'Creating...' : 'Create Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
