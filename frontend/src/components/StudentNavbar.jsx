import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axiosConfig';
import bunkbitesMark from '../assets/brand/bunkbites-mark.svg';

export default function StudentNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [role, setRole] = useState(null);

  useEffect(() => {
    fetchProfileAndNotifications();
  }, []);

  const fetchProfileAndNotifications = async () => {
    try {
      const profileRes = await api.get('/profile');
      setRole(profileRes.data.role);
      
      if (profileRes.data.role === 'STUDENT') {
        const notifRes = await api.get('/notifications');
        setUnreadCount(notifRes.data.unreadCount);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isStudent = role === 'STUDENT';
  const isAdmin = role === 'ADMIN';
  const isStaff = role === 'STAFF';

  const navItemStyle = (path) => ({
    background: 'none',
    border: 'none',
    color: location.pathname.startsWith(path) && path !== '/' ? 'var(--primary-color)' : 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: location.pathname.startsWith(path) && path !== '/' ? '600' : '500',
    padding: '8px 12px',
    transition: 'color 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  });

  return (
    <div style={{
      backgroundColor: 'var(--surface-color)',
      padding: '12px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <img src={bunkbitesMark} alt="BunkBites Mark" style={{ width: '32px', height: '32px' }} />
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>BunkBites</h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {isStudent && (
          <>
            <button onClick={() => navigate('/student')} style={navItemStyle('/student')}>
              Menu
            </button>
            <button onClick={() => navigate('/favorites')} style={navItemStyle('/favorites')}>
              Favorites
            </button>
            <button onClick={() => navigate('/orders')} style={navItemStyle('/orders')}>
              Orders
            </button>
            <button onClick={() => navigate('/notifications')} style={navItemStyle('/notifications')}>
              Notifications
              {unreadCount > 0 && (
                <span style={{
                  backgroundColor: 'var(--primary-color)',
                  color: 'white',
                  borderRadius: '10px',
                  padding: '2px 6px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  marginLeft: '4px'
                }}>{unreadCount}</span>
              )}
            </button>
          </>
        )}
        {isAdmin && (
          <>
            <button onClick={() => navigate('/admin/dashboard')} style={navItemStyle('/admin/dashboard')}>Dashboard</button>
            <button onClick={() => navigate('/admin')} style={navItemStyle('/admin')}>Menu Config</button>
            <button onClick={() => navigate('/admin/users')} style={navItemStyle('/admin/users')}>Users</button>
          </>
        )}
        {isStaff && !isAdmin && (
          <>
            <button onClick={() => navigate('/staff/orders')} style={navItemStyle('/staff/orders')}>Manage Orders</button>
            <button onClick={() => navigate('/admin')} style={navItemStyle('/admin')}>Menu Config</button>
          </>
        )}
        <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)', margin: '0 8px' }}></div>
        <button onClick={() => navigate('/profile')} style={navItemStyle('/profile')}>Profile</button>
      </div>
    </div>
  );
}
