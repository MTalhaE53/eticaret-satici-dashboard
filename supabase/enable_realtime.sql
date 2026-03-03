-- ============================================================
-- Supabase Realtime Etkinleştirme
-- ============================================================
-- Dashboard'un anlık güncelleme alabilmesi için tabloları
-- Supabase Realtime'a ekleyin. Bu SQL'i SQL Editor'da çalıştırın.
-- ============================================================

-- Tabloları Realtime yayınına (publication) ekle
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE reviews;
ALTER PUBLICATION supabase_realtime ADD TABLE stock;
ALTER PUBLICATION supabase_realtime ADD TABLE returns;

-- Doğrulama: Hangi tablolar realtime'da?
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
