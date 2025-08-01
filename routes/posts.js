const express = require("express");
const router = express.Router();

// Temporary in-memory posts (replace with DB later)
let mockPosts = [
  {
    id: "1",
    user: "Jane Doe",
    imageUrl: "https://picsum.photos/id/237/400/300",
    caption: "Enjoying this beautiful cocktail at Velvet Lounge!",
    likes: 10,
    comments: ["Love this!", "Where is this place?"],
    favorited: false,
  },
  {
    id: "2",
    user: "John Smith",
    imageUrl: "https://picsum.photos/id/238/400/300",
    caption: "This IPA is unreal 🍺",
    likes: 7,
    comments: ["Need to try this!", "Looks great!"],
    favorited: true,
  },
  {
    id: "3",
    user: "Ava Rose",
    imageUrl: "https://picsum.photos/id/239/400/300",
    caption: "Non-alcoholic Negroni is a game changer!",
    likes: 4,
    comments: [],
    favorited: false,
  },
];

// ✅ GET all posts
router.get("/", (req, res) => {
  res.json(mockPosts);
});

// ✅ GET a single post by ID
router.get("/:id", (req, res) => {
  const post = mockPosts.find((p) => p.id === req.params.id);
  if (post) {
    res.json(post);
  } else {
    res.status(404).json({ error: "Post not found" });
  }
});

// ✅ CREATE a new post
router.post("/", (req, res) => {
  const { user, imageUrl, caption } = req.body;

  if (!user || !imageUrl || !caption) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const newPost = {
    id: (mockPosts.length + 1).toString(),
    user,
    imageUrl,
    caption,
    likes: 0,
    comments: [],
    favorited: false,
  };

  // Add new post to the beginning of the array
  mockPosts.unshift(newPost);
  res.status(201).json(newPost);
});

// ✅ LIKE a post
router.post("/:id/like", (req, res) => {
  const post = mockPosts.find((p) => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });

  post.likes += 1;
  res.json(post);
});

// ✅ ADD a comment
router.post("/:id/comment", (req, res) => {
  const post = mockPosts.find((p) => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });

  const { comment } = req.body;
  if (!comment) return res.status(400).json({ error: "Comment text required" });

  post.comments.push(comment);
  res.json(post);
});

// ✅ TOGGLE favorite
router.post("/:id/favorite", (req, res) => {
  const post = mockPosts.find((p) => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });

  post.favorited = !post.favorited;
  res.json(post);
});

module.exports = router;
