import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentMenu from './pages/StudentMenu';
import AdminMenu from './pages/AdminMenu';
import OrderHistory from './pages/OrderHistory';
import StudentOrderDetails from './pages/StudentOrderDetails';
import StaffOrders from './pages/StaffOrders';
import StudentNotifications from './pages/StudentNotifications';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminOrders from './pages/AdminOrders';
import AdminPayments from './pages/AdminPayments';
import Profile from './pages/Profile';
import StudentFavorites from './pages/StudentFavorites';
import './App.css';

// Simple protected route
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = sessionStorage.getItem('token');
  const role = sessionStorage.getItem('role');

  if (!token) return <Navigate to="/" />;
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/" />;
  
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route 
          path="/student" 
          element={
            <ProtectedRoute allowedRoles={['ROLE_STUDENT']}>
              <StudentMenu />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/favorites" 
          element={
            <ProtectedRoute allowedRoles={['ROLE_STUDENT']}>
              <StudentFavorites />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/orders" 
          element={
            <ProtectedRoute allowedRoles={['ROLE_STUDENT']}>
              <OrderHistory />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/orders/:id" 
          element={
            <ProtectedRoute allowedRoles={['ROLE_STUDENT']}>
              <StudentOrderDetails />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/notifications" 
          element={
            <ProtectedRoute allowedRoles={['ROLE_STUDENT']}>
              <StudentNotifications />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/users" 
          element={
            <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
              <AdminUsers />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/orders" 
          element={
            <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
              <AdminOrders />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/payments" 
          element={
            <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
              <AdminPayments />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_STAFF']}>
              <AdminMenu />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/staff/orders" 
          element={
            <ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_STAFF']}>
              <StaffOrders />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute allowedRoles={['ROLE_STUDENT', 'ROLE_ADMIN', 'ROLE_STAFF']}>
              <Profile />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
