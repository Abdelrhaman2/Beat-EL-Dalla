"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Category = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  category_id: string;
  name: string;
  price: number;
  image_url?: string | null;
};

const slideshowImages = [
  '/images/slideshow/slide1.webp',
  '/images/slideshow/slide2.webp',
  '/images/slideshow/slide3.webp',
  '/images/slideshow/slide4.webp',
  '/images/slideshow/slide5.webp'
];

export default function MenuClient({ categories, products }: { categories: Category[], products: Product[] }) {
  const [activeCategoryId, setActiveCategoryId] = useState<string>('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Set initial category
  useEffect(() => {
    if (categories.length > 0) {
      setActiveCategoryId(categories[0].id);
    }
  }, [categories]);

  // Slideshow interval timer (changes background every 6 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % slideshowImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const activeCategory = categories.find(c => c.id === activeCategoryId);
  const activeCategoryName = activeCategory ? activeCategory.name : '';
  const currentImage = slideshowImages[currentImageIndex];

  const filteredProducts = products.filter(p => p.category_id === activeCategoryId);

  // Check if any product in current category has an image
  const hasAnyImage = filteredProducts.some(p => p.image_url);

  return (
    <div className="flex flex-col gap-6">
      {/* Full-screen Slideshow Background Image with Transition */}
      <div className="fixed inset-0 -z-20 w-full h-full overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentImage}
            src={currentImage}
            alt="Slideshow Background"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 0.22, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full object-cover filter blur-[2px]"
          />
        </AnimatePresence>
        {/* Dark overlay specifically blended for coffee shop aesthetic */}
        <div className="absolute inset-0 bg-[#0c0a08]/85 backdrop-blur-[1px] -z-10" />
      </div>

      {/* Title displaying active category */}
      <div className="text-center py-2">
        <motion.span
          key={activeCategoryId + '-badge'}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs font-bold text-gold-400 bg-gold-500/10 px-3 py-1 rounded-full border border-gold-500/20"
        >
          أصناف بيت الدالة
        </motion.span>
        <motion.h2
          key={activeCategoryName + '-title'}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-2xl font-black text-white mt-2"
        >
          {activeCategoryName || "جاري التحميل..."}
        </motion.h2>
      </div>

      {/* Categories Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-2 -mx-4 px-4 snap-x">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategoryId(category.id)}
            className={`whitespace-nowrap px-6 py-3 rounded-full text-sm font-bold transition-all snap-center relative
              ${activeCategoryId === category.id 
                ? 'text-white' 
                : 'text-coffee-300 hover:text-white bg-white/5 hover:bg-white/10 dark:bg-black/20 dark:hover:bg-black/35 border border-white/5'
              }`}
          >
            {activeCategoryId === category.id && (
              <motion.div
                layoutId="activeCategory"
                className="absolute inset-0 bg-coffee-800 dark:bg-gold-500 rounded-full -z-10"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            {category.name}
          </button>
        ))}
      </div>

      {/* Products */}
      <div className="mt-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategoryId}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className={hasAnyImage 
              ? "grid grid-cols-2 gap-4" 
              : "flex flex-col gap-4"
            }
          >
            {filteredProducts.length === 0 ? (
              <p className="text-center text-coffee-400 py-12 bg-white/5 rounded-2xl border border-dashed border-white/10 col-span-2">
                لا يوجد منتجات في هذا القسم حالياً
              </p>
            ) : hasAnyImage ? (
              /* Card Layout - when products have images */
              filteredProducts.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-2xl overflow-hidden glass-panel bg-white/5 dark:bg-black/20 border border-white/10 flex flex-col"
                >
                  {/* Product Image */}
                  <div className="h-36 bg-coffee-900/50 overflow-hidden relative">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-coffee-700/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    {/* Price badge on image */}
                    <div className="absolute top-2 left-2 bg-coffee-950/70 backdrop-blur-md px-3 py-1 rounded-full border border-gold-500/20">
                      <span className="text-sm font-bold text-gold-400">{product.price}</span>
                      <span className="text-[10px] text-coffee-300 mr-1">ج.م</span>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-3 flex-1 flex items-center">
                    <h3 className="text-sm font-bold text-white leading-tight">{product.name}</h3>
                  </div>
                </motion.div>
              ))
            ) : (
              /* List Layout - when no images */
              filteredProducts.map((product) => (
                <div 
                  key={product.id}
                  className="flex justify-between items-center p-5 rounded-2xl glass-panel bg-white/5 dark:bg-black/20 shadow-sm border border-white/10"
                >
                  <h3 className="text-lg font-bold text-white">{product.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gold-400">{product.price}</span>
                    <span className="text-xs text-coffee-300 font-medium">ج.م</span>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
