import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
import { resolveImageUrl } from '../utils/imageUtils';

export default function StaffOrders() {
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [historyFilter, setHistoryFilter] = useState('ALL');
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
    fetchMenuItems();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/all');
      setOrders(res.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) navigate('/');
    }
  };

  const fetchMenuItems = async () => {
    try {
      const res = await api.get('/menu');
      setMenuItems(res.data);
    } catch (err) {
      console.error("Failed to fetch menu items", err);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await api.put(`/orders/${id}/status`, { status: newStatus });
      fetchOrders();
    } catch (err) {
      alert("Failed to update status: " + (err.response?.data?.message || err.message));
    }
  };

  const handleToggleAvailability = async (item) => {
    try {
      const payload = {
        categoryId: item.category.id,
        name: item.name,
        description: item.description,
        price: item.price,
        imageUrl: item.imageUrl,
        available: !item.available,
        preparationTime: item.preparationTime
      };
      await api.put(`/menu/${item.id}`, payload);
      setMenuItems(prev => prev.map(m => m.id === item.id ? { ...m, available: !item.available } : m));
    } catch (err) {
      alert("Failed to update availability: " + (err.response?.data?.message || err.message));
    }
  };

  const newOrders = orders.filter(o => o.status === 'PLACED' || o.status === 'ACCEPTED');
  const preparingOrders = orders.filter(o => o.status === 'PREPARING');
  const readyOrders = orders.filter(o => o.status === 'READY');
  const activeCount = newOrders.length + preparingOrders.length + readyOrders.length;

  const historyOrders = orders.filter(o => ['COLLECTED', 'CANCELLED', 'REJECTED'].includes(o.status));
  const filteredHistory = historyFilter === 'ALL' 
    ? historyOrders 
    : historyOrders.filter(o => o.status === historyFilter);

  const OrderCard = ({ order, accentColor }) => {
    return (
      <div style={{ backgroundColor: '#fff', border: '1px solid #eaeaea', borderTop: `4px solid ${accentColor}`, borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#111', letterSpacing: '-0.5px' }}>{order.token?.tokenNumber || 'N/A'}</h3>
          <span style={{ fontSize: '12px', fontWeight: '700', color: accentColor, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '4px 8px', backgroundColor: `${accentColor}15`, borderRadius: '6px' }}>
            {order.status}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {order.items.map(item => (
            <div key={item.id} style={{ fontSize: '15px', color: '#111' }}>
              <span style={{ fontWeight: '700', marginRight: '6px' }}>{item.quantity}×</span> 
              <span style={{ fontWeight: '500' }}>{item.menuItem.name}</span>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid #eaeaea', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>{order.student.username}</span>
            <span style={{ fontSize: '13px', color: '#666' }}>₹{order.totalAmount} · {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          {order.status === 'PLACED' && (
            <>
              <button onClick={() => handleUpdateStatus(order.id, 'ACCEPTED')} style={{ flex: 1, backgroundColor: '#111', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Accept Order</button>
              <button onClick={() => handleUpdateStatus(order.id, 'REJECTED')} style={{ flex: 1, backgroundColor: '#fff', color: '#e74c3c', border: '1px solid #e74c3c', borderRadius: '8px', padding: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reject</button>
            </>
          )}
          {order.status === 'ACCEPTED' && (
            <button onClick={() => handleUpdateStatus(order.id, 'PREPARING')} style={{ width: '100%', backgroundColor: accentColor, color: '#fff', border: 'none', borderRadius: '8px', padding: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Start Preparing →</button>
          )}
          {order.status === 'PREPARING' && (
            <button onClick={() => handleUpdateStatus(order.id, 'READY')} style={{ width: '100%', backgroundColor: accentColor, color: '#fff', border: 'none', borderRadius: '8px', padding: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mark Ready →</button>
          )}
          {order.status === 'READY' && (
            <button onClick={() => handleUpdateStatus(order.id, 'COLLECTED')} style={{ width: '100%', backgroundColor: accentColor, color: '#fff', border: 'none', borderRadius: '8px', padding: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mark Collected ✓</button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#fdfbfb' }}>
      
      {/* Staff Navbar */}
      <nav style={{ backgroundColor: '#111', padding: '0 24px', height: '64px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', letterSpacing: '0.5px' }}>
            Smart Campus Canteen <span style={{ opacity: 0.5, fontWeight: 'normal' }}>| Staff</span>
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button onClick={() => navigate('/profile')} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
            Profile
          </button>
          <button onClick={() => { sessionStorage.clear(); navigate('/'); }} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.3)', color: 'white', cursor: 'pointer', fontSize: '13px', padding: '6px 12px', borderRadius: '6px', fontWeight: '600' }}>
            Logout
          </button>
        </div>
      </nav>

      <div style={{ flex: 1, padding: '40px 24px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        
        {/* HEADER */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '36px', margin: '0 0 8px 0', color: '#111', fontWeight: '800', letterSpacing: '-1px' }}>KITCHEN</h1>
          <p style={{ margin: 0, color: '#666', fontSize: '18px', fontWeight: '500' }}>Today's service · <span style={{ color: '#111', fontWeight: '700' }}>{activeCount} active orders</span></p>
        </div>

        {/* KITCHEN SUMMARY */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
          <div style={{ backgroundColor: '#fff', border: '1px solid #eaeaea', padding: '16px 24px', borderRadius: '12px', flex: '1 1 200px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>New</span>
            <span style={{ fontSize: '28px', fontWeight: '800', color: '#111' }}>{newOrders.length}</span>
          </div>
          <div style={{ backgroundColor: '#fff', border: '1px solid #eaeaea', padding: '16px 24px', borderRadius: '12px', flex: '1 1 200px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Preparing</span>
            <span style={{ fontSize: '28px', fontWeight: '800', color: '#111' }}>{preparingOrders.length}</span>
          </div>
          <div style={{ backgroundColor: '#fff', border: '1px solid #eaeaea', padding: '16px 24px', borderRadius: '12px', flex: '1 1 200px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Ready</span>
            <span style={{ fontSize: '28px', fontWeight: '800', color: '#111' }}>{readyOrders.length}</span>
          </div>
        </div>

        {/* MAIN KITCHEN BOARD */}
        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', alignItems: 'flex-start', marginBottom: '64px' }}>
          
          {/* NEW */}
          <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: '700', color: '#e74c3c', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', justifyContent: 'space-between' }}>
              NEW <span style={{ color: '#aaa' }}>Waiting to be prepared</span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {newOrders.length === 0 && <div style={{ color: '#aaa', fontStyle: 'italic', fontSize: '15px' }}>No new orders.</div>}
              {newOrders.map(o => <OrderCard key={o.id} order={o} accentColor="#e74c3c" />)}
            </div>
          </div>

          {/* PREPARING */}
          <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: '700', color: '#f57c00', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', justifyContent: 'space-between' }}>
              PREPARING <span style={{ color: '#aaa' }}>On the stove</span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {preparingOrders.length === 0 && <div style={{ color: '#aaa', fontStyle: 'italic', fontSize: '15px' }}>No orders preparing.</div>}
              {preparingOrders.map(o => <OrderCard key={o.id} order={o} accentColor="#f57c00" />)}
            </div>
          </div>

          {/* READY */}
          <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: '700', color: '#388e3c', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', justifyContent: 'space-between' }}>
              READY <span style={{ color: '#aaa' }}>Ready for pickup</span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {readyOrders.length === 0 && <div style={{ color: '#aaa', fontStyle: 'italic', fontSize: '15px' }}>No orders ready.</div>}
              {readyOrders.map(o => <OrderCard key={o.id} order={o} accentColor="#388e3c" />)}
            </div>
          </div>

        </div>

        {/* TODAY'S MENU AVAILABILITY */}
        <div style={{ marginBottom: '64px', backgroundColor: '#fff', border: '1px solid #eaeaea', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 12px rgba(0,0,0,0.02)' }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', margin: '0 0 8px 0', color: '#111', fontWeight: '700' }}>TODAY'S MENU</h2>
            <p style={{ margin: 0, color: '#666', fontSize: '15px' }}>Control what the kitchen can serve right now.</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {menuItems.map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #eaeaea', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {item.imageUrl ? (
                    <img src={resolveImageUrl(item.imageUrl)} alt={item.name} style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🍽️</div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontWeight: '600', fontSize: '15px', color: '#111' }}>{item.name}</span>
                    <span style={{ fontSize: '13px', color: '#666' }}>₹{item.price} · {item.category?.name || 'Category'}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.available ? '#388e3c' : '#ccc' }} />
                      <span style={{ fontSize: '12px', fontWeight: '700', color: item.available ? '#388e3c' : '#888', letterSpacing: '0.5px' }}>
                        {item.available ? 'AVAILABLE' : 'UNAVAILABLE'}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleToggleAvailability(item)}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid',
                    borderColor: item.available ? '#eaeaea' : '#111',
                    color: item.available ? '#666' : '#111',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {item.available ? 'MAKE UNAVAILABLE' : 'MAKE AVAILABLE'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ORDER HISTORY */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', margin: 0, color: '#111', fontWeight: '700' }}>ORDER HISTORY</h2>
            <div style={{ display: 'flex', gap: '12px' }}>
              <select 
                value={historyFilter} 
                onChange={e => setHistoryFilter(e.target.value)}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #eaeaea', outline: 'none', fontSize: '14px', fontWeight: '600', backgroundColor: '#fff', color: '#111' }}
              >
                <option value="ALL">All Completed</option>
                <option value="COLLECTED">Collected</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #eaeaea', overflow: 'hidden' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#fdfbfb', borderBottom: '1px solid #eaeaea' }}>
                  <th style={{ padding: '16px 24px', fontWeight: '700', color: '#666', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Token</th>
                  <th style={{ padding: '16px 24px', fontWeight: '700', color: '#666', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Items</th>
                  <th style={{ padding: '16px 24px', fontWeight: '700', color: '#666', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Student</th>
                  <th style={{ padding: '16px 24px', fontWeight: '700', color: '#666', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ padding: '48px', textAlign: 'center', color: '#888', fontStyle: 'italic' }}>
                      No history found.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map(order => (
                    <tr key={order.id} style={{ borderBottom: '1px solid #eaeaea' }}>
                      <td style={{ padding: '16px 24px', fontSize: '16px', fontWeight: '700', color: '#111' }}>{order.token?.tokenNumber || 'N/A'}</td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', color: '#333' }}>
                        {order.items.map(i => `${i.quantity}× ${i.menuItem.name}`).join(', ')}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#111' }}>{order.student.username}</div>
                        <div style={{ fontSize: '13px', color: '#666' }}>₹{order.totalAmount}</div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: order.status === 'COLLECTED' ? '#388e3c' : '#c62828', letterSpacing: '0.5px' }}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
