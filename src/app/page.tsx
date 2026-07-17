import { supabase } from '@/lib/supabase';
import MenuClient from './MenuClient';
import FacebookPrompt from './FacebookPrompt';

// Force dynamic rendering to always get the latest prices, or use revalidate.
// We'll use revalidate = 0 to ensure it's always up to date for now.
export const revalidate = 0;

export default async function Home() {
  const { data: categories } = await supabase.from('categories').select('*').order('created_at', { ascending: true });
  const { data: products } = await supabase.from('products').select('*').order('created_at', { ascending: true });

  return (
    <main className="min-h-screen bg-transparent relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-coffee-800/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-gold-500/10 blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 py-12 relative z-10 max-w-2xl">
        <header className="text-center mb-8 flex flex-col items-center">
          <img 
            src="/images/logo.webp" 
            alt="بيت الدالة Logo" 
            className="w-24 h-24 rounded-full border-2 border-gold-500 shadow-md object-cover mb-4"
          />
          <h1 className="text-3xl md:text-4xl font-black text-coffee-900 dark:text-coffee-100 mb-2 tracking-tight">
            بيت الدالة
          </h1>
          <p className="text-coffee-600 dark:text-coffee-300 text-sm font-medium">
            قائمة الأسعار والمنتجات
          </p>
          <div className="w-16 h-1 bg-gold-500 mt-4 rounded-full opacity-70" />
        </header>

        <MenuClient categories={categories || []} products={products || []} />
      </div>

      {/* Smart Facebook Follow Prompt */}
      <FacebookPrompt />
    </main>
  );
}
