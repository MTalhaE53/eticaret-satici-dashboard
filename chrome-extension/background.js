// ============================================================
// background.js - Service Worker (Manifest V3)
// ============================================================
// Content script'lerden gelen mesajları alır, verileri
// Supabase'e gönderir ve periyodik senkronizasyon yapar.
// ============================================================

import { supabaseClient } from './lib/supabase.js';

// =====================
// MESAJ DİNLEYİCİ
// =====================
// Content script'lerden gelen verileri işle
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log(`[Background] Mesaj alındı: ${message.type}`, message);

  // Async işlem yapacağımız için true döndürüyoruz
  handleMessage(message)
    .then((result) => sendResponse({ success: true, data: result }))
    .catch((error) => {
      console.error(`[Background] Hata:`, error);
      sendResponse({ success: false, error: error.message });
    });

  // true döndürmek async sendResponse kullanmamızı sağlar
  return true;
});

/**
 * Gelen mesajı tipine göre işler
 * @param {Object} message - Content script'ten gelen mesaj
 */
async function handleMessage(message) {
  switch (message.type) {
    case 'SYNC_ORDERS':
      return await syncOrders(message.data);

    case 'SYNC_REVIEWS':
      return await syncReviews(message.data);

    case 'SYNC_STOCK':
      return await syncStock(message.data);

    case 'SYNC_RETURNS':
      return await syncReturns(message.data);

    case 'GET_STATUS':
      return await getSyncStatus();

    default:
      throw new Error(`Bilinmeyen mesaj tipi: ${message.type}`);
  }
}

// =====================
// VERİ SENKRON FONKSİYONLARI
// =====================

/**
 * Siparişleri Supabase'e gönderir (upsert)
 * @param {Object} data - { sellerId, platform, orders: [] }
 */
async function syncOrders({ sellerId, platform, orders }) {
  if (!orders || orders.length === 0) {
    console.log('[Background] Senkron edilecek sipariş yok.');
    return { synced: 0 };
  }

  const formattedOrders = orders.map((order) => ({
    seller_id: sellerId,
    platform: platform,
    platform_order_id: order.orderId,
    customer_name: order.customerName || null,
    total_amount: order.totalAmount || 0,
    commission_amount: order.commission || 0,
    status: order.status || 'yeni',
    order_date: order.orderDate,
    cargo_tracking_number: order.trackingNumber || null,
    cargo_company: order.cargoCompany || null,
  }));

  const { data, error } = await supabaseClient
    .from('orders')
    .upsert(formattedOrders, {
      onConflict: 'platform,platform_order_id,seller_id',
    });

  if (error) throw error;

  // Son senkron zamanını kaydet
  await updateLastSync('orders');

  console.log(`[Background] ${formattedOrders.length} sipariş senkron edildi.`);
  return { synced: formattedOrders.length };
}

/**
 * Yorumları Supabase'e gönderir (upsert)
 * @param {Object} data - { sellerId, platform, reviews: [] }
 */
async function syncReviews({ sellerId, platform, reviews }) {
  if (!reviews || reviews.length === 0) return { synced: 0 };

  const formattedReviews = reviews.map((review) => ({
    seller_id: sellerId,
    platform: platform,
    platform_review_id: review.reviewId,
    product_name: review.productName,
    product_sku: review.sku || null,
    customer_name: review.customerName || null,
    rating: review.rating,
    comment: review.comment || null,
    review_date: review.reviewDate,
  }));

  const { data, error } = await supabaseClient
    .from('reviews')
    .upsert(formattedReviews, {
      onConflict: 'platform,platform_review_id,seller_id',
    });

  if (error) throw error;
  await updateLastSync('reviews');

  console.log(`[Background] ${formattedReviews.length} yorum senkron edildi.`);
  return { synced: formattedReviews.length };
}

/**
 * Stok verilerini Supabase'e gönderir (upsert)
 * @param {Object} data - { sellerId, platform, products: [] }
 */
async function syncStock({ sellerId, platform, products }) {
  if (!products || products.length === 0) return { synced: 0 };

  const formattedStock = products.map((product) => ({
    seller_id: sellerId,
    platform: platform,
    product_name: product.name,
    product_sku: product.sku,
    barcode: product.barcode || null,
    quantity: product.quantity || 0,
    price: product.price || 0,
    is_active: product.isActive !== false,
    last_synced_at: new Date().toISOString(),
  }));

  const { data, error } = await supabaseClient
    .from('stock')
    .upsert(formattedStock, {
      onConflict: 'seller_id,platform,product_sku',
    });

  if (error) throw error;
  await updateLastSync('stock');

  console.log(`[Background] ${formattedStock.length} ürün stoğu senkron edildi.`);
  return { synced: formattedStock.length };
}

/**
 * İade verilerini Supabase'e gönderir
 * @param {Object} data - { sellerId, platform, returns: [] }
 */
async function syncReturns({ sellerId, platform, returns: returnItems }) {
  if (!returnItems || returnItems.length === 0) return { synced: 0 };

  const formattedReturns = returnItems.map((item) => ({
    seller_id: sellerId,
    platform: platform,
    platform_return_id: item.returnId,
    reason: item.reason || null,
    refund_amount: item.refundAmount || 0,
    status: item.status || 'talep_edildi',
    return_date: item.returnDate,
  }));

  const { data, error } = await supabaseClient
    .from('returns')
    .insert(formattedReturns);

  if (error) throw error;
  await updateLastSync('returns');

  console.log(`[Background] ${formattedReturns.length} iade senkron edildi.`);
  return { synced: formattedReturns.length };
}

// =====================
// YARDIMCI FONKSİYONLAR
// =====================

/**
 * Son senkron zamanını chrome.storage'a kaydeder
 * @param {string} dataType - Veri tipi (orders, reviews, stock, returns)
 */
async function updateLastSync(dataType) {
  const key = `lastSync_${dataType}`;
  await chrome.storage.local.set({
    [key]: new Date().toISOString(),
  });
}

/**
 * Tüm senkron durumlarını döndürür
 */
async function getSyncStatus() {
  const result = await chrome.storage.local.get([
    'lastSync_orders',
    'lastSync_reviews',
    'lastSync_stock',
    'lastSync_returns',
  ]);
  return result;
}

// =====================
// PERİYODİK SENKRON (Alarm)
// =====================
// Her 15 dakikada bir çalışan alarm (opsiyonel)
chrome.alarms.create('periodicSync', { periodInMinutes: 15 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'periodicSync') {
    console.log('[Background] Periyodik senkron tetiklendi.');
    // İleride: Aktif tab'a mesaj gönderip veri toplamasını isteyebiliriz
  }
});

// =====================
// KURULUM
// =====================
chrome.runtime.onInstalled.addListener(() => {
  console.log('[E-Ticaret Dashboard] Eklenti kuruldu!');
});
