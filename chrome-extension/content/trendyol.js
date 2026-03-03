// ============================================================
// content/trendyol.js - Trendyol Partner Content Script
// ============================================================
// Trendyol satıcı panelinde (partner.trendyol.com) çalışır.
// Sayfa yüklendiğinde sipariş, yorum ve stok verilerini
// DOM'dan veya XHR/Fetch interception ile okur ve
// background.js'e mesaj olarak gönderir.
// ============================================================

(function () {
    'use strict';

    const PLATFORM = 'trendyol';

    console.log('[E-Ticaret Dashboard] Trendyol content script yüklendi.');

    // =====================
    // SAYFA TESPİTİ
    // =====================
    // URL'e göre hangi sayfada olduğumuzu belirle
    function detectPage() {
        const url = window.location.href;

        if (url.includes('/orders') || url.includes('/siparis')) {
            return 'orders';
        } else if (url.includes('/reviews') || url.includes('/yorumlar')) {
            return 'reviews';
        } else if (url.includes('/products') || url.includes('/urunler')) {
            return 'stock';
        } else if (url.includes('/returns') || url.includes('/iadeler')) {
            return 'returns';
        }

        return null;
    }

    // =====================
    // XHR/FETCH INTERCEPTION
    // =====================
    // Trendyol'un kendi API çağrılarını yakalayarak veri topla
    // Bu yöntem DOM parsing'e göre daha güvenilirdir.

    const originalFetch = window.fetch;

    window.fetch = async function (...args) {
        const response = await originalFetch.apply(this, args);

        try {
            const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;

            // Sipariş API'sini yakala
            if (url && url.includes('/api/orders')) {
                const clonedResponse = response.clone();
                const data = await clonedResponse.json();
                handleOrdersData(data);
            }

            // Yorum API'sini yakala
            if (url && url.includes('/api/reviews')) {
                const clonedResponse = response.clone();
                const data = await clonedResponse.json();
                handleReviewsData(data);
            }

            // Ürün/Stok API'sini yakala
            if (url && url.includes('/api/products')) {
                const clonedResponse = response.clone();
                const data = await clonedResponse.json();
                handleStockData(data);
            }
        } catch (e) {
            // API yakalama hatası — sessizce devam et
            console.debug('[E-Ticaret Dashboard] Fetch interception hatası:', e.message);
        }

        return response;
    };

    // =====================
    // VERİ İŞLEME
    // =====================

    /**
     * Sipariş verilerini işle ve background'a gönder
     * @param {Object} rawData - Trendyol API'den gelen ham veri
     */
    function handleOrdersData(rawData) {
        try {
            // Trendyol'un API yanıt formatına göre düzenle
            // NOT: Gerçek API formatı farklı olabilir, burada genel bir yapı kullanıyoruz
            const orders = (rawData.content || rawData.data || []).map((order) => ({
                orderId: order.orderNumber || order.id,
                customerName: order.customerFirstName
                    ? `${order.customerFirstName} ${order.customerLastName || ''}`
                    : null,
                totalAmount: order.totalPrice || order.grossAmount || 0,
                commission: order.commissionAmount || 0,
                status: mapTrendyolStatus(order.status),
                orderDate: order.orderDate || order.createdDate,
                trackingNumber: order.cargoTrackingNumber || null,
                cargoCompany: order.cargoProviderName || null,
            }));

            if (orders.length > 0) {
                sendToBackground('SYNC_ORDERS', { platform: PLATFORM, orders });
                console.log(`[E-Ticaret Dashboard] ${orders.length} Trendyol siparişi yakalandı.`);
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
            const reviews = (rawData.content || rawData.data || []).map((review) => ({
                reviewId: review.id || review.reviewId,
                productName: review.productName || review.productTitle || 'Bilinmiyor',
                sku: review.sku || review.stockCode || null,
                customerName: review.customerName || null,
                rating: review.rate || review.rating || 0,
                comment: review.comment || review.text || null,
                reviewDate: review.createdDate || review.reviewDate,
            }));

            if (reviews.length > 0) {
                sendToBackground('SYNC_REVIEWS', { platform: PLATFORM, reviews });
                console.log(`[E-Ticaret Dashboard] ${reviews.length} Trendyol yorumu yakalandı.`);
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
            const products = (rawData.content || rawData.data || []).map((product) => ({
                name: product.title || product.name || 'Bilinmiyor',
                sku: product.stockCode || product.sku,
                barcode: product.barcode || null,
                quantity: product.quantity || product.stockCount || 0,
                price: product.salePrice || product.listPrice || 0,
                isActive: product.onSale !== false && product.approved !== false,
            }));

            if (products.length > 0) {
                sendToBackground('SYNC_STOCK', { platform: PLATFORM, products });
                console.log(`[E-Ticaret Dashboard] ${products.length} Trendyol ürün stoğu yakalandı.`);
            }
        } catch (e) {
            console.error('[E-Ticaret Dashboard] Stok işleme hatası:', e);
        }
    }

    // =====================
    // YARDIMCI FONKSİYONLAR
    // =====================

    /**
     * Trendyol sipariş durumunu standart formata çevir
     */
    function mapTrendyolStatus(status) {
        const statusMap = {
            Created: 'yeni',
            Picking: 'hazirlaniyor',
            Invoiced: 'hazirlaniyor',
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
     * @param {string} type - Mesaj tipi
     * @param {Object} data - Gönderilecek veri
     */
    function sendToBackground(type, data) {
        // Seller ID'yi storage'dan al ve mesajla birlikte gönder
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

    // =====================
    // BAŞLANGIÇ
    // =====================
    // İlk sayfa yüklemesinde tespit yap
    const currentPage = detectPage();
    if (currentPage) {
        console.log(`[E-Ticaret Dashboard] Trendyol ${currentPage} sayfası tespit edildi.`);
    }
})();
