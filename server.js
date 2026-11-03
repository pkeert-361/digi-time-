const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data", "blogs.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function readBlogs() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
      fs.writeFileSync(DATA_FILE, "[]", "utf8");
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch (error) {
    console.error("Could not read blog data:", error);
    return [];
  }
}

function saveBlogs(blogs) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(blogs, null, 2), "utf8");
}

// READ: get all blogs, with optional search and category filters
app.get("/api/blogs", (req, res) => {
  const search = String(req.query.search || "").toLowerCase();
  const category = String(req.query.category || "").toLowerCase();

  const blogs = readBlogs().filter(blog => {
    const matchesSearch =
      blog.title.toLowerCase().includes(search) ||
      blog.content.toLowerCase().includes(search);
    const matchesCategory =
      !category || blog.category.toLowerCase() === category;
    return matchesSearch && matchesCategory;
  });

  res.json(blogs);
});

// CREATE: add a blog
app.post("/api/blogs", (req, res) => {
  const { title, content, category } = req.body;
  if (!title || !content) {
    return res.status(400).json({ message: "Title and content are required." });
  }

  const blogs = readBlogs();
  const newBlog = {
    id: Date.now().toString(),
    title: String(title).trim(),
    content: String(content).trim(),
    category: String(category || "General").trim(),
    createdAt: new Date().toISOString()
  };

  blogs.unshift(newBlog);
  saveBlogs(blogs);
  res.status(201).json(newBlog);
});

// UPDATE: edit a blog by ID
app.put("/api/blogs/:id", (req, res) => {
  const { title, content, category } = req.body;
  if (!title || !content) {
    return res.status(400).json({ message: "Title and content are required." });
  }

  const blogs = readBlogs();
  const index = blogs.findIndex(blog => blog.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: "Blog not found." });
  }

  blogs[index] = {
    ...blogs[index],
    title: String(title).trim(),
    content: String(content).trim(),
    category: String(category || "General").trim(),
    updatedAt: new Date().toISOString()
  };

  saveBlogs(blogs);
  res.json(blogs[index]);
});

// DELETE: remove a blog by ID
app.delete("/api/blogs/:id", (req, res) => {
  const blogs = readBlogs();
  const updatedBlogs = blogs.filter(blog => blog.id !== req.params.id);

  if (updatedBlogs.length === blogs.length) {
    return res.status(404).json({ message: "Blog not found." });
  }

  saveBlogs(updatedBlogs);
  res.json({ message: "Blog deleted successfully." });
});

app.listen(PORT, () => {
  console.log(`Blog CRUD app is running at http://localhost:${PORT}`);
});
