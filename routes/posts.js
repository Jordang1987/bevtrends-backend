const express = require("express");
const router = express.Router();

// Mock posts data
const mockPosts = [
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

// (Optional) ✅ GET a single post by ID
router.get("/:id", (req, res) => {
  const post = mockPosts.find((p) => p.id === req.params.id);
  if (post) {
    res.json(post);
  } else {
    res.status(404).json({ error: "Post not found" });
  }
});

module.exports = router;
