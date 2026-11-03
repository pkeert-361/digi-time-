const blogForm = document.getElementById("blogForm");
const titleInput = document.getElementById("title");
const categoryInput = document.getElementById("category");
const contentInput = document.getElementById("content");
const blogList = document.getElementById("blogList");
const searchInput = document.getElementById("searchInput");
const filterCategory = document.getElementById("filterCategory");
const formHeading = document.getElementById("formHeading");
const saveButton = document.getElementById("saveButton");
const cancelButton = document.getElementById("cancelButton");
const formMessage = document.getElementById("formMessage");
const blogCount = document.getElementById("blogCount");

let editingId = null;
let searchTimer;

async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Something went wrong.");
  return data;
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function formatDate(date) {
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric"
  });
}

async function loadBlogs() {
  const params = new URLSearchParams();
  if (searchInput.value.trim()) params.set("search", searchInput.value.trim());
  if (filterCategory.value) params.set("category", filterCategory.value);

  try {
    const blogs = await api(`/api/blogs?${params.toString()}`);
    blogCount.textContent = `${blogs.length} ${blogs.length === 1 ? "post" : "posts"}`;

    if (!blogs.length) {
      blogList.innerHTML = '<p class="empty">No blogs found. Create your first blog!</p>';
      return;
    }

    blogList.innerHTML = blogs.map(blog => `
      <article class="blog-card">
        <div class="blog-card-top">
          <span class="category">${escapeHTML(blog.category)}</span>
          <span class="blog-date">${formatDate(blog.createdAt)}</span>
        </div>
        <h3>${escapeHTML(blog.title)}</h3>
        <p>${escapeHTML(blog.content)}</p>
        <div class="card-actions">
          <button class="edit-btn" data-action="edit" data-id="${escapeHTML(blog.id)}">Edit</button>
          <button class="delete-btn" data-action="delete" data-id="${escapeHTML(blog.id)}">Delete</button>
        </div>
      </article>
    `).join("");
  } catch (error) {
    blogList.innerHTML = `<p class="empty">${escapeHTML(error.message)}</p>`;
  }
}

blogForm.addEventListener("submit", async event => {
  event.preventDefault();
  const blog = {
    title: titleInput.value.trim(),
    category: categoryInput.value,
    content: contentInput.value.trim()
  };

  try {
    if (editingId) {
      await api(`/api/blogs/${encodeURIComponent(editingId)}`, {
        method: "PUT", body: JSON.stringify(blog)
      });
      formMessage.textContent = "Blog updated successfully.";
    } else {
      await api("/api/blogs", { method: "POST", body: JSON.stringify(blog) });
      formMessage.textContent = "Blog published successfully.";
    }
    resetForm();
    await loadBlogs();
  } catch (error) {
    formMessage.textContent = error.message;
  }
});

blogList.addEventListener("click", async event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const { action, id } = button.dataset;
  try {
    if (action === "edit") {
      const blogs = await api("/api/blogs");
      const blog = blogs.find(item => item.id === id);
      if (!blog) return;
      editingId = blog.id;
      titleInput.value = blog.title;
      categoryInput.value = blog.category;
      contentInput.value = blog.content;
      formHeading.textContent = "Update your blog";
      saveButton.textContent = "Save changes";
      cancelButton.classList.remove("hidden");
      formMessage.textContent = "";
      titleInput.focus();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    if (action === "delete") {
      if (!confirm("Are you sure you want to delete this blog?")) return;
      await api(`/api/blogs/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (editingId === id) resetForm();
      await loadBlogs();
    }
  } catch (error) {
    alert(error.message);
  }
});

function resetForm() {
  blogForm.reset();
  editingId = null;
  formHeading.textContent = "Create a blog";
  saveButton.textContent = "Publish blog";
  cancelButton.classList.add("hidden");
}

cancelButton.addEventListener("click", resetForm);
searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadBlogs, 250);
});
filterCategory.addEventListener("change", loadBlogs);

loadBlogs();
