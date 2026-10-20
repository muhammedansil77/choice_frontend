import React, { useState, useEffect, useMemo, Component, type ErrorInfo, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  ReceiptText,
  Search,
  Plus,
  Filter,
  IndianRupee,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
  Wrench,
  Trash2,
  Edit2,
  X,
  User as UserIcon,
  Calendar,
  FileText,
  ArrowDownRight,
  Building2,
  RefreshCw
} from 'lucide-react';
import api from '../services/api';
import type { CreditEntry, CreditSummary, User } from '../types/index';

// Error Boundary to prevent any blank screen
class CreditLedgerErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message || 'An unexpected error occurred' };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CreditLedger ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text)' }}>
          <div className="glass-card" style={{ maxWidth: '500px', margin: '40px auto', padding: '32px', borderRadius: '16px' }}>
            <AlertTriangle size={48} style={{ color: '#ef4444', marginBottom: '16px' }} />
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Unable to display Credit Ledger</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>{this.state.error}</p>
            <button
              onClick={() => { this.setState({ hasError: false, error: '' }); window.location.reload(); }}
              className="btn btn-primary"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const CreditLedgerContent: React.FC = () => {
  const [entries, setEntries] = useState<CreditEntry[]>([]);
  const [summary, setSummary] = useState<CreditSummary>({
    totalBilled: 0,
    totalReceived: 0,
    totalReturned: 0,
    totalOutstanding: 0,
    totalCount: 0,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserFilter, setSelectedUserFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CreditEntry | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form State
  const [formUserId, setFormUserId] = useState('');
  const [formInvoiceNumber, setFormInvoiceNumber] = useState('');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formCategory, setFormCategory] = useState<'electronic' | 'hardware'>('electronic');
  const [formBillAmount, setFormBillAmount] = useState<number | string>('');
  const [formReceivedAmount, setFormReceivedAmount] = useState<number | string>('');
  const [formReturnAmount, setFormReturnAmount] = useState<number | string>('');
  const [formNarration, setFormNarration] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchLedger();
  }, [selectedUserFilter, categoryFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setUsers([]);
    }
  };

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedUserFilter && selectedUserFilter !== 'all') params.userId = selectedUserFilter;
      if (categoryFilter && categoryFilter !== 'all') params.category = categoryFilter;
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await api.get('/credit', { params });
      const data = res.data;

      if (data && typeof data === 'object' && !Array.isArray(data)) {
        setEntries(Array.isArray(data.entries) ? data.entries : []);
        setSummary({
          totalBilled: Number(data.summary?.totalBilled) || 0,
          totalReceived: Number(data.summary?.totalReceived) || 0,
          totalReturned: Number(data.summary?.totalReturned) || 0,
          totalOutstanding: Number(data.summary?.totalOutstanding) || 0,
          totalCount: Number(data.summary?.totalCount) || 0,
        });
      } else if (Array.isArray(data)) {
        setEntries(data);
      } else {
        setEntries([]);
      }
    } catch (err) {
      console.error('Error fetching credit entries:', err);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLedger();
  };

  const openNewModal = () => {
    setEditingEntry(null);
    const safeUsers = Array.isArray(users) ? users : [];
    setFormUserId(safeUsers.length > 0 ? (safeUsers[0].id || safeUsers[0]._id || '') : '');
    setFormInvoiceNumber(`INV-${Date.now().toString().slice(-6)}`);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormCategory('electronic');
    setFormBillAmount('');
    setFormReceivedAmount('');
    setFormReturnAmount('');
    setFormNarration('');
    setIsModalOpen(true);
  };

  const openEditModal = (entry: CreditEntry) => {
    setEditingEntry(entry);
    setFormUserId(entry.userId);
    setFormInvoiceNumber(entry.invoiceNumber);
    try {
      setFormDate(new Date(entry.date).toISOString().split('T')[0]);
    } catch {
      setFormDate(new Date().toISOString().split('T')[0]);
    }
    setFormCategory(entry.category || 'electronic');
    setFormBillAmount(entry.billAmount ?? '');
    setFormReceivedAmount(entry.receivedAmount ?? '');
    setFormReturnAmount(entry.returnAmount ?? '');
    setFormNarration(entry.narration || '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEntry(null);
  };

  // Safe formatting helpers
  const formatCurrency = (val: any) => {
    const num = Number(val) || 0;
    return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDate = (val: any) => {
    if (!val) return '—';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return String(val);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return String(val);
    }
  };

  // Form Computed Balance & Status Preview
  const calculatedBalance = useMemo(() => {
    const bill = parseFloat(String(formBillAmount)) || 0;
    const received = parseFloat(String(formReceivedAmount)) || 0;
    const ret = parseFloat(String(formReturnAmount)) || 0;
    return Math.max(0, bill - received - ret);
  }, [formBillAmount, formReceivedAmount, formReturnAmount]);

  const calculatedStatus = useMemo(() => {
    const bill = parseFloat(String(formBillAmount)) || 0;
    const received = parseFloat(String(formReceivedAmount)) || 0;
    const ret = parseFloat(String(formReturnAmount)) || 0;
    if (calculatedBalance <= 0 && bill > 0) return 'settled';
    if (received > 0 || ret > 0) return 'partial';
    if (bill === 0 && received === 0 && ret === 0) return 'settled';
    return 'unpaid';
  }, [formBillAmount, formReceivedAmount, formReturnAmount, calculatedBalance]);

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUserId) {
      alert('Please select a customer');
      return;
    }
    if (!formInvoiceNumber.trim()) {
      alert('Invoice Number is required');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        userId: formUserId,
        invoiceNumber: formInvoiceNumber.trim(),
        date: formDate,
        category: formCategory,
        billAmount: parseFloat(String(formBillAmount)) || 0,
        receivedAmount: parseFloat(String(formReceivedAmount)) || 0,
        returnAmount: parseFloat(String(formReturnAmount)) || 0,
        narration: formNarration.trim(),
      };

      if (editingEntry) {
        await api.put(`/credit/${editingEntry.id}`, payload);
      } else {
        await api.post('/credit', payload);
      }

      closeModal();
      fetchLedger();
    } catch (err: any) {
      console.error('Error saving credit entry:', err);
      alert(err.response?.data?.message || 'Failed to save credit entry');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteEntry = async (entry: CreditEntry) => {
    if (!window.confirm(`Delete credit entry #${entry.invoiceNumber} for ${entry.user?.name || 'Customer'}? This cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/credit/${entry.id}`);
      fetchLedger();
    } catch (err: any) {
      console.error('Error deleting entry:', err);
      alert(err.response?.data?.message || 'Failed to delete entry');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'settled':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#10b981',
            border: '1px solid rgba(16, 185, 129, 0.25)',
          }}>
            <CheckCircle2 size={13} /> Settled
          </span>
        );
      case 'partial':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            background: 'rgba(245, 158, 11, 0.15)',
            color: '#f59e0b',
            border: '1px solid rgba(245, 158, 11, 0.25)',
          }}>
            <Clock size={13} /> Partial
          </span>
        );
      case 'unpaid':
      default:
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#ef4444',
            border: '1px solid rgba(239, 68, 68, 0.25)',
          }}>
            <AlertTriangle size={13} /> Unpaid
          </span>
        );
    }
  };

  const safeUsers = Array.isArray(users) ? users : [];
  const safeEntries = Array.isArray(entries) ? entries : [];

  return (
    <div className="credit-ledger-page" style={{ paddingBottom: '48px' }}>
      {/* Header */}
      <div className="flex-stack" style={{ justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="title-gradient" style={{ fontSize: window.innerWidth < 768 ? '24px' : '30px', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ReceiptText size={28} style={{ color: 'var(--primary)' }} />
            Customer Credit Ledger (Khata)
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '6px' }}>
            Track customer credit purchases, cash receipts, goods returns, and outstanding balances.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => fetchLedger()}
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '12px', padding: '12px 16px' }}
            title="Refresh Ledger"
          >
            <RefreshCw size={16} /> Refresh
          </button>
          <button
            onClick={openNewModal}
            className="btn btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              borderRadius: '12px',
              fontWeight: '600',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
            }}
          >
            <Plus size={18} /> Record Credit / Bill
          </button>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: window.innerWidth < 768 ? '1fr' : window.innerWidth < 1200 ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '28px'
      }}>
        {/* Total Outstanding Balance */}
        <div className="glass-card" style={{
          padding: '20px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(239, 68, 68, 0.02))',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <IndianRupee size={24} />
          </div>
          <div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Outstanding Due
            </p>
            <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#ef4444', margin: '4px 0 0' }}>
              {formatCurrency(summary.totalOutstanding)}
            </h3>
          </div>
        </div>

        {/* Total Billed Amount */}
        <div className="glass-card" style={{
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'rgba(59, 130, 246, 0.15)',
            color: '#3b82f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <ReceiptText size={24} />
          </div>
          <div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Billed Sales
            </p>
            <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#3b82f6', margin: '4px 0 0' }}>
              {formatCurrency(summary.totalBilled)}
            </h3>
          </div>
        </div>

        {/* Total Received Amount */}
        <div className="glass-card" style={{
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <ArrowDownRight size={24} />
          </div>
          <div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Received / Paid
            </p>
            <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#10b981', margin: '4px 0 0' }}>
              {formatCurrency(summary.totalReceived)}
            </h3>
          </div>
        </div>

        {/* Total Returns */}
        <div className="glass-card" style={{
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'rgba(168, 85, 247, 0.15)',
            color: '#a855f7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <RotateCcw size={24} />
          </div>
          <div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Goods Returned
            </p>
            <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#a855f7', margin: '4px 0 0' }}>
              {formatCurrency(summary.totalReturned)}
            </h3>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="glass-card" style={{ padding: '16px 20px', borderRadius: '16px', marginBottom: '24px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
          {/* Search Input */}
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search invoice #, customer, narration..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '42px',
                paddingRight: '14px',
                height: '42px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                color: 'var(--text)',
                fontSize: '14px',
              }}
            />
          </div>

          {/* Customer Filter */}
          <div style={{ flex: '1 1 200px' }}>
            <select
              value={selectedUserFilter}
              onChange={(e) => setSelectedUserFilter(e.target.value)}
              style={{
                width: '100%',
                height: '42px',
                padding: '0 14px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                color: 'var(--text)',
                fontSize: '14px',
              }}
            >
              <option value="all">All Customers</option>
              {safeUsers.map((u) => {
                const uid = u.id || u._id || '';
                return (
                  <option key={uid} value={uid}>
                    {u.name} {u.phoneNumber ? `(${u.phoneNumber})` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Category Filter */}
          <div style={{ flex: '0 1 160px' }}>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                width: '100%',
                height: '42px',
                padding: '0 14px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                color: 'var(--text)',
                fontSize: '14px',
              }}
            >
              <option value="all">All Categories</option>
              <option value="electronic">⚡ Electronic</option>
              <option value="hardware">🔧 Hardware</option>
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ flex: '0 1 140px' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                width: '100%',
                height: '42px',
                padding: '0 14px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                color: 'var(--text)',
                fontSize: '14px',
              }}
            >
              <option value="all">All Status</option>
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partial</option>
              <option value="settled">Settled</option>
            </select>
          </div>

          {/* Submit Search Button */}
          <button
            type="submit"
            className="btn btn-outline"
            style={{
              height: '42px',
              padding: '0 18px',
              borderRadius: '10px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Filter size={16} /> Filter
          </button>
        </form>
      </div>

      {/* Credit Entries Table */}
      <div className="glass-card" style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date</th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Invoice #</th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Customer</th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Department</th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Bill Amt</th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Received</th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Return</th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Balance Due</th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Narration</th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'inline-block', width: '28px', height: '28px', border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    <p style={{ marginTop: '12px', fontSize: '14px' }}>Loading credit ledger entries...</p>
                  </td>
                </tr>
              ) : safeEntries.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                    <ReceiptText size={44} style={{ opacity: 0.3, marginBottom: '10px' }} />
                    <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text)' }}>No credit records found</p>
                    <p style={{ fontSize: '13px' }}>Click "Record Credit / Bill" above to add the first invoice entry.</p>
                  </td>
                </tr>
              ) : (
                safeEntries.map((entry) => {
                  const entryDate = formatDate(entry.date);

                  return (
                    <tr
                      key={entry.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'background 0.2s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      {/* Date */}
                      <td style={{ padding: '14px 18px', fontSize: '13px', color: 'var(--text)', whiteSpace: 'nowrap' }}>
                        {entryDate}
                      </td>

                      {/* Invoice Number */}
                      <td style={{ padding: '14px 18px', fontSize: '13px', fontWeight: '700', color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                        {entry.invoiceNumber}
                      </td>

                      {/* Customer */}
                      <td style={{ padding: '14px 18px', fontSize: '13px' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text)' }}>
                          {entry.user?.name || 'Unknown User'}
                        </div>
                        {entry.user?.phoneNumber && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {entry.user.phoneNumber}
                          </div>
                        )}
                      </td>

                      {/* Department */}
                      <td style={{ padding: '14px 18px', fontSize: '13px', whiteSpace: 'nowrap' }}>
                        {entry.category === 'hardware' ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: '600',
                            background: 'rgba(249, 115, 22, 0.12)',
                            color: '#f97316',
                            border: '1px solid rgba(249, 115, 22, 0.25)',
                          }}>
                            <Wrench size={11} /> Hardware
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: '600',
                            background: 'rgba(59, 130, 246, 0.12)',
                            color: '#3b82f6',
                            border: '1px solid rgba(59, 130, 246, 0.25)',
                          }}>
                            <Zap size={11} /> Electronic
                          </span>
                        )}
                      </td>

                      {/* Bill Amount */}
                      <td style={{ padding: '14px 18px', fontSize: '13px', fontWeight: '600', textAlign: 'right', color: 'var(--text)' }}>
                        {formatCurrency(entry.billAmount)}
                      </td>

                      {/* Received Amount */}
                      <td style={{ padding: '14px 18px', fontSize: '13px', fontWeight: '600', textAlign: 'right', color: '#10b981' }}>
                        {formatCurrency(entry.receivedAmount)}
                      </td>

                      {/* Return Amount */}
                      <td style={{ padding: '14px 18px', fontSize: '13px', fontWeight: '600', textAlign: 'right', color: '#a855f7' }}>
                        {formatCurrency(entry.returnAmount)}
                      </td>

                      {/* Balance Amount */}
                      <td style={{ padding: '14px 18px', fontSize: '14px', fontWeight: '800', textAlign: 'right', color: (entry.balanceAmount || 0) > 0 ? '#ef4444' : '#10b981' }}>
                        {formatCurrency(entry.balanceAmount)}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                        {getStatusBadge(entry.status)}
                      </td>

                      {/* Narration */}
                      <td style={{ padding: '14px 18px', fontSize: '12px', color: 'var(--text-muted)', maxWidth: '220px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                        {entry.narration || <span style={{ opacity: 0.4 }}>—</span>}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 18px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={() => openEditModal(entry)}
                            title="Edit Invoice"
                            style={{
                              background: 'rgba(59, 130, 246, 0.1)',
                              border: '1px solid rgba(59, 130, 246, 0.2)',
                              color: '#3b82f6',
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <Edit2 size={14} />
                          </button>

                          <button
                            onClick={() => handleDeleteEntry(entry)}
                            title="Delete Invoice"
                            style={{
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                              color: '#ef4444',
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record / Edit Modal */}
      {isModalOpen && createPortal(
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="modal-card animate-fade-in" style={{ width: '560px', maxWidth: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ReceiptText size={20} style={{ color: 'var(--primary)' }} />
                {editingEntry ? 'Edit Credit / Bill Entry' : 'Record Credit Purchase / Bill'}
              </h3>
              <button type="button" className="modal-close-btn" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEntry} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '4px', paddingBottom: '8px' }}>
                
                {/* Customer Selection */}
                <div>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <UserIcon size={14} /> Select Customer / Electrician *
                  </label>
                  <select
                    value={formUserId}
                    onChange={(e) => setFormUserId(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      height: '42px',
                      padding: '0 12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      color: 'var(--text)',
                      fontSize: '14px',
                    }}
                  >
                    <option value="">-- Choose Customer --</option>
                    {safeUsers.map((u) => {
                      const uid = u.id || u._id || '';
                      return (
                        <option key={uid} value={uid}>
                          {u.name} {u.phoneNumber ? `(${u.phoneNumber})` : ''} - {u.email}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Invoice Number & Date in Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileText size={14} /> Invoice / Bill # *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. INV-10492"
                      value={formInvoiceNumber}
                      onChange={(e) => setFormInvoiceNumber(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} /> Bill Date *
                    </label>
                    <input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Department / Category Selection */}
                <div>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Building2 size={14} /> Department / Category *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setFormCategory('electronic')}
                      style={{
                        padding: '10px',
                        borderRadius: '10px',
                        border: formCategory === 'electronic' ? '2px solid var(--primary)' : '1px solid var(--border)',
                        background: formCategory === 'electronic' ? 'rgba(37, 99, 235, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                        color: formCategory === 'electronic' ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: '600',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Zap size={16} /> Electronic Department
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormCategory('hardware')}
                      style={{
                        padding: '10px',
                        borderRadius: '10px',
                        border: formCategory === 'hardware' ? '2px solid #f97316' : '1px solid var(--border)',
                        background: formCategory === 'hardware' ? 'rgba(249, 115, 22, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                        color: formCategory === 'hardware' ? '#f97316' : 'var(--text-muted)',
                        fontWeight: '600',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Wrench size={16} /> Hardware Department
                    </button>
                  </div>
                </div>

                {/* Amount Inputs in 3 columns: Bill Amount, Received Amount, Return Amount */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">Bill Amount (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formBillAmount}
                      onChange={(e) => setFormBillAmount(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">Received (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formReceivedAmount}
                      onChange={(e) => setFormReceivedAmount(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="form-label">Return (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formReturnAmount}
                      onChange={(e) => setFormReturnAmount(e.target.value)}
                    />
                  </div>
                </div>

                {/* Auto Calculated Live Preview Card */}
                <div style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>
                      Calculated Balance Due
                    </span>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: calculatedBalance > 0 ? '#ef4444' : '#10b981', marginTop: '2px' }}>
                      {formatCurrency(calculatedBalance)}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
                      Payment Status
                    </span>
                    {getStatusBadge(calculatedStatus)}
                  </div>
                </div>

                {/* Narration (Notes) */}
                <div>
                  <label className="form-label">Narration / Material Details / Remarks</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. 2.5sqmm copper cable 2 bundles, 16A modular switch 10 pcs, PVC conduit pipes..."
                    value={formNarration}
                    onChange={(e) => setFormNarration(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      color: 'var(--text)',
                      fontSize: '13px',
                      resize: 'vertical',
                    }}
                  />
                </div>

              </div>

              {/* Modal Footer */}
              <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={closeModal}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={actionLoading}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {actionLoading ? 'Saving...' : editingEntry ? 'Update Entry' : 'Save Credit Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

const CreditLedger: React.FC = () => {
  return (
    <CreditLedgerErrorBoundary>
      <CreditLedgerContent />
    </CreditLedgerErrorBoundary>
  );
};

export default CreditLedger;
