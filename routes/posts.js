const express = require("express");
const router = express.Router();
const { admin, postsCollection } = require("../firebaseAdmin");
const { FieldValue } = require("firebase-admin/firestore");

// ✅ GET all posts
router.get("/", async (req, res) => {
  try {
    const snapshot = await postsCollection.orderBy("createdAt", "desc").get();
    const posts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(posts);
  } catch (error) {
    console.error("GET /posts error:", error);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

// ✅ GET a single post by ID
router.get("/:id", async (req, res) => {
  try {
    const doc = await postsCollection.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Post not found" });
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error("GET /posts/:id error:", error);
    res.status(500).json({ error: "Failed to get post" });
  }
});

// ✅ CREATE a new post
router.post("/", async (req, res) => {
  const { user, imageUrl, caption } = req.body;
  if (!user || !imageUrl || !caption) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const newPost = {
    user,
    imageUrl,
    caption,
    likes: 0,
    comments: [],
    favorited: false,
    createdAt: FieldValue.serverTimestamp(),
  };

  try {
    const docRef = await postsCollection.add(newPost);
    const savedPost = await docRef.get();
    res.status(201).json({ id: docRef.id, ...savedPost.data() });
  } catch (error) {
    console.error("POST / error:", error);
    res.status(500).json({ error: "Failed to create post" });
  }
});

// ✅ LIKE a post
router.post("/:id/like", async (req, res) => {
  try {
    const postRef = postsCollection.doc(req.params.id);
    await postRef.update({
      likes: FieldValue.increment(1),
    });
    const updated = await postRef.get();
    res.json({ id: updated.id, ...updated.data() });
  } catch (error) {
    console.error("POST /:id/like error:", error);
    res.status(500).json({ error: "Failed to like post" });
  }
});

// ✅ TOGGLE favorite
router.post("/:id/favorite", async (req, res) => {
  try {
    const postRef = postsCollection.doc(req.params.id);
    const doc = await postRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Post not found" });

    const current = doc.data().favorited || false;
    await postRef.update({ favorited: !current });

    const updated = await postRef.get();
    res.json({ id: updated.id, ...updated.data() });
  } catch (error) {
    console.error("POST /:id/favorite error:", error);
    res.status(500).json({ error: "Failed to toggle favorite" });
  }
});

// ✅ ADD a comment
router.post("/:id/comment", async (req, res) => {
  const { comment } = req.body;
  if (!comment) return res.status(400).json({ error: "Comment required" });

  try {
    const postRef = postsCollection.doc(req.params.id);
    await postRef.update({
      comments: FieldValue.arrayUnion(comment),
    });

    const updated = await postRef.get();
    res.json({ id: updated.id, ...updated.data() });
  } catch (error) {
    console.error("POST /:id/comment error:", error);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

module.exports = router;
