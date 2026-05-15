import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Search, 
  Filter,
  Eye,
  User,
  Package,
  Coins
} from 'lucide-react';
import api from '../services/api';

interface Order {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  product: {
    _id: string;
    name: string;
    images: string[];
  };
  coinsSpent: number;
  quantity: number;
  status: 'pending' | 'approved' | 'rejected' | 'shipped' | 'delivered';
  createdAt: string;
}

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders/all');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: 'approved' | 'rejected') => {
    if (!window.confirm(`Are you sure you want to ${newStatus} this order?`)) return;
    
    setActionLoading(orderId);
    try {
      const endpoint = newStatus === 'approved' ? `/orders/${orderId}/approve` : `/orders/${orderId}/reject`;
      await api.put(endpoint);
      
      setOrders(orders.map(order => 
        order._id === orderId ? { ...order, status: newStatus } : order
      ));
    } catch (error) {
      alert(`Failed to ${newStatus} order`);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order._id.includes(searchTerm);
    
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'approved': return '#10b981';
      case 'rejected': return '#ef4444';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div className="orders-page">
      <div className="flex-stack" style={{ justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 className="title-gradient" style={{ fontSize: window.innerWidth < 768 ? '24px' : '32px', marginBottom: '8px' }}>Order Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Monitor and process purchase requests from users.</p>
        </div>
      </div>

      <div className="glass-card flex-stack" style={{ marginBottom: '32px', padding: '20px', alignItems: 'center' }}>
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
            placeholder="Search by order ID, user or product..." 
            style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex-stack" style={{ alignItems: 'center', gap: '12px', width: window.innerWidth < 1025 ? '100%' : 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
            <Filter size={18} color="var(--text-muted)" />
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ 
                background: 'rgba(255,255,255,0.05)', 
                border: '1px solid var(--border)', 
                color: 'white', 
                padding: '10px 16px', 
                borderRadius: '12px',
                outline: 'none',
                width: '100%'
              }}
            >
              <option value="all" style={{ background: 'var(--surface)' }}>All Status</option>
              <option value="pending" style={{ background: 'var(--surface)' }}>Pending</option>
              <option value="approved" style={{ background: 'var(--surface)' }}>Approved</option>
              <option value="rejected" style={{ background: 'var(--surface)' }}>Rejected</option>
            </select>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID & Date</th>
                <th>User Details</th>
                <th>Product Info</th>
                <th>Coins Spent</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading orders...</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>No orders found matching your criteria.</td></tr>
              ) : filteredOrders.map((order) => (
                <tr key={order._id}>
                  <td>
                    <p style={{ fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>#{order._id.slice(-8).toUpperCase()}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={10} /> {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>
                        <User size={16} />
                      </div>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: '600' }}>{order.user?.name}</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{order.user?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                        {order.product?.images?.[0] ? (
                          <img src={order.product.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Package size={20} color="var(--text-muted)" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: '600' }}>{order.product?.name}</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Qty: {order.quantity}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b', fontWeight: '700' }}>
                      <Coins size={16} />
                      {order.coinsSpent}
                    </div>
                  </td>
                  <td>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '20px', 
                      fontSize: '11px', 
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      background: `${getStatusColor(order.status)}20`,
                      color: getStatusColor(order.status),
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      {order.status === 'pending' && <Clock size={10} />}
                      {order.status === 'approved' && <CheckCircle size={10} />}
                      {order.status === 'rejected' && <XCircle size={10} />}
                      {order.status}
                    </span>
                  </td>
                  <td>
                    {order.status === 'pending' ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => handleStatusUpdate(order._id, 'approved')}
                          disabled={actionLoading === order._id}
                          style={{ 
                            padding: '6px 12px', borderRadius: '8px', border: 'none',
                            background: 'var(--success)', color: 'white', cursor: 'pointer',
                            fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px'
                          }}
                        >
                          <CheckCircle size={14} /> Approve
                        </button>
                        <button 
                          onClick={() => handleStatusUpdate(order._id, 'rejected')}
                          disabled={actionLoading === order._id}
                          style={{ 
                            padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--danger)',
                            background: 'transparent', color: 'var(--danger)', cursor: 'pointer',
                            fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px'
                          }}
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    ) : (
                      <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '12px' }}>
                        <Eye size={14} /> Details
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Orders;
