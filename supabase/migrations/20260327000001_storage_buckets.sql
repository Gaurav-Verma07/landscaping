INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('attachments', 'attachments', true),
  ('documents', 'documents', true),
  ('team-logos', 'team-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "authenticated users can upload attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "authenticated users can read attachments"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "authenticated users can delete attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "authenticated users can upload documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "authenticated users can read documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "authenticated users can delete documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "authenticated users can upload team logos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'team-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "authenticated users can read team logos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'team-logos');
