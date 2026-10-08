import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
import { resolveImageUrl } from '../utils/imageUtils';
import AdminSidebar from '../components/AdminSidebar';

export default function AdminMenu() {
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const navigate = useNavigate();

  // Modals state
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Category form
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  
  // Menu form
  const [itemName, setItemName] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemPrep, setItemPrep] = useState('');
  const [itemCat, setItemCat] = useState('');
  const [itemAvailable, setItemAvailable] = useState(true);
  const [itemImage, setItemImage] = useState(null);
  const [itemImagePreview, setItemImagePreview] = useState(null);
  
  // Edit specific
  const [editImage, setEditImage] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [removeEditImage, setRemoveEditImage] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [catRes, itemRes] = await Promise.all([
        api.get('/categories'),
        api.get('/menu')
      ]);
      setCategories(catRes.data);
      setMenuItems(itemRes.data);
      if (catRes.data.length > 0) setItemCat(catRes.data[0].id);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) navigate('/');
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await api.post('/categories', { name: catName, description: catDesc });
      setCatName(''); setCatDesc('');
      fetchData();
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteCategory = async (id) => {
    await api.delete(`/categories/${id}`);
    fetchData();
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/menu/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data.imageUrl;
  };

  const openAddItem = () => {
    setItemName(''); setItemDesc(''); setItemPrice(''); setItemPrep(''); 
    setItemImage(null); setItemImagePreview(null); setItemAvailable(true);
    if (categories.length > 0) setItemCat(categories[0].id);
    setIsAddingItem(true);
  };

  const handleCreateMenuItem = async (e) => {
    e.preventDefault();
    try {
      let imageUrl = null;
      if (itemImage) {
        imageUrl = await uploadImage(itemImage);
      }
      
      await api.post('/menu', {
        categoryId: itemCat,
        name: itemName,
        description: itemDesc,
        price: parseFloat(itemPrice),
        preparationTime: parseInt(itemPrep),
        available: itemAvailable,
        imageUrl: imageUrl
      });
      setIsAddingItem(false);
      fetchData();
    } catch (err) {
      alert("Error creating item: " + (err.response?.data?.message || err.message));
    }
  };

  const startEdit = (item) => {
    setEditingItem({ ...item });
    setEditImage(null);
    setEditImagePreview(resolveImageUrl(item.imageUrl));
    setRemoveEditImage(false);
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditImage(null);
    setEditImagePreview(null);
    setRemoveEditImage(false);
  };

  const handleEditMenuItem = async (e) => {
    e.preventDefault();
    try {
      let finalImageUrl = editingItem.imageUrl;
      if (removeEditImage) {
        finalImageUrl = null;
      } else if (editImage) {
        finalImageUrl = await uploadImage(editImage);
      }
      
      await api.put(`/menu/${editingItem.id}`, {
        categoryId: editingItem.category.id,
        name: editingItem.name,
        description: editingItem.description,
        price: parseFloat(editingItem.price),
        preparationTime: parseInt(editingItem.preparationTime),
        available: editingItem.available,
        imageUrl: finalImageUrl
      });
      cancelEdit();
      fetchData();
    } catch (err) {
      alert("Error updating item: " + (err.response?.data?.message || err.message));
    }
  };

  const handleToggleAvailability = async (item) => {
    await api.put(`/menu/${item.id}`, {
      categoryId: item.category.id,
      name: item.name,
      description: item.description,
      price: item.price,
      preparationTime: item.preparationTime,
      available: !item.available,
      imageUrl: item.imageUrl
    });
    fetchData();
  };

  const handleDeleteItem = async (id) => {
    await api.delete(`/menu/${id}`);
    fetchData();
  };

  const filteredMenuItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'ALL' || item.category.id.toString() === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#fdfbfb' }}>
      <AdminSidebar />

      <div style={{ flex: 1, padding: '48px', overflowY: 'auto', boxSizing: 'border-box' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
          <div>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', color: '#111', fontWeight: '800', letterSpacing: '-0.5px' }}>MENU MANAGEMENT</h1>
            <p style={{ margin: 0, fontSize: '16px', color: '#666', fontWeight: '500' }}>Manage the food students can order.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setIsManagingCategories(true)} style={secondaryBtnStyle}>
              Manage Categories
            </button>
            <button onClick={openAddItem} style={primaryBtnStyle}>
              + Add Menu Item
            </button>
          </div>
        </div>

        {/* Search & Filter */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#888' }}>🔍</span>
            <input 
              type="text" 
              placeholder="Search menu..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...inputStyle, paddingLeft: '44px' }}
            />
          </div>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ ...inputStyle, width: '200px', cursor: 'pointer' }}>
            <option value="ALL">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* EXISTING MENU LIST */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '20px' }}>
          {filteredMenuItems.map(item => (
            <div key={item.id} style={{ display: 'flex', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #eaeaea', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.02)', gap: '16px' }}>
              
              {/* Image */}
              <div style={{ width: '80px', height: '80px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {item.imageUrl ? (
                  <img src={resolveImageUrl(item.imageUrl)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '24px' }}>🍽️</span>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '800', color: '#111' }}>{item.name}</h3>
                  <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#666', fontWeight: '500' }}>{item.category.name} · {item.preparationTime} min</p>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#111' }}>₹{item.price}</p>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                  <button 
                    onClick={() => handleToggleAvailability(item)}
                    style={{ 
                      background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '6px',
                      color: item.available ? '#388e3c' : '#888', fontWeight: '700', fontSize: '12px', letterSpacing: '0.5px', textTransform: 'uppercase'
                    }}
                  >
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.available ? '#388e3c' : '#ccc' }}></span>
                    {item.available ? 'Available' : 'Unavailable'}
                  </button>
                  
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => startEdit(item)} style={{ background: 'none', border: 'none', color: '#666', fontWeight: '600', fontSize: '13px', cursor: 'pointer', padding: 0 }}>Edit</button>
                    <button onClick={() => handleDeleteItem(item.id)} style={{ background: 'none', border: 'none', color: '#e74c3c', fontWeight: '600', fontSize: '13px', cursor: 'pointer', padding: 0 }}>Delete</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filteredMenuItems.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '64px', textAlign: 'center', color: '#888', fontStyle: 'italic', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #eaeaea' }}>
              No menu items found.
            </div>
          )}
        </div>

        {/* MODALS */}

        {/* ADD ITEM MODAL */}
        {isAddingItem && (
          <div style={modalOverlayStyle}>
            <div style={modalStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ margin: 0, fontSize: '20px', color: '#111', fontWeight: '800' }}>Add Menu Item</h3>
                <button onClick={() => setIsAddingItem(false)} style={closeBtnStyle}>×</button>
              </div>
              <form onSubmit={handleCreateMenuItem} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Category</label>
                  <select value={itemCat} onChange={e => setItemCat(e.target.value)} required style={inputStyle}>
                    <option value="" disabled>Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Item Name</label>
                  <input type="text" placeholder="e.g. Chicken Burger" value={itemName} onChange={e => setItemName(e.target.value)} required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Description</label>
                  <textarea placeholder="Optional description" value={itemDesc} onChange={e => setItemDesc(e.target.value)} style={{...inputStyle, resize: 'vertical', minHeight: '80px'}} />
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Price (₹)</label>
                    <input style={inputStyle} type="number" step="0.01" placeholder="0.00" value={itemPrice} onChange={e => setItemPrice(e.target.value)} required />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Prep Time (mins)</label>
                    <input style={inputStyle} type="number" placeholder="15" value={itemPrep} onChange={e => setItemPrep(e.target.value)} required />
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontWeight: '600', color: '#111', fontSize: '14px', marginTop: '8px' }}>
                  <input type="checkbox" checked={itemAvailable} onChange={e => setItemAvailable(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} /> 
                  Available for Ordering
                </label>
                <div style={{ border: '1px dashed #ccc', padding: '24px', borderRadius: '12px', backgroundColor: '#fafafa', marginTop: '8px' }}>
                  <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', fontSize: '13px', color: '#333' }}>Food Image</label>
                  {itemImagePreview && (
                    <div style={{ marginBottom: '16px' }}>
                      <img src={itemImagePreview} alt="Preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #eaeaea' }} />
                    </div>
                  )}
                  <input type="file" accept="image/jpeg, image/png, image/webp" onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setItemImage(e.target.files[0]);
                      setItemImagePreview(URL.createObjectURL(e.target.files[0]));
                    }
                  }} style={{ fontSize: '14px', color: '#666' }} />
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                  <button type="button" onClick={() => setIsAddingItem(false)} style={{ flex: 1, ...secondaryBtnStyle }}>Cancel</button>
                  <button type="submit" style={{ flex: 1, ...primaryBtnStyle }}>Save Item</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT ITEM MODAL */}
        {editingItem && (
          <div style={modalOverlayStyle}>
            <div style={modalStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ margin: 0, fontSize: '20px', color: '#111', fontWeight: '800' }}>Edit Menu Item</h3>
                <button onClick={cancelEdit} style={closeBtnStyle}>×</button>
              </div>
              <form onSubmit={handleEditMenuItem} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Category</label>
                  <select value={editingItem.category.id} onChange={e => setEditingItem({...editingItem, category: { id: e.target.value }})} required style={inputStyle}>
                    <option value="" disabled>Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Item Name</label>
                  <input type="text" placeholder="Name" value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Description</label>
                  <textarea placeholder="Description" value={editingItem.description || ''} onChange={e => setEditingItem({...editingItem, description: e.target.value})} style={{...inputStyle, resize: 'vertical', minHeight: '80px'}} />
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Price (₹)</label>
                    <input style={inputStyle} type="number" step="0.01" placeholder="Price (₹)" value={editingItem.price} onChange={e => setEditingItem({...editingItem, price: e.target.value})} required />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Prep Time (mins)</label>
                    <input style={inputStyle} type="number" placeholder="Prep Time (mins)" value={editingItem.preparationTime} onChange={e => setEditingItem({...editingItem, preparationTime: e.target.value})} required />
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontWeight: '600', color: '#111', fontSize: '14px', marginTop: '8px' }}>
                  <input type="checkbox" checked={editingItem.available} onChange={e => setEditingItem({...editingItem, available: e.target.checked})} style={{ width: '18px', height: '18px', cursor: 'pointer' }} /> 
                  Available for Ordering
                </label>
                <div style={{ border: '1px dashed #ccc', padding: '24px', borderRadius: '12px', backgroundColor: '#fafafa', marginTop: '8px' }}>
                  <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', fontSize: '13px', color: '#333' }}>Food Image</label>
                  {editImagePreview && !removeEditImage ? (
                    <div style={{ marginBottom: '16px' }}>
                      <img src={editImagePreview} alt="Preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #eaeaea' }} />
                    </div>
                  ) : (
                    <div style={{ marginBottom: '16px', color: '#888', fontSize: '14px', fontStyle: 'italic' }}>
                      No Image Selected
                    </div>
                  )}
                  <input type="file" accept="image/jpeg, image/png, image/webp" onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setEditImage(e.target.files[0]);
                      setEditImagePreview(URL.createObjectURL(e.target.files[0]));
                      setRemoveEditImage(false);
                    }
                  }} style={{ fontSize: '14px', color: '#666' }} />
                  
                  {(editImagePreview || editingItem.imageUrl) && !removeEditImage && (
                    <button type="button" onClick={() => setRemoveEditImage(true)} style={{ marginTop: '16px', display: 'block', padding: '8px 16px', backgroundColor: '#fff', color: '#e74c3c', border: '1px solid #e74c3c', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}>
                      Remove Image
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                  <button type="button" onClick={cancelEdit} style={{ flex: 1, ...secondaryBtnStyle }}>Cancel</button>
                  <button type="submit" style={{ flex: 1, ...primaryBtnStyle }}>Update Item</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CATEGORY MANAGEMENT MODAL */}
        {isManagingCategories && (
          <div style={modalOverlayStyle}>
            <div style={modalStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ margin: 0, fontSize: '20px', color: '#111', fontWeight: '800' }}>Categories</h3>
                <button onClick={() => setIsManagingCategories(false)} style={closeBtnStyle}>×</button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                {categories.map(c => {
                  const itemCount = menuItems.filter(m => m.category.id === c.id).length;
                  return (
                    <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#fafafa', borderRadius: '8px', border: '1px solid #eaeaea' }}>
                      <div>
                        <p style={{ margin: '0 0 4px 0', fontWeight: '700', color: '#111', fontSize: '15px' }}>{c.name}</p>
                        <p style={{ margin: 0, fontSize: '12px', color: '#888', fontWeight: '500' }}>{itemCount} items</p>
                      </div>
                      <button 
                        onClick={() => handleDeleteCategory(c.id)}
                        style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', padding: '8px', fontSize: '13px', fontWeight: '700' }}
                      >
                        Delete
                      </button>
                    </div>
                  );
                })}
                {categories.length === 0 && <p style={{ color: '#888', fontSize: '14px', textAlign: 'center', fontStyle: 'italic' }}>No categories created yet.</p>}
              </div>

              <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', color: '#111', fontWeight: '700', borderTop: '1px solid #eaeaea', paddingTop: '24px' }}>+ Add New Category</h4>
              <form onSubmit={handleCreateCategory} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input 
                  type="text" 
                  placeholder="Category Name" 
                  value={catName} 
                  onChange={e => setCatName(e.target.value)} 
                  required 
                  style={inputStyle}
                />
                <input 
                  type="text" 
                  placeholder="Description (Optional)" 
                  value={catDesc} 
                  onChange={e => setCatDesc(e.target.value)} 
                  style={inputStyle}
                />
                <button type="submit" style={primaryBtnStyle}>Add Category</button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: '8px',
  border: '1px solid #ddd',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit'
};

const labelStyle = {
  display: 'block',
  marginBottom: '8px',
  fontSize: '12px',
  fontWeight: '700',
  color: '#888',
  textTransform: 'uppercase',
  letterSpacing: '1px'
};

const primaryBtnStyle = {
  backgroundColor: '#e74c3c',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  padding: '12px 20px',
  fontSize: '14px',
  fontWeight: '700',
  cursor: 'pointer'
};

const secondaryBtnStyle = {
  backgroundColor: '#fff',
  color: '#111',
  border: '1px solid #ddd',
  borderRadius: '8px',
  padding: '12px 20px',
  fontSize: '14px',
  fontWeight: '700',
  cursor: 'pointer'
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
  maxWidth: '500px',
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
};

const closeBtnStyle = {
  background: '#f5f5f5', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', color: '#666', fontSize: '16px', fontWeight: 'bold'
};
