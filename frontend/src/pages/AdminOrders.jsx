import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, [search, statusFilter]);

  const fetchOrders = async () => {
    try {
      const res = await api.get(`/admin/orders?search=${search}&status=${statusFilter}`);
      setOrders(res.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) navigate('/');
    }
  };

  const handleViewOrder = async (id) => {
    try {
      const res = await api.get(`/admin/orders/${id}`);
      setSelectedOrder(res.data);
    } catch (err) {
      alert("Error fetching order details");
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#fdfbfb' }}>
      <AdminSidebar />

      <div style={{ flex: 1, padding: '48px', overflowY: 'auto', boxSizing: 'border-box' }}>
        
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', color: '#111', fontWeight: '800', letterSpacing: '-0.5px' }}>ALL ORDERS</h1>
          <p style={{ margin: 0, fontSize: '16px', color: '#666', fontWeight: '500' }}>Operational order ledger and history.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#888' }}>🔍</span>
            <input 
              type="text" 
              placeholder="Search ID, Token, Username..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...inputStyle, paddingLeft: '44px' }}
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...inputStyle, width: '200px', cursor: 'pointer' }}>
            <option value="ALL">All Statuses</option>
            <option value="PLACED">Placed (New)</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="PREPARING">Preparing</option>
            <option value="READY">Ready</option>
            <option value="COLLECTED">Collected</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #eaeaea', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#fdfbfb', borderBottom: '1px solid #eaeaea' }}>
                <th style={thStyle}>Token</th>
                <th style={thStyle}>Order ID</th>
                <th style={thStyle}>Student</th>
                <th style={thStyle}>Amount</th>
                <th style={thStyle}>Payment</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Time</th>
                <th style={{...thStyle, textAlign: 'right'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => {
                let statusColor = '#666';
                if (['PLACED', 'ACCEPTED'].includes(o.status)) statusColor = '#e74c3c';
                if (o.status === 'PREPARING') statusColor = '#f57c00';
                if (o.status === 'READY') statusColor = '#388e3c';
                if (o.status === 'COLLECTED') statusColor = '#388e3c';
                if (['CANCELLED', 'REJECTED'].includes(o.status)) statusColor = '#c62828';

                return (
                  <tr key={o.id} style={{ borderBottom: '1px solid #eaeaea' }}>
                    <td style={{ ...tdStyle, fontWeight: '800', color: '#111', fontSize: '16px' }}>{o.tokenNumber || '-'}</td>
                    <td style={{ ...tdStyle, color: '#888' }}>#{o.id}</td>
                    <td style={{ ...tdStyle, fontWeight: '600' }}>{o.studentUsername}</td>
                    <td style={{ ...tdStyle, fontWeight: '700' }}>₹{o.totalAmount}</td>
                    <td style={tdStyle}>{o.paymentMethod || '-'}</td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: statusColor, letterSpacing: '0.5px' }}>
                        {o.status}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, color: '#888' }}>{new Date(o.createdAt).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <button onClick={() => handleViewOrder(o.id)} style={{ backgroundColor: '#fff', color: '#111', border: '1px solid #ddd', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>View Details</button>
                    </td>
                  </tr>
                );
              })}
              {orders.length === 0 && (
                <tr><td colSpan="8" style={{ ...tdStyle, textAlign: 'center', color: '#888', fontStyle: 'italic', padding: '48px' }}>No orders found matching criteria.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Details Modal */}
        {selectedOrder && (
          <div style={modalOverlayStyle}>
            <div style={modalStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #eaeaea', paddingBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '20px', color: '#111', fontWeight: '800' }}>Order #{selectedOrder.id}</h3>
                <button onClick={() => setSelectedOrder(null)} style={{ background: '#f5f5f5', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', color: '#666', fontSize: '16px', fontWeight: 'bold' }}>×</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
                <div style={{ backgroundColor: '#fafafa', padding: '16px', borderRadius: '12px', border: '1px solid #eaeaea' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#888', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '1px' }}>Student</p>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#111' }}>{selectedOrder.student?.username}</p>
                </div>
                <div style={{ backgroundColor: '#fdf2f2', padding: '16px', borderRadius: '12px', border: '1px solid #fad4d4' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#e74c3c', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '1px' }}>Token</p>
                  <p style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#e74c3c' }}>{selectedOrder.token?.tokenNumber || 'None'}</p>
                </div>
                <div style={{ backgroundColor: '#fafafa', padding: '16px', borderRadius: '12px', border: '1px solid #eaeaea' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#888', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '1px' }}>Status</p>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#111' }}>{selectedOrder.status}</p>
                </div>
                <div style={{ backgroundColor: '#fafafa', padding: '16px', borderRadius: '12px', border: '1px solid #eaeaea' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#888', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '1px' }}>Date</p>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#111' }}>{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                </div>
              </div>
              
              <h4 style={{ margin: '0 0 16px 0', color: '#111', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>Items</h4>
              <div style={{ border: '1px solid #eaeaea', borderRadius: '12px', padding: '20px', marginBottom: '32px', backgroundColor: '#fff' }}>
                {selectedOrder.items?.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '15px' }}>
                    <span style={{ color: '#111' }}><span style={{ fontWeight: '700', marginRight: '8px' }}>{item.quantity}×</span> {item.menuItem?.name}</span>
                    <span style={{ fontWeight: '500', color: '#666' }}>₹{item.subtotal}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #eaeaea', fontWeight: '800', fontSize: '16px', color: '#111' }}>
                  <span>Total Amount</span>
                  <span>₹{selectedOrder.totalAmount}</span>
                </div>
              </div>

              <h4 style={{ margin: '0 0 16px 0', color: '#111', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>Payment Info</h4>
              <div style={{ border: '1px solid #eaeaea', borderRadius: '12px', padding: '20px', marginBottom: '32px', backgroundColor: '#fafafa', fontSize: '14px' }}>
                {selectedOrder.payment ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#666' }}>Method:</span> <span style={{ fontWeight: '700', color: '#111' }}>{selectedOrder.payment.method}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#666' }}>Status:</span> <span style={{ fontWeight: '700', color: '#111' }}>{selectedOrder.payment.status}</span></div>
                    {selectedOrder.payment.transactionReference && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#666' }}>Ref:</span> <span style={{ fontFamily: 'monospace', fontWeight: '500', color: '#333' }}>{selectedOrder.payment.transactionReference}</span></div>
                    )}
                  </div>
                ) : <p style={{ margin: 0, color: '#888', fontStyle: 'italic' }}>No Payment Record</p>}
              </div>

              <h4 style={{ margin: '0 0 16px 0', color: '#111', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>Status History</h4>
              <div style={{ marginBottom: '32px' }}>
                {selectedOrder.statusHistory?.map(hist => (
                  <div key={hist.id} style={{ fontSize: '13px', color: '#666', marginBottom: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ width: '130px', fontWeight: '500' }}>{new Date(hist.changedAt).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</span>
                    <span style={{ flex: 1 }}>{hist.oldStatus} &rarr; <span style={{ fontWeight: '700', color: '#111' }}>{hist.newStatus}</span></span>
                    <span style={{ width: '120px', textAlign: 'right', fontSize: '12px' }}>by {hist.changedBy?.username || 'System'}</span>
                  </div>
                ))}
              </div>

              {selectedOrder.feedback && (
                <>
                  <h4 style={{ margin: '0 0 16px 0', color: '#111', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>Feedback</h4>
                  <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #eaeaea', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#F5A623', letterSpacing: '2px' }}>{'★'.repeat(selectedOrder.feedback.rating)}{'☆'.repeat(5 - selectedOrder.feedback.rating)}</p>
                    <p style={{ margin: 0, fontSize: '15px', color: '#333', fontStyle: 'italic' }}>"{selectedOrder.feedback.comment}"</p>
                  </div>
                </>
              )}

              <div style={{ marginTop: '40px' }}>
                <button onClick={() => setSelectedOrder(null)} style={{ width: '100%', backgroundColor: '#fff', color: '#111', border: '1px solid #ddd', borderRadius: '8px', padding: '14px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>Close Window</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

const inputStyle = {
  padding: '12px 16px',
  borderRadius: '8px',
  border: '1px solid #ddd',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit'
};

const thStyle = {
  padding: '16px 20px',
  color: '#888',
  fontWeight: '700',
  fontSize: '12px',
  textTransform: 'uppercase',
  letterSpacing: '1px'
};

const tdStyle = {
  padding: '16px 20px',
  color: '#111',
  fontSize: '14px'
};

const modalOverlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.4)',
  backdropFilter: 'blur(2px)',
  display: 'flex', justifyContent: 'center', alignItems: 'center',
  zIndex: 1000
};

const modalStyle = {
  backgroundColor: '#fff',
  padding: '40px',
  borderRadius: '24px',
  width: '100%',
  maxWidth: '600px',
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
};
