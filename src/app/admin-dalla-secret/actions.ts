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

export async function addProduct(categoryId: string, name: string, price: number, password: string, imageUrl?: string) {
  verifyAuth(password);
  const insertData: Record<string, unknown> = { category_id: categoryId, name, price };
  if (imageUrl) insertData.image_url = imageUrl;
  const { error } = await supabase.from('products').insert([insertData]);
  if (error) throw error;
  revalidatePath('/');
  revalidatePath('/admin-dalla-secret');
}

export async function updateProduct(id: string, name: string, price: number, password: string, imageUrl?: string | null) {
  verifyAuth(password);
  const updateData: Record<string, unknown> = { name, price };
  if (imageUrl !== undefined) updateData.image_url = imageUrl;
  const { error } = await supabase.from('products').update(updateData).eq('id', id);
  if (error) throw error;
  revalidatePath('/');
  revalidatePath('/admin-dalla-secret');
}

export async function deleteProduct(id: string, password: string) {
  verifyAuth(password);
  // Get product to find its image
  const { data: product } = await supabase.from('products').select('image_url').eq('id', id).single();
  
  // Delete from storage if image exists
  if (product?.image_url) {
    const url = product.image_url as string;
    const pathMatch = url.split('/product-images/');
    if (pathMatch[1]) {
      await supabase.storage.from('product-images').remove([pathMatch[1]]);
    }
  }
  
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
  revalidatePath('/');
  revalidatePath('/admin-dalla-secret');
}

export async function uploadProductImage(formData: FormData, password: string) {
  verifyAuth(password);
  
  const file = formData.get('file') as File;
  if (!file) throw new Error('لم يتم اختيار ملف');

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(fileName, file, { cacheControl: '3600', upsert: false });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('product-images')
    .getPublicUrl(fileName);

  return publicUrl;
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
