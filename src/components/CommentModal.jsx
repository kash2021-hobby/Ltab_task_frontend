import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';

function Avatar({ name, size = 32 }) {
  const initials = (name || '?')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const colors = ['#3b82f6','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#6366f1'];
  const color = colors[(name || '').charCodeAt(0) % colors.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700,
      flexShrink: 0, letterSpacing: '0.02em'
    }}>
      {initials}
    </div>
  );
}

function TimeAgo({ dateStr }) {
  const d = new Date(dateStr);
  const now = Date.now();
  const diff = Math.floor((now - d.getTime()) / 1000);
  let label;
  if (diff < 60) label = 'just now';
  else if (diff < 3600) label = `${Math.floor(diff / 60)}m ago`;
  else if (diff < 86400) label = `${Math.floor(diff / 3600)}h ago`;
  else label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return (
    <span title={d.toLocaleString()} style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>
      {label}
    </span>
  );
}

export default function CommentModal({ taskId, taskTitle, onClose, token, users = [] }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [commentText, setCommentText] = useState('');
  const [selectedTaggedUsers, setSelectedTaggedUsers] = useState([]);
  const [file, setFile] = useState(null);
  const [tagOpen, setTagOpen] = useState(false);
  const tagRef = useRef(null);
  const textareaRef = useRef(null);
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (taskId) fetchComments();
  }, [taskId]);

  useEffect(() => {
    if (!tagOpen) return;
    const handler = (e) => {
      if (tagRef.current && !tagRef.current.contains(e.target)) setTagOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [tagOpen]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/comments/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        const sorted = (res.data.data || []).sort((a, b) =>
          new Date(a.CreatedAt || 0) - new Date(b.CreatedAt || 0)
        );
        setComments(sorted);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTagUser = (userId) => {
    setSelectedTaggedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSaving(true);
    setMsg('');
    try {
      const formData = new FormData();
      formData.append('taskId', taskId);
      formData.append('commentText', commentText);
      formData.append('taggedUsers', JSON.stringify(selectedTaggedUsers));
      if (file) formData.append('document', file);
      const res = await axios.post('/api/comments', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setMsg('Comment posted successfully.');
        setCommentText('');
        setSelectedTaggedUsers([]);
        setFile(null);
        fetchComments();
        setTimeout(() => setMsg(''), 3000);
      }
    } catch (err) {
      setMsg('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const taggedNames = selectedTaggedUsers
    .map(id => users.find(u => u.UserID === id)?.FullName || id)
    .join(', ');

  return ReactDOM.createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 999999,
        background: 'rgba(23, 43, 77, 0.45)',
        backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div style={{
        background: '#ffffff',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--ink-150)',
        width: '100%', maxWidth: '620px',
        maxHeight: '88vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: 'var(--shadow-xl)',
        fontFamily: "var(--font-family)",
        animation: 'modalIn 0.18s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          gap: '12px', flexShrink: 0
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em' }}>
              Comments
              {!loading && (
                <span style={{ marginLeft: '8px', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', background: '#f1f5f9', padding: '2px 8px', borderRadius: '99px' }}>
                  {comments.length}
                </span>
              )}
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#64748b', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '400px' }}>
              {taskTitle || taskId}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '8px',
              border: '1px solid #e2e8f0', background: '#f8fafc',
              color: '#64748b', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem', lineHeight: 1, flexShrink: 0
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#1e293b'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b'; }}
          >
            ×
          </button>
        </div>

        {/* ── Feed ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {loading ? (
            [1,2].map(i => (
              <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f1f5f9', flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ width: '120px', height: 10, borderRadius: 4, background: '#f1f5f9' }} />
                  <div style={{ width: '80%', height: 10, borderRadius: 4, background: '#f1f5f9' }} />
                  <div style={{ width: '60%', height: 10, borderRadius: 4, background: '#f1f5f9' }} />
                </div>
              </div>
            ))
          ) : comments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: '#94a3b8', fontSize: '0.85rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px', opacity: 0.35 }}>💬</div>
              No comments yet. Be the first to comment.
            </div>
          ) : (
            comments.map(c => {
              const authorName = c.AuthorName || 'Unknown';
              return (
                <div key={c.CommentID} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <Avatar name={authorName} size={32} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>{authorName}</span>
                      <TimeAgo dateStr={c.CreatedAt} />
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {c.CommentText}
                    </p>
                    {c.TaggedUsers && c.TaggedUsers.length > 0 && (
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '8px' }}>
                        {c.TaggedUsers.map((tId, idx) => {
                          const mu = users.find(u => u.UserID === tId || u.Email === tId || u.FullName === tId);
                          return (
                            <span key={idx} style={{ fontSize: '0.72rem', fontWeight: 600, background: '#eff6ff', color: '#3b82f6', border: '1px solid #dbeafe', padding: '2px 8px', borderRadius: '99px' }}>
                              @{mu ? mu.FullName : tId}
                            </span>
                          );
                        })}
                      </div>
                    )}
                    {c.DocumentUrl && (
                      <a href={c.DocumentUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '8px', fontSize: '0.76rem', fontWeight: 600, color: '#3b82f6', textDecoration: 'none', background: '#f0f9ff', border: '1px solid #bae6fd', padding: '4px 10px', borderRadius: '6px' }}>
                        📎 {c.DocumentName || 'Attachment'}
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Compose ── */}
        <div style={{ borderTop: '1px solid #f1f5f9', flexShrink: 0 }}>
          {msg && (
            <div style={{ margin: '10px 24px 0', padding: '8px 14px', background: msg.startsWith('Error') ? '#fef2f2' : '#f0fdf4', color: msg.startsWith('Error') ? '#dc2626' : '#16a34a', border: `1px solid ${msg.startsWith('Error') ? '#fecaca' : '#bbf7d0'}`, borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600 }}>
              {msg}
            </div>
          )}
          <form onSubmit={handleAddComment} style={{ padding: '14px 24px 18px' }}>
            <div
              style={{ border: '1.5px solid #e2e8f0', borderRadius: '12px', background: '#fafafa', overflow: 'visible' }}
              onFocusCapture={e => e.currentTarget.style.borderColor = '#3b82f6'}
              onBlurCapture={e => e.currentTarget.style.borderColor = '#e2e8f0'}
            >
              {/* Text input row */}
              <div style={{ display: 'flex', gap: '10px', padding: '12px 14px 6px', alignItems: 'flex-start' }}>
                <Avatar name={storedUser?.full_name || storedUser?.name || 'Me'} size={28} />
                <textarea
                  ref={textareaRef}
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  required
                  rows={2}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAddComment(e);
                  }}
                  style={{
                    flex: 1, border: 'none', outline: 'none', resize: 'none',
                    fontSize: '0.875rem', color: '#1e293b', background: 'transparent',
                    fontFamily: "'Inter', sans-serif", lineHeight: 1.55, padding: 0
                  }}
                />
              </div>

              {/* Action row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px 10px', borderTop: '1px solid #f1f5f9', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>

                  {/* @Tag dropdown */}
                  <div ref={tagRef} style={{ position: 'relative', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => setTagOpen(!tagOpen)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        padding: '5px 10px', borderRadius: '6px',
                        border: selectedTaggedUsers.length > 0 ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                        background: selectedTaggedUsers.length > 0 ? '#eff6ff' : '#f8fafc',
                        color: selectedTaggedUsers.length > 0 ? '#3b82f6' : '#64748b',
                        fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap'
                      }}
                    >
                      @ Tag
                      {selectedTaggedUsers.length > 0 && (
                        <span style={{ background: '#3b82f6', color: '#fff', borderRadius: '99px', padding: '1px 6px', fontSize: '0.68rem', fontWeight: 700 }}>
                          {selectedTaggedUsers.length}
                        </span>
                      )}
                    </button>
                    {tagOpen && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '6px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 8px 24px -4px rgba(15,23,42,0.2)', width: '240px', zIndex: 9999999, maxHeight: '220px', overflowY: 'auto', padding: '6px' }}>
                        {users.length === 0 ? (
                          <div style={{ padding: '10px', fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center' }}>No users available</div>
                        ) : users.map(u => {
                          const isSel = selectedTaggedUsers.includes(u.UserID);
                          return (
                            <div
                              key={u.UserID}
                              onClick={() => handleToggleTagUser(u.UserID)}
                              style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '7px 10px', borderRadius: '7px', cursor: 'pointer', background: isSel ? '#eff6ff' : 'transparent' }}
                              onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = '#f8fafc'; }}
                              onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
                            >
                              <Avatar name={u.FullName} size={24} />
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.FullName || u.Email}</div>
                                <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{u.Department || u.Role}</div>
                              </div>
                              {isSel && <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 700 }}>✓</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Attach file */}
                  <label style={{ cursor: 'pointer', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '6px', border: file ? '1px solid #bfdbfe' : '1px solid #e2e8f0', background: file ? '#eff6ff' : '#f8fafc', color: file ? '#3b82f6' : '#64748b', fontSize: '0.75rem', fontWeight: 600, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      📎 {file ? file.name : 'Attach'}
                    </div>
                    <input type="file" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])} />
                  </label>

                  {selectedTaggedUsers.length > 0 && (
                    <span style={{ fontSize: '0.72rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      @{taggedNames}
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={saving || !commentText.trim()}
                  style={{ padding: '6px 18px', borderRadius: '8px', background: saving || !commentText.trim() ? '#e2e8f0' : '#1e293b', color: saving || !commentText.trim() ? '#94a3b8' : '#ffffff', border: 'none', fontSize: '0.8rem', fontWeight: 700, cursor: saving || !commentText.trim() ? 'not-allowed' : 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}
                >
                  {saving ? 'Posting…' : 'Comment'}
                </button>
              </div>
            </div>
            <div style={{ marginTop: '5px', fontSize: '0.69rem', color: '#cbd5e1', textAlign: 'right' }}>
              Ctrl + Enter to post
            </div>
          </form>
        </div>

      </div>
    </div>,
    document.body
  );
}
