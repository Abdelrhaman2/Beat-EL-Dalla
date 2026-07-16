"use server";

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

const ADMIN_SECRET = process.env.ADMIN_PASSWORD || "dalla123";

// Ensure auth
const verifyAuth = (password: string) => {
  if (password !== ADMIN_SECRET) {
    throw new Error("Unauthorized");
  }
};

export async function addCategory(name: string, password: string) {
  verifyAuth(password);
  const { error } = await supabase.from('categories').insert([{ name }]);
  if (error) throw error;
  revalidatePath('/');
  revalidatePath('/admin-dalla-secret');
}

export async function deleteCategory(id: string, password: string) {
  verifyAuth(password);
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
  revalidatePath('/');
  revalidatePath('/admin-dalla-secret');
}

export async function addProduct(categoryId: string, name: string, price: number, password: string) {
  verifyAuth(password);
  const { error } = await supabase.from('products').insert([{ category_id: categoryId, name, price }]);
  if (error) throw error;
  revalidatePath('/');
  revalidatePath('/admin-dalla-secret');
}

export async function updateProduct(id: string, name: string, price: number, password: string) {
  verifyAuth(password);
  const { error } = await supabase.from('products').update({ name, price }).eq('id', id);
  if (error) throw error;
  revalidatePath('/');
  revalidatePath('/admin-dalla-secret');
}

export async function deleteProduct(id: string, password: string) {
  verifyAuth(password);
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
  revalidatePath('/');
  revalidatePath('/admin-dalla-secret');
}

export async function importProductsFromCsv(
  items: { category: string; name: string; price: number }[],
  password: string
) {
  verifyAuth(password);

  if (items.length === 0) return { success: true, count: 0 };

  // 1. Get unique category names
  const uniqueCategoryNames = Array.from(new Set(items.map(i => i.category.trim()).filter(Boolean)));

  // 2. Fetch existing categories
  const { data: existingCategories, error: fetchCatError } = await supabase
    .from('categories')
    .select('id, name');
  if (fetchCatError) throw fetchCatError;

  const existingMap = new Map(existingCategories.map(c => [c.name.trim(), c.id]));

  // 3. Find missing categories and insert them
  const newCategoriesToInsert = uniqueCategoryNames
    .filter(name => !existingMap.has(name))
    .map(name => ({ name }));

  if (newCategoriesToInsert.length > 0) {
    const { error: insertCatError } = await supabase
      .from('categories')
      .insert(newCategoriesToInsert);
    if (insertCatError) throw insertCatError;
  }

  // 4. Re-fetch all categories to map all names to IDs
  const { data: allCategories, error: fetchAllCatError } = await supabase
    .from('categories')
    .select('id, name');
  if (fetchAllCatError) throw fetchAllCatError;

  const categoryMap = new Map(allCategories.map(c => [c.name.trim(), c.id]));

  // 5. Prepare products list for bulk insert
  const productsToInsert = items.map(item => {
    const categoryId = categoryMap.get(item.category.trim());
    return {
      category_id: categoryId,
      name: item.name.trim(),
      price: item.price
    };
  }).filter(p => p.category_id && p.name && !isNaN(p.price));

  // 6. Bulk insert products
  if (productsToInsert.length > 0) {
    const { error: insertProdError } = await supabase
      .from('products')
      .insert(productsToInsert);
    if (insertProdError) throw insertProdError;
  }

  revalidatePath('/');
  revalidatePath('/admin-dalla-secret');

  return { success: true, count: productsToInsert.length };
}
