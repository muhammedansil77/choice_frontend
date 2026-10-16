import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Tags, 
  Plus, 
  Search, 
  X, 
  Trash2, 
  Edit2,
  Calendar,
  Layers,
  Upload
} from 'lucide-react';
import api from '../services/api';
import type { Category } from '../types/index';

// Helper to resize and compress category image to ~30-50KB for fast JSON transmission
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 400;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }
        canvas.width = Math.round(width);
        canvas.height = Math.round(height);
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Image Upload State
  const [imageBase64, setImageBase64] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string>('');

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const compressed = await compressImage(file);
        setImageBase64(compressed);
        setImagePreview(compressed);
      } catch (err) {
        console.error('Error reading image:', err);
      }
    }
  };

  const removeImage = () => {
    setImageBase64('');
    setImagePreview('');
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    setActionLoading(true);
    try {
      const payload: any = {
        name: categoryName.trim(),
        icon: imageBase64 || imagePreview || 'category',
        image: imageBase64 || imagePreview || '',
      };

      if (editingCategory) {
        const response = await api.put(`/categories/${editingCategory._id}`, payload);
        setCategories(categories.map(cat => cat._id === editingCategory._id ? response.data : cat));
      } else {
        const response = await api.post('/categories', payload);
        setCategories([...categories, response.data]);
      }
      closeModal();
    } catch (error: any) {
      console.error('Error saving category:', error);
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

  const getCategoryImage = (cat: Category): string | null => {
    if (cat.image && cat.image.trim()) return cat.image;
    if (cat.icon && (cat.icon.startsWith('data:') || cat.icon.startsWith('http://') || cat.icon.startsWith('https://'))) {
      return cat.icon;
    }
    return null;
  };

  const openModal = (category: Category | null = null) => {
    if (category) {
      setEditingCategory(category);
      setCategoryName(category.name);
      const existingImg = getCategoryImage(category) || '';
      setImagePreview(existingImg);
      setImageBase64(existingImg);
    } else {
      setEditingCategory(null);
      setCategoryName('');
      setImagePreview('');
      setImageBase64('');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCategoryName('');
    setImagePreview('');
    setImageBase64('');
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
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Organize your products into logical groups with custom images.</p>
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
                <th style={{ width: '80px' }}>Image</th>
                <th>Category Name</th>
                <th>Created At</th>
                <th>Quick Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading categories...</td></tr>
              ) : filteredCategories.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>No categories found.</td></tr>
              ) : filteredCategories.map((category) => {
                const imgUrl = getCategoryImage(category);
                return (
                  <tr key={category._id}>
                    <td>
                      <div style={{ 
                        width: '44px', 
                        height: '44px', 
                        borderRadius: '10px', 
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--border)',
                        overflow: 'hidden',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}>
                        {imgUrl ? (
                          <img 
                            src={imgUrl} 
                            alt={category.name} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                        ) : (
                          <Tags size={20} color="var(--text-muted)" />
                        )}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: '600', fontSize: '15px' }}>{category.name}</span>
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
                          title="Edit Category"
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
                          title="Delete Category"
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && createPortal(
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="modal-card animate-fade-in" style={{ width: '480px', maxWidth: '95vw' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingCategory ? 'Edit Category' : 'New Category'}</h3>
              <button type="button" className="modal-close-btn" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddCategory} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '4px', paddingBottom: '4px' }}>
                <div>
                  <label className="form-label">Category Name *</label>
                  <input 
                    type="text" 
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="e.g. Cables, Switches, LED Lighting..."
                    autoFocus
                    required
                  />
                </div>

                {/* Category Image Upload */}
                <div>
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Category Image</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Recommended: 1:1 square</span>
                  </label>

                  {imagePreview ? (
                    <div style={{ position: 'relative', width: '120px', height: '120px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <img 
                        src={imagePreview} 
                        alt="Category preview" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        title="Remove image"
                        style={{
                          position: 'absolute',
                          top: '6px',
                          right: '6px',
                          background: 'rgba(0,0,0,0.65)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '26px',
                          height: '26px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ) : (
                    <label style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px dashed var(--border)',
                      borderRadius: '12px',
                      padding: '24px',
                      cursor: 'pointer',
                      background: 'rgba(255,255,255,0.02)',
                      transition: 'all 0.2s ease'
                    }}>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileChange} 
                        style={{ display: 'none' }} 
                      />
                      <div style={{ 
                        width: '44px', 
                        height: '44px', 
                        borderRadius: '50%', 
                        background: 'rgba(99, 102, 241, 0.1)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: 'var(--primary)',
                        marginBottom: '10px'
                      }}>
                        <Upload size={20} />
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Click to upload category image</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PNG, JPG, WEBP up to 5MB</span>
                    </label>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', flexShrink: 0 }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1, padding: '12px' }} onClick={closeModal}>Cancel</button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1, padding: '12px' }}
                  disabled={actionLoading || !categoryName.trim()}
                >
                  {actionLoading ? 'Saving...' : (editingCategory ? 'Update Category' : 'Create Category')}
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

export default Categories;
