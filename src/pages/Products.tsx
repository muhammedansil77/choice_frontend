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
  
  // File Upload State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(filesArray);
      
      const previews = filesArray.map(file => URL.createObjectURL(file));
      setImagePreviews(previews);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = currentProduct?.priceInCoins === '' ? NaN : Number(currentProduct?.priceInCoins);
    if (!currentProduct?.name?.trim() || isNaN(priceNum) || priceNum < 0) {
      alert('Please enter a valid product name and price in coins.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', currentProduct.name);
      formData.append('description', currentProduct.description || '');
      formData.append('priceInCoins', String(priceNum));
      formData.append('category', currentProduct.category || '');
      formData.append('stock', String(Number(currentProduct.stock) || 0));
      formData.append('status', currentProduct.status || 'available');
      
      if (selectedFiles.length > 0) {
        selectedFiles.forEach(file => {
          formData.append('images', file);
        });
      } else if (currentProduct.images) {
        currentProduct.images.forEach(img => {
          formData.append('images', img);
        });
      }

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };

      if (currentProduct._id) {
        await api.put(`/products/${currentProduct._id}`, formData, config);
      } else {
        await api.post('/products', formData, config);
      }
      fetchData();
      closeModal();
    } catch (error: any) {
      console.error('Error saving product:', error);
      const errMsg = error.response?.data?.message || 'Failed to save product';
      alert(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openModal = (product: Partial<Product> | null = null) => {
    setCurrentProduct(product || {
      name: '',
      description: '',
      priceInCoins: '' as any,
      category: categories[0]?.name || '',
      stock: '' as any,
      status: 'available',
      images: []
    });
    setSelectedFiles([]);
    setImagePreviews(product?.images || []);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentProduct(null);
    setSelectedFiles([]);
    setImagePreviews([]);
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
        <div className="modal-overlay">
          <div className="modal-card animate-fade-in" style={{ width: '520px' }}>
            <div className="modal-header">
              <h2 className="modal-title">{currentProduct?._id ? 'Edit Product' : 'Add New Product'}</h2>
              <button type="button" className="modal-close-btn" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label className="form-label">Product Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g. 12W LED Recessed Panel Light"
                  value={currentProduct?.name || ''}
                  onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="form-label">Price (Coins) *</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 250"
                    value={currentProduct?.priceInCoins ?? ''}
                    onChange={e => setCurrentProduct({...currentProduct, priceInCoins: e.target.value === '' ? ('' as any) : Number(e.target.value)})}
                    onFocus={e => e.target.select()}
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Category *</label>
                  <select 
                    value={currentProduct?.category || ''}
                    onChange={e => setCurrentProduct({...currentProduct, category: e.target.value})}
                    required
                  >
                    {categories.length === 0 ? (
                      <option value="">No Categories Available</option>
                    ) : (
                      categories.map(cat => (
                        <option key={cat._id} value={cat.name}>{cat.name}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="form-label">Initial Stock</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 50"
                    value={currentProduct?.stock ?? ''}
                    onChange={e => setCurrentProduct({...currentProduct, stock: e.target.value === '' ? ('' as any) : Number(e.target.value)})}
                    onFocus={e => e.target.select()}
                    min="0"
                  />
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <select 
                    value={currentProduct?.status || 'available'}
                    onChange={e => setCurrentProduct({...currentProduct, status: e.target.value as any})}
                  >
                    <option value="available">Available</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Description *</label>
                <textarea 
                  placeholder="Describe technical specifications, wattage, color temperature, and features..."
                  style={{ width: '100%', minHeight: '90px', padding: '12px', resize: 'vertical' }}
                  value={currentProduct?.description || ''}
                  onChange={e => setCurrentProduct({...currentProduct, description: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="form-label">Product Images</label>
                
                {imagePreviews.length > 0 && (
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    {imagePreviews.map((url, idx) => (
                      <div key={idx} style={{ position: 'relative', width: '70px', height: '70px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <img src={url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                )}
                
                <input 
                  type="file" 
                  id="product-image-upload" 
                  multiple 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  style={{ display: 'none' }} 
                />
                
                <div 
                  className="image-dropzone"
                  onClick={() => document.getElementById('product-image-upload')?.click()}
                >
                  <Upload size={24} color="#2563eb" style={{ display: 'block', marginBottom: '8px', marginLeft: 'auto', marginRight: 'auto' }} />
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', margin: '0 0 2px 0' }}>Click to upload product images</p>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>PNG, JPG or WebP up to 10MB</p>
                </div>
              </div>

              {categories.length === 0 && (
                <div style={{ color: '#b91c1c', fontSize: '13px', background: '#fef2f2', padding: '12px 14px', borderRadius: '10px', border: '1px solid #fecaca', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontWeight: '700' }}>⚠️ No Categories Available</span>
                  <span>Please create a category under "Category Management" before adding products.</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1, padding: '12px' }} onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '12px' }} disabled={isSubmitting || categories.length === 0}>
                  {isSubmitting ? 'Saving Product...' : (currentProduct?._id ? 'Update Product' : 'Create Product')}
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
