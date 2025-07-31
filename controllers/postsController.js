// controllers/postController.js

let likes = {};     // { postId: likeCount }
let comments = {};  // { postId: [ { user: 'Jordan', text: 'Nice drink!' }, ... ] }
let favorites = {}; // { userId: [postId, postId] }

exports.likePost = (req, res) => {
  const { postId } = req.params;
  likes[postId] = (likes[postId] || 0) + 1;
  res.json({ postId, likes: likes[postId] });
};

exports.getLikes = (req, res) => {
  const { postId } = req.params;
  res.json({ postId, likes: likes[postId] || 0 });
};

exports.addComment = (req, res) => {
  const { postId } = req.params;
  const { user, text } = req.body;
  if (!user || !text) return res.status(400).json({ error: 'Missing user or text' });

  if (!comments[postId]) comments[postId] = [];
  comments[postId].push({ user, text });
  res.json({ postId, comments: comments[postId] });
};

exports.getComments = (req, res) => {
  const { postId } = req.params;
  res.json({ postId, comments: comments[postId] || [] });
};

exports.favoritePost = (req, res) => {
  const { userId } = req.params;
  const { postId } = req.body;

  if (!favorites[userId]) favorites[userId] = [];
  if (!favorites[userId].includes(postId)) {
    favorites[userId].push(postId);
  }

  res.json({ userId, favorites: favorites[userId] });
};

exports.getFavorites = (req, res) => {
  const { userId } = req.params;
  res.json({ userId, favorites: favorites[userId] || [] });
};
