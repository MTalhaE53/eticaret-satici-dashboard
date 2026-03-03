// ============================================================
// content/dashboard.js — Dashboard Sayfası Content Script
// ============================================================
// Dashboard'da oturum açıldığında seller_id'yi otomatik olarak
// Chrome extension storage'a kaydeder.
// Dashboard'da oturum kapatıldığında extension'ı da temizler.
// ============================================================

(function () {
    let lastSellerId = null;

    function syncSellerData() {
        const el = document.getElementById('__extension_data');

        if (el) {
            // Oturum açık — seller verisini extension'a aktar
            const sellerId = el.dataset.sellerId;
            const storeName = el.dataset.storeName;

            if (sellerId && sellerId !== lastSellerId) {
                lastSellerId = sellerId;
                chrome.storage.local.set({
                    seller_id: sellerId,
                    store_name: storeName || 'Mağazam',
                }, () => {
                    console.log('[E-Ticaret Extension] Seller ID senkronize edildi:', sellerId);
                });
            }
        } else if (lastSellerId !== null) {
            // Element kaldırıldı → Dashboard'dan çıkış yapıldı
            lastSellerId = null;
            chrome.storage.local.remove(['seller_id', 'store_name'], () => {
                console.log('[E-Ticaret Extension] Dashboard çıkışı algılandı, extension temizlendi.');
            });
        }
    }

    // Sayfa yüklendiğinde kontrol
    syncSellerData();

    // DOM değişikliklerini dinle (SPA navigasyonları için)
    const observer = new MutationObserver(() => syncSellerData());
    observer.observe(document.body, { childList: true, subtree: true });

    // Yedek: her 2 saniyede kontrol
    setInterval(syncSellerData, 2000);
})();
