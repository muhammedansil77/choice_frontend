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
    <div className="users-page w-full overflow-x-hidden">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="title-gradient text-2xl lg:text-3xl mb-2">User Management</h1>
          <p className="text-text-muted text-sm lg:text-base">View and manage platform users and their coin balances.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">
          <button className="btn-outline px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-accent border-accent/30 hover:bg-accent/10" onClick={() => openModal(null, 'mint')}>
            <Plus size={18} />
            <span className="text-sm font-semibold">Mint Supply</span>
          </button>
          <button className="btn-outline px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-primary border-primary/30 hover:bg-primary/10" onClick={() => openModal(null, 'distribute')}>
            <Coins size={18} />
            <span className="text-sm font-semibold">Distribute</span>
          </button>
          <button className="btn-primary px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20" onClick={() => openModal(null, 'create')}>
            <UserPlus size={18} />
            <span className="text-sm font-semibold">Add User</span>
          </button>
        </div>
      </div>

      <div className="stats-row grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="glass-card flex justify-between items-center p-5 animate-fade-in">
          <div>
            <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold mb-1">Total Pool</p>
            <h4 className="text-2xl font-bold tracking-tight">{adminStats?.totalCoins || 0}</h4>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Coins size={22} />
          </div>
        </div>
        <div className="glass-card flex justify-between items-center p-5 animate-fade-in">
          <div>
            <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold mb-1">Remaining</p>
            <h4 className="text-2xl font-bold tracking-tight text-success">{adminStats?.remainingCoins || 0}</h4>
          </div>
          <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center text-success">
            <Shield size={22} />
          </div>
        </div>
        <div className="glass-card flex justify-between items-center p-5 animate-fade-in">
          <div>
            <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold mb-1">Distributed</p>
            <h4 className="text-2xl font-bold tracking-tight text-secondary">{adminStats?.distributedCoins || 0}</h4>
          </div>
          <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
            <TrendingUp size={22} />
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden p-0 mb-10 border-border/50">
        <div className="flex flex-col md:flex-row gap-4 p-5 border-b border-border/50">
          <div className="flex-1 flex items-center gap-3 bg-white/5 px-4 py-2.5 rounded-xl border border-border/50 focus-within:border-primary/50 transition-all">
            <Search size={18} className="text-text-muted" />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              className="bg-transparent border-none text-white outline-none w-full text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn-outline px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold hover:bg-white/5">
            <Filter size={18} />
            <span>Filters</span>
          </button>
        </div>

        <div className="overflow-x-auto w-full custom-scrollbar">
          <table className="admin-table w-full min-w-[800px]">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Role</th>
                <th>Balance</th>
                <th>Join Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading users...</td></tr>
              ) : filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '12px', 
                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                        fontSize: '16px'
                      }}>
                        {user.name[0].toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontWeight: '600', fontSize: '14px' }}>{user.name}</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Mail size={10} /> {user.email}
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
                  <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[200] p-4">
          <div className="glass-card w-full max-w-md animate-fade-in relative">
            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 text-text-muted hover:text-white"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold mb-2">
              {modalType === 'create' ? 'Add New User' : (modalType === 'mint' ? 'Mint New Supply' : (modalType === 'distribute' ? 'Global Distribution' : (modalType === 'add' ? 'Add Coins' : 'Reclaim Coins')))}
            </h3>
            <p className="text-text-muted text-sm mb-8">
              {modalType === 'create'
                ? 'Register a new user manually in the system.'
                : modalType === 'mint' 
                ? 'Create new coins into the central supply.'
                : modalType === 'distribute' 
                ? 'This will add coins to EVERY user.' 
                : modalType === 'add' ? `Sending coins to ${selectedUser?.name}` : `Reclaiming coins from ${selectedUser?.name}`}
            </p>

            {modalType === 'create' ? (
              <div className="space-y-4 mb-8">
                <input 
                  type="text" placeholder="Full Name" 
                  className="w-full bg-white/5 border border-border rounded-xl p-3.5 text-white focus:border-primary outline-none transition-colors"
                  value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                />
                <input 
                  type="email" placeholder="Email Address" 
                  className="w-full bg-white/5 border border-border rounded-xl p-3.5 text-white focus:border-primary outline-none transition-colors"
                  value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                />
                <input 
                  type="password" placeholder="Password" 
                  className="w-full bg-white/5 border border-border rounded-xl p-3.5 text-white focus:border-primary outline-none transition-colors"
                  value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                />
                <input 
                  type="text" placeholder="Phone Number" 
                  className="w-full bg-white/5 border border-border rounded-xl p-3.5 text-white focus:border-primary outline-none transition-colors"
                  value={newUser.phoneNumber} onChange={(e) => setNewUser({...newUser, phoneNumber: e.target.value})}
                />
              </div>
            ) : (
              <div className="mb-8">
                <label className="block text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2">Amount to {modalType}</label>
                <div className="relative">
                  <Coins className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={20} />
                  <input 
                    type="number" 
                    className="w-full bg-white/5 border border-border rounded-xl py-4 pl-12 pr-4 text-white text-2xl font-bold focus:outline-none focus:border-primary transition-colors"
                    value={coinAmount}
                    onChange={(e) => setCoinAmount(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    placeholder="0"
                    autoFocus
                  />
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button className="btn-outline flex-1 py-3 rounded-xl" onClick={closeModal}>Cancel</button>
              <button 
                className={`btn-primary flex-1 py-3 rounded-xl shadow-lg ${
                  modalType === 'reclaim' ? 'bg-danger hover:bg-danger/80 shadow-danger/20' : 'shadow-primary/20'
                }`}
                onClick={handleCoinAction}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : (modalType === 'create' ? 'Create User' : (modalType === 'mint' ? 'Mint Now' : (modalType === 'distribute' ? 'Distribute' : `${modalType === 'add' ? 'Send' : 'Reclaim'}`)))}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
