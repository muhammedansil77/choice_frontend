import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Package, 
  TrendingUp,
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
    <div className="dashboard w-full overflow-x-hidden">
      <div className="dashboard-header flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="title-gradient text-2xl lg:text-3xl mb-2">Controlled Economy</h1>
          <p className="text-text-muted text-sm lg:text-base">Manage the central coin supply and monitor distribution.</p>
        </div>
        <button 
          className="btn-primary w-full lg:w-auto px-6 py-3 rounded-xl flex items-center justify-center gap-2" 
          onClick={() => setShowMintModal(true)}
        >
          <Plus size={20} />
          <span>Mint New Coins</span>
        </button>
      </div>

      <div className="stats-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {dashboardStats.map((stat, index) => (
          <div key={index} className="glass-card flex items-center gap-5 p-5 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white/5 text-[stat.color]" style={{ color: stat.color, backgroundColor: `${stat.color}15` }}>
              {stat.icon}
            </div>
            <div>
              <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-1">{stat.title}</p>
              <h2 className="text-2xl font-bold">{loading ? '...' : stat.value}</h2>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card lg:col-span-2 p-6 overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <h3 className="text-lg font-semibold">Circulation Analytics</h3>
            <span className="text-xs text-text-muted flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full">
              <History size={14} /> Historical supply growth
            </span>
          </div>
          <div className="h-[300px] w-full">
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

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-8">Wallet Summary</h3>
          <div className="space-y-8">
             <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl">
                <span className="text-text-muted text-sm">Total Minted</span>
                <span className="font-bold text-lg">{stats?.totalCoins || 0}</span>
             </div>
             <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl">
                <span className="text-text-muted text-sm">Distributed</span>
                <span className="font-bold text-lg text-secondary">{stats?.distributedCoins || 0}</span>
             </div>
             <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-1000"
                  style={{ width: `${(stats?.distributedCoins || 0) / (stats?.totalCoins || 1) * 100}%` }}
                ></div>
             </div>
             <div className="bg-primary/5 p-6 rounded-2xl border border-primary/20">
                <p className="text-[10px] text-primary font-bold uppercase tracking-widest mb-2">REMAINING POOL</p>
                <h4 className="text-3xl font-black">{stats?.remainingCoins || 0} <span className="text-sm font-normal text-text-muted">Coins</span></h4>
             </div>
          </div>
        </div>
      </div>

      {showMintModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[200] p-4">
          <div className="glass-card w-full max-w-md animate-fade-in relative">
            <button 
              onClick={() => setShowMintModal(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-white"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold mb-6">Mint New Supply</h3>
            <div className="space-y-4 mb-8">
              <label className="block text-[10px] text-text-muted font-bold uppercase tracking-widest">Amount to Create</label>
              <div className="relative">
                <Coins className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={20} />
                <input 
                  type="number" 
                  className="w-full bg-white/5 border border-border rounded-xl py-4 pl-12 pr-4 text-white text-2xl font-bold focus:outline-none focus:border-primary transition-colors"
                  value={mintAmount}
                  onChange={(e) => setMintAmount(Number(e.target.value))}
                  autoFocus
                />
              </div>
            </div>
            <div className="flex gap-4">
              <button className="btn-outline flex-1 py-3 rounded-xl" onClick={() => setShowMintModal(false)}>Cancel</button>
              <button className="btn-primary flex-1 py-3 rounded-xl" onClick={handleMint}>Mint Now</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
