import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';

export default function AIChat({ token, user, isOpen, onToggle, onClose }) {
  const [messages, setMessages] = useState([
    { sender: 'ai', text: `Hello ${user?.full_name || 'Admin'}! 👋 I am Company X Operational AI Assistant. Ask me anything about task bottlenecks, department workloads, or drafting task plans!` }
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setSending(true);

    try {
      const res = await axios.post('/api/ai/chat', { message: userText }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setMessages(prev => [...prev, { sender: 'ai', text: res.data.reply }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'ai', text: '❌ Error: Unable to connect to AI engine.' }]);
    } finally {
      setSending(false);
    }
  };

  const handleClear = () => {
    setMessages([
      { sender: 'ai', text: `Chat cleared! How can I assist you now, ${user?.full_name || 'User'}? 🤖` }
    ]);
  };

  return ReactDOM.createPortal(
    <>
      {/* Bottom-Right Floating AI Widget Button */}
      <button
        type="button"
        onClick={onToggle}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 99990,
          background: '#1e293b',
          color: '#ffffff',
          border: 'none',
          borderRadius: '24px',
          padding: '10px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 600,
          fontSize: '0.8125rem',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(9,30,66,0.25)',
          transition: 'all 0.2s ease',
          outline: 'none',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#0f172a'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.transform = 'translateY(0)'; }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span>AI Assistant</span>
        {!isOpen && (
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
        )}
      </button>

      {/* 2. Non-blocking Soft Backdrop (Optional) */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.2)',
            backdropFilter: 'blur(2px)',
            zIndex: 99994,
            transition: 'opacity 0.3s ease'
          }}
        />
      )}

      {/* 3. Slide-Out Right Drawer (30% Screen Width Hostinger-style) */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '32vw',
          minWidth: '340px',
          maxWidth: '460px',
          height: '100vh',
          background: '#ffffff',
          zIndex: 99999,
          boxShadow: '-8px 0 32px rgba(15, 23, 42, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
          borderLeft: '1px solid var(--border)'
        }}
      >
        {/* Drawer Header */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #e4e7eb', background: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: '#172b4d', display: 'flex', alignItems: 'center', gap: '7px' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              AI Assistant
            </h3>
            <small style={{ color: '#97a0af', fontSize: '0.6875rem' }}>Gemini Operational Assistant</small>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button type="button" onClick={handleClear} title="Clear Chat"
              style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #dfe1e6', background: '#ffffff', color: '#5e6c84', cursor: 'pointer' }}>
              Clear
            </button>
            <button type="button" onClick={onClose} title="Close"
              style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #dfe1e6', background: '#ffffff', color: '#5e6c84', cursor: 'pointer' }}>
              ✕
            </button>
          </div>
        </div>

        {/* Message Scrollable Area */}
        <div style={{
          flex: 1,
          padding: '16px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          background: '#f8fafc'
        }}>
          {messages.map((m, idx) => (
            <div key={idx} style={{
              alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              background: m.sender === 'user' ? '#1e293b' : '#ffffff',
              color: m.sender === 'user' ? '#ffffff' : '#172b4d',
              padding: '10px 14px',
              borderRadius: '12px',
              borderBottomRightRadius: m.sender === 'user' ? '2px' : '12px',
              borderBottomLeftRadius: m.sender === 'ai' ? '2px' : '12px',
              fontSize: '0.8125rem',
              lineHeight: 1.5,
              boxShadow: '0 1px 4px rgba(9,30,66,0.06)',
              border: m.sender === 'ai' ? '1px solid #e4e7eb' : 'none',
              whiteSpace: 'pre-wrap'
            }}>
              {m.text}
            </div>
          ))}
          {sending && (
            <div style={{
              alignSelf: 'flex-start',
              background: '#ffffff',
              padding: '10px 14px',
              borderRadius: '12px',
              fontSize: '0.84rem',
              color: 'var(--accent-primary)',
              fontWeight: 600,
              border: '1px solid var(--border)'
            }}>
              ✨ AI is analyzing...
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleSend} style={{ padding: '12px 14px', borderTop: '1px solid #e4e7eb', background: '#ffffff', display: 'flex', gap: '8px' }}>
          <input type="text" placeholder="Ask AI about tasks, bottlenecks..."
            style={{ flex: 1, padding: '7px 10px', borderRadius: '4px', border: '1.5px solid #dfe1e6', fontSize: '0.8125rem', color: '#172b4d', outline: 'none', fontFamily: 'Inter, system-ui, sans-serif' }}
            value={input} onChange={e => setInput(e.target.value)}
            onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#dfe1e6'} />
          <button type="submit" disabled={sending}
            style={{ padding: '7px 16px', borderRadius: '4px', border: 'none', background: '#1e293b', color: '#ffffff', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', opacity: sending ? 0.7 : 1 }}>
            Send
          </button>
        </form>
      </div>
    </>,
    document.body
  );
}
