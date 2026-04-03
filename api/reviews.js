import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET /api/reviews?business_id=xxx&limit=20&offset=0
  if (req.method === 'GET') {
    const { business_id, limit = 20, offset = 0 } = req.query;

    let query = supabase
      .from('reviews')
      .select('id, author_name, rating, title, body, business_id, created_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (business_id) {
      query = query.eq('business_id', business_id);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('GET reviews error:', error);
      return res.status(500).json({ error: 'Failed to fetch reviews' });
    }

    return res.status(200).json({ reviews: data, total: count });
  }

  // POST /api/reviews  — submit a new review
  if (req.method === 'POST') {
    const { author_name, email, rating, title, body, business_id } = req.body;

    // Basic validation
    if (!author_name || !body || !rating) {
      return res.status(400).json({
        error: 'Missing required fields: author_name, body, rating',
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert([{ author_name, email, rating, title, body, business_id, status: 'pending' }])
      .select('id, author_name, rating, title, body, created_at')
      .single();

    if (error) {
      console.error('POST review error:', error);
      return res.status(500).json({ error: 'Failed to submit review' });
    }

    return res.status(201).json({
      message: 'Review submitted successfully. It will appear after approval.',
      review: data,
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
