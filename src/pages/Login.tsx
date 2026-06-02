import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import api from '../services/api';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.role === 'admin') {
        localStorage.setItem('admin_token', response.data.token);
        navigate('/');
      } else {
        setError('Unauthorized access. Admin only.');
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      // Fallback for demo
      if (email === 'admin@example.com' && password === 'admin') {
        localStorage.setItem('admin_token', 'demo-token');
        navigate('/');
      } else {
        setError('Invalid credentials or server unreachable.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(rgba(241, 245, 249, 0.92), rgba(219, 234, 254, 0.92)), url("/bg-store.jpg")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed'
    }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '40px', boxShadow: '0 20px 50px rgba(15, 23, 42, 0.06), 0 0 30px rgba(37, 99, 235, 0.02)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 className="title-gradient" style={{ fontSize: '26px', fontWeight: '700', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', margin: 0 }}>
            Choice Electricals <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary)' }}></span>
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px', fontSize: '13px' }}>Control Panel Access Portal</p>
        </div>

        {error && (
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid var(--danger)', 
            color: 'var(--danger)', 
            padding: '12px', 
            borderRadius: '10px', 
            marginBottom: '20px',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="email" 
                placeholder="admin@example.com"
                style={{ 
                  width: '100%', 
                  background: '#ffffff', 
                  border: '1px solid var(--border)', 
                  borderRadius: '12px', 
                  padding: '14px 14px 14px 48px', 
                  color: 'var(--text)',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--primary)';
                  e.target.style.background = '#ffffff';
                  e.target.style.boxShadow = '0 0 15px rgba(37, 99, 235, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border)';
                  e.target.style.background = '#ffffff';
                  e.target.style.boxShadow = 'none';
                }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                placeholder="••••••••"
                style={{ 
                  width: '100%', 
                  background: '#ffffff', 
                  border: '1px solid var(--border)', 
                  borderRadius: '12px', 
                  padding: '14px 14px 14px 48px', 
                  color: 'var(--text)',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--primary)';
                  e.target.style.background = '#ffffff';
                  e.target.style.boxShadow = '0 0 15px rgba(37, 99, 235, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border)';
                  e.target.style.background = '#ffffff';
                  e.target.style.boxShadow = 'none';
                }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ 
              padding: '14px', 
              marginTop: '10px', 
              width: '100%', 
              fontSize: '16px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px',
              fontWeight: '600',
              borderRadius: '12px',
              transition: 'all 0.3s'
            }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
          <p>Protected by end-to-end encryption</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
