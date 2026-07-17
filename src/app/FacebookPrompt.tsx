"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FB_URL = "https://www.facebook.com/profile.php?id=61580341077698";
const STORAGE_KEY = "dalla_fb_dismissed";

const FacebookIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

export default function FacebookPrompt() {
  const [showModal, setShowModal] = useState(false);
  const [dismissed, setDismissed] = useState(true); // start true to avoid flash

  useEffect(() => {
    const wasDismissed = localStorage.getItem(STORAGE_KEY);
    if (wasDismissed) {
      setDismissed(true);
      return;
    }
    setDismissed(false);

    // Show modal after 4 seconds of browsing
    const timer = setTimeout(() => {
      setShowModal(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setShowModal(false);
    localStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  };

  const handleFollow = () => {
    window.open(FB_URL, "_blank", "noopener,noreferrer");
    handleDismiss();
  };

  return (
    <>
      {/* Floating Action Button — always visible */}
      <a
        href={FB_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 left-5 z-40 group"
      >
        <span className="absolute inset-0 rounded-full bg-[#1877F2] animate-ping opacity-20 group-hover:opacity-30" />
        <span className="relative flex items-center justify-center w-14 h-14 rounded-full bg-[#1877F2] shadow-lg shadow-[#1877F2]/30 hover:shadow-[#1877F2]/50 hover:scale-110 transition-all duration-300 text-white">
          <FacebookIcon className="w-6 h-6" />
        </span>
      </a>

      {/* One-time Welcome Modal */}
      <AnimatePresence>
        {showModal && !dismissed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          >
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleDismiss}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-sm bg-gradient-to-br from-coffee-950 to-[#1a1210] rounded-3xl overflow-hidden shadow-2xl border border-coffee-800/50"
            >
              {/* Decorative top gradient */}
              <div className="h-2 bg-gradient-to-r from-[#1877F2] via-gold-500 to-[#1877F2]" />
              
              <div className="p-7 text-center">
                {/* Logo + Facebook icon combo */}
                <div className="flex items-center justify-center gap-3 mb-5">
                  <img src="/images/logo.webp" alt="Logo" className="w-14 h-14 rounded-full border-2 border-gold-500/50 object-cover" />
                  <div className="flex items-center justify-center w-8 h-8 text-coffee-500">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="w-14 h-14 rounded-full bg-[#1877F2] flex items-center justify-center shadow-lg shadow-[#1877F2]/30">
                    <FacebookIcon className="w-7 h-7 text-white" />
                  </div>
                </div>

                <h3 className="text-xl font-black text-white mb-2">
                  تابعنا على فيسبوك
                </h3>
                <p className="text-coffee-400 text-sm leading-relaxed mb-6">
                  تابع صفحة <span className="text-gold-400 font-bold">بيت الدالة</span> لمعرفة أحدث العروض والمنتجات الجديدة أول بأول
                </p>

                {/* Follow Button */}
                <button
                  onClick={handleFollow}
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold text-base flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#1877F2]/25"
                >
                  <FacebookIcon className="w-5 h-5" />
                  متابعة الصفحة
                </button>

                {/* Dismiss */}
                <button
                  onClick={handleDismiss}
                  className="mt-4 text-coffee-600 hover:text-coffee-400 text-xs transition-colors"
                >
                  ليس الآن
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
