import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import bunkbitesMark from '../assets/brand/bunkbites-mark.svg';

export default function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const getLinkStyle = (path) => {
    const isActive = location.pathname === path;
    return {
      display: 'block',
      padding: '10px 14px',
      borderRadius: '8px',
      color: isActive ? '#e74c3c' : '#555',
      backgroundColor: isActive ? '#fdf2f2' : 'transparent',
      textDecoration: 'none',
      fontWeight: isActive ? '700' : '500',
      marginBottom: '6px',
      transition: 'all 0.2s',
      fontSize: '14px'
    };
  };

  return (
    <div style={{ 
      width: '260px', 
      minHeight: '100vh',
      backgroundColor: '#fdfbfb', 
      borderRight: '1px solid #eaeaea',
      padding: '32px 24px',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box'
    }}>
      <div style={{ marginBottom: '48px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <img src={bunkbitesMark} alt="BunkBites Mark" style={{ width: '32px', height: '32px' }} />
        <div>
          <h2 style={{ margin: '0', fontSize: '18px', fontWeight: '800', color: '#111', letterSpacing: '-0.5px', lineHeight: '1.2' }}>
            BunkBites
          </h2>
          <span style={{ color: '#e74c3c', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>ADMIN</span>
        </div>
      </div>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '32px' }}>
          <p style={{ margin: '0 0 12px 4px', fontSize: '11px', fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px' }}>Management</p>
          <Link to="/admin/dashboard" style={getLinkStyle('/admin/dashboard')}>Dashboard</Link>
          <Link to="/admin" style={getLinkStyle('/admin')}>Menu Management</Link>
          <Link to="/admin/orders" style={getLinkStyle('/admin/orders')}>Orders</Link>
          <Link to="/admin/payments" style={getLinkStyle('/admin/payments')}>Payments</Link>
          <Link to="/admin/users" style={getLinkStyle('/admin/users')}>People</Link>
        </div>

        <div>
          <p style={{ margin: '0 0 12px 4px', fontSize: '11px', fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px' }}>Operations</p>
          <Link 
            to="/staff/orders" 
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 14px',
              borderRadius: '8px',
              color: '#fff',
              backgroundColor: '#111',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '14px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <span>Kitchen View</span>
            <span>→</span>
          </Link>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #eaeaea', paddingTop: '24px', marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button 
          onClick={() => navigate('/profile')} 
          style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: '10px 14px', fontSize: '14px', fontWeight: '600', textAlign: 'left', borderRadius: '8px' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#eaeaea'; e.currentTarget.style.color = '#111'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#666'; }}
        >
          Profile
        </button>
        <button 
          onClick={() => { sessionStorage.clear(); navigate('/'); }} 
          style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', padding: '10px 14px', fontSize: '14px', fontWeight: '600', textAlign: 'left', borderRadius: '8px' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fdf2f2'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
