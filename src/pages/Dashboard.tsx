import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Package, 
  TrendingUp,
  ArrowUpRight,
  Plus,
  Coins,
  History
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import api from '../services/api';

const chartData = [
  { name: 'Mon', coins: 4000 },
  { name: 'Tue', coins: 3000 },
  { name: 'Wed', coins: 5000 },
  { name: 'Thu', coins: 2780 },
  { name: 'Fri', coins: 1890 },
  { name: 'Sat', coins: 2390 },
  { name: 'Sun', coins: 3490 },
];

interface AdminStats {
  totalCoins: number;
  distributedCoins: number;
  remainingCoins: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [userCount, setUserCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showMintModal, setShowMintModal] = useState(false);
  const [mintAmount, setMintAmount] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, summaryRes] = await Promise.all([
        api.get('/coins/stats'),
        api.get('/users/summary')
      ]);
      setStats(statsRes.data);
      setUserCount(summaryRes.data.users);
      setProductCount(summaryRes.data.products);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMint = async () => {
    if (mintAmount <= 0) return;
    try {
      await api.post('/coins/mint', { amount: mintAmount });
      fetchData();
      setShowMintModal(false);
      setMintAmount(0);
    } catch (error) {
      console.error('Minting failed:', error);
      alert('Failed to mint coins');
    }
  };

  const dashboardStats = [
    { title: 'Total Supply', value: stats?.totalCoins?.toLocaleString() || '0', icon: <TrendingUp size={24} />, color: '#6366f1' },
    { title: 'Remaining Supply', value: stats?.remainingCoins?.toLocaleString() || '0', icon: <Coins size={24} />, color: '#10b981' },
    { title: 'Total Users', value: userCount, icon: <Users size={24} />, color: '#ec4899' },
    { title: 'Products', value: productCount, icon: <Package size={24} />, color: '#8b5cf6' },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="title-gradient" style={{ fontSize: '32px', marginBottom: '8px' }}>Controlled Economy</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage the central coin supply and monitor distribution.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowMintModal(true)}>
          <Plus size={20} />
          <span>Mint New Coins</span>
        </button>
      </div>

      <div className="stats-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '24px',
        marginBottom: '32px'
      }}>
        {dashboardStats.map((stat, index) => (
          <div key={index} className="glass-card animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ 
              width: '56px', height: '56px', borderRadius: '16px', 
              backgroundColor: `${stat.color}20`, color: stat.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {stat.icon}
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500' }}>{stat.title}</p>
              <h2 style={{ fontSize: '24px', fontWeight: '700' }}>{loading ? '...' : stat.value}</h2>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Circulation Analytics</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <History size={14} /> Historical supply growth
            </span>
          </div>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCoins" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="coins" stroke="var(--primary)" fillOpacity={1} fill="url(#colorCoins)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card">
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px' }}>Wallet Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Minted</span>
                <span style={{ fontWeight: '600' }}>{stats?.totalCoins || 0}</span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Distributed</span>
                <span style={{ fontWeight: '600', color: 'var(--secondary)' }}>{stats?.distributedCoins || 0}</span>
             </div>
             <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${(stats?.distributedCoins || 0) / (stats?.totalCoins || 1) * 100}%`, 
                  height: '100%', 
                  background: 'linear-gradient(90deg, var(--primary), var(--secondary))' 
                }}></div>
             </div>
             <div style={{ background: 'rgba(99, 102, 241, 0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                <p style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '600', marginBottom: '4px' }}>REMAINING POOL</p>
                <h4 style={{ fontSize: '24px', fontWeight: '700' }}>{stats?.remainingCoins || 0} Coins</h4>
             </div>
          </div>
        </div>
      </div>

      {showMintModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="glass-card animate-fade-in" style={{ width: '400px' }}>
            <h3 style={{ fontSize: '20px', marginBottom: '16px' }}>Mint New Supply</h3>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>AMOUNT TO CREATE</label>
              <input 
                type="number" 
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px', color: 'white', fontSize: '18px', fontWeight: '700' }}
                value={mintAmount}
                onChange={(e) => setMintAmount(Number(e.target.value))}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowMintModal(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleMint}>Mint Supply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
