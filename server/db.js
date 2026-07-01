const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in your .env file');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- Menu / stores -----------------------------------------------------

async function getFullMenu() {
  const { data: stores, error: storesErr } = await supabase
    .from('stores')
    .select('*')
    .order('store_id', { ascending: true });
  if (storesErr) throw storesErr;

  const { data: items, error: itemsErr } = await supabase
    .from('menu_items')
    .select('*')
    .eq('is_available', 1);
  if (itemsErr) throw itemsErr;

  return stores.map(store => ({
    ...store,
    items: items.filter(item => item.store_id === store.store_id)
  }));
}

async function setItemSoldOut(storeId, itemName) {
  const { error } = await supabase
    .from('menu_items')
    .update({ is_available: 0 })
    .eq('store_id', storeId)
    .ilike('item_name', itemName);
  if (error) throw error;
}

async function setStoreOpen(storeId, isOpen) {
  const { error } = await supabase
    .from('stores')
    .update({ is_open: isOpen ? 1 : 0 })
    .eq('store_id', storeId);
  if (error) throw error;
}

async function replaceStoreMenu(storeId, items) {
  const { error: delErr } = await supabase
    .from('menu_items')
    .delete()
    .eq('store_id', storeId);
  if (delErr) throw delErr;

  if (items.length === 0) return;

  const rows = items.map(item => ({
    store_id: storeId,
    item_name: item.name,
    price: item.price
  }));

  const { error: insErr } = await supabase.from('menu_items').insert(rows);
  if (insErr) throw insErr;
}

module.exports = {
  supabase,
  getFullMenu,
  setItemSoldOut,
  setStoreOpen,
  replaceStoreMenu
};