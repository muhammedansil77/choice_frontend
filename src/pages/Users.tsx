import React, { useState, useEffect } from 'react';
import { 
  Search, 
  UserPlus, 
  Mail, 
  Shield, 
  MoreVertical, 
  Coins, 
  Plus, 
  Minus, 
  X,
  Filter,
  TrendingUp
} from 'lucide-react';
import api from '../services/api';
import type { User } from '../types/index';

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [coinAmount, setCoinAmount] = useState<number | string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'reclaim' | 'distribute' | 'mint' | 'create'>('add');
  const [actionLoading, setActionLoading] = useState(false);
  const [adminStats, setAdminStats] = useState<any>(null);
  
  // Create User Form State
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
    coinBalance: 0
  });

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/coins/stats');
      setAdminStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
      alert('Failed to connect to the backend. Please check if the AWS server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleCoinAction = async () => {
    if (modalType === 'create') {
      if (!newUser.name || !newUser.email || !newUser.password) {
        alert('Please fill in required fields');
        return;
      }
      setActionLoading(true);
      try {
        await api.post('/users', newUser);
        fetchUsers();
        closeModal();
        setNewUser({ name: '', email: '', password: '', phoneNumber: '', coinBalance: 0 });
      } catch (error: any) {
        alert(error.response?.data?.message || 'Failed to create user');
      } finally {
        setActionLoading(false);
      }
      return;
    }

    const amount = Number(coinAmount);
    if (amount <= 0) return;
    if ((modalType === 'add' || modalType === 'reclaim') && !selectedUser) return;
    
    setActionLoading(true);
    try {
      const endpoint = modalType === 'distribute' ? '/coins/distribute' : (modalType === 'add' ? '/coins/add' : (modalType === 'mint' ? '/coins/mint' : '/coins/reclaim'));
      
      const payload = modalType === 'distribute' || modalType === 'mint'
        ? { amount: amount }
        : { userId: selectedUser?._id, amount: amount };

      await api.post(endpoint, payload);
      
      // Update local state
      if (modalType === 'distribute') {
        setUsers(users.map(u => ({
          ...u,
          coinBalance: u.coinBalance + amount
        })));
      } else if (modalType === 'add') {
        setUsers(users.map(u => {
          if (u._id === selectedUser?._id) {
            return {
              ...u,
              coinBalance: u.coinBalance + amount
            };
          }
          return u;
        }));
      } else if (modalType === 'reclaim') {
        setUsers(users.map(u => {
          if (u._id === selectedUser?._id) {
            return {
              ...u,
              coinBalance: u.coinBalance - amount
            };
          }
          return u;
        }));
      }
      
      fetchStats();
      closeModal();
    } catch (error) {
      console.error('Error managing coins:', error);
      alert('Failed to update coins');
    } finally {
      setActionLoading(false);
    }
  };

  const openModal = (user: User | null, type: 'add' | 'reclaim' | 'distribute' | 'mint' | 'create') => {
    setSelectedUser(user);
    setModalType(type);
    setCoinAmount('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="users-page">
      <style>{`
        @media (max-width: 768px) {
          .users-header {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 16px !important;
          }
          .users-actions-bar {
            flex-direction: column !important;
            align-items: stretch !important;
            width: 100% !important;
            gap: 10px !important;
          }
          .users-actions-bar button {
            width: 100% !important;
            justify-content: center !important;
          }
          .search-filter-row {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
          }
          .filter-btn {
            width: 100% !important;
          }
          .stats-row {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .mobile-hide-cell {
            display: none !important;
          }
          .user-modal-box {
            width: 95% !important;
            padding: 24px !important;
            margin: 16px !important;
          }
        }
      `}</style>
      <div className="users-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', gap: '20px', flexWrap: 'wrap' }}>
        <div>
          <h1 className="title-gradient" style={{ fontSize: '32px', marginBottom: '8px' }}>User Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>View and manage platform users and their coin balances.</p>
        </div>
        <div className="users-actions-bar" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button className="btn btn-outline" onClick={() => openModal(null, 'mint')} style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
            <Plus size={20} />
            <span>Mint Supply</span>
          </button>
          <button className="btn btn-outline" onClick={() => openModal(null, 'distribute')} style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
            <Coins size={20} />
            <span>Bulk Distribute</span>
          </button>
          <button className="btn btn-primary" onClick={() => openModal(null, 'create')}>
            <UserPlus size={20} />
            <span>Add New User</span>
          </button>
        </div>
      </div>

      <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <div className="glass-card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Pool</p>
            <h4 style={{ fontSize: '20px', fontWeight: '700' }}>{adminStats?.totalCoins || 0}</h4>
          </div>
          <Coins size={24} color="var(--primary)" opacity={0.5} />
        </div>
        <div className="glass-card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Remaining</p>
            <h4 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--success)' }}>{adminStats?.remainingCoins || 0}</h4>
          </div>
          <Shield size={24} color="var(--success)" opacity={0.5} />
        </div>
        <div className="glass-card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Distributed</p>
            <h4 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--secondary)' }}>{adminStats?.distributedCoins || 0}</h4>
          </div>
          <TrendingUp size={24} color="var(--secondary)" opacity={0.5} />
        </div>
      </div>

      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="flex-stack search-filter-row" style={{ padding: '20px', borderBottom: '1px solid var(--border)', gap: '16px' }}>
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            background: 'rgba(255,255,255,0.05)',
            padding: '10px 16px',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            width: '100%'
          }}>
            <Search size={18} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-outline filter-btn" style={{ height: '44px', justifyContent: 'center' }}>
            <Filter size={18} />
            <span>Filters</span>
          </button>
        </div>

        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Role</th>
                <th>Balance</th>
                <th className="mobile-hide-cell">Join Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading users...</td></tr>
              ) : filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', maxWidth: '200px' }}>
                      <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '12px', 
                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                        fontSize: '16px',
                        flexShrink: 0
                      }}>
                        {user.name[0].toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0, overflow: 'hidden' }}>
                        <p style={{ fontWeight: '600', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={user.name}>{user.name}</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={user.email}>
                          <Mail size={10} style={{ flexShrink: 0 }} /> {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '20px', 
                      fontSize: '11px', 
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      background: user.role === 'admin' ? 'rgba(236, 72, 153, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                      color: user.role === 'admin' ? 'var(--secondary)' : 'var(--primary)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Shield size={10} />
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Coins size={16} color="#f59e0b" />
                      <span style={{ fontWeight: '700', color: '#f59e0b' }}>{user.coinBalance}</span>
                    </div>
                  </td>
                  <td className="mobile-hide-cell" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => openModal(user, 'add')}
                        style={{ 
                          width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border)', 
                          background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                        title="Add Coins"
                      >
                        <Plus size={16} />
                      </button>
                      <button 
                        onClick={() => openModal(user, 'reclaim')}
                        style={{ 
                          width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border)', 
                          background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                        title="Reclaim Coins"
                      >
                        <Minus size={16} />
                      </button>
                      <button style={{ 
                        width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border)', 
                        background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card animate-fade-in user-modal-box" style={{ width: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {modalType === 'create' ? 'Add New User' : (modalType === 'mint' ? 'Mint New Supply' : (modalType === 'distribute' ? 'Global Coin Distribution' : (modalType === 'add' ? 'Add Coins' : 'Reclaim Coins')))}
              </h3>
              <button type="button" className="modal-close-btn" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px', marginTop: '-8px' }}>
              {modalType === 'create'
                ? 'Register a new user manually in the system.'
                : modalType === 'mint' 
                ? 'Create new coins into the central admin supply.'
                : modalType === 'distribute' 
                ? 'This will add coins to EVERY user from the admin pool.' 
                : modalType === 'add' ? `Sending coins to ${selectedUser?.name}` : `Reclaiming coins from ${selectedUser?.name}`}
            </p>

            {modalType === 'create' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <label className="form-label">Full Name *</label>
                  <input 
                    type="text" placeholder="e.g. John Doe" 
                    value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="form-label">Email Address *</label>
                  <input 
                    type="email" placeholder="name@example.com" 
                    value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="form-label">Password *</label>
                  <input 
                    type="password" placeholder="••••••••" 
                    value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  />
                </div>
                <div>
                  <label className="form-label">Phone Number</label>
                  <input 
                    type="text" placeholder="+91 9876543210" 
                    value={newUser.phoneNumber} onChange={(e) => setNewUser({...newUser, phoneNumber: e.target.value})}
                  />
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: '20px' }}>
                <label className="form-label">Amount to {modalType} *</label>
                <div style={{ position: 'relative' }}>
                  <Coins size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#d97706' }} />
                  <input 
                    type="number" 
                    style={{ paddingLeft: '44px', fontSize: '18px', fontWeight: '700' }}
                    value={coinAmount}
                    onChange={(e) => setCoinAmount(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    placeholder="0"
                    autoFocus
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-outline" style={{ flex: 1, padding: '12px' }} onClick={closeModal}>Cancel</button>
              <button 
                className="btn btn-primary" 
                style={{ 
                  flex: 1, 
                  padding: '12px',
                  background: modalType === 'create' ? 'var(--primary)' : (modalType === 'mint' ? 'var(--accent)' : (modalType === 'distribute' ? 'var(--primary)' : (modalType === 'add' ? 'var(--success)' : 'var(--danger)'))) 
                }}
                onClick={handleCoinAction}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : (modalType === 'create' ? 'Create User' : (modalType === 'mint' ? 'Mint Now' : (modalType === 'distribute' ? 'Distribute Now' : `${modalType === 'add' ? 'Send' : 'Reclaim'} Coins`)))}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
