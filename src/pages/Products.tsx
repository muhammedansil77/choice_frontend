import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Package, 
  Image as ImageIcon,
  X,
  Upload
} from 'lucide-react';
import api from '../services/api';
import type { Product, Category } from '../types/index';

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/products'),
        api.get('/categories')
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct?.name || !currentProduct?.priceInCoins) return;

    setIsSubmitting(true);
    try {
      if (currentProduct._id) {
        await api.put(`/products/${currentProduct._id}`, currentProduct);
      } else {
        await api.post('/products', currentProduct);
      }
      fetchData();
      closeModal();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openModal = (product: Partial<Product> | null = null) => {
    setCurrentProduct(product || {
      name: '',
      description: '',
      priceInCoins: 0,
      category: categories[0]?.name || '',
      stock: 0,
      status: 'available',
      images: []
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentProduct(null);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="products-page">
      <div className="flex-stack" style={{ justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 className="title-gradient" style={{ fontSize: window.innerWidth < 768 ? '24px' : '32px', marginBottom: '8px' }}>Inventory</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Manage your products, prices, and stock levels.</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()} style={{ width: window.innerWidth < 1025 ? '100%' : 'auto' }}>
          <Plus size={20} />
          <span>Add Product</span>
        </button>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          background: 'var(--glass)',
          padding: '12px 20px',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          maxWidth: window.innerWidth < 1025 ? '100%' : '500px'
        }}>
          <Search size={20} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search products by name or category..." 
            style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%', fontSize: '15px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
        {loading ? (
          <p style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading inventory...</p>
        ) : filteredProducts.map((product) => (
          <div key={product._id} className="glass-card animate-fade-in" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'relative', height: '180px', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {product.images?.[0] ? (
                <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Package size={48} color="var(--border)" />
              )}
              <span style={{ 
                position: 'absolute', top: '12px', right: '12px', 
                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', 
                padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                color: 'var(--primary)', border: '1px solid var(--border)'
              }}>
                {product.category}
              </span>
            </div>
            
            <div style={{ padding: '20px', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600' }}>{product.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontWeight: '700' }}>
                  <ImageIcon size={14} />
                  <span>{product.priceInCoins}c</span>
                </div>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.5' }}>
                {product.description.length > 80 ? product.description.substring(0, 80) + '...' : product.description}
              </p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Stock</span>
                    <span style={{ fontWeight: '600', fontSize: '14px' }}>{product.stock} units</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</span>
                    <span style={{ 
                      fontWeight: '600', fontSize: '14px', 
                      color: product.status === 'available' ? 'var(--success)' : 'var(--danger)' 
                    }}>{product.status}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => openModal(product)}
                    style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Product Modal */}
      {isModalOpen && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)'
        }}>
          <div className="glass-card animate-fade-in" style={{ width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700' }}>{currentProduct?._id ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={closeModal} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Product Name</label>
                <input 
                  type="text" 
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px', color: 'white' }}
                  value={currentProduct?.name}
                  onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Price (Coins)</label>
                  <input 
                    type="number" 
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px', color: 'white' }}
                    value={currentProduct?.priceInCoins}
                    onChange={e => setCurrentProduct({...currentProduct, priceInCoins: Number(e.target.value)})}
                    required
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Category</label>
                  <select 
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px', color: 'white' }}
                    value={currentProduct?.category}
                    onChange={e => setCurrentProduct({...currentProduct, category: e.target.value})}
                  >
                    {categories.map(cat => (
                      <option key={cat._id} value={cat.name} style={{ background: 'var(--surface)' }}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Initial Stock</label>
                  <input 
                    type="number" 
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px', color: 'white' }}
                    value={currentProduct?.stock}
                    onChange={e => setCurrentProduct({...currentProduct, stock: Number(e.target.value)})}
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</label>
                  <select 
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px', color: 'white' }}
                    value={currentProduct?.status}
                    onChange={e => setCurrentProduct({...currentProduct, status: e.target.value as any})}
                  >
                    <option value="available" style={{ background: 'var(--surface)' }}>Available</option>
                    <option value="unavailable" style={{ background: 'var(--surface)' }}>Unavailable</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Description</label>
                <textarea 
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px', color: 'white', minHeight: '100px', resize: 'vertical' }}
                  value={currentProduct?.description}
                  onChange={e => setCurrentProduct({...currentProduct, description: e.target.value})}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Images</label>
                <div style={{ 
                  border: '2px dashed var(--border)', 
                  borderRadius: '12px', 
                  padding: '24px', 
                  textAlign: 'center',
                  cursor: 'pointer'
                }}>
                  <Upload size={24} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Click to upload or drag and drop images</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : (currentProduct?._id ? 'Update Product' : 'Create Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
