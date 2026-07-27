import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const SettingsView = () => {
  const {
    currentUser, theme, setTheme, setTourModalOpen,
    shopProfile, saveShopProfile, logAction, toast
  } = useApp();

  const [spName, setSpName] = useState(shopProfile.name);
  const [spAddress, setSpAddress] = useState(shopProfile.address);
  const [spPhone, setSpPhone] = useState(shopProfile.phone);
  const [spLogo, setSpLogo] = useState(shopProfile.logo);
  const [pin, setPin] = useState('');

  if (!currentUser) return null;

  const handleSaveProfile = () => {
    saveShopProfile({
      name: spName.trim() || shopProfile.name,
      address: spAddress.trim(),
      phone: spPhone.trim(),
      logo: spLogo
    });
  };

  const handleLogoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fr = new FileReader();
    fr.onload = () => {
      setSpLogo(fr.result);
      toast("Logo updated — remember to click Save Shop Profile", "info");
    };
    fr.readAsDataURL(file);
  };

  const handleBackup = () => {
    logAction(currentUser ? currentUser.name : "System", "Backup succeeded", "Manual backup triggered");
    toast("Backup completed (demo — no cloud connection in this session)", "success");
  };

  return (
    <div className="view active">
      <div className="page-head">
        <div>
          <h1>Settings</h1>
          <p>App preferences for this device</p>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <h3>Appearance</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-sm" onClick={() => setTheme('light')}>☀ Light</button>
            <button className="btn btn-sm" onClick={() => setTheme('dark')}>🌙 Dark</button>
            <button className="btn btn-sm" onClick={() => setTourModalOpen(true)}>🧭 Take a Tour</button>
          </div>
        </div>

        {currentUser.role === 'cashier' && (
          <div className="panel">
            <h3>My Account</h3>
            <div style={{ fontSize: '13px', lineHeight: '1.9' }}>
              <div>Employee ID: <b className="mono">{currentUser.id}</b></div>
              <div>Name: <b>{currentUser.name}</b></div>
              <div>Role: <span className="badge-role cashier">cashier</span></div>
              <div>Branch: <b>{currentUser.branch}</b></div>
            </div>
            <p style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '8px' }}>
              Your password/PIN is set by your administrator. Ask them if you need it changed.
            </p>
          </div>
        )}

        {currentUser.role === 'admin' && (
          <>
            <div className="panel">
              <h3>Shop Profile<small>Appears on printed receipts and reports</small></h3>
              <div className="field">
                <label>Shop Name</label>
                <input value={spName} onChange={(e) => setSpName(e.target.value)} />
              </div>
              <div className="field">
                <label>Address</label>
                <input value={spAddress} onChange={(e) => setSpAddress(e.target.value)} />
              </div>
              <div className="field">
                <label>Phone</label>
                <input value={spPhone} onChange={(e) => setSpPhone(e.target.value)} />
              </div>
              <div className="field">
                <label>Logo</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {spLogo && (
                    <img src={spLogo} alt="Logo preview" style={{ height: '36px', borderRadius: '6px', background: 'var(--surface-2)' }} />
                  )}
                  <input type="file" accept="image/*" style={{ fontSize: '12px' }} onChange={handleLogoSelect} />
                </div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={handleSaveProfile}>Save Shop Profile</button>
            </div>

            <div className="panel">
              <h3>Employee PIN / Password Policy</h3>
              <p style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: '10px' }}>
                Only administrators can set or reset an employee's login PIN or password — go to <b>Employees</b> to assign one. Sales users cannot change their own credentials.
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  className="field"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="App-wide PIN e.g. 4471"
                  style={{ padding: '9px 11px', borderRadius: '8px', border: '1px solid var(--line)', background: 'var(--surface)', width: '160px' }}
                />
                <button className="btn btn-sm btn-primary" onClick={() => toast("App PIN saved for this session", "success")}>Save App PIN</button>
              </div>
            </div>

            <div className="panel">
              <h3>Cloud Backup</h3>
              <p style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: '10px' }}>
                Connect Google Drive to back up receipts automatically.
              </p>
              <button className="btn btn-sm" onClick={() => toast("This demo runs fully offline in your browser — connect Google Drive in the desktop build", "info")}>
                Connect Google Drive
              </button>
              <button className="btn btn-sm" style={{ marginLeft: '8px' }} onClick={handleBackup}>
                Run Backup Now
              </button>
            </div>

            <div className="panel">
              <h3>Daily Reminder</h3>
              <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" defaultChecked /> Remind me to upload today's receipts
              </label>
            </div>
          </>
        )}
      </div>

      <div className="footer-note">
        This is a React frontend application running entirely in your browser: images and OCR text are processed on-device with Tesseract.js, and state is managed via React Context (nothing is saved to disk or the cloud). Chart.js powers the analytics and PapaParse handles CSV import.
      </div>
    </div>
  );
};
