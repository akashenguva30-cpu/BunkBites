import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import OrderRating from '../components/OrderRating';
import StudentNavbar from '../components/StudentNavbar';
import { resolveImageUrl } from '../utils/imageUtils';

export default function StudentOrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [queue, setQueue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  useEffect(() => {
    if (!order) return;
    
    const activeStatuses = ['PLACED', 'ACCEPTED', 'PREPARING'];
    
    // Fetch queue immediately if active or ready
    if (activeStatuses.includes(order.status) || order.status === 'READY') {
      fetchQueue();
    }

    let interval = null;
    if (activeStatuses.includes(order.status)) {
      interval = setInterval(fetchQueue, 10000); // Poll every 10s
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [order?.status]); // Re-run if status changes

  const fetchQueue = async () => {
    try {
      const res = await api.get(`/orders/${id}/queue`);
      setQueue(res.data);
      if (res.data.status && res.data.status !== order.status) {
        // If status changed on backend, refetch full order details
        fetchOrderDetails();
      }
    } catch (err) {
      console.error("Failed to fetch queue info", err);
    }
  };

  const fetchOrderDetails = async () => {
    try {
      const res = await api.get(`/orders/${id}`);
      setOrder(res.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('You do not have permission to view this order.');
      } else if (err.response?.status === 404) {
        setError('Order not found.');
      } else {
        setError('Failed to fetch order details.');
      }
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async () => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    try {
      const res = await api.put(`/orders/${id}/cancel`);
      setOrder(res.data);
    } catch (err) {
      alert("Failed to cancel: " + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
      <StudentNavbar />
      <div style={{ padding: '64px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading order details...</div>
    </div>
  );
  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
      <StudentNavbar />
      <div style={{ padding: '64px', textAlign: 'center' }}>
        <p style={{ color: 'var(--error-color)', marginBottom: '24px' }}>{error}</p>
        <button onClick={() => navigate('/orders')} className="secondary-btn">Back to Orders</button>
      </div>
    </div>
  );
  if (!order) return <div style={{ padding: '20px' }}>Order not found.</div>;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    const options = { day: 'numeric', month: 'short' };
    const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
    return d.toLocaleDateString('en-GB', options) + ' · ' + d.toLocaleTimeString('en-US', timeOptions);
  };

  // Build timeline
  const timelineStages = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'COLLECTED'];
  const cancelledOrRejected = order.status === 'CANCELLED' || order.status === 'REJECTED';

  const getTimelineHistory = () => {
    let historyMap = {};
    if (order.createdAt) {
      historyMap['PLACED'] = new Date(order.createdAt);
    }
    if (order.statusHistory && Array.isArray(order.statusHistory)) {
      order.statusHistory.forEach(h => {
        historyMap[h.newStatus] = new Date(h.changedAt);
      });
    }
    return historyMap;
  };

  const historyMap = getTimelineHistory();
  const currentStatusIndex = timelineStages.indexOf(order.status);
  const tokenStr = order.token?.tokenNumber || 'N/A';

  const renderQueueVisualization = () => {
    if (order.status === 'READY') {
      return (
        <div style={{ textAlign: 'center', padding: '40px 24px', backgroundColor: 'var(--surface-color)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: '32px' }}>
          <div style={{ fontSize: '32px', color: '#10b981', marginBottom: '8px' }}>✓</div>
          <h2 style={{ fontSize: '24px', margin: '0 0 8px 0', color: 'var(--text-primary)', fontWeight: '700' }}>Your order is ready</h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '16px' }}>Please collect it from the canteen.</p>
        </div>
      );
    }

    if (order.status === 'COLLECTED') {
      return (
        <div style={{ textAlign: 'center', padding: '40px 24px', backgroundColor: 'var(--surface-color)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: '32px' }}>
          <div style={{ fontSize: '32px', color: '#10b981', marginBottom: '8px' }}>✓</div>
          <h2 style={{ fontSize: '24px', margin: '0 0 8px 0', color: 'var(--text-primary)', fontWeight: '700' }}>Order collected</h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '16px' }}>Enjoy your meal!</p>
        </div>
      );
    }

    if (order.status === 'REJECTED' || order.status === 'CANCELLED') {
      const title = order.status === 'REJECTED' ? 'Order rejected' : 'Order cancelled';
      return (
        <div style={{ textAlign: 'center', padding: '40px 24px', backgroundColor: 'var(--surface-color)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', margin: '0 0 8px 0', color: 'var(--text-primary)', fontWeight: '700' }}>{title}</h2>
          {order.rejectionReason && <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '16px' }}>{order.rejectionReason}</p>}
          {order.status === 'CANCELLED' && order.payment?.status === 'REFUNDED' && <p style={{ margin: '8px 0 0 0', color: 'var(--text-secondary)', fontSize: '15px' }}>Payment has been refunded.</p>}
        </div>
      );
    }

    // Active state
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px', backgroundColor: 'var(--surface-color)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: '32px' }}>
        <p style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', letterSpacing: '1px' }}>YOUR ORDER</p>
        <h1 style={{ fontSize: '48px', margin: '0 0 24px 0', color: 'var(--text-primary)', fontWeight: '800' }}>
          Token {tokenStr}
        </h1>
        
        {queue ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <p style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>
              Preparing your order
            </p>
            <p style={{ margin: 0, fontSize: '16px', color: 'var(--text-secondary)' }}>
              {queue.ordersAhead} {queue.ordersAhead === 1 ? 'order' : 'orders'} ahead
            </p>
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: '16px', color: 'var(--text-secondary)' }}>Waiting for confirmation...</p>
        )}
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
      <StudentNavbar />
      
      <div style={{ flex: 1, maxWidth: '800px', margin: '0 auto', width: '100%', padding: '40px 24px' }}>
        
        <button 
          onClick={() => navigate('/orders')} 
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0, marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '500' }}
        >
          <span>←</span> Back to Orders
        </button>

        {/* Order Details Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
              ORDER {tokenStr}
            </h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '15px' }}>
              Placed {formatDate(order.createdAt)}
            </p>
          </div>
          {order.status === 'PLACED' && (
            <button 
              onClick={cancelOrder} 
              style={{ backgroundColor: 'var(--surface-color)', color: 'var(--error-color)', border: '1px solid var(--border-color)', padding: '10px 16px', cursor: 'pointer', borderRadius: 'var(--radius-sm)', fontWeight: '600', fontSize: '14px' }}
            >
              Cancel Order
            </button>
          )}
        </div>

        {renderQueueVisualization()}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px' }}>
          
          {/* Left Column: Timeline */}
          <div style={{ flex: '1 1 250px' }}>
            <h3 style={{ margin: '0 0 24px 0', fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>Status</h3>
            <div style={{ position: 'relative', paddingLeft: '8px' }}>
              <div style={{ position: 'absolute', left: '15px', top: '24px', bottom: '24px', width: '2px', backgroundColor: 'var(--border-color)', zIndex: 1 }}></div>
              
              {cancelledOrRejected ? (
                <>
                  <TimelineNode label="Order placed" time={historyMap['PLACED']} isCompleted={true} isCurrent={false} />
                  <TimelineNode label={order.status === 'CANCELLED' ? 'Order cancelled' : 'Order rejected'} time={historyMap[order.status] || new Date(order.updatedAt)} isCompleted={false} isCurrent={true} isError={true} isLast={true} />
                </>
              ) : (
                timelineStages.map((stage, idx) => {
                  const isCompleted = idx < currentStatusIndex || order.status === 'COLLECTED';
                  const isCurrent = idx === currentStatusIndex;
                  const time = historyMap[stage];
                  return (
                    <TimelineNode 
                      key={stage} 
                      label={formatTimelineStageName(stage)} 
                      time={time} 
                      isCompleted={isCompleted} 
                      isCurrent={isCurrent} 
                      isLast={idx === timelineStages.length - 1}
                    />
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Items, Payment, Feedback */}
          <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Items */}
            <div>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>Order Items</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {order.items && order.items.map(item => (
                  <div key={item.id} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ width: '60px', height: '60px', backgroundColor: 'var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0 }}>
                      {item.menuItem?.imageUrl ? (
                        <img src={resolveImageUrl(item.menuItem.imageUrl)} alt={item.menuItem.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>🍽️</div>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 4px 0', color: 'var(--text-primary)', fontWeight: '500' }}>
                        {item.menuItem?.name || 'Unknown Item'} × {item.quantity}
                      </p>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>₹{item.subtotal}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)' }}>
                <span style={{ fontSize: '15px' }}>Subtotal</span>
                <span style={{ fontWeight: '600', fontSize: '16px' }}>₹{order.totalAmount}</span>
              </div>
            </div>

            {/* Payment */}
            <div>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>Payment</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Method</span>
                  <span style={{ color: 'var(--text-primary)' }}>{order.payment?.method === 'WALLET' ? 'Campus Wallet' : order.payment?.method}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Status</span>
                  <span style={{ color: 'var(--text-primary)' }}>{order.payment?.status}</span>
                </div>
                {order.payment?.transactionReference && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Reference</span>
                    <span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{order.payment.transactionReference}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Feedback */}
            <div>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>Feedback</h3>
              {order.status === 'COLLECTED' ? (
                <div style={{ backgroundColor: 'var(--surface-color)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                  <OrderRating 
                    orderId={order.id} 
                    initialFeedback={order.feedback} 
                    onFeedbackSubmitted={(fb) => setOrder({...order, feedback: fb})} 
                  />
                </div>
              ) : (
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
                  Available after order is collected.
                </p>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

function formatTimelineStageName(stage) {
  if (stage === 'PLACED') return 'Order placed';
  if (stage === 'ACCEPTED') return 'Accepted';
  if (stage === 'PREPARING') return 'Preparing';
  if (stage === 'READY') return 'Ready';
  if (stage === 'COLLECTED') return 'Collected';
  return stage.charAt(0).toUpperCase() + stage.slice(1).toLowerCase();
}

function TimelineNode({ label, time, isCompleted, isCurrent, isError, isLast }) {
  let symbol = '○';
  let color = 'var(--text-secondary)';
  
  if (isCompleted) {
    symbol = '✓';
    color = 'var(--text-primary)';
  } else if (isCurrent) {
    symbol = isError ? '✕' : '●';
    color = isError ? 'var(--error-color)' : 'var(--primary-color)';
  }

  return (
    <div style={{ display: 'flex', gap: '16px', marginBottom: isLast ? '0' : '32px', position: 'relative', zIndex: 2, backgroundColor: 'transparent' }}>
      <div style={{ 
        width: '16px', 
        fontSize: '16px',
        color: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-primary)'
      }}>
        {symbol}
      </div>
      <div>
        <div style={{ 
          fontWeight: isCurrent ? '600' : '400', 
          color: isError ? 'var(--error-color)' : (isCompleted || isCurrent ? 'var(--text-primary)' : 'var(--text-secondary)'), 
          fontSize: '15px' 
        }}>
          {label}
        </div>
        {(time) && (
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </div>
        )}
      </div>
    </div>
  );
}
