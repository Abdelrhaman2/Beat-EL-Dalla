import { supabase } from '@/lib/supabase';
import AdminClient from './AdminClient';

export const revalidate = 0;

export default async function AdminPage() {
  const { data: categories } = await supabase.from('categories').select('*').order('created_at', { ascending: true });
  const { data: products } = await supabase.from('products').select('*').order('created_at', { ascending: true });

  return (
    <main className="min-h-screen bg-background">
      <AdminClient initialCategories={categories || []} initialProducts={products || []} />
    </main>
  );
}
