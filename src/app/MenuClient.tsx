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

      {/* Products List */}
      <div className="mt-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategoryId}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-4"
          >
            {filteredProducts.length === 0 ? (
              <p className="text-center text-coffee-400 py-12 bg-white/5 rounded-2xl border border-dashed border-white/10">
                لا يوجد منتجات في هذا القسم حالياً
              </p>
            ) : (
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
