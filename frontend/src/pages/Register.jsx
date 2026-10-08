import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosConfig';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const res = await api.post('/auth/register', { username, email, password });
      if (res.data && res.data.message) {
        setSuccess("Account created successfully. Please log in.");
        setUsername('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="auth-container" style={{ minHeight: '100vh', display: 'flex', backgroundColor: 'var(--bg-color)', flexDirection: 'row', position: 'relative' }}>
      


      {/* Left Side (Visual Brand Area) */}
      <div className="auth-left" style={{
        flex: '0 0 45%',
        position: 'relative',
        backgroundColor: 'var(--primary-color)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '64px',
        color: '#fff'
      }}>
        {/* Background Image with overlay */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: `url('http://localhost:8080/uploads/menu/0460ce5d-503f-46ec-ae96-1fcdb6f2e763.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.25,
          mixBlendMode: 'luminosity'
        }} />
        


        <div className="auth-hero-text" style={{ position: 'relative', zIndex: 1, marginTop: 'auto' }}>
          <h2 style={{ fontSize: '56px', fontWeight: '800', lineHeight: '1.1', margin: '0 0 16px 0', letterSpacing: '-1.5px' }}>
            Good food.<br />Less waiting.
          </h2>
          <p style={{ fontSize: '18px', opacity: 0.9, margin: 0, maxWidth: '85%', lineHeight: '1.5' }}>
            Order ahead, get your token, and grab your food exactly when it's ready.
          </p>
        </div>
      </div>

      {/* Right Side (Form Area) */}
      <div className="auth-right" style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px',
        backgroundColor: '#FFFFFF'
      }}>
        {/* Brand Logo centered in right pane */}
        <div style={{ marginBottom: '64px', textAlign: 'center' }}>
          <img src="/src/assets/brand/bunkbites-logo-image.png" alt="BunkBites Logo" style={{ width: '400px', maxWidth: '85vw', height: 'auto' }} />
        </div>

        <div style={{ width: '100%', maxWidth: '380px' }}>
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Create an account</h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '16px' }}>Get started with BunkBites.</p>
          </div>

          {error && (
            <div style={{ backgroundColor: '#fff0f0', color: '#d32f2f', padding: '14px 16px', borderRadius: 'var(--radius-sm)', marginBottom: '24px', fontSize: '14px', fontWeight: '500', borderLeft: '4px solid #d32f2f' }}>
              {error}
            </div>
          )}
          
          {success && (
            <div style={{ backgroundColor: '#f0fdf4', color: '#166534', padding: '14px 16px', borderRadius: 'var(--radius-sm)', marginBottom: '24px', fontSize: '14px', fontWeight: '500', borderLeft: '4px solid #166534' }}>
              {success}
            </div>
          )}

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Username</label>
              <input 
                type="text" 
                placeholder="Choose a username"
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required 
                minLength="3"
                maxLength="20"
                style={{ 
                  width: '100%', 
                  padding: '14px 16px', 
                  borderRadius: 'var(--radius-sm)', 
                  border: '1px solid var(--border-color)', 
                  backgroundColor: 'var(--surface-color)',
                  fontSize: '15px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  color: 'var(--text-primary)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--primary-color)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(239, 83, 80, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border-color)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Email Address</label>
              <input 
                type="email" 
                placeholder="your.email@example.com"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                maxLength="50"
                style={{ 
                  width: '100%', 
                  padding: '14px 16px', 
                  borderRadius: 'var(--radius-sm)', 
                  border: '1px solid var(--border-color)', 
                  backgroundColor: 'var(--surface-color)',
                  fontSize: '15px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  color: 'var(--text-primary)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--primary-color)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(239, 83, 80, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border-color)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  minLength="6"
                  maxLength="40"
                  style={{ 
                    width: '100%', 
                    padding: '14px 16px', 
                    borderRadius: 'var(--radius-sm)', 
                    border: '1px solid var(--border-color)', 
                    backgroundColor: 'var(--surface-color)',
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    color: 'var(--text-primary)'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--primary-color)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(239, 83, 80, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border-color)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Confirm</label>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required 
                  style={{ 
                    width: '100%', 
                    padding: '14px 16px', 
                    borderRadius: 'var(--radius-sm)', 
                    border: '1px solid var(--border-color)', 
                    backgroundColor: 'var(--surface-color)',
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    color: 'var(--text-primary)'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--primary-color)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(239, 83, 80, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border-color)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              className="primary-btn"
              style={{ 
                padding: '16px', 
                fontSize: '16px', 
                fontWeight: '600', 
                marginTop: '12px',
                width: '100%',
                cursor: 'pointer',
                borderRadius: 'var(--radius-sm)',
                border: 'none'
              }}
            >
              Create Account
            </button>
          </form>

          <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '15px', color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '600' }}>
              Sign in here
            </Link>
          </div>
        </div>
      </div>
      
      {/* Mobile Styles embedded */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .auth-container {
            flex-direction: column !important;
          }
          .auth-left {
            flex: none !important;
            padding: 32px 24px !important;
            min-height: 180px !important;
            justify-content: flex-end !important;
          }

          .auth-hero-text {
            display: none !important;
          }
          .auth-right {
            padding: 40px 24px !important;
            align-items: flex-start !important;
          }
        }
      `}} />
    </div>
  );
}
