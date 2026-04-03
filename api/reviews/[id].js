import { createClient } from '@supabase/supabase-js';

// Use service role key for admin operations (approve/reject)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Review ID is required' });
  }

  // GET /api/reviews/[id]
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('reviews')
      .select('id, author_name, rating, title, body, business_id, created_at')
      .eq('id', id)
      .eq('status', 'approved')
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Review not found' });
    }

    return res.status(200).json({ review: data });
  }

  // PATCH /api/reviews/[id] — approve or reject a review (admin)
  if (req.method === 'PATCH') {
    const { status } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Status must be: approved, rejected, or pending' });
    }

    const { data, error } = await supabase
      .from('reviews')
      .update({ status })
      .eq('id', id)
      .select('id, author_name, rating, status, updated_at')
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Review not found or update failed' });
    }

    return res.status(200).json({ message: `Review ${status}`, review: data });
  }

  // DELETE /api/reviews/[id]
  if (req.method === 'DELETE') {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: 'Failed to delete review' });
    }

    return res.status(200).json({ message: 'Review deleted' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
