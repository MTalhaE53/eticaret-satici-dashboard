// ============================================================
// content/hepsiburada.js - Hepsiburada Merchant Content Script
// ============================================================
// Hepsiburada satıcı panelinde (merchant.hepsiburada.com)
// çalışır. Sipariş, yorum ve stok verilerini okuyarak
// background.js'e gönderir.
// ============================================================

(function () {
    'use strict';

    const PLATFORM = 'hepsiburada';

    console.log('[E-Ticaret Dashboard] Hepsiburada content script yüklendi.');

    // =====================
    // XHR/FETCH INTERCEPTION
    // =====================
    // Hepsiburada'nın API çağrılarını yakala

    const originalFetch = window.fetch;

    window.fetch = async function (...args) {
        const response = await originalFetch.apply(this, args);

        try {
            const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;

            // Sipariş API'sini yakala
            if (url && (url.includes('/orders') || url.includes('/listing/order'))) {
                const clonedResponse = response.clone();
                const data = await clonedResponse.json();
                handleOrdersData(data);
            }

            // Yorum API'sini yakala
            if (url && (url.includes('/reviews') || url.includes('/product-reviews'))) {
                const clonedResponse = response.clone();
                const data = await clonedResponse.json();
                handleReviewsData(data);
            }

            // Ürün/Stok API'sini yakala
            if (url && (url.includes('/products') || url.includes('/listing/product'))) {
                const clonedResponse = response.clone();
                const data = await clonedResponse.json();
                handleStockData(data);
            }
        } catch (e) {
            console.debug('[E-Ticaret Dashboard] Fetch interception hatası:', e.message);
        }

        return response;
    };

    // =====================
    // VERİ İŞLEME
    // =====================

    /**
     * Sipariş verilerini işle ve background'a gönder
     */
    function handleOrdersData(rawData) {
        try {
            const orders = (rawData.data?.orders || rawData.items || rawData.content || []).map(
                (order) => ({
                    orderId: order.orderNumber || order.id,
                    customerName: order.customerName || order.customer?.name || null,
                    totalAmount: order.totalAmount || order.totalPrice || 0,
                    commission: order.commissionAmount || 0,
                    status: mapHepsiburadaStatus(order.status || order.orderStatus),
                    orderDate: order.orderDate || order.createdDate,
                    trackingNumber: order.trackingNumber || order.cargoTrackingNumber || null,
                    cargoCompany: order.cargoCompany || order.cargoFirmName || null,
                })
            );

            if (orders.length > 0) {
                sendToBackground('SYNC_ORDERS', { platform: PLATFORM, orders });
                console.log(`[E-Ticaret Dashboard] ${orders.length} Hepsiburada siparişi yakalandı.`);
            }
        } catch (e) {
            console.error('[E-Ticaret Dashboard] Sipariş işleme hatası:', e);
        }
    }

    /**
     * Yorum verilerini işle ve background'a gönder
     */
    function handleReviewsData(rawData) {
        try {
            const reviews = (rawData.data?.reviews || rawData.items || rawData.content || []).map(
                (review) => ({
                    reviewId: review.id || review.reviewId,
                    productName: review.productName || 'Bilinmiyor',
                    sku: review.sku || review.hbSku || null,
                    customerName: review.customerName || review.nickName || null,
                    rating: review.star || review.rating || 0,
                    comment: review.review || review.comment || null,
                    reviewDate: review.approveDate || review.createdDate,
                })
            );

            if (reviews.length > 0) {
                sendToBackground('SYNC_REVIEWS', { platform: PLATFORM, reviews });
                console.log(`[E-Ticaret Dashboard] ${reviews.length} Hepsiburada yorumu yakalandı.`);
            }
        } catch (e) {
            console.error('[E-Ticaret Dashboard] Yorum işleme hatası:', e);
        }
    }

    /**
     * Stok/Ürün verilerini işle ve background'a gönder
     */
    function handleStockData(rawData) {
        try {
            const products = (rawData.data?.products || rawData.items || rawData.content || []).map(
                (product) => ({
                    name: product.productName || product.name || 'Bilinmiyor',
                    sku: product.hbSku || product.merchantSku || product.sku,
                    barcode: product.barcode || null,
                    quantity: product.availableStock || product.stock || 0,
                    price: product.price || product.salePrice || 0,
                    isActive: product.isSalable !== false && product.isActive !== false,
                })
            );

            if (products.length > 0) {
                sendToBackground('SYNC_STOCK', { platform: PLATFORM, products });
                console.log(`[E-Ticaret Dashboard] ${products.length} Hepsiburada ürün stoğu yakalandı.`);
            }
        } catch (e) {
            console.error('[E-Ticaret Dashboard] Stok işleme hatası:', e);
        }
    }

    // =====================
    // YARDIMCI FONKSİYONLAR
    // =====================

    /**
     * Hepsiburada sipariş durumunu standart formata çevir
     */
    function mapHepsiburadaStatus(status) {
        const statusMap = {
            Open: 'yeni',
            New: 'yeni',
            Approved: 'hazirlaniyor',
            Picking: 'hazirlaniyor',
            Shipped: 'kargoda',
            Delivered: 'teslim_edildi',
            Cancelled: 'iptal',
            Returned: 'iade',
            UnDelivered: 'iade',
        };
        return statusMap[status] || 'yeni';
    }

    /**
     * Background script'e mesaj gönder
     */
    function sendToBackground(type, data) {
        chrome.storage.local.get('seller_id', (result) => {
            chrome.runtime.sendMessage(
                {
                    type,
                    data: {
                        sellerId: result.seller_id,
                        ...data,
                    },
                },
                (response) => {
                    if (response?.success) {
                        console.log(`[E-Ticaret Dashboard] ${type} başarıyla senkron edildi.`);
                    } else {
                        console.warn(`[E-Ticaret Dashboard] ${type} senkron hatası:`, response?.error);
                    }
                }
            );
        });
    }
})();
