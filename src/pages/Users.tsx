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
  TrendingUp,
  Edit2
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
  const [modalType, setModalType] = useState<'add' | 'reclaim' | 'distribute' | 'mint' | 'create' | 'edit_pool'>('add');
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

    if (modalType === 'edit_pool') {
      const newTotal = Number(coinAmount);
      if (isNaN(newTotal) || newTotal < 0) {
        alert('Please enter a valid total pool amount');
        return;
      }
      if (newTotal < (adminStats?.distributedCoins || 0)) {
        alert(`Total Pool cannot be less than already distributed coins (${adminStats?.distributedCoins || 0})`);
        return;
      }
      setActionLoading(true);
      try {
        await api.put('/coins/pool', { totalCoins: newTotal });
        fetchStats();
        closeModal();
      } catch (error: any) {
        alert(error.response?.data?.message || 'Failed to update total pool');
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

  const openModal = (user: User | null, type: 'add' | 'reclaim' | 'distribute' | 'mint' | 'create' | 'edit_pool') => {
    setSelectedUser(user);
    setModalType(type);
    if (type === 'edit_pool') {
      setCoinAmount(adminStats?.totalCoins !== undefined ? String(adminStats.totalCoins) : '');
    } else {
      setCoinAmount('');
    }
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
          <button className="btn btn-outline" onClick={() => openModal(null, 'edit_pool')} style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
            <Edit2 size={18} />
            <span>Edit Total Pool</span>
          </button>
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
        <div 
          className="glass-card" 
          style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid rgba(37, 99, 235, 0.25)' }}
          onClick={() => openModal(null, 'edit_pool')}
          title="Click to edit Total Pool"
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', margin: 0 }}>Total Pool</p>
              <span style={{ 
                background: 'rgba(37, 99, 235, 0.08)', 
                border: '1px solid rgba(37, 99, 235, 0.2)', 
                borderRadius: '6px', 
                padding: '2px 8px', 
                color: 'var(--primary)', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '4px', 
                fontSize: '11px', 
                fontWeight: '700' 
              }}>
                <Edit2 size={11} />
                Edit
              </span>
            </div>
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
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-outline" style={{ padding: '10px 16px' }}>
              <Filter size={18} />
              <span>Filters</span>
            </button>
          </div>
        </div>

        <div className="table-container" style={{ margin: 0 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Role</th>
                <th>Balance</th>
                <th>Join Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>Loading users...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No users found.</td>
                </tr>
              ) : filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '36px', height: '36px', borderRadius: '10px', 
                        background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: '700', color: 'white', fontSize: '14px'
                      }}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600' }}>{user.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Mail size={12} />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600',
                      background: user.role === 'admin' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                      color: user.role === 'admin' ? 'var(--danger)' : 'var(--primary)',
                      border: user.role === 'admin' ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(99, 102, 241, 0.2)',
                      display: 'inline-flex', alignItems: 'center', gap: '4px'
                    }}>
                      <Shield size={10} />
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', color: '#f59e0b' }}>
                      <Coins size={14} />
                      <span>{user.coinBalance}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button 
                        onClick={() => openModal(user, 'add')}
                        style={{ padding: '6px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: 'var(--success)', borderRadius: '8px', cursor: 'pointer' }}
                        title="Add Coins"
                      >
                        <Plus size={16} />
                      </button>
                      <button 
                        onClick={() => openModal(user, 'reclaim')}
                        style={{ padding: '6px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger)', borderRadius: '8px', cursor: 'pointer' }}
                        title="Reclaim Coins"
                      >
                        <Minus size={16} />
                      </button>
                      <button style={{ padding: '6px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
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
          <div className="modal-card animate-fade-in user-modal-box" style={{ width: '450px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {modalType === 'edit_pool' ? 'Edit Total Coin Pool' : (modalType === 'create' ? 'Add New User' : (modalType === 'mint' ? 'Mint New Supply' : (modalType === 'distribute' ? 'Global Coin Distribution' : (modalType === 'add' ? 'Add Coins' : 'Reclaim Coins'))))}
              </h3>
              <button type="button" className="modal-close-btn" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px', marginTop: '-8px' }}>
              {modalType === 'edit_pool'
                ? 'Directly set the Total Coin Supply. The remaining coin reserve will be updated automatically.'
                : modalType === 'create'
                ? 'Register a new user manually in the system.'
                : modalType === 'mint' 
                ? 'Create new coins into the central admin supply.'
                : modalType === 'distribute' 
                ? 'This will add coins to EVERY user from the admin pool.' 
                : modalType === 'add' ? `Sending coins to ${selectedUser?.name}` : `Reclaiming coins from ${selectedUser?.name}`}
            </p>

            {modalType === 'edit_pool' && (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#64748b' }}>Already Distributed:</span>
                  <span style={{ fontWeight: '700', color: '#0f172a' }}>{adminStats?.distributedCoins || 0} coins</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#64748b' }}>New Remaining Supply:</span>
                  <span style={{ fontWeight: '700', color: '#10b981' }}>
                    {Math.max(0, (Number(coinAmount) || 0) - (adminStats?.distributedCoins || 0)).toLocaleString()} coins
                  </span>
                </div>
              </div>
            )}

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
                <label className="form-label">
                  {modalType === 'edit_pool' ? 'New Total Coin Pool (Coins) *' : `Amount to ${modalType} *`}
                </label>
                <div style={{ position: 'relative' }}>
                  <Coins size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#d97706' }} />
                  <input 
                    type="number" 
                    style={{ paddingLeft: '44px', fontSize: '18px', fontWeight: '700' }}
                    value={coinAmount}
                    onChange={(e) => setCoinAmount(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    placeholder="e.g. 1000000"
                    min={modalType === 'edit_pool' ? String(adminStats?.distributedCoins || 0) : "0"}
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
                  background: modalType === 'create' ? 'var(--primary)' : (modalType === 'edit_pool' ? '#2563eb' : (modalType === 'mint' ? 'var(--accent)' : (modalType === 'distribute' ? 'var(--primary)' : (modalType === 'add' ? 'var(--success)' : 'var(--danger)'))))
                }}
                onClick={handleCoinAction}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : (modalType === 'edit_pool' ? 'Save Total Pool' : (modalType === 'create' ? 'Create User' : (modalType === 'mint' ? 'Mint Now' : (modalType === 'distribute' ? 'Distribute Now' : `${modalType === 'add' ? 'Send' : 'Reclaim'} Coins`))))}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
