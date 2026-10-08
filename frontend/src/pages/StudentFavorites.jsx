import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
import { resolveImageUrl } from '../utils/imageUtils';
import StudentNavbar from '../components/StudentNavbar';

export default function StudentFavorites() {
  const [favorites, setFavorites] = useState([]);
  const [cart, setCart] = useState([]);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchFavorites();
    const storedCart = JSON.parse(sessionStorage.getItem('cart') || '[]');
    setCart(storedCart);
  }, []);

  const fetchFavorites = async () => {
    try {
      const res = await api.get('/favorites');
      setFavorites(res.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) navigate('/');
    }
  };

  const toggleFavorite = async (menuItem) => {
    try {
      // Since all items here are currently favorited, toggling them removes them
      await api.delete(`/favorites/${menuItem.id}`);
      setFavorites(favorites.filter(f => f.menuItem.id !== menuItem.id));
    } catch (err) {
      console.error("Failed to remove favorite", err);
    }
  };

  const addToCart = (menuItem) => {
    if (!menuItem.available) return;
    const newCart = [...cart];
    const existing = newCart.find(c => c.menuItem.id === menuItem.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      newCart.push({ menuItem, quantity: 1 });
    }
    setCart(newCart);
    sessionStorage.setItem('cart', JSON.stringify(newCart));
  };

  const getInCartQuantity = (itemId) => {
    const item = cart.find(c => c.menuItem.id === itemId);
    return item ? item.quantity : 0;
  };

  const updateQuantity = (itemId, delta) => {
    let newCart = [...cart];
    const index = newCart.findIndex(c => c.menuItem.id === itemId);
    if (index !== -1) {
      newCart[index].quantity += delta;
      if (newCart[index].quantity <= 0) {
        newCart.splice(index, 1);
      }
      setCart(newCart);
      sessionStorage.setItem('cart', JSON.stringify(newCart));
    }
  };

  const removeFromCart = (itemId) => {
    const newCart = cart.filter(c => c.menuItem.id !== itemId);
    setCart(newCart);
    sessionStorage.setItem('cart', JSON.stringify(newCart));
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#fdfbfb' }}>
      <StudentNavbar />

      <div style={{ flex: 1, maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '40px 24px 48px' }}>
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '700', margin: '0 0 8px 0', color: '#222' }}>Your Favorites</h1>
          <p style={{ fontSize: '16px', color: '#666', margin: '0' }}>Your go-to campus favorites, all in one place.</p>
        </div>
        
        {favorites.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e0e0e0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', color: '#ccc' }}>🍽️</div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600', color: '#222' }}>No favorites yet</h3>
            <p style={{ margin: '0 0 24px 0', color: '#666', fontSize: '16px' }}>Tap the heart on anything you want to find quickly later.</p>
            <button 
              onClick={() => navigate('/student')} 
              style={{ 
                padding: '12px 24px', 
                backgroundColor: '#e74c3c', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px',
                fontSize: '16px', 
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c0392b'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e74c3c'}
            >
              Browse Menu
            </button>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', 
            gap: '24px' 
          }}>
            {favorites.map(fav => {
              const item = fav.menuItem;
              const inCartQuantity = getInCartQuantity(item.id);

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
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(item); }}
                      style={{ 
                        position: 'absolute', 
                        top: '12px', 
                        right: '12px', 
                        background: 'white', 
                        borderRadius: '50%', 
                        border: 'none', 
                        fontSize: '18px', 
                        cursor: 'pointer', 
                        color: '#e74c3c', 
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
                      ♥
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
            })}
          </div>
        )}
      </div>
    </div>
  );
}
