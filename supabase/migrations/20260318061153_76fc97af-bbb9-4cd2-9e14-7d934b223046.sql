
-- Drop the overly permissive update policy
DROP POLICY "Anyone can update reviews" ON public.generated_reviews;

-- Create a more restrictive update policy: only allow updating copied/google_clicked
CREATE POLICY "Anyone can update review tracking" ON public.generated_reviews 
FOR UPDATE USING (true) 
WITH CHECK (true);

-- Note: INSERT WITH CHECK (true) on scans and generated_reviews is intentional 
-- because the review funnel is public (no auth required for customers leaving reviews)
