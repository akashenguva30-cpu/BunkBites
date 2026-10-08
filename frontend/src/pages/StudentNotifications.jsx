import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
import StudentNavbar from '../components/StudentNavbar';

export default function StudentNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
    fetchOrders();

    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || res.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) navigate('/');
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put(`/notifications/read-all`);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const relativeTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHrs < 24) return `${diffHrs} hr ago`;
    
    const todayDate = new Date();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(todayDate.getDate() - 1);
    
    if (d.toDateString() === yesterdayDate.toDateString()) return 'Yesterday';
    return d.toLocaleDateString();
  };

  const getNotificationInfo = (notif) => {
    const msg = notif.message.toLowerCase();
    let semanticType = 'neutral';
    let icon = (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#f0f0f0" />
      </svg>
    );
    let subtitle = 'Update received';

    if (msg.includes('ready') || msg.includes('collected')) {
      semanticType = 'green';
      icon = (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="6" fill="#388e3c" />
        </svg>
      );
      subtitle = 'Ready for pickup';
    } else if (msg.includes('preparing') || msg.includes('accepted')) {
      semanticType = 'orange';
      icon = (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="6" fill="#f57c00" />
        </svg>
      );
      subtitle = msg.includes('preparing') ? 'Kitchen started preparing it' : 'Order confirmed by kitchen';
    } else if (msg.includes('cancelled') || msg.includes('rejected')) {
      semanticType = 'red';
      icon = (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="6" fill="#c62828" />
        </svg>
      );
      subtitle = 'Payment has been refunded';
    } else if (msg.includes('placed') || msg.includes('successful')) {
      semanticType = 'neutral';
      icon = (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="6" fill="#1976d2" />
        </svg>
      );
      subtitle = 'Order placed successfully';
    }

    const tokenMatch = notif.message.match(/order\s+([A-Z0-9]+)/i);
    let orderId = null;
    if (tokenMatch && tokenMatch[1]) {
      const tokenStr = tokenMatch[1];
      const matchedOrder = orders.find(o => o.token?.tokenNumber === tokenStr);
      if (matchedOrder) {
        orderId = matchedOrder.id;
      }
    }

    return { icon, subtitle, orderId };
  };

  const groupNotifications = () => {
    const today = [];
    const yesterday = [];
    const older = [];
    
    const todayDate = new Date();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(todayDate.getDate() - 1);
    
    // Sort descending by date first
    const sorted = [...notifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    sorted.forEach(n => {
      const d = new Date(n.createdAt);
      if (d.toDateString() === todayDate.toDateString()) {
        today.push(n);
      } else if (d.toDateString() === yesterdayDate.toDateString()) {
        yesterday.push(n);
      } else {
        older.push(n);
      }
    });
    
    return { today, yesterday, older };
  };

  const { today, yesterday, older } = groupNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;

  const renderSection = (title, items) => {
    if (!items || items.length === 0) return null;
    
    return (
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '1px', color: '#888', marginBottom: '16px', textTransform: 'uppercase' }}>{title}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {items.map(notif => {
            const { icon, subtitle, orderId } = getNotificationInfo(notif);
            const isUnread = !notif.read;
            
            return (
              <div 
                key={notif.id}
                onClick={() => {
                  if (isUnread) markAsRead(notif.id);
                  if (orderId) navigate(`/orders/${orderId}`);
                }}
                style={{
                  backgroundColor: isUnread ? '#fffaf9' : '#fff',
                  border: isUnread ? '1px solid #f9ded9' : '1px solid #eaeaea',
                  padding: '16px',
                  borderRadius: '16px',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'flex-start',
                  cursor: orderId ? 'pointer' : 'default',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  transition: 'background-color 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (orderId) e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                }}
                onMouseLeave={(e) => {
                  if (orderId) e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
                }}
              >
                <div style={{ marginTop: '2px' }}>
                  {icon}
                </div>
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: isUnread ? '600' : '500', color: '#111', lineHeight: '1.4' }}>
                    {notif.message}
                  </p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#666', fontWeight: '500' }}>
                    {subtitle} <span style={{ opacity: 0.5, margin: '0 4px' }}>·</span> {relativeTime(notif.createdAt)}
                  </p>
                </div>

                {isUnread && (
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#e74c3c', marginTop: '6px' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#fdfbfb' }}>
      <StudentNavbar />
      
      <div style={{ flex: 1, maxWidth: '700px', margin: '0 auto', width: '100%', padding: '40px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
          <div>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: '800', color: '#111', letterSpacing: '-0.5px' }}>UPDATES</h1>
            <p style={{ margin: '0 0 32px 0', fontSize: '16px', color: '#666' }}>Stay on top of your orders and campus canteen updates.</p>
          </div>
          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              style={{
                backgroundColor: 'transparent',
                color: '#e74c3c',
                border: 'none',
                padding: '0 0 32px 0',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Mark all as read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 24px' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#111' }}>You're all caught up.</p>
            <p style={{ margin: '0 0 24px 0', color: '#666' }}>Order updates and other canteen notifications will appear here.</p>
            <button 
              onClick={() => navigate('/student')} 
              style={{ backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '8px', padding: '12px 24px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}
            >
              Browse menu
            </button>
          </div>
        ) : (
          <div>
            {renderSection('TODAY', today)}
            {renderSection('YESTERDAY', yesterday)}
            {renderSection('OLDER', older)}
          </div>
        )}
      </div>
    </div>
  );
}
