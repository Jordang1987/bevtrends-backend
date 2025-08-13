import { Router } from 'express';
const router = Router();

// in-memory store for now
let posts = [];

router.get('/', (_req, res) => res.json(posts));

router.post('/', (req, res) => {
  const { userId, imageUrl, caption } = req.body || {};
  if (!userId || !imageUrl || !caption) return res.status(400).json({ error: 'Missing fields' });
  const doc = { id: String(Date.now()), userId, imageUrl, caption, likes: 0, comments: [], createdAt: Date.now() };
  posts.unshift(doc);
  res.status(201).json(doc);
});

router.patch('/:id/like', (req, res) => {
  const p = posts.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  p.likes++;
  res.json({ ok: true });
});

router.post('/:id/comment', (req, res) => {
  const p = posts.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  const { userId, text } = req.body || {};
  if (!userId || !text) return res.status(400).json({ error: 'Missing fields' });
  p.comments.push({ userId, text, ts: Date.now() });
  res.json({ ok: true });
});

export default router;
