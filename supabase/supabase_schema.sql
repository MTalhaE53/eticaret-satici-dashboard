-- ============================================================
-- E-Ticaret Satıcı Dashboard - Supabase Veritabanı Şeması
-- ============================================================
-- Bu dosyayı Supabase SQL Editor'da çalıştırarak tabloları
-- ve RLS politikalarını oluşturabilirsiniz.
-- ============================================================

-- =====================
-- 1. ENUM TİPLERİ
-- =====================

-- Desteklenen pazaryeri platformları
CREATE TYPE platform_type AS ENUM ('trendyol', 'hepsiburada');

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

-- =====================
-- 2. SELLERS (Satıcılar)
-- =====================
CREATE TABLE sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_name TEXT NOT NULL,                          -- Mağaza adı
  platform platform_type NOT NULL,                   -- Hangi pazaryeri
  platform_seller_id TEXT,                           -- Platformdaki satıcı ID
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Hızlı sorgu için index
CREATE INDEX idx_sellers_auth_user ON sellers(auth_user_id);
CREATE INDEX idx_sellers_platform ON sellers(platform);

-- =====================
-- 3. ORDERS (Siparişler)
-- =====================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  platform platform_type NOT NULL,
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

  -- Aynı platformdan aynı sipariş bir daha eklenmesin
  UNIQUE(platform, platform_order_id, seller_id)
);

CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_date ON orders(order_date DESC);

-- =====================
-- 4. ORDER_ITEMS (Sipariş Kalemleri)
-- =====================
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,                        -- Ürün adı
  product_sku TEXT,                                  -- Stok kodu (SKU)
  quantity INTEGER NOT NULL DEFAULT 1,               -- Adet
  unit_price DECIMAL(12, 2) NOT NULL DEFAULT 0,      -- Birim fiyat
  total_price DECIMAL(12, 2) NOT NULL DEFAULT 0,     -- Toplam fiyat (adet * birim)
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_seller ON order_items(seller_id);

-- =====================
-- 5. RETURNS (İadeler)
-- =====================
CREATE TABLE returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  platform platform_type NOT NULL,
  platform_return_id TEXT,                           -- Platformdaki iade ID
  reason TEXT,                                       -- İade sebebi
  refund_amount DECIMAL(12, 2) DEFAULT 0,            -- İade tutarı
  status return_status NOT NULL DEFAULT 'talep_edildi',
  return_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_returns_seller ON returns(seller_id);
CREATE INDEX idx_returns_order ON returns(order_id);
CREATE INDEX idx_returns_status ON returns(status);

-- =====================
-- 6. REVIEWS (Yorumlar)
-- =====================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  platform platform_type NOT NULL,
  platform_review_id TEXT,                           -- Platformdaki yorum ID
  product_name TEXT NOT NULL,                        -- Ürün adı
  product_sku TEXT,                                  -- Ürün SKU
  customer_name TEXT,                                -- Yorum yapan müşteri
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),  -- Puan (1-5)
  comment TEXT,                                      -- Yorum metni
  review_date TIMESTAMPTZ NOT NULL,
  is_replied BOOLEAN DEFAULT false,                  -- Yanıtlandı mı?
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Aynı yorum tekrar eklenmesin
  UNIQUE(platform, platform_review_id, seller_id)
);

CREATE INDEX idx_reviews_seller ON reviews(seller_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_date ON reviews(review_date DESC);

-- =====================
-- 7. STOCK (Stok Durumu)
-- =====================
CREATE TABLE stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  platform platform_type NOT NULL,
  product_name TEXT NOT NULL,                        -- Ürün adı
  product_sku TEXT,                                  -- Ürün SKU
  barcode TEXT,                                      -- Barkod
  quantity INTEGER NOT NULL DEFAULT 0,               -- Mevcut stok
  price DECIMAL(12, 2) DEFAULT 0,                    -- Satış fiyatı
  is_active BOOLEAN DEFAULT true,                    -- Aktif mi?
  last_synced_at TIMESTAMPTZ DEFAULT now(),          -- Son senkron zamanı
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Aynı ürün bir satıcıda tekrar olmasın
  UNIQUE(seller_id, platform, product_sku)
);

CREATE INDEX idx_stock_seller ON stock(seller_id);
CREATE INDEX idx_stock_sku ON stock(product_sku);
CREATE INDEX idx_stock_active ON stock(is_active);

-- =====================
-- 8. updated_at OTOMATİK GÜNCELLEME
-- =====================
-- Her UPDATE'te updated_at alanını otomatik günceller
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'ları tüm tablolara uygula
CREATE TRIGGER set_updated_at_sellers
  BEFORE UPDATE ON sellers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_orders
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_returns
  BEFORE UPDATE ON returns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_stock
  BEFORE UPDATE ON stock
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================
-- 9. ROW LEVEL SECURITY (RLS)
-- =====================
-- Her satıcı sadece kendi verisini görebilsin

ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;

-- Satıcılar: Kullanıcı sadece kendi satıcı kaydını görsün
CREATE POLICY "Satıcı kendi kaydını görür"
  ON sellers FOR ALL
  USING (auth_user_id = auth.uid());

-- Siparişler: Satıcı sadece kendi siparişlerini görsün
CREATE POLICY "Satıcı kendi siparişlerini görür"
  ON orders FOR ALL
  USING (seller_id IN (SELECT id FROM sellers WHERE auth_user_id = auth.uid()));

-- Sipariş Kalemleri
CREATE POLICY "Satıcı kendi sipariş kalemlerini görür"
  ON order_items FOR ALL
  USING (seller_id IN (SELECT id FROM sellers WHERE auth_user_id = auth.uid()));

-- İadeler
CREATE POLICY "Satıcı kendi iadelerini görür"
  ON returns FOR ALL
  USING (seller_id IN (SELECT id FROM sellers WHERE auth_user_id = auth.uid()));

-- Yorumlar
CREATE POLICY "Satıcı kendi yorumlarını görür"
  ON reviews FOR ALL
  USING (seller_id IN (SELECT id FROM sellers WHERE auth_user_id = auth.uid()));

-- Stok
CREATE POLICY "Satıcı kendi stoğunu görür"
  ON stock FOR ALL
  USING (seller_id IN (SELECT id FROM sellers WHERE auth_user_id = auth.uid()));
