import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Set default API URL to VPS Production API
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'https://taskapi.ltabai.in';

import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import KanbanBoard from './components/KanbanBoard';
import TaskTable from './components/TaskTable';
import TaskModal from './components/TaskModal';
import AITaskForm from './components/AITaskForm';
import TelegramSettings from './components/TelegramSettings';
import UsersManagement from './components/UsersManagement';
import DepartmentsManagement from './components/DepartmentsManagement';
import Reports from './components/Reports';
import AIChat from './components/AIChat';
import CapacityAnalytics from './components/CapacityAnalytics';
import CommentModal from './components/CommentModal';
import ProjectsManagement from './components/ProjectsManagement';
import SuperAdminPortal from './components/SuperAdminPortal';
import CompaniesManagement from './components/CompaniesManagement';
import ActionPlansManagement from './components/ActionPlansManagement';
import MyTasks from './components/MyTasks';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  const [actionPlansEnabled, setActionPlansEnabled] = useState(
    localStorage.getItem('actionPlansEnabled') !== 'false'
  );

  // App Navigation State
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedBusiness, setSelectedBusiness] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [showAIChat, setShowAIChat] = useState(false);

  // Comment Modal State
  const [activeCommentTask, setActiveCommentTask] = useState(null);

  // Master Data
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAITaskModal, setShowAITaskModal] = useState(false);

  // Login & Registration Form State
  const [loginStep, setLoginStep] = useState('email'); // 'email' | 'password' | 'create-password' | 'forgot-otp' | 'register'
  const [emailInput, setEmailInput] = useState('superadmin@company.com');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmNewPasswordInput, setConfirmNewPasswordInput] = useState('');

  // Registration Form State
  const [registerRole, setRegisterRole] = useState('Admin');
  const [registerFullName, setRegisterFullName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerBusinessEntities, setRegisterBusinessEntities] = useState('');

  const [authUserInfo, setAuthUserInfo] = useState(null);
  const [authError, setAuthError] = useState('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!registerEmail || !registerPassword || !registerFullName) return;
    setAuthLoading(true);
    setAuthError('');
    setAuthSuccessMsg('');

    try {
      const res = await axios.post('/api/auth/register', {
        email: registerEmail.trim(),
        password: registerPassword,
        fullName: registerFullName.trim(),
        role: registerRole,
        phone: registerPhone,
        businessEntities: registerBusinessEntities
      });

      if (res.data.success && res.data.data) {
        const { token, user } = res.data.data;
        setToken(token);
        setUser(user);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      }
    } catch (err) {
      setAuthError(err.response?.data?.error || err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'SuperAdmin' || user?.role === 'Founder') {
      setCurrentView('superadmin');
    } else {
      setCurrentView('dashboard');
    }
    if (user?.role === 'DeptAdmin' && user?.department) {
      setSelectedDepartment(user.department);
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      fetchMasterData();
    }
  }, [token, selectedBusiness, selectedDepartment]);

  // Auto-refresh tasks when switching to board/table/dashboard/my-tasks so newly assigned tasks appear immediately
  useEffect(() => {
    if (token && ['kanban', 'table', 'dashboard', 'my-tasks'].includes(currentView)) {
      fetchMasterData();
    }
  }, [currentView]);

  const fetchMasterData = async () => {
    setLoading(true);
    try {
      // Fetch Tasks
      const taskRes = await axios.get(`/api/tasks?department=${selectedDepartment}&businessEntity=${selectedBusiness}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (taskRes.data.success) setTasks(taskRes.data.data);

      // Fetch Users
      const userRes = await axios.get('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (userRes.data.success) setUsers(userRes.data.data);

      // Fetch Departments
      const deptRes = await axios.get('/api/departments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (deptRes.data.success) setDepartments(deptRes.data.data);

      // Fetch Projects
      const projRes = await axios.get(`/api/projects?department=${selectedDepartment}&businessEntity=${selectedBusiness}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (projRes.data.success) setProjects(projRes.data.data);

      // Fetch Businesses (Companies)
      const bizRes = await axios.get('/api/businesses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (bizRes.data.success) setBusinesses(bizRes.data.data);

    } catch (err) {
      console.error('Error fetching master data:', err);
      if (err.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Check Email in Employee Directory
  const handleCheckEmail = async (e) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setAuthLoading(true);
    setAuthError('');
    setAuthSuccessMsg('');

    try {
      const res = await axios.post('/api/auth/check-email', { email: emailInput.trim() });
      if (res.data.success) {
        if (!res.data.registered) {
          setAuthError(res.data.error);
        } else {
          setAuthUserInfo(res.data);
          if (res.data.hasPassword) {
            setLoginStep('password');
          } else {
            setLoginStep('create-password');
          }
        }
      }
    } catch (err) {
      setAuthError(err.response?.data?.error || err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Step 2A: Set Password for First Time Login
  const handleCreatePassword = async (e) => {
    e.preventDefault();
    if (!passwordInput || passwordInput !== confirmPasswordInput) {
      setAuthError('Passwords do not match');
      return;
    }
    setAuthLoading(true);
    setAuthError('');

    try {
      const res = await axios.post('/api/auth/set-password', {
        email: emailInput.trim(),
        password: passwordInput
      });
      if (res.data.success) {
        const { token, user } = res.data.data;
        setToken(token);
        setUser(user);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      }
    } catch (err) {
      setAuthError(err.response?.data?.error || err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Step 2B: Standard Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    try {
      const res = await axios.post('/api/auth/login', {
        email: emailInput.trim(),
        password: passwordInput
      });
      if (res.data.success) {
        const { token, user } = res.data.data;
        setToken(token);
        setUser(user);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      }
    } catch (err) {
      setAuthError(err.response?.data?.error || err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Step 3A: Request OTP for Forgot Password
  const handleRequestOtp = async () => {
    if (!emailInput.trim()) return;
    setAuthLoading(true);
    setAuthError('');
    setAuthSuccessMsg('');

    try {
      const res = await axios.post('/api/auth/forgot-password', { email: emailInput.trim() });
      if (res.data.success) {
        setAuthSuccessMsg(`OTP verification code sent to ${emailInput.trim()}. (Demo OTP: 52050)`);
        setOtpInput('');
        setNewPasswordInput('');
        setConfirmNewPasswordInput('');
        setLoginStep('forgot-otp');
      }
    } catch (err) {
      setAuthError(err.response?.data?.error || err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Step 3B: Verify OTP & Reset Password
  const handleResetPasswordWithOtp = async (e) => {
    e.preventDefault();
    if (!otpInput.trim()) {
      setAuthError('Please enter the 5-digit OTP code');
      return;
    }
    if (otpInput.trim() !== '52050') {
      setAuthError('Invalid OTP code. Please enter 52050.');
      return;
    }
    if (!newPasswordInput || newPasswordInput !== confirmNewPasswordInput) {
      setAuthError('Passwords do not match');
      return;
    }

    setAuthLoading(true);
    setAuthError('');
    setAuthSuccessMsg('');

    try {
      const res = await axios.post('/api/auth/reset-password', {
        email: emailInput.trim(),
        otp: otpInput.trim(),
        newPassword: newPasswordInput
      });
      if (res.data.success) {
        const { token, user } = res.data.data;
        setToken(token);
        setUser(user);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      }
    } catch (err) {
      setAuthError(err.response?.data?.error || err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const quickDemoLogin = (email) => {
    setEmailInput(email);
    axios.post('/api/auth/check-email', { email }).then(res => {
      if (res.data.success) {
        setAuthUserInfo(res.data);
        if (res.data.hasPassword) {
          setPasswordInput('admin123');
          setLoginStep('password');
        } else {
          setLoginStep('create-password');
        }
      }
    }).catch(err => setAuthError(err.message));
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    setLoginStep('email');
    setEmailInput('superadmin@company.com');
    setPasswordInput('');
    setConfirmPasswordInput('');
    setAuthUserInfo(null);
    setAuthError('');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const handleAssignTask = async (taskId, assigneeUserId) => {
    console.log('[CLIENT handleAssignTask] Invoked for taskId:', taskId, 'assigneeUserId:', assigneeUserId);
    const targetUser = users.find(u => u.UserID === assigneeUserId || u.user_id === assigneeUserId);
    const assigneeName = targetUser ? (targetUser.FullName || targetUser.full_name) : 'Unassigned (Dept Queue)';

    const confirmed = window.confirm(`Are you sure you want to reassign this task to "${assigneeName}"?`);
    if (!confirmed) {
      console.log('[CLIENT handleAssignTask] Cancelled by user in popup.');
      return false;
    }

    try {
      console.log('[CLIENT handleAssignTask] Sending PUT /api/tasks/' + taskId);
      const res = await axios.put(`/api/tasks/${taskId}`, {
        updates: { AssignedTo: assigneeUserId }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('[CLIENT handleAssignTask] Server Response:', res.data);
      if (res.data.success) {
        fetchMasterData();
        return true;
      }
    } catch (err) {
      console.error('[CLIENT handleAssignTask] Error assigning task:', err);
      return false;
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      const res = await axios.put(`/api/tasks/${taskId}`, {
        updates: { Status: newStatus }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        fetchMasterData();
      }
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  // LOGIN SCREEN
  if (!token || !user) {
    const authInputStyle = {
      width: '100%', padding: '8px 10px', borderRadius: '4px',
      border: '1.5px solid #dfe1e6', fontSize: '0.875rem',
      fontFamily: 'Inter, sans-serif', color: '#172b4d', outline: 'none',
      background: '#ffffff', transition: 'border-color 0.15s ease'
    };
    const authLabelStyle = {
      display: 'block', fontSize: '0.75rem', fontWeight: 600,
      color: '#5e6c84', marginBottom: '5px'
    };
    const authFieldStyle = { textAlign: 'left', marginBottom: '14px' };
    const btnPrimary = {
      width: '100%', padding: '9px 16px', borderRadius: '4px',
      background: '#1e293b', color: '#ffffff', border: 'none',
      fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
      fontFamily: 'Inter, sans-serif', marginBottom: '14px',
      transition: 'background 0.15s ease'
    };
    const btnOutline = {
      flex: 1, padding: '8px 12px', borderRadius: '4px',
      background: '#ffffff', color: '#5e6c84', border: '1px solid #dfe1e6',
      fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif'
    };
    const btnSubmit = {
      flex: 2, padding: '8px 12px', borderRadius: '4px',
      background: '#1e293b', color: '#ffffff', border: 'none',
      fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
      fontFamily: 'Inter, sans-serif', justifyContent: 'center'
    };
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f5f7' }}>
        {/* Left Panel */}
        <div style={{
          width: '380px', background: '#1e293b', display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between', padding: '40px 36px', flexShrink: 0
        }}>
          <div>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', margin: '0 0 8px', lineHeight: 1.2 }}>
              Task Management
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
              A powerful workspace for teams to plan, track, and deliver work efficiently.
            </p>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#334155' }}>
            © 2026 Evolution NetworX
          </div>
        </div>

        {/* Right Panel - Form */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#ffffff', border: '1px solid #e4e7eb', borderRadius: '8px', padding: '32px', width: '100%', maxWidth: '400px' }}>
          <span style={{ fontSize: '42px' }}>📊</span>
          <h2 style={{ fontSize: '1.4rem', margin: '12px 0 4px 0', color: 'var(--text-primary)' }}>Task Management App</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
            Full-Stack Task Management Platform
          </p>

          {/* Login card header */}
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#172b4d', margin: '0 0 4px' }}>Sign in to your workspace</h2>
            <p style={{ fontSize: '0.8125rem', color: '#97a0af', margin: 0 }}>Enter your credentials to continue</p>
          </div>

          {authSuccessMsg && (
            <div style={{ padding: '9px 12px', background: '#e3fcef', border: '1px solid #abe2cc', borderRadius: '4px', color: '#00875a', fontSize: '0.8125rem', marginBottom: '14px' }}>
              {authSuccessMsg}
            </div>
          )}

          {authError && (
            <div style={{ padding: '9px 12px', background: '#ffebe6', border: '1px solid #ffbdad', borderRadius: '4px', color: '#de350b', fontSize: '0.8125rem', marginBottom: '14px' }}>
              {authError}
            </div>
          )}

          {/* STEP 1: Enter Email */}
          {loginStep === 'email' && (
            <form onSubmit={handleCheckEmail}>
              <div style={authFieldStyle}>
                <label style={authLabelStyle}>Work Email Address *</label>
                <input
                  type="email" style={authInputStyle}
                  placeholder="e.g. employee@company.com"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  onFocus={e => e.target.style.borderColor = '#2563eb'}
                  onBlur={e => e.target.style.borderColor = '#dfe1e6'}
                  required
                />
              </div>
              <button type="submit" style={btnPrimary} disabled={authLoading}
                onMouseEnter={e => e.currentTarget.style.background = '#0f172a'}
                onMouseLeave={e => e.currentTarget.style.background = '#1e293b'}
              >
                {authLoading ? 'Checking...' : 'Continue'}
              </button>
            </form>
          )}

          {loginStep === 'register' && (
            <form onSubmit={handleRegister}>
              <div style={authFieldStyle}>
                <label style={authLabelStyle}>Account Role *</label>
                <select style={authInputStyle} value={registerRole} onChange={e => setRegisterRole(e.target.value)}>
                  <option value="Admin">Company Admin (Requires SuperAdmin Approval)</option>
                  <option value="TeamMember">Team Member / Employee</option>
                </select>
                {registerRole === 'Admin' && <div style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '5px' }}>Admin registrations require SuperAdmin approval before access is enabled.</div>}
              </div>
              <div style={authFieldStyle}>
                <label style={authLabelStyle}>Full Name *</label>
                <input type="text" style={authInputStyle} placeholder="e.g. Vijay Sharma" value={registerFullName} onChange={e => setRegisterFullName(e.target.value)} onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#dfe1e6'} required />
              </div>
              <div style={authFieldStyle}>
                <label style={authLabelStyle}>Email Address *</label>
                <input type="email" style={authInputStyle} placeholder="name@company.com" value={registerEmail} onChange={e => setRegisterEmail(e.target.value)} onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#dfe1e6'} required />
              </div>
              <div style={authFieldStyle}>
                <label style={authLabelStyle}>Password *</label>
                <input type="password" style={authInputStyle} placeholder="Create password..." value={registerPassword} onChange={e => setRegisterPassword(e.target.value)} onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#dfe1e6'} required />
              </div>
              {registerRole === 'Admin' && (
                <div style={authFieldStyle}>
                  <label style={authLabelStyle}>Business Entities</label>
                  <input type="text" style={authInputStyle} placeholder="e.g. Elixir Tea, NPS, CPC" value={registerBusinessEntities} onChange={e => setRegisterBusinessEntities(e.target.value)} onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#dfe1e6'} />
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                <button type="button" style={btnOutline} onClick={() => setLoginStep('email')}>← Back</button>
                <button type="submit" style={btnSubmit} disabled={authLoading}>{authLoading ? 'Submitting...' : 'Create Account'}</button>
              </div>
            </form>
          )}

          {loginStep === 'create-password' && (
            <form onSubmit={handleCreatePassword}>
              <div style={{ padding: '10px 12px', background: '#f8f9fa', border: '1px solid #e4e7eb', borderRadius: '4px', marginBottom: '16px', fontSize: '0.8125rem', color: '#172b4d' }}>
                Welcome, <strong>{authUserInfo?.fullName || emailInput}</strong>!<br />
                <span style={{ fontSize: '0.75rem', color: '#97a0af' }}>Please create a password for your account.</span>
              </div>
              <div style={authFieldStyle}>
                <label style={authLabelStyle}>Create Password *</label>
                <input type="password" style={authInputStyle} placeholder="Choose a strong password..." value={passwordInput} onChange={e => setPasswordInput(e.target.value)} onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#dfe1e6'} required />
              </div>
              <div style={authFieldStyle}>
                <label style={authLabelStyle}>Confirm Password *</label>
                <input type="password" style={authInputStyle} placeholder="Re-enter password..." value={confirmPasswordInput} onChange={e => setConfirmPasswordInput(e.target.value)} onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#dfe1e6'} required />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                <button type="button" style={btnOutline} onClick={() => setLoginStep('email')}>← Back</button>
                <button type="submit" style={btnSubmit} disabled={authLoading}>{authLoading ? 'Creating...' : 'Set Password & Login'}</button>
              </div>
            </form>
          )}

          {loginStep === 'password' && (
            <form onSubmit={handleLogin}>
              <div style={{ padding: '10px 12px', background: '#f8f9fa', border: '1px solid #e4e7eb', borderRadius: '4px', marginBottom: '16px', fontSize: '0.8125rem', color: '#172b4d' }}>
                Welcome back, <strong>{authUserInfo?.fullName || emailInput}</strong>
              </div>
              <div style={authFieldStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <label style={authLabelStyle}>Password *</label>
                  <button type="button" style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', padding: 0 }} onClick={handleRequestOtp}>Forgot?</button>
                </div>
                <input type="password" style={authInputStyle} placeholder="Enter your password..." value={passwordInput} onChange={e => setPasswordInput(e.target.value)} onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#dfe1e6'} required />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                <button type="button" style={btnOutline} onClick={() => setLoginStep('email')}>← Back</button>
                <button type="submit" style={btnSubmit} disabled={authLoading}>{authLoading ? 'Signing in...' : 'Sign In'}</button>
              </div>
            </form>
          )}

          {loginStep === 'forgot-otp' && (
            <form onSubmit={handleResetPasswordWithOtp}>
              <div style={{ padding: '10px 12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '4px', marginBottom: '14px', fontSize: '0.8125rem', color: '#1e40af' }}>
                Verification code sent to <strong>{emailInput}</strong><br />
                <span style={{ fontSize: '0.75rem', color: '#3b82f6' }}>Test OTP: <strong>52050</strong></span>
              </div>
              <div style={authFieldStyle}>
                <label style={authLabelStyle}>OTP Code *</label>
                <input type="text" style={authInputStyle} placeholder="Enter 5-digit code" value={otpInput} onChange={e => setOtpInput(e.target.value)} onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#dfe1e6'} maxLength={6} required />
              </div>
              <div style={authFieldStyle}>
                <label style={authLabelStyle}>New Password *</label>
                <input type="password" style={authInputStyle} placeholder="Enter new password..." value={newPasswordInput} onChange={e => setNewPasswordInput(e.target.value)} onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#dfe1e6'} required />
              </div>
              <div style={authFieldStyle}>
                <label style={authLabelStyle}>Confirm New Password *</label>
                <input type="password" style={authInputStyle} placeholder="Re-enter password..." value={confirmNewPasswordInput} onChange={e => setConfirmNewPasswordInput(e.target.value)} onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#dfe1e6'} required />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                <button type="button" style={btnOutline} onClick={() => setLoginStep('password')}>← Back</button>
                <button type="submit" style={btnSubmit} disabled={authLoading}>{authLoading ? 'Resetting...' : 'Reset & Login'}</button>
              </div>
            </form>
          )}

          <div style={{ borderTop: '1px solid #f4f5f7', paddingTop: '14px', textAlign: 'center', fontSize: '0.8125rem', color: '#97a0af' }}>
            {loginStep === 'register' ? (
              <span>Have an account? <button style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer', fontSize: '0.8125rem', padding: 0 }} onClick={() => { setLoginStep('email'); setAuthError(''); }}>Sign In</button></span>
            ) : (
              <span>No account? <button style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer', fontSize: '0.8125rem', padding: 0 }} onClick={() => { setLoginStep('register'); setAuthError(''); }}>Register</button></span>
            )}
          </div>
        </div>
      </div>
    </div>
    );
  }

  // ----------------------------------------------------
  // LIVE WAITING SCREEN: Pending Admin Account Approval
  // ----------------------------------------------------
  if (user && user.status === 'Pending') {
    return <PendingApprovalWaitingScreen user={user} setUser={setUser} token={token} onLogout={handleLogout} />;
  }

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        user={user}
        selectedBusiness={selectedBusiness}
        onOpenAIChat={() => setShowAIChat(true)}
        actionPlansEnabled={actionPlansEnabled}
      />

      {/* Main Content Area */}
      <div className="main-wrapper">
        <Topbar
          user={user}
          businesses={businesses}
          selectedBusiness={selectedBusiness}
          setSelectedBusiness={setSelectedBusiness}
          selectedDepartment={selectedDepartment}
          setSelectedDepartment={setSelectedDepartment}
          departments={departments}
          onOpenNewTaskModal={() => setShowAITaskModal(true)}
          onLogout={handleLogout}
        />

        <main className="content-area">
          {currentView.startsWith('superadmin') && (
            <SuperAdminPortal token={token} onRefresh={fetchMasterData} currentView={currentView} />
          )}

          {currentView === 'my-tasks' && (
            <MyTasks
              tasks={tasks}
              user={user}
              users={users}
              projects={projects}
              businesses={businesses}
              onViewTask={(taskId) => { setSelectedTaskId(taskId); setIsEditMode(false); }}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onRefresh={fetchMasterData}
            />
          )}

          {currentView === 'dashboard' && (
            <Dashboard
              selectedDepartment={selectedDepartment}
              selectedBusiness={selectedBusiness}
              token={token}
              user={user}
              onViewTask={(taskId) => { setSelectedTaskId(taskId); setIsEditMode(false); }}
            />
          )}

          {currentView === 'projects' && (
            <ProjectsManagement
              projects={projects}
              users={users}
              departments={departments}
              businesses={businesses}
              token={token}
              user={user}
              onRefresh={fetchMasterData}
              userRole={user?.role}
            />
          )}

          {currentView === 'action-plans' && (
            <ActionPlansManagement
              token={token}
              user={user}
              projects={projects}
              actionPlansEnabled={actionPlansEnabled}
              onRefresh={fetchMasterData}
              onToggleFeature={() => {
                const nextVal = !actionPlansEnabled;
                setActionPlansEnabled(nextVal);
                localStorage.setItem('actionPlansEnabled', nextVal.toString());
              }}
            />
          )}

          {currentView === 'kanban' && (
            <KanbanBoard
              tasks={tasks}
              users={users}
              projects={projects}
              user={user}
              userRole={user?.role}
              token={token}
              onViewTask={(taskId) => { setSelectedTaskId(taskId); setIsEditMode(false); }}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onOpenEditModal={(taskId) => { setSelectedTaskId(taskId); setIsEditMode(true); }}
              onOpenCommentModal={(taskId, taskTitle) => setActiveCommentTask({ id: taskId, title: taskTitle })}
              onAssignTask={handleAssignTask}
            />
          )}

          {currentView === 'table' && (
            <TaskTable
              tasks={tasks}
              users={users}
              projects={projects}
              onViewTask={(taskId) => { setSelectedTaskId(taskId); setIsEditMode(false); }}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onOpenEditModal={(taskId) => { setSelectedTaskId(taskId); setIsEditMode(true); }}
              onOpenCommentModal={(taskId, taskTitle) => setActiveCommentTask({ id: taskId, title: taskTitle })}
              onAssignTask={handleAssignTask}
              userRole={user.role}
            />
          )}

          {currentView === 'reports' && (
            <Reports token={token} />
          )}

          {currentView === 'capacity' && (
            <CapacityAnalytics
              token={token}
              userRole={user.role}
              userDept={user.department}
            />
          )}

          {currentView === 'companies' && (
            <CompaniesManagement
              token={token}
              user={user}
              onRefresh={fetchMasterData}
              onNavigateToCompany={(company) => {
                setSelectedBusiness(company.name);
                setCurrentView('dashboard');
              }}
            />
          )}

          {currentView === 'users' && (
            <UsersManagement
              users={users}
              departments={departments}
              businesses={businesses}
              token={token}
              user={user}
              onRefresh={fetchMasterData}
              userRole={user?.role}
            />
          )}

          {currentView === 'departments' && (
            <DepartmentsManagement
              departments={departments}
              businesses={businesses}
              token={token}
              user={user}
              onRefresh={fetchMasterData}
              userRole={user?.role}
            />
          )}

          {currentView === 'telegram' && (
            <TelegramSettings
              departments={departments}
              token={token}
              user={user}
              onRefresh={fetchMasterData}
              actionPlansEnabled={actionPlansEnabled}
              onToggleActionPlans={() => {
                const nextVal = !actionPlansEnabled;
                setActionPlansEnabled(nextVal);
                localStorage.setItem('actionPlansEnabled', nextVal.toString());
              }}
            />
          )}
        </main>
      </div>

      {/* Floating 30% Width Slide-Out AI Assistant Panel */}
      <AIChat
        token={token}
        user={user}
        isOpen={showAIChat}
        onToggle={() => setShowAIChat(!showAIChat)}
        onClose={() => setShowAIChat(false)}
      />

      {/* View / Edit Task Modal */}
      {selectedTaskId && (
        <TaskModal
          taskId={selectedTaskId}
          isEditMode={isEditMode}
          onClose={() => { setSelectedTaskId(null); setIsEditMode(false); }}
          token={token}
          users={users}
          departments={departments}
          projects={projects}
          businesses={businesses}
          user={user}
          onRefresh={fetchMasterData}
        />
      )}

      {/* AI Task Generator Modal */}
      {showAITaskModal && (
        <AITaskForm
          onClose={() => setShowAITaskModal(false)}
          token={token}
          users={users}
          departments={departments}
          projects={projects}
          businesses={businesses}
          user={user}
          onRefresh={fetchMasterData}
        />
      )}

      {/* Global Comments & Tagging Modal */}
      {activeCommentTask && (
        <CommentModal
          taskId={activeCommentTask.id}
          taskTitle={activeCommentTask.title}
          onClose={() => setActiveCommentTask(null)}
          token={token}
          users={users}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------
// LIVE WAITING COMPONENT: Pending Admin Account Approval
// ----------------------------------------------------
function PendingApprovalWaitingScreen({ user, setUser, token, onLogout }) {
  const [lastCheckTime, setLastCheckTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        setLastCheckTime(new Date().toLocaleTimeString());
        const res = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.success && res.data.data.status === 'Active') {
          const updatedUser = { ...user, ...res.data.data };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      } catch (err) {
        console.error('Approval polling check error:', err);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [user, setUser, token]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      fontFamily: 'Inter, system-ui, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '520px',
        width: '100%',
        background: '#ffffff',
        borderRadius: '20px',
        padding: '36px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        textAlign: 'center'
      }}>
        {/* Animated Status Icon */}
        <div style={{
          width: '72px',
          height: '72px',
          margin: '0 auto 20px',
          borderRadius: '50%',
          background: '#fff7ed',
          border: '2px solid #fdba74',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          boxShadow: '0 0 0 8px rgba(251, 146, 60, 0.15)',
          animation: 'pulse 2s infinite'
        }}>
          ⏳
        </div>

        <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 8px', color: '#0f172a' }}>
          Waiting for Super Admin Approval
        </h2>
        
        <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 24px', lineHeight: 1.5 }}>
          Hello <strong>{user?.full_name || 'Admin'}</strong>! Your account has been registered and is currently awaiting approval from the Super Admin.
        </p>

        {/* Realtime Status Indicator Box */}
        <div style={{
          padding: '12px 16px',
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '12px',
          color: '#15803d',
          fontSize: '0.8rem',
          fontWeight: 600,
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 8px #22c55e' }}></span>
          <span>Live Auto-Check Active (Last checked at {lastCheckTime})</span>
        </div>

        {/* User Info Breakdown */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', textTransform: 'none', textAlign: 'left', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.82rem' }}>
            <span style={{ color: '#64748b', fontWeight: 500 }}>Registered Email:</span>
            <strong style={{ color: '#0f172a' }}>{user?.email}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.82rem' }}>
            <span style={{ color: '#64748b', fontWeight: 500 }}>Requested Role:</span>
            <strong style={{ color: '#ea580c' }}>{user?.role || 'Admin'}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
            <span style={{ color: '#64748b', fontWeight: 500 }}>Account Status:</span>
            <span style={{ background: '#ffedd5', color: '#c2410c', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem' }}>Pending Approval</span>
          </div>
        </div>

        <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '0 0 20px', lineHeight: 1.4 }}>
          💡 As soon as the Super Admin approves your account, your dashboard will open automatically without refreshing the page!
        </p>

        <button
          onClick={onLogout}
          className="btn btn-outline"
          style={{ width: '100%', padding: '10px', fontSize: '0.85rem', color: '#64748b', borderColor: '#cbd5e1' }}
        >
          Sign Out / Use Another Account
        </button>
      </div>
    </div>
  );
}
