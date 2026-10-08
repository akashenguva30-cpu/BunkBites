import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
import StudentNavbar from '../components/StudentNavbar';

const ProfileRow = ({ title, subtitle, onClick, expandedContent, isExpanded }) => {
  return (
    <div style={{ backgroundColor: '#fff', border: '1px solid #eaeaea', borderRadius: '12px', marginBottom: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.02)' }}>
      <div 
        onClick={onClick}
        style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: '#fff' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '16px', fontWeight: '600', color: '#111' }}>{title}</span>
          {subtitle && <span style={{ fontSize: '14px', color: '#666', marginTop: '2px' }}>{subtitle}</span>}
        </div>
        <span style={{ 
          color: '#aaa', 
          fontSize: '20px', 
          transform: isExpanded ? 'rotate(90deg)' : 'none', 
          transition: 'transform 0.2s',
          display: 'flex',
          alignItems: 'center',
          height: '24px'
        }}>
          ›
        </span>
      </div>
      {isExpanded && expandedContent && (
        <div style={{ padding: '0 20px 20px 20px', borderTop: '1px solid #eaeaea' }}>
          <div style={{ paddingTop: '20px' }}>
            {expandedContent}
          </div>
        </div>
      )}
    </div>
  );
};

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [passMessage, setPassMessage] = useState('');
  const [passError, setPassError] = useState('');
  const [activeSection, setActiveSection] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/profile');
      setProfile(res.data);
      setEmail(res.data.email);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) navigate('/');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await api.put('/profile', { email });
      setMessage('Profile updated successfully!');
      fetchProfile();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassMessage('');
    setPassError('');
    if (newPassword !== confirmPassword) {
      setPassError('New passwords do not match');
      return;
    }
    try {
      await api.put('/profile/password', {
        currentPassword,
        newPassword,
        confirmPassword
      });
      setPassMessage('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPassError(err.response?.data?.message || 'Failed to change password');
    }
  };

  const toggleSection = (section) => {
    setActiveSection(prev => prev === section ? null : section);
  };

  if (!profile) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#fdfbfb' }}>
      <StudentNavbar />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#fdfbfb' }}>
      <StudentNavbar />

      <div style={{ flex: 1, maxWidth: '600px', margin: '0 auto', width: '100%', padding: '40px 24px' }}>
        
        <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: '800', color: '#111', letterSpacing: '-0.5px' }}>ACCOUNT</h1>
        <p style={{ margin: '0 0 40px 0', fontSize: '16px', color: '#666' }}>Manage your account and canteen preferences.</p>
        
        {/* Identity Section */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #eaeaea', borderRadius: '16px', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '48px', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#f5f5f5', color: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '700' }}>
            {profile.username.charAt(0).toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ margin: 0, fontSize: '22px', color: '#111', fontWeight: '700' }}>{profile.username}</h2>
            <span style={{ margin: '4px 0 0 0', color: '#888', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>{profile.role.replace('ROLE_', '')}</span>
            <span style={{ margin: '4px 0 0 0', color: '#666', fontSize: '15px' }}>{profile.email}</span>
          </div>
        </div>

        {/* ACCOUNT GROUP */}
        <div style={{ marginBottom: '40px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '1px', color: '#888', marginBottom: '16px', textTransform: 'uppercase' }}>Account</h3>
          
          <ProfileRow 
            title="Personal information"
            isExpanded={activeSection === 'personal'}
            onClick={() => toggleSection('personal')}
            expandedContent={
              <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {message && <div style={{ color: '#388e3c', fontSize: '14px', fontWeight: '500' }}>{message}</div>}
                {error && <div style={{ color: '#e74c3c', fontSize: '14px', fontWeight: '500' }}>{error}</div>}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#333' }}>Email Address</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} 
                    onFocus={(e) => e.target.style.borderColor = '#111'}
                    onBlur={(e) => e.target.style.borderColor = '#ddd'}
                  />
                </div>
                <div>
                  <button type="submit" style={{ backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '8px', padding: '12px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                    Save Changes
                  </button>
                </div>
              </form>
            }
          />
          
          <ProfileRow 
            title="Change password"
            isExpanded={activeSection === 'password'}
            onClick={() => toggleSection('password')}
            expandedContent={
              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {passMessage && <div style={{ color: '#388e3c', fontSize: '14px', fontWeight: '500' }}>{passMessage}</div>}
                {passError && <div style={{ color: '#e74c3c', fontSize: '14px', fontWeight: '500' }}>{passError}</div>}
                
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#333' }}>Current Password</label>
                  <input 
                    type="password" 
                    value={currentPassword} 
                    onChange={(e) => setCurrentPassword(e.target.value)} 
                    required 
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} 
                    onFocus={(e) => e.target.style.borderColor = '#111'}
                    onBlur={(e) => e.target.style.borderColor = '#ddd'}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#333' }}>New Password</label>
                  <input 
                    type="password" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    required 
                    minLength={6}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} 
                    onFocus={(e) => e.target.style.borderColor = '#111'}
                    onBlur={(e) => e.target.style.borderColor = '#ddd'}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#333' }}>Confirm Password</label>
                  <input 
                    type="password" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    required 
                    minLength={6}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} 
                    onFocus={(e) => e.target.style.borderColor = '#111'}
                    onBlur={(e) => e.target.style.borderColor = '#ddd'}
                  />
                </div>
                <div>
                  <button type="submit" style={{ backgroundColor: '#fff', color: '#111', border: '1px solid #ddd', borderRadius: '8px', padding: '12px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                    Update Password
                  </button>
                </div>
              </form>
            }
          />
        </div>

        {/* YOUR ACTIVITY GROUP */}
        <div style={{ marginBottom: '40px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '1px', color: '#888', marginBottom: '16px', textTransform: 'uppercase' }}>Your Activity</h3>
          <ProfileRow title="Orders" subtitle="View your order history" onClick={() => navigate('/orders')} />
          <ProfileRow title="Favorites" subtitle="Your saved campus food" onClick={() => navigate('/favorites')} />
        </div>

        {/* PREFERENCES GROUP */}
        <div style={{ marginBottom: '40px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '1px', color: '#888', marginBottom: '16px', textTransform: 'uppercase' }}>Preferences</h3>
          <ProfileRow title="Notifications" subtitle="Order updates and alerts" onClick={() => navigate('/notifications')} />
        </div>

        {/* SIGN OUT */}
        <div style={{ marginBottom: '40px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '1px', color: '#888', marginBottom: '16px', textTransform: 'uppercase' }}>Account</h3>
          <div 
            onClick={() => { sessionStorage.clear(); navigate('/'); }}
            style={{ backgroundColor: '#fff', border: '1px solid #eaeaea', borderRadius: '12px', padding: '16px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.02)' }}
          >
            <span style={{ fontSize: '16px', fontWeight: '600', color: '#e74c3c' }}>Sign out</span>
          </div>
        </div>
      </div>
    </div>
  );
}
