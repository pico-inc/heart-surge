-- バケットの作成
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile_images', 'profile_images', true);

-- オブジェクトに対するポリシー
CREATE POLICY "Anyone can view profile images"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile_images');

CREATE POLICY "Users can insert their own profile image"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile_images'
  AND (auth.uid() = CAST(SPLIT_PART(name, '/', 1) AS uuid))
);

CREATE POLICY "Users can update their own profile image"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile_images'
  AND (auth.uid() = CAST(SPLIT_PART(name, '/', 1) AS uuid))
);

CREATE POLICY "Users can delete their own profile image"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile_images'
  AND (auth.uid() = CAST(SPLIT_PART(name, '/', 1) AS uuid))
);
