import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import { resolveImageUrl } from '../utils/imageUtils';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [menu, setMenu] = useState([]);
  const [payments, setPayments] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
    fetchMenu();
    fetchPayments();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      setStats(res.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) navigate('/');
    }
  };

  const fetchMenu = async () => {
    try {
      const res = await api.get('/menu');
      setMenu(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await api.get('/admin/payments');
      setPayments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const enrichPopularItems = () => {
    if (!stats || !stats.popularItems) return [];
    return stats.popularItems.map(pop => {
      const menuItem = menu.find(m => m.name === pop.name);
      return {
        ...pop,
        imageUrl: menuItem?.imageUrl || null
      };
    });
  };

  const calculateSuccessfulPaymentsToday = () => {
    const today = new Date().toLocaleDateString();
    return payments.filter(p => new Date(p.createdAt).toLocaleDateString() === today && p.status === 'SUCCESS').length;
  };

  const availableMenuCount = menu.filter(m => m.available).length;
  const totalMenuCount = menu.length;

  if (!stats) return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#fdfbfb' }}>
      <AdminSidebar />
      <div style={{ flex: 1, padding: '64px', textAlign: 'center', color: '#888', fontWeight: '500' }}>Loading canteen data...</div>
    </div>
  );

  const enrichedPopular = enrichPopularItems();
  const successfulPayments = calculateSuccessfulPaymentsToday();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#fdfbfb' }}>
      <AdminSidebar />

      <div style={{ flex: 1, padding: '48px', overflowY: 'auto', boxSizing: 'border-box' }}>
        
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', color: '#111', fontWeight: '800', letterSpacing: '-0.5px' }}>CANTEEN CONTROL</h1>
          <p style={{ margin: 0, fontSize: '16px', color: '#666', fontWeight: '500' }}>Today's service at a glance.</p>
        </div>
        
        {/* LIVE SERVICE SNAPSHOT */}
        <div style={{ marginBottom: '48px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '800', color: '#111', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', borderBottom: '2px solid #eaeaea', paddingBottom: '8px' }}>Live Service</h2>
          
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ ...metricCardStyle, flex: '1 1 200px' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#666', fontWeight: '700', textTransform: 'uppercase' }}>Kitchen</p>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#388e3c', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#388e3c' }}></span> Operational
              </p>
            </div>
            <div style={{ ...metricCardStyle, flex: '1 1 200px' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#666', fontWeight: '700', textTransform: 'uppercase' }}>Active Orders</p>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: stats.activeOrdersToday > 0 ? '#e74c3c' : '#111' }}>{stats.activeOrdersToday}</p>
            </div>
            <div style={{ ...metricCardStyle, flex: '1 1 200px' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#666', fontWeight: '700', textTransform: 'uppercase' }}>Menu Availability</p>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111' }}>{availableMenuCount} / {totalMenuCount} <span style={{ fontSize: '14px', color: '#888', fontWeight: '500' }}>items</span></p>
            </div>
            <div style={{ ...metricCardStyle, flex: '1 1 200px' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#666', fontWeight: '700', textTransform: 'uppercase' }}>Payments Today</p>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111' }}>{successfulPayments} <span style={{ fontSize: '14px', color: '#888', fontWeight: '500' }}>successful</span></p>
            </div>
          </div>
        </div>

        {/* TODAY'S SERVICE */}
        <div style={{ marginBottom: '48px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '800', color: '#111', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', borderBottom: '2px solid #eaeaea', paddingBottom: '8px' }}>Today's Service</h2>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div style={metricCardStyle}>
              <span style={{ fontSize: '28px', fontWeight: '800', color: '#111' }}>{stats.totalOrdersToday}</span>
              <span style={metricLabelStyle}>Total Orders</span>
            </div>
            <div style={metricCardStyle}>
              <span style={{ fontSize: '28px', fontWeight: '800', color: '#388e3c' }}>{stats.completedOrdersToday}</span>
              <span style={metricLabelStyle}>Completed</span>
            </div>
            <div style={metricCardStyle}>
              <span style={{ fontSize: '28px', fontWeight: '800', color: '#c62828' }}>{stats.cancelledOrdersToday}</span>
              <span style={metricLabelStyle}>Cancelled</span>
            </div>
            <div style={{ ...metricCardStyle, backgroundColor: '#fdf2f2', border: '1px solid #fad4d4' }}>
              <span style={{ fontSize: '28px', fontWeight: '800', color: '#e74c3c' }}>₹{stats.revenueToday.toFixed(2)}</span>
              <span style={{ ...metricLabelStyle, color: '#e74c3c' }}>Revenue</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          
          {/* POPULAR ON CAMPUS */}
          <div style={{ flex: '1 1 350px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: '800', color: '#111', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', borderBottom: '2px solid #eaeaea', paddingBottom: '8px' }}>Popular on Campus</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {enrichedPopular.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {item.imageUrl ? (
                    <img src={resolveImageUrl(item.imageUrl)} alt={item.name} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #eaeaea' }} />
                  ) : (
                    <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🍽️</div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '15px', fontWeight: '700', color: '#111' }}>{item.name}</span>
                    <span style={{ fontSize: '13px', fontWeight: '500', color: '#e74c3c' }}>{item.quantityOrdered} orders</span>
                  </div>
                </div>
              ))}
              {enrichedPopular.length === 0 && (
                <div style={{ color: '#888', fontSize: '14px', fontStyle: 'italic' }}>No items ordered today.</div>
              )}
            </div>

            {/* KITCHEN SHORTCUT */}
            <div style={{ marginTop: '40px' }}>
              <h2 style={{ fontSize: '14px', fontWeight: '800', color: '#111', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', borderBottom: '2px solid #eaeaea', paddingBottom: '8px' }}>Kitchen</h2>
              <div style={{ backgroundColor: '#111', padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ margin: 0, color: '#fff', fontSize: '16px', fontWeight: '700' }}>{stats.activeOrdersToday} active orders</p>
                <button onClick={() => navigate('/staff/orders')} style={{ width: 'fit-content', backgroundColor: '#e74c3c', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>
                  Open kitchen board →
                </button>
              </div>
            </div>
          </div>

          {/* RECENT ACTIVITY */}
          <div style={{ flex: '2 1 500px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: '800', color: '#111', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', borderBottom: '2px solid #eaeaea', paddingBottom: '8px' }}>Recent Activity</h2>
            <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #eaeaea', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.02)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#fdfbfb', borderBottom: '1px solid #eaeaea' }}>
                    <th style={thStyle}>Token</th>
                    <th style={thStyle}>Student</th>
                    <th style={thStyle}>Amount</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders && stats.recentOrders.map(order => {
                    let statusColor = '#666';
                    if (['PLACED', 'ACCEPTED'].includes(order.status)) statusColor = '#e74c3c';
                    if (order.status === 'PREPARING') statusColor = '#f57c00';
                    if (order.status === 'READY') statusColor = '#388e3c';
                    if (order.status === 'COLLECTED') statusColor = '#388e3c';
                    if (['CANCELLED', 'REJECTED'].includes(order.status)) statusColor = '#c62828';

                    return (
                      <tr key={order.id} style={{ borderBottom: '1px solid #eaeaea' }}>
                        <td style={{ ...tdStyle, fontWeight: '800', color: '#111', fontSize: '16px' }}>{order.token?.tokenNumber || 'N/A'}</td>
                        <td style={{ ...tdStyle, fontWeight: '600', color: '#111' }}>{order.student?.username}</td>
                        <td style={{ ...tdStyle, fontWeight: '700' }}>₹{order.totalAmount}</td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: statusColor, letterSpacing: '0.5px' }}>
                            {order.status}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, color: '#888' }}>{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                      </tr>
                    );
                  })}
                  {(!stats.recentOrders || stats.recentOrders.length === 0) && (
                    <tr><td colSpan="5" style={{ ...tdStyle, textAlign: 'center', color: '#888', fontStyle: 'italic' }}>No recent orders.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

const metricCardStyle = {
  backgroundColor: '#fff',
  padding: '24px',
  borderRadius: '12px',
  border: '1px solid #eaeaea',
  boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  flex: '1 1 150px'
};

const metricLabelStyle = {
  fontSize: '12px',
  fontWeight: '700',
  color: '#888',
  letterSpacing: '1px',
  textTransform: 'uppercase'
};

const thStyle = {
  padding: '12px 16px',
  color: '#888',
  fontWeight: '700',
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '1px'
};

const tdStyle = {
  padding: '12px 16px',
  fontSize: '14px',
  color: '#111'
};
