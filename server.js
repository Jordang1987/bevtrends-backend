const express = require("express");
const cors = require("cors");
const postsRouter = require("./routes/posts");
const trendsRouter = require("./routes/trends");

const app = express();

// ✅ Enable CORS for all routes
app.use(cors({ origin: "*", methods: "GET,POST,PUT,DELETE,OPTIONS" }));
app.use(express.json());

// ✅ Mount routes
app.use("/posts", postsRouter);
app.use("/trends", trendsRouter);

app.get("/", (req, res) => {
  res.send("✅ BevTrends Backend is Running!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
