// ============================================================
// popup/popup.js — Popup Mantığı (Sadeleştirilmiş)
// ============================================================

const SUPABASE_URL = 'https://skxdxevzrovtkkaxtmno.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNreGR4ZXZ6cm92dGtrYXh0bW5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwMDI3NDAsImV4cCI6MjA1NjU3ODc0MH0.sb_publishable_thBzmqtUeEGIvF9IDIDIPA_JVjHR19u';

document.addEventListener('DOMContentLoaded', () => {
    const loginPrompt = document.getElementById('loginPrompt');
    const dashboardContent = document.getElementById('dashboardContent');
    const storeAvatar = document.getElementById('storeAvatar');
    const storeNameEl = document.getElementById('storeName');
    const syncOrders = document.getElementById('syncOrders');
    const syncReviews = document.getElementById('syncReviews');
    const syncStock = document.getElementById('syncStock');
    const syncReturns = document.getElementById('syncReturns');
    const btnGoLogin = document.getElementById('btnGoLogin');
    const btnVisit = document.getElementById('btnVisit');
    const btnLogout = document.getElementById('btnLogout');

    function getDashboardUrl(cb) {
        chrome.storage.local.get('dashboard_url', (r) => {
            cb(r.dashboard_url || 'http://localhost:3200');
        });
    }

    // =====================
    // EKRAN DURUMU
    // =====================
    function checkLoginState() {
        chrome.storage.local.get(['seller_id', 'store_name'], (result) => {
            if (result.seller_id) {
                loginPrompt.style.display = 'none';
                dashboardContent.classList.add('visible');
                if (result.store_name) showStoreName(result.store_name);
                fetchStoreName(result.seller_id);
                loadSyncStatus();
            } else {
                loginPrompt.style.display = 'block';
                dashboardContent.classList.remove('visible');
            }
        });
    }

    function showStoreName(name) {
        storeNameEl.textContent = name;
        storeAvatar.textContent = name.charAt(0).toUpperCase();
    }

    async function fetchStoreName(sellerId) {
        try {
            const res = await fetch(
                `${SUPABASE_URL}/rest/v1/sellers?id=eq.${sellerId}&select=store_name`,
                { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } }
            );
            const data = await res.json();
            if (data?.[0]?.store_name) {
                showStoreName(data[0].store_name);
                chrome.storage.local.set({ store_name: data[0].store_name });
            }
        } catch (e) { /* ignore */ }
    }

    function loadSyncStatus() {
        chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response) => {
            if (response?.success && response.data) {
                syncOrders.textContent = formatTime(response.data.lastSync_orders);
                syncReviews.textContent = formatTime(response.data.lastSync_reviews);
                syncStock.textContent = formatTime(response.data.lastSync_stock);
                syncReturns.textContent = formatTime(response.data.lastSync_returns);
            }
        });
    }

    function formatTime(iso) {
        if (!iso) return 'Henüz senkron yok';
        const diff = Math.floor((Date.now() - new Date(iso)) / 60000);
        if (diff < 1) return 'Az önce';
        if (diff < 60) return `${diff} dk önce`;
        if (diff < 1440) return `${Math.floor(diff / 60)} saat önce`;
        return new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    }

    // =====================
    // BUTONLAR
    // =====================
    btnGoLogin.addEventListener('click', () => {
        getDashboardUrl((url) => chrome.tabs.create({ url: url + '/giris' }));
    });

    btnVisit.addEventListener('click', () => {
        getDashboardUrl((url) => chrome.tabs.create({ url }));
    });

    btnLogout.addEventListener('click', async () => {
        const result = await new Promise(r => chrome.storage.local.get('dashboard_url', r));
        const dashUrl = result.dashboard_url || 'http://localhost:3200';

        chrome.tabs.query({}, (tabs) => {
            tabs.forEach((tab) => {
                if (tab.url && tab.url.startsWith(dashUrl)) {
                    chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: () => {
                            Object.keys(localStorage).forEach(k => { if (k.startsWith('sb-')) localStorage.removeItem(k); });
                            window.location.href = '/giris';
                        },
                    }).catch(() => { });
                }
            });
        });

        chrome.storage.local.remove(['seller_id', 'store_name'], () => checkLoginState());
    });

    checkLoginState();
});
