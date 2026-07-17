"use client";

import { useState, useEffect, useRef } from 'react';
import { addCategory, deleteCategory, addProduct, updateProduct, deleteProduct, importProductsFromCsv, uploadProductImage } from './actions';
import { Pencil, Trash2, Plus, LogIn, X, Upload, ImagePlus, Loader2 } from 'lucide-react';

type Category = { id: string; name: string };
type Product = { id: string; category_id: string; name: string; price: number; image_url?: string | null };

export default function AdminClient({ initialCategories, initialProducts }: { initialCategories: Category[], initialProducts: Product[] }) {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [products, setProducts] = useState<Product[]>(initialProducts);

  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');
  const [loading, setLoading] = useState(false);

  // Form states
  const [newCatName, setNewCatName] = useState('');
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdCatId, setNewProdCatId] = useState(categories[0]?.id || '');
  const [newProdImage, setNewProdImage] = useState<File | null>(null);
  const [newProdImagePreview, setNewProdImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Uploading state
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_auth');
    if (saved) {
      setPassword(saved);
      setIsAuthenticated(true);
    }
    setCategories(initialCategories);
    setProducts(initialProducts);
    if (!newProdCatId && initialCategories.length > 0) {
      setNewProdCatId(initialCategories[0].id);
    }
  }, [initialCategories, initialProducts]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password) {
      sessionStorage.setItem('admin_auth', password);
      setIsAuthenticated(true);
      setError('');
    }
  };

  const handleAction = async (action: () => Promise<void>) => {
    setLoading(true);
    try {
      await action();
      setError('');
    } catch (err: any) {
      setError(err.message || 'حدث خطأ ما');
      if (err.message === 'Unauthorized') {
        setIsAuthenticated(false);
        sessionStorage.removeItem('admin_auth');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNewImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewProdImage(file);
      setNewProdImagePreview(URL.createObjectURL(file));
    }
  };

  const handleEditImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditImageFile(file);
      setEditImagePreview(URL.createObjectURL(file));
    }
  };

  const doUploadImage = async (file: File): Promise<string> => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const url = await uploadProductImage(formData, password);
      return url;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    handleAction(async () => {
      await addCategory(newCatName, password);
      setNewCatName('');
    });
  };

  const handleDeleteCategory = (id: string) => {
    if (!confirm('تأكيد الحذف؟ سيتم حذف كل المنتجات المرتبطة بهذا القسم.')) return;
    handleAction(() => deleteCategory(id, password));
  };

  const handleAddProduct = () => {
    if (!newProdName.trim() || !newProdPrice || !newProdCatId) return;
    handleAction(async () => {
      let imageUrl: string | undefined;
      if (newProdImage) {
        imageUrl = await doUploadImage(newProdImage);
      }
      await addProduct(newProdCatId, newProdName, Number(newProdPrice), password, imageUrl);
      setNewProdName('');
      setNewProdPrice('');
      setNewProdImage(null);
      setNewProdImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    });
  };

  const handleUpdateProduct = () => {
    if (!editingProduct) return;
    handleAction(async () => {
      let imageUrl: string | null | undefined = undefined;
      if (editImageFile) {
        imageUrl = await doUploadImage(editImageFile);
      }
      await updateProduct(editingProduct.id, editingProduct.name, editingProduct.price, password, imageUrl);
      setEditingProduct(null);
      setEditImageFile(null);
      setEditImagePreview(null);
    });
  };

  const handleDeleteProduct = (id: string) => {
    if (!confirm('تأكيد حذف المنتج؟')) return;
    handleAction(() => deleteProduct(id, password));
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      handleAction(async () => {
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        if (lines.length < 2) throw new Error("الملف فارغ أو غير صالح");

        const headerLine = lines[0];
        const separator = headerLine.includes(';') ? ';' : ',';
        const headers = headerLine.split(separator).map(h => h.trim().replace(/^[\uFEFF]/, ''));

        const nameIdx = headers.findIndex(h => h === 'اسم المنتج');
        const catIdx = headers.findIndex(h => h === 'التصنيف');
        const priceIdx = headers.findIndex(h => h === 'سعر البيع');

        if (nameIdx === -1 || catIdx === -1 || priceIdx === -1) {
          throw new Error("لم يتم العثور على الأعمدة المطلوبة (اسم المنتج، التصنيف، سعر البيع)");
        }

        const items = lines.slice(1).map(line => {
          const columns = line.split(separator).map(c => c.trim().replace(/^"|"$/g, ''));
          if (columns.length <= Math.max(nameIdx, catIdx, priceIdx)) return null;

          const name = columns[nameIdx];
          const category = columns[catIdx];
          const priceStr = columns[priceIdx].replace(/[^\d.]/g, '');
          const price = parseFloat(priceStr);

          if (!name || !category || isNaN(price)) return null;
          return { name, category, price };
        }).filter(Boolean) as { category: string; name: string; price: number }[];

        if (items.length === 0) {
          throw new Error("لا توجد بيانات صالحة للاستيراد");
        }

        const res = await importProductsFromCsv(items, password);
        alert(`تم استيراد ${res.count} منتج بنجاح!`);
        window.location.reload();
      });
    };
    reader.readAsText(file, "UTF-8");
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <form onSubmit={handleLogin} className="bg-white dark:bg-coffee-950 p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
          <h1 className="text-2xl font-bold text-coffee-900 dark:text-coffee-100 mb-6">تسجيل الدخول للإدارة</h1>
          <input
            type="password"
            placeholder="كلمة المرور"
            className="w-full p-3 rounded-xl border border-coffee-200 dark:border-coffee-800 bg-coffee-50 dark:bg-coffee-900 mb-4 outline-none focus:border-gold-500 text-coffee-950 dark:text-coffee-100"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="w-full bg-coffee-800 hover:bg-coffee-900 text-white p-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
            <LogIn size={20} />
            دخول
          </button>
          {error && <p className="text-red-500 mt-4 text-sm">{error}</p>}
        </form>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-coffee-900 dark:text-coffee-100">لوحة التحكم</h1>
        <div className="flex items-center gap-4">
          <label className="bg-gold-500 hover:bg-gold-600 text-white px-4 py-2 rounded-xl font-bold text-sm cursor-pointer transition-colors flex items-center gap-2">
            <Upload size={16} />
            استيراد CSV
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              onChange={handleCsvUpload} 
            />
          </label>
          <button 
            onClick={() => { sessionStorage.removeItem('admin_auth'); setIsAuthenticated(false); }}
            className="text-coffee-500 hover:text-coffee-800 dark:hover:text-coffee-200 text-sm font-bold"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

      <div className="flex gap-4 mb-8">
        <button 
          onClick={() => setActiveTab('products')}
          className={`flex-1 p-3 rounded-xl font-bold transition-colors ${activeTab === 'products' ? 'bg-coffee-800 text-white' : 'bg-coffee-200 text-coffee-800 dark:bg-coffee-900 dark:text-coffee-300'}`}
        >
          المنتجات
        </button>
        <button 
          onClick={() => setActiveTab('categories')}
          className={`flex-1 p-3 rounded-xl font-bold transition-colors ${activeTab === 'categories' ? 'bg-coffee-800 text-white' : 'bg-coffee-200 text-coffee-800 dark:bg-coffee-900 dark:text-coffee-300'}`}
        >
          الأقسام
        </button>
      </div>

      {loading && <div className="text-center text-gold-500 font-bold my-4 flex items-center justify-center gap-2"><Loader2 className="animate-spin" size={20} /> جاري التحميل...</div>}

      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-coffee-950 p-6 rounded-2xl shadow-sm border border-coffee-100 dark:border-coffee-900">
            <h2 className="text-xl font-bold mb-4 text-coffee-900 dark:text-coffee-100">إضافة قسم جديد</h2>
            <div className="flex gap-3">
              <input 
                type="text" 
                placeholder="اسم القسم" 
                className="flex-1 p-3 rounded-xl border border-coffee-200 dark:border-coffee-800 bg-coffee-50 dark:bg-coffee-900 outline-none focus:border-gold-500 text-coffee-950 dark:text-coffee-100"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
              />
              <button onClick={handleAddCategory} className="bg-coffee-800 hover:bg-coffee-900 text-white px-6 rounded-xl font-bold transition-colors flex items-center gap-2">
                <Plus size={20} /> إضافة
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-coffee-950 rounded-2xl shadow-sm border border-coffee-100 dark:border-coffee-900 overflow-hidden">
            <table className="w-full text-right text-coffee-950 dark:text-coffee-100">
              <thead className="bg-coffee-100 dark:bg-coffee-900">
                <tr>
                  <th className="p-4 font-bold text-coffee-900 dark:text-coffee-100">اسم القسم</th>
                  <th className="p-4 font-bold text-coffee-900 dark:text-coffee-100 w-24">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(cat => (
                  <tr key={cat.id} className="border-t border-coffee-50 dark:border-coffee-900/50">
                    <td className="p-4">{cat.name}</td>
                    <td className="p-4">
                      <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-500 hover:text-red-700 p-2 bg-red-50 dark:bg-red-950/30 rounded-lg">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="space-y-6">
          {/* Add Product Form */}
          <div className="bg-white dark:bg-coffee-950 p-6 rounded-2xl shadow-sm border border-coffee-100 dark:border-coffee-900">
            <h2 className="text-xl font-bold mb-4 text-coffee-900 dark:text-coffee-100">إضافة منتج جديد</h2>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-3">
                <input 
                  type="text" 
                  placeholder="اسم المنتج" 
                  className="flex-[2] p-3 rounded-xl border border-coffee-200 dark:border-coffee-800 bg-coffee-50 dark:bg-coffee-900 outline-none focus:border-gold-500 text-coffee-950 dark:text-coffee-100"
                  value={newProdName}
                  onChange={e => setNewProdName(e.target.value)}
                />
                <input 
                  type="number" 
                  placeholder="السعر" 
                  className="flex-1 p-3 rounded-xl border border-coffee-200 dark:border-coffee-800 bg-coffee-50 dark:bg-coffee-900 outline-none focus:border-gold-500 text-coffee-950 dark:text-coffee-100"
                  value={newProdPrice}
                  onChange={e => setNewProdPrice(e.target.value)}
                />
                <select 
                  className="flex-1 p-3 rounded-xl border border-coffee-200 dark:border-coffee-800 bg-coffee-50 dark:bg-coffee-900 outline-none focus:border-gold-500 text-coffee-950 dark:text-coffee-100"
                  value={newProdCatId}
                  onChange={e => setNewProdCatId(e.target.value)}
                >
                  <option value="" disabled>اختر القسم</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* Image upload row */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-coffee-300 dark:border-coffee-700 cursor-pointer hover:border-gold-500 transition-colors text-coffee-600 dark:text-coffee-400 text-sm">
                  <ImagePlus size={18} />
                  {newProdImage ? 'تغيير الصورة' : 'إضافة صورة (اختياري)'}
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleNewImageSelect} 
                  />
                </label>
                {newProdImagePreview && (
                  <div className="relative">
                    <img src={newProdImagePreview} alt="preview" className="w-14 h-14 object-cover rounded-xl border border-coffee-200 dark:border-coffee-800" />
                    <button 
                      onClick={() => { setNewProdImage(null); setNewProdImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      className="absolute -top-2 -left-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
                <button onClick={handleAddProduct} disabled={loading} className="bg-coffee-800 hover:bg-coffee-900 text-white px-6 py-3 rounded-xl font-bold transition-colors flex justify-center items-center gap-2 mr-auto">
                  {uploadingImage ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />} إضافة
                </button>
              </div>
            </div>
          </div>

          {/* Products Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map(prod => {
              const cat = categories.find(c => c.id === prod.category_id);
              const isEditing = editingProduct?.id === prod.id;

              return (
                <div key={prod.id} className="bg-white dark:bg-coffee-950 rounded-2xl shadow-sm border border-coffee-100 dark:border-coffee-900 overflow-hidden flex flex-col">
                  {/* Image */}
                  {isEditing ? (
                    <div className="relative h-40 bg-coffee-100 dark:bg-coffee-900 flex items-center justify-center">
                      {(editImagePreview || editingProduct.image_url) ? (
                        <img src={editImagePreview || editingProduct.image_url || ''} alt="edit preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImagePlus className="text-coffee-400" size={32} />
                      )}
                      <label className="absolute bottom-2 left-2 bg-coffee-800/80 text-white text-xs px-3 py-1.5 rounded-lg cursor-pointer hover:bg-coffee-900/90 transition-colors flex items-center gap-1">
                        <ImagePlus size={12} /> تغيير
                        <input ref={editFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleEditImageSelect} />
                      </label>
                    </div>
                  ) : (
                    <div className="h-40 bg-coffee-100 dark:bg-coffee-900 flex items-center justify-center overflow-hidden">
                      {prod.image_url ? (
                        <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-coffee-400">
                          <ImagePlus size={28} />
                          <span className="text-xs">لا توجد صورة</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-4 flex-1 flex flex-col gap-3">
                    {isEditing ? (
                      <>
                        <input 
                          type="text" 
                          className="w-full p-2 border border-gold-500 rounded-lg outline-none bg-transparent text-coffee-950 dark:text-coffee-100 font-bold"
                          value={editingProduct.name}
                          onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
                        />
                        <input 
                          type="number" 
                          className="w-full p-2 border border-gold-500 rounded-lg outline-none bg-transparent text-coffee-900 dark:text-white"
                          value={editingProduct.price}
                          onChange={e => setEditingProduct({...editingProduct, price: Number(e.target.value)})}
                        />
                        <div className="flex gap-2 mt-auto">
                          <button onClick={handleUpdateProduct} disabled={loading} className="flex-1 text-green-600 hover:text-green-800 p-2 bg-green-50 dark:bg-green-900/30 rounded-lg font-bold text-sm flex items-center justify-center gap-1">
                            {uploadingImage ? <Loader2 className="animate-spin" size={14} /> : null} حفظ
                          </button>
                          <button onClick={() => { setEditingProduct(null); setEditImageFile(null); setEditImagePreview(null); }} className="p-2 bg-coffee-100 dark:bg-coffee-800/50 rounded-lg text-coffee-500"><X size={18} /></button>
                        </div>
                      </>
                    ) : (
                      <>
                        <h3 className="font-bold text-coffee-900 dark:text-coffee-100 text-base leading-tight">{prod.name}</h3>
                        <span className="text-xs text-coffee-500 dark:text-coffee-400">{cat?.name || 'غير معروف'}</span>
                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-coffee-100 dark:border-coffee-900">
                          <span className="text-lg font-bold text-gold-500">{prod.price} <span className="text-xs text-coffee-500 font-normal">ج.م</span></span>
                          <div className="flex gap-2">
                            <button onClick={() => { setEditingProduct(prod); setEditImageFile(null); setEditImagePreview(null); }} className="text-blue-500 hover:text-blue-700 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg"><Pencil size={16} /></button>
                            <button onClick={() => handleDeleteProduct(prod.id)} className="text-red-500 hover:text-red-700 p-2 bg-red-50 dark:bg-red-950/30 rounded-lg"><Trash2 size={16} /></button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {products.length === 0 && <p className="p-8 text-center text-coffee-500 bg-white dark:bg-coffee-950 rounded-2xl border border-coffee-100 dark:border-coffee-900">لا يوجد منتجات حالياً</p>}
        </div>
      )}
    </div>
  );
}
