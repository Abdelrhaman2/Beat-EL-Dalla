"use client";

import { useState, useEffect } from 'react';
import { addCategory, deleteCategory, addProduct, updateProduct, deleteProduct, importProductsFromCsv } from './actions';
import { Pencil, Trash2, Plus, LogIn, X, Upload } from 'lucide-react';

type Category = { id: string; name: string };
type Product = { id: string; category_id: string; name: string; price: number };

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

  // Edit states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_auth');
    if (saved) {
      setPassword(saved);
      setIsAuthenticated(true);
    }
    // Update local state when props change
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
      await addProduct(newProdCatId, newProdName, Number(newProdPrice), password);
      setNewProdName('');
      setNewProdPrice('');
    });
  };

  const handleUpdateProduct = () => {
    if (!editingProduct) return;
    handleAction(async () => {
      await updateProduct(editingProduct.id, editingProduct.name, editingProduct.price, password);
      setEditingProduct(null);
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
        const headers = headerLine.split(separator).map(h => h.trim().replace(/^[\uFEFF]/, '')); // remove BOM if present

        // Find index of required columns
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
          const priceStr = columns[priceIdx].replace(/[^\d.]/g, ''); // strip potential currency symbol/comma separators
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

      {loading && <div className="text-center text-gold-500 font-bold my-4">جاري التحميل...</div>}

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
          <div className="bg-white dark:bg-coffee-950 p-6 rounded-2xl shadow-sm border border-coffee-100 dark:border-coffee-900">
            <h2 className="text-xl font-bold mb-4 text-coffee-900 dark:text-coffee-100">إضافة منتج جديد</h2>
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
              <button onClick={handleAddProduct} className="bg-coffee-800 hover:bg-coffee-900 text-white px-6 py-3 rounded-xl font-bold transition-colors flex justify-center items-center gap-2">
                <Plus size={20} /> إضافة
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-coffee-950 rounded-2xl shadow-sm border border-coffee-100 dark:border-coffee-900 overflow-hidden">
            <table className="w-full text-right text-coffee-950 dark:text-coffee-100">
              <thead className="bg-coffee-100 dark:bg-coffee-900">
                <tr>
                  <th className="p-4 font-bold text-coffee-900 dark:text-coffee-100">المنتج</th>
                  <th className="p-4 font-bold text-coffee-900 dark:text-coffee-100">السعر</th>
                  <th className="p-4 font-bold text-coffee-900 dark:text-coffee-100">القسم</th>
                  <th className="p-4 font-bold text-coffee-900 dark:text-coffee-100 w-32">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {products.map(prod => {
                  const cat = categories.find(c => c.id === prod.category_id);
                  const isEditing = editingProduct?.id === prod.id;
                  
                  return (
                    <tr key={prod.id} className="border-t border-coffee-50 dark:border-coffee-900/50 hover:bg-coffee-50/50 dark:hover:bg-coffee-900/20">
                      <td className="p-4">
                        {isEditing ? (
                          <input 
                            type="text" 
                            className="w-full p-2 border border-gold-500 rounded-lg outline-none bg-transparent text-coffee-950 dark:text-coffee-100"
                            value={editingProduct.name}
                            onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
                          />
                        ) : prod.name}
                      </td>
                      <td className="p-4 font-bold text-gold-500">
                        {isEditing ? (
                          <input 
                            type="number" 
                            className="w-24 p-2 border border-gold-500 rounded-lg outline-none bg-transparent text-coffee-900 dark:text-white"
                            value={editingProduct.price}
                            onChange={e => setEditingProduct({...editingProduct, price: Number(e.target.value)})}
                          />
                        ) : `${prod.price} ج.م`}
                      </td>
                      <td className="p-4 text-coffee-600 dark:text-coffee-400">{cat?.name || 'غير معروف'}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          {isEditing ? (
                            <>
                              <button onClick={handleUpdateProduct} className="text-green-600 hover:text-green-800 p-2 bg-green-50 dark:bg-green-900/30 rounded-lg font-bold text-sm">حفظ</button>
                              <button onClick={() => setEditingProduct(null)} className="text-coffee-500 hover:text-coffee-700 p-2 bg-coffee-100 dark:bg-coffee-800/50 rounded-lg"><X size={18} /></button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => setEditingProduct(prod)} className="text-blue-500 hover:text-blue-700 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg"><Pencil size={18} /></button>
                              <button onClick={() => handleDeleteProduct(prod.id)} className="text-red-500 hover:text-red-700 p-2 bg-red-50 dark:bg-red-950/30 rounded-lg"><Trash2 size={18} /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {products.length === 0 && <p className="p-8 text-center text-coffee-500">لا يوجد منتجات حالياً</p>}
          </div>
        </div>
      )}
    </div>
  );
}
