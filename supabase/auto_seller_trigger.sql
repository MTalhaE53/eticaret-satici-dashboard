-- ============================================================
-- Otomatik Satıcı Kaydı — Supabase SQL Editor'da çalıştırın
-- ============================================================
-- Yeni bir kullanıcı kayıt olduğunda otomatik olarak sellers
-- tablosuna kayıt oluşturur.
-- ============================================================

-- Trigger fonksiyonu: auth.users'a INSERT olunca sellers'a kayıt ekle
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

-- Trigger: Yeni kullanıcı eklenince tetikle
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- sellers tablosunda auth_user_id FK'yı geri ekle (artık null olabilir ama FK olsun)
-- Önce varsa kaldıralım, sonra nullable olarak ekleyelim
ALTER TABLE sellers DROP CONSTRAINT IF EXISTS sellers_auth_user_id_fkey;
ALTER TABLE sellers
  ADD CONSTRAINT sellers_auth_user_id_fkey
  FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
