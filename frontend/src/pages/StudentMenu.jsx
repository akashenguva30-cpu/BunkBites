import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
import CampusPay from '../components/CampusPay';
import { resolveImageUrl } from '../utils/imageUtils';
import StudentNavbar from '../components/StudentNavbar';
import { getNextSlogan, getNextSubSlogan } from '../utils/sloganEngine';

export default function StudentMenu() {
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [popularIds, setPopularIds] = useState([]);
  const [profileName, setProfileName] = useState('');
  
  const navigate = useNavigate();

  const [showCart, setShowCart] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activeQueue, setActiveQueue] = useState(null);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [slogan, setSlogan] = useState('');
  const [subSlogan, setSubSlogan] = useState('');

  useEffect(() => {
    fetchProfile();
    fetchCategories();
    fetchActiveOrder();
    setSlogan(getNextSlogan());
    setSubSlogan(getNextSubSlogan());
  }, []);

  useEffect(() => {
    fetchMenuItems();
    fetchFavorites();
    fetchPopularIds();
  }, [selectedCategory, search]);

  useEffect(() => {
    let interval = null;
    if (activeOrderId && activeQueue && !activeQueue.isReady) {
      interval = setInterval(() => fetchQueueInfo(activeOrderId), 10000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeOrderId, activeQueue?.isReady]);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/profile');
      setProfileName(res.data.name || res.data.username);
    } catch (err) {
      console.error(err);
    }
  }

  const fetchActiveOrder = async () => {
    try {
      const res = await api.get('/orders');
      if (res.data && res.data.length > 0) {
        const latest = res.data[0];
        if (['PLACED', 'ACCEPTED', 'PREPARING', 'READY'].includes(latest.status)) {
          setActiveOrderId(latest.id);
          fetchQueueInfo(latest.id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchQueueInfo = async (id) => {
    try {
      const res = await api.get(`/orders/${id}/queue`);
      setActiveQueue(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFavorites = async () => {
    try {
      const res = await api.get('/favorites');
      setFavorites(res.data.map(f => f.menuItem.id));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPopularIds = async () => {
    try {
      const res = await api.get('/menu/popular-ids');
      setPopularIds(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleFavorite = async (itemId) => {
    try {
      if (favorites.includes(itemId)) {
        await api.delete(`/favorites/${itemId}`);
        setFavorites(favorites.filter(id => id !== itemId));
      } else {
        await api.post(`/favorites/${itemId}`);
        setFavorites([...favorites, itemId]);
      }
    } catch (err) {
      console.error("Failed to toggle favorite", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (err) {
      if (err.response?.status === 401) navigate('/');
    }
  };

  const fetchMenuItems = async () => {
    try {
      let url = '/menu/available?';
      if (selectedCategory) url += `categoryId=${selectedCategory}&`;
      if (search) url += `search=${search}`;
      
      const res = await api.get(url);
      setMenuItems(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItem.id === item.id);
      if (existing) {
        return prev.map(c => c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prev => prev.filter(c => c.menuItem.id !== itemId));
  };

  const updateQuantity = (itemId, delta) => {
    setCart(prev => prev.map(c => {
      if (c.menuItem.id === itemId) {
        const newQ = c.quantity + delta;
        return { ...c, quantity: newQ > 0 ? newQ : 1 };
      }
      return c;
    }));
  };

  const cartTotal = cart.reduce((acc, curr) => acc + (curr.menuItem.price * curr.quantity), 0);
  const cartItemCount = cart.reduce((acc, curr) => acc + curr.quantity, 0);

  const initiateCheckout = () => {
    if (cart.length === 0) return alert("Cart is empty");
    setShowCart(false);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setCart([]);
    setShowPaymentModal(false);
    navigate('/orders');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const renderFoodCard = (item) => {
    const isFavorited = favorites.includes(item.id);
    const cartItem = cart.find(c => c.menuItem.id === item.id);
    const inCartQuantity = cartItem ? cartItem.quantity : 0;
    
    return (
      <div 
        key={item.id} 
        style={{ 
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid #e0e0e0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          position: 'relative',
          transition: 'transform 0.2s, box-shadow 0.2s',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => { 
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.08)';
        }}
        onMouseLeave={(e) => { 
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
        }}
      >
        <div style={{ position: 'relative', width: '100%', paddingTop: '75%', backgroundColor: '#f5f5f5', overflow: 'hidden' }}>
          {item.imageUrl ? (
            <img 
              src={resolveImageUrl(item.imageUrl)} 
              alt={item.name} 
              onError={(e) => { e.target.style.display = 'none'; }}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }} 
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            />
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '14px' }}>No Image</div>
          )}
          
          <button 
            onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}
            style={{ 
              position: 'absolute', 
              top: '12px', 
              right: '12px', 
              background: 'white', 
              borderRadius: '50%', 
              border: 'none', 
              fontSize: '18px', 
              cursor: 'pointer', 
              color: isFavorited ? '#e74c3c' : '#ccc', 
              width: '36px', 
              height: '36px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
              zIndex: 2,
              transition: 'transform 0.1s'
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {isFavorited ? '♥' : '♡'}
          </button>
          
          {!item.available && (
            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
              <span style={{ backgroundColor: '#222', color: 'white', padding: '6px 12px', fontWeight: '600', fontSize: '12px', letterSpacing: '0.5px', borderRadius: '4px' }}>SOLD OUT</span>
            </div>
          )}
        </div>
        
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#222', lineHeight: '1.2' }}>{item.name}</h3>
            <span style={{ fontWeight: '700', fontSize: '16px', color: '#222' }}>₹{item.price}</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '13px', color: '#666' }}>
            {item.averageRating && item.ratingCount > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', color: '#444', fontWeight: '500' }}>
                <span style={{ color: '#e74c3c', marginRight: '4px' }}>★</span> {item.averageRating.toFixed(1)}
              </span>
            )}
            {item.averageRating && item.ratingCount > 0 && <span style={{ opacity: 0.5 }}>•</span>}
            <span>{item.preparationTime} mins</span>
          </div>

          <div style={{ marginTop: 'auto' }}>
            {inCartQuantity > 0 ? (
               <div style={{ 
                 display: 'flex', 
                 alignItems: 'center', 
                 justifyContent: 'space-between',
                 width: '100%', 
                 padding: '8px 12px', 
                 backgroundColor: '#fff7f5', 
                 border: '1px solid #e74c3c',
                 borderRadius: '6px',
                 color: '#e74c3c'
               }}>
                 <button 
                   onClick={(e) => { e.stopPropagation(); if (inCartQuantity === 1) removeFromCart(item.id); else updateQuantity(item.id, -1); }}
                   style={{ background: 'none', border: 'none', color: '#e74c3c', fontSize: '20px', cursor: 'pointer', padding: '0 8px' }}
                 >-</button>
                 <span style={{ fontWeight: '600', fontSize: '15px' }}>{inCartQuantity}</span>
                 <button 
                   onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, 1); }}
                   style={{ background: 'none', border: 'none', color: '#e74c3c', fontSize: '20px', cursor: 'pointer', padding: '0 8px' }}
                 >+</button>
               </div>
            ) : (
              <button 
                onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                disabled={!item.available}
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  backgroundColor: item.available ? '#ffffff' : '#f5f5f5', 
                  color: item.available ? '#e74c3c' : '#aaa', 
                  border: `1px solid ${item.available ? '#e74c3c' : '#eee'}`,
                  borderRadius: '6px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: item.available ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { if(item.available) { e.currentTarget.style.backgroundColor = '#e74c3c'; e.currentTarget.style.color = '#ffffff'; } }}
                onMouseLeave={(e) => { if(item.available) { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.color = '#e74c3c'; } }}
              >
                ADD TO CART
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const isDiscoveryMode = !search && !selectedCategory;

  const quickBites = menuItems.filter(i => i.preparationTime <= 10);
  const under100 = menuItems.filter(i => i.price < 100);
  const userFavorites = menuItems.filter(i => favorites.includes(i.id));
  const popularItems = popularIds.map(id => menuItems.find(i => i.id === id)).filter(Boolean);

  const showQuickBites = quickBites.length > 0;
  const showUnder100 = under100.length > 0;
  const showFavorites = userFavorites.length > 0;
  const showPopular = popularItems.length > 0;

  const SectionHeader = ({ title }) => (
    <div style={{ marginBottom: '20px' }}>
      <h2 style={{ fontSize: '22px', fontWeight: '700', margin: 0, color: '#222' }}>{title}</h2>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#fdfbfb', paddingBottom: cart.length > 0 ? '100px' : '0' }}>
      <StudentNavbar />
      
      <div style={{ flex: 1, maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '0 24px 48px' }}>
        
        {/* Active Order Banner */}
        {activeQueue && (
          <div 
            onClick={() => navigate(`/orders/${activeOrderId}`)}
            style={{ 
              marginTop: '32px',
              padding: '16px 24px', 
              cursor: 'pointer',
              backgroundColor: activeQueue.isReady ? '#4caf50' : '#222',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div>
              <span style={{ fontSize: '13px', fontWeight: '600', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Order #{activeQueue.token}
              </span>
              <h3 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: '700' }}>
                {activeQueue.isReady ? 'Ready for pickup!' : 'Preparing your food...'}
              </h3>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '14px', fontWeight: '500', opacity: 0.9 }}>
                {activeQueue.isReady ? 'Collect at counter' : `${activeQueue.ordersAhead} orders ahead`}
              </span>
              <div style={{ fontSize: '20px', marginTop: '4px', fontWeight: '700' }}>→</div>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <div style={{ margin: '40px 0 32px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '40px' }}>
          
          {/* Left Column */}
          <div style={{ flex: '1 1 50%', minWidth: '320px', maxWidth: '600px' }}>
            {/* Playful Eyebrow */}
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: '8px' }}>
              <span style={{ 
                fontSize: '13px', 
                fontWeight: '800', 
                color: '#e74c3c', 
                letterSpacing: '1px',
                textTransform: 'uppercase'
              }}>
                Good Evening
              </span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ position: 'absolute', top: '-10px', right: '-24px', opacity: 0.8 }}>
                <path d="M12 4L12 10M12 14L12 20M4 12L10 12M14 12L20 12M6 6L10 10M14 14L18 18M6 18L10 14M14 10L18 6" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            
            <h1 style={{ fontSize: '42px', fontWeight: '800', margin: '0 0 12px 0', color: '#222', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
              Good evening{profileName ? ', ' : ''}<span style={{ color: '#e74c3c' }}>{profileName ? profileName : ''}</span>!
            </h1>
            <p style={{ fontSize: '18px', color: '#666', margin: '0 0 24px 0', fontWeight: '500' }}>
              Find the best campus food, grab a token, and skip the line.
            </p>

            <div style={{ position: 'relative', width: '100%' }}>
              <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#999', display: 'flex', alignItems: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </span>
              <input 
                type="text" 
                placeholder="Search for meals, snacks, or drinks..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                style={{ 
                  width: '100%', 
                  padding: '16px 16px 16px 48px', 
                  fontSize: '16px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '12px',
                  backgroundColor: 'white',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                }}
                onFocus={(e) => { e.target.style.borderColor = '#e74c3c'; e.target.style.boxShadow = '0 4px 12px rgba(231, 76, 60, 0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#e0e0e0'; e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)'; }}
              />
            </div>
          </div>
          
          {/* Dynamic Slogan Banner */}
          {slogan && (
            <div style={{
              flex: '1 1 40%',
              minWidth: '320px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              position: 'relative',
              padding: '20px 20px 40px 20px'
            }}>
              {/* Giant faint quotation mark */}
              <div style={{
                position: 'absolute',
                top: '-30px',
                left: '-10px',
                fontSize: '180px',
                fontWeight: '900',
                color: '#fadcd3', // Peach color for quote
                fontFamily: 'serif, "Georgia", "Times New Roman"',
                lineHeight: 1,
                zIndex: 0,
                pointerEvents: 'none',
                opacity: 0.7
              }}>
                "
              </div>
              
              <div className="slogan-animate" style={{ position: 'relative', zIndex: 1 }}>
                
                {/* BUNKBites SAYS Eyebrow */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ 
                    fontSize: '14px', 
                    fontWeight: '800', 
                    letterSpacing: '1.2px', 
                    color: '#e74c3c', 
                    textTransform: 'uppercase',
                  }}>
                    BUNKBites <span style={{ color: '#888' }}>SAYS</span>
                  </span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginLeft: '8px', transform: 'rotate(15deg)' }}>
                    <path d="M2 12C8 4 16 4 22 12" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round" />
                    <path d="M20 8L22 12L18 14" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                
                {/* Main Slogan */}
                <h2 style={{
                  margin: 0,
                  fontSize: 'clamp(36px, 4vw, 48px)',
                  fontWeight: '900',
                  color: '#2a2a2a',
                  lineHeight: '1.05',
                  letterSpacing: '-1px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  {(() => {
                    const match = slogan.match(/^([^.:!?]+[:.!?])\s*(.*)$/);
                    if (match && match[1].length < 20) {
                      return <><span style={{ color: '#e74c3c' }}>{match[1]}</span> {match[2]}</>;
                    }
                    const firstSpace = slogan.indexOf(' ');
                    if (firstSpace !== -1 && firstSpace < 12) {
                      return <><span style={{ color: '#e74c3c' }}>{slogan.substring(0, firstSpace)}</span> {slogan.substring(firstSpace + 1)}</>;
                    }
                    return slogan;
                  })()}
                </h2>
                
                {/* Hand-drawn underline */}
                <svg width="120" height="12" viewBox="0 0 120 12" fill="none" style={{ marginTop: '24px', marginBottom: '12px' }}>
                   <path d="M2 10C30 3 80 1 118 8" stroke="#e74c3c" strokeWidth="4" strokeLinecap="round" />
                </svg>

                {/* Sub slogan */}
                <p style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: '500',
                  color: '#888',
                  fontStyle: 'italic',
                  fontFamily: 'serif, "Georgia"',
                }}>
                  {subSlogan}
                </p>
                
                {/* SVG doodles scattered around */}
                <svg width="60" height="70" viewBox="0 0 60 70" fill="none" style={{ position: 'absolute', right: '5%', bottom: '-30px', opacity: 0.9, transform: 'rotate(15deg)' }}>
                  <rect x="20" y="30" width="22" height="32" rx="2" stroke="#222" strokeWidth="2.5" fill="white" />
                  <path d="M18 30H44" stroke="#222" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M31 12L31 30" stroke="#e74c3c" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="26" cy="46" r="2" fill="#222" />
                  <circle cx="36" cy="46" r="2" fill="#222" />
                  <path d="M28 52 Q31 56 34 52" stroke="#222" strokeWidth="2" fill="none" strokeLinecap="round" />
                </svg>
                
                <svg width="30" height="30" viewBox="0 0 30 30" fill="none" style={{ position: 'absolute', right: '35%', top: '-10px', opacity: 0.6 }}>
                  <path d="M15 5L15 25M5 15L25 15M8 8L22 22M8 22L22 8" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round" />
                </svg>
                
              </div>
              <style>
                {`
                  .slogan-animate {
                    animation: sloganFadeInUp 0.4s ease-out;
                  }
                  @media (prefers-reduced-motion: reduce) {
                    .slogan-animate {
                      animation: none !important;
                    }
                  }
                  @keyframes sloganFadeInUp {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                  }
                `}
              </style>
            </div>
          )}
        </div>

        {/* Categories */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          overflowX: 'auto', 
          marginBottom: '40px',
          paddingBottom: '4px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          <button 
            onClick={() => setSelectedCategory(null)}
            style={{
              padding: '8px 20px',
              backgroundColor: selectedCategory === null ? '#e74c3c' : 'white',
              color: selectedCategory === null ? 'white' : '#444',
              border: `1px solid ${selectedCategory === null ? '#e74c3c' : '#e0e0e0'}`,
              borderRadius: '24px',
              whiteSpace: 'nowrap',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            All Items
          </button>
          {categories.map(c => (
            <button 
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              style={{
                padding: '8px 20px',
                backgroundColor: selectedCategory === c.id ? '#e74c3c' : 'white',
                color: selectedCategory === c.id ? 'white' : '#444',
                border: `1px solid ${selectedCategory === c.id ? '#e74c3c' : '#e0e0e0'}`,
                borderRadius: '24px',
                whiteSpace: 'nowrap',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Dynamic Discovery Sections or Filtered View */}
        {isDiscoveryMode ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
            
            {showFavorites && (
              <section>
                <SectionHeader title="Your Favourites" />
                <div style={{ display: 'flex', overflowX: 'auto', gap: '20px', paddingBottom: '16px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {userFavorites.map(item => (
                    <div key={item.id} style={{ minWidth: '260px', maxWidth: '280px', flexShrink: 0 }}>
                      {renderFoodCard(item)}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {showPopular && (
              <section>
                <SectionHeader title="Popular on Campus" />
                <div style={{ display: 'flex', overflowX: 'auto', gap: '20px', paddingBottom: '16px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {popularItems.map(item => (
                    <div key={item.id} style={{ minWidth: '260px', maxWidth: '280px', flexShrink: 0 }}>
                      {renderFoodCard(item)}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {showQuickBites && (
              <section>
                <SectionHeader title="Quick Bites (Under 10 mins)" />
                <div style={{ display: 'flex', overflowX: 'auto', gap: '20px', paddingBottom: '16px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {quickBites.map(item => (
                    <div key={item.id} style={{ minWidth: '260px', maxWidth: '280px', flexShrink: 0 }}>
                      {renderFoodCard(item)}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {showUnder100 && (
              <section>
                <SectionHeader title="Budget Friendly (Under ₹100)" />
                <div style={{ display: 'flex', overflowX: 'auto', gap: '20px', paddingBottom: '16px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {under100.map(item => (
                    <div key={item.id} style={{ minWidth: '260px', maxWidth: '280px', flexShrink: 0 }}>
                      {renderFoodCard(item)}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section>
              <SectionHeader title="All Items" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' }}>
                {menuItems.map(item => renderFoodCard(item))}
              </div>
            </section>
          </div>
        ) : (
          <div>
            <SectionHeader title={search ? `Search results for "${search}"` : categories.find(c => c.id === selectedCategory)?.name} />
            {menuItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#666' }}>
                <p style={{ fontSize: '18px', fontWeight: '500' }}>No items found matching your criteria.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' }}>
                {menuItems.map(item => renderFoodCard(item))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Bottom Cart CTA */}
      {cart.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'white',
          border: '1px solid rgba(0,0,0,0.06)',
          borderRadius: '16px',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          zIndex: 100,
          cursor: 'pointer',
          width: 'max-content',
          minWidth: '280px',
          maxWidth: '90%',
          justifyContent: 'space-between',
          transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s'
        }}
        onMouseEnter={(e) => { 
          e.currentTarget.style.transform = 'translateX(-50%) translateY(-2px)'; 
          e.currentTarget.style.boxShadow = '0 12px 36px rgba(0,0,0,0.12)'; 
        }}
        onMouseLeave={(e) => { 
          e.currentTarget.style.transform = 'translateX(-50%) translateY(0)'; 
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.08)'; 
        }}
        onClick={() => setShowCart(true)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginLeft: '4px' }}>
              {cart.slice(0, 3).map((c, i) => (
                <div key={c.menuItem.id} style={{ 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '12px', 
                  backgroundColor: '#f5f5f5',
                  border: '2px solid white',
                  overflow: 'hidden',
                  zIndex: 3 - i,
                  marginLeft: i > 0 ? '-14px' : '0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}>
                  {c.menuItem.imageUrl ? (
                    <img src={resolveImageUrl(c.menuItem.imageUrl)} alt={c.menuItem.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', backgroundColor: '#fff0ed' }}>🍽️</div>
                  )}
                </div>
              ))}
              {cart.length > 3 && (
                <div style={{
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '12px', 
                  backgroundColor: '#fff',
                  border: '2px solid white',
                  zIndex: 0,
                  marginLeft: '-14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#666',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}>
                  +{cart.length - 3}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#111' }}>
                {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}
              </p>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: '500', color: '#e74c3c' }}>
                ₹{cartTotal.toFixed(2)}
              </p>
            </div>
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px', 
            fontWeight: '600', 
            fontSize: '14px', 
            color: '#111',
            padding: '8px 12px',
            backgroundColor: '#f8f8f8',
            borderRadius: '10px'
          }}>
            View cart <span style={{ fontSize: '16px' }}>→</span>
          </div>
        </div>
      )}

      {/* Fullscreen Cart Modal */}
      {showCart && (
        <div style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'flex-end',
        }}>
          <div style={{
            width: '100%',
            maxWidth: '480px',
            backgroundColor: 'white',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-8px 0 24px rgba(0,0,0,0.1)',
            animation: 'slideIn 0.3s forwards'
          }}>
            <style>
              {`
                @keyframes slideIn {
                  from { transform: translateX(100%); }
                  to { transform: translateX(0); }
                }
              `}
            </style>
            <div style={{ 
              padding: '24px', 
              borderBottom: '1px solid #eee', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
            }}>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#222' }}>Your Cart</h2>
              <button 
                onClick={() => setShowCart(false)}
                style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#666', lineHeight: 1 }}
              >×</button>
            </div>

            <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#666' }}>
                  <p style={{ margin: 0, fontSize: '16px' }}>Your cart is empty.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {cart.map(c => (
                    <div key={c.menuItem.id} style={{ display: 'flex', gap: '16px' }}>
                      <div style={{ width: '72px', height: '72px', backgroundColor: '#f5f5f5', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                        {c.menuItem.imageUrl ? (
                          <img src={resolveImageUrl(c.menuItem.imageUrl)} alt={c.menuItem.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🍽️</div>
                        )}
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#222' }}>{c.menuItem.name}</h4>
                          <span style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#222' }}>₹{c.menuItem.price * c.quantity}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
                            <button 
                              onClick={() => {
                                if (c.quantity === 1) {
                                  removeFromCart(c.menuItem.id);
                                } else {
                                  updateQuantity(c.menuItem.id, -1);
                                }
                              }}
                              style={{ background: 'none', border: 'none', padding: '4px 12px', cursor: 'pointer', color: '#444', fontSize: '18px', fontWeight: '600' }}
                            >-</button>
                            <span style={{ fontSize: '14px', fontWeight: '600', minWidth: '24px', textAlign: 'center' }}>{c.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(c.menuItem.id, 1)}
                              style={{ background: 'none', border: 'none', padding: '4px 12px', cursor: 'pointer', color: '#e74c3c', fontSize: '18px', fontWeight: '600' }}
                            >+</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {cart.length > 0 && (
              <div style={{ padding: '24px', borderTop: '1px solid #eee', backgroundColor: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <span style={{ fontSize: '16px', color: '#666', fontWeight: '500' }}>Subtotal</span>
                  <span style={{ fontSize: '20px', fontWeight: '700', color: '#222' }}>₹{cartTotal.toFixed(2)}</span>
                </div>
                <button 
                  onClick={initiateCheckout}
                  style={{ 
                    width: '100%', 
                    padding: '16px', 
                    fontSize: '16px', 
                    backgroundColor: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c0392b'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e74c3c'}
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showPaymentModal && (
        <CampusPay 
          cart={cart} 
          cartTotal={cartTotal} 
          onClose={() => setShowPaymentModal(false)} 
          onSuccess={handlePaymentSuccess} 
        />
      )}
    </div>
  );
}
