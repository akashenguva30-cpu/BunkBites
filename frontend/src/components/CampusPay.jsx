import React, { useState } from 'react';
import api from '../api/axiosConfig';

export default function CampusPay({ cart, cartTotal, onClose, onSuccess }) {
  const [step, setStep] = useState('METHOD'); // METHOD, FORM, PROCESSING, SUCCESS, FAILURE
  const [method, setMethod] = useState('');
  const [paymentDetails, setPaymentDetails] = useState('');
  const [orderResult, setOrderResult] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);

  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/auth/me');
        setWalletBalance(res.data.walletBalance);
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }
    };
    fetchProfile();
  }, []);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleProcessPayment = async () => {
    if (method === 'RAZORPAY') {
      return handleRazorpayPayment();
    }
    
    setStep('PROCESSING');
    try {
      const items = cart.map(c => ({ menuItemId: c.menuItem.id, quantity: c.quantity }));
      const payload = { items, paymentMethod: method, paymentDetails };
      const res = await api.post('/orders', payload);
      setOrderResult(res.data);
      if (method === 'WALLET') setWalletBalance(prev => prev - cartTotal);
      setStep('SUCCESS');
    } catch (err) {
      const resp = err.response?.data;
      if (resp && resp.status === 'FAILED') {
        setOrderResult(resp);
      } else {
        setOrderResult({ message: err.response?.data?.message || err.message });
      }
      setStep('FAILURE');
    }
  };

  const handleRazorpayPayment = async () => {
    setStep('PROCESSING');
    try {
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        setOrderResult({ message: 'Failed to load Razorpay SDK. Are you online?' });
        setStep('FAILURE');
        return;
      }

      const items = cart.map(c => ({ menuItemId: c.menuItem.id, quantity: c.quantity }));
      const payload = { items, paymentMethod: method, paymentDetails: '' };
      
      const res = await api.post('/orders/razorpay/create-order', payload);
      const { razorpayOrderId, amount, currency, keyId } = res.data;

      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: "Smart Campus Canteen",
        description: "Canteen Order",
        order_id: razorpayOrderId,
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true
        },
        handler: async function (response) {
          setStep('VERIFICATION_PENDING');
          try {
            const verifyPayload = {
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature
            };
            const verifyRes = await api.post('/orders/razorpay/verify', verifyPayload);
            setOrderResult(verifyRes.data);
            setStep('SUCCESS');
          } catch (err) {
            setOrderResult({ message: err.response?.data?.message || 'Payment verification failed' });
            setStep('FAILURE');
          }
        },
        modal: {
          ondismiss: function() {
            setOrderResult({ message: 'Payment cancelled by user' });
            setStep('FAILURE');
          }
        },
        theme: {
          color: "var(--primary-color)"
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
          setOrderResult({ message: response.error.description || 'Payment failed' });
          setStep('FAILURE');
      });
      rzp.open();
    } catch (err) {
      setOrderResult({ message: err.response?.data?.message || err.message });
      setStep('FAILURE');
    }
  };

  const methodButtonStyle = (currentMethod) => ({
    padding: '16px',
    borderRadius: 'var(--radius-md)',
    border: `1px solid ${method === currentMethod ? 'var(--primary-color)' : 'var(--border-color)'}`,
    backgroundColor: 'var(--surface-color)',
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: '15px',
    fontWeight: '500',
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    transition: 'all 0.2s',
    outline: 'none'
  });

  const renderMethodSelection = () => (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: 'var(--text-primary)' }}>Order summary</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
          {cart.map(c => (
            <div key={c.menuItem.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{c.menuItem.name} × {c.quantity}</span>
              <span style={{ fontWeight: '500' }}>₹{(c.menuItem.price * c.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <span style={{ fontSize: '16px', fontWeight: '600' }}>Total</span>
          <span style={{ fontSize: '18px', fontWeight: '700' }}>₹{cartTotal.toFixed(2)}</span>
        </div>
      </div>

      <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: 'var(--text-primary)' }}>Payment method</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button onClick={() => setMethod('WALLET')} style={methodButtonStyle('WALLET')}>
          <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: method === 'WALLET' ? '6px solid var(--primary-color)' : '2px solid var(--border-color)', boxSizing: 'border-box' }}></div>
          Campus Wallet
        </button>
        <button onClick={() => setMethod('RAZORPAY')} style={methodButtonStyle('RAZORPAY')}>
          <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: method === 'RAZORPAY' ? '6px solid var(--primary-color)' : '2px solid var(--border-color)', boxSizing: 'border-box' }}></div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span>Razorpay</span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Pay securely using Razorpay</span>
          </div>
        </button>
      </div>

      <button 
        onClick={() => setStep('FORM')} 
        disabled={!method}
        className="primary-btn" 
        style={{ width: '100%', marginTop: '32px', padding: '16px', fontSize: '16px', borderRadius: 'var(--radius-md)', opacity: !method ? 0.5 : 1 }}
      >
        Continue to payment
      </button>
    </div>
  );

  const renderForm = () => {
    return (
      <div>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: 'var(--text-primary)' }}>CAMPUSPAY</h3>
        {method === 'WALLET' && (
          <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '16px', border: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: '500' }}>Campus Wallet</p>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>Balance: ₹{walletBalance.toFixed(2)}</p>
          </div>
        )}
        {method === 'RAZORPAY' && (
          <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '16px', border: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: '500' }}>Razorpay Secure Checkout</p>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>You will be redirected to Razorpay to complete your payment.</p>
          </div>
        )}
        
        <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
          <button onClick={() => setStep('METHOD')} className="secondary-btn" style={{ flex: 1, padding: '14px', fontSize: '16px' }}>Back</button>
          <button 
            onClick={handleProcessPayment} 
            disabled={method === 'WALLET' && walletBalance < cartTotal}
            className="primary-btn"
            style={{ flex: 2, padding: '14px', fontSize: '16px', fontWeight: '600' }}
          >
            Pay ₹{cartTotal.toFixed(2)}
          </button>
        </div>
      </div>
    );
  };

  const renderProcessing = () => (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>Payment processing...</h3>
    </div>
  );

  const renderSuccess = () => (
    <div style={{ textAlign: 'center', padding: '16px 0' }}>
      <div style={{ fontSize: '32px', marginBottom: '16px', color: 'var(--text-primary)' }}>✓</div>
      <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', letterSpacing: '0.5px' }}>ORDER CONFIRMED</h3>
      <p style={{ margin: '0 0 32px 0', color: 'var(--text-secondary)', fontSize: '15px' }}>Your order has been placed successfully.</p>
      
      <div style={{ marginBottom: '32px' }}>
        <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', letterSpacing: '1px' }}>TOKEN</p>
        <h2 style={{ margin: 0, fontSize: '40px', fontWeight: '700', color: 'var(--text-primary)' }}>{orderResult?.token?.tokenNumber}</h2>
      </div>

      <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>You can track your order from Orders.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button 
          onClick={() => onSuccess()} 
          className="primary-btn" 
          style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: '600', borderRadius: 'var(--radius-md)' }}
        >
          View Order
        </button>
        <button 
          onClick={onClose} 
          className="secondary-btn" 
          style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: '600', borderRadius: 'var(--radius-md)' }}
        >
          Back to Menu
        </button>
      </div>
    </div>
  );

  const renderFailure = () => {
    const isInsufficientBalance = method === 'WALLET' && walletBalance < cartTotal;
    
    return (
      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)', fontSize: '18px', fontWeight: '600' }}>
          {isInsufficientBalance ? 'Insufficient wallet balance' : 'Payment failed'}
        </h3>
        
        {isInsufficientBalance && (
          <div style={{ marginBottom: '24px' }}>
            <p style={{ margin: '0 0 4px 0', fontSize: '15px', color: 'var(--text-secondary)' }}>Available balance: ₹{walletBalance.toFixed(2)}</p>
            <p style={{ margin: 0, fontSize: '15px', color: 'var(--text-secondary)' }}>Required: ₹{cartTotal.toFixed(2)}</p>
          </div>
        )}

        {orderResult?.message && !isInsufficientBalance && (
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>{orderResult.message}</p>
        )}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button onClick={() => setStep('METHOD')} className="primary-btn" style={{ padding: '14px', fontSize: '15px', borderRadius: 'var(--radius-md)' }}>
            {isInsufficientBalance ? 'Choose another payment method' : 'Try again'}
          </button>
          <button onClick={onClose} className="secondary-btn" style={{ padding: '14px', fontSize: '15px', border: 'none' }}>Cancel</button>
        </div>
      </div>
    );
  };

  const renderVerificationPending = () => (
    <div style={{ textAlign: 'center', padding: '16px 0' }}>
      <div style={{ fontSize: '32px', marginBottom: '16px', color: 'var(--text-primary)' }}>⏳</div>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>Payment Received</h3>
      <p style={{ margin: '0 0 24px 0', color: 'var(--text-secondary)', fontSize: '15px' }}>Verification pending. Please wait for Phase 2C to complete verification.</p>
      <div style={{ textAlign: 'left', background: 'var(--surface-color)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
        <p style={{ margin: '0 0 8px 0', fontSize: '13px', wordBreak: 'break-all' }}><strong>Payment ID:</strong> {orderResult?.razorpayPaymentId}</p>
        <p style={{ margin: '0 0 8px 0', fontSize: '13px', wordBreak: 'break-all' }}><strong>Order ID:</strong> {orderResult?.razorpayOrderId}</p>
      </div>
      <button onClick={onClose} className="secondary-btn" style={{ width: '100%', padding: '14px', fontSize: '15px' }}>Close</button>
    </div>
  );

  return (
    <div style={modalOverlayStyle}>
      <div style={modalStyle}>
        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--text-primary)', fontWeight: '600' }}>{step === 'METHOD' ? 'CHECKOUT' : ''}</h2>
          {step !== 'PROCESSING' && step !== 'SUCCESS' && (
            <button 
              onClick={onClose} 
              style={{ border: 'none', background: 'none', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              ×
            </button>
          )}
        </div>
        
        {step === 'METHOD' && renderMethodSelection()}
        {step === 'FORM' && renderForm()}
        {step === 'PROCESSING' && renderProcessing()}
        {step === 'SUCCESS' && renderSuccess()}
        {step === 'FAILURE' && renderFailure()}
        {step === 'VERIFICATION_PENDING' && renderVerificationPending()}
      </div>
    </div>
  );
}

const inputStyle = { 
  width: '100%', 
  padding: '14px', 
  fontSize: '15px',
  borderRadius: 'var(--radius-sm)', 
  border: '1px solid var(--border-color)',
  outline: 'none',
  boxSizing: 'border-box'
};

const modalOverlayStyle = {
  position: 'fixed', 
  top: 0, 
  left: 0, 
  width: '100vw', 
  height: '100vh', 
  backgroundColor: 'rgba(0,0,0,0.4)', 
  backdropFilter: 'blur(4px)',
  display: 'flex', 
  justifyContent: 'center', 
  alignItems: 'center', 
  zIndex: 1000
};

const modalStyle = {
  backgroundColor: 'var(--surface-color)', 
  padding: '32px', 
  borderRadius: 'var(--radius-lg)', 
  width: '90%', 
  maxWidth: '440px', 
  boxShadow: 'var(--shadow-md)',
  boxSizing: 'border-box'
};
