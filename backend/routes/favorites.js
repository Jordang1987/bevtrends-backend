import { Router } from 'express';
const router = Router();

// userId -> { drinks:[], posts:[] }
const store = new Map();

router.get('/:userId', (req, res) => {
  const v = store.get(req.params.userId) || { drinks: [], posts: [] };
  res.json(v);
});

router.post('/:userId/toggle', (req, res) => {
  const { kind, id } = req.body || {};
  if (!['drink','post'].includes(kind) || !id) return res.status(400).json({ error: 'Invalid payload' });
  const cur = store.get(req.params.userId) || { drinks: [], posts: [] };
  const key = kind === 'drink' ? 'drinks' : 'posts';
  const set = new Set(cur[key]);
  set.has(id) ? set.delete(id) : set.add(id);
  cur[key] = [...set];
  store.set(req.params.userId, cur);
  res.json({ ok: true });
});

export default router;
