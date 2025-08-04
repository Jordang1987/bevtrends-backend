const express = require("express");
const cors = require("cors");
require("dotenv").config(); // ✅ Load environment variables

const postsRouter = require("./routes/posts");
const trendsRouter = require("./routes/trends");

const app = express();

// ✅ Middleware
app.use(cors({ origin: "*", methods: "GET,POST,PUT,DELETE,OPTIONS" }));
app.use(express.json());

// ✅ Routes
app.use("/posts", postsRouter);
app.use("/trends", trendsRouter);

// ✅ Health check route
app.get("/", (req, res) => {
  res.send("✅ BevTrends Backend is Running!");
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
