import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Search, 
  Filter, 
  User, 
  Coins, 
  IndianRupee, 
  Store, 
  AlertCircle,
  Check
} from 'lucide-react';
import api from '../services/api';

interface Withdrawal {
  id: string;
  userId: string;
  points: number;
  cashAmount: number;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  adminNotes?: string;
  approvedAt?: string;
  rejectedAt?: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    phoneNumber?: string;
    email?: string;
    coinBalance?: number;
  };
}

const Withdrawals: React.FC = () => {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      const response = await api.get('/withdrawals/all');
      setWithdrawals(response.data);
    } catch (error) {
      console.error('Error fetching cash withdrawals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (withdrawal: Withdrawal) => {
    const confirmMsg = `Confirm Cash Handover:\n\n• Electrician: ${withdrawal.user?.name || 'User'}\n• Member ID: AE${withdrawal.userId.slice(0, 8).toUpperCase()}\n• Amount to Pay: ₹${withdrawal.cashAmount}\n• Points to Deduct: ${withdrawal.points}\n\nHave you handed over ₹${withdrawal.cashAmount} cash to the electrician?`;
    if (!window.confirm(confirmMsg)) return;

    setActionLoading(withdrawal.id);
    try {
      await api.put(`/withdrawals/${withdrawal.id}/approve`, {
        adminNotes: 'Cash collected at Choice Electricals store counter',
      });
      setWithdrawals(prev =>
        prev.map(item =>
          item.id === withdrawal.id
            ? { ...item, status: 'approved', approvedAt: new Date().toISOString() }
            : item
        )
      );
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to approve cash withdrawal');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (withdrawal: Withdrawal) => {
    const reason = window.prompt(
      `Reject withdrawal for ${withdrawal.user?.name}?\n${withdrawal.points} points will be immediately refunded to their account.\n\nEnter reason for rejection:`,
      'Electrician requested cancellation / Did not collect cash'
    );
    if (reason === null) return;

    setActionLoading(withdrawal.id);
    try {
      await api.put(`/withdrawals/${withdrawal.id}/reject`, { reason });
      setWithdrawals(prev =>
        prev.map(item =>
          item.id === withdrawal.id
            ? { ...item, status: 'rejected', rejectedAt: new Date().toISOString(), adminNotes: reason }
            : item
        )
      );
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to reject cash withdrawal');
    } finally {
      setActionLoading(null);
    }
  };

  // Stats
  const totalPaidOut = withdrawals
    .filter(w => w.status === 'approved')
    .reduce((sum, w) => sum + (w.cashAmount || 0), 0);

  const pendingCount = withdrawals.filter(w => w.status === 'pending').length;
  const pendingAmount = withdrawals
    .filter(w => w.status === 'pending')
    .reduce((sum, w) => sum + (w.cashAmount || 0), 0);

  const filtered = withdrawals.filter(w => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (w.user?.name || '').toLowerCase().includes(term) ||
      (w.user?.phoneNumber || '').includes(term) ||
      (w.user?.email || '').toLowerCase().includes(term) ||
      w.id.toLowerCase().includes(term);

    const matchesStatus = filterStatus === 'all' || w.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          bg: 'rgba(245, 158, 11, 0.15)',
          color: '#f59e0b',
          icon: <Clock size={12} />,
          text: 'Pending Store Pickup',
        };
      case 'approved':
        return {
          bg: 'rgba(16, 185, 129, 0.15)',
          color: '#10b981',
          icon: <CheckCircle size={12} />,
          text: 'Paid & Collected',
        };
      case 'rejected':
        return {
          bg: 'rgba(239, 68, 68, 0.15)',
          color: '#ef4444',
          icon: <XCircle size={12} />,
          text: 'Rejected / Refunded',
        };
      default:
        return {
          bg: 'rgba(148, 163, 184, 0.15)',
          color: '#94a3b8',
          icon: <AlertCircle size={12} />,
          text: status,
        };
    }
  };

  return (
    <div className="withdrawals-page" style={{ paddingBottom: '40px' }}>
      {/* Header */}
      <div className="flex-stack" style={{ justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="title-gradient" style={{ fontSize: window.innerWidth < 768 ? '24px' : '32px', marginBottom: '8px' }}>
            Cash Payouts & Store Collections
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Verify electrician points redemption and approve in-store real cash handouts.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(3, 1fr)', 
        gap: '20px', 
        marginBottom: '28px' 
      }}>
        {/* Total Cash Paid Out */}
        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '14px', 
            background: 'rgba(16, 185, 129, 0.15)', 
            color: '#10b981', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <IndianRupee size={26} />
          </div>
          <div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
              Total Cash Paid Out
            </p>
            <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#10b981', margin: '4px 0 0' }}>
              ₹{totalPaidOut.toLocaleString()}
            </h3>
          </div>
        </div>

        {/* Pending Cash Pickup Requests */}
        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '14px', 
            background: 'rgba(245, 158, 11, 0.15)', 
            color: '#f59e0b', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <Store size={26} />
          </div>
          <div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
              Pending Store Pickups
            </p>
            <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#f59e0b', margin: '4px 0 0' }}>
              {pendingCount} requests <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>(₹{pendingAmount})</span>
            </h3>
          </div>
        </div>

        {/* Conversion Rate Info */}
        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '14px', 
            background: 'rgba(99, 102, 241, 0.15)', 
            color: 'var(--primary)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <Coins size={26} />
          </div>
          <div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
              Store Loyalty Rate
            </p>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'white', margin: '4px 0 0' }}>
              1 Point = ₹1.00 Cash
            </h3>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="glass-card flex-stack" style={{ marginBottom: '24px', padding: '16px 20px', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ 
          flex: 1, 
          minWidth: '240px',
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          background: 'rgba(255,255,255,0.05)',
          padding: '10px 16px',
          borderRadius: '12px',
          border: '1px solid var(--border)',
        }}>
          <Search size={18} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search by electrician name, mobile or request ID..." 
            style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
              cursor: 'pointer'
            }}
          >
            <option value="all" style={{ background: 'var(--surface)' }}>All Status</option>
            <option value="pending" style={{ background: 'var(--surface)' }}>Pending Store Pickup</option>
            <option value="approved" style={{ background: 'var(--surface)' }}>Paid & Collected</option>
            <option value="rejected" style={{ background: 'var(--surface)' }}>Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Request ID & Date</th>
                <th>Electrician Details</th>
                <th>Points Redeemed</th>
                <th>Real Cash (₹)</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                    Loading cash payout requests...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                    No cash withdrawal requests found matching your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((w) => {
                  const badge = getStatusBadge(w.status);
                  const memberId = `AE${(w.user?.id || w.userId).slice(0, 8).toUpperCase()}`;

                  return (
                    <tr key={w.id}>
                      {/* Request ID & Date */}
                      <td>
                        <p style={{ fontSize: '13px', fontWeight: '700', marginBottom: '4px', letterSpacing: '0.3px' }}>
                          #{w.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={11} /> {new Date(w.createdAt).toLocaleString()}
                        </p>
                      </td>

                      {/* Electrician Info */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ 
                            padding: '8px', 
                            borderRadius: '10px', 
                            background: 'rgba(99, 102, 241, 0.1)', 
                            color: 'var(--primary)' 
                          }}>
                            <User size={16} />
                          </div>
                          <div>
                            <p style={{ fontSize: '14px', fontWeight: '700', margin: 0 }}>
                              {w.user?.name || 'Electrician'}
                            </p>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                              📱 {w.user?.phoneNumber || 'No phone'} · <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{memberId}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Points Redeemed */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b', fontWeight: '700', fontSize: '14px' }}>
                          <Coins size={16} />
                          {w.points} Pts
                        </div>
                      </td>

                      {/* Cash Amount */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontWeight: '800', fontSize: '16px' }}>
                          <IndianRupee size={16} />
                          ₹{w.cashAmount}
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <span style={{ 
                          padding: '5px 12px', 
                          borderRadius: '20px', 
                          fontSize: '11px', 
                          fontWeight: '700',
                          background: badge.bg,
                          color: badge.color,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          {badge.icon}
                          {badge.text}
                        </span>
                        {w.adminNotes && (
                          <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', margin: '4px 0 0', maxWidth: '180px' }}>
                            {w.adminNotes}
                          </p>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        {w.status === 'pending' ? (
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button
                              onClick={() => handleApprove(w)}
                              disabled={actionLoading === w.id}
                              style={{
                                background: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '7px 14px',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.2s',
                              }}
                              title="Mark as Paid & Hand Over Cash"
                            >
                              <Check size={14} />
                              Pay Cash
                            </button>
                            <button
                              onClick={() => handleReject(w)}
                              disabled={actionLoading === w.id}
                              style={{
                                background: 'rgba(239, 68, 68, 0.15)',
                                color: '#ef4444',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '8px',
                                padding: '7px 12px',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                              title="Reject and Refund Points"
                            >
                              <XCircle size={14} />
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {w.status === 'approved' ? '✓ Completed' : '✕ Refunded'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Withdrawals;
