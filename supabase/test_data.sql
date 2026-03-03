-- ============================================================
-- TEST VERİSİ — Supabase SQL Editor'da çalıştırın
-- ============================================================
-- Bu script, gerçek Auth kullanıcısı olmadan test yapabilmeniz
-- için geçici olarak kısıtlamaları gevşetir ve bir test satıcı oluşturur.
-- ============================================================

-- 1) sellers tablosundaki auth FK kısıtlamasını kaldır (test için)
ALTER TABLE sellers DROP CONSTRAINT IF EXISTS sellers_auth_user_id_fkey;
ALTER TABLE sellers ALTER COLUMN auth_user_id DROP NOT NULL;

-- 2) RLS'yi test süresince devre dışı bırak
ALTER TABLE sellers DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE returns DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE stock DISABLE ROW LEVEL SECURITY;

-- 3) Test satıcı kaydı oluştur
INSERT INTO sellers (id, auth_user_id, store_name, platform, platform_seller_id)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',  -- Bu UUID'yi popup'a girin!
  NULL,
  'Test Mağazası',
  'trendyol',
  'TEST-SELLER-001'
);

-- Oluşturulan satıcıyı doğrula
SELECT * FROM sellers;
