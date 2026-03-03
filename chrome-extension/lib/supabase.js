// ============================================================
// lib/supabase.js - Supabase Client Wrapper
// ============================================================
// Chrome eklentisi için Supabase bağlantı istemcisi.
// NOT: Supabase URL ve Anon Key değerlerini kendi projenizle
// değiştirin. Bu değerler herkese açıktır (anon key), güvenlik
// Row Level Security (RLS) ile sağlanır.
// ============================================================

// ⚠️ BURAYA KENDİ SUPABASE BİLGİLERİNİZİ GİRİN
const SUPABASE_URL = 'https://skxdxevzrovtkkaxtmno.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_thBzmqtUeEGIvF9IDIDIPA_JVjHR19u';

/**
 * Basit Supabase REST API istemcisi
 * Chrome eklentisinde @supabase/supabase-js kullanmak yerine
 * doğrudan REST API çağrıları yapıyoruz (daha hafif).
 */
class SupabaseClient {
    constructor(url, anonKey) {
        this.url = url;
        this.anonKey = anonKey;
        this.restUrl = `${url}/rest/v1`;
        this.authToken = null; // Kullanıcı giriş yaptığında set edilir
    }

    /**
     * Ortak HTTP headers oluşturur
     */
    _getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            apikey: this.anonKey,
            Authorization: `Bearer ${this.authToken || this.anonKey}`,
        };
        return headers;
    }

    /**
     * Belirtilen tabloya veri ekler
     * @param {string} table - Tablo adı
     * @returns {Object} - Zincirleme method'lar (insert, upsert, select)
     */
    from(table) {
        const self = this;

        return {
            /**
             * Yeni veri ekler
             * @param {Array|Object} data - Eklenecek veri
             */
            async insert(data) {
                const response = await fetch(`${self.restUrl}/${table}`, {
                    method: 'POST',
                    headers: {
                        ...self._getHeaders(),
                        Prefer: 'return=minimal',
                    },
                    body: JSON.stringify(data),
                });

                if (!response.ok) {
                    const errorBody = await response.text();
                    return { data: null, error: new Error(`Insert hatası: ${errorBody}`) };
                }

                return { data: true, error: null };
            },

            /**
             * Veri ekler veya çakışma durumunda günceller (UPSERT)
             * @param {Array|Object} data - Eklenecek/güncellenecek veri
             * @param {Object} options - { onConflict: 'column1,column2' }
             */
            async upsert(data, options = {}) {
                const headers = {
                    ...self._getHeaders(),
                    Prefer: 'return=minimal,resolution=merge-duplicates',
                };

                // Çakışma kolonunu belirt
                let url = `${self.restUrl}/${table}`;
                if (options.onConflict) {
                    url += `?on_conflict=${options.onConflict}`;
                }

                const response = await fetch(url, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(data),
                });

                if (!response.ok) {
                    const errorBody = await response.text();
                    return { data: null, error: new Error(`Upsert hatası: ${errorBody}`) };
                }

                return { data: true, error: null };
            },

            /**
             * Tablodan veri okur
             * @param {string} columns - Seçilecek kolonlar (varsayılan: '*')
             */
            async select(columns = '*') {
                const response = await fetch(`${self.restUrl}/${table}?select=${columns}`, {
                    method: 'GET',
                    headers: self._getHeaders(),
                });

                if (!response.ok) {
                    const errorBody = await response.text();
                    return { data: null, error: new Error(`Select hatası: ${errorBody}`) };
                }

                const result = await response.json();
                return { data: result, error: null };
            },
        };
    }

    /**
     * Auth token'ı ayarlar (kullanıcı giriş yaptıktan sonra)
     * @param {string} token - JWT token
     */
    setAuthToken(token) {
        this.authToken = token;
    }

    /**
     * Auth token'ı chrome.storage'dan yükler
     */
    async loadAuthToken() {
        const result = await chrome.storage.local.get('supabase_auth_token');
        if (result.supabase_auth_token) {
            this.authToken = result.supabase_auth_token;
        }
        return this.authToken;
    }

    /**
     * Auth token'ı chrome.storage'a kaydeder
     * @param {string} token - JWT token
     */
    async saveAuthToken(token) {
        this.authToken = token;
        await chrome.storage.local.set({ supabase_auth_token: token });
    }
}

// Singleton instance oluştur ve dışa aktar
export const supabaseClient = new SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);
