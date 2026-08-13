import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function TelegramSettings({
  departments = [],
  token,
  user,
  onRefresh,
  actionPlansEnabled = true,
  onToggleActionPlans
}) {
  const [adminBotToken, setAdminBotToken] = useState('');
  const [adminChatId, setAdminChatId] = useState('');
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminMsg, setAdminMsg] = useState('');

  // Google Drive Integration State
  const [driveEnabled, setDriveEnabled] = useState(false);
  const [driveParentFolderId, setDriveParentFolderId] = useState('');
  const [driveCredentialsJson, setDriveCredentialsJson] = useState('');
  const [driveSaving, setDriveSaving] = useState(false);
  const [driveMsg, setDriveMsg] = useState('');

  useEffect(() => {
    fetchAdminBotToken();
    fetchGoogleDriveConfig();
  }, []);

  const fetchAdminBotToken = async () => {
    try {
      const res = await axios.get('/api/users/profile/telegram', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setAdminBotToken(res.data.data.telegramBotToken || '');
        setAdminChatId(res.data.data.telegramChatId || '');
      }
    } catch (err) {
      console.error('Error fetching Admin bot credentials:', err);
    }
  };

  const fetchGoogleDriveConfig = async () => {
    try {
      const res = await axios.get('/api/users/profile/google-drive', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        const d = res.data.data;
        setDriveEnabled(d.hasCredentials ? (d.googleDriveEnabled !== false) : !!d.googleDriveEnabled);
        setDriveParentFolderId(d.parentFolderId || '');
        setDriveCredentialsJson(d.credentialsJson || '');
      }
    } catch (err) {
      console.error('Error fetching Google Drive config:', err);
    }
  };

  const handleSaveGoogleDrive = async (e) => {
    e.preventDefault();
    setDriveSaving(true);
    setDriveMsg('');

    try {
      const res = await axios.put('/api/users/profile/google-drive', {
        enabled: driveEnabled,
        parentFolderId: driveParentFolderId,
        credentialsJson: driveCredentialsJson
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setDriveMsg('✅ Google Drive integration settings saved successfully!');
        if (onRefresh) onRefresh();
        setTimeout(() => setDriveMsg(''), 4000);
      }
    } catch (err) {
      console.error('Error saving Google Drive settings:', err);
      if (err.response?.status === 401) {
        setDriveMsg('❌ Session expired or invalid token. Please log out and log back in to refresh your login session.');
      } else {
        setDriveMsg('❌ ' + (err.response?.data?.error || 'Failed to save Google Drive settings'));
      }
    } finally {
      setDriveSaving(false);
    }
  };

  const handleSaveAdminBotToken = async (e) => {
    e.preventDefault();
    setAdminSaving(true);
    setAdminMsg('');
    try {
      const res = await axios.put('/api/users/profile/telegram', {
        telegramBotToken: adminBotToken,
        telegramChatId: adminChatId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setAdminMsg('✅ Admin Telegram Settings (Bot Token & Chat ID) saved successfully!');
        if (onRefresh) onRefresh();
        setTimeout(() => setAdminMsg(''), 4000);
      }
    } catch (err) {
      console.error('Error saving admin bot settings:', err);
      setAdminMsg('❌ Failed to save Admin Telegram Settings');
    } finally {
      setAdminSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Page Header */}
      <div>
        <h2 style={{ margin: '0 0 3px', fontSize: '1rem', fontWeight: 700, color: '#172b4d' }}>Workspace Settings</h2>
        <p style={{ margin: 0, fontSize: '0.8125rem', color: '#97a0af' }}>Configure module toggles, Telegram notifications, and Google Drive integration.</p>
      </div>

      {/* Feature Modules Toggle */}
      <div style={{ background: '#ffffff', border: '1px solid #e4e7eb', borderRadius: '6px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ margin: '0 0 2px', fontSize: '0.9375rem', fontWeight: 700, color: '#172b4d' }}>Action Plans Module</h3>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: '#97a0af' }}>Show or hide the Action Plans timeline in the sidebar navigation.</p>
          </div>
          <button type="button" onClick={onToggleActionPlans}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', border: `1.5px solid ${actionPlansEnabled ? '#00875a' : '#dfe1e6'}`, background: actionPlansEnabled ? '#e3fcef' : '#f8f9fa', color: actionPlansEnabled ? '#00875a' : '#5e6c84', fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: actionPlansEnabled ? '#00875a' : '#97a0af', display: 'inline-block' }} />
            {actionPlansEnabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>
      </div>

      {/* Telegram Bot Token & Chat ID Section */}
      <div style={{ background: '#ffffff', border: '1px solid #e4e7eb', borderRadius: '6px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#e3f2fd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>🤖</div>
          <div>
            <h3 style={{ margin: '0 0 2px', fontSize: '0.9375rem', fontWeight: 700, color: '#172b4d' }}>Admin Telegram Settings</h3>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: '#97a0af' }}>Master bot token &amp; default Telegram chat ID for {user?.full_name || 'Admin'}</p>
          </div>
        </div>
        <div style={{ padding: '8px 10px', background: '#fffae6', border: '1px solid #ffe58f', borderRadius: '4px', color: '#7d5400', fontSize: '0.75rem', marginBottom: '12px', lineHeight: 1.45 }}>
          All companies &amp; departments use these master credentials to dispatch task notifications to Telegram group chats.
        </div>
        {adminMsg && <div style={{ padding: '8px 12px', borderRadius: '4px', fontSize: '0.8125rem', background: adminMsg.includes('✅') ? '#e3fcef' : '#ffebe6', color: adminMsg.includes('✅') ? '#00875a' : '#de350b', border: `1px solid ${adminMsg.includes('✅') ? '#abe2cc' : '#ffbdad'}`, marginBottom: '12px' }}>{adminMsg}</div>}
        <form onSubmit={handleSaveAdminBotToken} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: '#5e6c84', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Admin Bot Token *</label>
              <input type="text" placeholder="e.g. 7890123456:AAFE_..." value={adminBotToken} onChange={e => setAdminBotToken(e.target.value)} required
                style={{ width: '100%', padding: '7px 10px', fontSize: '0.8125rem', borderRadius: '4px', border: '1.5px solid #dfe1e6', outline: 'none', background: '#ffffff', color: '#172b4d' }}
                onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#dfe1e6'} />
              <small style={{ fontSize: '0.6875rem', color: '#97a0af', display: 'block', marginTop: '4px' }}>From Telegram @BotFather.</small>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: '#5e6c84', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Default Telegram Chat ID (Optional)</label>
              <input type="text" placeholder="e.g. -1001234567890 or @your_channel" value={adminChatId} onChange={e => setAdminChatId(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', fontSize: '0.8125rem', borderRadius: '4px', border: '1.5px solid #dfe1e6', outline: 'none', background: '#ffffff', color: '#172b4d' }}
                onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#dfe1e6'} />
              <small style={{ fontSize: '0.6875rem', color: '#97a0af', display: 'block', marginTop: '4px' }}>Global fallback chat ID. Each department can have its own ID in Department Management.</small>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={adminSaving} style={{ padding: '7px 16px', borderRadius: '4px', border: 'none', background: '#1e293b', color: '#ffffff', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', opacity: adminSaving ? 0.7 : 1 }}>
              {adminSaving ? 'Saving...' : 'Save Telegram Credentials'}
            </button>
          </div>
        </form>
      </div>

      {/* Google Drive Integration */}
      <div style={{ background: '#ffffff', border: '1px solid #e4e7eb', borderRadius: '6px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#e3f2fd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>📁</div>
            <div>
              <h3 style={{ margin: '0 0 2px', fontSize: '0.9375rem', fontWeight: 700, color: '#172b4d' }}>Google Drive Auto-Sync</h3>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: '#97a0af' }}>Auto-create project folders and upload files to Google Drive</p>
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 700, color: driveEnabled ? '#1565c0' : '#5e6c84', whiteSpace: 'nowrap' }}>
            <input type="checkbox" checked={driveEnabled} onChange={e => setDriveEnabled(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#1565c0', cursor: 'pointer' }} />
            {driveEnabled ? 'Integration Enabled' : 'Disabled'}
          </label>
        </div>

        <div style={{ padding: '8px 10px', background: '#f0f7ff', border: '1px solid #bae0fd', borderRadius: '4px', color: '#1565c0', fontSize: '0.75rem', marginBottom: '12px', lineHeight: 1.45 }}>
          When enabled, each new project automatically gets a dedicated Google Drive folder linked to the project.
        </div>

        <details style={{ marginBottom: '12px', background: '#f8f9fa', border: '1px solid #e4e7eb', borderRadius: '4px', padding: '8px 12px' }}>
          <summary style={{ fontWeight: 600, cursor: 'pointer', color: '#2563eb', fontSize: '0.8125rem' }}>Setup Guide: How to get your Google JSON Key &amp; Folder ID</summary>
          <ol style={{ margin: '10px 0 0 0', paddingLeft: '20px', lineHeight: 1.7, fontSize: '0.8125rem', color: '#5e6c84' }}>
            <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>Google Cloud Console</a> and create/select a Project.</li>
            <li>Enable the <strong>Google Drive API</strong>.</li>
            <li>Go to <strong>IAM &amp; Admin → Service Accounts</strong> and create a new account.</li>
            <li>Click the account → <strong>Keys → Add Key → JSON</strong> → download the file.</li>
            <li>Paste the JSON contents in the field below.</li>
            <li>Create a folder in Google Drive, copy its ID from the URL, paste below.</li>
            <li><strong>Share that folder</strong> with the <code>client_email</code> from the JSON as <strong>Editor</strong>.</li>
          </ol>
        </details>

        {driveMsg && <div style={{ padding: '8px 12px', borderRadius: '4px', fontSize: '0.8125rem', background: driveMsg.includes('✅') ? '#e3fcef' : '#ffebe6', color: driveMsg.includes('✅') ? '#00875a' : '#de350b', border: `1px solid ${driveMsg.includes('✅') ? '#abe2cc' : '#ffbdad'}`, marginBottom: '12px' }}>{driveMsg}</div>}

        <form onSubmit={handleSaveGoogleDrive} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: '#5e6c84', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Root Parent Folder ID (Optional)</label>
              <input type="text" placeholder="e.g. 1A2b3C4d5E6f7G..." value={driveParentFolderId} onChange={e => setDriveParentFolderId(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', fontSize: '0.8125rem', borderRadius: '4px', border: '1.5px solid #dfe1e6', outline: 'none', background: '#ffffff', color: '#172b4d' }}
                onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#dfe1e6'} />
              <small style={{ fontSize: '0.6875rem', color: '#97a0af', display: 'block', marginTop: '4px' }}>Google Drive Folder ID from the folder URL.</small>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: '#5e6c84', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Google Service Account JSON Key *</label>
              <textarea rows="4" placeholder={'{ "type": "service_account", "project_id": "...", ... }'} value={driveCredentialsJson} onChange={e => setDriveCredentialsJson(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', fontSize: '0.75rem', fontFamily: 'monospace', borderRadius: '4px', border: '1.5px solid #dfe1e6', outline: 'none', background: '#ffffff', color: '#172b4d', resize: 'vertical' }}
                onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#dfe1e6'} />
              <small style={{ fontSize: '0.6875rem', color: '#97a0af', display: 'block', marginTop: '4px' }}>Share your Drive folder with the <code>client_email</code> as Editor.</small>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={driveSaving} style={{ padding: '7px 16px', borderRadius: '4px', border: 'none', background: '#1e293b', color: '#ffffff', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', opacity: driveSaving ? 0.7 : 1 }}>
              {driveSaving ? 'Saving...' : 'Save Drive Integration'}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
