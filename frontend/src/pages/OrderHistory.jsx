import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
import OrderRating from '../components/OrderRating';
import StudentNavbar from '../components/StudentNavbar';

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [queueInfo, setQueueInfo] = useState({});
  const [activeTab, setActiveTab] = useState('active');
  const [rateOrderActive, setRateOrderActive] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      setOrders(res.data);
      
      const active = res.data.filter(o => ['PLACED', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.status));
      active.forEach(o => {
        if (['PLACED', 'ACCEPTED', 'PREPARING'].includes(o.status)) {
           api.get(`/orders/${o.id}/queue`).then(qRes => {
             setQueueInfo(prev => ({ ...prev, [o.id]: qRes.data }));
           }).catch(e => console.error(e));
        }
      });
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      if (err.response?.status === 401) navigate('/');
    }
  };

  const cancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    try {
      await api.put(`/orders/${orderId}/cancel`);
      fetchOrders();
    } catch (err) {
      alert("Failed to cancel: " + (err.response?.data?.message || err.message));
    }
  };

  const activeOrders = orders.filter(o => ['PLACED', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.status));
  const pastOrders = orders.filter(o => ['COLLECTED', 'CANCELLED', 'REJECTED'].includes(o.status));

  const getStatusStyle = (status) => {
    if (status === 'READY') return { backgroundColor: '#e74c3c', color: 'white' };
    if (status === 'PREPARING') return { backgroundColor: '#fff3cd', color: '#856404' };
    if (status === 'ACCEPTED') return { backgroundColor: '#d1ecf1', color: '#0c5460' };
    if (status === 'PLACED') return { backgroundColor: '#e2e3e5', color: '#383d41' };
    return { backgroundColor: '#f8f9fa', color: '#6c757d' };
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#fdfbfb' }}>
      <StudentNavbar />
      
      <div style={{ flex: 1, maxWidth: '800px', margin: '0 auto', width: '100%', padding: '40px 24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 8px 0', color: '#111', letterSpacing: '-0.5px' }}>YOUR ORDERS</h1>
        <p style={{ fontSize: '16px', color: '#666', margin: '0 0 32px 0' }}>Track your current orders and revisit your past ones.</p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '32px', marginBottom: '32px', borderBottom: '1px solid #eaeaea' }}>
          <div 
            onClick={() => setActiveTab('active')}
            style={{ 
              paddingBottom: '12px', 
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '15px',
              color: activeTab === 'active' ? '#e74c3c' : '#888',
              borderBottom: activeTab === 'active' ? '2px solid #e74c3c' : '2px solid transparent',
              transition: 'all 0.2s',
              marginBottom: '-1px'
            }}>
            Active
          </div>
          <div 
            onClick={() => setActiveTab('past')}
            style={{ 
              paddingBottom: '12px', 
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '15px',
              color: activeTab === 'past' ? '#e74c3c' : '#888',
              borderBottom: activeTab === 'past' ? '2px solid #e74c3c' : '2px solid transparent',
              transition: 'all 0.2s',
              marginBottom: '-1px'
            }}>
            Past
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'active' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {activeOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 24px' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#111' }}>No active orders</p>
                <p style={{ margin: '0 0 24px 0', color: '#666' }}>Your next meal is waiting.</p>
                <button 
                  onClick={() => navigate('/student')} 
                  style={{ backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '8px', padding: '12px 24px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Browse menu
                </button>
              </div>
            ) : (
              activeOrders.map(order => (
                <div key={order.id} style={{ backgroundColor: '#fff', border: '1px solid #eaeaea', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                    <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#111' }}>{order.token?.tokenNumber || 'N/A'}</h3>
                    <div style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '0.5px', padding: '6px 12px', borderRadius: '8px', ...getStatusStyle(order.status) }}>
                      {order.status}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                    {order.items.map(item => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px' }}>
                        <span style={{ color: '#333' }}><span style={{ fontWeight: '600', color: '#111', marginRight: '8px' }}>{item.quantity}×</span> {item.menuItem?.name || 'Item'}</span>
                        <span style={{ color: '#666', fontWeight: '500' }}>₹{item.subtotal}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingTop: '16px', borderTop: '1px dashed #eaeaea' }}>
                    <span style={{ color: '#666', fontSize: '14px', fontWeight: '500' }}>Total Amount</span>
                    <span style={{ fontWeight: '700', fontSize: '18px', color: '#111' }}>₹{order.totalAmount}</span>
                  </div>

                  {queueInfo[order.id] && ['PLACED', 'ACCEPTED', 'PREPARING'].includes(order.status) && (
                    <div style={{ marginBottom: '24px', color: '#666', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
                      <span style={{ fontSize: '16px' }}>🕒</span> {queueInfo[order.id].ordersAhead} {queueInfo[order.id].ordersAhead === 1 ? 'order' : 'orders'} ahead
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {order.status === 'PLACED' ? (
                      <button onClick={() => cancelOrder(order.id)} style={{ background: 'none', border: 'none', color: '#666', fontSize: '14px', fontWeight: '600', cursor: 'pointer', padding: 0 }}>Cancel order</button>
                    ) : <div></div>}
                    <button onClick={() => navigate(`/orders/${order.id}`)} style={{ backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                      Track order →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'past' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {pastOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 24px' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#111' }}>No past orders yet.</p>
                <p style={{ margin: 0, color: '#666' }}>Your completed orders will appear here.</p>
              </div>
            ) : (
              pastOrders.map(order => (
                <div key={order.id} style={{ backgroundColor: '#fff', border: '1px solid #eaeaea', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#111' }}>{order.token?.tokenNumber || 'N/A'}</h4>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: order.status === 'COLLECTED' ? '#388e3c' : '#e74c3c' }}>{order.status}</span>
                    </div>
                    <span style={{ fontWeight: '600', fontSize: '15px', color: '#111' }}>₹{order.totalAmount}</span>
                  </div>
                  
                  <div style={{ color: '#555', fontSize: '14px', lineHeight: '1.5' }}>
                    {order.items.map(item => `${item.menuItem?.name || 'Item'} × ${item.quantity}`).join(', ')}
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                    <button onClick={() => navigate(`/orders/${order.id}`)} style={{ background: 'none', border: 'none', color: '#111', fontSize: '14px', fontWeight: '600', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
                      View details
                    </button>
                    
                    {order.status === 'COLLECTED' && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flex: 1 }}>
                        {!order.feedback && !rateOrderActive[order.id] ? (
                          <button onClick={() => setRateOrderActive({ ...rateOrderActive, [order.id]: true })} style={{ background: 'none', border: 'none', color: '#e74c3c', fontSize: '14px', fontWeight: '600', cursor: 'pointer', padding: 0 }}>
                            Rate order →
                          </button>
                        ) : null}
                        
                        {(order.feedback || rateOrderActive[order.id]) && (
                          <div style={{ width: '100%', maxWidth: '300px', marginTop: rateOrderActive[order.id] && !order.feedback ? '16px' : '0' }}>
                            <OrderRating 
                              orderId={order.id} 
                              initialFeedback={order.feedback} 
                              onFeedbackSubmitted={(fb) => {
                                const updatedOrders = orders.map(o => o.id === order.id ? { ...o, feedback: fb } : o);
                                setOrders(updatedOrders);
                                setRateOrderActive({ ...rateOrderActive, [order.id]: false });
                              }} 
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
