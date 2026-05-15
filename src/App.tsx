import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Products from './pages/Products';
import Login from './pages/Login';
import Categories from './pages/Categories';
import Orders from './pages/Orders';

// Simple Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('admin_token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// Placeholder for missing pages to avoid errors
const Placeholder = ({ title }: { title: string }) => (
  <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
    <h2 className="title-gradient">{title}</h2>
    <p style={{ color: 'var(--text-muted)', marginTop: '12px' }}>This module is currently under development.</p>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="products" element={<Products />} />
          <Route path="categories" element={<Categories />} />
          <Route path="orders" element={<Orders />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
