import React, { useState, useEffect } from 'react';
import { 
  Tags, 
  Plus, 
  Search, 
  X, 
  Trash2, 
  Edit2,
  Calendar,
  Layers
} from 'lucide-react';
import api from '../services/api';
import type { Category } from '../types/index';

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    setActionLoading(true);
    try {
      if (editingCategory) {
        const response = await api.put(`/categories/${editingCategory._id}`, { name: categoryName });
        setCategories(categories.map(cat => cat._id === editingCategory._id ? response.data : cat));
      } else {
        const response = await api.post('/categories', { name: categoryName });
        setCategories([...categories, response.data]);
      }
      closeModal();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save category');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category? Products in this category will remain, but the category tag will be gone.')) return;
    
    try {
      await api.delete(`/categories/${id}`);
      setCategories(categories.filter(cat => cat._id !== id));
    } catch (error) {
      alert('Failed to delete category');
    }
  };

  const openModal = (category: Category | null = null) => {
    if (category) {
      setEditingCategory(category);
      setCategoryName(category.name);
    } else {
      setEditingCategory(null);
      setCategoryName('');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCategoryName('');
    setEditingCategory(null);
  };

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="categories-page">
      <div className="flex-stack" style={{ justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 className="title-gradient" style={{ fontSize: window.innerWidth < 768 ? '24px' : '32px', marginBottom: '8px' }}>Category Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Organize your products into logical groups.</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()} style={{ width: window.innerWidth < 1025 ? '100%' : 'auto' }}>
          <Plus size={20} />
          <span>Add Category</span>
        </button>
      </div>

      <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', borderRadius: '12px' }}>
            <Layers size={24} />
          </div>
          <div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Categories</p>
            <h3 style={{ fontSize: '24px', fontWeight: '700' }}>{categories.length}</h3>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '16px' }}>
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            background: 'rgba(255,255,255,0.05)',
            padding: '10px 16px',
            borderRadius: '12px',
            border: '1px solid var(--border)'
          }}>
            <Search size={18} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Search categories..." 
              style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Created At</th>
                <th>Quick Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading categories...</td></tr>
              ) : filteredCategories.length === 0 ? (
                <tr><td colSpan={3} style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>No categories found.</td></tr>
              ) : filteredCategories.map((category) => (
                <tr key={category._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '36px', height: '36px', borderRadius: '10px', 
                        background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Tags size={18} />
                      </div>
                      <span style={{ fontWeight: '600' }}>{category.name}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '13px' }}>
                      <Calendar size={14} />
                      {new Date(category.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => openModal(category)}
                        style={{ 
                          width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border)', 
                          background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteCategory(category._id)}
                        style={{ 
                          width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border)', 
                          background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card animate-fade-in" style={{ width: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingCategory ? 'Edit Category' : 'New Category'}</h3>
              <button type="button" className="modal-close-btn" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddCategory}>
              <div style={{ marginBottom: '20px' }}>
                <label className="form-label">Category Name *</label>
                <input 
                  type="text" 
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="e.g. Cables, Switches, LED Lighting..."
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1, padding: '12px' }} onClick={closeModal}>Cancel</button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1, padding: '12px' }}
                  disabled={actionLoading || !categoryName.trim()}
                >
                  {actionLoading ? 'Saving...' : (editingCategory ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
