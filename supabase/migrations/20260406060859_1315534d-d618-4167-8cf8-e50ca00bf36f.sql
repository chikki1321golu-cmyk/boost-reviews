
-- Create storage bucket for business logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-logos', 'business-logos', true);

-- Public read access
CREATE POLICY "Business logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'business-logos');

-- Authenticated users can upload
CREATE POLICY "Users can upload business logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'business-logos' AND auth.role() = 'authenticated');

-- Users can update their own logos
CREATE POLICY "Users can update their own logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'business-logos' AND auth.role() = 'authenticated');

-- Users can delete their own logos
CREATE POLICY "Users can delete their own logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'business-logos' AND auth.role() = 'authenticated');
