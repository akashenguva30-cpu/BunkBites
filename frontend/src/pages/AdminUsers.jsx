import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  
  const [showModal, setShowModal] = useState(false);
  const [staffUsername, setStaffUsername] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffConfirmPassword, setStaffConfirmPassword] = useState('');
  const [modalError, setModalError] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter]);

  const fetchUsers = async () => {
    try {
      const res = await api.get(`/admin/users?search=${search}&role=${roleFilter}`);
      setUsers(res.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) navigate('/');
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setModalError('');
    if (staffPassword !== staffConfirmPassword) {
      setModalError("Passwords do not match.");
      return;
    }
    
    try {
      await api.post('/admin/users/staff', {
        username: staffUsername,
        email: staffEmail,
        password: staffPassword
      });
      alert('Staff created successfully');
      setShowModal(false);
      setStaffUsername('');
      setStaffEmail('');
      setStaffPassword('');
      setStaffConfirmPassword('');
      fetchUsers();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Error creating staff');
    }
  };

  const toggleUserStatus = async (user) => {
    try {
      await api.put(`/admin/users/${user.id}/status`, {
        enabled: !user.enabled
      });
      fetchUsers();
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#fdfbfb' }}>
      <AdminSidebar />

      <div style={{ flex: 1, padding: '48px', overflowY: 'auto', boxSizing: 'border-box' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', color: '#111', fontWeight: '800', letterSpacing: '-0.5px' }}>PEOPLE & ROLES</h1>
            <p style={{ margin: 0, fontSize: '16px', color: '#666', fontWeight: '500' }}>Manage access for students, staff, and admins.</p>
          </div>
          <button onClick={() => setShowModal(true)} style={{ backgroundColor: '#e74c3c', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>
            + Create Staff
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#888' }}>🔍</span>
            <input 
              type="text" 
              placeholder="Search users..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...inputStyle, paddingLeft: '44px' }}
            />
          </div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ ...inputStyle, width: '180px', cursor: 'pointer' }}>
            <option value="ALL">All Roles</option>
            <option value="STUDENT">Students</option>
            <option value="STAFF">Staff</option>
            <option value="ADMIN">Admins</option>
          </select>
        </div>

        <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #eaeaea', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#fdfbfb', borderBottom: '1px solid #eaeaea' }}>
                <th style={thStyle}>Username</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Role</th>
                <th style={thStyle}>Status</th>
                <th style={{...thStyle, textAlign: 'right'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid #eaeaea' }}>
                  <td style={{...tdStyle, fontWeight: '700', color: '#111'}}>{u.username}</td>
                  <td style={{...tdStyle, color: '#666'}}>{u.email}</td>
                  <td style={tdStyle}>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '8px', 
                      fontSize: '11px', 
                      fontWeight: '700',
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      backgroundColor: u.role === 'ROLE_ADMIN' ? '#fdf2f2' : u.role === 'ROLE_STAFF' ? '#fafafa' : '#fff',
                      border: u.role === 'ROLE_STUDENT' ? '1px solid #eaeaea' : '1px solid transparent',
                      color: u.role === 'ROLE_ADMIN' ? '#e74c3c' : u.role === 'ROLE_STAFF' ? '#111' : '#888'
                    }}>
                      {u.role.replace('ROLE_', '')}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {u.enabled ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#388e3c', fontWeight: '700', fontSize: '12px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#388e3c' }}></span>
                        Active
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#c62828', fontWeight: '700', fontSize: '12px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#c62828' }}></span>
                        Disabled
                      </span>
                    )}
                  </td>
                  <td style={{...tdStyle, textAlign: 'right'}}>
                    {u.role === 'ROLE_ADMIN' ? (
                      <span style={{ color: '#aaa', fontSize: '12px', fontStyle: 'italic', paddingRight: '12px', fontWeight: '600' }}>Protected</span>
                    ) : (
                      <button 
                        onClick={() => toggleUserStatus(u)}
                        style={{
                          backgroundColor: '#fff',
                          color: u.enabled ? '#e74c3c' : '#388e3c',
                          border: u.enabled ? '1px solid #e74c3c' : '1px solid #388e3c',
                          padding: '6px 12px', borderRadius: '8px', cursor: 'pointer',
                          fontWeight: '700', fontSize: '12px'
                        }}
                      >
                        {u.enabled ? 'Disable' : 'Enable'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan="5" style={{...tdStyle, textAlign: 'center', padding: '48px', color: '#888', fontStyle: 'italic'}}>No users found matching criteria.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showModal && (
          <div style={modalOverlayStyle}>
            <div style={modalStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', color: '#111', fontWeight: '800' }}>Create Staff Account</h2>
                <button onClick={() => setShowModal(false)} style={closeBtnStyle}>×</button>
              </div>
              
              {modalError && (
                <div style={{ padding: '16px', backgroundColor: '#fdf2f2', border: '1px solid #fad4d4', color: '#e74c3c', borderRadius: '8px', marginBottom: '24px', fontSize: '14px', fontWeight: '600' }}>
                  {modalError}
                </div>
              )}
              
              <form onSubmit={handleCreateStaff} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Username</label>
                  <input required type="text" placeholder="e.g. staff_john" value={staffUsername} onChange={(e) => setStaffUsername(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Email Address</label>
                  <input required type="email" placeholder="john@campus.edu" value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Password</label>
                  <input required type="password" placeholder="••••••••" value={staffPassword} onChange={(e) => setStaffPassword(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Confirm Password</label>
                  <input required type="password" placeholder="••••••••" value={staffConfirmPassword} onChange={(e) => setStaffConfirmPassword(e.target.value)} style={inputStyle} />
                </div>
                
                <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '14px 24px', backgroundColor: '#fff', border: '1px solid #ddd', color: '#111', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>Cancel</button>
                  <button type="submit" style={{ flex: 1, padding: '14px 24px', backgroundColor: '#e74c3c', border: 'none', color: '#fff', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>Create Staff</button>
                </div>
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
  padding: '14px 16px',
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

const closeBtnStyle = {
  background: '#f5f5f5', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', color: '#666', fontSize: '16px', fontWeight: 'bold'
};
