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
  RefreshCw,
  Sparkles,
  TrendingDown
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
  const [detectedExistingEntry, setDetectedExistingEntry] = useState<CreditEntry | null>(null);
  const [duplicateInvoice, setDuplicateInvoice] = useState<CreditEntry | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'collect'>('create');

  // Form State
  const [formUserId, setFormUserId] = useState('');
  const [formInvoiceNumber, setFormInvoiceNumber] = useState('');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formCategory, setFormCategory] = useState<'electronic' | 'hardware'>('electronic');
  const [formBillAmount, setFormBillAmount] = useState<number | string>('');
  const [formReceivedAmount, setFormReceivedAmount] = useState<number | string>('');
  const [formReturnAmount, setFormReturnAmount] = useState<number | string>('');
  const [addPaymentAmount, setAddPaymentAmount] = useState<number | string>('');
  const [addReturnAmount, setAddReturnAmount] = useState<number | string>('');
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

  const generateFreshInvoiceNumber = () => {
    return `INV-${Date.now().toString().slice(-6)}`;
  };

  const openNewModal = () => {
    setEditingEntry(null);
    setDetectedExistingEntry(null);
    setDuplicateInvoice(null);
    setModalMode('create');
    const safeUsers = Array.isArray(users) ? users : [];
    setFormUserId(safeUsers.length > 0 ? (safeUsers[0].id || safeUsers[0]._id || '') : '');
    setFormInvoiceNumber(generateFreshInvoiceNumber());
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormCategory('electronic');
    setFormBillAmount('');
    setFormReceivedAmount('');
    setFormReturnAmount('');
    setAddPaymentAmount('');
    setAddReturnAmount('');
    setFormNarration('');
    setIsModalOpen(true);
  };

  const openEditModal = (entry: CreditEntry) => {
    setEditingEntry(entry);
    setDetectedExistingEntry(entry);
    setDuplicateInvoice(null);
    setModalMode('edit');
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
    setAddPaymentAmount('');
    setAddReturnAmount('');
    setFormNarration(entry.narration || '');
    setIsModalOpen(true);
  };

  const openPaymentCollectionModal = (entry: CreditEntry) => {
    setEditingEntry(entry);
    setDetectedExistingEntry(entry);
    setDuplicateInvoice(null);
    setModalMode('collect');
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
    setAddPaymentAmount('');
    setAddReturnAmount('');
    setFormNarration(entry.narration || '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEntry(null);
    setDetectedExistingEntry(null);
    setDuplicateInvoice(null);
    setAddPaymentAmount('');
    setAddReturnAmount('');
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

  const [invoiceLookupLoading, setInvoiceLookupLoading] = useState(false);
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);

  const openGeneralPaymentModal = () => {
    setEditingEntry(null);
    setDetectedExistingEntry(null);
    setDuplicateInvoice(null);
    setModalMode('collect');
    setLookupMessage(null);
    setFormUserId('');
    setFormInvoiceNumber('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormCategory('electronic');
    setFormBillAmount('');
    setFormReceivedAmount('');
    setFormReturnAmount('');
    setAddPaymentAmount('');
    setAddReturnAmount('');
    setFormNarration('');
    setIsModalOpen(true);
  };

  const applyBillToForm = (bill: CreditEntry) => {
    setDetectedExistingEntry(bill);
    setFormUserId(bill.userId);
    setFormInvoiceNumber(bill.invoiceNumber);
    setFormCategory(bill.category || 'electronic');
    setFormBillAmount(bill.billAmount ?? 0);
    setFormReceivedAmount(bill.receivedAmount ?? 0);
    setFormReturnAmount(bill.returnAmount ?? 0);
    try {
      setFormDate(new Date(bill.date).toISOString().split('T')[0]);
    } catch {
      // keep current date
    }
    setFormNarration(bill.narration || '');
    setLookupMessage(`Bill #${bill.invoiceNumber} auto-fetched for ${bill.user?.name || 'Customer'}! Due: ₹${bill.balanceAmount}`);
  };

  // Auto-fetch existing invoice when invoice number is typed, selected, or checked
  const checkAndAutoFetchInvoice = async (invoiceNum: string) => {
    const clean = invoiceNum.trim();
    const invoiceIdentifier = clean.replace(/^INV-?/i, '').trim();

    // If user has only typed prefix "INV" or "INV-" without an actual invoice number, ignore
    if (!invoiceIdentifier || invoiceIdentifier.length < 1) {
      setDuplicateInvoice(null);
      if (!editingEntry) {
        setDetectedExistingEntry(null);
        setLookupMessage(null);
      }
      return;
    }

    const handleFoundBill = (bill: CreditEntry) => {
      if (modalMode === 'create') {
        // Validation: Invoice already exists! Cannot create duplicate bill or add money
        setDuplicateInvoice(bill);
        setDetectedExistingEntry(null);
        setLookupMessage(`Invoice #${bill.invoiceNumber} already exists for ${bill.user?.name || 'Customer'}. Cannot create duplicate bill.`);
      } else {
        // Collect / Edit mode: auto-fetch bill to collect payment
        setDuplicateInvoice(null);
        applyBillToForm(bill);
      }
    };

    // 1. Check in loaded entries list (instant memory match)
    const inMem = entries.find((e) => {
      if (editingEntry && e.id === editingEntry.id) return false;
      const eClean = e.invoiceNumber.trim().toLowerCase();
      const eIdentifier = eClean.replace(/^inv-?/i, '').trim();
      const targetClean = clean.toLowerCase();
      const targetIdentifier = invoiceIdentifier.toLowerCase();

      return (
        eClean === targetClean ||
        eIdentifier === targetIdentifier ||
        eClean === `inv-${targetIdentifier}` ||
        `inv-${eIdentifier}` === targetClean
      );
    });

    if (inMem) {
      handleFoundBill(inMem);
      return;
    }

    // 2. Fetch from Backend API: /api/credit/invoice/:invoiceNumber
    try {
      setInvoiceLookupLoading(true);
      const res = await api.get(`/credit/invoice/${encodeURIComponent(clean)}`);
      if (res.data && res.data.id && (!editingEntry || res.data.id !== editingEntry.id)) {
        handleFoundBill(res.data);
        return;
      }
    } catch {
      // If user typed without INV-, try with INV-
      if (!clean.toUpperCase().startsWith('INV-')) {
        try {
          const res2 = await api.get(`/credit/invoice/${encodeURIComponent('INV-' + clean)}`);
          if (res2.data && res2.data.id && (!editingEntry || res2.data.id !== editingEntry.id)) {
            handleFoundBill(res2.data);
            return;
          }
        } catch {
          // not found
        }
      }

      setDuplicateInvoice(null);
      if (!editingEntry) {
        setDetectedExistingEntry(null);
        setLookupMessage(null);
      }
    } finally {
      setInvoiceLookupLoading(false);
    }
  };

  const handleInvoiceNumberChange = (value: string) => {
    setFormInvoiceNumber(value);
    const clean = value.trim();
    const invoiceIdentifier = clean.replace(/^INV-?/i, '').trim();
    if (invoiceIdentifier.length >= 1) {
      checkAndAutoFetchInvoice(value);
    } else {
      setDuplicateInvoice(null);
      if (!editingEntry) {
        setDetectedExistingEntry(null);
        setLookupMessage(null);
      }
    }
  };

  // Computed Effective Received & Return Amounts taking into account any added payment
  const effectiveReceivedAmount = useMemo(() => {
    const base = parseFloat(String(formReceivedAmount)) || 0;
    const add = parseFloat(String(addPaymentAmount)) || 0;
    return base + add;
  }, [formReceivedAmount, addPaymentAmount]);

  const effectiveReturnAmount = useMemo(() => {
    const base = parseFloat(String(formReturnAmount)) || 0;
    const add = parseFloat(String(addReturnAmount)) || 0;
    return base + add;
  }, [formReturnAmount, addReturnAmount]);

  // Form Computed Balance & Status Preview
  const calculatedBalance = useMemo(() => {
    const bill = parseFloat(String(formBillAmount)) || 0;
    return Math.max(0, bill - effectiveReceivedAmount - effectiveReturnAmount);
  }, [formBillAmount, effectiveReceivedAmount, effectiveReturnAmount]);

  const calculatedStatus = useMemo(() => {
    const bill = parseFloat(String(formBillAmount)) || 0;
    if (calculatedBalance <= 0 && bill > 0) return 'settled';
    if (effectiveReceivedAmount > 0 || effectiveReturnAmount > 0) return 'partial';
    if (bill === 0 && effectiveReceivedAmount === 0 && effectiveReturnAmount === 0) return 'settled';
    return 'unpaid';
  }, [formBillAmount, effectiveReceivedAmount, effectiveReturnAmount, calculatedBalance]);

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

    if (modalMode === 'create' && duplicateInvoice) {
      alert(`Invoice #${duplicateInvoice.invoiceNumber} already exists for ${duplicateInvoice.user?.name || 'Customer'}! You cannot add money or create a duplicate bill with an existing invoice number.`);
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
        receivedAmount: effectiveReceivedAmount,
        returnAmount: effectiveReturnAmount,
        narration: formNarration.trim(),
      };

      const targetId = editingEntry?.id || (modalMode === 'collect' ? detectedExistingEntry?.id : undefined);

      if (targetId) {
        // Update existing invoice (reduces due money with new payment)
        await api.put(`/credit/${targetId}`, payload);
      } else {
        // Create new invoice entry
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

  // Helper list of existing unpaid or partial invoices for fast dropdown lookup
  const unpaidInvoices = useMemo(() => {
    return safeEntries.filter((e) => e.status !== 'settled' && e.balanceAmount > 0);
  }, [safeEntries]);

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

        <div className="ledger-actions-bar" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => fetchLedger()}
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '12px', padding: '12px 16px' }}
            title="Refresh Ledger"
          >
            <RefreshCw size={16} /> Refresh
          </button>
          <button
            onClick={openGeneralPaymentModal}
            className="btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 18px',
              borderRadius: '12px',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#ffffff',
              border: 'none',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
              cursor: 'pointer',
            }}
          >
            <IndianRupee size={18} /> Receive Payment
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
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {/* Quick Collect Payment button if balance due */}
                          {(entry.balanceAmount || 0) > 0 && (
                            <button
                              onClick={() => openPaymentCollectionModal(entry)}
                              title="Collect Payment for this Bill"
                              style={{
                                background: 'rgba(16, 185, 129, 0.15)',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                color: '#10b981',
                                padding: '4px 8px',
                                height: '32px',
                                borderRadius: '8px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontSize: '11px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                              }}
                            >
                              <IndianRupee size={12} /> Collect
                            </button>
                          )}

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

      {/* Record / Edit / Collect Payment Modal */}
      {isModalOpen && createPortal(
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="modal-card animate-fade-in credit-modal-card" style={{ width: '580px', maxWidth: '100%', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ReceiptText size={20} style={{ color: 'var(--primary)' }} />
                {modalMode === 'collect'
                  ? (detectedExistingEntry ? `Collect Payment on Bill #${detectedExistingEntry.invoiceNumber}` : 'Receive Payment on Bill')
                  : editingEntry
                  ? 'Edit Credit Purchase / Bill'
                  : detectedExistingEntry
                  ? `Existing Bill Found (#${detectedExistingEntry.invoiceNumber}) - Collect Payment`
                  : 'Record Credit Purchase / Bill'}
              </h3>
              <button type="button" className="modal-close-btn" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEntry} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '4px', paddingBottom: '8px' }}>
                
                {/* 1. Mode Switcher (New Bill vs Receive Payment) */}
                {!editingEntry && (
                  <div className="modal-mode-tabs" style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    padding: '4px',
                    borderRadius: '12px',
                    border: '1px solid var(--border)'
                  }}>
                    <button
                      type="button"
                      onClick={() => {
                        setModalMode('create');
                        setDetectedExistingEntry(null);
                        setLookupMessage(null);
                        setFormInvoiceNumber(generateFreshInvoiceNumber());
                        setFormBillAmount('');
                        setFormReceivedAmount('');
                        setFormReturnAmount('');
                        setAddPaymentAmount('');
                        setAddReturnAmount('');
                      }}
                      style={{
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        background: modalMode === 'create' && !detectedExistingEntry ? 'var(--primary)' : 'transparent',
                        color: modalMode === 'create' && !detectedExistingEntry ? '#fff' : 'var(--text-muted)',
                        fontWeight: '700',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Plus size={15} /> + New Credit Bill
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setModalMode('collect');
                        setFormInvoiceNumber('');
                        setDuplicateInvoice(null);
                        setDetectedExistingEntry(null);
                        setLookupMessage(null);
                      }}
                      style={{
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        background: modalMode === 'collect' || detectedExistingEntry ? '#10b981' : 'transparent',
                        color: modalMode === 'collect' || detectedExistingEntry ? '#fff' : 'var(--text-muted)',
                        fontWeight: '700',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <IndianRupee size={15} /> Receive Payment (Existing Bill)
                    </button>
                  </div>
                )}

                {/* Quick Select Existing Unpaid Bill dropdown: ONLY SHOW IN COLLECT PAYMENT MODE */}
                {!editingEntry && modalMode === 'collect' && (
                  <div style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.06)',
                    border: '1px dashed rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#10b981', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Sparkles size={14} /> Select Existing Bill to Receive Payment:
                      </label>
                      {detectedExistingEntry && (
                        <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '700' }}>
                          ✓ Bill Loaded
                        </span>
                      )}
                    </div>
                    <select
                      value={detectedExistingEntry?.invoiceNumber || ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          handleInvoiceNumberChange(e.target.value);
                        } else {
                          setDetectedExistingEntry(null);
                          setLookupMessage(null);
                        }
                      }}
                      style={{
                        width: '100%',
                        height: '38px',
                        padding: '0 10px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: 'var(--text)',
                        fontSize: '13px',
                      }}
                    >
                      <option value="">-- Choose an existing bill to collect payment (e.g. INV-101) --</option>
                      {unpaidInvoices.map((inv) => (
                        <option key={inv.id} value={inv.invoiceNumber}>
                          {inv.invoiceNumber} - {inv.user?.name || 'Customer'} (Bill: ₹{inv.billAmount} | Due: ₹{inv.balanceAmount})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Detected Existing Bill Alert Card */}
                {detectedExistingEntry && (
                  <div style={{
                    padding: '14px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(16, 185, 129, 0.04))',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '13px', fontWeight: '800', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle2 size={16} /> Auto-Fetched Bill: #{detectedExistingEntry.invoiceNumber}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#ef4444' }}>
                        Current Due: {formatCurrency(detectedExistingEntry.balanceAmount)}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', paddingTop: '4px' }}>
                      <div>Customer: <strong style={{ color: 'var(--text)' }}>{detectedExistingEntry.user?.name || 'Customer'}</strong></div>
                      <div>Original Bill: <strong style={{ color: 'var(--text)' }}>{formatCurrency(detectedExistingEntry.billAmount)}</strong></div>
                      <div>Already Paid: <strong style={{ color: '#10b981' }}>{formatCurrency(detectedExistingEntry.receivedAmount)}</strong></div>
                    </div>
                  </div>
                )}

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

                  {/* Customer pending bills quick chips */}
                  {formUserId && !detectedExistingEntry && unpaidInvoices.filter(inv => inv.userId === formUserId).length > 0 && (
                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
                        Customer has pending bills:
                      </span>
                      {unpaidInvoices.filter(inv => inv.userId === formUserId).map(bill => (
                        <button
                          key={bill.id}
                          type="button"
                          onClick={() => applyBillToForm(bill)}
                          style={{
                            background: 'rgba(245, 158, 11, 0.15)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            color: '#f59e0b',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Clock size={11} /> #{bill.invoiceNumber} (Due: {formatCurrency(bill.balanceAmount)})
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Invoice Number & Date in Row */}
                <div className="modal-responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileText size={14} /> Invoice / Bill # *
                      </span>
                      {modalMode === 'create' && duplicateInvoice ? (
                        <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: '800' }}>⚠️ Already Exists!</span>
                      ) : detectedExistingEntry ? (
                        <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '800' }}>Auto-Fetched ✓</span>
                      ) : invoiceLookupLoading ? (
                        <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '600' }}>Searching...</span>
                      ) : null}
                    </label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        type="text"
                        placeholder="e.g. INV-101 or 101"
                        value={formInvoiceNumber}
                        onChange={(e) => handleInvoiceNumberChange(e.target.value)}
                        onBlur={() => checkAndAutoFetchInvoice(formInvoiceNumber)}
                        required
                        style={{
                          flex: 1,
                          borderColor: (modalMode === 'create' && duplicateInvoice) ? '#ef4444' : undefined,
                          background: (modalMode === 'create' && duplicateInvoice) ? 'rgba(239, 68, 68, 0.08)' : undefined,
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => checkAndAutoFetchInvoice(formInvoiceNumber)}
                        title="Check if bill exists"
                        style={{
                          padding: '0 10px',
                          background: (modalMode === 'create' && duplicateInvoice) ? 'rgba(239, 68, 68, 0.15)' : 'rgba(37, 99, 235, 0.1)',
                          border: (modalMode === 'create' && duplicateInvoice) ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(37, 99, 235, 0.25)',
                          color: (modalMode === 'create' && duplicateInvoice) ? '#ef4444' : 'var(--primary)',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {invoiceLookupLoading ? '...' : 'Check'}
                      </button>
                    </div>

                    {/* Red Validation Alert Box for Existing Invoice in Create Mode */}
                    {modalMode === 'create' && duplicateInvoice && (
                      <div style={{
                        marginTop: '8px',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1.5px solid #ef4444',
                        color: '#ef4444',
                        fontSize: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                            <AlertTriangle size={16} /> Invoice #{duplicateInvoice.invoiceNumber} Already Exists!
                          </span>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: '800',
                            background: '#ef4444',
                            color: '#fff',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            textTransform: 'uppercase'
                          }}>
                            Cannot Add Money
                          </span>
                        </div>
                        <div style={{ color: 'var(--text)' }}>
                          This invoice already exists for <strong>{duplicateInvoice.user?.name || 'Customer'}</strong> (Bill: {formatCurrency(duplicateInvoice.billAmount)} | Due: {formatCurrency(duplicateInvoice.balanceAmount)}).
                          <br />
                          <span style={{ color: '#ef4444', fontWeight: '700' }}>
                            You cannot create a duplicate bill or add money with this invoice number.
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => openPaymentCollectionModal(duplicateInvoice)}
                            style={{
                              background: '#10b981',
                              color: '#fff',
                              border: 'none',
                              padding: '5px 12px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <IndianRupee size={12} /> Collect Payment on this Bill Instead
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormInvoiceNumber(generateFreshInvoiceNumber());
                              setDuplicateInvoice(null);
                            }}
                            style={{
                              background: 'rgba(255, 255, 255, 0.1)',
                              color: 'var(--text)',
                              border: '1px solid var(--border)',
                              padding: '5px 12px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Sparkles size={12} /> Generate Unique Invoice #
                          </button>
                        </div>
                      </div>
                    )}

                    {lookupMessage && !duplicateInvoice && (
                      <div style={{ fontSize: '11px', color: '#10b981', fontWeight: '700', marginTop: '4px' }}>
                        {lookupMessage}
                      </div>
                    )}
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
                  <div className="modal-department-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
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

                {/* Amount Inputs: Bill Amount */}
                <div>
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Bill Amount (₹) *</span>
                    {detectedExistingEntry && (
                      <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '600' }}>
                        Original Bill: {formatCurrency(detectedExistingEntry.billAmount)}
                      </span>
                    )}
                  </label>
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

                {/* Payment Collection Section (If existing bill is detected or collect mode) */}
                {detectedExistingEntry ? (
                  <div style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(16, 185, 129, 0.02))',
                    border: '1.5px solid rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: '800', color: '#10b981', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <IndianRupee size={16} /> Enter Payment Received from Customer:
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Already Paid: <strong style={{ color: '#10b981' }}>{formatCurrency(formReceivedAmount)}</strong>
                      </span>
                    </div>

                    <div className="modal-responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label className="form-label" style={{ color: '#10b981', fontWeight: '700', fontSize: '12px' }}>
                          RECEIVED / PAID NOW (₹) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="e.g. 500.00"
                          value={addPaymentAmount}
                          onChange={(e) => setAddPaymentAmount(e.target.value)}
                          autoFocus={modalMode === 'collect' || !!detectedExistingEntry}
                          style={{
                            borderColor: '#10b981',
                            background: 'rgba(16, 185, 129, 0.08)',
                            fontSize: '16px',
                            fontWeight: '800',
                            color: '#10b981',
                          }}
                        />
                      </div>

                      <div>
                        <label className="form-label" style={{ fontSize: '12px' }}>
                          RETURN GOODS (₹)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={addReturnAmount}
                          onChange={(e) => setAddReturnAmount(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Live Calculation Preview */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: 'rgba(0, 0, 0, 0.15)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}>
                      <span>Original Outstanding Due: <strong style={{ color: '#ef4444' }}>{formatCurrency(detectedExistingEntry.balanceAmount)}</strong></span>
                      {Number(addPaymentAmount) > 0 && (
                        <span style={{ color: '#10b981', fontWeight: '800' }}>
                          - {formatCurrency(addPaymentAmount)}
                        </span>
                      )}
                      <span>New Total Received: <strong style={{ color: '#10b981' }}>{formatCurrency(effectiveReceivedAmount)}</strong></span>
                    </div>
                  </div>
                ) : (
                  /* Standard Fresh Invoice Amount Inputs */
                  <div className="modal-responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="form-label" style={{ fontWeight: '600' }}>RECEIVED / PAID NOW (₹)</label>
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
                      <label className="form-label" style={{ fontWeight: '600' }}>RETURN GOODS (₹)</label>
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
                )}

                {/* Auto Calculated Live Preview Card */}
                <div className="modal-balance-card" style={{
                  padding: '14px 18px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <TrendingDown size={12} /> Calculated Balance Due
                    </span>
                    <div style={{ fontSize: '26px', fontWeight: '900', color: calculatedBalance > 0 ? '#ef4444' : '#10b981', marginTop: '2px' }}>
                      {formatCurrency(calculatedBalance)}
                    </div>
                    {detectedExistingEntry && Number(addPaymentAmount) > 0 ? (
                      <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                        <Sparkles size={13} /> Due reduced by {formatCurrency(addPaymentAmount)}! (Was {formatCurrency(detectedExistingEntry.balanceAmount)})
                      </span>
                    ) : !detectedExistingEntry && Number(formReceivedAmount) > 0 ? (
                      <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '700', marginTop: '4px', display: 'block' }}>
                        Due reduced by {formatCurrency(formReceivedAmount)}!
                      </span>
                    ) : null}
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
                      Payment Status
                    </span>
                    {getStatusBadge(calculatedStatus)}
                  </div>
                </div>

                {/* Narration (Notes) */}
                <div>
                  <label className="form-label">Narration / Material Details / Remarks</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. 2.5sqmm copper cable 2 bundles, 16A modular switch 10 pcs, payment via cash..."
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
                  disabled={actionLoading || (modalMode === 'create' && !!duplicateInvoice)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: (modalMode === 'create' && !!duplicateInvoice)
                      ? 'rgba(239, 68, 68, 0.2)'
                      : (detectedExistingEntry && Number(addPaymentAmount) > 0)
                      ? 'linear-gradient(135deg, #10b981, #059669)'
                      : undefined,
                    borderColor: (modalMode === 'create' && !!duplicateInvoice)
                      ? '#ef4444'
                      : (detectedExistingEntry && Number(addPaymentAmount) > 0)
                      ? '#10b981'
                      : undefined,
                    color: (modalMode === 'create' && !!duplicateInvoice) ? '#ef4444' : undefined,
                    cursor: (modalMode === 'create' && !!duplicateInvoice) ? 'not-allowed' : 'pointer',
                    opacity: (modalMode === 'create' && !!duplicateInvoice) ? 0.65 : 1,
                    fontWeight: '700',
                    fontSize: '14px',
                    padding: '10px 20px',
                  }}
                >
                  {actionLoading
                    ? 'Saving...'
                    : (modalMode === 'create' && !!duplicateInvoice)
                    ? 'Cannot Save (Invoice Exists)'
                    : detectedExistingEntry
                    ? Number(addPaymentAmount) > 0
                      ? `Collect ${formatCurrency(addPaymentAmount)} & Reduce Due to ${formatCurrency(calculatedBalance)}`
                      : 'Update Bill Entry'
                    : editingEntry
                    ? 'Update Entry'
                    : `Save Credit Entry (${formatCurrency(calculatedBalance)} Due)`}
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
