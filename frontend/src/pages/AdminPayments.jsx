import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [selectedPayment, setSelectedPayment] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchPayments();
  }, [search, statusFilter, methodFilter]);

  const fetchPayments = async () => {
    try {
      const res = await api.get(`/admin/payments?search=${search}&status=${statusFilter}&method=${methodFilter}`);
      setPayments(res.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) navigate('/');
    }
  };

  const handleViewPayment = async (id) => {
    try {
      const res = await api.get(`/admin/payments/${id}`);
      setSelectedPayment(res.data);
    } catch (err) {
      alert("Error fetching payment details");
    }
  };

  const calculateRevenue = () => {
    let todayRevenue = 0;
    let successfulCount = 0;
    let refundedAmount = 0;
    let failedCount = 0;

    const today = new Date().toLocaleDateString();

    payments.forEach(p => {
      const pDate = new Date(p.createdAt).toLocaleDateString();
      if (pDate === today) {
        if (p.status === 'SUCCESS') {
          todayRevenue += p.amount;
          successfulCount++;
        }
        if (p.status === 'REFUNDED') {
          refundedAmount += p.amount;
        }
        if (p.status === 'FAILED') {
          failedCount++;
        }
      }
    });

    return { todayRevenue, successfulCount, refundedAmount, failedCount };
  };

  const stats = calculateRevenue();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#fdfbfb' }}>
      <AdminSidebar />

      <div style={{ flex: 1, padding: '48px', overflowY: 'auto', boxSizing: 'border-box' }}>
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', color: '#111', fontWeight: '800', letterSpacing: '-0.5px' }}>PAYMENT LEDGER</h1>
          <p style={{ margin: 0, fontSize: '16px', color: '#666', fontWeight: '500' }}>Track and manage all canteen transactions.</p>
        </div>
        
        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '40px' }}>
          <div style={{...cardStyle, backgroundColor: '#fdf2f2', border: '1px solid #fad4d4'}}>
            <p style={{ margin: '0 0 8px 0', color: '#e74c3c', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Today's Revenue</p>
            <p style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: '#e74c3c' }}>₹{stats.todayRevenue.toFixed(2)}</p>
          </div>
          <div style={cardStyle}>
            <p style={{ margin: '0 0 8px 0', color: '#888', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Successful Txns</p>
            <p style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: '#111' }}>{stats.successfulCount}</p>
          </div>
          <div style={cardStyle}>
            <p style={{ margin: '0 0 8px 0', color: '#888', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Refunded Amount</p>
            <p style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: '#111' }}>₹{stats.refundedAmount.toFixed(2)}</p>
          </div>
          <div style={cardStyle}>
            <p style={{ margin: '0 0 8px 0', color: '#888', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Failed Txns</p>
            <p style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: '#c62828' }}>{stats.failedCount}</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#888' }}>🔍</span>
            <input 
              type="text" 
              placeholder="Search Ref, Order ID, User..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...inputStyle, paddingLeft: '44px' }}
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...inputStyle, width: '180px', cursor: 'pointer' }}>
            <option value="ALL">All Statuses</option>
            <option value="SUCCESS">Success</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
          <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} style={{ ...inputStyle, width: '180px', cursor: 'pointer' }}>
            <option value="ALL">All Methods</option>
            <option value="WALLET">Wallet</option>
            <option value="UPI">UPI</option>
            <option value="CARD">Card</option>
            <option value="NET_BANKING">Net Banking</option>
            <option value="CASH">Cash</option>
          </select>
        </div>

        <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #eaeaea', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#fdfbfb', borderBottom: '1px solid #eaeaea' }}>
                <th style={thStyle}>Ref / Txn ID</th>
                <th style={thStyle}>Order</th>
                <th style={thStyle}>Student</th>
                <th style={thStyle}>Method</th>
                <th style={thStyle}>Amount</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Date</th>
                <th style={{...thStyle, textAlign: 'right'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #eaeaea' }}>
                  <td style={{...tdStyle, fontFamily: 'monospace', color: '#666'}}>{p.transactionReference || '-'}</td>
                  <td style={{...tdStyle, fontWeight: '700', color: '#111'}}>#{p.orderId}</td>
                  <td style={{...tdStyle, fontWeight: '600', color: '#333'}}>{p.studentUsername}</td>
                  <td style={{...tdStyle, color: '#666'}}>{p.method}</td>
                  <td style={{...tdStyle, fontWeight: '700', color: '#111'}}>₹{p.amount}</td>
                  <td style={tdStyle}>
                    <span style={{ 
                      fontSize: '12px', 
                      fontWeight: '700',
                      letterSpacing: '0.5px',
                      color: p.status === 'SUCCESS' ? '#388e3c' : p.status === 'REFUNDED' ? '#f57c00' : p.status === 'FAILED' ? '#c62828' : '#888'
                    }}>
                      {p.status}
                    </span>
                  </td>
                  <td style={{...tdStyle, color: '#888'}}>{new Date(p.createdAt).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</td>
                  <td style={{...tdStyle, textAlign: 'right'}}>
                    <button onClick={() => handleViewPayment(p.id)} style={{ backgroundColor: '#fff', color: '#111', border: '1px solid #ddd', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Details</button>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr><td colSpan="8" style={{...tdStyle, textAlign: 'center', padding: '48px', color: '#888', fontStyle: 'italic'}}>No payments found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Details Modal */}
        {selectedPayment && (
          <div style={modalOverlayStyle}>
            <div style={modalStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #eaeaea', paddingBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '20px', color: '#111', fontWeight: '800' }}>Transaction Details</h3>
                <button onClick={() => setSelectedPayment(null)} style={{ background: '#f5f5f5', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', color: '#666', fontSize: '16px', fontWeight: 'bold' }}>×</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eaeaea', paddingBottom: '12px' }}>
                  <span style={{ color: '#888', fontWeight: '600', fontSize: '14px' }}>Reference:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: '600', color: '#111', fontSize: '14px' }}>{selectedPayment.transactionReference || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eaeaea', paddingBottom: '12px' }}>
                  <span style={{ color: '#888', fontWeight: '600', fontSize: '14px' }}>Order ID:</span>
                  <span style={{ fontWeight: '700', color: '#111', fontSize: '14px' }}>#{selectedPayment.orderId}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eaeaea', paddingBottom: '12px' }}>
                  <span style={{ color: '#888', fontWeight: '600', fontSize: '14px' }}>Student:</span>
                  <span style={{ fontWeight: '600', color: '#111', fontSize: '14px' }}>{selectedPayment.studentUsername}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eaeaea', paddingBottom: '12px' }}>
                  <span style={{ color: '#888', fontWeight: '600', fontSize: '14px' }}>Method:</span>
                  <span style={{ fontWeight: '600', color: '#111', fontSize: '14px' }}>{selectedPayment.method}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eaeaea', paddingBottom: '12px' }}>
                  <span style={{ color: '#888', fontWeight: '600', fontSize: '14px' }}>Amount:</span>
                  <span style={{ fontWeight: '800', fontSize: '18px', color: '#111' }}>₹{selectedPayment.amount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eaeaea', paddingBottom: '12px' }}>
                  <span style={{ color: '#888', fontWeight: '600', fontSize: '14px' }}>Status:</span>
                  <span style={{ fontWeight: '700', fontSize: '14px', color: selectedPayment.status === 'SUCCESS' ? '#388e3c' : selectedPayment.status === 'FAILED' ? '#c62828' : '#111' }}>{selectedPayment.status}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px' }}>
                  <span style={{ color: '#888', fontWeight: '600', fontSize: '14px' }}>Date:</span>
                  <span style={{ fontWeight: '600', color: '#111', fontSize: '14px' }}>{new Date(selectedPayment.createdAt).toLocaleString()}</span>
                </div>
              </div>
              
              {selectedPayment.status === 'REFUNDED' && (
                <div style={{ padding: '16px', backgroundColor: '#fff', border: '1px solid #eaeaea', borderRadius: '12px', marginBottom: '16px', color: '#666', fontSize: '14px', fontStyle: 'italic' }}>
                  <strong style={{ color: '#f57c00', fontStyle: 'normal' }}>Note:</strong> This payment has been refunded to the student's wallet.
                </div>
              )}
              {selectedPayment.method === 'WALLET' && (
                <div style={{ padding: '16px', backgroundColor: '#fafafa', border: '1px solid #eaeaea', borderRadius: '12px', marginBottom: '16px', color: '#666', fontSize: '14px' }}>
                  <strong style={{ color: '#111' }}>Source:</strong> Campus Wallet Balance
                </div>
              )}

              <div style={{ marginTop: '40px' }}>
                <button onClick={() => setSelectedPayment(null)} style={{ width: '100%', backgroundColor: '#fff', color: '#111', border: '1px solid #ddd', borderRadius: '8px', padding: '14px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>Close Window</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

const cardStyle = {
  backgroundColor: '#fff',
  padding: '24px',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
  border: '1px solid #eaeaea'
};

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
  maxWidth: '480px',
  boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
};
