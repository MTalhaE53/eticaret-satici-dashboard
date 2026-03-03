-- ============================================================
-- E-Ticaret Satıcı Dashboard - TAM KURULUM (Full Setup)
-- ============================================================
-- Bu dosya tüm tabloları, RLS politikalarını, Realtime ayarlarını
-- ve Auth trigger'larını tek seferde kurmanızı sağlar.
-- ============================================================

-- ============================================================
-- 1. TABLO ŞEMASI VE RLS
-- ============================================================

-- Desteklenen pazaryeri platformları
CREATE TYPE platform_type AS ENUM ('trendyol', 'hepsiburada', 'her_ikisi');

-- Sipariş durumları
CREATE TYPE order_status AS ENUM (
  'yeni',           -- Yeni gelen sipariş
  'hazirlaniyor',   -- Hazırlanıyor
  'kargoda',        -- Kargoya verildi
  'teslim_edildi',  -- Teslim edildi
  'iptal',          -- İptal edildi
  'iade'            -- İade edildi
);

-- İade durumları
CREATE TYPE return_status AS ENUM (
  'talep_edildi',   -- İade talebi geldi
  'onaylandi',      -- İade onaylandı
  'reddedildi',     -- İade reddedildi
  'tamamlandi'      -- İade tamamlandı
);

-- SELLERS (Satıcılar)
CREATE TABLE sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_name TEXT NOT NULL,                          -- Mağaza adı
  platform TEXT DEFAULT 'trendyol',                   -- Hangi pazaryeri
  platform_seller_id TEXT,                           -- Platformdaki satıcı ID
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sellers_auth_user ON sellers(auth_user_id);

-- ORDERS (Siparişler)
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  platform_order_id TEXT NOT NULL,                   -- Platformdaki sipariş numarası
  customer_name TEXT,                                -- Müşteri adı
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,    -- Toplam tutar (TL)
  commission_amount DECIMAL(12, 2) DEFAULT 0,        -- Platform komisyonu
  status order_status NOT NULL DEFAULT 'yeni',
  order_date TIMESTAMPTZ NOT NULL,                   -- Sipariş tarihi
  cargo_tracking_number TEXT,                        -- Kargo takip numarası
  cargo_company TEXT,                                -- Kargo firması
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(platform, platform_order_id, seller_id)
);

-- RETURNS (İadeler)
CREATE TABLE returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  platform TEXT NOT NULL,
  platform_return_id TEXT,                           -- Platformdaki iade ID
  reason TEXT,                                       -- İade sebebi
  refund_amount DECIMAL(12, 2) DEFAULT 0,            -- İade tutarı
  status return_status NOT NULL DEFAULT 'talep_edildi',
  return_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- REVIEWS (Yorumlar)
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  platform_review_id TEXT,                           -- Platformdaki yorum ID
  product_name TEXT NOT NULL,                        -- Ürün adı
  product_sku TEXT,                                  -- Ürün SKU
  customer_name TEXT,                                -- Yorum yapan müşteri
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,                                      -- Yorum metni
  review_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(platform, platform_review_id, seller_id)
);

-- STOCK (Stok Durumu)
CREATE TABLE stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  product_name TEXT NOT NULL,                        -- Ürün adı
  product_sku TEXT,                                  -- Ürün SKU
  barcode TEXT,                                      -- Barkod
  quantity INTEGER NOT NULL DEFAULT 0,               -- Mevcut stok
  price DECIMAL(12, 2) DEFAULT 0,                    -- Satış fiyatı
  is_active BOOLEAN DEFAULT true,                    -- Aktif mi?
  last_synced_at TIMESTAMPTZ DEFAULT now(),          -- Son senkron zamanı
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(seller_id, platform, product_sku)
);

-- updated_at OTOMATİK GÜNCELLEME
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_sellers BEFORE UPDATE ON sellers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_orders BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_returns BEFORE UPDATE ON returns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_stock BEFORE UPDATE ON stock FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Satıcı kendi kaydını görür" ON sellers FOR ALL USING (auth_user_id = auth.uid());
CREATE POLICY "Satıcı kendi siparişlerini görür" ON orders FOR ALL USING (seller_id IN (SELECT id FROM sellers WHERE auth_user_id = auth.uid()));
CREATE POLICY "Satıcı kendi iadelerini görür" ON returns FOR ALL USING (seller_id IN (SELECT id FROM sellers WHERE auth_user_id = auth.uid()));
CREATE POLICY "Satıcı kendi yorumlarını görür" ON reviews FOR ALL USING (seller_id IN (SELECT id FROM sellers WHERE auth_user_id = auth.uid()));
CREATE POLICY "Satıcı kendi stoğunu görür" ON stock FOR ALL USING (seller_id IN (SELECT id FROM sellers WHERE auth_user_id = auth.uid()));

-- =====================
-- 2. REALTIME AYARLARI
-- =====================
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE reviews;
ALTER PUBLICATION supabase_realtime ADD TABLE stock;
ALTER PUBLICATION supabase_realtime ADD TABLE returns;

-- =====================
-- 3. AUTH TRIGGER (Otomatik Kayıt)
-- =====================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.sellers (auth_user_id, store_name, platform)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'store_name', 'Mağazam'),
    COALESCE(NEW.raw_user_meta_data->>'platform', 'trendyol')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================
-- 4. TEST VERİSİ (Opsiyonel)
-- =====================
-- Gerçek kullanıcı olmadan test etmek isterseniz RLS'i kapatıp manuel veri ekleyebilirsiniz:
-- ALTER TABLE sellers DISABLE ROW LEVEL SECURITY;
-- INSERT INTO sellers (id, auth_user_id, store_name, platform) VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', NULL, 'Test Mağazası', 'trendyol');
